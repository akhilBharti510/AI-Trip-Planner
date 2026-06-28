'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, Sparkles, DollarSign, BedDouble, MessageSquare, ArrowRight } from 'lucide-react';

export default function Home(): React.ReactElement {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
      },
    },
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI Itinerary Generator',
      desc: 'Get highly personalized, day-by-day activity outlines matching your specific companion types and travel tags.',
    },
    {
      icon: DollarSign,
      title: 'Dynamic Budgeting',
      desc: 'Estimate costs for flights, hotels, food, transport, and activities to avoid unexpected expenses.',
    },
    {
      icon: BedDouble,
      title: 'Curated Hotel Picks',
      desc: 'Discover accommodation recommendations tailored to your destination, budget tier, and user ratings.',
    },
    {
      icon: MessageSquare,
      title: 'Interactive Trip Assistant',
      desc: 'Tweak, replace days, request hidden gems, or reduce costs in real-time by chatting with our context-aware AI.',
    },
  ];

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center pt-24 pb-16 px-4 max-w-7xl mx-auto w-full text-center sm:px-6 lg:px-8 flex-1">
        {/* Soft Background Gradients */}
        <div className="absolute top-[-10%] left-[5%] w-[40rem] h-[40rem] bg-indigo-200/40 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-[-10%] right-[5%] w-[40rem] h-[40rem] bg-pink-200/40 rounded-full blur-3xl -z-10" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center max-w-3xl"
        >
          {/* Logo Brand Icon */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-indigo-600 shadow-sm mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">Powered by Gemini 1.5 Flash</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={itemVariants} className="text-5xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl md:text-7xl leading-tight">
            Travel Planning,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600">
              Reimagined.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={itemVariants} className="mt-6 text-xl text-zinc-600 leading-relaxed max-w-2xl">
            Wayfarer.ai crafts personalized daily itineraries, estimates budget breakdowns, and recommends hotels in seconds. Tweak it dynamically with your own AI Travel Assistant.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <Link
              href="/register"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950 active:scale-95"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="bg-white border-t border-zinc-100 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Everything you need to plan your next escape
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Skip the hours of research. Our artificial intelligence models design plans tailored precisely to your schedule, location, companion type, and budget limits.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group relative flex flex-col rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-200 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-zinc-950">{feat.title}</h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed flex-1">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-12 px-4 border-t border-zinc-900 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Compass className="h-5 w-5 text-indigo-500" />
            <span>Wayfarer.ai</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Wayfarer.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
