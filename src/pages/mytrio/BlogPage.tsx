import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Sparkles, Calendar, Tag, ArrowRight } from 'lucide-react';

export const BlogPage: React.FC = () => {
  const articles = [
    {
      id: 1,
      title: 'Building BROKER HUB: Digitizing Workflows for Modern Brokers',
      excerpt: 'How MYSTRIO identified friction in business brokerage deals and engineered a unified platform for appointments, inventory, and messaging.',
      date: 'Jan 28, 2026',
      category: 'Product Engineering',
      author: 'MYSTRIO Tech Team',
    },
    {
      id: 2,
      title: 'Introducing GROOMER: AI-Powered Grooming & Appointment Intelligence',
      excerpt: 'Exploring how AI recommendation models are changing personal grooming scheduling and customer experience.',
      date: 'Jan 15, 2026',
      category: 'AI & Machine Learning',
      author: 'MYSTRIO Innovation Labs',
    },
    {
      id: 3,
      title: 'Why Simple Technology Always Wins in the Real World',
      excerpt: 'Great technology is not just about complex algorithms — it is about creating simple, accessible solutions people actually love using.',
      date: 'Jan 04, 2026',
      category: 'Philosophy & Design',
      author: 'MYSTRIO Product Lead',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={16} />
            <span>MYSTRIO Insights & Blog</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Building Ideas. <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Creating Technology.</span>
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed font-normal">
            Articles, product updates, and engineering insights from the team behind BROKER HUB and GROOMER.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((art) => (
            <article
              key={art.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-teal-500/50 transition-all duration-300 shadow-xl hover:shadow-teal-500/5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-teal-400 font-semibold bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                    <Tag size={12} />
                    {art.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {art.date}
                  </span>
                </div>

                <h3 className="font-bold text-xl text-white leading-snug hover:text-teal-300 transition-colors cursor-pointer">
                  {art.title}
                </h3>

                <p className="text-sm text-slate-400 leading-relaxed">{art.excerpt}</p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">{art.author}</span>
                <span className="text-xs font-semibold text-teal-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer">
                  Read Article
                  <ArrowRight size={14} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};
