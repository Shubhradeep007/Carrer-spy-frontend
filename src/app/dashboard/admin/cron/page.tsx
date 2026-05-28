"use client";

import { useEffect, useState, Fragment } from "react";
import api from "@/lib/api";
import { 
  Loader2, Play, ToggleLeft, ToggleRight, CheckCircle2, 
  XCircle, Clock, Calendar, ShieldAlert, Cpu, AlertTriangle, 
  RefreshCw, Terminal, Search
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "@/lib/socket";

interface CronLog {
  _id: string;
  runAt: string;
  status: "success" | "failed" | "partial";
  companiesProcessed: number;
  alertsTriggered: number;
  errorMessages: string[];
  durationMs: number;
}

export default function AdminCronPage() {
  const [cronLogs, setCronLogs] = useState<CronLog[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastRun, setLastRun] = useState<CronLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [toggling, setToggling] = useState(false);
  
  // Expanded log IDs
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Status Banner Alert
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchCronState = async () => {
    try {
      const statusRes = await api.get("/admin/cron/status");
      setIsEnabled(statusRes.data.isEnabled);
      setLastRun(statusRes.data.lastRun);
    } catch (err) {
      console.error("Failed to fetch cron status:", err);
    }
  };

  const fetchCronLogs = async () => {
    try {
      const logsRes = await api.get("/admin/cron/logs");
      setCronLogs(logsRes.data);
    } catch (err) {
      console.error("Failed to fetch cron logs:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchCronState(), fetchCronLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Listen for real-time cron completions
    socket.on("cron:status", () => {
      loadData();
    });

    return () => {
      socket.off("cron:status");
    };
  }, []);

  const handleToggleCron = async () => {
    try {
      setToggling(true);
      const res = await api.patch("/admin/cron/toggle", { enabled: !isEnabled });
      setIsEnabled(res.data.isEnabled);
      setSuccessMessage(res.data.message);
    } catch (err) {
      console.error("Failed to toggle cron status:", err);
    } finally {
      setToggling(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleTriggerManualScan = async () => {
    if (!confirm("Are you sure you want to trigger a manual scan for all monitored dream targets? This will dispatch API queries to NewsAPI, GitHub Org Events, and Adzuna Careers boards in the background.")) return;

    try {
      setTriggering(true);
      const res = await api.post("/admin/cron/trigger");
      setSuccessMessage(res.data.message);
      
      // Reload logs after short delay
      setTimeout(() => {
        loadData();
      }, 3000);
    } catch (err) {
      console.error("Failed to trigger manual scan:", err);
    } finally {
      setTriggering(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-tr from-foreground to-muted-foreground bg-clip-text text-transparent">
            Cron Operations & Manual Scans
          </h1>
          <p className="text-muted-foreground mt-1">
            Toggle automated signal scanning schedules, trigger platform-wide AI valuations, and inspect detailed job-execution logs.
          </p>
        </div>
      </header>

      {/* Action success notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Toggle Switch card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-56">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Hourly Automated Scans</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When active, our systems scan user target companies every 60 minutes for recruitment intents.
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className={`text-base font-bold ${isEnabled ? 'text-emerald-500' : 'text-muted-foreground'}`}>
              Schedule is {isEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
            <button
              onClick={handleToggleCron}
              disabled={toggling}
              className="text-primary hover:scale-105 transition"
            >
              {isEnabled ? (
                <ToggleRight className="h-14 w-14 text-emerald-500" />
              ) : (
                <ToggleLeft className="h-14 w-14 text-muted-foreground/60" />
              )}
            </button>
          </div>
        </div>

        {/* Trigger Manual Scan Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-56">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Run Manual Scanning System</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dispatch background processes instantly to fetch job listings, code changes, and news articles for all targets.
            </p>
          </div>

          <Button
            onClick={handleTriggerManualScan}
            disabled={triggering}
            className="w-full mt-4 font-bold text-sm rounded-xl py-3 shadow-lg shadow-primary/10 gap-2"
          >
            {triggering ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Processing Pipelines...
              </>
            ) : (
              <>
                <Play className="h-4.5 w-4.5" />
                Scan All Watchlists
              </>
            )}
          </Button>
        </div>

        {/* Last Run Stats Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-56 bg-gradient-to-br from-card to-muted/[0.03]">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Last Scan Diagnostic</h3>
            {lastRun ? (
              <div className="space-y-2.5 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Execution Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    lastRun.status === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15'
                      : lastRun.status === 'partial'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                  }`}>
                    {lastRun.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Monitors Processed:</span>
                  <span className="font-bold text-foreground">{lastRun.companiesProcessed} targets</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Alerts Emailed:</span>
                  <span className="font-bold text-foreground">{lastRun.alertsTriggered} dispatches</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic mt-3">
                No system scans recorded yet.
              </p>
            )}
          </div>

          <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-3">
            <Clock className="h-3.5 w-3.5" />
            Last Execution: {lastRun ? new Date(lastRun.runAt).toLocaleString() : "Never"}
          </div>
        </div>
      </div>

      {/* Log list Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            Background Execution Log History (Last 100 Runs)
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={loading}
            className="rounded-lg text-xs font-semibold gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </Button>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 border-b border-border/60 text-xs uppercase tracking-wider font-bold text-muted-foreground">
                <tr>
                  <th className="p-4 font-semibold">Run Timestamp</th>
                  <th className="p-4 font-semibold">Execution Status</th>
                  <th className="p-4 font-semibold">Scanned targets</th>
                  <th className="p-4 font-semibold">Emailed Alerts</th>
                  <th className="p-4 font-semibold">Response latency</th>
                  <th className="p-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium text-foreground/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                      <span className="text-xs text-muted-foreground mt-2 block animate-pulse">Parsing cron logs files...</span>
                    </td>
                  </tr>
                ) : cronLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground text-sm">
                      No system scans recorded.
                    </td>
                  </tr>
                ) : (
                  cronLogs.map((log) => {
                    const isExpanded = expandedLogId === log._id;
                    return (
                      <Fragment key={log._id}>
                        <tr className="hover:bg-muted/15 transition text-xs font-semibold">
                          <td className="p-4 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground/60" />
                            {new Date(log.runAt).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              log.status === 'success' 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15'
                                : log.status === 'partial'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-4 font-bold">
                            {log.companiesProcessed} companies
                          </td>
                          <td className="p-4 font-bold">
                            {log.alertsTriggered} alerts
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {log.durationMs.toLocaleString()} ms
                          </td>
                          <td className="p-4 text-right">
                            {(log.errorMessages && log.errorMessages.length > 0) ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                                className="text-xs text-primary hover:underline hover:bg-primary/10 rounded-lg"
                              >
                                {isExpanded ? "Hide Errors" : "View Errors"}
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 italic font-semibold">Clean Run</span>
                            )}
                          </td>
                        </tr>

                        {/* Collapsible Error Accordion rows */}
                        {isExpanded && log.errorMessages && log.errorMessages.length > 0 && (
                          <tr key={`${log._id}-errors`} className="bg-muted/20">
                            <td colSpan={6} className="p-4">
                              <div className="p-3 bg-card border border-rose-500/10 rounded-xl space-y-2 text-[11px] font-mono leading-relaxed">
                                <span className="font-bold text-rose-500 flex items-center gap-1">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Scan Pipeline Exception Reports:
                                </span>
                                <div className="divide-y divide-border/30 max-h-36 overflow-y-auto pr-1">
                                  {log.errorMessages.map((msg, idx) => (
                                    <div key={idx} className="py-2 text-rose-500/90 whitespace-pre-wrap font-medium">
                                      [{idx + 1}] {msg}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
