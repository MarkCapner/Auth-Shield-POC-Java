package com.authshield.server.service;

import com.authshield.server.dto.ml.*;
import com.authshield.server.model.BehavioralPattern;
import com.authshield.server.model.DeviceProfile;
import com.authshield.server.model.TlsFingerprint;
import com.authshield.server.repo.BehavioralPatternRepository;
import com.authshield.server.repo.DeviceProfileRepository;
import com.authshield.server.repo.TlsFingerprintRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MlScoringService {

  private final BehavioralPatternRepository behaviors;
  private final DeviceProfileRepository devices;
  private final TlsFingerprintRepository tls;

  public MlScoringService(BehavioralPatternRepository behaviors,
                          DeviceProfileRepository devices,
                          TlsFingerprintRepository tls) {
    this.behaviors = behaviors;
    this.devices = devices;
    this.tls = tls;
  }

  public BaselineProfile getUserBaseline(String userId) {
    List<BehavioralPattern> patterns = behaviors.findByUserIdOrderByCreatedAtDesc(userId);
    if (patterns.size() < 3) return null;

    List<Double> avgMouseSpeeds = collect(patterns, BehavioralPattern::getAvgMouseSpeed);
    List<Double> avgMouseAccelerations = collect(patterns, BehavioralPattern::getAvgMouseAcceleration);
    List<Double> avgKeyHoldTimes = collect(patterns, BehavioralPattern::getAvgKeyHoldTime);
    List<Double> avgFlightTimes = collect(patterns, BehavioralPattern::getAvgFlightTime);
    List<Double> typingSpeeds = collect(patterns, BehavioralPattern::getTypingSpeed);
    List<Double> straightLineRatios = collect(patterns, BehavioralPattern::getStraightLineRatio);
    List<Double> curveComplexities = collect(patterns, BehavioralPattern::getCurveComplexity);

    BaselineProfile p = new BaselineProfile();
    p.avgMouseSpeed = metric(avgMouseSpeeds);
    p.avgMouseAcceleration = metric(avgMouseAccelerations);
    p.avgKeyHoldTime = metric(avgKeyHoldTimes);
    p.avgFlightTime = metric(avgFlightTimes);
    p.typingSpeed = metric(typingSpeeds);
    p.straightLineRatio = metric(straightLineRatios);
    p.curveComplexity = metric(curveComplexities);
    return p;
  }

  public AnomalyResult scoreCurrentBehavior(String userId, Map<String,Object> currentBehavior) {
    BaselineProfile baseline = getUserBaseline(userId);

    // Mirror Node behavior: if insufficient baseline, return low-confidence "step_up" response.
    if (baseline == null) {
      AnomalyResult r = new AnomalyResult();
      r.overallScore = 0.85;
      r.isAnomaly = false;
      r.confidenceLevel = "low";
      r.recommendation = "step_up";
      return r;
    }

    Map<String, Double> weights = Map.of(
      "avgMouseSpeed", 0.20,
      "avgMouseAcceleration", 0.15,
      "avgKeyHoldTime", 0.20,
      "avgFlightTime", 0.15,
      "typingSpeed", 0.20,
      "straightLineRatio", 0.05,
      "curveComplexity", 0.05
    );

    AnomalyResult out = new AnomalyResult();

    double totalAnomalyScore = 0.0;
    double totalWeight = 0.0;

    // Map the incoming request keys to baseline features (same as ml-scoring.ts)
    totalAnomalyScore += checkFactor(out, "avgMouseSpeed", toDouble(currentBehavior.get("mouseVelocity")), baseline.avgMouseSpeed, weights.get("avgMouseSpeed"));
    totalWeight += (currentBehavior.get("mouseVelocity") != null ? weights.get("avgMouseSpeed") : 0.0);

    totalAnomalyScore += checkFactor(out, "avgMouseAcceleration", toDouble(currentBehavior.get("mouseAcceleration")), baseline.avgMouseAcceleration, weights.get("avgMouseAcceleration"));
    totalWeight += (currentBehavior.get("mouseAcceleration") != null ? weights.get("avgMouseAcceleration") : 0.0);

    totalAnomalyScore += checkFactor(out, "avgKeyHoldTime", toDouble(currentBehavior.get("dwellTime")), baseline.avgKeyHoldTime, weights.get("avgKeyHoldTime"));
    totalWeight += (currentBehavior.get("dwellTime") != null ? weights.get("avgKeyHoldTime") : 0.0);

    totalAnomalyScore += checkFactor(out, "avgFlightTime", toDouble(currentBehavior.get("flightTime")), baseline.avgFlightTime, weights.get("avgFlightTime"));
    totalWeight += (currentBehavior.get("flightTime") != null ? weights.get("avgFlightTime") : 0.0);

    totalAnomalyScore += checkFactor(out, "typingSpeed", toDouble(currentBehavior.get("typingSpeed")), baseline.typingSpeed, weights.get("typingSpeed"));
    totalWeight += (currentBehavior.get("typingSpeed") != null ? weights.get("typingSpeed") : 0.0);

    // straightLineRatio/curveComplexity are part of baseline, but currentBehavior payload doesn't provide them
    // in the current client implementation. We keep parity with Node: only check if present.
    if (currentBehavior.get("straightLineRatio") != null) {
      totalAnomalyScore += checkFactor(out, "straightLineRatio", toDouble(currentBehavior.get("straightLineRatio")), baseline.straightLineRatio, weights.get("straightLineRatio"));
      totalWeight += weights.get("straightLineRatio");
    }
    if (currentBehavior.get("curveComplexity") != null) {
      totalAnomalyScore += checkFactor(out, "curveComplexity", toDouble(currentBehavior.get("curveComplexity")), baseline.curveComplexity, weights.get("curveComplexity"));
      totalWeight += weights.get("curveComplexity");
    }

    double normalizedAnomalyScore = totalWeight > 0 ? totalAnomalyScore / totalWeight : 0.0;
    double trustScore = 1.0 - normalizedAnomalyScore;

    long anomalyCount = out.anomalyFactors.stream().filter(f -> f.isAnomaly).count();
    boolean isAnomaly = normalizedAnomalyScore > 0.5 || anomalyCount >= 3;

    String confidence;
    if (out.anomalyFactors.size() >= 6) confidence = "high";
    else if (out.anomalyFactors.size() >= 3) confidence = "medium";
    else confidence = "low";

    String recommendation;
    if (trustScore >= 0.8) recommendation = "allow";
    else if (trustScore >= 0.5) recommendation = "step_up";
    else recommendation = "block";

    out.overallScore = clamp01(trustScore);
    out.isAnomaly = isAnomaly;
    out.confidenceLevel = confidence;
    out.recommendation = recommendation;
    return out;
  }

  public double computeDeviceRisk(String userId, String currentDeviceId) {
    List<DeviceProfile> userDevices = devices.findByUserIdOrderByLastSeenDesc(userId);
    Optional<DeviceProfile> currentDevice = userDevices.stream().filter(d -> Objects.equals(d.getId(), currentDeviceId)).findFirst();
    if (currentDevice.isEmpty()) return 0.3;

    DeviceProfile d = currentDevice.get();
    int seenCount = d.getSeenCount() != null ? d.getSeenCount() : 1;
    double familiarityScore = Math.min(1.0, seenCount / 10.0);
    double trustScore = d.getTrustScore() != null ? d.getTrustScore() : 0.5;
    double combined = familiarityScore * 0.6 + trustScore * 0.4;
    return clamp01(combined);
  }

  public double computeTlsRisk(String currentFingerprint) {
    List<TlsFingerprint> all = tls.findTop500ByOrderByCreatedAtDesc();
    for (TlsFingerprint f : all) {
      if (Objects.equals(f.getJa3Hash(), currentFingerprint) || Objects.equals(f.getJa4Hash(), currentFingerprint)) {
        return f.getTrustScore() != null ? clamp01(f.getTrustScore()) : 0.5;
      }
    }
    return 0.5;
  }

  /**
   * Overall ML scoring used by POST /api/ml/score.
   *
   * Returns *trust* scores (0..1) for each component and a weighted overall score.
   * The UI treats higher values as "better" (lower risk).
   */
  public ScoreResponse scoreOverall(MlScoreRequest req) {
    if (req == null) req = new MlScoreRequest();

    String userId = req.userId;
    double wDevice = 0.35;
    double wTls = 0.25;
    double wBeh = 0.40;

    double deviceTrust = 0.5;
    if (userId != null && !userId.isBlank() && req.deviceProfileId != null && !req.deviceProfileId.isBlank()) {
      deviceTrust = computeDeviceRisk(userId, req.deviceProfileId);
    }

    double tlsTrust = 0.5;
    if (req.tlsFingerprintId != null && !req.tlsFingerprintId.isBlank()) {
      // Accept either DB id or JA3/JA4 hash-like string.
      Optional<TlsFingerprint> byId = tls.findById(req.tlsFingerprintId);
      if (byId.isPresent()) {
        tlsTrust = byId.get().getTrustScore() != null ? clamp01(byId.get().getTrustScore()) : 0.5;
      } else {
        tlsTrust = computeTlsRisk(req.tlsFingerprintId);
      }
    }

    // Behavioral trust is primarily ML-derived (baseline + z-score anomalies)
    Map<String,Object> currentBehavior = req.currentBehavior;
    if ((currentBehavior == null || currentBehavior.isEmpty()) && req.behavioralPatternId != null && !req.behavioralPatternId.isBlank()) {
      behaviors.findById(req.behavioralPatternId).ifPresent(bp -> {
        // Build the same input keys the client uses (mouseVelocity/dwellTime/etc.)
        Map<String,Object> m = new HashMap<>();
        if (bp.getAvgMouseSpeed() != null) m.put("mouseVelocity", bp.getAvgMouseSpeed());
        if (bp.getAvgMouseAcceleration() != null) m.put("mouseAcceleration", bp.getAvgMouseAcceleration());
        if (bp.getAvgKeyHoldTime() != null) m.put("dwellTime", bp.getAvgKeyHoldTime());
        if (bp.getAvgFlightTime() != null) m.put("flightTime", bp.getAvgFlightTime());
        if (bp.getTypingSpeed() != null) m.put("typingSpeed", bp.getTypingSpeed());
        if (bp.getStraightLineRatio() != null) m.put("straightLineRatio", bp.getStraightLineRatio());
        if (bp.getCurveComplexity() != null) m.put("curveComplexity", bp.getCurveComplexity());
        req.currentBehavior = m;
      });
      currentBehavior = req.currentBehavior;
    }

    AnomalyResult behavioral = null;
    double behavioralTrust = 0.75;
    if (userId != null && !userId.isBlank()) {
      behavioral = scoreCurrentBehavior(userId, currentBehavior == null ? Map.of() : currentBehavior);
      behavioralTrust = behavioral.overallScore;
    }

    double overall = clamp01(deviceTrust * wDevice + tlsTrust * wTls + behavioralTrust * wBeh);

    String recommendation;
    if (overall >= 0.80) recommendation = "allow";
    else if (overall >= 0.50) recommendation = "step_up";
    else recommendation = "block";

    String confidence = behavioral != null ? behavioral.confidenceLevel : "low";
    if (confidence == null) confidence = "low";

    ScoreResponse out = new ScoreResponse();
    out.overallScore = overall;
    out.confidenceLevel = confidence;
    out.recommendation = recommendation;

    out.components.put("device", clamp01(deviceTrust));
    out.components.put("tls", clamp01(tlsTrust));
    out.components.put("behavioral", clamp01(behavioralTrust));
    out.weights.put("device", wDevice);
    out.weights.put("tls", wTls);
    out.weights.put("behavioral", wBeh);

    // Backwards-compatible fields
    out.deviceScore = clamp01(deviceTrust);
    out.tlsScore = clamp01(tlsTrust);
    out.behavioralScore = clamp01(behavioralTrust);

    Map<String,Object> factors = new HashMap<>();
    factors.put("deviceTrust", deviceTrust);
    factors.put("tlsTrust", tlsTrust);
    factors.put("behavioralTrust", behavioralTrust);
    if (behavioral != null) {
      factors.put("behavioralAnomaly", behavioral.isAnomaly);
      factors.put("behavioralRecommendation", behavioral.recommendation);
      factors.put("anomalyFactors", behavioral.anomalyFactors);
    }
    out.riskFactors = factors;
    return out;
  }

  // ---------- helpers (ported from ml-scoring.ts) ----------

  private static List<Double> collect(List<BehavioralPattern> patterns, Function<BehavioralPattern, Double> getter) {
    return patterns.stream().map(getter).filter(Objects::nonNull).collect(Collectors.toList());
  }

  private static BaselineMetric metric(List<Double> values) {
    double mean = calculateMean(values);
    double std = calculateStdDev(values, mean);
    return new BaselineMetric(mean, std);
  }

  private static double calculateMean(List<Double> values) {
    if (values == null || values.isEmpty()) return 0.0;
    double sum = 0.0;
    for (double v : values) sum += v;
    return sum / values.size();
  }

  private static double calculateStdDev(List<Double> values, double mean) {
    if (values == null || values.size() < 2) return 0.0;
    double sumSq = 0.0;
    for (double v : values) {
      double d = v - mean;
      sumSq += d * d;
    }
    double variance = sumSq / (values.size() - 1.0); // sample variance
    return Math.sqrt(variance);
  }

  private static double calculateZScore(double value, double mean, double stdDev) {
    if (stdDev == 0.0) return 0.0;
    return Math.abs(value - mean) / stdDev;
  }

  private static double zScoreToAnomalyProbability(double zScore) {
    if (zScore <= 1) return 0;
    if (zScore <= 2) return (zScore - 1) * 0.3;
    if (zScore <= 3) return 0.3 + (zScore - 2) * 0.4;
    return Math.min(1, 0.7 + (zScore - 3) * 0.15);
  }

  private static double checkFactor(AnomalyResult out, String name, Double value, BaselineMetric stats, double weight) {
    if (value == null || stats == null || stats.mean == 0) return 0.0;

    double z = calculateZScore(value, stats.mean, stats.stdDev);
    double prob = zScoreToAnomalyProbability(z);

    out.anomalyFactors.add(new AnomalyFactor(name, value, stats.mean, z, z > 2));
    return prob * weight;
  }

  private static Double toDouble(Object o) {
    if (o == null) return null;
    if (o instanceof Number n) return n.doubleValue();
    try { return Double.parseDouble(String.valueOf(o)); } catch (Exception e) { return null; }
  }

  private static double clamp01(double v) {
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }
}
