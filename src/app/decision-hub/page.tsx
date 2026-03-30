"use client";

import DecisionHubCanvas from "@/components/canvas/DecisionHubCanvas";
import { useSimulationStore } from "@/store/simulationStore";

// This file unites Dev 2 (State), Dev 3 (UI), and Dev 4 (Canvas).
export default function DecisionHub() {
  const { budget, metrics, turn, context } = useSimulationStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col gap-8">
      
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
      <div className="flex gap-8 flex-grow">
        
        {/* Left Side: Metrics Panel */}
        <aside className="w-1/4 bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-slate-300 border-b border-slate-700 pb-2">Core Metrics</h2>
          
          <div className="space-y-6">
            <MetricBar label="Social Impact" value={metrics.socialImpact} color="bg-blue-500" />
            <MetricBar label="Financial Sustainability" value={metrics.financialSustainability} color="bg-emerald-500" />
            <MetricBar label="Risk Exposure" value={metrics.riskExposure} color="bg-red-500" />
            <MetricBar label="Stakeholder Trust" value={metrics.stakeholderTrust} color="bg-amber-500" />
          </div>
        </aside>

        {/* Right Side: Dev 4 Canvas Ecosystem */}
        <main className="w-3/4 flex flex-col gap-4">
          <DecisionHubCanvas />
          
          {/* Bottom Menu Prototype (To be built in Phase 3) */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex justify-between items-center shadow-lg">
            <p className="text-slate-400 italic">Phase 3 Interactive Logos (Product Building, Advertising, etc.) will render here.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

// Simple internal component to render the state visually
function MetricBar({ label, value, color }: { label: string, value: number, color: string }) {
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
