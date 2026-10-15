import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Zap, Shield, Users, Star, ArrowRight, CheckCircle, Quote } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [filterRole, setFilterRole] = useState<'all' | 'client' | 'broker'>('all');
  const location = useLocation();



  useEffect(() => {
    document.title = 'BrokerHub – Online Marketplace for Customers & Sellers';
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo) {
      // Small delay to allow the page to fully render before scrolling
      const timer = setTimeout(() => {
        const el = document.getElementById(state.scrollTo!);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
        // Clear state so back-navigation doesn't re-scroll
        window.history.replaceState({}, document.title);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const testimonials = [
    {
      id: 1,
      name: 'Alice Vance',
      role: 'Founder & CEO',
      company: 'Nexus Industrial Logistics',
      category: 'client',
      avatar: 'AV',
      rating: 5,
      quote:
        'BrokerHub saved us weeks when sourcing specialized industrial hardware suppliers. We got matched in 12 hours and placed our bulk equipment order smoothly.',
    },
    {
      id: 2,
      name: 'Marcus Chen',
      role: 'Commercial Supplier',
      company: 'Apex Commercial Supplies',
      category: 'broker',
      avatar: 'MC',
      rating: 5,
      quote:
        'BrokerHub connects our supply business with genuine buyers looking for verified merchandise. Managing inquiries and order requests in one place has streamlined our sales pipeline.',
    },
    {
      id: 3,
      name: 'David Park',
      role: 'Director of Trade Operations',
      company: 'Global Import Solutions',
      category: 'client',
      avatar: 'DP',
      rating: 5,
      quote:
        'The transparency of verified product listings and shipment tracking makes bulk purchasing stress-free. A reliable and highly efficient marketplace!',
    },
    {
      id: 4,
      name: 'Elena Rodriguez',
      role: 'Wholesale Merchandise Broker',
      company: 'Global Trade Partners',
      category: 'broker',
      avatar: 'ER',
      rating: 5,
      quote:
        'The interface is sleek, responsive, and intuitive. Managing product inventory, responding to buyer inquiries, and fulfilling orders has never been this seamless.',
    },
  ];

  const filteredTestimonials = testimonials.filter(
    (t) => filterRole === 'all' || t.category === filterRole
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 [color-scheme:light] [--color-text-primary:#1E293B] [--color-text-secondary:#64748B] [--color-gray-text:#64748B] [--color-gray-border:#E5E7EB] [--color-gray-bg:#F5F7FA] [--color-gray-label:#94A3B8]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap size={16} />
                <span>Verified Marketplace Connections</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold text-text-primary leading-tight mb-6">
                BrokerHub – Connect with Sellers. <span className="text-primary">Discover Products.</span> Get Things Done.
              </h1>
              <p className="text-base sm:text-lg text-gray-text leading-relaxed mb-8 max-w-lg">
                Connect with independent sellers and service providers. Discover products, compare prices, connect with sellers and place orders online.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto justify-center">
                    Get Matched Now
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
                <a href="#about" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto justify-center">
                    About BrokerHub
                  </Button>
                </a>
              </div>
            </div>

            {/* Hero Image Placeholder */}
            <div className="relative mt-4 lg:mt-0">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary-50 via-teal-50 to-emerald-50 flex items-center justify-center overflow-hidden shadow-xl border border-gray-border">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Users size={48} className="text-primary" />
                  </div>
                  <p className="text-lg font-semibold text-text-primary">Digital Marketplace</p>
                  <p className="text-xs text-primary font-bold italic mt-0.5">Online Digital Marketplace</p>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 left-2 sm:-left-4 right-2 sm:right-auto bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-border">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-primary shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-text-primary">500+ Verified Sellers</p>
                    <p className="text-[11px] sm:text-xs text-gray-text">50,000+ Marketplace Orders Fulfilled</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About BrokerHub Section (Digital Marketplace Clarification) */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-bg border-t border-b border-gray-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <span>Official Platform Clarification</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
              About <span className="text-primary">BrokerHub</span>
            </h2>
            <p className="text-gray-text max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              BrokerHub is a digital marketplace connecting customers with independent commercial sellers and service providers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* What BrokerHub Is */}
            <div className="bg-white rounded-2xl border border-gray-border p-8 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">What BrokerHub Is</h3>
                    <p className="text-xs text-gray-text">Digital Marketplace · E-commerce</p>
                  </div>
                </div>

                <ul className="space-y-3 pt-2 text-sm text-text-primary">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Digital Marketplace:</strong> BrokerHub is an online marketplace connecting customers with independent sellers and service providers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Product Discovery:</strong> Discover products, compare transparent prices, and connect directly with sellers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Marketplace Transactions:</strong> Facilitates order placement, seller communications, and catalog management online.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Platform Operations:</strong> Built as a dedicated digital commerce marketplace for verified trading and buyer-seller trust.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-text">
                <span>Product: <strong className="text-text-primary">BrokerHub</strong></span>
                <span>Type: <strong className="text-text-primary">Digital Marketplace</strong></span>
              </div>
            </div>

            {/* What BrokerHub Is NOT */}
            <div className="bg-white rounded-2xl border border-gray-border p-8 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Important Clarifications</h3>
                    <p className="text-xs text-gray-text">Not a Financial Platform</p>
                  </div>
                </div>

                <ul className="space-y-3 pt-2 text-sm text-gray-text">
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>BrokerHub is <strong>NOT</strong> a stock broker.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>BrokerHub is <strong>NOT</strong> an investment platform.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>BrokerHub does <strong>NOT</strong> provide securities trading.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>BrokerHub does <strong>NOT</strong> provide investment advice.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>BrokerHub does <strong>NOT</strong> provide portfolio management.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>BrokerHub is <strong>NOT</strong> a financial services platform.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-text">
                <span>Industry: <strong className="text-text-primary">E-commerce / Digital Marketplace</strong></span>
                <span>Type: <strong className="text-text-primary">Online Commerce</strong></span>
              </div>
            </div>
          </div>

          {/* Mandatory Disclaimer Box */}
          <div className="mt-8 bg-white border border-gray-border rounded-2xl p-6 text-center shadow-xs">
            <p className="text-xs sm:text-sm text-gray-text leading-relaxed max-w-3xl mx-auto">
              <strong className="text-text-primary">Disclaimer:</strong> BrokerHub is a digital marketplace connecting customers with independent sellers and service providers. BrokerHub does not provide stock trading, investment advice, securities brokerage, portfolio management, or other financial services.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Why choose <span className="text-primary">BROKER HUB</span>?
            </h2>
            <p className="text-gray-text max-w-2xl mx-auto">
              Engineered to make finding the right sellers and products simple, transparent, and reliable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Star size={28} />,
                title: 'Expert Broker Matching',
                description: 'Our matching algorithm connects you with brokers who specialize in your specific industry.',
              },
              {
                icon: <Shield size={28} />,
                title: 'Trusted & Verified Reviews',
                description: 'Every broker on our platform is thoroughly vetted with transparent customer reviews.',
              },
              {
                icon: <Zap size={28} />,
                title: 'Fast Direct Connections',
                description: 'Get connected with your matched broker within 24 hours with built-in live chat & calendar.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-8 border border-gray-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center text-primary mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-text leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-text-primary mb-4">How it works</h2>
            <p className="text-gray-text max-w-2xl mx-auto">
              Three simple steps to find your perfect seller and product match.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Tell Us Your Goal',
                description: 'Share your requirements and what type of broker you are looking for.',
              },
              {
                step: '02',
                title: 'Compare Your Matches',
                description: 'Review matched brokers, their reviews, ratings, and deal specializations.',
              },
              {
                step: '03',
                title: 'Schedule & Secure',
                description: 'Book a consultation and start working with your chosen broker directly.',
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/30">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-3">{step.title}</h3>
                <p className="text-sm text-gray-text leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-bg border-t border-b border-gray-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <Quote size={14} />
              <span>Verified Testimonials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Trusted by Businesses & Top Brokers
            </h2>
            <p className="text-gray-text max-w-2xl mx-auto text-sm sm:text-base">
              See what business founders and certified brokers say about using BROKER HUB.
            </p>

            {/* Testimonials Filter Tabs */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[
                { id: 'all', label: 'All Reviews' },
                { id: 'client', label: 'Business Buyers' },
                { id: 'broker', label: 'Certified Brokers' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterRole(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filterRole === tab.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-white text-gray-text border border-gray-border hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredTestimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-gray-border p-8 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[...Array(t.rating)].map((_, idx) => (
                        <Star key={idx} size={18} className="fill-yellow-400" />
                      ))}
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-label text-xs font-medium uppercase tracking-wider">
                      {t.category === 'client' ? 'Customer / Buyer' : 'Independent Seller'}
                    </span>
                  </div>

                  <p className="text-text-primary text-sm sm:text-base leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-6 mt-6 border-t border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm sm:text-base">{t.name}</h4>
                    <p className="text-xs text-gray-text">{t.role}</p>
                    <p className="text-xs font-semibold text-primary">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Simple, <span className="text-primary">transparent pricing</span>
            </h2>
            <p className="text-gray-text max-w-2xl mx-auto">
              No hidden fees. Choose the plan that works best for your digital marketplace needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { plan: 'Starter', price: '₹0', period: '/month', desc: 'Perfect for individuals exploring seller connections.', features: ['Up to 3 seller matches', 'Basic messaging', 'Public seller profiles'] },
              { plan: 'Growth', price: '₹2,999', period: '/month', desc: 'For growing businesses needing consistent marketplace access.', features: ['Unlimited seller matches', 'Priority support', 'Advanced analytics', 'Inquiry scheduling'], highlight: true },
              { plan: 'Enterprise', price: 'Custom', period: '', desc: 'Tailored solutions for large-scale operations.', features: ['Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'Bulk order management'] },
            ].map((tier) => (
              <div key={tier.plan} className={`rounded-2xl border p-8 flex flex-col gap-6 ${
                tier.highlight ? 'border-primary bg-primary/5 shadow-lg' : 'border-gray-border bg-gray-bg'
              }`}>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-1">{tier.plan}</p>
                  <p className="text-4xl font-bold text-text-primary">{tier.price}<span className="text-sm font-normal text-gray-text">{tier.period}</span></p>
                  <p className="text-sm text-gray-text mt-2">{tier.desc}</p>
                </div>
                <ul className="space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-primary">
                      <CheckCircle size={16} className="text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button variant={tier.highlight ? 'primary' : 'secondary'} size="md" className="w-full justify-center">
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-bg border-t border-gray-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-text">Everything you need to know about BROKER HUB.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: 'How does seller matching work?', a: 'Our algorithm analyses your business requirements and matches you with verified commercial sellers who specialize in your specific product categories and supply requirements.' },
              { q: 'Are sellers verified and vetted?', a: 'Yes. Every seller and provider on BROKER HUB goes through an onboarding verification process including identity checks, business verification, and reference reviews.' },
              { q: 'How quickly can I get matched?', a: 'Most matches are delivered within 24 hours of submitting your requirements. Priority plan users get matches within 4 hours.' },
              { q: 'Is there a free plan available?', a: 'Yes, our Starter plan is completely free and lets you explore up to 3 seller matches with basic messaging.' },
              { q: 'Can I switch plans later?', a: 'Absolutely. You can upgrade, downgrade, or cancel your plan at any time from your account settings.' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-border p-6">
                <h3 className="font-semibold text-text-primary mb-2">{item.q}</h3>
                <p className="text-sm text-gray-text leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary via-teal-600 to-emerald-600">
        <div className="max-w-3xl mx-auto text-center text-white space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Ready to find your perfect seller?</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Join thousands of customers who have found their ideal products through BROKER HUB.
          </p>
          <div>
            <Link to="/signup">
              <Button variant="outline" size="lg" className="!border-white !text-white !bg-transparent hover:!bg-white/10 shadow-lg">
                Get Started Free
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
