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

        <div className="p-4 mb-8 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm leading-relaxed">
          <strong>Important Disclaimer:</strong> BrokerHub is a digital marketplace connecting customers with independent sellers and service providers. BrokerHub does not provide stock trading, investment advice, securities brokerage, portfolio management, or other financial services.
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-text-primary">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-text leading-relaxed">
              By accessing or using BrokerHub, a digital marketplace developed and owned by Mystrio Technologies, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Digital Marketplace Scope</h2>
            <p className="text-gray-text leading-relaxed">
              BrokerHub operates exclusively as an online marketplace facilitating discovery, communication, and order placement between buyers and independent sellers/service providers. You agree to use the platform only for lawful commercial purposes and in compliance with all applicable regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account Responsibilities</h2>
            <p className="text-gray-text leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately at support@mystrio.com of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Independent Seller & Merchant Verification</h2>
            <p className="text-gray-text leading-relaxed">
              Mystrio Technologies makes reasonable efforts to verify commercial seller identity and trade credentials. However, BrokerHub is not a party to direct sale contracts between buyers and independent sellers and does not guarantee third-party fulfillment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Non-Financial Platform Status</h2>
            <p className="text-gray-text leading-relaxed">
              BrokerHub is NOT a stock brokerage, financial advisor, investment vehicle, or securities broker. No transactions conducted on BrokerHub involve securities, commodities, debt instruments, or financial investments.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
            <p className="text-gray-text leading-relaxed">
              To the maximum extent permitted by law, Mystrio Technologies shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of BrokerHub.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Changes to Terms</h2>
            <p className="text-gray-text leading-relaxed">
              Mystrio Technologies reserves the right to modify these terms at any time. Continued use of BrokerHub after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
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
