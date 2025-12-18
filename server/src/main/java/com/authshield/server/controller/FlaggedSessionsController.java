package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.FlaggedSession;
import com.authshield.server.repo.FlaggedSessionRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flagged-sessions")
public class FlaggedSessionsController {
  private final FlaggedSessionRepository repo;
  public FlaggedSessionsController(FlaggedSessionRepository repo) { this.repo = repo; }

  @GetMapping
  public List<FlaggedSession> list() { return repo.findTop200ByOrderByCreatedAtDesc(); }

  @PostMapping
  public IdResponse create(@RequestBody FlaggedSession body) {
    FlaggedSession saved = repo.save(body);
    return new IdResponse(saved.getId());
  }
}
