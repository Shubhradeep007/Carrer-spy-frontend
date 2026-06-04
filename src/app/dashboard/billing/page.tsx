"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { 
  Check, ShieldAlert, Loader2, ArrowLeft, CreditCard, HelpCircle
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/Footer";

interface Plan {
  id: "free" | "basic" | "pro";
  name: string;
  price: string;
  description: string;
  features: string[];
  color: string;
  activeRing: string;
  badge?: string;
}

function BillingPageContent() {
  const { user, checkAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [razorpayConfigured, setRazorpayConfigured] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dynamic injection of Razorpay Checkout script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Sync auth and status
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push("/");
      return;
    }
    
    const fetchPaymentStatus = async () => {
      try {
        const res = await api.get("/payments/status");
        setRazorpayConfigured(res.data.isRazorpayConfigured);
      } catch (err) {
        console.error("Failed to fetch payment status:", err);
      }
    };
    
    if (isAuthenticated) {
      fetchPaymentStatus();
    }
  }, [isAuthenticated, router]);

  // Handle URL callback parameters (fallback mock checkouts if redirected)
  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    const plan = searchParams.get("plan");
    const isMock = searchParams.get("mock") === "true";

    if (checkoutStatus === "success" && plan) {
      const upgradeUser = async () => {
        try {
          if (isMock) {
            // Apply mock upgrade on backend immediately
            await api.post("/payments/mock-upgrade", { plan });
          }
          await checkAuth(); // refresh user store
          setStatusMessage({
            type: "success",
            text: `Transaction completed successfully! Welcome to the ${plan.toUpperCase()} tier.`
          });
        } catch (err) {
          console.error("Upgrade error:", err);
        }
      };
      upgradeUser();
      
      // Clean query params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (checkoutStatus === "cancel") {
      setStatusMessage({
        type: "error",
        text: "Checkout cancelled. Feel free to upgrade whenever you're ready."
      });
      // Clean query params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, checkAuth]);

  const currentPlan = user?.subscriptionStatus || "free";

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free Plan",
      price: "₹0",
      description: "Ideal for testing out core spying functionalities.",
      features: [
        "Track 1 target company",
        "Upload 1 active resume/CV",
        "Standard heuristic match-score",
        "Web dashboard telemetry logs"
      ],
      color: "border-border/60 bg-card/45",
      activeRing: "ring-2 ring-border shadow-md"
    },
    {
      id: "basic",
      name: "Basic Plan",
      price: "₹500",
      description: "For active candidates targeting a few key companies.",
      features: [
        "Track up to 3 target companies",
        "Upload up to 2 active resumes",
        "Heuristic match-score & priority logs",
        "AI Outreach Campaign draft (Standard)",
        "Email telemetry notifications"
      ],
      color: "border-primary/20 bg-card/65 relative border-2",
      activeRing: "ring-2 ring-primary shadow-md shadow-primary/10",
      badge: "Most Popular"
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "₹1500",
      description: "For elite scouts demanding complete intelligence coverage.",
      features: [
        "Track up to 10 target companies",
        "Upload unlimited active resumes",
        "Advanced ATS Match AI tuning",
        "AI Outreach Campaign drafts (Unlimited)",
        "Real-time alerts via Email & Slack",
        "Priority telemetry update cycles"
      ],
      color: "border-cyan-500/25 bg-card/80 border-2",
      activeRing: "ring-2 ring-cyan-500 shadow-md shadow-cyan-500/10",
      badge: "Full Access"
    }
  ];

  const handleUpgrade = async (planId: "basic" | "pro") => {
    setLoadingPlan(planId);
    setStatusMessage(null);
    try {
      if (!razorpayConfigured) {
        // Run mock upgrade instantly
        const res = await api.post("/payments/mock-upgrade", { plan: planId });
        await checkAuth(); // Refresh user profile
        setStatusMessage({
          type: "success",
          text: res.data.message || `Mock upgraded successfully to ${planId.toUpperCase()}!`
        });
        setLoadingPlan(null);
      } else {
        // Call backend to create Razorpay Order
        const res = await api.post("/payments/create-order", { plan: planId });
        const { orderId, amount, currency, mock, keyId } = res.data;

        if (mock) {
          // If returned mock details from backend, execute simple verification upgrade
          const verifyRes = await api.post("/payments/verify", {
            razorpay_order_id: orderId,
            plan: planId
          });
          await checkAuth();
          setStatusMessage({
            type: "success",
            text: verifyRes.data.message || `Mock upgraded successfully to ${planId.toUpperCase()}!`
          });
          setLoadingPlan(null);
          return;
        }

        // Open Razorpay Checkout Modal
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: "Career Spy",
          description: `${planId.toUpperCase()} Subscription Plan`,
          order_id: orderId,
          handler: async function (response: any) {
            setLoadingPlan(planId);
            try {
              const verifyRes = await api.post("/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planId
              });
              await checkAuth();
              setStatusMessage({
                type: "success",
                text: verifyRes.data.message || `Upgraded successfully to ${planId.toUpperCase()}!`
              });
            } catch (err: any) {
              console.error("Verification failed:", err);
              setStatusMessage({
                type: "error",
                text: err.response?.data?.message || "Payment verification failed."
              });
            } finally {
              setLoadingPlan(null);
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
          },
          theme: {
            color: "#06b6d4",
          },
          modal: {
            ondismiss: function () {
              setLoadingPlan(null);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error("Upgrade request failed:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Upgrade transaction failed."
      });
      setLoadingPlan(null);
    }
  };

  const handleDowngradeMock = async () => {
    setLoadingPlan("free");
    try {
      await api.post("/payments/mock-upgrade", { plan: "free" });
      await checkAuth();
      setStatusMessage({
        type: "success",
        text: "Account reset to Free plan. Watchlist and resume upload limits have been applied."
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlan(null);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background cyber-grid flex flex-col justify-between">
      <div className="container mx-auto px-4 max-w-5xl space-y-8 py-12 flex-1">
        
        {/* Header */}
        <header className="space-y-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              Subscription Management
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground pt-2">Choose Your Spy Level</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Unlock advanced telemetry matching, outreach generation, and watch limits for your target workspace.
            </p>
          </div>
        </header>

        {/* Sandbox alert if Razorpay keys are not found */}
        {!razorpayConfigured && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-500/90 leading-relaxed flex items-start gap-2.5 max-w-2xl mx-auto">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <span className="font-extrabold block uppercase tracking-wide text-[10px] text-amber-400 mb-1">
                College Project Sandbox Mode Active
              </span>
              Razorpay API Keys are not set in the backend env. Simulated mock checkouts are enabled. Clicking upgrade will instantly unlock the selected tier for demonstration!
            </div>
          </div>
        )}

        {/* Callback Alert Status Message */}
        {statusMessage && (
          <div className={`p-4 rounded-xl border max-w-2xl mx-auto text-xs font-semibold leading-relaxed flex items-start gap-2.5 ${
            statusMessage.type === "success" 
              ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400" 
              : "border-rose-500/25 bg-rose-500/5 text-rose-400"
          }`}>
            <Check className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div>{statusMessage.text}</div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isFree = plan.id === "free";

            return (
              <div 
                key={plan.id}
                className={`rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md transition-all duration-300 ${plan.color} ${
                  isCurrent ? plan.activeRing : "hover:border-border/100"
                }`}
              >
                <div>
                  {/* Badge */}
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-extrabold tracking-tight text-foreground">{plan.name}</h3>
                    {plan.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded-md">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-1 text-foreground">
                    <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-xs text-muted-foreground font-medium">/month</span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{plan.description}</p>

                  <hr className="my-5 border-border/40" />

                  {/* Features List */}
                  <ul className="space-y-3">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground/95">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  {isCurrent ? (
                    <Button 
                      className="w-full text-xs font-bold rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-default"
                      disabled
                    >
                      Active Plan
                    </Button>
                  ) : isFree ? (
                    <Button 
                      onClick={handleDowngradeMock}
                      className="w-full text-xs font-bold rounded-xl border hover:bg-muted"
                      variant="outline"
                      disabled={loadingPlan !== null}
                    >
                      {loadingPlan === "free" ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Downgrade / Reset"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id as "basic" | "pro")}
                      disabled={loadingPlan !== null}
                      className={`w-full text-xs font-bold rounded-xl gap-2 ${
                        plan.id === "pro" 
                          ? "bg-cyan-500 hover:bg-cyan-600 text-black shadow-cyan-500/10" 
                          : "bg-primary hover:bg-primary/95 text-white"
                      }`}
                    >
                      {loadingPlan === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 shrink-0" />
                          Upgrade Workspace
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Bottom support links */}
        <div className="text-center pt-8 text-[11px] text-muted-foreground/80 flex justify-center items-center gap-1.5 font-medium">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Demo checkout simulation. No charges will be applied.</span>
        </div>

      </div>
      <Footer />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  );
}
