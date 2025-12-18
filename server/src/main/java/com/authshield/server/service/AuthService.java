package com.authshield.server.service;

import com.authshield.server.dto.auth.RegisterRequest;
import com.authshield.server.model.User;
import com.authshield.server.repo.UserRepository;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final AuthenticationManager authManager;

  public AuthService(UserRepository users, PasswordEncoder encoder, AuthenticationManager authManager) {
    this.users = users;
    this.encoder = encoder;
    this.authManager = authManager;
  }

  public User register(RegisterRequest req) {
    users.findByUsername(req.getUsername()).ifPresent(u -> {
      throw new IllegalArgumentException("Username already exists");
    });
    User u = new User();
    u.setUsername(req.getUsername());
    u.setPassword(encoder.encode(req.getPassword()));
    u.setEmail(req.getEmail());
    return users.save(u);
  }

  public void login(String username, String password) {
    Authentication auth = authManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
    SecurityContextHolder.getContext().setAuthentication(auth);
  }

  public void logout() {
    SecurityContextHolder.clearContext();
  }
}
