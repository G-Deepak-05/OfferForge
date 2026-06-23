"use client";

import React from "react";
import { Award, Zap, CheckCircle2, TrendingUp } from "lucide-react";

interface StatsOverviewProps {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  accuracy: number;
  weeklyProgress: Array<{
    week: string;
    interviewsCompleted: number;
    problemsSolved: number;
  }>;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalInterviews,
  completedInterviews,
  averageScore,
  accuracy,
  weeklyProgress,
}) => {
  // Simple layout with stats cards
  const scorePercent = Math.min(100, Math.max(0, averageScore));
  const accuracyPercent = Math.min(100, Math.max(0, accuracy));

  return (
    <div className="space-y-6">
      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Completed Interviews */}
        <div className="glass-panel p-5 rounded-xl border border-panel-border bg-[#161719]/40 flex items-center gap-4">
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="text-xs text-text-muted font-semibold uppercase tracking-wider">Completed Mock Interviews</h4>
            <p className="text-2xl font-bold text-foreground mt-1">{completedInterviews}</p>
            <span className="text-[10px] text-text-muted">Out of {totalInterviews} started</span>
          </div>
        </div>

        {/* Avg Interview Score */}
        <div className="glass-panel p-5 rounded-xl border border-panel-border bg-[#161719]/40 flex items-center gap-4">
          <div className="p-3 bg-accent-violet/10 border border-accent-violet/20 rounded-lg text-accent-violet">
            <Award size={24} />
          </div>
          <div>
            <h4 className="text-xs text-text-muted font-semibold uppercase tracking-wider">Average Score</h4>
            <p className="text-2xl font-bold text-foreground mt-1">{averageScore}/100</p>
            <div className="w-24 bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-accent-violet h-full rounded-full"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Coding Accuracy */}
        <div className="glass-panel p-5 rounded-xl border border-panel-border bg-[#161719]/40 flex items-center gap-4">
          <div className="p-3 bg-success-light text-success border border-success/20 rounded-lg">
            <Zap size={24} />
          </div>
          <div>
            <h4 className="text-xs text-text-muted font-semibold uppercase tracking-wider">Coding Accuracy</h4>
            <p className="text-2xl font-bold text-foreground mt-1">{accuracy}%</p>
            <div className="w-24 bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-success h-full rounded-full"
                style={{ width: `${accuracyPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Level Trend */}
        <div className="glass-panel p-5 rounded-xl border border-panel-border bg-[#161719]/40 flex items-center gap-4">
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-warning">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="text-xs text-text-muted font-semibold uppercase tracking-wider">Improvement Trend</h4>
            <p className="text-2xl font-bold text-foreground mt-1">Positive</p>
            <span className="text-[10px] text-success font-bold">+12% vs last week</span>
          </div>
        </div>
      </div>

      {/* SVG Simple Chart Panel */}
      <div className="glass-panel p-6 rounded-xl border border-panel-border bg-[#161719]/60">
        <h3 className="text-sm font-bold text-foreground tracking-wide mb-6">Weekly Progress</h3>
        
        {/* Simple Bar Chart */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-5 h-48 border-b border-panel-border/30 pb-2">
          {weeklyProgress.map((p, idx) => {
            const problemsHeight = Math.min(100, Math.max(10, p.problemsSolved * 8));
            const interviewsHeight = Math.min(100, Math.max(10, p.interviewsCompleted * 20));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="flex gap-2.5 items-end h-full">
                  {/* Interviews completed bar */}
                  <div
                    className="w-4 bg-accent-violet/60 hover:bg-accent-violet rounded-t-sm transition-all duration-300 relative group"
                    style={{ height: `${interviewsHeight}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      {p.interviewsCompleted} mock rounds
                    </div>
                  </div>

                  {/* Problems solved bar */}
                  <div
                    className="w-4 bg-success/60 hover:bg-success rounded-t-sm transition-all duration-300 relative group"
                    style={{ height: `${problemsHeight}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      {p.problemsSolved} submissions
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-text-muted mt-1 font-semibold">{p.week}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-[10px] font-semibold text-text-muted justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-accent-violet rounded-sm" />
            <span>Interviews Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-success rounded-sm" />
            <span>Problems Solved</span>
          </div>
        </div>
      </div>

    </div>
  );
};
