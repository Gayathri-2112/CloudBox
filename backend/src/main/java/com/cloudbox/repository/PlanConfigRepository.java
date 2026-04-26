package com.cloudbox.repository;

import com.cloudbox.model.Plan;
import com.cloudbox.model.PlanConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanConfigRepository extends JpaRepository<PlanConfig, Plan> {
}
