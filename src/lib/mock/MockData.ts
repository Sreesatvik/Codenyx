import { SimulationState, AIConsequenceResponse } from "../contracts/types";

export const InitialSimulationState: SimulationState = {
  budget: 2000,
  metrics: {
    socialImpact: 50,
    financialSustainability: 50,
    riskExposure: 50,
    stakeholderTrust: 50,
  },
  turn: 1,
  context: null,
  mapNodes: [
    {
      id: "node-hq",
      x: 4,
      y: 2,
      type: "HQ",
      status: "ACTIVE",
    }
  ],
  avatarPos: { x: 4, y: 2 },
  lastTransaction: { cost: 0, revenue: 0, net: 0 },
  narrativeHistory: [
    "Welcome to VentureSimulate. Establish your domain and purpose to begin the scenario."
  ]
};

export const MockAIConsequence: AIConsequenceResponse = {
  narrative: "You launched a community survey. Stakeholders appreciate the transparency, but it cost you some initial capital.",
  budgetCost: 200,
  revenue: 50,
  metricShifts: {
    socialImpact: 10,
    financialSustainability: -5,
    riskExposure: -2,
    stakeholderTrust: 15,
  },
  newNodes: [
    {
      id: "node-survey-camp",
      x: 1,
      y: 1,
      type: "COMMUNITY_CENTER",
      status: "ACTIVE",
    }
  ],
  isGameEnding: false,
};
