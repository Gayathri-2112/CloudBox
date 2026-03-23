package com.cloudbox.repository;

import com.cloudbox.model.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {

    List<SystemLog> findAllByOrderByCreatedAtDesc();

    List<SystemLog> findByUserEmailOrderByCreatedAtDesc(String userEmail);
}
