import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { socket } from "@/lib/socket";

export function CompanyChart({ companyId }: { companyId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await api.get(`/signals/${companyId}`);
        const formatted = res.data.map((sig: any) => ({
          date: new Date(sig.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: sig.hireScore
        }));
        setData(formatted);
      } catch (err) {
        console.error("Failed to load signals", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSignals();

    // Listen for updates to dynamically refresh the chart
    const handleUpdate = (update: any) => {
      if (update.companyId === companyId) {
        fetchSignals();
      }
    };

    socket.on("signal:updated", handleUpdate);
    
    return () => {
      socket.off("signal:updated", handleUpdate);
    };
  }, [companyId]);

  if (loading) return <div className="h-32 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (data.length === 0) return <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No historical data yet.</div>;

  return (
    <div className="h-32 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={[0, 100]} hide />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ display: 'none' }}
          />
          <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
