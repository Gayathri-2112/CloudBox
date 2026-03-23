package com.cloudbox.repository;

import com.cloudbox.model.AdminNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminNotificationRepository extends JpaRepository<AdminNotification, Long> {

    List<AdminNotification> findTop20ByOrderByCreatedAtDesc();
}
