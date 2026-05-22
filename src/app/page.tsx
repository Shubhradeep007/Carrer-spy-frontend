"use client";

import { motion } from "framer-motion";
import { Search, Activity, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { useRouter } from "next/navigation";

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
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-24 md:py-32 lg:py-40 border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center gap-2"
          >
            <Activity className="h-4 w-4" /> Real-time Job Intelligence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mb-6"
          >
            Spy on your dream companies. Get hired before they post.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
          >
            Career Spy watches your target companies 24/7. We analyze GitHub activity, news, and career pages with Google Gemini to alert you exactly when they start hiring.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button size="lg" className="rounded-full px-10 h-14 text-lg" onClick={handleGetStarted}>
              Start Spying for Free
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">How Career Spy Works</h2>
            <p className="text-muted-foreground">The ultimate unfair advantage in your job search.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center p-6 border rounded-2xl bg-card">
              <div className="h-16 w-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Add Targets</h3>
              <p className="text-muted-foreground">
                Add up to 10 companies to your watchlist. We track their public footprint across the web.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 border rounded-2xl bg-card">
              <div className="h-16 w-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Analysis</h3>
              <p className="text-muted-foreground">
                Every hour, Google Gemini analyzes hiring news, GitHub repos, and job boards to calculate a Hire Score.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 border rounded-2xl bg-card">
              <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Early Alerts</h3>
              <p className="text-muted-foreground">
                When a company's Hire Score crosses 70, you get an instant email alert with a ready-to-send outreach message.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
