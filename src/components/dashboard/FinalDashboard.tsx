"use client";

import { useEffect, useRef, useState } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import gsap from "gsap";
import { MessageSquare, Send, RefreshCw, Loader2 } from "lucide-react";

export default function FinalDashboard() {
  const { 
    metrics, budget, turn, finalReport, isGeneratingReport, 
    resetSimulation
  } = useSimulationStore();
  
  const dashboardRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Array<{id: string, role: string, content: string}>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const newMsg = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/simulation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages,
          state: useSimulationStore.getState()
        }),
      });

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const assistantMsg = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };
        setMessages([...newMessages, assistantMsg]);
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const textChunk = JSON.parse(line.slice(2));
                assistantMsg.content += textChunk;
                setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...assistantMsg } : m));
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reveal animation
    if (dashboardRef.current) {
      gsap.fromTo(
        dashboardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
    
    if (metricsRef.current?.children) {
      gsap.fromTo(
        metricsRef.current.children,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.4 }
      );
    }
  }, []);

  return (
    <div ref={dashboardRef} className="flex-1 flex flex-col md:flex-row gap-6 h-full p-2">
      
      {/* Left Column: Report & Metrics */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Header summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
            Simulation Concluded
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            You completed the run in {turn - 1} turns with a final budget of ${budget.toLocaleString()}.
          </p>

          <div ref={metricsRef} className="grid grid-cols-2 gap-4">
            <FinalMetricCard label="Social Impact" value={metrics.socialImpact} color="text-blue-400" />
            <FinalMetricCard label="Financial Sustainability" value={metrics.financialSustainability} color="text-emerald-400" />
            <FinalMetricCard label="Risk Exposure" value={metrics.riskExposure} color="text-red-400" />
            <FinalMetricCard label="Stakeholder Trust" value={metrics.stakeholderTrust} color="text-amber-400" />
          </div>
        </div>

        {/* AI Final Report */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>📋</span> AI Performance Report
          </h3>
          
          <div className="flex-1 rounded-lg bg-slate-950/50 p-5 text-slate-300 text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap border border-slate-800/50">
            {isGeneratingReport ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-emerald-500/80">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="animate-pulse font-medium">Drafting your final evaluation...</p>
              </div>
            ) : (
              finalReport || "No report generated."
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Chatbot */}
      <div className="w-full md:w-96 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shrink-0">
        <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Venture Analyst</h3>
          </div>
          <button 
            onClick={resetSimulation}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition-colors border border-slate-700 hover:border-slate-600"
          >
            <RefreshCw className="w-3 h-3" />
            New Run
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
              <MessageSquare className="w-8 h-8 text-slate-500 mb-3" />
              <p className="text-sm text-slate-400">Ask about your strategy, what went wrong, or what you could have done better.</p>
            </div>
          ) : (
            messages.map((m: any) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  m.role === 'user' 
                    ? 'bg-emerald-600/90 text-white rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 rounded-bl-none'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-400 rounded-lg rounded-bl-none p-3 text-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900">
          <div className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Ask about your run..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-shadow disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-cyan-400 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

function FinalMetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-mono font-bold ${color}`}>{value}</span>
        <span className="text-xs text-slate-600 mb-1">/100</span>
      </div>
    </div>
  );
}
