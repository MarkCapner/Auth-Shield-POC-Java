package com.authshield.server.repo;

import com.authshield.server.model.AdminSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminSettingRepository extends JpaRepository<AdminSetting, String> {
  Optional<AdminSetting> findBySettingKey(String settingKey);
}
