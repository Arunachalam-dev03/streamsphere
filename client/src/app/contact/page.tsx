'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Message sent! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setSending(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Contact Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="input-field"
                placeholder="What's this about?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="input-field min-h-[160px] resize-none"
                placeholder="Tell us more..."
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="btn-primary disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="lg:col-span-2 space-y-4">
          {[
            { label: 'General Inquiries', value: 'hello@streamsphere.arunai.pro' },
            { label: 'Press & Media', value: 'press@streamsphere.arunai.pro' },
            { label: 'Copyright Issues', value: 'copyright@streamsphere.arunai.pro' },
            { label: 'Creator Support', value: 'creators@streamsphere.arunai.pro' },
          ].map((item) => (
            <div key={item.label} className="bg-surface rounded-xl p-5 border border-border-light/10">
              <h3 className="font-semibold text-sm mb-1">{item.label}</h3>
              <p className="text-sm text-secondary">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
