import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://streamsphere.arunai.pro';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://streamsphere.arunai.pro/api';

/**
 * Convert seconds to ISO 8601 duration (e.g., 205 → "PT3M25S")
 */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  let duration = 'PT';
  if (h > 0) duration += `${h}H`;
  if (m > 0) duration += `${m}M`;
  duration += `${s}S`;
  return duration;
}

async function getVideo(id: string) {
  try {
    const res = await fetch(`${API_URL}/videos/${id}`, {
      next: { revalidate: 60 }, // revalidate every minute
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const video = await getVideo(params.id);

  if (!video) {
    return {
      title: 'Video Not Found',
      description: 'This video might have been removed or is unavailable.',
    };
  }

  const title = video.title || 'Untitled Video';
  const description =
    video.description?.slice(0, 160) ||
    `Watch "${title}" on StreamSphere. Uploaded by ${video.user?.displayName || 'a creator'}.`;
  const thumbnailUrl = video.thumbnailUrl || `${SITE_URL}/favicon.svg`;
  const videoUrl = `${SITE_URL}/watch/${params.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: videoUrl,
      siteName: 'StreamSphere',
      type: 'video.other',
      videos: video.hlsUrl
        ? [
            {
              url: video.hlsUrl,
              width: video.width || 1920,
              height: video.height || 1080,
              type: 'application/x-mpegURL',
            },
          ]
        : undefined,
      images: [
        {
          url: thumbnailUrl,
          width: 1280,
          height: 720,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [thumbnailUrl],
    },
    alternates: {
      canonical: videoUrl,
    },
  };
}

export default async function WatchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const video = await getVideo(params.id);

  const jsonLd = video
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.title || 'Untitled Video',
        description:
          video.description?.slice(0, 500) ||
          `Watch "${video.title}" on StreamSphere.`,
        thumbnailUrl: video.thumbnailUrl || `${SITE_URL}/favicon.svg`,
        uploadDate: video.createdAt,
        duration: video.duration ? formatDuration(video.duration) : undefined,
        contentUrl: video.hlsUrl || undefined,
        embedUrl: `${SITE_URL}/watch/${params.id}`,
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: { '@type': 'WatchAction' },
          userInteractionCount: video.views || 0,
        },
        author: video.user
          ? {
              '@type': 'Person',
              name: video.user.displayName || video.user.username,
              url: `${SITE_URL}/@${video.user.username}`,
            }
          : undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
