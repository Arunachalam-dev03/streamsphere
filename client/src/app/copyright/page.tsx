'use client';

export default function CopyrightPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Copyright</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-3">Copyright Policy</h2>
          <p className="text-secondary leading-relaxed">
            StreamSphere respects the intellectual property rights of others and expects users of the platform to do the same. We comply with applicable copyright laws, including the Digital Millennium Copyright Act (DMCA).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Content Ownership</h2>
          <p className="text-secondary leading-relaxed">
            When you upload content to StreamSphere, you retain ownership of your original content. By uploading, you grant StreamSphere a non-exclusive license to host, display, and distribute your content on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Reporting Copyright Infringement</h2>
          <p className="text-secondary leading-relaxed mb-4">
            If you believe your copyrighted work has been used on StreamSphere without authorization, you may submit a DMCA takedown notice. Your notice should include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-secondary">
            <li>Identification of the copyrighted work</li>
            <li>Identification of the infringing material with URL</li>
            <li>Your contact information (name, address, email, phone)</li>
            <li>A statement of good faith belief</li>
            <li>A statement of accuracy under penalty of perjury</li>
            <li>Your physical or electronic signature</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Counter-Notification</h2>
          <p className="text-secondary leading-relaxed">
            If you believe your content was removed by mistake or misidentification, you may submit a counter-notification to copyright@streamsphere.arunai.pro with the required information as specified by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Repeat Infringers</h2>
          <p className="text-secondary leading-relaxed">
            StreamSphere maintains a policy of terminating accounts of users who are repeat infringers of copyright. We employ a three-strike system for copyright violations.
          </p>
        </section>

        <div className="bg-surface rounded-xl p-6 border border-border-light/10">
          <p className="text-sm text-secondary">
            <strong className="text-primary">Copyright Agent Contact:</strong><br />
            copyright@streamsphere.arunai.pro
          </p>
        </div>
      </div>
    </div>
  );
}
