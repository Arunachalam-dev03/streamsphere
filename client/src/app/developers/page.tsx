'use client';

export default function DevelopersPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Developers</h1>
      <p className="text-secondary mb-8">Build with the StreamSphere API and extend the platform's capabilities.</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">API Overview</h2>
          <p className="text-secondary leading-relaxed mb-4">
            The StreamSphere API provides programmatic access to video data, user profiles, channels, and more. Use our REST API to build applications, integrations, and tools that interact with StreamSphere.
          </p>
          <div className="bg-[#1a1a2e] rounded-xl p-5 font-mono text-sm border border-border-light/10">
            <p className="text-green-400 mb-1"># Base URL</p>
            <p className="text-white">https://streamsphere.arunai.pro/api/v1</p>
            <p className="text-green-400 mt-4 mb-1"># Example: Get trending videos</p>
            <p className="text-white">GET /videos/trending?page=1&limit=20</p>
            <p className="text-green-400 mt-4 mb-1"># Authentication</p>
            <p className="text-white">Authorization: Bearer {'<'}your_access_token{'>'}</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Available Endpoints</h2>
          <div className="grid gap-3">
            {[
              { method: 'GET', path: '/videos/feed', desc: 'Get the video feed' },
              { method: 'GET', path: '/videos/trending', desc: 'Get trending videos' },
              { method: 'GET', path: '/videos/shorts', desc: 'Get short-form videos' },
              { method: 'GET', path: '/videos/search', desc: 'Search for videos' },
              { method: 'GET', path: '/videos/:id', desc: 'Get video details' },
              { method: 'POST', path: '/auth/login', desc: 'Authenticate user' },
              { method: 'POST', path: '/auth/register', desc: 'Register new user' },
            ].map((item) => (
              <div key={item.path} className="bg-surface rounded-lg p-4 border border-border-light/10 flex items-center gap-4">
                <span className={`text-xs font-bold px-2 py-1 rounded ${item.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {item.method}
                </span>
                <code className="text-sm font-mono flex-1">{item.path}</code>
                <span className="text-sm text-secondary hidden sm:block">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Rate Limits</h2>
          <div className="bg-surface rounded-xl p-6 border border-border-light/10">
            <ul className="space-y-2 text-secondary">
              <li><strong className="text-primary">Unauthenticated:</strong> 100 requests per hour</li>
              <li><strong className="text-primary">Authenticated:</strong> 1,000 requests per hour</li>
              <li><strong className="text-primary">Upload:</strong> 10 uploads per hour per user</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {['Next.js', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'MinIO', 'FFmpeg', 'HLS', 'Docker', 'Nginx'].map((t) => (
              <span key={t} className="bg-surface text-sm px-3 py-1.5 rounded-full border border-border-light/10">{t}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
