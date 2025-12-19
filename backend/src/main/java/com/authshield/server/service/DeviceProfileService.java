package com.authshield.server.service;

import com.authshield.server.model.DeviceProfile;
import com.authshield.server.repo.DeviceProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
public class DeviceProfileService {

    private final DeviceProfileRepository repo;

    public DeviceProfileService(DeviceProfileRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public DeviceProfile upsert(DeviceProfile incoming) {
        return repo.findByFingerprint(incoming.getFingerprint())
                .map(existing -> {
                    // update evolving fields
                    existing.setLastSeen(OffsetDateTime.now());
                    existing.setSeenCount(existing.getSeenCount() + 1);

                    existing.setUserAgent(incoming.getUserAgent());
                    existing.setScreenResolution(incoming.getScreenResolution());
                    existing.setTimezone(incoming.getTimezone());
                    existing.setPlatform(incoming.getPlatform());

                    // trust should evolve, not reset
                    if (incoming.getTrustScore() != null) {
                        existing.setTrustScore(
                                Math.max(existing.getTrustScore(), incoming.getTrustScore())
                        );
                    }

                    return existing;
                })
                .orElseGet(() -> {
                    incoming.setFirstSeen(OffsetDateTime.now());
                    incoming.setLastSeen(OffsetDateTime.now());
                    incoming.setSeenCount(1);
                    return incoming;
                });
    }
}
