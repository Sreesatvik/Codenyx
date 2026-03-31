"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useSimulationStore } from "@/store/simulationStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const setUser = useSimulationStore((state) => state.setUser);
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;

      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email! });
        router.push("/decision-hub");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-xl shadow-indigo-500/20 mb-6">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">VentureSimulate</h1>
          <p className="text-slate-400 text-sm">Decision Intelligence for Social Ventures</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setIsSignUp(false)}
              className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${!isSignUp ? 'text-indigo-400 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsSignUp(true)}
              className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${isSignUp ? 'text-indigo-400 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Access Simulation"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span className="px-3 bg-slate-900/40 text-slate-500">Or continue with</span></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-2xl transition-all hover:bg-slate-100 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google OAuth
          </button>
        </div>

        <p className="text-center mt-10 text-xs text-slate-500">
          By continuing, you agree to the VentureSimulate <br/>
          <span className="text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors underline underline-offset-4">Terms of Operational Access</span>
        </p>
      </div>
    </div>
  );
}
