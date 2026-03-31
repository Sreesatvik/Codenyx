"use client";

import { useSimulationStore } from "@/store/simulationStore";
import { useRouter } from "next/navigation";
import { Plus, History, ChevronRight } from "lucide-react";

export default function SidebarHistory() {
  const { decisionHistory, turn, resetSimulation } = useSimulationStore();
  const router = useRouter();

  const handleNewSimulation = () => {
    resetSimulation();
    router.push("/onboarding");
  };

  return (
    <div className="w-72 h-screen bg-[#0f172a] border-r border-slate-800 flex flex-col shadow-2xl z-50">
      {/* Header: New Simulation Button */}
      <div className="p-4 border-b border-slate-800/50">
        <button
          onClick={handleNewSimulation}
          className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-sm font-medium text-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="p-1 bg-emerald-500/20 rounded text-emerald-400 group-hover:bg-emerald-500/30">
            <Plus size={16} />
          </div>
          New Simulation
        </button>
      </div>

      {/* History Log Title */}
      <div className="px-5 py-6 flex items-center gap-2 text-slate-500">
        <History size={14} className="opacity-50" />
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Decision History</span>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar pb-10">
        {decisionHistory.length === 0 ? (
          <div className="px-4 py-8 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700/50 mx-2">
            <p className="text-[11px] text-slate-500 italic leading-relaxed">No strategic steps <br/> recorded yet.</p>
          </div>
        ) : (
          decisionHistory.slice().reverse().map((item, i) => (
            <div
              key={`${item.turn}-${i}`}
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-default
                ${item.turn === turn - 1 
                  ? "bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5" 
                  : "hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"}
              `}
            >
              {/* Turn Indicator */}
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono
                ${item.turn === turn - 1
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-slate-800/50 text-slate-500 group-hover:text-slate-400"}
              `}>
                {item.turn}
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className={`
                  text-xs font-medium truncate tracking-tight
                  ${item.turn === turn - 1 ? "text-slate-100" : "text-slate-400 group-hover:text-slate-300"}
                `}>
                  {item.title}
                </p>
              </div>

              {/* Selection Dot */}
              {item.turn === turn - 1 && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer / Context Info */}
      <div className="p-5 border-t border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
            S
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Strategist</p>
            <p className="text-[10px] text-slate-500 truncate">VentureSimulate Pro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
