package com.authshield.server.dto.ml;

public class ScoreRequest {
  public String userId;
  public String deviceProfileId;
  public String tlsFingerprintId;
  public String behavioralPatternId;
  public String sessionId;
}
