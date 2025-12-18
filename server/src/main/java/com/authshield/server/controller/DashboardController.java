package com.authshield.server.controller;

import com.authshield.server.service.DashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

  private final DashboardService svc;

  public DashboardController(DashboardService svc) {
    this.svc = svc;
  }

  @GetMapping("/stats")
  public Map<String,Object> stats() { return svc.stats(); }

  @GetMapping("/risk-factors")
  public Map<String,Object> riskFactors() { return svc.riskFactors(); }

  @GetMapping("/timeline")
  public List<Map<String,Object>> timeline() { return svc.timeline(); }
}
