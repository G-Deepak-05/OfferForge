"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ReplayTimeline } from "../../../components/Interview/ReplayTimeline";
import { Sparkles, Trophy, Award, ThumbsUp, ChevronLeft, Calendar } from "lucide-react";

interface FeedbackData {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
  timeComplexity: string;
  spaceComplexity: string;
  codeQualityScore: number;
  timelineReplay: string; // JSON string
  createdAt: string;
}

export default function FeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (!stored) {
        router.push("/login");
      } else {
        const u = JSON.parse(stored);
        if (!u.college || u.college === "Not specified") {
          router.push("/onboarding");
        } else {
          fetchFeedbackDetails();
        }
      }
    }
  }, [id, router]);

  const fetchFeedbackDetails = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/interviews/${id}/end`, {
        method: "POST", // Ends and gets or just retrieves completed feedback
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      } else {
        throw new Error(`Failed to load feedback report (Status: ${response.status})`);
      }
    } catch (e) {
      console.error("Feedback load error:", e);
      setError(e instanceof Error ? e.message : "Failed to establish connection with OfferForge feedback service.");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-red-400">
        <h2 className="text-lg font-bold">Feedback Report Offline</h2>
        <p className="text-xs text-text-muted">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-neutral-900 border border-panel-border rounded-lg text-xs font-semibold text-foreground hover:bg-neutral-800 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (loading || !feedback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <span className="text-xs text-text-muted">Synthesizing AI evaluation report...</span>
      </div>
    );
  }

  let eventsList = [];
  try {
    eventsList = JSON.parse(feedback.timelineReplay);
  } catch (e) {
    eventsList = [];
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header bar */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-foreground transition"
        >
          <ChevronLeft size={16} />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Calendar size={13} />
          <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Hero Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Overall Score */}
        <div className="glass-panel p-6 rounded-2xl border border-panel-border bg-[#15171a]/50 text-center flex flex-col justify-center items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
            <Trophy size={26} />
          </div>
          <div>
            <h4 className="text-xs text-text-muted font-bold uppercase tracking-wider">Overall Score</h4>
            <p className="text-4xl font-extrabold text-foreground mt-1">{feedback.overallScore}/100</p>
          </div>
        </div>

        {/* Code Quality */}
        <div className="glass-panel p-6 rounded-2xl border border-panel-border bg-[#15171a]/50 text-center flex flex-col justify-center items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-accent-violet/15 border border-accent-violet/20 flex items-center justify-center text-accent-violet">
            <Award size={26} />
          </div>
          <div>
            <h4 className="text-xs text-text-muted font-bold uppercase tracking-wider">Code Quality Score</h4>
            <p className="text-4xl font-extrabold text-foreground mt-1">{feedback.codeQualityScore}/10</p>
          </div>
        </div>

        {/* Space/Time Complexities */}
        <div className="glass-panel p-6 rounded-2xl border border-panel-border bg-[#15171a]/50 text-center flex flex-col justify-center items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-success-light text-success border border-success/20 flex items-center justify-center">
            <Sparkles size={26} />
          </div>
          <div>
            <h4 className="text-xs text-text-muted font-bold uppercase tracking-wider">Estimated Complexity</h4>
            <div className="flex gap-4 mt-2 justify-center font-mono font-bold text-sm">
              <span className="text-success">Time: {feedback.timeComplexity}</span>
              <span className="text-accent-violet">Space: {feedback.spaceComplexity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Strengths */}
        <div className="glass-panel p-6 rounded-2xl border border-panel-border bg-[#15171a]/40 space-y-4">
          <h3 className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1.5 border-b border-panel-border/30 pb-2.5">
            <ThumbsUp size={14} />
            Key Strengths
          </h3>
          <ul className="space-y-3">
            {feedback.strengths.map((str, idx) => (
              <li key={idx} className="flex gap-3 items-start text-xs leading-relaxed text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="glass-panel p-6 rounded-2xl border border-panel-border bg-[#15171a]/40 space-y-4">
          <h3 className="text-xs font-bold text-error uppercase tracking-wider flex items-center gap-1.5 border-b border-panel-border/30 pb-2.5">
            <Sparkles size={14} className="text-error" />
            Areas to Refine
          </h3>
          <ul className="space-y-3">
            {feedback.weaknesses.map((weak, idx) => (
              <li key={idx} className="flex gap-3 items-start text-xs leading-relaxed text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 flex-shrink-0" />
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Recommendation Block */}
      <div className="glass-panel p-6 rounded-2xl border border-panel-border bg-accent-light/5 space-y-3">
        <h3 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={14} />
          Personalized Preparation Guidance
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed font-semibold">
          {feedback.recommendations}
        </p>
      </div>

      {/* Interview Replay Timeline */}
      <div className="space-y-5 pt-4">
        <h3 className="text-sm font-bold text-foreground tracking-wide text-center uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-violet">
          Detailed Interview Replay Timeline
        </h3>
        <ReplayTimeline events={eventsList} />
      </div>

    </div>
  );
}
