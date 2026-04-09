'use client';

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">How StreamSphere Works</h1>
      <p className="text-secondary mb-10">A behind-the-scenes look at our video platform technology.</p>

      <div className="space-y-12">
        {/* Process Steps */}
        {[
          {
            step: '01',
            title: 'Upload',
            desc: 'Upload your video in any format (MP4, MOV, AVI, MKV, WebM). Our system accepts files up to 10GB and supports resolutions from 360p to 4K.',
            details: 'Videos are securely stored in MinIO object storage with redundancy.'
          },
          {
            step: '02',
            title: 'Transcode',
            desc: 'Once uploaded, FFmpeg automatically transcodes your video into multiple quality levels (360p, 480p, 720p, 1080p, 4K) with HLS adaptive streaming.',
            details: 'Thumbnails are auto-generated. Processing typically takes 1-5 minutes depending on video length.'
          },
          {
            step: '03',
            title: 'Deliver',
            desc: 'Videos are served via HLS (HTTP Live Streaming) which automatically adjusts quality based on the viewer\'s internet speed for a buffer-free experience.',
            details: 'Our Nginx reverse proxy handles caching and efficient content delivery.'
          },
          {
            step: '04',
            title: 'Discover',
            desc: 'Your video appears in the feed, search results, and trending sections. Our recommendation algorithm surfaces content based on engagement, recency, and relevance.',
            details: 'Shorts (≤60s) appear in the dedicated vertical Shorts player.'
          },
          {
            step: '05',
            title: 'Engage',
            desc: 'Viewers can like, comment, share, and subscribe. Creators can track all engagement through the Creator Studio analytics dashboard.',
            details: 'Real-time view counts and engagement metrics help creators understand their audience.'
          },
        ].map((item) => (
          <div key={item.step} className="flex gap-6">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-accent-red/10 flex items-center justify-center">
              <span className="text-accent-red font-bold text-lg">{item.step}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <p className="text-secondary leading-relaxed mb-2">{item.desc}</p>
              <p className="text-sm text-secondary/70 italic">{item.details}</p>
            </div>
          </div>
        ))}

        <section>
          <h2 className="text-xl font-semibold mb-4">Tech Stack</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { name: 'Frontend', tech: 'Next.js 14 (App Router), Tailwind CSS, Zustand' },
              { name: 'Backend', tech: 'Node.js, Express, Prisma ORM' },
              { name: 'Database', tech: 'PostgreSQL with full-text search' },
              { name: 'Storage', tech: 'MinIO (S3-compatible object storage)' },
              { name: 'Video', tech: 'FFmpeg transcoding, HLS adaptive streaming' },
              { name: 'Infrastructure', tech: 'Docker, Nginx, PM2' },
            ].map((item) => (
              <div key={item.name} className="bg-surface rounded-xl p-5 border border-border-light/10">
                <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                <p className="text-sm text-secondary">{item.tech}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
