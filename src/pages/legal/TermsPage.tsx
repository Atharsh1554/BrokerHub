import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-text mb-10">Last updated: October 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-text-primary">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-text leading-relaxed">
              By accessing or using BROKER HUB, a product of MYSTRIO, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Use of the Platform</h2>
            <p className="text-gray-text leading-relaxed">
              BROKER HUB provides a marketplace connecting verified brokers with businesses. You agree to use the
              platform only for lawful purposes and in compliance with all applicable regulations. You must not
              misrepresent your identity, business, or credentials on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account Responsibilities</h2>
            <p className="text-gray-text leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activities that occur under your account. Notify us immediately at support@mystrio.com of any
              unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Broker Verification</h2>
            <p className="text-gray-text leading-relaxed">
              MYSTRIO makes reasonable efforts to verify broker credentials. However, BROKER HUB does not guarantee
              the accuracy or completeness of any broker's information and is not liable for any transactions
              conducted between users and brokers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Limitation of Liability</h2>
            <p className="text-gray-text leading-relaxed">
              To the maximum extent permitted by law, MYSTRIO shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of BROKER HUB.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Changes to Terms</h2>
            <p className="text-gray-text leading-relaxed">
              MYSTRIO reserves the right to modify these terms at any time. Continued use of BROKER HUB after
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
            <p className="text-gray-text leading-relaxed">
              For any queries regarding these terms, contact us at{' '}
              <a href="mailto:legal@mystrio.com" className="text-primary hover:underline">legal@mystrio.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};
