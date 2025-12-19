package com.authshield.server.controller;

import com.authshield.server.dto.geo.ImpossibleTravelRequest;
import com.authshield.server.dto.geo.ImpossibleTravelResponse;
import com.authshield.server.service.ImpossibleTravelService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Parity port of Node endpoint:
 * POST /api/detect-impossible-travel (server.js/routes.ts)
 */
@RestController
public class ImpossibleTravelController {

  private final ImpossibleTravelService svc;

  public ImpossibleTravelController(ImpossibleTravelService svc) {
    this.svc = svc;
  }

  @PostMapping("/api/detect-impossible-travel")
  public ImpossibleTravelResponse detect(@RequestBody ImpossibleTravelRequest req) {
    if (req == null || req.userId == null || req.userId.trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request body: userId is required");
    }

    try {
      return svc.detectAndRecord(req);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
    }
  }
}
