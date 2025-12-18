package com.authshield.server.repo;

import com.authshield.server.model.RiskScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RiskScoreRepository extends JpaRepository<RiskScore, String> {
  List<RiskScore> findTop200ByOrderByCreatedAtDesc();
  List<RiskScore> findByUserIdOrderByCreatedAtDesc(String userId);
}
