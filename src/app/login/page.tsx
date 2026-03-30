"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);

    // Dev bypass: if no real Supabase project is configured, skip OAuth
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "";

    if (!isSupabaseConfigured) {
      router.push("/onboarding");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });
    if (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center text-emerald-400">VentureSimulate</h1>
        <p className="text-slate-400 text-center mb-8">Executive Decision Intelligence</p>
        
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mt-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 flex justify-center items-center shadow-lg"
        >
          {loading ? "Connecting securely..." : "Continue with Google (OAuth)"}
        </button>
      </div>
    </div>
  );
}
