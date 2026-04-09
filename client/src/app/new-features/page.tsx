'use client';

export default function NewFeaturesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Test New Features</h1>
      <p className="text-secondary mb-8">Get early access to upcoming StreamSphere features and help shape the future of the platform.</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">What's New</h2>
          <div className="space-y-4">
            {[
              { status: 'Live', color: 'bg-green-500', title: 'YouTube-Style Player Controls', desc: 'Flat bottom bar with red progress scrubber, volume slider, quality selector, theater mode, and keyboard shortcuts.', date: 'March 2026' },
              { status: 'Live', color: 'bg-green-500', title: 'Shorts Player', desc: 'Full-screen vertical scrolling shorts player with swipe navigation, like, comment, and share actions.', date: 'March 2026' },
              { status: 'Live', color: 'bg-green-500', title: 'Dark Mode Sidebar', desc: 'YouTube-style dark sidebar with You, Explore sections and footer links.', date: 'March 2026' },
              { status: 'Beta', color: 'bg-yellow-500', title: 'Picture-in-Picture', desc: 'Continue watching videos in a floating mini player while browsing other content.', date: 'Coming soon' },
              { status: 'Planned', color: 'bg-blue-500', title: 'Live Streaming', desc: 'Stream live to your audience with real-time chat and super chat support.', date: 'Q2 2026' },
              { status: 'Planned', color: 'bg-blue-500', title: 'Channel Memberships', desc: 'Offer exclusive content and perks to your most dedicated subscribers.', date: 'Q3 2026' },
            ].map((item) => (
              <div key={item.title} className="bg-surface rounded-xl p-5 border border-border-light/10 flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${item.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Live' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'Beta' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{item.status}</span>
                  </div>
                  <p className="text-sm text-secondary">{item.desc}</p>
                  <p className="text-xs text-secondary/50 mt-1">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Join the Beta Program</h2>
          <div className="bg-surface rounded-xl p-6 border border-border-light/10">
            <p className="text-secondary leading-relaxed mb-4">
              Want early access to new features? Join our beta program to test upcoming features before they launch. Beta testers get:
            </p>
            <ul className="space-y-2 text-secondary mb-4">
              <li className="flex items-center gap-2"><span className="text-accent-red">✦</span> Early access to new features</li>
              <li className="flex items-center gap-2"><span className="text-accent-red">✦</span> Direct feedback channel to the dev team</li>
              <li className="flex items-center gap-2"><span className="text-accent-red">✦</span> Beta tester badge on your profile</li>
              <li className="flex items-center gap-2"><span className="text-accent-red">✦</span> Community of passionate StreamSphere users</li>
            </ul>
            <p className="text-sm text-secondary">
              Interested? Contact us at <strong className="text-primary">beta@streamsphere.arunai.pro</strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
