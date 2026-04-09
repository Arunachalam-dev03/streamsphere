'use client';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-secondary text-sm mb-8">Last updated: March 27, 2026</p>

      <div className="space-y-8 text-secondary leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">1. Acceptance of Terms</h2>
          <p>By accessing or using StreamSphere ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">2. Account Registration</h2>
          <p>To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">3. User Content</h2>
          <p className="mb-2">You retain ownership of content you upload to StreamSphere. By uploading content, you grant us a non-exclusive, worldwide, royalty-free license to host, store, display, reproduce, and distribute your content on the Platform.</p>
          <p>You are solely responsible for the content you upload and must ensure it does not violate any laws or third-party rights.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">4. Prohibited Conduct</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Upload copyrighted content without authorization</li>
            <li>Post harmful, abusive, or misleading content</li>
            <li>Attempt to hack, exploit, or disrupt the Platform</li>
            <li>Use automated tools to scrape or access the Platform</li>
            <li>Impersonate other users or entities</li>
            <li>Violate any applicable local, state, or international law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">5. Termination</h2>
          <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason at our discretion. You may delete your account at any time through your account settings.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">6. Limitation of Liability</h2>
          <p>StreamSphere is provided "as is" without any warranties. We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">7. Changes to Terms</h2>
          <p>We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new Terms. We will notify users of significant changes via email or on-platform notifications.</p>
        </section>
      </div>
    </div>
  );
}
