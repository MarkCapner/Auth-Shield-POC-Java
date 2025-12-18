package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="authentication_events")
public class AuthenticationEvent {
  @Id @Column(length=64)
  private String id;

  @Column(name="user_id")
  private String userId;

  @Column(name="device_profile_id")
  private String deviceProfileId;

  @Column(name="tls_fingerprint_id")
  private String tlsFingerprintId;

  @Column(name="session_id")
  private String sessionId;

  @Column(name="event_type", nullable=false)
  private String eventType;

  @Column(name="ip_address")
  private String ipAddress;

  @Column(name="device_score")
  private Double deviceScore;

  @Column(name="tls_score")
  private Double tlsScore;

  @Column(name="behavioral_score")
  private Double behavioralScore;

  @Column(name="overall_risk_score")
  private Double overallRiskScore;

  @Column(name="confidence_level")
  private String confidenceLevel;

  @Column(name="step_up_required")
  private Boolean stepUpRequired;

  private Boolean success;

  @Column(columnDefinition="jsonb")
  private String metadata;

  @Column(name="created_at", nullable=false)
  private OffsetDateTime createdAt;

  @PrePersist void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (stepUpRequired == null) stepUpRequired = false;
    if (success == null) success = false;
    if (createdAt == null) createdAt = OffsetDateTime.now();
  }

  public String getId(){return id;}
  public void setId(String id){this.id=id;}
  public String getUserId(){return userId;}
  public void setUserId(String userId){this.userId=userId;}
  public String getDeviceProfileId(){return deviceProfileId;}
  public void setDeviceProfileId(String deviceProfileId){this.deviceProfileId=deviceProfileId;}
  public String getTlsFingerprintId(){return tlsFingerprintId;}
  public void setTlsFingerprintId(String tlsFingerprintId){this.tlsFingerprintId=tlsFingerprintId;}
  public String getSessionId(){return sessionId;}
  public void setSessionId(String sessionId){this.sessionId=sessionId;}
  public String getEventType(){return eventType;}
  public void setEventType(String eventType){this.eventType=eventType;}
  public String getIpAddress(){return ipAddress;}
  public void setIpAddress(String ipAddress){this.ipAddress=ipAddress;}
  public Double getDeviceScore(){return deviceScore;}
  public void setDeviceScore(Double deviceScore){this.deviceScore=deviceScore;}
  public Double getTlsScore(){return tlsScore;}
  public void setTlsScore(Double tlsScore){this.tlsScore=tlsScore;}
  public Double getBehavioralScore(){return behavioralScore;}
  public void setBehavioralScore(Double behavioralScore){this.behavioralScore=behavioralScore;}
  public Double getOverallRiskScore(){return overallRiskScore;}
  public void setOverallRiskScore(Double overallRiskScore){this.overallRiskScore=overallRiskScore;}
  public String getConfidenceLevel(){return confidenceLevel;}
  public void setConfidenceLevel(String confidenceLevel){this.confidenceLevel=confidenceLevel;}
  public Boolean getStepUpRequired(){return stepUpRequired;}
  public void setStepUpRequired(Boolean stepUpRequired){this.stepUpRequired=stepUpRequired;}
  public Boolean getSuccess(){return success;}
  public void setSuccess(Boolean success){this.success=success;}
  public String getMetadata(){return metadata;}
  public void setMetadata(String metadata){this.metadata=metadata;}
  public OffsetDateTime getCreatedAt(){return createdAt;}
  public void setCreatedAt(OffsetDateTime createdAt){this.createdAt=createdAt;}
}
