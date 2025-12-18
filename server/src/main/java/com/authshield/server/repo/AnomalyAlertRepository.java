package com.authshield.server.repo;

import com.authshield.server.model.AnomalyAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnomalyAlertRepository extends JpaRepository<AnomalyAlert, String> {
  List<AnomalyAlert> findTop200ByOrderByCreatedAtDesc();
}
