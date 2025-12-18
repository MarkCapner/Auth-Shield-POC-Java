package com.authshield.server.repo;

import com.authshield.server.model.FlaggedSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlaggedSessionRepository extends JpaRepository<FlaggedSession, String> {
  List<FlaggedSession> findTop200ByOrderByCreatedAtDesc();
}
