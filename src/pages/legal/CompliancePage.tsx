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

        <div className="prose prose-sm max-w-none space-y-8 text-text-primary">
          <section>
            <h2 className="text-xl font-semibold mb-3">Regulatory Framework</h2>
            <p className="text-gray-text leading-relaxed">
              BROKER HUB, a product of MYSTRIO, is committed to operating in full compliance with applicable laws
              and regulations governing online marketplaces, brokerage services, and data protection in India
              and internationally.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Broker Compliance Standards</h2>
            <p className="text-gray-text leading-relaxed">
              All brokers registered on BROKER HUB must hold valid licenses and registrations as required by
              their respective regulatory authorities. We conduct periodic audits to ensure ongoing compliance.
              Brokers found in violation of our compliance standards are immediately suspended pending review.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Anti-Money Laundering (AML)</h2>
            <p className="text-gray-text leading-relaxed">
              MYSTRIO maintains robust AML policies. All transactions on the platform are monitored for suspicious
              activity. We comply with applicable Know Your Customer (KYC) requirements for broker onboarding
              and high-value transaction verification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Protection Compliance</h2>
            <p className="text-gray-text leading-relaxed">
              We comply with the Digital Personal Data Protection Act (DPDPA) 2023 and applicable international
              data protection frameworks. Our data processing practices are reviewed regularly by our Data
              Protection Officer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Dispute Resolution</h2>
            <p className="text-gray-text leading-relaxed">
              BROKER HUB provides a structured dispute resolution process for conflicts between users and brokers.
              Unresolved disputes are escalated to our Compliance team. We aim to resolve all disputes within
              14 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Reporting Violations</h2>
            <p className="text-gray-text leading-relaxed">
              If you observe any activity on BROKER HUB that you believe violates our compliance standards or
              applicable law, please report it immediately to{' '}
              <a href="mailto:compliance@mystrio.com" className="text-primary hover:underline">compliance@mystrio.com</a>.
              All reports are treated confidentially.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};
