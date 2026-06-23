"use client";

import React from "react";
import { HelpCircle, Lightbulb, Play, MessageSquare, Check, ShieldAlert, Award } from "lucide-react";

interface TimelineEvent {
  time: string;
  eventType: string; // "START" | "APPROACH" | "HINT" | "RUN" | "SUBMIT" | "FEEDBACK"
  description: string;
  interviewerAdvice?: string;
}

interface ReplayTimelineProps {
  events: TimelineEvent[];
}

export const ReplayTimeline: React.FC<ReplayTimelineProps> = ({ events }) => {
  
  const getEventIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "START":
        return <Award className="text-accent" size={16} />;
      case "APPROACH":
        return <MessageSquare className="text-accent-violet" size={16} />;
      case "HINT":
        return <Lightbulb className="text-warning" size={16} />;
      case "RUN":
        return <Play className="text-text-muted" size={16} />;
      case "SUBMIT":
        return <Check className="text-success" size={16} />;
      default:
        return <HelpCircle className="text-accent" size={16} />;
    }
  };

  const getEventBadgeClass = (type: string) => {
    switch (type.toUpperCase()) {
      case "START":
        return "bg-accent/15 text-accent border border-accent/20";
      case "APPROACH":
        return "bg-accent-violet/15 text-accent-violet border border-accent-violet/20";
      case "HINT":
        return "bg-warning/15 text-warning border border-warning/20";
      case "RUN":
        return "bg-neutral-800 text-text-secondary border border-panel-border";
      case "SUBMIT":
        return "bg-success-light text-success border border-success/20";
      default:
        return "bg-neutral-800 text-foreground";
    }
  };

  return (
    <div className="relative pl-6 border-l border-panel-border py-4 space-y-8 max-w-3xl mx-auto">
      {events.map((event, idx) => (
        <div key={idx} className="relative animate-fade-in">
          
          {/* Node Icon Circle */}
          <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-[#161719] border border-panel-border flex items-center justify-center shadow-lg">
            {getEventIcon(event.eventType)}
          </div>

          {/* Timeline Event Details */}
          <div className="glass-panel p-5 rounded-xl border border-panel-border bg-[#161719]/40 hover:bg-[#1a1c1e]/60 transition-all duration-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold text-accent bg-[#1b1c1e] px-2 py-0.5 rounded border border-panel-border">
                  {event.time}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getEventBadgeClass(event.eventType)}`}>
                  {event.eventType}
                </span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed font-semibold">
              {event.description}
            </p>

            {/* AI Coaching Tips */}
            {event.interviewerAdvice ? (
              <div className="mt-3 bg-neutral-900/50 border border-panel-border p-3 rounded-lg flex gap-2.5 items-start">
                <ShieldAlert size={14} className="text-accent-violet mt-0.5 flex-shrink-0" />
                <div className="text-[11px] leading-relaxed text-text-muted">
                  <span className="font-bold text-text-secondary">AI coaching advice: </span>
                  {event.interviewerAdvice}
                </div>
              </div>
            ) : event.eventType === "HINT" ? (
              <div className="mt-3 bg-warning/5 border border-warning/15 p-3 rounded-lg flex gap-2.5 items-start">
                <ShieldAlert size={14} className="text-warning mt-0.5 flex-shrink-0" />
                <div className="text-[11px] leading-relaxed text-text-muted">
                  <span className="font-bold text-warning">Interviewer suggestion: </span>
                  Try to state constraints or run-time complexity bounds prior to requesting hints.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};
