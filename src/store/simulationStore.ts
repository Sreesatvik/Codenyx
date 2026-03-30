import { create } from "zustand";
import { StoreState, SimulationContext, AIConsequenceResponse } from "../lib/contracts/types";
import { InitialSimulationState } from "../lib/mock/MockData";

export const useSimulationStore = create<StoreState>((set) => ({
  ...InitialSimulationState,

  // ✅ ADD THESE (fixes your TypeScript errors)
  finalReport: null,
  isGeneratingReport: false,

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

  // ✅ OPTIONAL (good practice)
  setGeneratingReport: (val: boolean) =>
    set(() => ({ isGeneratingReport: val })),

  setFinalReport: (report: any) =>
    set(() => ({ finalReport: report })),

  resetSimulation: () =>
    set(() => ({
      ...InitialSimulationState,
      finalReport: null,
      isGeneratingReport: false,
    })),
}));