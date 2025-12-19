package com.authshield.server.repo;

import com.authshield.server.model.IpReputation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IpReputationRepository extends JpaRepository<IpReputation, String> {
  Optional<IpReputation> findByIpAddress(String ipAddress);
  List<IpReputation> findByBlacklistedTrueOrderByLastUpdatedDesc();
}
