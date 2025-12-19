package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.RiskScore;
import com.authshield.server.repo.RiskScoreRepository;
import com.authshield.server.service.MlScoringService;
import com.authshield.server.service.ImpossibleTravelService;
import com.authshield.server.dto.geo.ImpossibleTravelRequest;
import com.authshield.server.ws.WebSocketHub;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.OffsetDateTime;

@RestController
public class RiskScoresController {

  private final RiskScoreRepository repo;
  private final ObjectMapper om;
  private final MlScoringService ml;
  private final ImpossibleTravelService travel;
  private final WebSocketHub ws;

  public RiskScoresController(RiskScoreRepository repo, ObjectMapper om, MlScoringService ml, ImpossibleTravelService travel, WebSocketHub ws) {
    this.repo = repo;
    this.om = om;
    this.ml = ml;
    this.travel = travel;
    this.ws = ws;
  }

  @GetMapping("/api/risk-scores")
  public List<RiskScore> list() { return repo.findTop200ByOrderByCreatedAtDesc(); }

  @PostMapping("/api/risk-scores")
  public IdResponse create(@RequestBody RiskScore body) {
    RiskScore saved = repo.save(body);
    return new IdResponse(saved.getId());
  }

  @PostMapping("/api/calculate-risk")
  public Map<String,Object> calculate(@RequestBody Map<String,Object> body) {
    // Node request shape: { deviceFingerprint, deviceScore, tlsScore, behavioralScore, userId, sessionId }
    // We keep backward compatibility with callers who send the 3 component scores, but if richer
    // signals are present we compute component trust scores using the same ML logic as /api/ml/score.

    String userId = asString(body.get("userId"));
    String sessionId = asString(body.get("sessionId"));
    String deviceFingerprint = asString(body.get("deviceFingerprint"));

    // Optional geolocation signal for server-side impossible travel detection
    String ipAddress = asString(body.get("ipAddress"));
    Double latitude = toDoubleObj(body.get("latitude"));
    Double longitude = toDoubleObj(body.get("longitude"));
    String city = asString(body.get("city"));
    String country = asString(body.get("country"));

    // Optional richer signals
    String deviceProfileId = asString(body.get("deviceProfileId"));
    String tlsFingerprintIdOrHash = asString(body.get("tlsFingerprintId"));
    if (tlsFingerprintIdOrHash == null || tlsFingerprintIdOrHash.isBlank()) {
      // allow alternate key (some clients send tlsHash)
      tlsFingerprintIdOrHash = asString(body.get("tlsHash"));
    }

    @SuppressWarnings("unchecked")
    Map<String,Object> currentBehavior = (body.get("currentBehavior") instanceof Map<?,?> m)
      ? (Map<String,Object>) m
      : null;

    double deviceScore = toDouble(body.get("deviceScore"));
    double tlsScore = toDouble(body.get("tlsScore"));
    double behavioralScore = toDouble(body.get("behavioralScore"));

    // If any component wasn't provided (or is 0), compute it from available signals.
    // Default is 0.5 like Node.
    if (deviceScore <= 0.0) {
      if (userId != null && !userId.isBlank() && deviceProfileId != null && !deviceProfileId.isBlank()) {
        deviceScore = ml.computeDeviceRisk(userId, deviceProfileId);
      } else {
        deviceScore = 0.5;
      }
    }
    if (tlsScore <= 0.0) {
      if (tlsFingerprintIdOrHash != null && !tlsFingerprintIdOrHash.isBlank()) {
        // Accept either DB id or JA3/JA4 hash-like string.
        tlsScore = ml.computeTlsRisk(tlsFingerprintIdOrHash);
      } else {
        tlsScore = 0.5;
      }
    }
    if (behavioralScore <= 0.0) {
      if (userId != null && !userId.isBlank() && currentBehavior != null && !currentBehavior.isEmpty()) {
        behavioralScore = ml.scoreCurrentBehavior(userId, currentBehavior).overallScore;
      } else {
        behavioralScore = 0.5;
      }
    }

    // Node uses weights device 0.4, tls 0.3, behavioral 0.3 and interprets higher score = better.
    double overall = clamp01(deviceScore * 0.4 + tlsScore * 0.3 + behavioralScore * 0.3);
    String confidenceLevel = overall >= 0.7 ? "high" : overall >= 0.4 ? "medium" : "low";

    double threshold = 0.7;
    boolean passed = overall >= threshold;

    // Match Node factors payload (including the small random demo fields).
    Map<String,Object> factors = new HashMap<>();
    factors.put("deviceFamiliarity", clamp01(deviceScore));
    factors.put("tlsConsistency", clamp01(tlsScore));
    factors.put("behavioralMatch", clamp01(behavioralScore));
    factors.put("locationRisk", 0.8 + Math.random() * 0.15);
    factors.put("timeOfDayRisk", 0.85 + Math.random() * 0.1);

    // If geo fields are provided, enrich with impossible travel and link anomaly alert id.
    boolean impossibleTravel = false;
    if (userId != null && !userId.isBlank() && ipAddress != null && latitude != null && longitude != null) {
      try {
        ImpossibleTravelRequest req = new ImpossibleTravelRequest();
        req.userId = userId;
        req.sessionId = sessionId;
        req.ipAddress = ipAddress;
        req.latitude = latitude;
        req.longitude = longitude;
        req.city = city;
        req.country = country;
        var resp = travel.detectAndRecord(req);
        if (resp != null && resp.factors != null) {
          // merge in both camelCase and snake_case keys (service provides both)
          factors.putAll(resp.factors);
          Object it = resp.factors.get("impossible_travel");
          if (it instanceof Boolean b) impossibleTravel = b;
          if (!impossibleTravel) {
            Object it2 = resp.factors.get("impossibleTravel");
            if (it2 instanceof Boolean b2) impossibleTravel = b2;
          }
        }
      } catch (Exception ignored) {}
    }

    // If impossible travel is detected, force step-up/block tendency (lower trust).
    if (impossibleTravel) {
      overall = clamp01(overall * 0.5);
      confidenceLevel = "low";
      passed = false;
      factors.put("locationRisk", 0.1); // high risk signal
    }

    RiskScore rs = new RiskScore();
    rs.setUserId(userId);
    rs.setSessionId(sessionId);
    rs.setDeviceScore(deviceScore);
    rs.setTlsScore(tlsScore);
    rs.setBehavioralScore(behavioralScore);
    rs.setOverallScore(overall);
    try { rs.setFactors(om.writeValueAsString(factors)); } catch (Exception ignored) {}
    rs.setThreshold(threshold);
    rs.setPassed(passed);
    repo.save(rs);

    // WebSocket broadcasts to match Node behavior
    try {
      ws.broadcastJson(om.writeValueAsString(Map.of(
        "type", "confidence_update",
        "score", overall,
        "userId", userId
      )));

      ws.broadcastJson(om.writeValueAsString(Map.of(
        "type", "activity",
        "activity", Map.of(
          "id", UUID.randomUUID().toString(),
          "type", "risk_calculated",
          "userId", userId,
          "deviceFingerprint", deviceFingerprint,
          "riskScore", overall,
          "confidenceLevel", confidenceLevel,
          "message", passed
            ? ("Silent authentication approved (" + Math.round(overall * 100) + "% confidence)")
            : ("Step-up required (" + Math.round(overall * 100) + "% confidence)"),
          "timestamp", OffsetDateTime.now().toString()
        )
      )));
    } catch (Exception ignored) {}

    return Map.of(
      "overallScore", overall,
      "confidenceLevel", confidenceLevel,
      "passed", passed,
      "threshold", threshold,
      "recommendation", passed ? "silent_auth" : "step_up",
      "factors", factors
    );
  }

  private static Double toDoubleObj(Object o) {
    if (o == null) return null;
    if (o instanceof Number n) return n.doubleValue();
    try {
      return Double.parseDouble(o.toString());
    } catch (Exception e) {
      return null;
    }
  }

  private static double toDouble(Object o) {
    if (o == null) return 0;
    if (o instanceof Number n) return n.doubleValue();
    try { return Double.parseDouble(o.toString()); } catch (Exception e) { return 0; }
  }

  private static String asString(Object o) {
    return o == null ? null : o.toString();
  }
  private static double clamp01(double v) { return Math.max(0.0, Math.min(1.0, v)); }
}
