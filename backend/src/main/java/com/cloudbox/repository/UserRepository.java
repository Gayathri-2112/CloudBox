package com.cloudbox.repository;

import com.cloudbox.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import com.cloudbox.model.Role;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // ✅ For login
    Optional<User> findByEmail(String email);

    // ✅ Prevent duplicate registration
    boolean existsByEmail(String email);

    // 🔍 Search users (admin)
    List<User> findByEmailContainingIgnoreCase(String email);

    // 🟢 Active users
    List<User> findBySuspendedFalse();

    // 🔴 Suspended users
    List<User> findBySuspendedTrue();

    List<User> findByRole(Role role);
}