'use client';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-secondary text-sm mb-8">Last updated: March 27, 2026</p>

      <div className="space-y-8 text-secondary leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">1. Information We Collect</h2>
          <p className="mb-3">We collect information you provide directly to us:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-primary">Account Information:</strong> Name, email, username, password</li>
            <li><strong className="text-primary">Profile Data:</strong> Avatar, display name, bio</li>
            <li><strong className="text-primary">Content:</strong> Videos, comments, likes, and other interactions</li>
            <li><strong className="text-primary">Device Data:</strong> IP address, browser type, operating system</li>
            <li><strong className="text-primary">Usage Data:</strong> Pages visited, videos watched, search queries</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Provide, maintain, and improve the Platform</li>
            <li>Personalize your content feed and recommendations</li>
            <li>Process your account registration and authentication</li>
            <li>Send you technical notices and support messages</li>
            <li>Monitor and analyze usage trends and preferences</li>
            <li>Detect, investigate, and prevent fraudulent activity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">3. Data Storage & Security</h2>
          <p>We store your data on secure servers and implement industry-standard security measures including encryption in transit (TLS) and at rest. Passwords are hashed using bcrypt. Access tokens use JWT with expiration.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">4. Data Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Service providers who assist in platform operations</li>
            <li>Legal authorities when required by law</li>
            <li>Business partners with your explicit consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">5. Cookies</h2>
          <p>We use essential cookies for authentication and preferences. We do not use third-party tracking cookies. You can manage cookie preferences in your browser settings.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">6. Your Rights</h2>
          <div className="bg-surface rounded-xl p-5 border border-border-light/10">
            <ul className="space-y-2">
              <li><strong className="text-primary">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-primary">Correction:</strong> Update incorrect or incomplete data</li>
              <li><strong className="text-primary">Deletion:</strong> Request deletion of your account and data</li>
              <li><strong className="text-primary">Export:</strong> Download your data in a portable format</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-primary">7. Contact</h2>
          <p>For privacy-related inquiries, contact us at <strong className="text-primary">privacy@streamsphere.arunai.pro</strong></p>
        </section>
      </div>
    </div>
  );
}
