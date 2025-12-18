package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.SessionEntity;
import com.authshield.server.repo.SessionRepository;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
public class SessionsController {

  private final SessionRepository repo;

  public SessionsController(SessionRepository repo) { this.repo = repo; }

  @GetMapping
  public List<SessionEntity> list() { return repo.findTop200ByOrderByLastActivityDesc(); }

  @PostMapping
  public IdResponse create(@RequestBody SessionEntity body) {
    if (body.getToken() == null || body.getToken().isBlank()) {
      body.setToken(java.util.UUID.randomUUID().toString());
    }
    if (body.getExpiresAt() == null) {
      body.setExpiresAt(OffsetDateTime.now().plusHours(8));
    }
    SessionEntity saved = repo.save(body);
    return new IdResponse(saved.getId());
  }

  @GetMapping("/validate")
  public Map<String,Object> validate(@RequestHeader(value="Authorization", required=false) String authz) {
    String token = null;
    if (authz != null && authz.startsWith("Bearer ")) token = authz.substring(7);
    if (token == null || token.isBlank()) return Map.of("valid", false, "error", "No token provided");

    final String t = token;
    return repo.findAll().stream().filter(s -> t.equals(s.getToken())).findFirst()
      .map(s -> {
        if (!Boolean.TRUE.equals(s.getIsActive()) || s.getExpiresAt().isBefore(OffsetDateTime.now())) {
          return Map.of("valid", false, "error", "Invalid or expired session");
        }
        s.setLastActivity(OffsetDateTime.now());
        repo.save(s);
        return Map.of("valid", true, "session", s);
      })
      .orElse(Map.of("valid", false, "error", "Invalid or expired session"));
  }
}
