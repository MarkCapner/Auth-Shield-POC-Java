package com.authshield.server.controller;

import com.authshield.server.dto.ml.*;
import com.authshield.server.model.AnomalyAlert;
import com.authshield.server.repo.AnomalyAlertRepository;
import com.authshield.server.service.MlScoringService;
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
  private final AnomalyAlertRepository anomalyAlerts;
  private final WebSocketHub ws;
  private final ObjectMapper mapper;

  public MlController(MlScoringService ml,
                      AnomalyAlertRepository anomalyAlerts,
                      WebSocketHub ws,
                      ObjectMapper mapper) {
    this.ml = ml;
    this.anomalyAlerts = anomalyAlerts;
    this.ws = ws;
    this.mapper = mapper;
  }

  @PostMapping("/score")
  public ScoreResponse score(@RequestBody MlScoreRequest req) {
    ScoreResponse out = ml.scoreOverall(req);

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
      alert.setRiskScore(1.0 - result.overallScore);
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
