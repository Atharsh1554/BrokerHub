import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const CompliancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Compliance</h1>
        <p className="text-sm text-gray-text mb-10">Last updated: October 2026</p>

        <div className="p-4 mb-8 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm leading-relaxed">
          <strong>Important Notice:</strong> BrokerHub is a digital marketplace connecting customers with independent sellers and service providers. BrokerHub does not provide stock trading, investment advice, securities brokerage, portfolio management, or other financial services.
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-text-primary">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. E-Commerce Marketplace Regulatory Framework</h2>
            <p className="text-gray-text leading-relaxed">
              BrokerHub is a digital commerce marketplace developed and operated by Mystrio Technologies. The platform operates as an electronic intermediary in compliance with the Information Technology Act 2000, the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, and the Consumer Protection (E-Commerce) Rules 2020.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Merchant & Seller Standards</h2>
            <p className="text-gray-text leading-relaxed">
              All independent merchants and sellers registered on BrokerHub must comply with commercial trading laws applicable to their product lines, including holding appropriate tax registrations (such as GSTIN) and business licenses. We conduct merchant identity verification to maintain transparency and fair marketplace trade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Strict Non-Financial Classification</h2>
            <p className="text-gray-text leading-relaxed">
              BrokerHub is solely a platform for physical goods, industrial supplies, and commercial trade services. BrokerHub is not a stock broker, does not deal in securities or equities, does not accept investment deposits, and does not provide financial or advisory services of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Protection & Privacy Compliance</h2>
            <p className="text-gray-text leading-relaxed">
              We comply with the Digital Personal Data Protection Act (DPDPA) 2023 and applicable privacy standards. User information is processed strictly to facilitate marketplace transactions, order communication, and customer support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Dispute Resolution</h2>
            <p className="text-gray-text leading-relaxed">
              BrokerHub provides a structured dispute resolution workflow for order discrepancies between customers and independent sellers. Inquiries can be escalated to our marketplace support team at{' '}
              <a href="mailto:support@mystrio.com" className="text-primary hover:underline">support@mystrio.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Reporting Violations</h2>
            <p className="text-gray-text leading-relaxed">
              If you identify any listing or activity on BrokerHub that violates marketplace guidelines or applicable law, please report it immediately to{' '}
              <a href="mailto:compliance@mystrio.com" className="text-primary hover:underline">compliance@mystrio.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};
