"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Volume2, VolumeX, Lightbulb, Sparkles, Mic, MicOff } from "lucide-react";

interface Message {
  sender: string; // "interviewer" | "candidate"
  text: string;
  timestamp: string;
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  onRequestHint: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isThinking,
  onRequestHint,
}) => {
  const [input, setInput] = useState("");
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const silenceTimerRef = useRef<any>(null);
  const inputRef = useRef("");
  const autoSubmitRef = useRef(false);

  // Sync ref with input state
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Sync ref with autoSubmit state
  useEffect(() => {
    autoSubmitRef.current = autoSubmit;
  }, [autoSubmit]);

  // Initialize Speech Recognition
  useEffect(() => {
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

          setInput((prev) => {
            const base = prev.trim();
            const addition = (finalTranscript || interimTranscript).trim();
            const newText = (base.endsWith(addition) || addition === "") ? prev : (base + " " + addition);
            inputRef.current = newText;

            // Voice triggered auto-submit in mock interview
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

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerVoiceSubmit = () => {
    const text = inputRef.current.trim();
    if (text) {
      onSendMessage(text);
      setInput("");
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Handle TTS for new interviewer messages
  useEffect(() => {
    if (speechEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "interviewer") {
        speakText(lastMsg.text);
      }
    }
  }, [messages]);

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop current speech
      // Remove markdown headings and formatting prior to speaking
      const cleanText = text
        .replace(/###/g, "")
        .replace(/\*\*/g, "")
        .replace(/`/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Try to find a nice English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(
        (v) => v.lang.includes("en-US") && v.name.toLowerCase().includes("google")
      ) || voices.find((v) => v.lang.includes("en"));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (!speechEnabled && messages.length > 0) {
      const lastMsg = [...messages].reverse().find(m => m.sender === "interviewer");
      if (lastMsg) speakText(lastMsg.text);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121314] border border-panel-border rounded-xl overflow-hidden glass-panel glow-indigo">
      {/* Header Panel */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-panel-border bg-[#161719]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="font-semibold text-sm tracking-wide text-foreground">AI Interviewer</span>
        </div>

        <div className="flex items-center gap-2">
          {/* TTS Toggle */}
          <button
            onClick={toggleSpeech}
            className={`p-2 rounded-lg border border-panel-border transition-all duration-200 hover:bg-neutral-800 ${
              speechEnabled ? "text-accent bg-accent/10 border-accent/30" : "text-text-muted"
            }`}
            title="Toggle Text-To-Speech Narrator"
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Quick Hint Action */}
          <button
            onClick={onRequestHint}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-panel-border bg-neutral-900/50 text-xs font-semibold text-warning hover:bg-warning/10 hover:border-warning/30 transition-all duration-200"
          >
            <Lightbulb size={13} />
            <span>Hint</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.map((msg, idx) => {
          const isInterviewer = msg.sender === "interviewer";
          return (
            <div
              key={idx}
              className={`flex flex-col ${
                isInterviewer ? "items-start animate-slide-in-left" : "items-end animate-fade-in"
              }`}
            >
              {/* Sender Tag */}
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 px-1">
                {isInterviewer ? "Interviewer" : "You (Candidate)"}
              </span>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed border shadow-md whitespace-pre-wrap ${
                  isInterviewer
                    ? "bg-[#181a1d] border-panel-border text-foreground rounded-tl-sm"
                    : "bg-accent border-accent/20 text-white rounded-tr-sm"
                }`}
              >
                {/* Formatting helper: render code reviews differently if containing markdown headings */}
                {msg.text.includes("###") ? (
                  <div className="space-y-2">
                    {msg.text.split("\n").map((line, lIdx) => {
                      if (line.startsWith("###")) {
                        return (
                          <h4 key={lIdx} className="font-bold text-accent-violet mt-3 first:mt-0 text-sm">
                            {line.replace("###", "").trim()}
                          </h4>
                        );
                      }
                      if (line.startsWith("SCORE:")) {
                        return (
                          <div key={lIdx} className="inline-block mt-2 px-2.5 py-1 rounded bg-accent/20 border border-accent/30 text-xs font-extrabold text-white">
                            {line}
                          </div>
                        );
                      }
                      return <p key={lIdx} className="text-text-secondary text-xs">{line}</p>;
                    })}
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          );
        })}

        {/* AI Typing loader */}
        {isThinking && (
          <div className="flex flex-col items-start animate-slide-in-left">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 px-1">
              Interviewer
            </span>
            <div className="bg-[#181a1d] border border-panel-border rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5 shadow-md">
              <span className="text-xs text-text-muted italic flex items-center gap-2">
                <Sparkles size={12} className="animate-spin text-accent" />
                Thinking...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Composer */}
      <div className="p-4 border-t border-panel-border bg-[#161719]/80 flex flex-col gap-2">
        {/* Voice Trigger Settings Bar */}
        <div className="flex items-center justify-between text-[10px] text-text-muted px-1">
          <div className="flex items-center gap-1.5 bg-neutral-900/30 px-2.5 py-1 rounded border border-panel-border/30">
            <input
              type="checkbox"
              id="interview-auto-submit-chk"
              checked={autoSubmit}
              onChange={(e) => setAutoSubmit(e.target.checked)}
              className="rounded border-panel-border text-accent focus:ring-accent bg-neutral-800"
            />
            <label htmlFor="interview-auto-submit-chk" className="cursor-pointer font-bold select-none">
              Auto-Submit Voice (1.5s Silence Trigger)
            </label>
          </div>
          {isListening && (
            <span className="text-red-400 font-extrabold flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Mic Recording
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {/* Microphone Capture Button */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-center ${
              isListening
                ? "bg-red-500/15 border-red-500/40 text-red-400 animate-pulse shadow-md shadow-red-500/10"
                : "bg-neutral-900 border-panel-border text-text-muted hover:text-foreground hover:bg-neutral-800"
            }`}
            title="Speak your response"
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Explain your approach, ask questions or write notes..."
            className="flex-1 bg-neutral-900 border border-panel-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-text-muted focus:outline-none focus:border-accent resize-none h-[42px] max-h-[80px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="p-3 bg-accent hover:bg-accent-hover text-white rounded-xl disabled:opacity-40 disabled:hover:bg-accent transition-all duration-200 shadow-lg shadow-accent/20 flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
