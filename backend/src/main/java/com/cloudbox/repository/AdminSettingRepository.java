package com.cloudbox.repository;

import com.cloudbox.model.AdminSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminSettingRepository extends JpaRepository<AdminSetting, Long> {
}
