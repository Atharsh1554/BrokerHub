import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  Store,
  Users,
  Search,
  ShoppingCart,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';

export const AboutBrokerHubPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About BrokerHub – Online Marketplace for Customers & Sellers';
    
    // Schema.org structured data for the About Page
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'about-brokerhub-schema';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      '@id': 'https://www.hendrixbrokerhub.in/about#webpage',
      'url': 'https://www.hendrixbrokerhub.in/about',
      'name': 'About BrokerHub – Digital Marketplace',
      'description': 'BrokerHub is a digital marketplace connecting customers with independent sellers and verified service providers.',
      'isPartOf': {
        '@type': 'WebSite',
        '@id': 'https://www.hendrixbrokerhub.in/#website',
        'name': 'BrokerHub',
        'url': 'https://www.hendrixbrokerhub.in'
      }
    });

    document.head.appendChild(script);
    return () => {
      const existing = document.getElementById('about-brokerhub-schema');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-slate-900 via-navy to-slate-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6">
              <Store className="w-4 h-4" />
              <span>Online Digital Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
              About BrokerHub
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              BrokerHub is a modern <strong className="text-white">digital marketplace</strong> built to connect customers with independent sellers and verified service providers.
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          {/* Key Facts Summary Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2.5">
              <Store className="w-5 h-5 text-primary" />
              At a Glance: Platform Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Platform</span>
                <span className="text-base font-bold text-slate-900">BrokerHub</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Business Type</span>
                <span className="text-base font-bold text-teal-700">Digital Marketplace</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Industry</span>
                <span className="text-base font-bold text-slate-900">E-Commerce & Retail</span>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-600 bg-teal-50/70 border border-teal-200/80 rounded-xl p-4 text-center sm:text-left leading-relaxed">
              <strong>Overview:</strong> BrokerHub is an open digital commerce marketplace connecting customers directly with independent sellers and verified providers for seamless product discovery and transactions.
            </p>
          </div>

          {/* What BrokerHub Does */}
          <div className="mb-12">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                What BrokerHub Does
              </h2>
              <p className="text-slate-600 text-sm mt-2">
                BrokerHub provides an end-to-end commerce suite for buyer-seller collaboration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Product & Service Discovery</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Browse wholesale electronics, industrial materials, business supplies, and custom services cataloged directly by verified independent sellers.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Direct Seller Connections</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Connect and chat directly with independent merchants, negotiate orders, clarify specifications, and build reliable commercial relationships.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-4">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Marketplace Orders & Checkout</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Place purchase orders seamlessly with cart management, order tracking, transparent pricing, and instant status updates.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-4">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Reverse Auction Requests</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Post detailed procurement requests and receive competitive bids from multiple independent sellers, guaranteeing the best market rates.
                </p>
              </div>
            </div>
          </div>

          {/* Important Regulatory Clarification: What BrokerHub is NOT */}
          <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-lg p-6 sm:p-8 mb-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  Brand & Regulatory Clarification
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                  What BrokerHub is NOT
                </h2>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  To avoid confusion with financial terminology, please note that BrokerHub operates strictly as an e-commerce marketplace:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 text-rose-950 text-sm font-medium">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>BrokerHub is <strong>NOT</strong> a stock broker.</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 text-rose-950 text-sm font-medium">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>BrokerHub is <strong>NOT</strong> an investment platform.</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 text-rose-950 text-sm font-medium">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>BrokerHub does <strong>NOT</strong> provide securities trading.</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 text-rose-950 text-sm font-medium">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>BrokerHub does <strong>NOT</strong> provide investment advice.</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 text-rose-950 text-sm font-medium">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>BrokerHub does <strong>NOT</strong> provide portfolio management.</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 text-rose-950 text-sm font-medium">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>BrokerHub is <strong>NOT</strong> a financial services platform.</span>
              </div>
            </div>

            {/* Official Mandatory Disclaimer Box */}
            <div className="mt-8 p-5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    Official Disclaimer
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed font-normal">
                    "BrokerHub is a digital marketplace connecting customers with independent sellers and service providers. BrokerHub does not provide stock trading, investment advice, securities brokerage, portfolio management, or other financial services."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="bg-gradient-to-r from-primary to-teal-600 rounded-2xl p-8 text-white text-center shadow-lg">
            <h3 className="text-2xl font-bold mb-3">Explore the Digital Marketplace</h3>
            <p className="text-white/90 text-sm max-w-xl mx-auto mb-6">
              Connect with trusted merchants, compare offers, and streamline your product procurement today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary font-semibold text-sm hover:bg-slate-100 transition-colors shadow-sm"
              >
                Join as Customer <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/broker/auth"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-800/40 hover:bg-teal-800/60 text-white font-semibold text-sm border border-white/20 transition-colors"
              >
                Become a Seller <CheckCircle2 className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
