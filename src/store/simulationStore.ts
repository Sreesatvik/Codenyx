import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreState, SimulationContext, AIConsequenceResponse } from "../lib/contracts/types";
import { InitialSimulationState } from "../lib/mock/MockData";

// Clamp metric shifts to [-20, +20] (standard) or [-30, +30] (crisis)  
const clampShift = (val: number, limit = 20) => Math.min(limit, Math.max(-limit, val));

// Deterministic Zig-Zag Pathfinding
const calculateNextPosition = (lastNode: { x: number, y: number }, count: number) => {
  return {
    x: lastNode.x + (count % 2 === 1 ? 1 : 0),
    y: lastNode.y + (count % 2 === 0 ? 1 : 0),
  };
};

export const useSimulationStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...InitialSimulationState,
      isEvaluating: false,
      isGameOver: false,
      isGeneratingReport: false,
      finalReport: null,

      setInitialBudget: (amount: number) => set({ budget: amount }),
      
      setContext: (context: SimulationContext) =>
        set(() => ({
          context,
          narrativeHistory: [
            `Scenario Initialized. Domain: ${context.domain}. Purpose: ${context.purpose}. Experience: ${context.experienceLevel}.`
          ]
        })),

      applyConsequence: (consequence: AIConsequenceResponse) =>
        set((state) => {
          // 1. Budget Integrity: clamp to 0 minimum
          const netChange = consequence.revenue - consequence.budgetCost;
          const rawBudget = state.budget + netChange;
          const newBudget = Math.max(0, rawBudget);
          
          const lastTransaction = {
            cost: consequence.budgetCost,
            revenue: consequence.revenue,
            net: netChange
          };

          // 2. Enforce Shift Limits: max ±20 per metric per turn
          let siShift = clampShift(consequence.metricShifts.socialImpact);
          let fsShift = clampShift(consequence.metricShifts.financialSustainability);
          let reShift = clampShift(consequence.metricShifts.riskExposure);
          let stShift = clampShift(consequence.metricShifts.stakeholderTrust);

          const clamp = (val: number) => Math.min(100, Math.max(0, val));
          
          const newMetrics = {
            socialImpact: clamp(state.metrics.socialImpact + siShift),
            financialSustainability: clamp(state.metrics.financialSustainability + fsShift),
            riskExposure: clamp(state.metrics.riskExposure + reShift),
            stakeholderTrust: clamp(state.metrics.stakeholderTrust + stShift),
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
            consequence.newNodes.forEach((n) => {
              const len = finalNodes.length;
              const lastNode = len > 0 ? finalNodes[len - 1] : { x: 4, y: 2 };
              const nextPos = calculateNextPosition(lastNode, len);
              
              const newNode = { ...n, ...nextPos };
              finalNodes.push(newNode);
            });
          }

          // Game ends at turn 8, or if budget bottoms out, or AI flags it
          const nextTurn = state.turn + 1;
          const freshAvatar = finalNodes.length > state.mapNodes.length 
            ? { x: finalNodes[finalNodes.length - 1].x, y: finalNodes[finalNodes.length - 1].y } 
            : state.avatarPos;

          return {
            budget: newBudget,
            metrics: newMetrics,
            lastTransaction,
            narrativeHistory: newHistory,
            mapNodes: finalNodes,
            avatarPos: consequence.avatarPos || freshAvatar,
            turn: nextTurn,
            decisionHistory: [...state.decisionHistory, { title: consequence.shortTitle, turn: nextTurn - 1 }],
            isGameOver: consequence.isGameEnding || nextTurn >= 8 || rawBudget <= 0,
          };
        }),

      runSimulationTurn: async (action: string) => {
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

      loadFromDatabase: async () => {
        // Implementation for loading persisted state if needed
      },

      syncToDatabase: async () => {
        // Implementation for syncing state if needed
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
        avatarPos: state.avatarPos,
        narrativeHistory: state.narrativeHistory,
        decisionHistory: state.decisionHistory,
      }),
    }
  )
);
