import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://streamsphere.arunai.pro';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://streamsphere.arunai.pro/api';

async function fetchSitemapData(endpoint: string) {
  try {
    const res = await fetch(`${API_URL}/sitemap/${endpoint}`, {
      next: { revalidate: 3600 }, // revalidate every hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.videos || data.channels || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/trending`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/shorts`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/press`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/copyright`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/creator`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/advertise`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/developers`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/policy-safety`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/new-features`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // Fetch dynamic video pages
  const videos = await fetchSitemapData('videos');
  const videoPages: MetadataRoute.Sitemap = videos.map((video: any) => ({
    url: video.isShort
      ? `${SITE_URL}/shorts/${video.id}`
      : `${SITE_URL}/watch/${video.id}`,
    lastModified: new Date(video.updatedAt || video.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Fetch dynamic channel pages
  const channels = await fetchSitemapData('channels');
  const channelPages: MetadataRoute.Sitemap = channels.map((channel: any) => ({
    url: `${SITE_URL}/@${channel.username}`,
    lastModified: new Date(channel.updatedAt || channel.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...videoPages, ...channelPages];
}
