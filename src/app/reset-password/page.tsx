"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { CheckCircle2, AlertCircle, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setStatus("error");
      setMessage("Reset token is missing.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
        setStatus("error");
        setMessage("Password must be at least 6 characters.");
        return;
    }

    setStatus("loading");
    try {
      const { data } = await api.post("/auth/reset-password", { token, newPassword: password });
      setStatus("success");
      setMessage(data.message || "Password reset successfully!");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Failed to reset password. The link may be expired.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
        <p className="text-muted-foreground mb-8 text-center">{message}</p>
        <Button className="w-full" onClick={() => router.push("/")}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-card border rounded-2xl p-8 shadow-sm">
      <div className="flex flex-col items-center mb-6">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground text-center">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">New Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Confirm Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {status === "error" && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {message}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Reset Password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Suspense fallback={
            <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    </div>
  );
}
