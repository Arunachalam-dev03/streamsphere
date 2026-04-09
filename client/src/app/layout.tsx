import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'StreamSphere — Watch, Upload & Share Videos',
    template: '%s | StreamSphere',
  },
  description:
    'StreamSphere is a modern video streaming platform where you can watch, upload, and share videos with the world. Enjoy trending content, shorts, playlists, and more.',
  keywords: [
    'video', 'streaming', 'watch', 'upload', 'share', 'shorts',
    'playlists', 'trending', 'live', 'creators', 'StreamSphere',
  ],
  authors: [{ name: 'StreamSphere Team' }],
  creator: 'StreamSphere',
  publisher: 'StreamSphere',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://streamsphere.arunai.pro',
    siteName: 'StreamSphere',
    title: 'StreamSphere — Watch, Upload & Share Videos',
    description:
      'StreamSphere is a modern video streaming platform. Watch trending videos, shorts, and discover creators.',
    images: [
      {
        url: '/favicon.svg',
        width: 512,
        height: 512,
        alt: 'StreamSphere Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamSphere — Watch, Upload & Share Videos',
    description:
      'StreamSphere is a modern video streaming platform. Watch trending videos, shorts, and discover creators.',
    images: ['/favicon.svg'],
    creator: '@streamsphere',
  },
  alternates: {
    canonical: 'https://streamsphere.arunai.pro',
  },
  category: 'entertainment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'StreamSphere',
              url: 'https://streamsphere.arunai.pro',
              description:
                'A modern video streaming platform where you can watch, upload, and share videos.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate:
                    'https://streamsphere.arunai.pro/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="bg-page text-primary font-sans antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
