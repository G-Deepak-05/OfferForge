"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mic, MicOff, Send, Coins, ArrowLeft, Eye, EyeOff, Copy, Check, Sliders, ChevronDown, ChevronUp, AlertCircle, ShieldAlert } from "lucide-react";

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

export default function CopilotPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Configuration
  const [selectedCompany, setSelectedCompany] = useState("Google");
  const [selectedRound, setSelectedRound] = useState("DSA");
  
  // Real-time states
  const [questionText, setQuestionText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);

  // Stealth / Layout mode customization
  const [stealthMode, setStealthMode] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [opacity, setOpacity] = useState(80); // percentage 10 - 100
  const [collapseInput, setCollapseInput] = useState(false);
  const [bossMode, setBossMode] = useState(false); // Disguise Mask

  // Speech recognition states
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Refs for auto-submit tracker
  const autoSubmitRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const silenceTimerRef = useRef<any>(null);
  const questionTextRef = useRef("");

  // UI state
  const [copied, setCopied] = useState(false);

  // Sync state with refs to avoid closures in event listeners
  useEffect(() => {
    autoSubmitRef.current = autoSubmit;
  }, [autoSubmit]);

  useEffect(() => {
    questionTextRef.current = questionText;
  }, [questionText]);

  // Global listener for Alt+B Boss Key Disguise
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setBossMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (!stored) {
        router.push("/login");
      } else {
        const u = JSON.parse(stored);
        setUser(u);
        setCredits(u.credits !== undefined ? u.credits : 50);
        if (u.targetCompanies && u.targetCompanies.length > 0) {
          setSelectedCompany(u.targetCompanies[0]);
        }
      }
    }

    // Initialize Web Speech Recognition
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          setQuestionText((prev) => {
            const base = prev.trim();
            const addition = (finalTranscript || interimTranscript).trim();
            const newText = (base.endsWith(addition) || addition === "") ? prev : (base + " " + addition);
            questionTextRef.current = newText;

            // Voice triggered auto-submit trigger
            if (autoSubmitRef.current && newText.trim() !== "") {
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = setTimeout(() => {
                triggerVoiceSubmit();
              }, 1500);
            }

            return newText;
          });
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [router]);

  const triggerVoiceSubmit = () => {
    const text = questionTextRef.current.trim();
    if (text) {
      handleGetSuggestion(text);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Web Speech API (Speech Recognition) is not supported in this browser. Please use Chrome or Safari, or enter the question manually.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleGetSuggestion = async (overrideText?: string) => {
    if (!user) return;
    const textToQuery = overrideText !== undefined ? overrideText : questionText;
    if (!textToQuery.trim()) {
      alert("Please enter or record an interview question.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/copilot/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          company: selectedCompany,
          roundType: selectedRound,
          questionText: textToQuery.trim(),
        }),
      });

      if (response.status === 402) {
        alert("Insufficient Copilot credits! Please top up your balance on the billing page.");
        router.push("/billing");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setSuggestion(data.suggestion);
        setCredits(data.remainingCredits);

        // Update local user state
        const updatedUser = { ...user, credits: data.remainingCredits };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        const errMsg = await response.text();
        throw new Error(errMsg);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to AI Copilot Engine: " + (e instanceof Error ? e.message : "Error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopySuggestion = () => {
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className={`min-h-[calc(100vh-140px)] transition-all duration-300 ${stealthMode ? "p-4 bg-black/90" : "space-y-6"}`}>
      
      {/* Standard Layout Header */}
      {!stealthMode && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-6 rounded-2xl border border-panel-border bg-[#15171a]/50">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-9 h-9 rounded-lg border border-panel-border bg-neutral-900/50 hover:bg-neutral-800 flex items-center justify-center text-text-secondary hover:text-foreground transition">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-1.5 font-bold">
                🦜 Parakeet AI Copilot Mode
                <span className="px-2 py-0.5 text-[9px] uppercase font-black bg-accent/25 border border-accent/30 text-accent rounded font-bold">Live Mode</span>
              </h1>
              <p className="text-xs text-text-muted mt-0.5 font-semibold">
                Stealthy, real-time interview assistant listening to your interviewer and providing instant guidance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Credit Dashboard */}
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-panel-border rounded-lg text-xs font-bold">
              <Coins size={14} className="text-warning animate-pulse" />
              <span className="text-text-secondary">{credits} Credits</span>
              <Link href="/billing" className="text-[10px] text-accent hover:text-indigo-400 font-extrabold ml-2 border border-accent/20 px-2 py-0.5 rounded bg-accent/5 hover:bg-accent/15 transition">
                + Buy Credits
              </Link>
            </div>

            {/* Stealth Mode Activation Button */}
            <button
              onClick={() => setStealthMode(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-violet hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/10"
            >
              <EyeOff size={13} />
              <span>Enter Stealth Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Screensharing Safety Guide Banner */}
      {stealthMode && (
        <div className="max-w-[390px] mx-auto bg-warning/10 border border-warning/30 rounded-xl p-3 text-[10px] text-warning flex items-start gap-2 shadow-lg mb-3">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold uppercase">Zoom/Teams Screensharing Tip:</div>
            <p className="leading-relaxed text-[9.5px]">
              Do **NOT** share your entire screen during calls. Instead, choose to **Share only your IDE/Coding Window** (or specific browser tab). This overlay will remain completely invisible to other participants.
            </p>
          </div>
        </div>
      )}

      {/* Main Sandbox Layout */}
      <div className={`grid gap-5 h-full ${stealthMode ? "grid-cols-1 max-w-[390px] mx-auto" : "grid-cols-1 lg:grid-cols-12"}`}>
        
        {/* Boss Disguise Trigger Bar */}
        {stealthMode && (
          <div className="flex justify-between items-center bg-neutral-900/50 p-2.5 rounded-xl border border-panel-border/80 max-w-[390px] w-full mx-auto">
            <span className="text-[9px] text-text-muted font-bold flex items-center gap-1">
              <ShieldAlert size={12} className="text-accent" />
              Screenshare Disguise Mask
            </span>
            <button
              onClick={() => setBossMode(!bossMode)}
              className={`px-3 py-1 text-[9px] font-black rounded-lg transition border uppercase ${
                bossMode 
                  ? "bg-success-light text-success border-success/30" 
                  : "bg-neutral-800 text-text-secondary border-panel-border hover:bg-neutral-700"
              }`}
            >
              {bossMode ? "Restore suggestions" : "Mask (Alt+B)"}
            </button>
          </div>
        )}

        {bossMode ? (
          /* Boss Key Disguise Documentation View */
          <div className={`${stealthMode ? "w-full max-w-[390px] mx-auto" : "lg:col-span-12"} transition-all duration-300`}>
            <div className="w-full h-full min-h-[420px] bg-[#1e1e1e] text-[#d4d4d4] font-sans p-6 rounded-2xl border border-neutral-800 shadow-2xl overflow-y-auto space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-700 pb-2 text-[10px]">
                <span className="text-[#a9a9a9]">docs.python.org / 3.12 / library / sys</span>
                <span className="text-[9px] text-accent font-bold px-2 py-0.5 bg-neutral-800 rounded uppercase">Disguise Active</span>
              </div>
              
              <h1 className="text-base font-bold text-white">sys — System-specific parameters and functions</h1>
              
              <p className="text-[11px] text-[#a9a9a9] leading-relaxed">
                This module provides access to variables maintained by the interpreter and functions that interact with the memory structures. It is always available.
              </p>

              <div className="bg-[#151515] p-3 rounded border border-neutral-800 font-mono text-[10px] text-[#9cdcfe] space-y-1">
                <div><span className="text-[#569cd6]">import</span> sys</div>
                <div className="text-[#6a9955] mt-1"># Read lines from standard input</div>
                <div>
                  <span className="text-[#569cd6]">def</span> <span className="text-[#dcdcaa]">read_input</span>():<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;lines = sys.stdin.read().split()<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c586c0]">return</span> [int(x) <span className="text-[#c586c0]">for</span> x <span className="text-[#c586c0]">in</span> lines]<br/>
                </div>
              </div>

              <h2 className="text-xs font-bold text-white border-b border-neutral-800 pb-1 mt-3">Module Contents</h2>
              
              <div className="space-y-2 text-[11px] text-[#a9a9a9]">
                <div>
                  <span className="font-bold text-[#569cd6]">sys.argv</span>
                  <p className="pl-3">The list of command line arguments passed to a script. argv[0] is the script name.</p>
                </div>
                <div>
                  <span className="font-bold text-[#569cd6]">sys.exit([arg])</span>
                  <p className="pl-3">Exit from Python by raising the SystemExit exception.</p>
                </div>
                <div>
                  <span className="font-bold text-[#569cd6]">sys.path</span>
                  <p className="pl-3">A list of strings that specifies the search path for modules.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Real-time Suggested Answer View */
          <>
            {/* Left Control Card (Stealth Card or Configuration Card) */}
            <div 
              className={`glass-panel border border-panel-border p-5 rounded-2xl flex flex-col gap-4 shadow-xl ${
                stealthMode ? "w-full border-accent/30 glow-indigo" : "lg:col-span-4 bg-[#15171a]/50"
              }`}
              style={{ background: stealthMode ? `rgba(21, 23, 26, ${opacity / 100})` : undefined }}
            >
              
              {/* Stealth Card Header */}
              {stealthMode && (
                <div className="flex justify-between items-center border-b border-panel-border/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-accent animate-pulse font-bold text-xs">🦜 Parakeet Copilot</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-neutral-900 border border-panel-border font-bold text-text-muted">STEALTH</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-warning flex items-center gap-1">
                      <Coins size={11} /> {credits}
                    </span>
                    <button
                      onClick={() => setStealthMode(false)}
                      className="p-1 hover:bg-neutral-800 rounded text-text-muted hover:text-foreground transition"
                      title="Exit Stealth"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Opacity and Layout Sliders in Stealth Mode */}
              {stealthMode && (
                <div className="bg-neutral-900/50 p-2.5 rounded-lg border border-panel-border/50 text-[10px] font-bold space-y-2">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="flex items-center gap-1"><Sliders size={12} /> Opacity</span>
                    <span>{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(parseInt(e.target.value))}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-text-secondary">Collapse Input Console</span>
                    <button
                      onClick={() => setCollapseInput(!collapseInput)}
                      className="text-accent hover:text-indigo-300 font-extrabold flex items-center gap-0.5"
                    >
                      {collapseInput ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                      <span>{collapseInput ? "Show" : "Hide"}</span>
                    </button>
                  </div>
                </div>
              )}

              {!collapseInput && (
                <>
                  {/* Interview Config (Company & Round) */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-text-muted">Target Company</label>
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="bg-neutral-900 border border-panel-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:border-accent font-semibold"
                      >
                        <option value="Google">Google</option>
                        <option value="Amazon">Amazon</option>
                        <option value="Oracle">Oracle</option>
                        <option value="Microsoft">Microsoft</option>
                        <option value="Atlassian">Atlassian</option>
                        <option value="Generic SDE">Generic SDE</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-text-muted">Interview Round</label>
                      <select
                        value={selectedRound}
                        onChange={(e) => setSelectedRound(e.target.value)}
                        className="bg-neutral-900 border border-panel-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:border-accent font-semibold"
                      >
                        <option value="DSA">DSA / Coding</option>
                        <option value="System Design">System Design</option>
                        <option value="Behavioral">Behavioral (STAR)</option>
                        <option value="Managerial">Managerial / Scenario</option>
                      </select>
                    </div>
                  </div>

                  {/* Speech transcription card */}
                  <div className="flex flex-col gap-2 flex-1 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <label className="text-text-secondary flex items-center gap-1">
                        <span>Interviewer Question</span>
                      </label>
                      <button
                        onClick={toggleListening}
                        className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded transition duration-200 border ${
                          isListening
                            ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse"
                            : "bg-neutral-900 text-text-muted border-panel-border hover:bg-neutral-800"
                        }`}
                      >
                        {isListening ? <MicOff size={11} /> : <Mic size={11} />}
                        <span>{isListening ? "Listening..." : "Record Mic"}</span>
                      </button>
                    </div>

                    {/* Auto Submit option */}
                    <div className="flex items-center gap-1.5 py-1 text-[10px] text-text-muted bg-neutral-900/30 px-2 rounded border border-panel-border/30">
                      <input
                        type="checkbox"
                        id="auto-submit-chk"
                        checked={autoSubmit}
                        onChange={(e) => setAutoSubmit(e.target.checked)}
                        className="rounded border-panel-border text-accent focus:ring-accent bg-neutral-800"
                      />
                      <label htmlFor="auto-submit-chk" className="cursor-pointer font-bold select-none">
                        Hands-Free Auto-Submit (1.5s Silence Trigger)
                      </label>
                    </div>

                    <textarea
                      placeholder="Paste question text, click 'Record Mic' to dictate, or type question here..."
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full min-h-[100px] flex-1 bg-neutral-900 border border-panel-border rounded-xl p-3 text-xs text-foreground placeholder-text-muted focus:outline-none focus:border-accent resize-none font-semibold"
                    />
                  </div>

                  {/* Trigger button */}
                  <button
                    onClick={() => handleGetSuggestion()}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-bold transition shadow-lg shadow-accent/15 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Generating Suggestion...</span>
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        <span>Get Instant Answer</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {stealthMode && (
                <Link
                  href="/billing"
                  className="text-[9px] text-center text-text-muted hover:text-foreground font-semibold py-1 bg-neutral-900 border border-panel-border/50 rounded-lg transition"
                >
                  + Purchase Credit Packs
                </Link>
              )}

            </div>

            {/* Right Output Panel */}
            <div 
              className={`glass-panel border border-panel-border p-5 rounded-2xl flex flex-col gap-4 shadow-xl ${
                stealthMode ? "w-full min-h-[350px]" : "lg:col-span-8 h-[calc(100vh-160px)] bg-[#15171a]/50"
              }`}
              style={{ background: stealthMode ? `rgba(21, 23, 26, ${opacity / 100})` : undefined }}
            >
              
              <div className="flex justify-between items-center border-b border-panel-border/30 pb-3.5 text-xs font-semibold">
                <h3 className="font-bold text-foreground tracking-wide flex items-center gap-1.5">
                  <Sparkles size={14} className="text-accent" />
                  Real-Time Suggested Answers
                </h3>
                {suggestion && (
                  <button
                    onClick={handleCopySuggestion}
                    className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 border border-panel-border hover:bg-neutral-800 text-[10px] font-bold text-text-secondary hover:text-foreground rounded transition"
                  >
                    {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                )}
              </div>

              {/* Suggestion rendering area */}
              <div className="flex-1 overflow-y-auto text-xs leading-relaxed space-y-4 font-semibold text-text-secondary pr-2">
                {suggestion ? (
                  <div className="space-y-4 whitespace-pre-wrap selection:bg-accent/20">
                    {suggestion.split("###").map((chunk, index) => {
                      if (index === 0 && !chunk.trim()) return null;
                      
                      const lines = chunk.split("\n");
                      const heading = lines[0].trim();
                      const body = lines.slice(1).join("\n").trim();

                      if (heading) {
                        return (
                          <div key={index} className="space-y-2">
                            <h4 className="text-foreground font-black text-xs border-l-2 border-accent pl-2.5 tracking-wide mt-2">
                              {heading}
                            </h4>
                            {body.includes("```") ? (
                              <div className="font-mono text-[11px] bg-neutral-900 p-3 rounded-lg border border-panel-border/80 text-foreground overflow-x-auto whitespace-pre leading-relaxed mt-2.5">
                                {body.replace(/```[a-z]*\n?/g, "").replace(/```/g, "")}
                              </div>
                            ) : (
                              <div className="text-[11px] leading-relaxed text-text-secondary font-medium pl-3 whitespace-pre-line">
                                {body}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      return (
                        <div key={index} className="text-text-secondary font-medium whitespace-pre-line">
                          {chunk}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-text-muted gap-2.5 py-12">
                    <div className="w-12 h-12 rounded-full border border-panel-border bg-neutral-900/50 flex items-center justify-center text-accent/55 text-lg">
                      🦜
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-xs">Copilot Standing By</h4>
                      <p className="text-[10px] text-text-muted max-w-[280px] mx-auto mt-1 leading-normal">
                        Dictate interviewer voice or enter the question to generate real-time stealth talking points, optimal coding templates, and resume connections.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </>
        )}

      </div>

    </div>
  );
}
