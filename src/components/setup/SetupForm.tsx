"use client";

import { useState } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { SimulationContextSchema } from "@/lib/contracts/schemas";

type ExperienceLevel = z.infer<typeof SimulationContextSchema>["experienceLevel"];

export default function SetupForm() {
  const [domain, setDomain] = useState("");
  const [purpose, setPurpose] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel>("BEGINNER");
  const [budget, setBudget] = useState<number>(2000);
  
  const setInitialBudget = useSimulationStore((state) => state.setInitialBudget);
  const setContext = useSimulationStore((state) => state.setContext);
  const router = useRouter();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Initialize Context
    setContext({
      domain,
      purpose,
      experienceLevel: experience,
    });
    
    // 2. Initialize Budget
    setInitialBudget(budget);
    
    // 3. Launch Simulation
    router.push("/decision-hub");
  };

  return (
    <div className="bg-slate-900 border border-slate-700/50 p-8 rounded-xl shadow-2xl w-full max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-emerald-400">Engine Configuration</h1>
      <p className="text-slate-400 mb-8 text-sm uppercase tracking-widest">Domain-Agnostic Simulation Setup</p>
      
      <form onSubmit={handleStart} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300 uppercase tracking-tighter">Venture Domain</label>
          <input 
            type="text" 
            required
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. Healthcare, Space Tech, Social Housing"
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300 uppercase tracking-tighter">Core Mission</label>
          <textarea 
            required
            rows={2}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="What is the primary impact goal of this venture?"
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300 uppercase tracking-tighter">Starting Budget ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
              <input
                type="number"
                min="0"
                max="1000000"
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-md pl-7 pr-4 py-3 text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300 uppercase tracking-tighter">Experience Level</label>
            <select 
              value={experience}
              onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner h-[52px]"
            >
              <option value="BEGINNER">Explorer</option>
              <option value="INTERMEDIATE">Practitioner</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-4 rounded-md transition-all flex justify-center items-center shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
        >
          Initialize Engine →
        </button>
      </form>
    </div>
  );
}
