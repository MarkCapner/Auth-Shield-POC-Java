package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="tls_fingerprints")
public class TlsFingerprint {
  @Id
  @Column(length = 64)
  private String id;

  @Column(name="user_id")
  private String userId;

  @Column(name="device_profile_id")
  private String deviceProfileId;

  @Column(name="ja3_hash")
  private String ja3Hash;

  @Column(name="ja3_full")
  private String ja3Full;

  @Column(name="ja4_hash")
  private String ja4Hash;

  @Column(name="ja4_full")
  private String ja4Full;

  @Column(name="tls_version")
  private String tlsVersion;

  @Column(name="cipher_suites", columnDefinition="text[]")
  private String[] cipherSuites;

  @Column(columnDefinition="text[]")
  private String[] extensions;

  @Column(name="supported_groups", columnDefinition="text[]")
  private String[] supportedGroups;

  @Column(name="signature_algorithms", columnDefinition="text[]")
  private String[] signatureAlgorithms;

  @Column(name="alpn_protocols", columnDefinition="text[]")
  private String[] alpnProtocols;

  @Column(name="trust_score")
  private Double trustScore;

  @Column(name="seen_count")
  private Integer seenCount;

  @Column(name="first_seen", nullable=false)
  private OffsetDateTime firstSeen;

  @Column(name="last_seen", nullable=false)
  private OffsetDateTime lastSeen;

  @PrePersist
  void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (trustScore == null) trustScore = 0.5;
    if (seenCount == null) seenCount = 1;
    if (firstSeen == null) firstSeen = OffsetDateTime.now();
    if (lastSeen == null) lastSeen = OffsetDateTime.now();
  }

  @PreUpdate
  void preUpdate() { lastSeen = OffsetDateTime.now(); }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getDeviceProfileId() { return deviceProfileId; }
  public void setDeviceProfileId(String deviceProfileId) { this.deviceProfileId = deviceProfileId; }
  public String getJa3Hash() { return ja3Hash; }
  public void setJa3Hash(String ja3Hash) { this.ja3Hash = ja3Hash; }
  public String getJa3Full() { return ja3Full; }
  public void setJa3Full(String ja3Full) { this.ja3Full = ja3Full; }
  public String getJa4Hash() { return ja4Hash; }
  public void setJa4Hash(String ja4Hash) { this.ja4Hash = ja4Hash; }
  public String getJa4Full() { return ja4Full; }
  public void setJa4Full(String ja4Full) { this.ja4Full = ja4Full; }
  public String getTlsVersion() { return tlsVersion; }
  public void setTlsVersion(String tlsVersion) { this.tlsVersion = tlsVersion; }
  public String[] getCipherSuites() { return cipherSuites; }
  public void setCipherSuites(String[] cipherSuites) { this.cipherSuites = cipherSuites; }
  public String[] getExtensions() { return extensions; }
  public void setExtensions(String[] extensions) { this.extensions = extensions; }
  public String[] getSupportedGroups() { return supportedGroups; }
  public void setSupportedGroups(String[] supportedGroups) { this.supportedGroups = supportedGroups; }
  public String[] getSignatureAlgorithms() { return signatureAlgorithms; }
  public void setSignatureAlgorithms(String[] signatureAlgorithms) { this.signatureAlgorithms = signatureAlgorithms; }
  public String[] getAlpnProtocols() { return alpnProtocols; }
  public void setAlpnProtocols(String[] alpnProtocols) { this.alpnProtocols = alpnProtocols; }
  public Double getTrustScore() { return trustScore; }
  public void setTrustScore(Double trustScore) { this.trustScore = trustScore; }
  public Integer getSeenCount() { return seenCount; }
  public void setSeenCount(Integer seenCount) { this.seenCount = seenCount; }
  public OffsetDateTime getFirstSeen() { return firstSeen; }
  public void setFirstSeen(OffsetDateTime firstSeen) { this.firstSeen = firstSeen; }
  public OffsetDateTime getLastSeen() { return lastSeen; }
  public void setLastSeen(OffsetDateTime lastSeen) { this.lastSeen = lastSeen; }
}
