import React, { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Sparkles, Mail, MessageSquare, Send, CheckCircle2, ExternalLink } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'BROKER HUB Product Support',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Open default mail client pre-filled with mystrio305@gmail.com
    const mailtoSubject = encodeURIComponent(`[MYSTRIO - ${formData.subject}] from ${formData.name}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nTopic: ${formData.subject}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:mystrio305@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: 'BROKER HUB Product Support', message: '' });
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={16} />
            <span>Contact MYSTRIO</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Get in Touch with <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">MYSTRIO</span>
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed font-normal">
            Have questions about BROKER HUB, GROOMER, or technical partnerships? Send us an email directly to{' '}
            <a href="mailto:mystrio305@gmail.com" className="text-teal-400 font-semibold underline underline-offset-4 hover:text-teal-300">
              mystrio305@gmail.com
            </a>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Card */}
          <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl space-y-6">
            <h3 className="text-xl font-bold text-white">Direct Communication</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              MYSTRIO builds products that serve everyday business workflows. Reach out directly for support, product inquiries, or platform feedback.
            </p>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Official Email</p>
                  <a
                    href="mailto:mystrio305@gmail.com"
                    className="text-sm font-semibold text-teal-400 hover:underline truncate block"
                  >
                    mystrio305@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Product Line</p>
                  <p className="text-sm font-semibold text-white">BROKER HUB & GROOMER Initiatives</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="mailto:mystrio305@gmail.com"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Mail size={16} />
                <span>Open Default Mail App</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-8 rounded-3xl">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-teal-400 mx-auto animate-bounce" />
                <h3 className="text-2xl font-bold text-white">Opening Email App to Send...</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Your message has been formatted for <strong className="text-white">mystrio305@gmail.com</strong>.
                </p>
                <div className="pt-4">
                  <a
                    href={`mailto:mystrio305@gmail.com?subject=${encodeURIComponent('[MYSTRIO Inquiry]')}&body=${encodeURIComponent(formData.message)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-teal-400 transition-colors"
                  >
                    Click to Send Email Directly to mystrio305@gmail.com
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Inquiry Topic</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    <option>BROKER HUB Product Support</option>
                    <option>GROOMER Platform Inquiry</option>
                    <option>Partnerships & Technology</option>
                    <option>General Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Your Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can MYSTRIO help you?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <Button type="submit" variant="primary" size="lg" className="gap-2">
                  <Send size={18} />
                  Send Message to mystrio305@gmail.com
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
