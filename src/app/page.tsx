"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Activity, Target, Zap, Shield, Sparkles, HelpCircle, 
  Check, CheckCircle2, ArrowRight, Lock, Terminal, Briefcase, 
  Mail, Star, MessageSquare, Layers, Globe, StarHalf
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { useRouter } from "next/navigation";
import { CyberRadar } from "@/components/CyberRadar";
import { Footer } from "@/components/Footer";

// Simulated Logs for Live Console Mock
const MOCK_CONSOLE_LOGS = [
  { text: "SYSTEM: Starting Target Telemetry scan...", color: "text-muted-foreground" },
  { text: "SCOUT: Triggering webhook for GitHub org repositories...", color: "text-indigo-400" },
  { text: "METRICS: Identified +24% commit volume in Vercel core repos.", color: "text-cyan-400" },
  { text: "SPY AI: Parsing structural updates and dependency modifications...", color: "text-purple-400" },
  { text: "SPY AI: Identified pattern matching: Engineering recruitment prep.", color: "text-yellow-400" },
  { text: "SYSTEM: Recalculating Hire Score for Vercel...", color: "text-muted-foreground" },
  { text: "SUCCESS: Vercel Hire Score updated to 92% (HOT SIGNAL).", color: "text-green-400" },
  { text: "SYSTEM: Matching active CV profiles for user...", color: "text-muted-foreground" },
  { text: "SUCCESS: Matching index 94% found. Generating outreach template.", color: "text-green-400" },
  { text: "MAILER: Dispatching alert email to testuser@yopmail.com...", color: "text-indigo-400" },
];

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const router = useRouter();

  // Local state for interactive FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Local state for Simulated Logs
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(0);

  // Periodic Log Dispatcher
  useEffect(() => {
    setVisibleLogs([MOCK_CONSOLE_LOGS[0].text]);
    setLogIndex(1);
  }, []);

  useEffect(() => {
    if (logIndex === 0) return;
    const interval = setInterval(() => {
      setVisibleLogs((prev) => {
        const nextLogs = [...prev, MOCK_CONSOLE_LOGS[logIndex].text];
        if (nextLogs.length > 5) {
          nextLogs.shift();
        }
        return nextLogs;
      });
      setLogIndex((prevIndex) => (prevIndex + 1) % MOCK_CONSOLE_LOGS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [logIndex]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      openLoginModal();
    }
  };

  const handleSelectPlan = () => {
    if (isAuthenticated) {
      router.push("/dashboard/billing");
    } else {
      openLoginModal();
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
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
            Career Spy watches your target companies 24/7. We analyze GitHub activity, news archives, and career pages with Career Spy AI to alert you the exact moment they gear up to hire.
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
                const element = document.getElementById("demo");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See Live Demo
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

      {/* Interactive Live Demo Section */}
      <section id="demo" className="w-full py-20 border-t border-border/40 bg-muted/10 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Telemetry Terminal</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-4 mb-4">Under The Hood</h2>
            <p className="text-muted-foreground text-sm">Watch the real-time background scanners inspect repository patterns and evaluate vacancies.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
            {/* Log Terminal Screen */}
            <div className="lg:col-span-6 rounded-2xl border border-border bg-black/95 p-5 shadow-2xl font-mono text-xs text-green-500 overflow-hidden flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center gap-1.5 border-b border-muted/20 pb-3 mb-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  <Terminal className="h-3.5 w-3.5 text-primary" />
                  <span>Agent Telemetry Stream</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {visibleLogs.map((log, idx) => {
                      // Simple regex color code mapping for mock console styling
                      let colorClass = "text-green-500/90";
                      if (log.includes("SYSTEM:")) colorClass = "text-muted-foreground";
                      if (log.includes("SCOUT:")) colorClass = "text-indigo-400";
                      if (log.includes("METRICS:")) colorClass = "text-cyan-400";
                      if (log.includes("SPY AI:")) colorClass = "text-purple-400";
                      if (log.includes("SUCCESS:")) colorClass = "text-green-400 font-bold";
                      if (log.includes("MAILER:")) colorClass = "text-yellow-400";

                      return (
                        <motion.div
                          key={log}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`${colorClass} leading-relaxed break-all`}
                        >
                          {log}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
              <div className="border-t border-muted/15 pt-3 mt-4 flex items-center justify-between text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                <span>Scanner Active</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
            </div>

            {/* Generated Mock Report Card */}
            <div className="lg:col-span-6 rounded-2xl border border-border glass-panel p-6 shadow-md bg-card/45 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-primary flex items-center justify-center text-white font-extrabold text-base border border-primary/20">
                      V
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base">Vercel Inc.</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Scout telemetry updated just now</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-foreground">92%</div>
                    <span className="text-[9px] font-black bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      HOT SIGNAL
                    </span>
                  </div>
                </div>

                <div className="mt-5 p-3 rounded-xl bg-muted/20 border border-border/20">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black uppercase text-primary tracking-widest">
                    <Sparkles className="h-3 w-3" />
                    <span>Career Spy Verdict</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Vercel committed multiple production-grade layout components targeting core dashboard pages. AI maps this activity to upcoming vacancies in their React Framework Engineering group.
                  </p>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-muted/10 border border-border/10">
                  <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black uppercase text-indigo-400 tracking-widest">
                    <Mail className="h-3 w-3" />
                    <span>AI Outreach Template Generated</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic truncate">
                    "Hey Vercel Engineering, I saw your recent updates to the turbopack caching architecture..."
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-border/30 pt-4 flex justify-between items-center text-xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Matched: Frontend Lead</span>
                <Button size="sm" onClick={handleGetStarted} className="rounded-xl flex items-center gap-1 h-8 text-[11px] font-bold bg-primary hover:bg-primary/95 text-white">
                  Get Target Alerts <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="w-full py-24 border-t border-border/40 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Scout Strategy</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-4 mb-4">How Career Spy Works</h2>
            <p className="text-muted-foreground text-sm sm:text-base">The ultimate unfair advantage in your job search campaign.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ y: -6, borderColor: "rgba(99, 102, 241, 0.4)" }}
              className="flex flex-col items-center text-center p-8 rounded-2xl glass-panel transition-all duration-300 bg-card/30"
            >
              <div className="h-14 w-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/10 shadow-inner">
                <Target className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold mb-3">1. Add Targets</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Add target companies to your watchlist. We track their public footprint across open-source web commits, news wires, and career page modifications.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -6, borderColor: "rgba(6, 182, 212, 0.4)" }}
              className="flex flex-col items-center text-center p-8 rounded-2xl glass-panel transition-all duration-300 bg-card/30"
            >
              <div className="h-14 w-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/10 shadow-inner">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold mb-3">2. Career Spy Intelligence</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Our model maps your CV skills and active experience directly against target updates. No keyword matches—just semantic correlation modeling.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -6, borderColor: "rgba(168, 85, 247, 0.4)" }}
              className="flex flex-col items-center text-center p-8 rounded-2xl glass-panel transition-all duration-300 bg-card/30"
            >
              <div className="h-14 w-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/10 shadow-inner">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold mb-3">3. Early Outreach</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                When a target's score reaches hiring threshold, get immediate email digests carrying tailored AI outreach drafts to contact stakeholders instantly.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full py-20 border-t border-border/40 bg-muted/10 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Pricing Models</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-4 mb-4">Choose Your Workspace Tier</h2>
            <p className="text-muted-foreground text-sm">Flexible plans tailored to your job seeking velocity. Scale up your scout trackers anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-3xl border border-border bg-card/45 p-8 flex flex-col justify-between shadow-sm hover:border-border/80 transition-all">
              <div>
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block">Scout Tier</span>
                <h3 className="text-xl font-bold mt-2">Free Plan</h3>
                <p className="text-xs text-muted-foreground mt-1">Test out target telemetry.</p>
                <div className="my-6">
                  <span className="text-3xl font-black">₹0</span>
                  <span className="text-xs text-muted-foreground"> / lifetime</span>
                </div>
                <hr className="border-border/30 my-4" />
                <ul className="space-y-3.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>Track 1 Target Company</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>1 Active Resume Profile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>Standard Weekly Scans</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/45">
                    <Lock className="h-3 w-3 shrink-0" />
                    <span>No Custom Outreach Templates</span>
                  </li>
                </ul>
              </div>
              <Button onClick={handleSelectPlan} variant="outline" className="w-full mt-8 rounded-xl font-bold h-10 text-xs border-border bg-background hover:bg-muted transition-all">
                Get Started
              </Button>
            </div>

            {/* Basic Plan */}
            <div className="rounded-3xl border border-primary/30 bg-primary/[0.01] p-8 flex flex-col justify-between shadow-md relative hover:border-primary/50 transition-all">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                Recommended
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest block">Scout Tier</span>
                <h3 className="text-xl font-bold mt-2">Basic Plan</h3>
                <p className="text-xs text-muted-foreground mt-1">For active developers searching jobs.</p>
                <div className="my-6">
                  <span className="text-3xl font-black">₹500</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
                <hr className="border-border/30 my-4" />
                <ul className="space-y-3.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground/90">Track 3 Target Companies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>2 Active Resume Profiles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>Daily Scout Telemetry Queue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>AI-generated Outreach Letters</span>
                  </li>
                </ul>
              </div>
              <Button onClick={handleSelectPlan} className="w-full mt-8 rounded-xl font-bold h-10 text-xs bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/10 transition-all">
                Upgrade Basic
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.01] p-8 flex flex-col justify-between shadow-sm hover:border-cyan-500/40 transition-all">
              <div>
                <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest block font-mono">Elite Tier</span>
                <h3 className="text-xl font-bold mt-2">Pro Plan</h3>
                <p className="text-xs text-muted-foreground mt-1">Ultimate scout automation.</p>
                <div className="my-6">
                  <span className="text-3xl font-black">₹1500</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
                <hr className="border-border/30 my-4" />
                <ul className="space-y-3.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-foreground/90">Track 10 Target Companies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-foreground/90">Unlimited Resume Profiles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Instant Socket Stream Updates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Career Spy Advanced Rationale Analytics</span>
                  </li>
                </ul>
              </div>
              <Button onClick={handleSelectPlan} variant="outline" className="w-full mt-8 rounded-xl font-bold h-10 text-xs border-cyan-500/20 hover:border-cyan-500/40 text-foreground hover:bg-cyan-500/5 transition-all">
                Go Pro Elite
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="w-full py-20 border-t border-border/40 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Scout Verifications</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-4 mb-4">Validated By Candidates</h2>
            <p className="text-muted-foreground text-sm">Real reports from users landing interviews before roles went public.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-border bg-card/45 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-1 mb-4 text-yellow-500">
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "I added Linear and Netflix to my watchlist. When Linear's Hire Score spiked to 89% from commit changes, I emailed the tech lead using the generated template. Bypassed HR screening entirely and got the job."
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">AP</div>
                <div>
                  <h4 className="text-xs font-bold">Alex P.</h4>
                  <p className="text-[10px] text-muted-foreground">Software Engineer @ Linear</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-border bg-card/45 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-1 mb-4 text-yellow-500">
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "The semantic matching is insane. Career Spy parsed my PDF and aligned my database optimization work with Stripe's repository telemetry. I received an alert three days before they published the backend listing."
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">SL</div>
                <div>
                  <h4 className="text-xs font-bold">Sarah L.</h4>
                  <p className="text-[10px] text-muted-foreground">Backend Engineer</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-border bg-card/45 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-1 mb-4 text-yellow-500">
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
                <Star className="h-4.5 w-4.5 fill-current" />
                <StarHalf className="h-4.5 w-4.5 fill-current" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "Having the email templates pre-drafted saves so much time. When the Career Spy analysis shows a hot rating, you know exactly what initiatives to refer to in your initial cold message. Invaluable."
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">JD</div>
                <div>
                  <h4 className="text-xs font-bold">Jason D.</h4>
                  <p className="text-[10px] text-muted-foreground">Full Stack Lead</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="w-full py-20 border-t border-border/40 bg-muted/10 relative">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">FAQ Intelligence</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-4 mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-sm">Everything you need to know about the Career Spy scout telemetry system.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does Career Spy find these early signals?",
                a: "Our background cron systems run autonomous scouts that crawl public telemetry. We inspect commit increments in public repositories, updates to technical documentation, public engineering blogs, press announcements, and layout shifts on career platforms."
              },
              {
                q: "How accurate is the Career Spy Hire Score?",
                a: "The score maps your structured CV data (experience, skills, titles) against technical indicators from the scanned targets. It calculates the semantic match index using Career Spy intelligence models to deliver descriptive signals rather than standard keyword filtering."
              },
              {
                q: "When will I receive early email alerts?",
                a: "You will receive automated emails whenever a company on your watchlist registers a Hire Score above 70%. The email contains the summary report, active code triggers, and a copy-paste email template tailored for cold outreach."
              },
              {
                q: "Can I manage multiple resumes in my dashboard?",
                a: "Yes, based on your active plan tier. The Basic plan lets you store 2 profiles, while the Pro tier offers unlimited profile storage. You can select any parsed document to make it your active matching profile."
              },
              {
                q: "Is there a contract or cancelation fee?",
                a: "No contract. Career Spy operates on a flexible month-to-month subscription. You can cancel, downgrade, or upgrade your workspace tier instantly inside your Billing control board."
              }
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-foreground hover:text-primary transition-colors focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className={`transform transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`}>
                      <HelpCircle className="h-4.5 w-4.5" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-0 text-xs leading-relaxed text-muted-foreground border-t border-border/20 mt-1">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
