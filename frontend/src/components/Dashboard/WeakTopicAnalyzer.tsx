"use client";

import React from "react";
import { Sparkles, ThumbsUp, AlertCircle, Compass } from "lucide-react";

interface WeakTopicAnalyzerProps {
  strongTopics: string[];
  weakTopics: string[];
}

export const WeakTopicAnalyzer: React.FC<WeakTopicAnalyzerProps> = ({
  strongTopics,
  weakTopics,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
      
      {/* Topics Split (7 columns) */}
      <div className="md:col-span-7 flex flex-col gap-4">
        
        {/* Strong Topics */}
        <div className="glass-panel p-5 rounded-xl border border-panel-border bg-[#161719]/40">
          <h3 className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <ThumbsUp size={14} />
            Strong DSA Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {strongTopics.map((topic, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-success-light text-success border border-success/20 animate-fade-in"
              >
                {topic}
              </span>
            ))}
            {strongTopics.length === 0 && (
              <span className="text-xs text-text-muted italic">Complete interviews to analyze strengths.</span>
            )}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="glass-panel p-5 rounded-xl border border-panel-border bg-[#161719]/40">
          <h3 className="text-xs font-bold text-error uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <AlertCircle size={14} />
            Areas For Improvement
          </h3>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((topic, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-error-light text-error border border-error/20 animate-fade-in"
              >
                {topic}
              </span>
            ))}
            {weakTopics.length === 0 && (
              <span className="text-xs text-text-muted italic">No immediate weak areas detected yet!</span>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Path Panel (5 columns) */}
      <div className="md:col-span-5 glass-panel p-5 rounded-xl border border-panel-border bg-accent-light/5 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Sparkles size={14} />
            AI Preparation Plan
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Based on your mock interviews, you have an excellent grasp of contiguous data layouts, but struggled with optimal bounds in dynamic state grids.
          </p>

          <div className="mt-4 space-y-2.5">
            <div className="flex gap-2.5 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <p className="text-[11px] text-text-muted">Practice 3 sliding window challenges asked at Oracle.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-violet mt-1.5 flex-shrink-0" />
              <p className="text-[11px] text-text-muted">Review space complexity patterns on depth-first search recursion trees.</p>
            </div>
          </div>
        </div>

        <button className="flex items-center justify-center gap-2 w-full mt-6 py-2.5 bg-neutral-900 border border-panel-border hover:bg-neutral-800 text-xs font-bold text-foreground rounded-lg transition-all duration-200">
          <Compass size={14} className="text-accent" />
          <span>Launch Recommended Prep Quest</span>
        </button>
      </div>

    </div>
  );
};
