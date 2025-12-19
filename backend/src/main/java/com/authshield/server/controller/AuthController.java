package com.authshield.server.controller;

import com.authshield.server.dto.auth.*;
import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.User;
import com.authshield.server.repo.UserRepository;
import com.authshield.server.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class AuthController {

  private final AuthService auth;
  private final UserRepository users;

  public AuthController(AuthService auth, UserRepository users) {
    this.auth = auth;
    this.users = users;
  }

  @PostMapping("/api/register")
  public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
    User u = auth.register(req);
    return ResponseEntity.ok(new UserResponse(u.getId(), u.getUsername(), u.getEmail()));
  }

  @PostMapping("/api/login")
  public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
    auth.login(req.getUsername(), req.getPassword());
    User u = users.findByUsername(req.getUsername()).orElseThrow();
    return ResponseEntity.ok(new UserResponse(u.getId(), u.getUsername(), u.getEmail()));
  }

  @PostMapping("/api/logout")
  public ResponseEntity<?> logout(HttpServletRequest request) {
    request.getSession().invalidate();
    auth.logout();
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @GetMapping("/api/user")
  public ResponseEntity<?> me() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    if (a == null || !a.isAuthenticated() || "anonymousUser".equals(a.getPrincipal())) {
      return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
    }
    String username = a.getName();
    User u = users.findByUsername(username).orElseThrow();
    return ResponseEntity.ok(new UserResponse(u.getId(), u.getUsername(), u.getEmail()));
  }
}
