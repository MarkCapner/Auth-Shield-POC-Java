package com.authshield.server.dto.ml;

import java.util.Map;

/**
 * Flexible request payload for /api/ml/score.
 *
 * Newer client posts: { userId, currentBehavior: {...} }
 * Older flows may post ids: { userId, deviceProfileId, tlsFingerprintId, behavioralPatternId, sessionId }
 */
public class MlScoreRequest {
  public String userId;
  public String deviceProfileId;
  public String tlsFingerprintId;
  public String behavioralPatternId;
  public String sessionId;

  // Optional geo context for impossible-travel detection (mirrors Node payload)
  public String ipAddress;
  public Double latitude;
  public Double longitude;
  public String city;
  public String country;

  /** Behavioral features captured by the client (mouseVelocity, dwellTime, etc.) */
  public Map<String, Object> currentBehavior;
}
