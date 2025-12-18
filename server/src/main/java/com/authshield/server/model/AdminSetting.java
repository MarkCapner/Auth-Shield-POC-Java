package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="admin_settings")
public class AdminSetting {
  @Id @Column(length=64)
  private String id;

  @Column(name="setting_key", nullable=false, unique=true)
  private String settingKey;

  @Column(columnDefinition="jsonb")
  private String value;

  @Column(name="updated_at", nullable=false)
  private OffsetDateTime updatedAt;

  @PrePersist void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (updatedAt == null) updatedAt = OffsetDateTime.now();
  }

  @PreUpdate void preUpdate() { updatedAt = OffsetDateTime.now(); }

  public String getId(){return id;}
  public void setId(String id){this.id=id;}
  public String getSettingKey(){return settingKey;}
  public void setSettingKey(String settingKey){this.settingKey=settingKey;}
  public String getValue(){return value;}
  public void setValue(String value){this.value=value;}
  public OffsetDateTime getUpdatedAt(){return updatedAt;}
  public void setUpdatedAt(OffsetDateTime updatedAt){this.updatedAt=updatedAt;}
}
