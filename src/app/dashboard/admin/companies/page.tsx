"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get("/admin/companies");
        setCompanies(response.data);
      } catch (error) {
        console.error("Failed to load companies", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Watched Companies</h1>
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-4 font-medium">Company Name</th>
              <th className="p-4 font-medium">Target Role</th>
              <th className="p-4 font-medium">Watcher</th>
              <th className="p-4 font-medium">Alerts Active</th>
              <th className="p-4 font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies.map((c) => (
              <tr key={c._id} className="hover:bg-muted/30">
                <td className="p-4 font-medium">{c.companyName}</td>
                <td className="p-4 text-muted-foreground">{c.targetRole || "Any"}</td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{c.userId?.name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{c.userId?.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  {c.alertActive ? (
                    <span className="text-green-500 font-medium">Yes</span>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </td>
                <td className="p-4 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
