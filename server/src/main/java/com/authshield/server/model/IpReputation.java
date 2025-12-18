package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="ip_reputations")
public class IpReputation {
  @Id @Column(length=64)
  private String id;

  @Column(name="ip_address", nullable=false, unique=true)
  private String ipAddress;

  @Column(name="reputation_score")
  private Double reputationScore;

  private Boolean blacklisted;
  private String reason;

  @Column(name="last_updated", nullable=false)
  private OffsetDateTime lastUpdated;

  @PrePersist void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (reputationScore == null) reputationScore = 0.5;
    if (blacklisted == null) blacklisted = false;
    if (lastUpdated == null) lastUpdated = OffsetDateTime.now();
  }

  @PreUpdate void preUpdate() { lastUpdated = OffsetDateTime.now(); }

  public String getId(){return id;}
  public void setId(String id){this.id=id;}
  public String getIpAddress(){return ipAddress;}
  public void setIpAddress(String ipAddress){this.ipAddress=ipAddress;}
  public Double getReputationScore(){return reputationScore;}
  public void setReputationScore(Double reputationScore){this.reputationScore=reputationScore;}
  public Boolean getBlacklisted(){return blacklisted;}
  public void setBlacklisted(Boolean blacklisted){this.blacklisted=blacklisted;}
  public String getReason(){return reason;}
  public void setReason(String reason){this.reason=reason;}
  public OffsetDateTime getLastUpdated(){return lastUpdated;}
  public void setLastUpdated(OffsetDateTime lastUpdated){this.lastUpdated=lastUpdated;}
}
