package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="ab_experiments")
public class AbExperiment {
  @Id @Column(length=64)
  private String id;

  @Column(nullable=false)
  private String name;

  private String description;
  private Boolean active;

  @Column(columnDefinition="jsonb")
  private String variants;

  @Column(name="created_at", nullable=false)
  private OffsetDateTime createdAt;

  @PrePersist void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (active == null) active = true;
    if (createdAt == null) createdAt = OffsetDateTime.now();
  }

  public String getId(){return id;}
  public void setId(String id){this.id=id;}
  public String getName(){return name;}
  public void setName(String name){this.name=name;}
  public String getDescription(){return description;}
  public void setDescription(String description){this.description=description;}
  public Boolean getActive(){return active;}
  public void setActive(Boolean active){this.active=active;}
  public String getVariants(){return variants;}
  public void setVariants(String variants){this.variants=variants;}
  public OffsetDateTime getCreatedAt(){return createdAt;}
  public void setCreatedAt(OffsetDateTime createdAt){this.createdAt=createdAt;}
}
