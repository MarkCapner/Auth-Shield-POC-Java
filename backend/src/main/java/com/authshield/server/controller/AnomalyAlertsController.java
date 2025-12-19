package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.AnomalyAlert;
import com.authshield.server.repo.AnomalyAlertRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/anomaly-alerts")
public class AnomalyAlertsController {
  private final AnomalyAlertRepository repo;
  public AnomalyAlertsController(AnomalyAlertRepository repo) { this.repo = repo; }

  @GetMapping
  public List<AnomalyAlert> list() { return repo.findTop200ByOrderByCreatedAtDesc(); }

  @PostMapping
  public IdResponse create(@RequestBody AnomalyAlert body) {
    AnomalyAlert saved = repo.save(body);
    return new IdResponse(saved.getId());
  }
}
