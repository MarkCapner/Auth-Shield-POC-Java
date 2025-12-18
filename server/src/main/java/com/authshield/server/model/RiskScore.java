package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="risk_scores")
public class RiskScore {
  @Id @Column(length=64)
  private String id;

  @Column(name="user_id")
  private String userId;

  @Column(name="session_id")
  private String sessionId;

  @Column(name="device_score", nullable=false)
  private Double deviceScore;

  @Column(name="tls_score", nullable=false)
  private Double tlsScore;

  @Column(name="behavioral_score", nullable=false)
  private Double behavioralScore;

  @Column(name="overall_score", nullable=false)
  private Double overallScore;

  @Column(name="factors", columnDefinition="jsonb")
  private String factors;

  private Double threshold;
  private Boolean passed;

  @Column(name="created_at", nullable=false)
  private OffsetDateTime createdAt;

  @PrePersist void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (threshold == null) threshold = 0.7;
    if (passed == null) passed = false;
    if (createdAt == null) createdAt = OffsetDateTime.now();
  }

  public String getId(){return id;}
  public void setId(String id){this.id=id;}
  public String getUserId(){return userId;}
  public void setUserId(String userId){this.userId=userId;}
  public String getSessionId(){return sessionId;}
  public void setSessionId(String sessionId){this.sessionId=sessionId;}
  public Double getDeviceScore(){return deviceScore;}
  public void setDeviceScore(Double deviceScore){this.deviceScore=deviceScore;}
  public Double getTlsScore(){return tlsScore;}
  public void setTlsScore(Double tlsScore){this.tlsScore=tlsScore;}
  public Double getBehavioralScore(){return behavioralScore;}
  public void setBehavioralScore(Double behavioralScore){this.behavioralScore=behavioralScore;}
  public Double getOverallScore(){return overallScore;}
  public void setOverallScore(Double overallScore){this.overallScore=overallScore;}
  public String getFactors(){return factors;}
  public void setFactors(String factors){this.factors=factors;}
  public Double getThreshold(){return threshold;}
  public void setThreshold(Double threshold){this.threshold=threshold;}
  public Boolean getPassed(){return passed;}
  public void setPassed(Boolean passed){this.passed=passed;}
  public OffsetDateTime getCreatedAt(){return createdAt;}
  public void setCreatedAt(OffsetDateTime createdAt){this.createdAt=createdAt;}
}
