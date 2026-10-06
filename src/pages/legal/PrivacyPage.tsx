import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-text mb-10">Last updated: October 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-text-primary">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-gray-text leading-relaxed">
              We collect information you provide directly (name, email, business details), information generated
              through platform use (transaction history, messages, preferences), and technical data (IP address,
              browser type, device identifiers).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-text leading-relaxed">
              We use your data to operate and improve BROKER HUB, match you with relevant brokers, send
              transactional communications, comply with legal obligations, and prevent fraud and abuse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Data Sharing</h2>
            <p className="text-gray-text leading-relaxed">
              We do not sell your personal data. We may share data with brokers you engage with, service providers
              who assist our operations, and authorities when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
            <p className="text-gray-text leading-relaxed">
              We retain your data for as long as your account is active or as required for legal and business
              purposes. You may request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
            <p className="text-gray-text leading-relaxed">
              You have the right to access, correct, or delete your personal data. You may also object to or
              restrict certain processing. To exercise your rights, contact us at{' '}
              <a href="mailto:privacy@mystrio.com" className="text-primary hover:underline">privacy@mystrio.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Security</h2>
            <p className="text-gray-text leading-relaxed">
              We implement industry-standard security measures including encryption, access controls, and regular
              audits to protect your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
            <p className="text-gray-text leading-relaxed">
              For privacy-related inquiries, contact our Data Protection Officer at{' '}
              <a href="mailto:privacy@mystrio.com" className="text-primary hover:underline">privacy@mystrio.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};
