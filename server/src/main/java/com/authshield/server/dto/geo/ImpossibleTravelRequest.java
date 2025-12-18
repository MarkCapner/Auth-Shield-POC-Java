package com.authshield.server.dto.geo;

/**
 * Mirrors the Node impossibleTravelSchema in server.js/routes.ts
 */
public class ImpossibleTravelRequest {
  public String userId;
  public String ipAddress;
  public Double latitude;
  public Double longitude;
  public String city;
  public String country;
}
