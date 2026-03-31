"use client";

import { useState, useEffect, useRef } from "react";
import AnimatedMap from "@/components/canvas/AnimatedMap";
import FinalDashboard from "@/components/dashboard/FinalDashboard";
import SidebarHistory from "@/components/layout/SidebarHistory";
import { useSimulationStore } from "@/store/simulationStore";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import gsap from "gsap";

// --- Strategic Approaches (Strategic Approaches) ---
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
    runSimulationTurn, loadFromDatabase, setUser, user
  } = useSimulationStore();

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser({ id: data.user.id, email: data.user.email! });
      }
    };
    checkSession();
    loadFromDatabase();
  }, [loadFromDatabase, setUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  const [actionInput, setActionInput] = useState("");
  const [activeApproach, setActiveApproach] = useState<string | null>(null);

  // GSAP budget counter ref
  const budgetRef = useRef<HTMLParagraphElement>(null);
  const prevBudget = useRef(budget);

  // Animate budget when it changes
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

    // Ripple animation
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

  const latestNarrative = narrativeHistory[narrativeHistory.length - 1] || "Awaiting your strategic move...";

  return (
    <div className="h-screen w-full flex bg-[#0f172a] text-slate-100 overflow-hidden">
      
      {/* ── LEFT SIDEBAR: ChatGPT History Log ── */}
      <SidebarHistory />

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar relative bg-slate-950/20">
        
        {/* Top Floating Dashboard Header */}
        <header className="sticky top-0 z-40 w-full bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80 px-8 py-5 flex justify-between items-center transition-all duration-300">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">Active Simulation</h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {context?.domain || "Venture"} · {context?.purpose?.slice(0, 50)}...
            </p>
          </div>

          <div className="flex items-center gap-10">
             {/* Turn Counter Widget */}
             <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Current Turn</span>
              <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <span className="text-lg font-mono font-bold text-indigo-400">{turn}/8</span>
              </div>
            </div>

            {/* Budget Widget */}
            <div className="text-right flex flex-col items-end">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Operating Capital</p>
              <div className="relative">
                <p ref={budgetRef} className="text-3xl font-mono font-bold text-emerald-400 tabular-nums">
                  ${budget.toLocaleString()}
                </p>
                {lastTransaction && !isEvaluating && turn > 1 && (
                  <div className="absolute right-0 top-full pt-1.5 flex gap-2 animate-in fade-in slide-in-from-top-1">
                    <span className="text-[9px] font-mono bg-red-400/10 text-red-400 px-1.5 py-0.5 rounded border border-red-400/20">-{lastTransaction.cost} cost</span>
                    <span className="text-[9px] font-mono bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-400/20">+{lastTransaction.revenue} rev</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4 pl-10 border-l border-slate-800/80">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Authenticated as</p>
              <p className="text-xs font-semibold text-slate-200">{user?.email || "Strategist"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all active:scale-95 group"
              title="Logout"
            >
              <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Inner Content Grid */}
        <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-32">
          
          {isGameOver ? (
            <div className="animate-in fade-in zoom-in-95 duration-700">
              <FinalDashboard />
            </div>
          ) : (
            <>
              {/* Map + Metrics Layout */}
              <div className="grid grid-cols-12 gap-8 items-start">
                
                {/* Left: Interactive Isometric Map */}
                <div className="col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative group">
                   <div className="absolute top-6 left-6 z-10 px-3 py-1.5 bg-slate-950/60 backdrop-blur rounded-lg border border-slate-800/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Procedural Infrastructure</p>
                   </div>
                   <AnimatedMap 
                    nodes={mapNodes.map(n => ({ id: n.id, name: n.type.replace(/_/g, ' '), x: n.x, y: n.y }))} 
                    avatarPos={avatarPos} 
                  />
                </div>

                {/* Right: Real-time Metrics Radar */}
                <div className="col-span-4 flex flex-col gap-6">
                  <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Simulation Vitals</h2>
                    <div className="space-y-6">
                      <MetricBar label="Social Impact" value={metrics.socialImpact} color="bg-blue-500" glow="shadow-blue-500/30" />
                      <MetricBar label="Financial Sustainability" value={metrics.financialSustainability} color="bg-emerald-500" glow="shadow-emerald-500/30" />
                      <MetricBar label="Risk Exposure" value={metrics.riskExposure} color="bg-red-500" glow="shadow-red-500/30" />
                      <MetricBar label="Stakeholder Trust" value={metrics.stakeholderTrust} color="bg-amber-500" glow="shadow-amber-500/30" />
                    </div>
                  </div>

                  {/* Sub-narrative or micro-updates could go here */}
                  <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/5 border border-indigo-500/20 rounded-2xl p-5">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Strategy Tip</p>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                      "Social impact builds trust, but trust alone won't fund your next center. Balance your mission with sustainable revenue streams."
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Decision Interface ── */}
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                
                {/* AI Consequence Box */}
                <div className={`
                   relative bg-slate-900/60 border rounded-2xl p-6 transition-all duration-300
                   ${isEvaluating ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-slate-800 shadow-lg'}
                `}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${isEvaluating ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
                      {isEvaluating ? "Analyzing Cascading Impacts..." : "Consequence Feedback"}
                    </p>
                  </div>
                  <p className={`text-slate-200 text-base leading-relaxed ${isEvaluating ? 'opacity-40 grayscale blur-[1px]' : ''}`}>
                    {isEvaluating ? "The engine is processing your strategic decision across four dimensions..." : latestNarrative}
                  </p>
                </div>

                {/* Strategic Approach Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {APPROACHES.map((approach) => (
                    <button
                      key={approach.id}
                      id={`approach-${approach.id}`}
                      onClick={() => handleApproachClick(approach)}
                      disabled={isEvaluating}
                      className={`
                        group relative flex flex-col items-center gap-2 p-5 rounded-3xl border transition-all duration-300
                        bg-gradient-to-b ${approach.color} ${approach.border} shadow-lg
                        disabled:opacity-20 disabled:cursor-not-allowed
                        ${activeApproach === approach.id ? 'ring-2 ring-white/60 scale-[0.98]' : 'hover:scale-[1.03] hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10'}
                      `}
                    >
                      <div className="w-12 h-12 flex items-center justify-center text-3xl bg-white/10 rounded-2xl mb-1 group-hover:scale-110 transition-transform">
                        {approach.emoji}
                      </div>
                      <span className="text-xs font-bold text-white tracking-wide uppercase">{approach.label}</span>
                      <span className="text-[10px] font-mono text-white/50">{approach.cost}</span>
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity" />
                    </button>
                  ))}
                </div>

                {/* Custom Action Console */}
                <form onSubmit={handleCustomSubmit} className="relative group">
                  <input
                    type="text"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    disabled={isEvaluating}
                    placeholder='Draft a custom strategic mandate...'
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-6 py-5 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-all border-l-4 border-l-emerald-500/40 shadow-xl"
                  />
                  <button
                    type="submit"
                    disabled={isEvaluating || !actionInput.trim()}
                    className="absolute right-3 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold px-8 rounded-xl transition-all text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:gap-3"
                  >
                    {isEvaluating ? "Processing" : "Execute"}
                    {!isEvaluating && <span className="text-lg">→</span>}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Internal MetricBar component
function MetricBar({ label, value, color, glow }: { label: string; value: number; color: string; glow?: string }) {
  return (
    <div className="group">
      <div className="flex justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{label}</span>
        <span className="text-xs font-mono font-bold text-slate-400 tabular-nums">{value}/100</span>
      </div>
      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden ring-1 ring-slate-700/30">
        <div
          className={`h-2 rounded-full ${color} ${glow || ''} transition-all duration-[1000ms] ease-out relative`}
          style={{ width: `${value}%` }}
        >
           <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
