package com.authshield.server.service;

import com.authshield.server.dto.geo.ImpossibleTravelRequest;
import com.authshield.server.dto.geo.ImpossibleTravelResponse;
import com.authshield.server.model.AnomalyAlert;
import com.authshield.server.model.Geolocation;
import com.authshield.server.repo.AnomalyAlertRepository;
import com.authshield.server.repo.GeolocationRepository;
import com.authshield.server.ws.WebSocketHub;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Shared implementation for impossible-travel detection.
 *
 * This is used by:
 *  - POST /api/detect-impossible-travel
 *  - POST /api/calculate-risk (server-side enrichment)
 */
@Service
public class ImpossibleTravelService {

  private final GeolocationRepository geos;
  private final AnomalyAlertRepository alerts;
  private final WebSocketHub hub;
  private final ObjectMapper om;

  public ImpossibleTravelService(GeolocationRepository geos,
                                 AnomalyAlertRepository alerts,
                                 WebSocketHub hub,
                                 ObjectMapper om) {
    this.geos = geos;
    this.alerts = alerts;
    this.hub = hub;
    this.om = om;
  }

  public ImpossibleTravelResponse detectAndRecord(ImpossibleTravelRequest req) {
    if (req == null || req.userId == null || req.userId.trim().isEmpty()) {
      throw new IllegalArgumentException("userId is required");
    }

    Geolocation lastGeo = geos.findTopByUserIdOrderByCreatedAtDesc(req.userId).orElse(null);

    boolean impossibleTravel = false;
    AnomalyAlert alert = null;

    Double distanceKm = null;
    Double timeDeltaHours = null;
    Double requiredSpeedKmh = null;

    if (lastGeo != null
        && lastGeo.getLatitude() != null && lastGeo.getLongitude() != null
        && req.latitude != null && req.longitude != null
        && lastGeo.getCreatedAt() != null) {

      distanceKm = haversineKm(lastGeo.getLatitude(), lastGeo.getLongitude(), req.latitude, req.longitude);

      Duration delta = Duration.between(lastGeo.getCreatedAt(), OffsetDateTime.now());
      double hours = Math.max(0.0, delta.toMillis() / (1000.0 * 60.0 * 60.0));
      timeDeltaHours = hours;

      requiredSpeedKmh = (hours > 0.0) ? (distanceKm / hours) : Double.POSITIVE_INFINITY;

      if (requiredSpeedKmh > 1000.0) {
        impossibleTravel = true;
        double riskScore = Math.min(1.0, requiredSpeedKmh / 10000.0);

        Map<String,Object> metadata = new HashMap<>();
        metadata.put("sourceIp", req.ipAddress);

        Map<String,Object> sourceLoc = new HashMap<>();
        sourceLoc.put("city", req.city);
        sourceLoc.put("country", req.country);
        sourceLoc.put("lat", req.latitude);
        sourceLoc.put("lng", req.longitude);
        metadata.put("sourceLocation", sourceLoc);

        metadata.put("previousIp", lastGeo.getIpAddress());
        Map<String,Object> prevLoc = new HashMap<>();
        prevLoc.put("city", lastGeo.getCity());
        prevLoc.put("country", lastGeo.getCountry());
        prevLoc.put("lat", lastGeo.getLatitude());
        prevLoc.put("lng", lastGeo.getLongitude());
        metadata.put("previousLocation", prevLoc);
        metadata.put("travelDistanceKm", distanceKm);
        metadata.put("timeDeltaMinutes", hours * 60.0);
        metadata.put("requiredSpeedKmh", requiredSpeedKmh);
        metadata.put("riskScore", riskScore);

        AnomalyAlert a = new AnomalyAlert();
        a.setUserId(req.userId);
        a.setAlertType("impossible_travel");
        a.setSeverity(requiredSpeedKmh > 5000.0 ? "critical" : "high");
        String fromCity = safe(lastGeo.getCity());
        String fromCountry = safe(lastGeo.getCountry());
        String toCity = safe(req.city);
        String toCountry = safe(req.country);
        a.setDescription("User appeared in " + toCity + ", " + toCountry + " from " + fromCity + ", " + fromCountry +
            " requiring " + Math.round(requiredSpeedKmh) + " km/h travel speed");
        a.setMetadata(writeJson(metadata));
        alert = alerts.save(a);

        // Broadcast activity (matches Node broadcastActivity)
        Map<String,Object> activity = new HashMap<>();
        activity.put("id", UUID.randomUUID().toString());
        activity.put("type", "risk_calculated");
        activity.put("userId", req.userId);
        activity.put("riskScore", riskScore);
        activity.put("confidenceLevel", "low");
        activity.put("message", "Impossible travel detected: " + Math.round(distanceKm) + "km in " +
            Math.round(hours * 60.0) + " minutes");
        activity.put("timestamp", OffsetDateTime.now().toString());
        try {
          hub.broadcastJson(writeJson(Map.of("type", "activity", "activity", activity)));
        } catch (Exception ignored) {}
      }
    }

    // Record new geolocation (mirrors Node createGeolocation)
    Geolocation g = new Geolocation();
    g.setUserId(req.userId);
    g.setSessionId(req.sessionId);
    g.setIpAddress(req.ipAddress == null ? "" : req.ipAddress);
    g.setLatitude(req.latitude);
    g.setLongitude(req.longitude);
    g.setCity(req.city);
    g.setCountry(req.country);
    if (impossibleTravel && requiredSpeedKmh != null) {
      g.setRiskScore(Math.min(1.0, requiredSpeedKmh / 10000.0));
    }
    Geolocation saved = geos.save(g);

    Map<String,Object> factors = new HashMap<>();
    // Both keys: camelCase (existing) + snake_case (UI parity)
    factors.put("impossibleTravel", impossibleTravel);
    factors.put("impossible_travel", impossibleTravel);
    if (distanceKm != null) factors.put("travelDistanceKm", distanceKm);
    if (timeDeltaHours != null) factors.put("timeDeltaMinutes", timeDeltaHours * 60.0);
    if (requiredSpeedKmh != null) factors.put("requiredSpeedKmh", requiredSpeedKmh);
    if (alert != null) factors.put("alertId", alert.getId());

    return new ImpossibleTravelResponse(impossibleTravel, alert, saved, factors);
  }

  public Optional<Geolocation> lastForUser(String userId) {
    return geos.findTopByUserIdOrderByCreatedAtDesc(userId);
  }

  private String safe(String s) {
    return (s == null || s.isBlank()) ? "Unknown" : s;
  }

  private String writeJson(Object o) {
    try {
      return om.writeValueAsString(o);
    } catch (Exception e) {
      return "{}";
    }
  }

  /** Haversine distance in KM. */
  private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
    final double R = 6371.0;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
