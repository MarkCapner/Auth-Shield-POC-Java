package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="flagged_sessions")
public class FlaggedSession {
  @Id @Column(length=64)
  private String id;

  @Column(name="session_id", nullable=false)
  private String sessionId;

  @Column(name="user_id")
  private String userId;

  private String reason;

  @Column(name="flagged_by")
  private String flaggedBy;

  @Column(name="created_at", nullable=false)
  private OffsetDateTime createdAt;

  private Boolean resolved;

  @PrePersist void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (createdAt == null) createdAt = OffsetDateTime.now();
    if (resolved == null) resolved = false;
  }

  public String getId(){return id;}
  public void setId(String id){this.id=id;}
  public String getSessionId(){return sessionId;}
  public void setSessionId(String sessionId){this.sessionId=sessionId;}
  public String getUserId(){return userId;}
  public void setUserId(String userId){this.userId=userId;}
  public String getReason(){return reason;}
  public void setReason(String reason){this.reason=reason;}
  public String getFlaggedBy(){return flaggedBy;}
  public void setFlaggedBy(String flaggedBy){this.flaggedBy=flaggedBy;}
  public OffsetDateTime getCreatedAt(){return createdAt;}
  public void setCreatedAt(OffsetDateTime createdAt){this.createdAt=createdAt;}
  public Boolean getResolved(){return resolved;}
  public void setResolved(Boolean resolved){this.resolved=resolved;}
}
