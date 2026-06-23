"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, GraduationCap, Briefcase, Code, Bookmark, Check } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  experience: string;
  targetCompanies: string[];
  preferredLanguages: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Form states
  const [college, setCollege] = useState("");
  const [experience, setExperience] = useState("Student");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);

  const COMPANIES_LIST = ["Google", "Amazon", "Oracle", "Microsoft", "Atlassian", "Flipkart"];
  const LANGUAGES_LIST = ["java", "python", "cpp", "go", "javascript"];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (!stored) {
        router.push("/login");
      } else {
        const u = JSON.parse(stored);
        setUser(u);
        // Pre-fill if already set
        if (u.college && u.college !== "Not specified") {
          setCollege(u.college);
        }
        if (u.experience && u.experience !== "Junior") {
          setExperience(u.experience);
        }
        if (u.targetCompanies && u.targetCompanies.length > 0) {
          setTargetCompanies(u.targetCompanies);
        }
        if (u.preferredLanguages && u.preferredLanguages.length > 0) {
          setPreferredLanguages(u.preferredLanguages);
        }
      }
    }
  }, [router]);

  const toggleCompany = (company: string) => {
    setTargetCompanies((prev) =>
      prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]
    );
  };

  const toggleLanguage = (lang: string) => {
    setPreferredLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!college.trim()) {
      alert("Please specify your College/University.");
      return;
    }
    if (targetCompanies.length === 0) {
      alert("Please select at least one Target Company.");
      return;
    }
    if (preferredLanguages.length === 0) {
      alert("Please select at least one Preferred Coding Language.");
      return;
    }

    setSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/auth/user/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user.name,
          college: college.trim(),
          experience,
          targetCompanies,
          preferredLanguages,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem("user", JSON.stringify(updatedUser));
        router.push("/");
      } else {
        alert("Failed to update profile configurations.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to backend profile database.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-220px)]">
      <div className="w-full max-w-lg glass-panel p-8 rounded-2xl border border-panel-border bg-[#15171a]/50 space-y-6 glow-indigo animate-fade-in">
        
        {/* Header Branding */}
        <div className="flex items-center gap-3 border-b border-panel-border/30 pb-4">
          <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Configure Candidate Profile</h1>
            <p className="text-[11px] text-text-muted">Answering these simple questions allows the AI to tailor company-specific coding evaluations.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Question 1: College */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-text-secondary flex items-center gap-1.5">
              <GraduationCap size={14} className="text-accent" />
              1. What is your College or University?
            </label>
            <input
              type="text"
              placeholder="e.g. Stanford University, IIT Delhi"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="bg-neutral-900 border border-panel-border rounded-lg px-3.5 py-2.5 text-foreground placeholder-text-muted focus:outline-none focus:border-accent font-semibold"
              required
            />
          </div>

          {/* Question 2: Experience */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-text-secondary flex items-center gap-1.5">
              <Briefcase size={14} className="text-accent-violet" />
              2. What is your current SDE experience tier?
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="bg-neutral-900 border border-panel-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-accent font-semibold"
            >
              <option value="Student">Student (Preparing for placements/internships)</option>
              <option value="Junior">Junior Developer (0-2 years experience)</option>
              <option value="Mid">Mid-Level Developer (2-5 years experience)</option>
              <option value="Senior">Senior Developer (5+ years experience)</option>
            </select>
          </div>

          {/* Question 3: Target Companies */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-text-secondary flex items-center gap-1.5">
              <Bookmark size={14} className="text-warning" />
              3. Which companies are you targeting?
            </label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {COMPANIES_LIST.map((comp) => {
                const selected = targetCompanies.includes(comp);
                return (
                  <button
                    type="button"
                    key={comp}
                    onClick={() => toggleCompany(comp)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left font-semibold transition ${
                      selected
                        ? "bg-accent/15 text-accent border-accent/40"
                        : "bg-neutral-900/50 text-text-secondary border-panel-border hover:bg-neutral-800"
                    }`}
                  >
                    <span>{comp}</span>
                    {selected && <Check size={11} className="text-accent" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 4: Preferred Languages */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-text-secondary flex items-center gap-1.5">
              <Code size={14} className="text-success" />
              4. Which coding languages do you prefer for interviews?
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {LANGUAGES_LIST.map((lang) => {
                const selected = preferredLanguages.includes(lang);
                const displayNames: Record<string, string> = {
                  java: "Java 21",
                  python: "Python 3",
                  cpp: "C++ (GCC)",
                  go: "Go",
                  javascript: "JavaScript",
                };
                return (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition ${
                      selected
                        ? "bg-success-light text-success border-success/40"
                        : "bg-neutral-900/50 text-text-secondary border-panel-border hover:bg-neutral-800"
                    }`}
                  >
                    <span>{displayNames[lang]}</span>
                    {selected && <Check size={11} className="text-success" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-bold text-xs transition duration-200 disabled:opacity-50 shadow-lg shadow-accent/20"
          >
            {submitting ? "Saving Profile..." : "Complete Setup & Continue to Dashboard"}
          </button>
        </form>

      </div>
    </div>
  );
}
