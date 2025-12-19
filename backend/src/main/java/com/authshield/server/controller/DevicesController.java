package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.DeviceProfile;
import com.authshield.server.repo.DeviceProfileRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
public class DevicesController {

  private final DeviceProfileRepository repo;

  public DevicesController(DeviceProfileRepository repo) {
    this.repo = repo;
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
  public IdResponse create(@RequestBody DeviceProfile body) {
    DeviceProfile saved = repo.save(body);
    return new IdResponse(saved.getId());
  }
}
