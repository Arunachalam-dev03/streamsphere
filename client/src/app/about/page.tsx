'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">About StreamSphere</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
          <p className="text-secondary leading-relaxed">
            StreamSphere is a next-generation video streaming platform built to empower creators and connect communities through the power of video. We believe that everyone has a story to tell, and our mission is to provide the tools and platform to share those stories with the world.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">What We Offer</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: 'Video Streaming', desc: 'Watch and share videos in up to 4K quality with adaptive bitrate streaming.' },
              { title: 'Shorts', desc: 'Create and discover short-form vertical videos up to 60 seconds.' },
              { title: 'Creator Studio', desc: 'Powerful analytics and management tools for content creators.' },
              { title: 'Community', desc: 'Engage with creators through comments, likes, and subscriptions.' },
            ].map((item) => (
              <div key={item.title} className="bg-surface rounded-xl p-5 border border-border-light/10">
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Our Team</h2>
          <p className="text-secondary leading-relaxed">
            StreamSphere is developed and maintained by a passionate team of engineers, designers, and content strategists dedicated to building the best possible video experience. Our team is committed to innovation, quality, and user satisfaction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="text-secondary leading-relaxed">
            Have questions or feedback? Visit our <Link href="/contact" className="text-accent-red hover:underline">Contact page</Link> to get in touch with us.
          </p>
        </section>
      </div>
    </div>
  );
}
