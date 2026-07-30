"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";

interface Message {
  id: string;
  sender: "user" | "advisor";
  text: string;
  timestamp: Date;
}

interface Assessment {
  id: number;
  diseaseType: string;
  riskScore: number;
  riskLevel: string;
  createdAt: string;
}

export default function MediPredictAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch the latest assessment when the chatbot mounts
  useEffect(() => {
    async function fetchLatest() {
      setLoadingVitals(true);
      try {
        const res = await api.get("/assessments?size=10");
        const logs = res.data.content || [];
        const completed = logs.find((a: any) => a.status === "COMPLETED");
        if (completed) {
          setLatestAssessment(completed);
        }
      } catch (err) {
        console.error("Failed to fetch latest assessment for chatbot:", err);
      } finally {
        setLoadingVitals(false);
      }
    }
    fetchLatest();
  }, []);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Initial welcome message once latestAssessment is loaded or panel is opened
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = getWelcomeMessage(latestAssessment);
      setMessages([
        {
          id: "welcome",
          sender: "advisor",
          text: welcomeText,
          timestamp: new Date(),
        },
      ]);
    }
  }, [latestAssessment, messages.length]);

  const getWelcomeMessage = (assessment: Assessment | null) => {
    if (!assessment) {
      return "### Hello! I am your MediPredict Advisor. 👋\n\nI don't see any completed health scans in your account yet. Once you complete a risk assessment on the **Risk Predictor** page, I will load your vitals context here to explain your scores and answer personalized medical follow-ups.\n\nFor now, feel free to ask me general questions about health, diabetes, thyroid, or heart wellness!";
    }
    
    const diseaseName = assessment.diseaseType.replace("_", " ");
    return `### Hello! I am your MediPredict Advisor. 👋\n\nI have automatically loaded your latest **${diseaseName} Assessment** from ${new Date(assessment.createdAt).toLocaleDateString()}.\n\n* **Risk Level:** ${assessment.riskLevel}\n* **Risk Score:** ${assessment.riskScore}%\n\nHow can I help you explain these results, suggest dietary plans, or prepare questions for your doctor?`;
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await api.post("/assessments/chat", {
        message: textToSend,
        assessmentId: latestAssessment?.id || null,
      });

      const responseText = res.data.response || "I apologize, but I could not formulate an advisor response. Please try again.";
      
      const advisorMsg: Message = {
        id: Math.random().toString(),
        sender: "advisor",
        text: responseText,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, advisorMsg]);
    } catch (err) {
      console.error("Chatbot advisor error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "advisor",
          text: "⚠️ **Connection Error:** I was unable to reach the MediPredict backends. Please ensure the services are running and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse simple markdown to react elements (###, **, -, emoji indicators)
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      
      // Match Header ###
      if (content.startsWith("### ")) {
        return (
          <h4 key={idx} style={{ fontSize: "1.1rem", color: "#fff", margin: "14px 0 8px 0", fontWeight: 700, borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "4px" }}>
            {content.replace("### ", "")}
          </h4>
        );
      }
      
      // Match List Item -
      const isBullet = content.startsWith("- ") || content.startsWith("* ");
      if (isBullet) {
        content = content.substring(2);
      }
      
      // Bold rendering **text** -> <strong>text</strong>
      const parts = [];
      let lastIndex = 0;
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;
      
      while ((match = boldRegex.exec(content)) !== null) {
        const textBefore = content.substring(lastIndex, match.index);
        const boldText = match[1];
        if (textBefore) parts.push(textBefore);
        parts.push(<strong key={match.index} style={{ color: "#fff", fontWeight: 700 }}>{boldText}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      const textAfter = content.substring(lastIndex);
      if (textAfter) parts.push(textAfter);

      if (isBullet) {
        return (
          <li key={idx} style={{ marginLeft: "16px", marginBottom: "6px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {parts}
          </li>
        );
      }
      
      return (
        <p key={idx} style={{ marginBottom: "8px", lineHeight: "1.5", fontSize: "0.9rem", color: "var(--text-muted)" }}>
          {parts}
        </p>
      );
    });
  };

  const actionChips = [
    { label: "Explain my latest risk 📈", text: "Please explain my latest assessment risk results." },
    { label: "Diet & lifestyle suggestions 🍏", text: "What dietary options and lifestyle changes do you suggest for my markers?" },
    { label: "Questions for my doctor 🩺", text: "What questions should I ask my physician about these results?" },
    { label: "Explain TSH & Thyroid 🦋", text: "What does TSH measure and what do high/low levels mean?" },
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 99,
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary), var(--secondary))",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow: `0 8px 32px rgba(59, 130, 246, 0.4), 0 0 15px var(--primary-glow)`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1) translateY(-3px)";
          e.currentTarget.style.boxShadow = `0 12px 40px rgba(59, 130, 246, 0.5), 0 0 25px var(--primary-glow)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) translateY(0)";
          e.currentTarget.style.boxShadow = `0 8px 32px rgba(59, 130, 246, 0.4), 0 0 15px var(--primary-glow)`;
        }}
        title="MediPredict Advisor Chatbot"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <div style={{ position: "relative" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              width: "10px",
              height: "10px",
              background: "var(--success)",
              borderRadius: "50%",
              boxShadow: "0 0 8px var(--success)"
            }}></span>
          </div>
        )}
      </button>

      {/* Slide-out Glassy Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: isOpen ? 0 : "-420px",
          width: "400px",
          height: "100vh",
          background: "rgba(8, 11, 17, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
          zIndex: 98,
          display: "flex",
          flexDirection: "column",
          transition: "right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: "24px 20px 16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.01)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--secondary)",
                boxShadow: "0 0 8px var(--secondary-glow)"
              }}></div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", letterSpacing: "0.5px" }}>
                MediPredict <span style={{ color: "var(--secondary)" }}>Advisor</span>
              </h3>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px", display: "inline-block" }}>
              Clinical Decision Support Agent
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Message Log */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                display: "flex",
                flexDirection: "column",
                alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  background: msg.sender === "user" ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  border: msg.sender === "user" ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: msg.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "14px 16px",
                  color: "#fff",
                  boxShadow: msg.sender === "user" ? "0 4px 12px rgba(59, 130, 246, 0.1)" : "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              >
                {parseMarkdown(msg.text)}
              </div>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px", padding: "0 4px" }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "16px 16px 16px 4px",
                padding: "14px 16px",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span className="dot-pulse-glow" style={{ display: "inline-flex", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", background: "var(--secondary)", borderRadius: "50%", animation: "pulseDot 1.2s infinite ease-in-out" }}></span>
                  <span style={{ width: "6px", height: "6px", background: "var(--secondary)", borderRadius: "50%", animation: "pulseDot 1.2s infinite ease-in-out 0.2s" }}></span>
                  <span style={{ width: "6px", height: "6px", background: "var(--secondary)", borderRadius: "50%", animation: "pulseDot 1.2s infinite ease-in-out 0.4s" }}></span>
                </span>
                <span style={{ fontSize: "0.85rem" }}>Analyzing vitals context...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div
          style={{
            padding: "8px 16px",
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            whiteSpace: "nowrap",
            scrollbarWidth: "none", // Firefox
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            background: "rgba(0, 0, 0, 0.1)",
          }}
        >
          {actionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip.text)}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "20px",
                padding: "6px 14px",
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: "16px 20px 24px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(8, 11, 17, 0.9)",
          }}
        >
          <div style={{ display: "flex", gap: "8px", position: "relative" }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend(inputText);
              }}
              placeholder="Ask a follow-up question..."
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "12px 48px 12px 14px",
                color: "#fff",
                fontSize: "0.9rem",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 10px var(--primary-glow)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.2)";
              }}
            />
            <button
              onClick={() => handleSend(inputText)}
              disabled={!inputText.trim() || isLoading}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: inputText.trim() && !isLoading ? "pointer" : "default",
                color: inputText.trim() && !isLoading ? "var(--secondary)" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                transition: "color 0.2s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          {latestAssessment && (
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "10px", textAlign: "center" }}>
              Initialized with latest {latestAssessment.diseaseType.toLowerCase()} results.
            </div>
          )}
        </div>
      </div>

      {/* Styled Keyframes (added via global inline style for simplicity and zero package dependency) */}
      <style jsx global>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}
