import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { socket } from "@/lib/socket";

export function CompanyChart({ 
  companyId, 
  height = 128, 
  showAxes = false 
}: { 
  companyId: string; 
  height?: number; 
  showAxes?: boolean; 
}) {
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

  if (loading) return <div style={{ height }} className="flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (data.length === 0) return <div style={{ height }} className="flex items-center justify-center text-sm text-muted-foreground font-semibold">No historical signals captured yet.</div>;

  return (
    <div style={{ height }} className="w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: showAxes ? 15 : 0, left: showAxes ? -15 : -25, bottom: showAxes ? 10 : 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            hide={!showAxes} 
            stroke="var(--color-muted-foreground, #888)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis 
            domain={[0, 100]} 
            hide={!showAxes} 
            stroke="var(--color-muted-foreground, #888)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dx={-4}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid var(--color-border, #e2e8f0)', 
              backgroundColor: 'var(--color-background, #fff)',
              color: 'var(--color-foreground, #000)',
              fontSize: '11px',
              fontWeight: 'bold',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' 
            }}
            labelStyle={{ display: 'none' }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="var(--color-primary, #3b82f6)" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#colorScore)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
