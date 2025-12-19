package com.authshield.server.repo;

import com.authshield.server.model.TlsFingerprint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TlsFingerprintRepository extends JpaRepository<TlsFingerprint, String> {
  List<TlsFingerprint> findByUserIdOrderByLastSeenDesc(String userId);
  /**
   * Used for rarity calculations. The TLS fingerprints table tracks first/last seen rather than a
   * separate createdAt column, so order by lastSeen.
   */
  List<TlsFingerprint> findTop500ByOrderByLastSeenDesc();
}
