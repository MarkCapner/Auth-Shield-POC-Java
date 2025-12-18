package com.authshield.server.controller;

import com.authshield.server.dto.auth.RegisterRequest;
import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.User;
import com.authshield.server.repo.UserRepository;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UsersController {

  private final UserRepository users;
  private final PasswordEncoder encoder;

  public UsersController(UserRepository users, PasswordEncoder encoder) {
    this.users = users;
    this.encoder = encoder;
  }

  @GetMapping
  public List<User> list() {
    return users.findAll();
  }

  @PostMapping
  public IdResponse create(@Valid @RequestBody RegisterRequest req) {
    User u = new User();
    u.setUsername(req.getUsername());
    u.setPassword(encoder.encode(req.getPassword()));
    u.setEmail(req.getEmail());
    u = users.save(u);
    return new IdResponse(u.getId());
  }
}
