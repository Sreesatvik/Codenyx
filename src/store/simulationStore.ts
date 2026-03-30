import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreState, SimulationContext, AIConsequenceResponse } from "../lib/contracts/types";
import { InitialSimulationState } from "../lib/mock/MockData";

export const useSimulationStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...InitialSimulationState,
      isEvaluating: false,

      setContext: (context: SimulationContext) =>
        set(() => ({
          context,
          narrativeHistory: [
            `Scenario Initialized. Domain: ${context.domain}. Purpose: ${context.purpose}. Experience: ${context.experienceLevel}.`
          ]
        })),

      applyConsequence: (consequence: AIConsequenceResponse) =>
        set((state) => {
          const newBudget = state.budget - consequence.budgetCost;
          const clamp = (val: number) => Math.min(100, Math.max(0, val));

          const newMetrics = {
            socialImpact: clamp(state.metrics.socialImpact + consequence.metricShifts.socialImpact),
            financialSustainability: clamp(state.metrics.financialSustainability + consequence.metricShifts.financialSustainability),
            riskExposure: clamp(state.metrics.riskExposure + consequence.metricShifts.riskExposure),
            stakeholderTrust: clamp(state.metrics.stakeholderTrust + consequence.metricShifts.stakeholderTrust),
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

          return {
            budget: newBudget,
            metrics: newMetrics,
            narrativeHistory: newHistory,
            mapNodes: finalNodes,
            turn: state.turn + 1,
          };
        }),

      runSimulationTurn: async (action: string) => {
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

        } catch (error) {
          console.error("Simulation Turn Error:", error);
          set((state) => ({
            narrativeHistory: [...state.narrativeHistory, "⚠️ SYSTEM ERROR: The Consequence Engine failed to evaluate that action. Check your API key or try again."]
          }));
        } finally {
          set({ isEvaluating: false });
        }
      },

      resetSimulation: () => set(() => ({ ...InitialSimulationState, isEvaluating: false })),
    }),
    {
      name: "venture-simulate-state",
      // Only persist these fields — skip function references
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
