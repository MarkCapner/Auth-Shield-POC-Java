package com.authshield.server.repo;

import com.authshield.server.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
  List<AuditLog> findTop500ByOrderByCreatedAtDesc();
}
