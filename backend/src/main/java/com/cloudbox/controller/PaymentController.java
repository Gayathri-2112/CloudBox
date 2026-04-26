package com.cloudbox.controller;

import com.cloudbox.model.Payment;
import com.cloudbox.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // Create Razorpay order
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestBody Map<String, String> body,
            Authentication auth) throws Exception {
        String plan = body.get("plan");
        return ResponseEntity.ok(paymentService.createOrder(auth.getName(), plan));
    }

    // Verify payment and activate plan
    @PostMapping("/verify")
    public ResponseEntity<String> verify(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        paymentService.verifyAndActivate(
                body.get("razorpay_order_id"),
                body.get("razorpay_payment_id"),
                body.get("razorpay_signature"),
                auth.getName());
        return ResponseEntity.ok("Plan activated");
    }

    // Get payment history
    @GetMapping("/history")
    public ResponseEntity<List<Payment>> history(Authentication auth) {
        return ResponseEntity.ok(paymentService.getUserPayments(auth.getName()));
    }

    // Public endpoint — no auth required, used by landing page
    @GetMapping("/plans")
    public ResponseEntity<List<com.cloudbox.model.PlanConfig>> getPublicPlans() {
        return ResponseEntity.ok(paymentService.getAllPlanConfigs());
    }
}
