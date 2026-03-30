import { create } from "zustand";
import { StoreState, SimulationContext, AIConsequenceResponse, MapNode } from "../lib/contracts/types";
import { InitialSimulationState } from "../lib/mock/MockData";

export const useSimulationStore = create<StoreState>((set, get) => ({
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

  runSimulationTurn: async (action: string) => {
    set({ isEvaluating: true });
    try {
      // Package the entire current state object to seed the AI prompt
      const stateObject = get();
      
      // Dev 1: Contact Gemini 1.5 Edge Route
      const response = await fetch('/api/simulation/consequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, state: stateObject })
      });
      
      if (!response.ok) {
        throw new Error('Simulation API returned an error');
      }
      
      // The API Route guarantees the response conforms to our AIConsequenceResponse schema
      const payload: AIConsequenceResponse = await response.json();
      
      // Complete Handshake by invoking the synchronous math gatekeeper
      get().applyConsequence(payload);

    } catch (error) {
      console.error("Simulation Turn Error:", error);
      // Fallback: Notify user of error via narrative without losing state
      set((state) => ({
        narrativeHistory: [...state.narrativeHistory, "SYSTEM ERROR: The Consequence Engine failed to evaluate that particular action. Please try again or rephrase."]
      }));
    } finally {
      set({ isEvaluating: false });
    }
  },

  resetSimulation: () => set(() => ({ ...InitialSimulationState, isEvaluating: false })),
}));
