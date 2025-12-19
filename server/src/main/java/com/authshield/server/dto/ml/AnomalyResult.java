package com.authshield.server.dto.ml;

import java.util.ArrayList;
import java.util.List;

public class AnomalyResult {
  public double overallScore;
  /**
   * 0..1 where higher means more anomalous. Kept for parity with the original Node backend.
   */
  public double anomalyProbability;
  /**
   * Convenience summary of the strongest (absolute) deviation observed across factors.
   * In this PoC we treat {@code AnomalyFactor.deviation} as a z-score-like value.
   */
  public double zScore;
  /**
   * Human friendly severity label (low|medium|high|critical).
   */
  public String severity;
  public List<AnomalyFactor> anomalyFactors = new ArrayList<>();
  public boolean isAnomaly;
  public String confidenceLevel; // high|medium|low
  public String recommendation;  // allow|step_up|block

  public AnomalyResult() {}
}
