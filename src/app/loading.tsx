"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

const LOADING_STATUSES = [
  "Decrypting market signals...",
  "Scanning target career pages...",
  "Decoding developer activity...",
  "Analyzing watchlist opportunities...",
  "Securing server connections..."
];

export default function Loading() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />

      {/* Futuristic Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      <div className="relative flex flex-col items-center z-10">
        {/* Animated Scanner Ring */}
        <div className="relative flex h-36 w-36 items-center justify-center">
          {/* Inner Pulsing Circle */}
          <motion.div
            className="absolute h-24 w-24 rounded-full border border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Outer Spinning Radar Sweeper */}
          <motion.div
            className="absolute h-32 w-32 rounded-full border-2 border-dashed border-t-cyan-500 border-r-cyan-400 border-b-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Outer Glow Ring */}
          <motion.div
            className="absolute h-36 w-36 rounded-full border border-violet-500/10"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Core Spy Glass Icon */}
          <motion.div
            className="relative text-cyan-400"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Search className="h-10 w-10 stroke-[1.5]" />
          </motion.div>
        </div>

        {/* Loading Text */}
        <div className="mt-12 text-center">
          <motion.h1
            className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-2xl font-bold tracking-widest text-transparent uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Career Spy
          </motion.h1>

          {/* Cycling Statuses */}
          <div className="mt-3 h-6 overflow-hidden">
            <motion.p
              key={statusIndex}
              className="text-sm font-medium text-slate-400/80 tracking-wide"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {LOADING_STATUSES[statusIndex]}
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
