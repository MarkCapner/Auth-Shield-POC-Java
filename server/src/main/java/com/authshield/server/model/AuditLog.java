package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="audit_logs")
public class AuditLog {
  @Id @Column(length=64)
  private String id;

  @Column(name="user_id")
  private String userId;

  @Column(nullable=false)
  private String action;

  private String resource;

  @Column(columnDefinition="jsonb")
  private String details;

  @Column(name="ip_address")
  private String ipAddress;

  @Column(name="created_at", nullable=false)
  private OffsetDateTime createdAt;

  @PrePersist void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (createdAt == null) createdAt = OffsetDateTime.now();
  }

  public String getId(){return id;}
  public void setId(String id){this.id=id;}
  public String getUserId(){return userId;}
  public void setUserId(String userId){this.userId=userId;}
  public String getAction(){return action;}
  public void setAction(String action){this.action=action;}
  public String getResource(){return resource;}
  public void setResource(String resource){this.resource=resource;}
  public String getDetails(){return details;}
  public void setDetails(String details){this.details=details;}
  public String getIpAddress(){return ipAddress;}
  public void setIpAddress(String ipAddress){this.ipAddress=ipAddress;}
  public OffsetDateTime getCreatedAt(){return createdAt;}
  public void setCreatedAt(OffsetDateTime createdAt){this.createdAt=createdAt;}
}
