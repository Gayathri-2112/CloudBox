package com.cloudbox.repository;

import com.cloudbox.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRazorpayOrderId(String orderId);
    List<Payment> findByUserEmailOrderByCreatedAtDesc(String email);
    List<Payment> findByStatusOrderByCreatedAtDesc(String status);
    List<Payment> findAllByOrderByCreatedAtDesc();
}
