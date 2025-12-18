package com.authshield.server.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="geolocations")
public class Geolocation {
  @Id @Column(length=64)
  private String id;

  @Column(name="user_id")
  private String userId;

  @Column(name="session_id")
  private String sessionId;

  @Column(name="ip_address", nullable=false)
  private String ipAddress;

  private String city;
  private String region;
  private String country;
  @Column(name="country_code")
  private String countryCode;
  private Double latitude;
  private Double longitude;
  private String timezone;
  private String isp;
  private String asn;

  @Column(name="is_proxy")
  private Boolean isProxy;
  @Column(name="is_vpn")
  private Boolean isVpn;
  @Column(name="is_tor")
  private Boolean isTor;
  @Column(name="is_datacenter")
  private Boolean isDatacenter;

  @Column(name="risk_score")
  private Double riskScore;

  @Column(name="created_at", nullable=false)
  private OffsetDateTime createdAt;

  @PrePersist void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    if (createdAt == null) createdAt = OffsetDateTime.now();
    if (isProxy == null) isProxy = false;
    if (isVpn == null) isVpn = false;
    if (isTor == null) isTor = false;
    if (isDatacenter == null) isDatacenter = false;
    if (riskScore == null) riskScore = 0.0;
  }

  public String getId(){return id;}
  public void setId(String id){this.id=id;}
  public String getUserId(){return userId;}
  public void setUserId(String userId){this.userId=userId;}
  public String getSessionId(){return sessionId;}
  public void setSessionId(String sessionId){this.sessionId=sessionId;}
  public String getIpAddress(){return ipAddress;}
  public void setIpAddress(String ipAddress){this.ipAddress=ipAddress;}
  public String getCity(){return city;}
  public void setCity(String city){this.city=city;}
  public String getRegion(){return region;}
  public void setRegion(String region){this.region=region;}
  public String getCountry(){return country;}
  public void setCountry(String country){this.country=country;}
  public String getCountryCode(){return countryCode;}
  public void setCountryCode(String countryCode){this.countryCode=countryCode;}
  public Double getLatitude(){return latitude;}
  public void setLatitude(Double latitude){this.latitude=latitude;}
  public Double getLongitude(){return longitude;}
  public void setLongitude(Double longitude){this.longitude=longitude;}
  public String getTimezone(){return timezone;}
  public void setTimezone(String timezone){this.timezone=timezone;}
  public String getIsp(){return isp;}
  public void setIsp(String isp){this.isp=isp;}
  public String getAsn(){return asn;}
  public void setAsn(String asn){this.asn=asn;}
  public Boolean getIsProxy(){return isProxy;}
  public void setIsProxy(Boolean isProxy){this.isProxy=isProxy;}
  public Boolean getIsVpn(){return isVpn;}
  public void setIsVpn(Boolean isVpn){this.isVpn=isVpn;}
  public Boolean getIsTor(){return isTor;}
  public void setIsTor(Boolean isTor){this.isTor=isTor;}
  public Boolean getIsDatacenter(){return isDatacenter;}
  public void setIsDatacenter(Boolean isDatacenter){this.isDatacenter=isDatacenter;}
  public Double getRiskScore(){return riskScore;}
  public void setRiskScore(Double riskScore){this.riskScore=riskScore;}
  public OffsetDateTime getCreatedAt(){return createdAt;}
  public void setCreatedAt(OffsetDateTime createdAt){this.createdAt=createdAt;}
}
