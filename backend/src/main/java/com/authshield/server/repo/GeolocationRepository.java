package com.authshield.server.repo;

import com.authshield.server.model.Geolocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GeolocationRepository extends JpaRepository<Geolocation, String> {
  Optional<Geolocation> findByIpAddress(String ipAddress);
  Optional<Geolocation> findTopByUserIdOrderByCreatedAtDesc(String userId);
}
