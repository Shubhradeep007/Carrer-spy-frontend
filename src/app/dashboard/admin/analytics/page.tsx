"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Loader2, Users, Radio, Bell, TrendingUp, AlertTriangle, 
  Cpu, Terminal, Activity, HelpCircle, AlertCircle, CreditCard
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, LineChart, Line, Legend 
} from "recharts";
import { motion } from "framer-motion";

export default function AdminAnalyticsPage() {
  const { user } = useAuthStore();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [apiUsageData, setApiUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, apiUsageRes] = await Promise.all([
          api.get("/admin/analytics"),
          api.get("/admin/api-usage")
        ]);
        setAnalyticsData(analyticsRes.data);
        setApiUsageData(apiUsageRes.data);
      } catch (error) {
        console.error("Failed to load analytics or API usage stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Analytics Engines...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex h-12 w-12 rounded-full bg-red-500/10 text-red-500 items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Analytics Error</h2>
        <p className="text-muted-foreground max-w-sm mx-auto mt-2">
          Unable to aggregate platform statistics. Please check database connectivity.
        </p>
      </div>
    );
  }

  // Format data for Recharts
  const watchedCompaniesChart = analyticsData.topWatchedCompanies.map((c: any) => ({
    name: c.companyName,
    watchers: c.watchers
  }));

  // Format daily signups (last 30 days)
  const signupsChart = analyticsData.dailySignups.map((s: any) => ({
    date: new Date(s._id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: s.count
  }));

  // Format daily signals (last 7 days)
  const signalsChart = analyticsData.dailySignals.map((s: any) => ({
    date: new Date(s._id).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    volume: s.count
  }));

  const totalSubscribers = (analyticsData.revenue?.freeCount || 0) + 
                           (analyticsData.revenue?.basicCount || 0) + 
                           (analyticsData.revenue?.proCount || 0) || 1;

  const freePct = Math.round(((analyticsData.revenue?.freeCount || 0) / totalSubscribers) * 100);
  const basicPct = Math.round(((analyticsData.revenue?.basicCount || 0) / totalSubscribers) * 100);
  const proPct = Math.round(((analyticsData.revenue?.proCount || 0) / totalSubscribers) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-tr from-foreground to-muted-foreground bg-clip-text text-transparent">
            System Analytics & Diagnostics
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time aggregate data, Career Spy AI utilization, and NewsAPI warnings.
          </p>
        </div>
        
        {apiUsageData?.warningsActive && (
          <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 px-4 py-2 rounded-xl text-amber-500 text-xs font-semibold animate-pulse shrink-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>API Quota Limit Threshold Approaching!</span>
          </div>
        )}
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Active Users</p>
              <h3 className="text-3xl font-bold tracking-tight mt-1">{analyticsData.users.total}</h3>
            </div>
          </div>
          <div className="border-t border-border/50 pt-4 mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Signups this month:</span>
            <span className="bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded font-bold">
              +{analyticsData.users.thisMonth}
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Signals Collected</p>
              <h3 className="text-3xl font-bold tracking-tight mt-1">{analyticsData.signals.total}</h3>
            </div>
          </div>
          <div className="border-t border-border/50 pt-4 mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Scans pulled today:</span>
            <span className="bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded font-bold">
              +{analyticsData.signals.today}
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Outreach Alerts Emailed</p>
              <h3 className="text-3xl font-bold tracking-tight mt-1">{analyticsData.alerts.total}</h3>
            </div>
          </div>
          <div className="border-t border-border/50 pt-4 mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Triggers this week:</span>
            <span className="bg-rose-500/15 text-rose-500 px-2 py-0.5 rounded font-bold">
              +{analyticsData.alerts.thisWeek}
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Monthly Revenue</p>
              <h3 className="text-3xl font-bold tracking-tight mt-1">₹{analyticsData.revenue?.total?.toLocaleString('en-IN') || 0}</h3>
            </div>
          </div>
          <div className="border-t border-border/50 pt-4 mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Paying subscribers:</span>
            <span className="bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded font-bold">
              {(analyticsData.revenue?.basicCount || 0) + (analyticsData.revenue?.proCount || 0)} users
            </span>
          </div>
        </motion.div>
      </div>

      {/* Subscription & Revenue Analytics Section */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Plan Distribution Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            Subscription Plan Distribution
          </h2>
          <div className="space-y-4 my-auto">
            {/* Pro Plan */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-cyan-500" />
                  Pro Plan (₹1,500/mo)
                </span>
                <span className="text-muted-foreground">{analyticsData.revenue?.proCount || 0} users ({proPct}%)</span>
              </div>
              <div className="h-2 w-full bg-muted border border-border/30 rounded-full overflow-hidden">
                <div style={{ width: `${proPct}%` }} className="h-full bg-cyan-500 rounded-full" />
              </div>
            </div>

            {/* Basic Plan */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                  Basic Plan (₹500/mo)
                </span>
                <span className="text-muted-foreground">{analyticsData.revenue?.basicCount || 0} users ({basicPct}%)</span>
              </div>
              <div className="h-2 w-full bg-muted border border-border/30 rounded-full overflow-hidden">
                <div style={{ width: `${basicPct}%` }} className="h-full bg-primary rounded-full" />
              </div>
            </div>

            {/* Free Plan */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-muted-foreground/60" />
                  Free Plan (₹0/mo)
                </span>
                <span className="text-muted-foreground">{analyticsData.revenue?.freeCount || 0} users ({freePct}%)</span>
              </div>
              <div className="h-2 w-full bg-muted border border-border/30 rounded-full overflow-hidden">
                <div style={{ width: `${freePct}%` }} className="h-full bg-muted-foreground/50 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Purchases Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-4">
            <Users className="h-5 w-5 text-indigo-500" />
            Recent Subscription Customers
          </h2>
          <div className="overflow-x-auto border border-border/60 rounded-xl max-h-[220px] overflow-y-auto bg-muted/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 border-b border-border/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="p-3 font-semibold">User</th>
                  <th className="p-3 font-semibold">Tier</th>
                  <th className="p-3 font-semibold">Payment / Order ID</th>
                  <th className="p-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {(!analyticsData.purchasedUsers || analyticsData.purchasedUsers.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground font-medium italic">
                      No active paid subscriptions found.
                    </td>
                  </tr>
                ) : (
                  analyticsData.purchasedUsers.map((u: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/15 transition-colors">
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground/80">{u.name}</span>
                          <span className="text-[10px] text-muted-foreground">{u.email}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          u.subscriptionStatus === "pro"
                            ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/15"
                            : "bg-primary/10 text-primary border border-primary/15"
                        }`}>
                          {u.subscriptionStatus}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[9px] text-muted-foreground leading-normal">
                        <div className="flex flex-col">
                          <span>Pay: {u.razorpayPaymentId || "mock_payment"}</span>
                          <span>Ord: {u.razorpayOrderId || "mock_order"}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-muted-foreground font-semibold">
                        {new Date(u.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.section>

      {/* API Monitoring Panel */}
      {apiUsageData && (
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-6"
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-4">
            <Cpu className="h-5 w-5 text-primary" />
            External API Rate Monitors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(apiUsageData.usage).map(([apiName, stats]: [string, any]) => {
              const percentage = stats.limit ? Math.min((stats.count / stats.limit) * 100, 100) : 0;
              return (
                <div key={apiName} className="space-y-2.5 p-4 rounded-xl bg-muted/30 border border-border/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-foreground/80">{apiName}</span>
                    <span className="text-muted-foreground">
                      {stats.count} {stats.limit ? `/ ${stats.limit} calls` : "calls today"}
                    </span>
                  </div>
                  {stats.limit ? (
                    <div className="h-2 w-full bg-muted border border-border/30 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percentage}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          stats.warning ? "bg-amber-500" : "bg-primary"
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden relative">
                      <span className="absolute inset-0 bg-primary/20 animate-pulse" />
                    </div>
                  )}
                  {stats.warning && (
                    <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Approaching 80% daily quota!
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Failed API Logs Accordion list */}
          {apiUsageData.failedLogs && apiUsageData.failedLogs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="h-4 w-4" />
                Recent Connection Fault Diagnostics ({apiUsageData.failedLogs.length})
              </h3>
              <div className="max-h-40 overflow-y-auto border border-border/60 rounded-xl divide-y divide-border/40 bg-muted/10 font-mono text-[11px]">
                {apiUsageData.failedLogs.map((log: any) => (
                  <div key={log._id} className="p-3 hover:bg-muted/30 flex items-start gap-4">
                    <span className="text-rose-500 font-semibold shrink-0">FAIL</span>
                    <span className="font-semibold text-foreground/80 w-24 shrink-0">{log.apiName}</span>
                    <span className="text-muted-foreground/80 flex-1 truncate">{log.errorReason || "Unknown request failure"}</span>
                    <span className="text-muted-foreground/50 shrink-0">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      )}

      {/* Main Aggregation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Daily User Signups Line chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border/85 rounded-2xl p-6 shadow-sm space-y-6"
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            Daily Account Registrations (Last 30 Days)
          </h2>
          <div className="h-[300px] w-full">
            {signupsChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Insufficient data to plot line metrics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signupsChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: 'hsl(var(--card))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Signups"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Daily Signal Volume Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border/85 rounded-2xl p-6 shadow-sm space-y-6"
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Daily Signal Scanning Activity (Last 7 Days)
          </h2>
          <div className="h-[300px] w-full">
            {signalsChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Insufficient data to plot signal volumes.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signalsChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="volume" name="Scan Volume" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Popular Companies watchers bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border/85 rounded-2xl p-6 shadow-sm space-y-6"
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Watched Dream Companies
          </h2>
          <div className="h-[300px] w-full">
            {watchedCompaniesChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No watched companies currently tracked.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={watchedCompaniesChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="watchers" name="Watchers count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Average Scores Panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border/85 rounded-2xl p-6 shadow-sm space-y-6"
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            Real-time Average Hire Scores
          </h2>
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {analyticsData.avgHireScore.map((company: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3.5 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition">
                <span className="font-semibold text-foreground/80 text-sm">{company.companyName}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  company.avgScore >= 70 ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                  company.avgScore >= 40 ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                  'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                }`}>
                  {company.avgScore} / 100
                </span>
              </div>
            ))}
            {analyticsData.avgHireScore.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No score records aggregated yet.
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
