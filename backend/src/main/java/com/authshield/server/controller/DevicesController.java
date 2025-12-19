package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.DeviceProfile;
import com.authshield.server.repo.DeviceProfileRepository;
import com.authshield.server.service.DeviceProfileService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
public class DevicesController {

  private final DeviceProfileRepository repo;
  private final DeviceProfileService deviceProfileService;

  public DevicesController(DeviceProfileRepository repo, DeviceProfileService deviceProfileService) {
    this.repo = repo;
    this.deviceProfileService = deviceProfileService;
  }

  @GetMapping
  public List<DeviceProfile> list() {
    return repo.findAll();
  }

  @GetMapping("/{id}")
  public DeviceProfile get(@PathVariable String id) {
    return repo.findById(id).orElseThrow();
  }

    @PostMapping
    public DeviceProfile createOrUpdate(@RequestBody DeviceProfile device) {
        return deviceProfileService.upsert(device);
    }
}
