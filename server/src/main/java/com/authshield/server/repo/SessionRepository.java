package com.authshield.server.repo;

import com.authshield.server.model.SessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SessionRepository extends JpaRepository<SessionEntity, String> {
  List<SessionEntity> findTop200ByOrderByLastActivityDesc();
  List<SessionEntity> findByUserIdOrderByLastActivityDesc(String userId);
}
