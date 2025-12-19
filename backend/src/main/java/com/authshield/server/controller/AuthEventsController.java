package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.AuthenticationEvent;
import com.authshield.server.repo.AuthenticationEventRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth-events")
public class AuthEventsController {

  private final AuthenticationEventRepository repo;

  public AuthEventsController(AuthenticationEventRepository repo) { this.repo = repo; }

  @GetMapping
  public List<AuthenticationEvent> list() { return repo.findTop200ByOrderByCreatedAtDesc(); }

  @PostMapping
  public IdResponse create(@RequestBody AuthenticationEvent body) {
    AuthenticationEvent saved = repo.save(body);
    return new IdResponse(saved.getId());
  }
}
