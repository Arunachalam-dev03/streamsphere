'use client';

import Link from 'next/link';

export default function AdvertisePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Advertise on StreamSphere</h1>
      <p className="text-secondary mb-8">Reach engaged audiences through video advertising on our growing platform.</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Ad Formats</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: 'Pre-Roll Ads', desc: 'Short video ads that play before the main content. Skippable or non-skippable options available.', icon: '▶️' },
              { title: 'Display Ads', desc: 'Banner and overlay ads displayed alongside video content for maximum visibility.', icon: '🖼️' },
              { title: 'Sponsored Shorts', desc: 'Promote your brand through short-form vertical video content in the Shorts feed.', icon: '📱' },
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
          <h2 className="text-xl font-semibold mb-3">Why StreamSphere?</h2>
          <div className="bg-surface rounded-xl p-6 border border-border-light/10">
            <ul className="space-y-3 text-secondary">
              <li className="flex items-start gap-3"><span className="text-accent-red font-bold">✓</span> Engaged and growing user base</li>
              <li className="flex items-start gap-3"><span className="text-accent-red font-bold">✓</span> Precise audience targeting by interest and demographics</li>
              <li className="flex items-start gap-3"><span className="text-accent-red font-bold">✓</span> Real-time analytics and campaign performance tracking</li>
              <li className="flex items-start gap-3"><span className="text-accent-red font-bold">✓</span> Flexible budgets — start with any amount</li>
              <li className="flex items-start gap-3"><span className="text-accent-red font-bold">✓</span> Brand-safe content environment</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Get Started</h2>
          <p className="text-secondary leading-relaxed">
            Interested in advertising on StreamSphere? <Link href="/contact" className="text-accent-red hover:underline">Contact our advertising team</Link> to discuss campaign options, pricing, and how we can help you reach your target audience.
          </p>
        </section>
      </div>
    </div>
  );
}
