package com.authshield.server.dto.geo;

/**
 * Mirrors the Node impossibleTravelSchema in server.js/routes.ts
 */
public class ImpossibleTravelRequest {
  public String userId;
  /** Optional session id to link created geolocation/anomaly to a session. */
  public String sessionId;
  public String ipAddress;
  public Double latitude;
  public Double longitude;
  public String city;
  public String country;
}
