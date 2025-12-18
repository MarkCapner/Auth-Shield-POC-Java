package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="behavioral_patterns")
public class BehavioralPattern {
  @Id
  @Column(length = 64)
  private String id;

  @Column(name="user_id")
  private String userId;

  @Column(name="device_profile_id")
  private String deviceProfileId;

  @Column(name="session_id")
  private String sessionId;

  @Column(name="avg_mouse_speed")
  private Double avgMouseSpeed;

  @Column(name="mouse_speed_variance")
  private Double mouseSpeedVariance;

  @Column(name="avg_mouse_acceleration")
  private Double avgMouseAcceleration;

  @Column(name="straight_line_ratio")
  private Double straightLineRatio;

  @Column(name="curve_complexity")
  private Double curveComplexity;

  @Column(name="avg_key_hold_time")
  private Double avgKeyHoldTime;

  @Column(name="key_hold_variance")
  private Double keyHoldVariance;

  @Column(name="avg_flight_time")
  private Double avgFlightTime;

  @Column(name="flight_time_variance")
  private Double flightTimeVariance;

  @Column(name="typing_speed")
  private Double typingSpeed;

  @Column(name="error_rate")
  private Double errorRate;

  @Column(name="sample_count")
  private Integer sampleCount;

  @Column(name="raw_data", columnDefinition = "jsonb")
  private String rawData;

  @Column(name="confidence_score")
  private Double confidenceScore;

  @Column(name="created_at", nullable=false)
  private OffsetDateTime createdAt;

  @PrePersist
  void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (sampleCount == null) sampleCount = 0;
    if (confidenceScore == null) confidenceScore = 0.0;
    if (createdAt == null) createdAt = OffsetDateTime.now();
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getDeviceProfileId() { return deviceProfileId; }
  public void setDeviceProfileId(String deviceProfileId) { this.deviceProfileId = deviceProfileId; }
  public String getSessionId() { return sessionId; }
  public void setSessionId(String sessionId) { this.sessionId = sessionId; }
  public Double getAvgMouseSpeed() { return avgMouseSpeed; }
  public void setAvgMouseSpeed(Double avgMouseSpeed) { this.avgMouseSpeed = avgMouseSpeed; }
  public Double getMouseSpeedVariance() { return mouseSpeedVariance; }
  public void setMouseSpeedVariance(Double mouseSpeedVariance) { this.mouseSpeedVariance = mouseSpeedVariance; }
  public Double getAvgMouseAcceleration() { return avgMouseAcceleration; }
  public void setAvgMouseAcceleration(Double avgMouseAcceleration) { this.avgMouseAcceleration = avgMouseAcceleration; }
  public Double getStraightLineRatio() { return straightLineRatio; }
  public void setStraightLineRatio(Double straightLineRatio) { this.straightLineRatio = straightLineRatio; }
  public Double getCurveComplexity() { return curveComplexity; }
  public void setCurveComplexity(Double curveComplexity) { this.curveComplexity = curveComplexity; }
  public Double getAvgKeyHoldTime() { return avgKeyHoldTime; }
  public void setAvgKeyHoldTime(Double avgKeyHoldTime) { this.avgKeyHoldTime = avgKeyHoldTime; }
  public Double getKeyHoldVariance() { return keyHoldVariance; }
  public void setKeyHoldVariance(Double keyHoldVariance) { this.keyHoldVariance = keyHoldVariance; }
  public Double getAvgFlightTime() { return avgFlightTime; }
  public void setAvgFlightTime(Double avgFlightTime) { this.avgFlightTime = avgFlightTime; }
  public Double getFlightTimeVariance() { return flightTimeVariance; }
  public void setFlightTimeVariance(Double flightTimeVariance) { this.flightTimeVariance = flightTimeVariance; }
  public Double getTypingSpeed() { return typingSpeed; }
  public void setTypingSpeed(Double typingSpeed) { this.typingSpeed = typingSpeed; }
  public Double getErrorRate() { return errorRate; }
  public void setErrorRate(Double errorRate) { this.errorRate = errorRate; }
  public Integer getSampleCount() { return sampleCount; }
  public void setSampleCount(Integer sampleCount) { this.sampleCount = sampleCount; }
  public String getRawData() { return rawData; }
  public void setRawData(String rawData) { this.rawData = rawData; }
  public Double getConfidenceScore() { return confidenceScore; }
  public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }
  public OffsetDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
