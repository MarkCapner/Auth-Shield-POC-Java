package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.AbExperiment;
import com.authshield.server.repo.AbExperimentRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/experiments")
public class ExperimentsController {
  private final AbExperimentRepository repo;
  public ExperimentsController(AbExperimentRepository repo) { this.repo = repo; }

  @GetMapping
  public List<AbExperiment> list() { return repo.findAll(); }

  @GetMapping("/{id}")
  public AbExperiment get(@PathVariable String id) { return repo.findById(id).orElseThrow(); }

  @PostMapping
  public IdResponse create(@RequestBody AbExperiment body) {
    AbExperiment saved = repo.save(body);
    return new IdResponse(saved.getId());
  }
}
