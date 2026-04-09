'use client';

import Link from 'next/link';

export default function CreatorPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">StreamSphere for Creators</h1>
      <p className="text-secondary mb-8">Everything you need to grow your channel and reach your audience.</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Creator Tools</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: 'Creator Studio', desc: 'Access analytics, manage videos, track performance, and customize your channel — all in one dashboard.', icon: '📊' },
              { title: 'Video Upload', desc: 'Upload videos in any format. We handle transcoding to multiple qualities including 4K with HLS adaptive streaming.', icon: '📹' },
              { title: 'Shorts', desc: 'Create vertical short-form videos up to 60 seconds to reach new audiences and grow your community.', icon: '⚡' },
              { title: 'Analytics', desc: 'Deep insights into your audience, watch time, engagement rates, and subscriber growth trends.', icon: '📈' },
            ].map((item) => (
              <div key={item.title} className="bg-surface rounded-xl p-5 border border-border-light/10">
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
          <div className="bg-surface rounded-xl p-6 border border-border-light/10">
            <ol className="list-decimal list-inside space-y-3 text-secondary">
              <li><strong className="text-primary">Create an account</strong> — Sign up for free on StreamSphere</li>
              <li><strong className="text-primary">Set up your channel</strong> — Customize your profile, avatar, and channel description</li>
              <li><strong className="text-primary">Upload your first video</strong> — Go to Creator Studio → Upload Video</li>
              <li><strong className="text-primary">Share & grow</strong> — Share your content and engage with your audience</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Creator Guidelines</h2>
          <p className="text-secondary leading-relaxed">
            We encourage creativity and free expression on StreamSphere. Please ensure your content follows our community guidelines and respects copyright laws. For more details, see our <Link href="/policy-safety" className="text-accent-red hover:underline">Policy & Safety</Link> page.
          </p>
        </section>
      </div>
    </div>
  );
}
