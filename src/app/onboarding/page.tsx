"use client";

import SetupForm from "@/components/setup/SetupForm";

export default function OnboardingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
      
      <div className="z-10 w-full max-w-xl p-4">
        <SetupForm />
      </div>
    </div>
  );
}
