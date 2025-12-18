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

  /** Behavioral features captured by the client (mouseVelocity, dwellTime, etc.) */
  public Map<String, Object> currentBehavior;
}
