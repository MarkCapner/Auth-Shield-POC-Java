package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="sessions")
public class SessionEntity {
  @Id @Column(length=64)
  private String id;

  @Column(name="user_id")
  private String userId;

  @Column(name="device_profile_id")
  private String deviceProfileId;

  @Column(nullable=false, unique=true)
  private String token;

  @Column(name="confidence_score")
  private Double confidenceScore;

  @Column(name="last_activity", nullable=false)
  private OffsetDateTime lastActivity;

  @Column(name="expires_at", nullable=false)
  private OffsetDateTime expiresAt;

  @Column(name="is_active")
  private Boolean isActive;

  @Column(name="created_at", nullable=false)
  private OffsetDateTime createdAt;

  @PrePersist void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (confidenceScore == null) confidenceScore = 0.0;
    if (isActive == null) isActive = true;
    if (createdAt == null) createdAt = OffsetDateTime.now();
    if (lastActivity == null) lastActivity = OffsetDateTime.now();
    if (expiresAt == null) expiresAt = OffsetDateTime.now().plusHours(8);
  }

  @PreUpdate void preUpdate() { lastActivity = OffsetDateTime.now(); }

  public String getId(){return id;}
  public void setId(String id){this.id=id;}
  public String getUserId(){return userId;}
  public void setUserId(String userId){this.userId=userId;}
  public String getDeviceProfileId(){return deviceProfileId;}
  public void setDeviceProfileId(String deviceProfileId){this.deviceProfileId=deviceProfileId;}
  public String getToken(){return token;}
  public void setToken(String token){this.token=token;}
  public Double getConfidenceScore(){return confidenceScore;}
  public void setConfidenceScore(Double confidenceScore){this.confidenceScore=confidenceScore;}
  public OffsetDateTime getLastActivity(){return lastActivity;}
  public void setLastActivity(OffsetDateTime lastActivity){this.lastActivity=lastActivity;}
  public OffsetDateTime getExpiresAt(){return expiresAt;}
  public void setExpiresAt(OffsetDateTime expiresAt){this.expiresAt=expiresAt;}
  public Boolean getIsActive(){return isActive;}
  public void setIsActive(Boolean active){this.isActive=active;}
  public OffsetDateTime getCreatedAt(){return createdAt;}
  public void setCreatedAt(OffsetDateTime createdAt){this.createdAt=createdAt;}
}
