"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Volume2, VolumeX, Lightbulb, Sparkles } from "lucide-react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      <div className="p-4 border-t border-panel-border bg-[#161719]/80 flex gap-2">
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
  );
};
