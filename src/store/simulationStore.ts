import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreState, SimulationContext, AIConsequenceResponse } from "../lib/contracts/types";
import { InitialSimulationState } from "../lib/mock/MockData";
import { supabase } from "../lib/supabase/client";

// Clamp a value to [min, max]
const clampBounds = (val: number, min = 0, max = 100) => Math.min(max, Math.max(min, val));
// Clamp metric shifts to [-20, +20] (standard) or [-30, +30] (crisis)  
const clampShift = (val: number, limit = 20) => Math.min(limit, Math.max(-limit, val));

export const useSimulationStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...InitialSimulationState,
      isEvaluating: false,
      isGameOver: false,
      isGeneratingReport: false,
      finalReport: null,

      setContext: (context: SimulationContext) =>
        set(() => ({
          context,
          narrativeHistory: [
            `Scenario Initialized. Domain: ${context.domain}. Purpose: ${context.purpose}. Experience: ${context.experienceLevel}.`
          ]
        })),

      loadFromDatabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const { data, error } = await supabase
            .from('simulations')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (error && error.code !== 'PGRST116') {
            console.error("DB Load Error:", error);
            return;
          }
          if (data) {
            set({
              budget: Number(data.budget),
              metrics: data.metrics,
              turn: data.turn,
              context: data.context,
              mapNodes: data.map_nodes,
              narrativeHistory: data.narrative_history,
              isGameOver: data.is_game_over,
              finalReport: data.final_report,
            });
          }
        } catch (e) {
          console.error("Failed to load from DB:", e);
        }
      },

      syncToDatabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const state = get();
          await supabase.from('simulations').upsert({
            user_id: user.id,
            budget: state.budget,
            metrics: state.metrics,
            turn: state.turn,
            context: state.context,
            map_nodes: state.mapNodes,
            narrative_history: state.narrativeHistory,
            is_game_over: state.isGameOver,
            final_report: state.finalReport
          });
        } catch (e) {
          console.error("Failed to sync to DB:", e);
        }
      },

      applyConsequence: (consequence: AIConsequenceResponse) =>
        set((state) => {
          // 1. Budget Integrity: clamp to 0 minimum
          const rawBudget = state.budget - consequence.budgetCost;
          const newBudget = Math.max(0, rawBudget);

          // 2. Enforce Shift Limits: max ±20 per metric per turn
          let siShift = clampShift(consequence.metricShifts.socialImpact);
          let fsShift = clampShift(consequence.metricShifts.financialSustainability);
          const reShift = clampShift(consequence.metricShifts.riskExposure);
          const stShift = clampShift(consequence.metricShifts.stakeholderTrust);

          // 3. Enforce Trade-off: if Social Impact goes way up, Finance must drop
          if (siShift > 10 && fsShift > 0) {
            fsShift = Math.min(fsShift, -Math.floor(siShift / 3));
          }
          if (fsShift > 10 && siShift > 0) {
            siShift = Math.min(siShift, -Math.floor(fsShift / 3));
          }

          const newMetrics = {
            socialImpact: clampBounds(state.metrics.socialImpact + siShift),
            financialSustainability: clampBounds(state.metrics.financialSustainability + fsShift),
            riskExposure: clampBounds(state.metrics.riskExposure + reShift),
            stakeholderTrust: clampBounds(state.metrics.stakeholderTrust + stShift),
          };

          const newHistory = [...state.narrativeHistory, consequence.narrative];

          let finalNodes = [...state.mapNodes];
          if (consequence.updatedNodes) {
            finalNodes = finalNodes.map(node => {
              const updated = consequence.updatedNodes?.find(un => un.id === node.id);
              return updated ? updated : node;
            });
          }
          if (consequence.newNodes) {
            finalNodes = [...finalNodes, ...consequence.newNodes];
          }

          // Game ends at turn 8 (not 5), or if budget bottoms out, or AI flags it
          const nextTurn = state.turn + 1;
          return {
            budget: newBudget,
            metrics: newMetrics,
            narrativeHistory: newHistory,
            mapNodes: finalNodes,
            turn: nextTurn,
            isGameOver: consequence.isGameEnding || nextTurn >= 8 || rawBudget <= 0,
          };
        }),

      runSimulationTurn: async (action: string) => {
        // Race condition guard: prevent double-clicks
        if (get().isEvaluating) return;
        set({ isEvaluating: true });
        try {
          const stateObject = get();
          const response = await fetch('/api/simulation/consequence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, state: stateObject })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Simulation API returned an error');
          }

          const payload: AIConsequenceResponse = await response.json();
          get().applyConsequence(payload);

          if (get().isGameOver && !get().isGeneratingReport && !get().finalReport) {
            get().endSimulation();
          }

          // Persist to database
          get().syncToDatabase();

        } catch (error) {
          console.error("Simulation Turn Error:", error);
          set((state) => ({
            narrativeHistory: [...state.narrativeHistory, "⚠️ SYSTEM ERROR: The Consequence Engine failed to evaluate that action. Check your API key or try again."]
          }));
        } finally {
          set({ isEvaluating: false });
        }
      },

      resetSimulation: () => set(() => ({ ...InitialSimulationState, isEvaluating: false, isGameOver: false, isGeneratingReport: false, finalReport: null })),

      endSimulation: async () => {
        set({ isGeneratingReport: true });
        try {
          const stateObject = get();
          const response = await fetch('/api/simulation/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stateObject)
          });
          
          if (!response.ok) throw new Error("Failed to generate report");
          
          const data = await response.json();
          set({ finalReport: data.report });
          get().syncToDatabase();
        } catch (error) {
          console.error("Report Generation Error:", error);
          set({ finalReport: "Error: Could not generate report. Please check API keys." });
        } finally {
          set({ isGeneratingReport: false });
        }
      },
    }),
    {
      name: "venture-simulate-state",
      partialize: (state) => ({
        budget: state.budget,
        metrics: state.metrics,
        turn: state.turn,
        context: state.context,
        mapNodes: state.mapNodes,
        narrativeHistory: state.narrativeHistory,
      }),
    }
  )
);
