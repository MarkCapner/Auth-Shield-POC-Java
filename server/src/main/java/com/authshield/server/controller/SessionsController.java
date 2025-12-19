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
    Map<String,Object> out = new java.util.HashMap<>();
    if (token == null || token.isBlank()) {
      out.put("valid", false);
      out.put("error", "No token provided");
      return out;
    }

    // Keep it simple and avoid Map.of generic inference issues in older compilers.
    // token is reassigned above, so capture it into an effectively-final variable for lambdas.
    final String tok = token;
    SessionEntity s = repo.findAll().stream().filter(x -> tok.equals(x.getToken())).findFirst().orElse(null);
    if (s == null || !Boolean.TRUE.equals(s.getIsActive()) || s.getExpiresAt() == null || s.getExpiresAt().isBefore(OffsetDateTime.now())) {
      out.put("valid", false);
      out.put("error", "Invalid or expired session");
      return out;
    }

    s.setLastActivity(OffsetDateTime.now());
    repo.save(s);
    out.put("valid", true);
    out.put("session", s);
    return out;
  }
}
