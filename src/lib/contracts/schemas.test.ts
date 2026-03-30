import { describe, it, expect } from '@jest/globals';
import { MetricsSchema } from "./schemas";

describe("Contracts", () => {
  it("validates core metrics bounded between 0 and 100", () => {
    const validMetrics = {
      socialImpact: 50,
      financialSustainability: 50,
      riskExposure: 50,
      stakeholderTrust: 50,
    };
    
    expect(() => MetricsSchema.parse(validMetrics)).not.toThrow();

    const invalidMetrics = {
      ...validMetrics,
      socialImpact: 105, // should trigger zod error
    };
    
    expect(() => MetricsSchema.parse(invalidMetrics)).toThrow();
  });
});
