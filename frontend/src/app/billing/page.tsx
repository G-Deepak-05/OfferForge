"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coins, CreditCard, ShieldCheck, Check } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  experience: string;
  targetCompanies: string[];
  preferredLanguages: string[];
  resumeText?: string;
  credits: number;
}

interface Plan {
  id: string;
  name: string;
  credits: number;
  price: string;
  priceNum: number;
  popular: boolean;
  features: string[];
}

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  // Checkout Form State
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardZip, setCardZip] = useState("");
  
  // UX flow states
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const PLANS: Plan[] = [
    {
      id: "starter",
      name: "Starter Pack",
      credits: 5,
      price: "$9.99",
      priceNum: 9.99,
      popular: false,
      features: [
        "5 Interview Suggestions",
        "Resume Personalization",
        "Stealth Overlay Mode Access",
        "24/7 AI System Access"
      ]
    },
    {
      id: "success",
      name: "Success Pack",
      credits: 25,
      price: "$29.99",
      priceNum: 29.99,
      popular: true,
      features: [
        "25 Interview Suggestions",
        "Resume Personalization",
        "Stealth Overlay Mode Access",
        "Priority AI Suggest Model (DeepSeek)",
        "Save 20% compared to Starter"
      ]
    },
    {
      id: "executive",
      name: "Executive Pack",
      credits: 100,
      price: "$79.99",
      priceNum: 79.99,
      popular: false,
      features: [
        "100 Interview Suggestions",
        "Resume Personalization",
        "Stealth Overlay Mode Access",
        "Priority AI Suggest Model (DeepSeek)",
        "Save 40% compared to Starter",
        "Dedicated Email Support"
      ]
    }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (!stored) {
        router.push("/login");
      } else {
        const u = JSON.parse(stored);
        setUser(u);
      }
    }
  }, [router]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const formatted = value.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(formatted.slice(0, 19)); // 16 digits + 3 spaces
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
    } else {
      setCardExpiry(value);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setCardCvc(value.slice(0, 4));
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setCardZip(value.slice(0, 5));
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlan) return;
    
    if (cardNumber.replace(/\s/g, "").length < 16) {
      setErrorMsg("Please enter a valid 16-digit card number.");
      return;
    }
    if (cardExpiry.length < 5) {
      setErrorMsg("Please enter a valid expiry date (MM/YY).");
      return;
    }
    if (cardCvc.length < 3) {
      setErrorMsg("Please enter a valid 3 or 4-digit security code.");
      return;
    }
    if (cardZip.length < 5) {
      setErrorMsg("Please enter a valid 5-digit ZIP code.");
      return;
    }

    setProcessing(true);
    setErrorMsg("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Simulate payment gateway processing delay
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const response = await fetch(`${apiUrl}/api/auth/user/${user.id}/credits?amount=${selectedPlan.credits}`, {
        method: "POST",
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Sync localStorage and state
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess(true);
        
        // Reset card fields
        setCardName("");
        setCardNumber("");
        setCardExpiry("");
        setCardCvc("");
        setCardZip("");
      } else {
        throw new Error("Unable to add credits to user account.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Payment processing succeeded but crediting failed. Please retry.");
    } finally {
      setProcessing(false);
    }
  };

  const closeSuccess = () => {
    setSuccess(false);
    setSelectedPlan(null);
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-6 rounded-2xl border border-panel-border bg-[#15171a]/50">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-lg border border-panel-border bg-neutral-900/50 hover:bg-neutral-800 flex items-center justify-center text-text-secondary hover:text-foreground transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-1.5 font-bold">
              🦜 Parakeet Credits & Billing
            </h1>
            <p className="text-xs text-text-muted mt-0.5 font-semibold">
              Top up your balance to get instant real-time AI Copilot answers. Simulating payments via Stripe Checkout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-panel-border rounded-lg text-xs font-black">
          <Coins size={14} className="text-warning animate-pulse" />
          <span className="text-text-secondary">Current Balance:</span>
          <span className="text-accent ml-1 text-sm font-extrabold">{user.credits} Credits</span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`glass-panel border rounded-2xl p-6 flex flex-col justify-between transition duration-300 relative ${
              plan.popular 
                ? "border-accent bg-[#191b22]/70 shadow-2xl glow-indigo" 
                : "border-panel-border bg-[#15171a]/40 hover:border-panel-border/80"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white font-extrabold text-[9px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                Most Popular
              </span>
            )}

            <div>
              <h3 className="text-sm font-extrabold text-foreground tracking-wide uppercase">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-black tracking-tight text-foreground">{plan.price}</span>
                <span className="text-[10px] font-bold text-text-muted ml-1.5 uppercase">one-time payment</span>
              </div>
              
              <div className="mt-3 flex items-center gap-1.5 text-xs text-accent font-bold bg-accent/5 border border-accent/10 rounded-lg p-2.5">
                <Coins size={14} className="text-warning" />
                <span>+ {plan.credits} AI Suggestions</span>
              </div>

              {/* Features List */}
              <ul className="mt-6 space-y-2.5 border-t border-panel-border/30 pt-4 text-xs font-semibold text-text-secondary">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check size={12} className="text-success mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setSelectedPlan(plan)}
              className={`w-full mt-8 py-2.5 rounded-lg text-xs font-extrabold transition shadow-md ${
                plan.popular
                  ? "bg-accent hover:bg-accent-hover text-white shadow-accent/15"
                  : "bg-neutral-900 border border-panel-border hover:bg-neutral-800 text-foreground"
              }`}
            >
              Purchase Pack
            </button>
          </div>
        ))}
      </div>

      {/* Stripe Checkout Simulator Dialog */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-panel-border bg-[#111215] shadow-2xl overflow-hidden animate-fade-in">
            
            {/* Modal Header */}
            <div className="bg-[#17181c] border-b border-panel-border px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#4f46e5] text-white px-2 py-0.5 rounded font-black tracking-wider uppercase">Stripe</span>
                <span className="text-xs font-bold text-text-secondary">Simulated Checkout</span>
              </div>
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setSuccess(false);
                  setErrorMsg("");
                }}
                className="text-text-muted hover:text-foreground text-xs font-semibold px-2 py-0.5 rounded border border-panel-border hover:bg-neutral-800"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {success ? (
                /* Success Animation View */
                <div className="text-center py-6 space-y-4 animate-fade-in">
                  <div className="w-16 h-16 bg-success-light border border-success/30 rounded-full flex items-center justify-center mx-auto text-success text-3xl animate-bounce">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-extrabold text-foreground text-base">Payment Succeeded!</h3>
                    <p className="text-[11px] text-text-muted mt-1 max-w-[280px] mx-auto">
                      Stripe processed the transaction successfully. **+{selectedPlan.credits} credits** have been added to your candidate profile.
                    </p>
                  </div>

                  <div className="bg-neutral-900 border border-panel-border p-3.5 rounded-xl font-mono text-[10px] text-text-muted space-y-1 text-left">
                    <div><span className="font-bold text-foreground">Transaction:</span> txn_stripesim_{Math.floor(Math.random() * 100000000)}</div>
                    <div><span className="font-bold text-foreground">Amount:</span> {selectedPlan.price} USD</div>
                    <div><span className="font-bold text-foreground">Method:</span> Visa ending in {cardNumber.slice(-4) || "4242"}</div>
                    <div><span className="font-bold text-foreground">User Balance:</span> {user.credits} Credits</div>
                  </div>

                  <button
                    onClick={closeSuccess}
                    className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-lg transition"
                  >
                    Return to Pricing
                  </button>
                </div>
              ) : (
                /* Card Input Form View */
                <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs font-semibold">
                  
                  {/* Order Summary banner */}
                  <div className="flex justify-between items-center bg-[#17181c] p-3 rounded-lg border border-panel-border/60">
                    <div>
                      <div className="font-bold text-foreground">{selectedPlan.name}</div>
                      <div className="text-[10px] text-text-muted">Adds {selectedPlan.credits} Copilot Queries</div>
                    </div>
                    <div className="text-base font-black text-foreground">{selectedPlan.price}</div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-error-light/10 border border-error/20 text-error rounded-lg">
                      {errorMsg}
                    </div>
                  )}

                  {/* Cardholder Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-secondary">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="bg-neutral-900 border border-panel-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent"
                      required
                    />
                  </div>

                  {/* Card Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-secondary flex items-center gap-1">
                      <CreditCard size={13} />
                      <span>Card Number</span>
                    </label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="bg-neutral-900 border border-panel-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent font-mono"
                      required
                    />
                  </div>

                  {/* Expiry / CVC / Zip */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-text-secondary">Expiration</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="bg-neutral-900 border border-panel-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent font-mono text-center"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-text-secondary" title="Card Verification Value">CVC</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvc}
                        onChange={handleCvcChange}
                        className="bg-neutral-900 border border-panel-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent font-mono text-center"
                        maxLength={4}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-text-secondary">ZIP Code</label>
                      <input
                        type="text"
                        placeholder="90210"
                        value={cardZip}
                        onChange={handleZipChange}
                        className="bg-neutral-900 border border-panel-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent font-mono text-center"
                        maxLength={5}
                        required
                      />
                    </div>
                  </div>

                  {/* Stripe Security Banner */}
                  <div className="flex items-center gap-1.5 justify-center py-2 text-[10px] text-text-muted">
                    <ShieldCheck size={13} className="text-success" />
                    <span>Payments secured. Simulated Stripe Checkout Sandbox.</span>
                  </div>

                  {/* Pay button */}
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-bold transition shadow-lg shadow-accent/15 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Verifying Card...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay {selectedPlan.price}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
