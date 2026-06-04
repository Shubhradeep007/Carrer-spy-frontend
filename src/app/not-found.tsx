"use client";

import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-100 px-6">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-violet-600/5 blur-3xl" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      <div className="relative flex flex-col items-center max-w-lg text-center z-10">
        {/* Animated Icon Container */}
        <motion.div
          className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-8 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Inner ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl border border-dashed border-red-500/40"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <ShieldAlert className="h-12 w-12 stroke-[1.5]" />
        </motion.div>

        {/* 404 Header */}
        <motion.h1
          className="bg-gradient-to-r from-red-500 via-orange-400 to-violet-500 bg-clip-text text-8xl font-black tracking-tighter text-transparent"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          404
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          className="text-xl font-semibold mt-4 text-slate-200 uppercase tracking-widest"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Signal Classified / Lost
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-slate-400 mt-3 text-sm md:text-base max-w-sm leading-relaxed"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          The coordinate you are attempting to reach does not exist or has been classified. Return to headquarters immediately.
        </motion.p>

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {/* Back Home Button */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-6 py-3 rounded-xl transition duration-300 shadow-lg shadow-cyan-500/15"
          >
            <Home className="h-4 w-4" />
            Headquarters
          </Link>

          {/* Go Back button */}
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-slate-300 font-medium px-6 py-3 rounded-xl transition duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </motion.div>
      </div>
    </div>
  );
}
