"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mocking an auth delay
    setTimeout(() => {
      setLoading(false);
      router.push("/onboarding");
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center text-emerald-400">VentureSimulate</h1>
        <p className="text-slate-400 text-center mb-8">Executive Decision Intelligence</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="executive@example.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? "Authenticating..." : "Secure Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
