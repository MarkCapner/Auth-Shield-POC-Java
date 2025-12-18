package com.authshield.server.repo;

import com.authshield.server.model.TlsFingerprint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TlsFingerprintRepository extends JpaRepository<TlsFingerprint, String> {
  List<TlsFingerprint> findByUserIdOrderByLastSeenDesc(String userId);
  List<TlsFingerprint> findTop500ByOrderByCreatedAtDesc();
}
