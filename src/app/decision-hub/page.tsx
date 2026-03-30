"use client";

import { useState, useEffect, useRef } from "react";
import AnimatedMap from "@/components/canvas/AnimatedMap";
import FinalDashboard from "@/components/dashboard/FinalDashboard";
import { useSimulationStore } from "@/store/simulationStore";
import gsap from "gsap";

// --- Approach Logos (Dev 3) ---
const APPROACHES = [
  {
    id: "product",
    emoji: "🏗️",
    label: "Product Building",
    description: "Build a core feature",
    action: "Build a core product feature or prototype that directly serves our target community",
    cost: "~$200–500",
    color: "from-blue-600 to-blue-800",
    border: "border-blue-500/40",
    hover: "hover:border-blue-400",
  },
  {
    id: "advertising",
    emoji: "📢",
    label: "Advertising",
    description: "Launch a campaign",
    action: "Launch a targeted social media and local advertising campaign to grow awareness",
    cost: "~$150–300",
    color: "from-orange-600 to-orange-800",
    border: "border-orange-500/40",
    hover: "hover:border-orange-400",
  },
  {
    id: "community",
    emoji: "🤝",
    label: "Community Outreach",
    description: "Engage the community",
    action: "Run community engagement workshops and events to build trust and social impact",
    cost: "~$100–250",
    color: "from-emerald-600 to-emerald-800",
    border: "border-emerald-500/40",
    hover: "hover:border-emerald-400",
  },
  {
    id: "rnd",
    emoji: "🔬",
    label: "Research & Dev",
    description: "Invest in innovation",
    action: "Invest in research and development to improve our approach and validate our model",
    cost: "~$300–600",
    color: "from-purple-600 to-purple-800",
    border: "border-purple-500/40",
    hover: "hover:border-purple-400",
  },
  {
    id: "partnership",
    emoji: "🏛️",
    label: "Partnership",
    description: "Form an alliance",
    action: "Form a strategic partnership with an established organization in our domain",
    cost: "~$50–150",
    color: "from-cyan-600 to-cyan-800",
    border: "border-cyan-500/40",
    hover: "hover:border-cyan-400",
  },
  {
    id: "grant",
    emoji: "💰",
    label: "Government Grant",
    description: "Apply for funding",
    action: "Apply for a government grant or public funding program relevant to our social mission",
    cost: "+$200–800",
    color: "from-amber-600 to-amber-800",
    border: "border-amber-500/40",
    hover: "hover:border-amber-400",
  },
  {
    id: "stakeholder",
    emoji: "🗣️",
    label: "Stakeholder Meeting",
    description: "Negotiate with key actors",
    action: "Hold a stakeholder negotiation meeting to align investor expectations, community demands, and operational capacity",
    cost: "~$50–100",
    color: "from-teal-600 to-teal-800",
    border: "border-teal-500/40",
    hover: "hover:border-teal-400",
  },
  {
    id: "crisis",
    emoji: "🚨",
    label: "Crisis Response",
    description: "Address an emergency",
    action: "Deploy an emergency crisis response plan — address a critical issue threatening the venture's operations or reputation",
    cost: "~$200–500",
    color: "from-red-600 to-red-800",
    border: "border-red-500/40",
    hover: "hover:border-red-400",
  },
  {
    id: "compliance",
    emoji: "📋",
    label: "Regulatory Compliance",
    description: "Meet legal requirements",
    action: "Invest in regulatory compliance, legal documentation, and government reporting requirements",
    cost: "~$100–300",
    color: "from-slate-500 to-slate-700",
    border: "border-slate-400/40",
    hover: "hover:border-slate-300",
  },
];

// ---- Main Page ----
export default function DecisionHub() {
  const {
    budget, metrics, turn, context, mapNodes, avatarPos,
    narrativeHistory, isEvaluating, isGameOver, lastTransaction,
    runSimulationTurn, resetSimulation, loadFromDatabase,
  } = useSimulationStore();

  useEffect(() => {
    loadFromDatabase();
  }, [loadFromDatabase]);

  const [actionInput, setActionInput] = useState("");
  const [activeApproach, setActiveApproach] = useState<string | null>(null);

  // GSAP budget counter ref
  const budgetRef = useRef<HTMLParagraphElement>(null);
  const prevBudget = useRef(budget);

  // Dev 5: GSAP animate budget when it changes
  useEffect(() => {
    if (!budgetRef.current || prevBudget.current === budget) return;
    const obj = { val: prevBudget.current };
    gsap.to(obj, {
      val: budget,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        if (budgetRef.current) {
          budgetRef.current.textContent = `$${Math.round(obj.val).toLocaleString()}`;
        }
      },
    });
    prevBudget.current = budget;
  }, [budget]);

  const handleApproachClick = async (approach: typeof APPROACHES[0]) => {
    if (isEvaluating) return;
    setActiveApproach(approach.id);

    // GSAP ripple on click
    gsap.fromTo(
      `#approach-${approach.id}`,
      { scale: 0.95 },
      { scale: 1, duration: 0.3, ease: "back.out(2)" }
    );

    await runSimulationTurn(approach.action);
    setActiveApproach(null);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionInput.trim() || isEvaluating) return;
    await runSimulationTurn(actionInput.trim());
    setActionInput("");
  };

  const latestNarrative = narrativeHistory[narrativeHistory.length - 1] || "Awaiting your first strategic decision...";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* ── Header ── */}
      <header className="flex justify-between items-center bg-slate-900/80 backdrop-blur border-b border-slate-800 px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            VentureSimulate <span className="text-slate-500 font-normal">| Turn {turn}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {context?.domain || "No Domain"} · {context?.purpose?.slice(0, 60) || "No Purpose"}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Available Budget</p>
            <div className="relative">
              <p ref={budgetRef} className="text-4xl font-mono font-bold text-emerald-400">
                ${budget.toLocaleString()}
              </p>
              {lastTransaction && !isEvaluating && turn > 1 && (
                <p className="text-[10px] font-mono mt-1 flex gap-2 justify-end animate-in fade-in slide-in-from-top-1 duration-500 absolute right-0 top-full">
                  <span className="text-red-400">-{lastTransaction.cost} cost</span>
                  <span className="text-emerald-400">+{lastTransaction.revenue} rev</span>
                  <span className={`font-bold ${lastTransaction.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    ({lastTransaction.net >= 0 ? '+' : ''}{lastTransaction.net} net)
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={resetSimulation}
            className="text-xs text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-500/50 px-3 py-1.5 rounded-lg transition-colors ml-4"
          >
            Reset
          </button>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <div className="flex flex-1 gap-0 overflow-hidden">

        {/* Left: Metrics + Event Log */}
        <aside className="w-72 flex-shrink-0 bg-slate-900/60 border-r border-slate-800 p-5 flex flex-col gap-5 overflow-y-auto">
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Core Metrics</h2>
            <div className="space-y-4">
              <MetricBar label="Social Impact" value={metrics.socialImpact} color="bg-blue-500" glow="shadow-blue-500/30" />
              <MetricBar label="Financial Sustainability" value={metrics.financialSustainability} color="bg-emerald-500" glow="shadow-emerald-500/30" />
              <MetricBar label="Risk Exposure" value={metrics.riskExposure} color="bg-red-500" glow="shadow-red-500/30" />
              <MetricBar label="Stakeholder Trust" value={metrics.stakeholderTrust} color="bg-amber-500" glow="shadow-amber-500/30" />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Event Log</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {narrativeHistory.slice().reverse().map((entry, i) => (
                <div key={i} className={`text-xs py-1.5 px-2 rounded border-l-2 ${i === 0 ? 'border-emerald-500 bg-emerald-950/30 text-slate-200' : 'border-slate-700 text-slate-400'}`}>
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Canvas + Controls */}
        <main className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto relative">

          {isGameOver ? (
            <div className="absolute inset-0 p-5 bg-slate-950 z-10 flex flex-col">
              <FinalDashboard />
            </div>
          ) : (
            <>
              {/* Pure CSS Animated Isometric Map */}
              <AnimatedMap 
                nodes={mapNodes.map(n => ({ id: n.id, name: n.type.replace(/_/g, ' '), x: n.x, y: n.y }))} 
                avatarPos={avatarPos} 
              />

          {/* AI Narrative Box */}
          <div className={`bg-slate-900/60 border rounded-xl p-4 transition-all duration-300 ${isEvaluating ? 'border-emerald-500/60 animate-pulse' : 'border-slate-800'}`}>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">
              {isEvaluating ? "⚙️ Consequence Engine Computing..." : "📋 Latest Consequence"}
            </p>
            <p className="text-slate-200 text-sm leading-relaxed">
              {isEvaluating ? "Analyzing your decision and calculating all cascading consequences..." : latestNarrative}
            </p>
          </div>

          {/* ── Approach Logos (Dev 3) ── */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-semibold">Strategic Approaches</p>
            <div className="grid grid-cols-3 gap-3">
              {APPROACHES.map((approach) => (
                <button
                  key={approach.id}
                  id={`approach-${approach.id}`}
                  onClick={() => handleApproachClick(approach)}
                  disabled={isEvaluating}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200
                    bg-gradient-to-b ${approach.color} ${approach.border} ${approach.hover}
                    disabled:opacity-40 disabled:cursor-not-allowed
                    ${activeApproach === approach.id ? 'ring-2 ring-white/30 scale-95' : 'hover:scale-105 hover:shadow-lg'}
                  `}
                >
                  <span className="text-2xl">{approach.emoji}</span>
                  <span className="text-xs font-semibold text-white text-center leading-tight">{approach.label}</span>
                  <span className="text-xs text-white/60 text-center">{approach.cost}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Action Input */}
          <form onSubmit={handleCustomSubmit} className="flex gap-3">
            <input
              type="text"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              disabled={isEvaluating}
              placeholder='Or type a custom decision (e.g. "Hire a marketing consultant for $400")'
              className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isEvaluating || !actionInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              {isEvaluating ? "Evaluating..." : "Execute →"}
            </button>
          </form>
          </>
          )}
        </main>
      </div>
    </div>
  );
}

// Internal MetricBar component
function MetricBar({ label, value, color, glow }: { label: string; value: number; color: string; glow?: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className="text-xs font-mono text-slate-400">{value}/100</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full ${color} shadow-sm ${glow || ''} transition-all duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
