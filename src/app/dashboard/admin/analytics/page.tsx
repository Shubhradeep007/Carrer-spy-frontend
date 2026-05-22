"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, Users, Radio, Bell, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminAnalyticsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get("/admin/analytics");
        setData(response.data);
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-red-500">Failed to load analytics data.</div>;
  }

  // Format data for Recharts
  const chartData = data.topWatchedCompanies.map((c: any) => ({
    name: c.companyName,
    watchers: c.watchers
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
      <p className="text-muted-foreground mb-8">System overview and aggregated metrics.</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-3xl font-bold">{data.users.total}</h3>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            <span className="text-green-500 font-medium">+{data.users.thisMonth}</span> this month
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Signals Collected</p>
              <h3 className="text-3xl font-bold">{data.signals.total}</h3>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            <span className="text-green-500 font-medium">+{data.signals.today}</span> today
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Alerts Sent</p>
              <h3 className="text-3xl font-bold">{data.alerts.total}</h3>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            <span className="text-green-500 font-medium">+{data.alerts.thisWeek}</span> this week
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Watched Chart */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Most Watched Companies
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="watchers" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Score List */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Average Hire Scores</h2>
          <div className="space-y-4">
            {data.avgHireScore.map((company: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="font-medium">{company.companyName}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  company.avgScore >= 70 ? 'bg-red-500/10 text-red-500' :
                  company.avgScore >= 40 ? 'bg-orange-500/10 text-orange-500' :
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {company.avgScore}
                </span>
              </div>
            ))}
            {data.avgHireScore.length === 0 && (
              <div className="text-center p-6 text-muted-foreground">No score data available yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
