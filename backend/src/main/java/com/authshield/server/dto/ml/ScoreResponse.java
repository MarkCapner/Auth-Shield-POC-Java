package com.authshield.server.dto.ml;

import java.util.HashMap;
import java.util.Map;

public class ScoreResponse {
  public double overallScore;
  public String confidenceLevel;
  public String recommendation;

  /** Component trust scores (0..1): device, tls, behavioral */
  public Map<String, Double> components = new HashMap<>();

  /** Weights used to combine components: device, tls, behavioral */
  public Map<String, Double> weights = new HashMap<>();

  // Backwards-compatible fields used by earlier UI code paths
  public double deviceScore;
  public double tlsScore;
  public double behavioralScore;
  public Map<String,Object> riskFactors;
}
