"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        router.push("/");
      }
    }
  }, [router]);

  const handleSsoLogin = async (provider: string) => {
    setLoadingProvider(provider);
    
    // Simulate SSO provider retrieval data (e.g. Google/GitHub payload)
    const email = provider === "google" ? "deepak.sde@gmail.com" : "deepak-git@github.com";
    const name = "Deepak Kumar";

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/auth/sso`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name, provider }),
      });

      if (response.ok) {
        const user = await response.json();
        localStorage.setItem("user", JSON.stringify(user));
        router.push("/");
      } else {
        alert("SSO authentication refused by backend server.");
      }
    } catch (e) {
      console.error("Auth error:", e);
      alert("Auth Gateway connection refused. Make sure Spring Boot is running on port 8080.");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-220px)]">
      
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-panel-border bg-[#15171a]/50 text-center space-y-6 glow-indigo animate-fade-in">
        
        {/* Sparkle Header Icon */}
        <div className="mx-auto w-12 h-12 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
          <Sparkles size={22} className="animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground" id="login-heading">
            Forge Your Career
          </h1>
          <p className="text-xs text-text-muted">
            Sign in to start practicing realistic AI mock interviews.
          </p>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-3 pt-2">
          {/* Google SSO */}
          <button
            onClick={() => handleSsoLogin("google")}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-neutral-900 border border-panel-border hover:bg-neutral-800 text-xs font-bold text-foreground rounded-lg transition duration-200 disabled:opacity-50"
            id="google-login-btn"
          >
            {/* SVG Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>{loadingProvider === "google" ? "Connecting..." : "Sign in with Google"}</span>
          </button>

          {/* GitHub SSO */}
          <button
            onClick={() => handleSsoLogin("github")}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-neutral-900 border border-panel-border hover:bg-neutral-800 text-xs font-bold text-foreground rounded-lg transition duration-200 disabled:opacity-50"
            id="github-login-btn"
          >
            {/* SVG Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            <span>{loadingProvider === "github" ? "Connecting..." : "Sign in with GitHub"}</span>
          </button>
        </div>

        <p className="text-[10px] text-text-muted">
          SSO integrations are configured via provider clients. Authentication is completely free.
        </p>

      </div>
    </div>
  );
}
