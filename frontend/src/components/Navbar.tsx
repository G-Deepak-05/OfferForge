"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Coins, Sparkles } from "lucide-react";

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

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Read initial user state
    const loadUser = () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse user session", e);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();

    // Listen for storage events (updates in credits on billing page)
    window.addEventListener("storage", loadUser);
    
    // Poll localstorage every 2 seconds for immediate sub-route synchronization
    const interval = setInterval(loadUser, 2000);

    return () => {
      window.removeEventListener("storage", loadUser);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-panel-border bg-[#0d0e10]/80">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" id="header-logo-link">
          <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-violet">
            OFFERFORGE
          </span>
          <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 border border-accent/20 rounded">
            AI Mock
          </span>
        </Link>

        {/* Profile actions */}
        <nav className="flex items-center gap-5">
          <Link href="/" className="text-xs text-text-muted hover:text-foreground font-semibold transition" id="nav-dashboard">
            Dashboard
          </Link>
          <Link href="/copilot" className="text-xs text-text-muted hover:text-foreground font-semibold transition flex items-center gap-1">
            <Sparkles size={12} className="text-accent-violet" />
            <span>Live Copilot</span>
          </Link>
          <Link href="/onboarding" className="text-xs text-text-muted hover:text-foreground font-semibold transition" id="nav-profile">
            Profile
          </Link>
          
          {user && (
            <>
              {/* Credits Balance Display */}
              <Link 
                href="/billing"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-panel-border/80 rounded-lg text-xs font-black text-foreground hover:text-accent transition duration-150"
              >
                <Coins size={13} className="text-warning animate-pulse" />
                <span>🦜 {user.credits} Credits</span>
              </Link>

              {/* Avatar circle */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-xs font-bold text-white border border-panel-border shadow-md select-none">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
