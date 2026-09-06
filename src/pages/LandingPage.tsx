import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Zap, Shield, Users, Star, ArrowRight, CheckCircle, Quote } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [filterRole, setFilterRole] = useState<'all' | 'client' | 'broker'>('all');

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
        'BROKER HUB saved us weeks when sourcing specialized industrial hardware brokers. We got matched in 12 hours and finalized our multi-state distribution deal smoothly.',
    },
    {
      id: 2,
      name: 'Marcus Chen',
      role: 'Senior Commercial Broker',
      company: 'Apex Realty Group',
      category: 'broker',
      avatar: 'MC',
      rating: 5,
      quote:
        'As a broker, BROKER HUB provides the highest quality verified buyer leads. The appointment scheduling and live client chat desk have doubled my closing rate.',
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
        'The transparency of verified reviews and order tracking makes high-value deals completely stress-free. Another stellar product by MYSTRIO!',
    },
    {
      id: 4,
      name: 'Elena Rodriguez',
      role: 'Principal Advisor',
      company: 'SecureLife Partners',
      category: 'broker',
      avatar: 'ER',
      rating: 5,
      quote:
        'The interface is sleek, responsive, and intuitive. Managing client portfolios, tracking payouts, and accepting call requests has never been this seamless.',
    },
  ];

  const filteredTestimonials = testimonials.filter(
    (t) => filterRole === 'all' || t.category === filterRole
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap size={16} />
                <span>Verified Connections in Under 24 Hours</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-6">
                Find the perfect broker for your{' '}
                <span className="text-primary">required deals</span>
              </h1>
              <p className="text-lg text-gray-text leading-relaxed mb-8 max-w-lg">
                Connect with trusted, verified brokers who understand your business needs. 
                Get matched, compare reviews, and start collaborating in real-time.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button variant="primary" size="lg">
                    Get Matched Now
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="secondary" size="lg">
                    Learn More
                  </Button>
                </a>
              </div>
            </div>

            {/* Hero Image Placeholder */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary-50 via-teal-50 to-emerald-50 flex items-center justify-center overflow-hidden shadow-xl border border-gray-border">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Users size={48} className="text-primary" />
                  </div>
                  <p className="text-lg font-semibold text-text-primary">Business Handshake</p>
                  <p className="text-xs text-primary font-bold italic mt-0.5">A MYSTRIO Product</p>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-border">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-primary" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">500+ Verified Brokers</p>
                    <p className="text-xs text-gray-text">Over $12M in deals powered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Why choose <span className="text-primary">BROKER HUB</span>?
            </h2>
            <p className="text-gray-text max-w-2xl mx-auto">
              Engineered by MYSTRIO to make finding the right broker simple, transparent, and reliable.
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
              Three simple steps to find your perfect broker match.
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
                      {t.category === 'client' ? 'Buyer Partner' : 'Licensed Broker'}
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

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary via-teal-600 to-emerald-600">
        <div className="max-w-3xl mx-auto text-center text-white space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Ready to find your perfect broker?</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Join thousands of businesses who have found their ideal broker through BROKER HUB.
          </p>
          <div>
            <Link to="/signup">
              <Button variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10 shadow-lg">
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
