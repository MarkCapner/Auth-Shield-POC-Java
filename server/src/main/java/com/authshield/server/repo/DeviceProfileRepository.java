package com.authshield.server.repo;

import com.authshield.server.model.DeviceProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeviceProfileRepository extends JpaRepository<DeviceProfile, String> {
  Optional<DeviceProfile> findByFingerprint(String fingerprint);
  List<DeviceProfile> findByUserIdOrderByLastSeenDesc(String userId);
}
