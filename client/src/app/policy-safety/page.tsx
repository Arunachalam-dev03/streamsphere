'use client';

export default function PolicySafetyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Policy & Safety</h1>
      <p className="text-secondary mb-8">Our commitment to creating a safe and respectful community.</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-3">Community Guidelines</h2>
          <p className="text-secondary leading-relaxed mb-4">
            StreamSphere is committed to maintaining a safe, respectful, and inclusive community. All users must follow these guidelines when using the Platform.
          </p>
          <div className="grid gap-3">
            {[
              { title: 'Respect Others', desc: 'No harassment, bullying, hate speech, or threats of any kind.', color: 'bg-green-500/20 text-green-400' },
              { title: 'Original Content', desc: 'Only upload content you own or have permission to share.', color: 'bg-blue-500/20 text-blue-400' },
              { title: 'No Harmful Content', desc: 'No dangerous challenges, self-harm promotion, or violence glorification.', color: 'bg-yellow-500/20 text-yellow-400' },
              { title: 'Protect Minors', desc: 'Content must be safe for all audiences or properly age-restricted.', color: 'bg-purple-500/20 text-purple-400' },
              { title: 'No Spam or Deception', desc: 'No misleading thumbnails, spam comments, or artificial engagement.', color: 'bg-orange-500/20 text-orange-400' },
              { title: 'No Illegal Activity', desc: 'No content promoting illegal activities, drugs, or weapons.', color: 'bg-red-500/20 text-red-400' },
            ].map((item) => (
              <div key={item.title} className="bg-surface rounded-xl p-5 border border-border-light/10 flex items-start gap-4">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.color} shrink-0 mt-0.5`}>!</span>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-secondary">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Enforcement</h2>
          <div className="bg-surface rounded-xl p-6 border border-border-light/10">
            <p className="text-secondary leading-relaxed mb-3">When content or behavior violates our guidelines, we take the following actions:</p>
            <ol className="list-decimal list-inside space-y-2 text-secondary">
              <li><strong className="text-primary">Warning:</strong> First-time violations typically result in a warning</li>
              <li><strong className="text-primary">Content Removal:</strong> Violating content is removed from the platform</li>
              <li><strong className="text-primary">Temporary Suspension:</strong> Repeat violations may lead to account suspension</li>
              <li><strong className="text-primary">Permanent Ban:</strong> Severe or repeated violations result in permanent removal</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Reporting</h2>
          <p className="text-secondary leading-relaxed">
            If you encounter content that violates our guidelines, please report it using the report button on any video or comment. Our moderation team reviews all reports and takes action within 24 hours.
          </p>
        </section>
      </div>
    </div>
  );
}
