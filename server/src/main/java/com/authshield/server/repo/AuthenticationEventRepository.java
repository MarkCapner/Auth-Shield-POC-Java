package com.authshield.server.repo;

import com.authshield.server.model.AuthenticationEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuthenticationEventRepository extends JpaRepository<AuthenticationEvent, String> {
  List<AuthenticationEvent> findTop200ByOrderByCreatedAtDesc();
}
