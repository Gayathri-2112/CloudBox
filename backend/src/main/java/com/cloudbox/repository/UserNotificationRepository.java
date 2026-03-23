package com.cloudbox.repository;

import com.cloudbox.model.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findTop20ByUserEmailOrderByCreatedAtDesc(String userEmail);

    long countByUserEmailAndIsReadFalse(String userEmail);
}
