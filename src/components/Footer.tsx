"use client";

import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 py-12 bg-card/10 relative mt-auto">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
          {/* Column 1: Brand details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-black tracking-tighter text-lg text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
                <Activity className="h-4 w-4 animate-pulse text-cyan-400" />
              </div>
              <span>Career<span className="text-primary">Spy</span></span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Autonomous corporate telemetry networks tracking developer indicators to match software roles before public release.
            </p>
          </div>

          {/* Column 2: Dashboard Links */}
          <div>
            <h4 className="font-extrabold uppercase tracking-widest text-foreground mb-4 text-[10px]">Console</h4>
            <ul className="space-y-2.5 text-muted-foreground">
              <li><a href="/dashboard?tab=watchlist" className="hover:text-primary transition">Watchlist Manager</a></li>
              <li><a href="/dashboard?tab=jobs" className="hover:text-primary transition">Job Matchmaker</a></li>
              <li><a href="/dashboard?tab=resume" className="hover:text-primary transition">Resume Workspace</a></li>
              <li><a href="/dashboard/billing" className="hover:text-primary transition">Upgrade Workspace</a></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="font-extrabold uppercase tracking-widest text-foreground mb-4 text-[10px]">Resources</h4>
            <ul className="space-y-2.5 text-muted-foreground">
              <li><a href="/#features" className="hover:text-primary transition">Core Features</a></li>
              <li><a href="/#demo" className="hover:text-primary transition">Live Terminal Demo</a></li>
              <li><a href="/#faq" className="hover:text-primary transition">System FAQ</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">GitHub Scout</a></li>
            </ul>
          </div>

          {/* Column 4: Legals */}
          <div>
            <h4 className="font-extrabold uppercase tracking-widest text-foreground mb-4 text-[10px]">Security</h4>
            <ul className="space-y-2.5 text-muted-foreground">
              <li><a href="/privacy-policy" className="hover:text-primary transition">Privacy Policy</a></li>
              <li><a href="/terms-of-service" className="hover:text-primary transition">Terms of Service</a></li>
              <li><a href="mailto:support@careerspy.app" className="hover:text-primary transition">Contact Security</a></li>
              <li><span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/25 px-2 py-0.5 rounded text-[8px] font-black uppercase">Career Spy Secure API</span></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom copyright row */}
        <div className="border-t border-border/25 pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Career Spy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
