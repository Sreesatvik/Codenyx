"use client";

import { useState } from "react";
import DecisionHubCanvas from "@/components/canvas/DecisionHubCanvas";
import { useSimulationStore } from "@/store/simulationStore";

// Dev 3: This file unites Dev 2 (State), Dev 3 (UI), Dev 4 (Canvas), and Dev 1 (AI API).
export default function DecisionHub() {
  const { budget, metrics, turn, context, narrativeHistory, isEvaluating, runSimulationTurn } = useSimulationStore();
  const [actionInput, setActionInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionInput.trim() || isEvaluating) return;
    await runSimulationTurn(actionInput.trim());
    setActionInput("");
  };

  const latestNarrative = narrativeHistory[narrativeHistory.length - 1] || "Awaiting your first strategic decision...";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col gap-6">

      {/* Dev 3: Top Navigation Bar reading from Dev 2 State */}
      <header className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            VentureSimulate | Turn {turn}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {context?.domain || "Unassigned Domain"} • {context?.purpose || "No Purpose Defined"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Available Budget</p>
          <p className="text-4xl font-mono text-emerald-400">${budget.toLocaleString()}</p>
        </div>
      </header>

      {/* Main Grid Interface */}
      <div className="flex gap-6 flex-grow">

        {/* Left Side: Metrics Panel */}
        <aside className="w-1/4 bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-slate-300 border-b border-slate-700 pb-2">Core Metrics</h2>
          <div className="space-y-6">
            <MetricBar label="Social Impact" value={metrics.socialImpact} color="bg-blue-500" />
            <MetricBar label="Financial Sustainability" value={metrics.financialSustainability} color="bg-emerald-500" />
            <MetricBar label="Risk Exposure" value={metrics.riskExposure} color="bg-red-500" />
            <MetricBar label="Stakeholder Trust" value={metrics.stakeholderTrust} color="bg-amber-500" />
          </div>

          {/* Narrative History Panel */}
          <div className="mt-8 flex-1 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Event Log</h2>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-48 pr-1">
              {narrativeHistory.slice().reverse().map((entry, i) => (
                <p key={i} className={`text-xs text-slate-400 border-l-2 pl-2 py-1 ${i === 0 ? 'border-emerald-500 text-slate-200' : 'border-slate-700'}`}>
                  {entry}
                </p>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side: Canvas + AI Interface */}
        <main className="w-3/4 flex flex-col gap-4">
          <DecisionHubCanvas />

          {/* Dev 3: AI Narrative Box — Latest Gemini Response */}
          <div className={`bg-slate-900 border rounded-xl p-5 shadow-lg transition-all duration-300 ${isEvaluating ? 'border-emerald-600 animate-pulse' : 'border-slate-800'}`}>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">
              {isEvaluating ? "⚙️ Consequence Engine Evaluating..." : "📋 Latest Consequence"}
            </p>
            <p className="text-slate-200 text-sm leading-relaxed">
              {isEvaluating ? "Gemini 1.5 Flash is evaluating your decision and calculating the consequences..." : latestNarrative}
            </p>
          </div>

          {/* Dev 3: Action Input — triggers runSimulationTurn */}
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex gap-3 shadow-lg">
            <input
              type="text"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              disabled={isEvaluating}
              placeholder='Enter your strategic decision (e.g. "Invest $300 in community outreach")'
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isEvaluating || !actionInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              {isEvaluating ? "Evaluating..." : "Execute Decision →"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm font-medium text-slate-400">{value}/100</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
