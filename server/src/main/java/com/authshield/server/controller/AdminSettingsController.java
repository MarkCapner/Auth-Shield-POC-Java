package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.AdminSetting;
import com.authshield.server.repo.AdminSettingRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/settings")
public class AdminSettingsController {
  private final AdminSettingRepository repo;
  public AdminSettingsController(AdminSettingRepository repo) { this.repo = repo; }

  @GetMapping
  public List<AdminSetting> list() { return repo.findAll(); }

  @GetMapping("/{key}")
  public AdminSetting get(@PathVariable String key) {
    return repo.findBySettingKey(key).orElseThrow();
  }

  @PutMapping("/{key}")
  public IdResponse put(@PathVariable String key, @RequestBody AdminSetting body) {
    AdminSetting s = repo.findBySettingKey(key).orElse(new AdminSetting());
    s.setSettingKey(key);
    s.setValue(body.getValue());
    s = repo.save(s);
    return new IdResponse(s.getId());
  }
}
