import { env } from '../config/env';
import redis from '../config/redis';

/**
 * SEO Service — Notifies search engines when new content is published.
 * 
 * Supports:
 * - IndexNow (Bing, Yandex, Seznam, Naver) — instant URL submission
 * - Google Ping — sitemap change notification
 * - Bing Ping — sitemap change notification
 * - Redis cache invalidation for sitemap
 */
export class SEOService {
  private static readonly SITE_URL = env.SITE_URL;
  private static readonly INDEXNOW_KEY = env.INDEXNOW_KEY;
  private static readonly SITEMAP_URL = `${env.SITE_URL}/sitemap.xml`;

  /**
   * Called after a video finishes processing and becomes READY,
   * or when a video's privacy changes to PUBLIC.
   */
  static async notifySearchEngines(videoId: string, isShort: boolean = false): Promise<void> {
    const videoPath = isShort ? `/shorts/${videoId}` : `/watch/${videoId}`;
    const videoUrl = `${this.SITE_URL}${videoPath}`;

    console.log(`🔍 SEO: Notifying search engines about ${videoUrl}`);

    // Invalidate sitemap cache so next crawl gets fresh data
    await this.invalidateSitemapCache();

    // Run all notifications in parallel, don't block on failures
    await Promise.allSettled([
      this.submitToIndexNow(videoUrl),
      this.pingGoogle(),
      this.pingBing(),
    ]);

    console.log(`✅ SEO: Notification complete for ${videoUrl}`);
  }

  /**
   * IndexNow — Instant URL submission to Bing, Yandex, Seznam, Naver
   * https://www.indexnow.org/documentation
   */
  private static async submitToIndexNow(url: string): Promise<void> {
    if (!this.INDEXNOW_KEY) {
      console.log('⚠️ SEO: IndexNow key not configured, skipping');
      return;
    }

    const indexNowEndpoints = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
      'https://yandex.com/indexnow',
    ];

    const payload = {
      host: new URL(this.SITE_URL).hostname,
      key: this.INDEXNOW_KEY,
      keyLocation: `${this.SITE_URL}/${this.INDEXNOW_KEY}.txt`,
      urlList: [url],
    };

    for (const endpoint of indexNowEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (response.ok || response.status === 200 || response.status === 202) {
          console.log(`✅ SEO: IndexNow submitted to ${endpoint} (${response.status})`);
        } else {
          console.warn(`⚠️ SEO: IndexNow ${endpoint} returned ${response.status}`);
        }
      } catch (error: any) {
        console.warn(`⚠️ SEO: IndexNow ${endpoint} failed:`, error.message);
      }
    }
  }

  /**
   * Ping Google to re-crawl the sitemap
   */
  private static async pingGoogle(): Promise<void> {
    try {
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(this.SITEMAP_URL)}`;
      const response = await fetch(pingUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        console.log('✅ SEO: Google sitemap ping successful');
      } else {
        console.warn(`⚠️ SEO: Google ping returned ${response.status}`);
      }
    } catch (error: any) {
      console.warn('⚠️ SEO: Google ping failed:', error.message);
    }
  }

  /**
   * Ping Bing to re-crawl the sitemap  
   */
  private static async pingBing(): Promise<void> {
    try {
      const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(this.SITEMAP_URL)}`;
      const response = await fetch(pingUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        console.log('✅ SEO: Bing sitemap ping successful');
      } else {
        console.warn(`⚠️ SEO: Bing ping returned ${response.status}`);
      }
    } catch (error: any) {
      console.warn('⚠️ SEO: Bing ping failed:', error.message);
    }
  }

  /**
   * Invalidate the sitemap Redis cache so it regenerates with the new video
   */
  private static async invalidateSitemapCache(): Promise<void> {
    try {
      await redis.del('sitemap:videos').catch(() => {});
      await redis.del('sitemap:channels').catch(() => {});
      console.log('✅ SEO: Sitemap cache invalidated');
    } catch (error: any) {
      console.warn('⚠️ SEO: Cache invalidation failed:', error.message);
    }
  }

  /**
   * Notify about multiple URLs at once (e.g., batch import)
   */
  static async notifyBatch(urls: string[]): Promise<void> {
    if (!this.INDEXNOW_KEY || urls.length === 0) return;

    await this.invalidateSitemapCache();

    const payload = {
      host: new URL(this.SITE_URL).hostname,
      key: this.INDEXNOW_KEY,
      keyLocation: `${this.SITE_URL}/${this.INDEXNOW_KEY}.txt`,
      urlList: urls,
    };

    try {
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      console.log(`✅ SEO: IndexNow batch submitted (${response.status}), ${urls.length} URLs`);
    } catch (error: any) {
      console.warn('⚠️ SEO: IndexNow batch failed:', error.message);
    }

    await Promise.allSettled([this.pingGoogle(), this.pingBing()]);
  }
}
