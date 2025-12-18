package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="device_profiles")
public class DeviceProfile {
  @Id
  @Column(length = 64)
  private String id;

  @Column(name="user_id")
  private String userId;

  @Column(nullable=false, unique=true)
  private String fingerprint;

  @Column(name="user_agent")
  private String userAgent;

  private String platform;
  private String language;
  private String timezone;

  @Column(name="screen_resolution")
  private String screenResolution;

  @Column(name="color_depth")
  private Integer colorDepth;

  @Column(name="pixel_ratio")
  private Double pixelRatio;

  @Column(name="hardware_concurrency")
  private Integer hardwareConcurrency;

  @Column(name="device_memory")
  private Integer deviceMemory;

  @Column(name="touch_support")
  private Boolean touchSupport;

  @Column(name="webgl_vendor")
  private String webglVendor;

  @Column(name="webgl_renderer")
  private String webglRenderer;

  @Column(name="canvas_fingerprint")
  private String canvasFingerprint;

  @Column(name="audio_fingerprint")
  private String audioFingerprint;

  // arrays stored as Postgres text[]
  @Column(columnDefinition = "text[]")
  private String[] fonts;

  @Column(columnDefinition = "text[]")
  private String[] plugins;

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
  void preUpdate() {
    lastSeen = OffsetDateTime.now();
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getFingerprint() { return fingerprint; }
  public void setFingerprint(String fingerprint) { this.fingerprint = fingerprint; }
  public String getUserAgent() { return userAgent; }
  public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
  public String getPlatform() { return platform; }
  public void setPlatform(String platform) { this.platform = platform; }
  public String getLanguage() { return language; }
  public void setLanguage(String language) { this.language = language; }
  public String getTimezone() { return timezone; }
  public void setTimezone(String timezone) { this.timezone = timezone; }
  public String getScreenResolution() { return screenResolution; }
  public void setScreenResolution(String screenResolution) { this.screenResolution = screenResolution; }
  public Integer getColorDepth() { return colorDepth; }
  public void setColorDepth(Integer colorDepth) { this.colorDepth = colorDepth; }
  public Double getPixelRatio() { return pixelRatio; }
  public void setPixelRatio(Double pixelRatio) { this.pixelRatio = pixelRatio; }
  public Integer getHardwareConcurrency() { return hardwareConcurrency; }
  public void setHardwareConcurrency(Integer hardwareConcurrency) { this.hardwareConcurrency = hardwareConcurrency; }
  public Integer getDeviceMemory() { return deviceMemory; }
  public void setDeviceMemory(Integer deviceMemory) { this.deviceMemory = deviceMemory; }
  public Boolean getTouchSupport() { return touchSupport; }
  public void setTouchSupport(Boolean touchSupport) { this.touchSupport = touchSupport; }
  public String getWebglVendor() { return webglVendor; }
  public void setWebglVendor(String webglVendor) { this.webglVendor = webglVendor; }
  public String getWebglRenderer() { return webglRenderer; }
  public void setWebglRenderer(String webglRenderer) { this.webglRenderer = webglRenderer; }
  public String getCanvasFingerprint() { return canvasFingerprint; }
  public void setCanvasFingerprint(String canvasFingerprint) { this.canvasFingerprint = canvasFingerprint; }
  public String getAudioFingerprint() { return audioFingerprint; }
  public void setAudioFingerprint(String audioFingerprint) { this.audioFingerprint = audioFingerprint; }
  public String[] getFonts() { return fonts; }
  public void setFonts(String[] fonts) { this.fonts = fonts; }
  public String[] getPlugins() { return plugins; }
  public void setPlugins(String[] plugins) { this.plugins = plugins; }
  public Double getTrustScore() { return trustScore; }
  public void setTrustScore(Double trustScore) { this.trustScore = trustScore; }
  public Integer getSeenCount() { return seenCount; }
  public void setSeenCount(Integer seenCount) { this.seenCount = seenCount; }
  public OffsetDateTime getFirstSeen() { return firstSeen; }
  public void setFirstSeen(OffsetDateTime firstSeen) { this.firstSeen = firstSeen; }
  public OffsetDateTime getLastSeen() { return lastSeen; }
  public void setLastSeen(OffsetDateTime lastSeen) { this.lastSeen = lastSeen; }
}
