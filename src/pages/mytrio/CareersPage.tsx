import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Briefcase, Rocket, Heart, Code2, Sparkles } from 'lucide-react';

export const CareersPage: React.FC = () => {
  const openings = [
    { title: 'Full-Stack Software Engineer', department: 'Engineering', location: 'Remote / Hybrid', type: 'Full-time' },
    { title: 'AI & Machine Learning Engineer', department: 'MYSTRIO Labs', location: 'Remote', type: 'Full-time' },
    { title: 'Product Designer (UI/UX)', department: 'Design', location: 'Remote / Hybrid', type: 'Full-time' },
    { title: 'Product Growth Manager', department: 'Operations', location: 'Remote', type: 'Full-time' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={16} />
            <span>MYSTRIO Careers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Build Technology That <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Solves Real Problems</span>
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed font-normal">
            At MYSTRIO, we create digital products designed to simplify everyday workflows. Join our team of engineers, designers, and problem solvers.
          </p>
        </div>

        {/* Perks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Rocket size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Innovation First</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Work on groundbreaking platforms across AI, SaaS, and marketplace technology including GROOMER and BROKER HUB.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Code2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Modern Tech Stack</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Build using TypeScript, React, Vite, Node, AI APIs, and scalable cloud architectures.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Heart size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Flexible Culture</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Remote-first environment with flexible working hours, learning budgets, and growth opportunities.
            </p>
          </div>
        </div>

        {/* Open Roles List */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-teal-400" />
            <h2 className="text-2xl font-bold text-white">Current Open Positions</h2>
          </div>

          <div className="space-y-4">
            {openings.map((job, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-teal-500/50 transition-colors"
              >
                <div>
                  <h4 className="font-bold text-white text-lg">{job.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span className="text-teal-400 font-semibold">{job.type}</span>
                  </div>
                </div>

                <Button variant="primary" size="sm" onClick={() => alert(`Applied for ${job.title}! We will review your profile.`)}>
                  Apply Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
