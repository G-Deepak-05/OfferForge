"use client";

import React, { useState, useEffect } from "react";
import { MonacoEditor } from "../Editor/MonacoEditor";
import { ChatPanel } from "./ChatPanel";
import { Play, Terminal, Clock, Cpu, Award, Sliders, Eye, EyeOff, AlertCircle, ShieldAlert } from "lucide-react";

interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

interface TestRunResult {
  status: string;
  passed: boolean;
  runtimeMs: number;
  memoryKb: number;
  stdout: string;
  stderr: string;
  compileOutput: string;
}

interface SubmissionResponse {
  status: string;
  runtimeMs: number;
  memoryKb: number;
  score?: number;
}

interface CodeArenaProps {
  interviewId: string;
  questionTitle: string;
  questionStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleTestCases: string;
  initialChatHistory: Message[];
  onSendMessageToBackend: (text: string) => Promise<string>;
  onSubmitCodeToBackend: (code: string, language: string) => Promise<SubmissionResponse>;
  onEndInterview: () => Promise<void>;
}

export const CodeArena: React.FC<CodeArenaProps> = ({
  interviewId: _interviewId,
  questionTitle,
  questionStatement,
  inputFormat,
  outputFormat,
  constraints,
  sampleTestCases: _sampleTestCases,
  initialChatHistory,
  onSendMessageToBackend,
  onSubmitCodeToBackend,
  onEndInterview,
}) => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [messages, setMessages] = useState<Message[]>(initialChatHistory);
  const [isThinking, setIsThinking] = useState(false);
  
  // Terminal/Run state
  const [isCompiling, setIsCompiling] = useState(false);
  const [runResult, setRunResult] = useState<TestRunResult | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);

  // Stealth / Overlay states
  const [stealthMode, setStealthMode] = useState(false);
  const [opacity, setOpacity] = useState(80); // 20 - 100
  const [bossMode, setBossMode] = useState(false);

  // Global listener for Alt+B Boss Key Disguise
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setBossMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Set default code template based on language
  useEffect(() => {
    switch (language.toLowerCase()) {
      case "java":
        setCode("public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}");
        break;
      case "cpp":
        setCode("#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}");
        break;
      case "go":
        setCode("package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Write your code here\n}");
        break;
      case "javascript":
        setCode("// Write your Javascript code here\nfunction solve() {\n\n}");
        break;
      default:
        setCode("# Write your Python 3 code here\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()");
        break;
    }
  }, [language]);

  const handleSendMessage = async (text: string) => {
    const newMsg: Message = {
      sender: "candidate",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setIsThinking(true);

    try {
      const response = await onSendMessageToBackend(text);
      const aiMsg: Message = {
        sender: "interviewer",
        text: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  const handleRequestHint = () => {
    handleSendMessage("Could you please give me a hint regarding the optimal approach?");
  };

  const handleRunCode = async () => {
    setIsCompiling(true);
    setShowTerminal(true);
    setRunResult(null);

    try {
      const result = await onSubmitCodeToBackend(code, language);
      
      setRunResult({
        status: result.status,
        passed: result.status === "ACCEPTED",
        runtimeMs: result.runtimeMs,
        memoryKb: result.memoryKb,
        stdout: result.status === "ACCEPTED" ? "All compilation tests passed successfully." : "Execution mismatch.",
        stderr: result.status !== "ACCEPTED" ? "Error during local execution evaluation." : "",
        compileOutput: "",
      });

      handleSendMessage("I have submitted my solution to the test console.");
    } catch (e) {
      console.error(e);
      setRunResult({
        status: "COMPILE_ERROR",
        passed: false,
        runtimeMs: 0,
        memoryKb: 0,
        stdout: "",
        stderr: "Failed to compile. Connection refused or syntax error.",
        compileOutput: "Check your local compilation logs.",
      });
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className={`transition-all duration-300 ${stealthMode ? "min-h-[calc(100vh-140px)] bg-black/90 p-4" : ""}`}>
      
      {/* Screensharing Safety Guide Banner */}
      {stealthMode && (
        <div className="max-w-[390px] mx-auto bg-warning/10 border border-warning/30 rounded-xl p-3 text-[10px] text-warning flex items-start gap-2 shadow-lg mb-3">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold uppercase">Screenshare Protection:</div>
            <p className="leading-relaxed text-[9.5px]">
              Do **NOT** share your entire screen on Zoom/Teams. Choose to **Share only your IDE window**. This floating chat overlay will remain invisible.
            </p>
          </div>
        </div>
      )}

      {/* Disguise Trigger Bar */}
      {stealthMode && (
        <div className="flex justify-between items-center bg-neutral-900/50 p-2.5 rounded-xl border border-panel-border/80 max-w-[390px] w-full mx-auto mb-3">
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

      {/* Main Grid View */}
      {stealthMode ? (
        /* STEALTH MODE LAYOUT */
        <div 
          className="max-w-[390px] mx-auto rounded-2xl flex flex-col gap-4 shadow-xl border border-panel-border/80 p-4"
          style={{ background: `rgba(21, 23, 26, ${opacity / 100})` }}
        >
          {/* Controls */}
          <div className="flex justify-between items-center border-b border-panel-border/30 pb-3">
            <span className="text-accent animate-pulse font-bold text-xs">🦜 Live Interview Overlay</span>
            <button
              onClick={() => setStealthMode(false)}
              className="p-1 hover:bg-neutral-800 rounded text-text-muted hover:text-foreground transition"
              title="Exit Stealth"
            >
              <Eye size={14} />
            </button>
          </div>

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
          </div>

          <div className="flex-1 min-h-[420px]">
            {bossMode ? (
              /* Disguise Mask */
              <div className="w-full h-full min-h-[420px] bg-[#1e1e1e] text-[#d4d4d4] font-sans p-6 rounded-xl border border-neutral-800 shadow-2xl overflow-y-auto space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-700 pb-2 text-[10px]">
                  <span className="text-[#a9a9a9]">docs.python.org / 3.12 / library / sys</span>
                  <span className="text-[9px] text-accent font-bold px-2 py-0.5 bg-neutral-800 rounded uppercase">Active</span>
                </div>
                
                <h1 className="text-base font-bold text-white">sys — System-specific parameters</h1>
                
                <p className="text-[11px] text-[#a9a9a9] leading-relaxed">
                  This module provides access to variables maintained by the interpreter. It is always available.
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
              </div>
            ) : (
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isThinking={isThinking}
                onRequestHint={handleRequestHint}
              />
            )}
          </div>
        </div>
      ) : (
        /* NORMAL MOCK INTERVIEW LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[500px]">
          {/* Left Pane: Chat Dialogue & Instructions (4 cols) */}
          <div className="lg:col-span-4 flex flex-col h-full gap-4">
            {/* Question Panel */}
            <div className="glass-panel p-5 rounded-xl border border-panel-border bg-[#161719]/60 max-h-[40%] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-bold text-foreground tracking-wide">{questionTitle}</h2>
                <span className="text-[10px] uppercase font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                  DSA Round
                </span>
              </div>
              <div className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p className="whitespace-pre-line">{questionStatement}</p>
                {inputFormat && (
                  <div className="mt-3 bg-neutral-900/40 p-2.5 rounded border border-panel-border">
                    <span className="font-bold text-foreground">Input Format:</span> {inputFormat}
                  </div>
                )}
                {outputFormat && (
                  <div className="mt-2 bg-neutral-900/40 p-2.5 rounded border border-panel-border">
                    <span className="font-bold text-foreground">Output Format:</span> {outputFormat}
                  </div>
                )}
                {constraints && (
                  <div className="mt-2 bg-neutral-900/40 p-2.5 rounded border border-panel-border text-[11px] font-mono text-warning">
                    <span className="font-bold text-foreground">Constraints:</span> {constraints}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="flex-1 min-h-[50%]">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isThinking={isThinking}
                onRequestHint={handleRequestHint}
              />
            </div>
          </div>

          {/* Right Pane: Monaco Editor & Compiler (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-full bg-[#141517] border border-panel-border rounded-xl overflow-hidden glass-panel">
            
            {/* Editor Controls Bar */}
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-panel-border bg-[#161719]/80">
              <div className="flex items-center gap-3">
                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-neutral-900 border border-panel-border text-xs text-foreground px-3 py-1.5 rounded-lg focus:outline-none focus:border-accent font-semibold"
                >
                  <option value="python">Python 3</option>
                  <option value="java">Java 21</option>
                  <option value="cpp">C++ (GCC 9.2)</option>
                  <option value="go">Go (1.13)</option>
                  <option value="javascript">NodeJS (12.14)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {/* Stealth Overlay Mode Trigger */}
                <button
                  onClick={() => setStealthMode(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-accent/20 hover:border-accent/40 text-text-secondary hover:text-accent rounded-lg text-xs font-bold transition-all duration-200"
                  title="Shrink into floating overlay client next to Zoom/Teams call"
                >
                  <EyeOff size={13} />
                  <span>Stealth Overlay</span>
                </button>

                {/* Submit Code */}
                <button
                  onClick={handleRunCode}
                  disabled={isCompiling}
                  className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-50 shadow-md shadow-accent/15"
                >
                  <Play size={13} />
                  <span>Run Code</span>
                </button>

                {/* End Interview */}
                <button
                  onClick={onEndInterview}
                  className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-bold transition-all duration-200"
                >
                  <Award size={13} />
                  <span>End Interview</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 relative">
              <MonacoEditor code={code} onChange={(v) => setCode(v || "")} language={language} />
            </div>

            {/* Terminal/Logs Output Panel */}
            {showTerminal && (
              <div className="border-t border-panel-border bg-[#111214] max-h-[35%] overflow-y-auto">
                <div className="flex justify-between items-center px-5 py-2.5 border-b border-panel-border bg-[#131416]">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal size={12} className="text-accent" />
                    Execution Log
                  </span>
                  <button
                    onClick={() => setShowTerminal(false)}
                    className="text-[10px] text-text-muted hover:text-foreground font-semibold px-2 py-0.5 rounded border border-panel-border hover:bg-neutral-800"
                  >
                    Clear
                  </button>
                </div>

                <div className="p-5 font-mono text-xs leading-relaxed space-y-3">
                  {isCompiling ? (
                    <div className="text-accent flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                      Compiling and running code against local test cases...
                    </div>
                  ) : runResult ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">Status:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                            runResult.passed
                              ? "bg-success-light text-success border border-success/20"
                              : "bg-error-light text-error border border-error/20"
                          }`}
                        >
                          {runResult.status}
                        </span>
                      </div>

                      <div className="flex gap-5 text-[11px] text-text-secondary border-t border-panel-border/30 pt-2">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="text-accent" />
                          Runtime: {runResult.runtimeMs} ms
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Cpu size={12} className="text-accent-violet" />
                          Memory: {runResult.memoryKb} KB
                        </span>
                      </div>

                      {runResult.stdout && (
                        <div className="bg-[#161719] p-3 rounded border border-panel-border mt-2">
                          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Stdout</div>
                          <pre className="text-foreground text-[11px] whitespace-pre-wrap">{runResult.stdout}</pre>
                        </div>
                      )}

                      {runResult.stderr && (
                        <div className="bg-error-light/10 border border-error/20 p-3 rounded mt-2">
                          <div className="text-[10px] font-bold text-error uppercase tracking-wider mb-1">Stderr</div>
                          <pre className="text-error text-[11px] whitespace-pre-wrap">{runResult.stderr}</pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-text-muted">Terminal is ready. Click Run Code to execute.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
