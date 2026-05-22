"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/useAuthStore";

function OAuthSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      // Store token
      Cookies.set("token", token, { expires: 7 });
      localStorage.setItem("token", token);
      
      // Update state and redirect
      checkAuth().then(() => {
        router.push("/");
      });
    } else {
      // If no token, just go home
      router.push("/");
    }
  }, [searchParams, router, checkAuth]);

  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        <p className="text-lg font-medium">Completing login...</p>
      </div>
    </div>
  );
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div></div>}>
      <OAuthSuccessHandler />
    </Suspense>
  );
}
