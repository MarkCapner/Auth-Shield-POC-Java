package com.authshield.server.service;

import com.authshield.server.dto.ml.ScoreResponse;
import com.authshield.server.model.*;
import com.authshield.server.repo.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RiskService {

  private final DeviceProfileRepository devices;
  private final TlsFingerprintRepository tls;
  private final BehavioralPatternRepository behaviors;
  private final ObjectMapper om;

  public RiskService(DeviceProfileRepository devices,
                     TlsFingerprintRepository tls,
                     BehavioralPatternRepository behaviors,
                     ObjectMapper om) {
    this.devices = devices;
    this.tls = tls;
    this.behaviors = behaviors;
    this.om = om;
  }

  // Ported “shape” from server.js; scoring is intentionally simple for now.
  public ScoreResponse score(String deviceProfileId, String tlsFingerprintId, String behavioralPatternId) {
    double deviceScore = devices.findById(deviceProfileId).map(d -> safe(d.getTrustScore())).orElse(0.5);
    double tlsScore = tls.findById(tlsFingerprintId).map(t -> safe(t.getTrustScore())).orElse(0.5);
    double behavioralScore = behaviors.findById(behavioralPatternId).map(b -> safe(b.getConfidenceScore())).orElse(0.0);

    // Convert trust/confidence to “risk” (higher => more risky)
    double deviceRisk = 1.0 - clamp01(deviceScore);
    double tlsRisk = 1.0 - clamp01(tlsScore);
    double behaviorRisk = 1.0 - clamp01(behavioralScore);

    double overall = clamp01(deviceRisk * 0.35 + tlsRisk * 0.35 + behaviorRisk * 0.30);

    String confidence;
    if (overall < 0.4) confidence = "high";
    else if (overall < 0.7) confidence = "medium";
    else confidence = "low";

    Map<String,Object> factors = new HashMap<>();
    factors.put("deviceRisk", deviceRisk);
    factors.put("tlsRisk", tlsRisk);
    factors.put("behaviorRisk", behaviorRisk);

    ScoreResponse r = new ScoreResponse();
    r.overallScore = overall;
    r.confidenceLevel = confidence;
    r.deviceScore = deviceRisk;
    r.tlsScore = tlsRisk;
    r.behavioralScore = behaviorRisk;
    r.riskFactors = factors;
    return r;
  }

  private static double safe(Double v) { return v == null ? 0.0 : v; }
  private static double clamp01(double v) { return Math.max(0.0, Math.min(1.0, v)); }
}
