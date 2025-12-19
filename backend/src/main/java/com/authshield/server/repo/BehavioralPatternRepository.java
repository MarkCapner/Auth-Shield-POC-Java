package com.authshield.server.repo;

import com.authshield.server.model.BehavioralPattern;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BehavioralPatternRepository extends JpaRepository<BehavioralPattern, String> {
  List<BehavioralPattern> findByUserIdOrderByCreatedAtDesc(String userId);
}
