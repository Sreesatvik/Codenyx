import { z } from "zod";
import * as schemas from "./schemas";

export type Metrics = z.infer<typeof schemas.MetricsSchema>;
export type MapNode = z.infer<typeof schemas.MapNodeSchema>;
export type NodeStatus = MapNode["status"];
export type NodeType = MapNode["type"];
export type SimulationContext = z.infer<typeof schemas.SimulationContextSchema>;
export type SimulationState = z.infer<typeof schemas.SimulationStateSchema>;
export type AIConsequenceResponse = z.infer<typeof schemas.AIConsequenceResponseSchema>;

export interface StoreState extends SimulationState {
  // Actions
  isEvaluating: boolean;
  isGameOver: boolean;
  isGeneratingReport: boolean;
  finalReport: string | null;
  setContext: (context: SimulationContext) => void;
  applyConsequence: (consequence: AIConsequenceResponse) => void;
  runSimulationTurn: (action: string) => Promise<void>;
  loadFromDatabase: () => Promise<void>;
  syncToDatabase: () => Promise<void>;
  resetSimulation: () => void;
  endSimulation: () => Promise<void>;
}
