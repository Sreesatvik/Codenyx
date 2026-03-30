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
  setContext: (context: SimulationContext) => void;
  applyConsequence: (consequence: AIConsequenceResponse) => void;
  resetSimulation: () => void;
}
