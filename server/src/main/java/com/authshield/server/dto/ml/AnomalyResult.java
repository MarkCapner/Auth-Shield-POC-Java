package com.authshield.server.dto.ml;

import java.util.ArrayList;
import java.util.List;

public class AnomalyResult {
  public double overallScore;
  public List<AnomalyFactor> anomalyFactors = new ArrayList<>();
  public boolean isAnomaly;
  public String confidenceLevel; // high|medium|low
  public String recommendation;  // allow|step_up|block

  public AnomalyResult() {}
}
