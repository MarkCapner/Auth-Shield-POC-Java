package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.BehavioralPattern;
import com.authshield.server.repo.BehavioralPatternRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/behavioral-patterns")
public class BehavioralPatternsController {

  private final BehavioralPatternRepository repo;

  public BehavioralPatternsController(BehavioralPatternRepository repo) { this.repo = repo; }

  @GetMapping
  public List<BehavioralPattern> list() { return repo.findAll(); }

  @PostMapping
  public IdResponse create(@RequestBody BehavioralPattern body) {
    BehavioralPattern saved = repo.save(body);
    return new IdResponse(saved.getId());
  }
}
