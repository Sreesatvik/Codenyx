import { create } from "zustand";
import { StoreState, SimulationContext, AIConsequenceResponse, MapNode } from "../lib/contracts/types";
import { InitialSimulationState } from "../lib/mock/MockData";

export const useSimulationStore = create<StoreState>((set) => ({
  ...InitialSimulationState,

  setContext: (context: SimulationContext) =>
    set(() => ({
      context,
      narrativeHistory: [
        `Scenario Initialized. Domain: ${context.domain}. Purpose: ${context.purpose}. Experience: ${context.experienceLevel}.`
      ]
    })),

  applyConsequence: (consequence: AIConsequenceResponse) =>
    set((state) => {
      // 1. Math Shift logic for budget
      const newBudget = state.budget - consequence.budgetCost;

      // Ensure metrics clamp between 0 and 100
      const clamp = (val: number) => Math.min(100, Math.max(0, val));

      // 2. Math shift logic for metrics
      const newMetrics = {
        socialImpact: clamp(state.metrics.socialImpact + consequence.metricShifts.socialImpact),
        financialSustainability: clamp(state.metrics.financialSustainability + consequence.metricShifts.financialSustainability),
        riskExposure: clamp(state.metrics.riskExposure + consequence.metricShifts.riskExposure),
        stakeholderTrust: clamp(state.metrics.stakeholderTrust + consequence.metricShifts.stakeholderTrust),
      };

      // 3. Update narrative
      const newHistory = [...state.narrativeHistory, consequence.narrative];

      // 4. Update map nodes (add new, update existing)
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

  resetSimulation: () => set(() => ({ ...InitialSimulationState })),
}));
