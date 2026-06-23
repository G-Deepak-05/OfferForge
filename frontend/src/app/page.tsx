"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatsOverview } from "../components/Dashboard/StatsOverview";
import { WeakTopicAnalyzer } from "../components/Dashboard/WeakTopicAnalyzer";
import { Briefcase, Calendar, ChevronRight, Play, User as UserIcon, Plus } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  experience: string;
  targetCompanies: string[];
  preferredLanguages: string[];
}

interface InterviewSession {
  id: string;
  company: string;
  roundType: string;
  status: string;
  createdAt: string;
}

interface Analytics {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  accuracy: number;
  strongTopics: string[];
  weakTopics: string[];
  weeklyProgress: Array<{
    week: string;
    interviewsCompleted: number;
    problemsSolved: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
  // Dashboard states
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Interview Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("Oracle");
  const [selectedRound, setSelectedRound] = useState("DSA");
  const [startingSession, setStartingSession] = useState(false);

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
          setUser(u);
          fetchDashboardData(u.id);
        }
      }
    }
  }, [router]);

  const fetchDashboardData = async (userId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Verify user profile exists in backend to handle local storage desync
      const userRes = await fetch(`${apiUrl}/api/auth/user/${userId}`);
      if (userRes.status === 404) {
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }
      if (!userRes.ok) {
        throw new Error(`Failed to verify user profile (Status: ${userRes.status})`);
      }
      
      // Fetch analytics
      const analRes = await fetch(`${apiUrl}/api/analytics/user/${userId}`);
      let analData: Analytics;
      if (analRes.ok) {
        analData = await analRes.json();
      } else {
        throw new Error(`Failed to fetch analytics (Status: ${analRes.status})`);
      }

      // Fetch history
      const histRes = await fetch(`${apiUrl}/api/interviews/user/${userId}`);
      let histData: InterviewSession[] = [];
      if (histRes.ok) {
        histData = await histRes.json();
      } else {
        throw new Error(`Failed to fetch interview history (Status: ${histRes.status})`);
      }

      setAnalytics(analData);
      setHistory(histData);
    } catch (e) {
      console.error("Dashboard loading error:", e);
      setError(e instanceof Error ? e.message : "Failed to establish connection with OfferForge API backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!user) return;
    setStartingSession(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/interviews/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          company: selectedCompany,
          roundType: selectedRound,
        }),
      });

      if (response.ok) {
        const interview = await response.json();
        router.push(`/interview/${interview.id}`);
      } else {
        throw new Error(`Failed to start session (Status: ${response.status})`);
      }
    } catch (e) {
      console.error("Mock round trigger failed:", e);
      alert(e instanceof Error ? e.message : "Failed to create mock session. Try again.");
    } finally {
      setStartingSession(false);
      setShowModal(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-red-400">
        <h2 className="text-lg font-bold">Dashboard Offline</h2>
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

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <span className="text-xs text-text-muted">Loading candidate portfolio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-6 rounded-2xl border border-panel-border bg-[#15171a]/50">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            Welcome Back, {user.name}
            <span className="text-accent">.</span>
          </h1>
          <p className="text-xs text-text-muted mt-1 font-semibold">
            Track metrics, review O(N) complexity paths, and forge job offers.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-extrabold transition shadow-lg shadow-accent/15"
            id="start-interview-btn"
          >
            <Plus size={14} />
            <span>Start Mock Round</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-neutral-900 border border-panel-border hover:bg-neutral-800 text-xs font-semibold text-text-muted hover:text-foreground rounded-lg transition"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Analytics Rows */}
      {analytics && (
        <>
          <StatsOverview
            totalInterviews={analytics.totalInterviews}
            completedInterviews={analytics.completedInterviews}
            averageScore={analytics.averageScore}
            accuracy={analytics.accuracy}
            weeklyProgress={analytics.weeklyProgress}
          />

          <WeakTopicAnalyzer
            strongTopics={analytics.strongTopics}
            weakTopics={analytics.weakTopics}
          />
        </>
      )}

      {/* History Table */}
      <div className="glass-panel p-6 rounded-2xl border border-panel-border bg-[#15171a]/50">
        <h3 className="text-sm font-bold text-foreground tracking-wide mb-4">Interview Logs</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-panel-border text-text-muted font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Round</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((session, idx) => (
                <tr key={idx} className="border-b border-panel-border/40 hover:bg-[#1a1c1e]/40 transition duration-150">
                  <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                    <Briefcase size={13} className="text-accent" />
                    {session.company}
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary">{session.roundType}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${
                        session.status === "COMPLETED"
                          ? "bg-success-light text-success border border-success/10"
                          : "bg-warning/15 text-warning border border-warning/10"
                      }`}
                    >
                      {session.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-text-muted flex items-center gap-1.5 mt-1 border-0">
                    <Calendar size={12} />
                    {new Date(session.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {session.status === "COMPLETED" ? (
                      <a
                        href={`/feedback/${session.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-violet hover:text-purple-400 transition"
                      >
                        <span>View Replay</span>
                        <ChevronRight size={12} />
                      </a>
                    ) : (
                      <a
                        href={`/interview/${session.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:text-indigo-400 transition"
                      >
                        <span>Resume</span>
                        <ChevronRight size={12} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-text-muted italic">
                    No mock interviews found. Click &quot;Start Mock Round&quot; to begin!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Interview Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-panel-border bg-[#15171a] shadow-2xl space-y-5">
            <h2 className="text-base font-bold text-foreground tracking-wide">Configure Mock Interview</h2>
            
            <div className="space-y-4 text-xs">
              {/* Company Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-text-secondary">Target Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full bg-neutral-900 border border-panel-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-accent font-semibold"
                >
                  <option value="Oracle">Oracle</option>
                  <option value="Google">Google</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Microsoft">Microsoft</option>
                  <option value="Atlassian">Atlassian</option>
                  <option value="Flipkart">Flipkart</option>
                </select>
              </div>

              {/* Round Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-text-secondary">Interview Round Type</label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="w-full bg-neutral-900 border border-panel-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-accent font-semibold"
                >
                  <option value="DSA">Data Structures & Algorithms</option>
                  <option value="Behavioral">Behavioral (STAR evaluation)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={handleStartInterview}
                disabled={startingSession}
                className="flex-1 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-extrabold text-xs rounded-lg transition shadow-md shadow-accent/20 flex items-center justify-center gap-1.5"
                id="launch-mock-btn"
              >
                <Play size={13} />
                <span>{startingSession ? "Launching..." : "Launch Interview"}</span>
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-neutral-900 border border-panel-border hover:bg-neutral-800 text-xs font-semibold text-text-muted rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
