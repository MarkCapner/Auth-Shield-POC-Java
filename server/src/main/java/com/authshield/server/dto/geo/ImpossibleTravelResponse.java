package com.authshield.server.dto.geo;

import com.authshield.server.model.AnomalyAlert;
import com.authshield.server.model.Geolocation;

import java.util.Map;

public class ImpossibleTravelResponse {
  public boolean impossibleTravel;
  public AnomalyAlert alert;
  public Geolocation geolocation;
  /**
   * Extra key/value fields useful to link detection into risk factor payloads.
   * Kept as a map for client flexibility.
   */
  public Map<String,Object> factors;

  public ImpossibleTravelResponse(boolean impossibleTravel, AnomalyAlert alert, Geolocation geolocation, Map<String,Object> factors) {
    this.impossibleTravel = impossibleTravel;
    this.alert = alert;
    this.geolocation = geolocation;
    this.factors = factors;
  }
}
