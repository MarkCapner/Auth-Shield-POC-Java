package com.authshield.server.controller;

import com.authshield.server.dto.ml.*;
import com.authshield.server.model.AnomalyAlert;
import com.authshield.server.repo.AnomalyAlertRepository;
import com.authshield.server.service.MlScoringService;
import com.authshield.server.service.ImpossibleTravelService;
import com.authshield.server.dto.geo.ImpossibleTravelRequest;
import com.authshield.server.dto.geo.ImpossibleTravelResponse;
import com.authshield.server.ws.WebSocketHub;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ml")
public class MlController {
  private final MlScoringService ml;
  private final ImpossibleTravelService impossibleTravel;
  private final AnomalyAlertRepository anomalyAlerts;
  private final WebSocketHub ws;
  private final ObjectMapper mapper;

  public MlController(MlScoringService ml,
                      AnomalyAlertRepository anomalyAlerts,
                      ImpossibleTravelService impossibleTravel,
                      WebSocketHub ws,
                      ObjectMapper mapper) {
    this.ml = ml;
    this.anomalyAlerts = anomalyAlerts;
    this.impossibleTravel = impossibleTravel;
    this.ws = ws;
    this.mapper = mapper;
  }

  @PostMapping("/score")
  public ScoreResponse score(@RequestBody MlScoreRequest req) {
    ScoreResponse out = ml.scoreOverall(req);

    // Optional impossible-travel enrichment (server-side) when geo context is present
    try {
      if (req != null && req.userId != null &&
          req.latitude != null && req.longitude != null &&
          req.ipAddress != null && !req.ipAddress.isBlank()) {

        ImpossibleTravelRequest it = new ImpossibleTravelRequest();
        it.userId = req.userId;
        it.sessionId = req.sessionId;
        it.ipAddress = req.ipAddress;
        it.latitude = req.latitude;
        it.longitude = req.longitude;
        it.city = req.city;
        it.country = req.country;

        ImpossibleTravelResponse itRes = impossibleTravel.detectAndRecord(it);

        if (out.riskFactors == null) out.riskFactors = new HashMap<>();
        if (itRes != null && itRes.factors != null) {
          out.riskFactors.putAll(itRes.factors);
        } else if (itRes != null) {
          // ensure the key exists even if factors map is absent
          out.riskFactors.put("impossible_travel", itRes.impossibleTravel);
          out.riskFactors.put("impossibleTravel", itRes.impossibleTravel);
        }

        if (itRes != null && itRes.impossibleTravel) {
          // Make the decision stricter (mirrors Node: impossible travel is a high-risk signal)
          double requiredSpeed = 0.0;
          Object rs = out.riskFactors.get("requiredSpeedKmh");
          if (rs instanceof Number n) requiredSpeed = n.doubleValue();

          out.confidenceLevel = "low";
          if (requiredSpeed > 5000.0) {
            out.recommendation = "block";
            out.overallScore = Math.min(out.overallScore, 0.30);
          } else {
            out.recommendation = "step_up";
            out.overallScore = Math.min(out.overallScore, 0.49);
          }
        }
      }
    } catch (Exception ignored) {}

    // Broadcast live activity event (mirrors the Node realtime feed behavior)
    try {
      Map<String,Object> activity = new HashMap<>();
      activity.put("id", UUID.randomUUID().toString());
      activity.put("type", "risk_calculated");
      activity.put("userId", req != null ? req.userId : null);
      activity.put("riskScore", out.overallScore);
      activity.put("confidenceLevel", out.confidenceLevel);
      activity.put("message", "Risk score calculated" + (req != null && req.userId != null ? " for user " + req.userId : ""));
      activity.put("timestamp", OffsetDateTime.now().toString());

      Map<String,Object> envelope = new HashMap<>();
      envelope.put("type", "activity");
      envelope.put("activity", activity);

      ws.broadcastJson(mapper.writeValueAsString(envelope));
    } catch (Exception ignored) {}

    return out;
  }

  @GetMapping("/baseline/{userId}")
  public BaselineResponse baseline(@PathVariable("userId") String userId) {
    BaselineProfile baseline = ml.getUserBaseline(userId);
    if (baseline == null) {
      return BaselineResponse.insufficient();
    }
    return BaselineResponse.ok(baseline);
  }

  @PostMapping("/anomaly-check")
  public AnomalyResult anomalyCheck(@RequestBody Map<String,Object> req) {
    String userId = req.get("userId") != null ? String.valueOf(req.get("userId")) : null;
    if (userId == null || userId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
    }
    Map<String,Object> currentBehavior = req.get("currentBehavior") instanceof Map<?,?> m ? (Map<String,Object>) m : new HashMap<>();

    AnomalyResult result = ml.scoreCurrentBehavior(userId, currentBehavior);

    // Mirror Node behavior: create anomaly alert + broadcast activity when anomaly detected
    if (result.isAnomaly) {
      AnomalyAlert alert = new AnomalyAlert();
      alert.setId(UUID.randomUUID().toString());
      alert.setUserId(userId);
      alert.setAlertType("behavioral");
      alert.setSeverity(result.overallScore < 0.3 ? "critical" : "high");
      String factors = result.anomalyFactors.stream().filter(f -> f.isAnomaly).map(f -> f.factor).reduce((a,b) -> a + ", " + b).orElse("unknown");
      alert.setDescription("Behavioral anomaly detected: " + factors);
      // Entity has no explicit risk_score column; keep the score in metadata for parity.
      try {
        alert.setMetadata(mapper.writeValueAsString(Map.of(
          "riskScore", 1.0 - result.overallScore,
          "confidenceLevel", result.confidenceLevel
        )));
      } catch (Exception ignored) {}
      alert.setCreatedAt(OffsetDateTime.now());
      anomalyAlerts.save(alert);

      try {
        Map<String,Object> activity = new HashMap<>();
        activity.put("id", UUID.randomUUID().toString());
        activity.put("type", "risk_calculated");
        activity.put("userId", userId);
        activity.put("riskScore", 1.0 - result.overallScore);
        activity.put("confidenceLevel", result.confidenceLevel);
        activity.put("message", "Behavioral anomaly detected for user " + userId);
        activity.put("timestamp", OffsetDateTime.now().toString());

        Map<String,Object> envelope = new HashMap<>();
        envelope.put("type", "activity");
        envelope.put("activity", activity);

        ws.broadcastJson(mapper.writeValueAsString(envelope));
      } catch (Exception ignored) {}
    }

    return result;
  }
}
