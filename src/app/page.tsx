import { redirect } from "next/navigation";

export default function Home() {
  // Enforce the Phase 1 Auth flow
  redirect("/onboarding");
}
