'use client';

export default function PressPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Press</h1>

      <section className="mb-8">
        <p className="text-secondary leading-relaxed mb-6">
          For media inquiries, interview requests, and press resources, please contact our communications team. We're happy to provide information about StreamSphere, our mission, and our impact on the creator economy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Press Contact</h2>
        <div className="bg-surface rounded-xl p-6 border border-border-light/10">
          <p className="text-secondary">
            <strong className="text-primary">Email:</strong> press@streamsphere.arunai.pro
          </p>
          <p className="text-secondary mt-2">
            <strong className="text-primary">Response Time:</strong> We aim to respond to all press inquiries within 48 hours.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Brand Assets</h2>
        <p className="text-secondary leading-relaxed mb-4">
          Download official StreamSphere logos, brand guidelines, and media assets for use in articles and publications.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { name: 'Logo (SVG)', desc: 'Official StreamSphere logo in vector format' },
            { name: 'Brand Colors', desc: 'Primary: #EF4444 (Red), Dark: #0F0F0F' },
            { name: 'Press Kit', desc: 'Complete media kit with logos, screenshots, and bios' },
            { name: 'Platform Stats', desc: 'Latest platform statistics and growth metrics' },
          ].map((item) => (
            <div key={item.name} className="bg-surface rounded-xl p-5 border border-border-light/10">
              <h3 className="font-semibold mb-1">{item.name}</h3>
              <p className="text-sm text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Recent News</h2>
        <div className="space-y-4">
          {[
            { date: 'March 2026', title: 'StreamSphere Launches Next-Gen Video Platform', desc: 'Introducing adaptive 4K streaming, Shorts, and a powerful Creator Studio.' },
            { date: 'March 2026', title: 'StreamSphere Partners with Creators Worldwide', desc: 'Empowering content creators with cutting-edge tools and monetization.' },
          ].map((item) => (
            <div key={item.title} className="bg-surface rounded-xl p-5 border border-border-light/10">
              <span className="text-xs text-secondary">{item.date}</span>
              <h3 className="font-semibold mt-1 mb-1">{item.title}</h3>
              <p className="text-sm text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
