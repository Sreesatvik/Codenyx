"use client";

import { useSimulationStore } from "@/store/simulationStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { SimulationContextSchema } from "@/lib/contracts/schemas";

type ExperienceLevel = z.infer<typeof SimulationContextSchema>["experienceLevel"];

export default function OnboardingPage() {
  const router = useRouter();
  const setContext = useSimulationStore((state) => state.setContext);

  const [domain, setDomain] = useState("");
  const [purpose, setPurpose] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel>("BEGINNER");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContext({
      domain,
      purpose,
      experienceLevel: experience,
    });
    // For now we push to dashboard/decision hub.
    router.push("/decision-hub");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
      <div className="w-full max-w-lg p-8 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-emerald-400">Context Gathering</h1>
        <p className="text-slate-400 mb-8">Define your social enterprise parameters to generate the simulation baseline.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Industry Domain</label>
            <input 
              type="text" 
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. Clean Energy, EdTech, Healthcare"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Core Purpose / Mission</label>
            <textarea 
              required
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Provide affordable solar power to rural communities."
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Player Experience Level</label>
            <select 
              value={experience}
              onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="BEGINNER">Explorer (Little real-world exposure)</option>
              <option value="INTERMEDIATE">Experimenter (Has attempted ventures)</option>
              <option value="EXPERT">Struggler (Operating but facing challenges)</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full text-lg mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-md transition-colors flex justify-center items-center shadow-lg"
          >
            Generate Simulation Context
          </button>
        </form>
      </div>
    </div>
  );
}
