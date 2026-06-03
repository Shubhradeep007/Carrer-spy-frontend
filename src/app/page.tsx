"use client";

import { motion } from "framer-motion";
import { Search, Activity, Target, Zap, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { useRouter } from "next/navigation";
import { CyberRadar } from "@/components/CyberRadar";

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const router = useRouter();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      openLoginModal();
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-background cyber-grid">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl px-4 pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32 lg:pb-36 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 mx-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Left Column: Hero Text */}
        <div className="flex-1 flex flex-col items-start text-left z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <Activity className="h-3.5 w-3.5 animate-pulse text-cyan-400" /> 
            <span>Autonomous Intelligence Radar</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6"
          >
            Spy on your dream companies.{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Get hired before they post.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed"
          >
            Career Spy watches your target companies 24/7. We analyze GitHub activity, news archives, and career pages with Google Gemini to alert you the exact moment they gear up to hire.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Button 
              size="lg" 
              className="rounded-xl px-8 h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5" 
              onClick={handleGetStarted}
            >
              Start Spying for Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-xl px-8 h-12 text-sm font-bold border-border bg-background hover:bg-muted transition-all"
              onClick={() => {
                const element = document.getElementById("features");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn How It Works
            </Button>
          </motion.div>
        </div>

        {/* Right Column: 3D Scene */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full lg:w-[500px] shrink-0"
        >
          <CyberRadar />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-24 border-t border-border bg-muted/20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-500/[0.02] via-transparent to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Features System</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-4 mb-4">How Career Spy Works</h2>
            <p className="text-muted-foreground text-sm sm:text-base">The ultimate unfair advantage in your job search campaign.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ y: -6, borderColor: "rgba(99, 102, 241, 0.4)" }}
              className="flex flex-col items-center text-center p-8 rounded-2xl glass-panel transition-all duration-300"
            >
              <div className="h-14 w-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Target className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold mb-3">1. Add Targets</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Add up to 10 companies to your watchlist. We track their public footprint across the web, repositories, and news feeds.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -6, borderColor: "rgba(6, 182, 212, 0.4)" }}
              className="flex flex-col items-center text-center p-8 rounded-2xl glass-panel transition-all duration-300"
            >
              <div className="h-14 w-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold mb-3">2. AI Analysis</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Every hour, Google Gemini analyzes hiring news, GitHub repo changes, and career boards to calculate a Hire Score.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -6, borderColor: "rgba(168, 85, 247, 0.4)" }}
              className="flex flex-col items-center text-center p-8 rounded-2xl glass-panel transition-all duration-300"
            >
              <div className="h-14 w-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold mb-3">3. Early Alerts</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                When a company's Hire Score crosses 70, you get an instant email alert with a ready-to-send AI outreach template.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

