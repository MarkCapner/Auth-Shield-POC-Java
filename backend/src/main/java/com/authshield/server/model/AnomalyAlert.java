package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="anomaly_alerts")
public class AnomalyAlert {
  @Id @Column(length=64)
  private String id;

  @Column(name="user_id")
  private String userId;

  @Column(name="session_id")
  private String sessionId;

  @Column(name="alert_type", nullable=false)
  private String alertType;

  private String severity;
  private String description;

  @Column(columnDefinition="jsonb")
  private String metadata;

  @Column(name="created_at", nullable=false)
  private OffsetDateTime createdAt;

  private Boolean resolved;

  @Column(name="resolved_at")
  private OffsetDateTime resolvedAt;

  @PrePersist void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (severity == null) severity = "medium";
    if (resolved == null) resolved = false;
    if (createdAt == null) createdAt = OffsetDateTime.now();
  }

  public String getId(){return id;}
  public void setId(String id){this.id=id;}
  public String getUserId(){return userId;}
  public void setUserId(String userId){this.userId=userId;}
  public String getSessionId(){return sessionId;}
  public void setSessionId(String sessionId){this.sessionId=sessionId;}
  public String getAlertType(){return alertType;}
  public void setAlertType(String alertType){this.alertType=alertType;}
  public String getSeverity(){return severity;}
  public void setSeverity(String severity){this.severity=severity;}
  public String getDescription(){return description;}
  public void setDescription(String description){this.description=description;}
  public String getMetadata(){return metadata;}
  public void setMetadata(String metadata){this.metadata=metadata;}
  public OffsetDateTime getCreatedAt(){return createdAt;}
  public void setCreatedAt(OffsetDateTime createdAt){this.createdAt=createdAt;}
  public Boolean getResolved(){return resolved;}
  public void setResolved(Boolean resolved){this.resolved=resolved;}
  public OffsetDateTime getResolvedAt(){return resolvedAt;}
  public void setResolvedAt(OffsetDateTime resolvedAt){this.resolvedAt=resolvedAt;}
}
