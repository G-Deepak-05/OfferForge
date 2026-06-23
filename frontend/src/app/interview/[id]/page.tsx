"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CodeArena } from "../../../components/Interview/CodeArena";

interface Question {
  id: string;
  title: string;
  problemStatement: string;
  difficulty: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleTestCases: string;
}

interface InterviewSession {
  id: string;
  company: string;
  roundType: string;
  status: string;
  currentQuestion: Question;
  conversationHistory: string; // JSON string
}

interface SubmissionResponse {
  status: string;
  runtimeMs: number;
  memoryKb: number;
  score?: number;
}

export default function InterviewRoomPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
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
          fetchSessionDetails();
        }
      }
    }
  }, [id, router]);

  const fetchSessionDetails = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/interviews/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        throw new Error(`Failed to load interview session (Status: ${response.status})`);
      }
    } catch (e) {
      console.error("Session load error:", e);
      setError(e instanceof Error ? e.message : "Failed to establish connection with OfferForge API backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string): Promise<string> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/interviews/${id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: "candidate",
          text,
        }),
      });

      if (response.ok) {
        return await response.text();
      } else {
        throw new Error(`Chat API error (Status: ${response.status})`);
      }
    } catch (e) {
      console.error("Message send error:", e);
      throw new Error("Interviewer connection offline. Make sure Spring Boot backend and NVIDIA NIM services are active.");
    }
  };

  const handleSubmitCode = async (code: string, language: string): Promise<SubmissionResponse> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewId: id,
          code,
          language,
        }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Submission API error (Status: ${response.status})`);
      }
    } catch (e) {
      console.error("Submit code error:", e);
      throw new Error("Compiler sandbox offline. Make sure the local Judge0 service container is running.");
    }
  };

  const handleEndInterview = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/interviews/${id}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        router.push(`/feedback/${id}`);
      } else {
        throw new Error(`End Interview API error (Status: ${response.status})`);
      }
    } catch (e) {
      console.error("Ending session error:", e);
      alert("Failed to compile final feedback. Check console logs.");
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-red-400">
        <h2 className="text-lg font-bold">Workspace Connection Failed</h2>
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

  if (loading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <span className="text-xs text-text-muted">Configuring code workspace...</span>
      </div>
    );
  }

  let chatHistoryList = [];
  try {
    chatHistoryList = JSON.parse(session.conversationHistory);
  } catch (e) {
    chatHistoryList = [];
  }

  return (
    <div className="space-y-4">
      <CodeArena
        interviewId={session.id}
        questionTitle={session.currentQuestion.title}
        questionStatement={session.currentQuestion.problemStatement}
        inputFormat={session.currentQuestion.inputFormat}
        outputFormat={session.currentQuestion.outputFormat}
        constraints={session.currentQuestion.constraints}
        sampleTestCases={session.currentQuestion.sampleTestCases}
        initialChatHistory={chatHistoryList}
        onSendMessageToBackend={handleSendMessage}
        onSubmitCodeToBackend={handleSubmitCode}
        onEndInterview={handleEndInterview}
      />
    </div>
  );
}
