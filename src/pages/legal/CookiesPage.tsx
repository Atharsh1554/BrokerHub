import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const CookiesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-text mb-10">Last updated: October 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-text-primary">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. What Are Cookies?</h2>
            <p className="text-gray-text leading-relaxed">
              Cookies are small text files stored on your device when you visit BROKER HUB. They help us recognise
              your browser and remember your preferences to enhance your experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Types of Cookies We Use</h2>
            <ul className="space-y-3 text-gray-text">
              <li className="flex gap-3"><span className="font-semibold text-text-primary min-w-fit">Essential:</span> Required for the platform to function — authentication, session management, security.</li>
              <li className="flex gap-3"><span className="font-semibold text-text-primary min-w-fit">Functional:</span> Remember your preferences such as language and display settings.</li>
              <li className="flex gap-3"><span className="font-semibold text-text-primary min-w-fit">Analytics:</span> Help us understand how you use BROKER HUB so we can improve performance and features.</li>
              <li className="flex gap-3"><span className="font-semibold text-text-primary min-w-fit">Marketing:</span> Used to deliver relevant content and measure the effectiveness of our campaigns.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Third-Party Cookies</h2>
            <p className="text-gray-text leading-relaxed">
              We may allow third-party services (e.g., analytics providers) to place cookies on your device.
              These are governed by the respective third parties' privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Managing Cookies</h2>
            <p className="text-gray-text leading-relaxed">
              You can control or delete cookies via your browser settings. Disabling certain cookies may affect the
              functionality of BROKER HUB. Most browsers allow you to refuse cookies or delete existing ones through
              their settings menu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Changes to This Policy</h2>
            <p className="text-gray-text leading-relaxed">
              We may update this Cookie Policy periodically. Any changes will be posted on this page with an
              updated date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Contact</h2>
            <p className="text-gray-text leading-relaxed">
              For questions about our cookie practices, contact us at{' '}
              <a href="mailto:privacy@mystrio.com" className="text-primary hover:underline">privacy@mystrio.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};
