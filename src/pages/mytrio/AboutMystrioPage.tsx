import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Sparkles, Cpu, Layers, Scissors, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

export const AboutMystrioPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={16} />
            <span>Parent Brand & Tech Initiative</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            About <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">MYSTRIO</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
            MYSTRIO is an emerging technology brand focused on building innovative digital products that solve real-world problems.
          </p>
        </div>

        {/* Mission & Philosophy Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-teal-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Modern Innovation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We combine modern software, artificial intelligence, and user-focused design to create products that are practical, accessible, and built for the future.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-teal-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">User-Centric Approach</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Our approach is simple: <strong className="text-slate-200">identify real problems, understand the people facing them, and build technology that makes their everyday experience better.</strong>
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-teal-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Practical Impact</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We believe great technology is not just about advanced features — it's about creating <strong className="text-slate-200">simple solutions that people can actually use and benefit from.</strong>
            </p>
          </div>
        </div>

        {/* MYSTRIO Ecosystem Showcase */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Product Ecosystem</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">Products Powered by MYSTRIO</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl">
              MYSTRIO serves as the parent brand for a growing ecosystem of digital products engineered for efficiency and scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* BROKER HUB Card */}
            <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl space-y-4 flex flex-col justify-between hover:border-teal-400 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-white">BROKER HUB</h3>
                    <span className="text-[10px] text-teal-400 font-semibold italic">A MYSTRIO Product</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  A digital platform designed to simplify broker-related workflows, deal management, and business interactions between buyers and certified brokers.
                </p>
              </div>

              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-400 hover:text-teal-300 pt-2">
                <span>Explore BROKER HUB</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* GROOMER Card */}
            <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl space-y-4 flex flex-col justify-between hover:border-purple-400 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <Scissors size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-white">GROOMER</h3>
                    <span className="text-[10px] text-purple-400 font-semibold italic">A MYSTRIO Product</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  An AI-powered personal grooming and booking platform empowering users and salons with seamless appointment scheduling and style recommendations.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400">
                <span>Ecosystem Expansion</span>
              </div>
            </div>
          </div>
        </div>
        {/* MYSTRIO Community & User Feedback Testimonials */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">User & Partner Feedback</span>
            <h2 className="text-3xl font-extrabold text-white">What People Say About MYSTRIO Products</h2>
            <p className="text-slate-400 text-sm">Real experiences from business leaders using products in the MYSTRIO ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed italic">
                "MYSTRIO’s product philosophy shines in BROKER HUB. The workflow is fast, intuitive, and eliminates 90% of manual back-and-forth when dealing with brokers."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs">
                  AV
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Alice Vance</h4>
                  <p className="text-xs text-slate-400">Founder, Nexus Industrial</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed italic">
                "Building technology that solves real-world problems is hard, but MYSTRIO nailed it with both GROOMER and BROKER HUB. Truly modern software design."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                  MC
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Marcus Chen</h4>
                  <p className="text-xs text-slate-400">Senior Commercial Advisor</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tagline / Manifesto Banner */}
        <div className="text-center bg-gradient-to-r from-teal-900/40 via-emerald-900/30 to-cyan-900/40 border border-teal-500/30 rounded-3xl p-10 space-y-4 shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            MYSTRIO — Building Ideas. Creating Technology. Solving Problems.
          </h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Focused on building accessible software solutions designed for real-world impact.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
