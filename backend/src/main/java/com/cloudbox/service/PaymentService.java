package com.cloudbox.service;

import com.cloudbox.model.Payment;
import com.cloudbox.model.Plan;
import com.cloudbox.model.User;
import com.cloudbox.repository.PaymentRepository;
import com.cloudbox.repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SystemEventService systemEventService;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    // Plan prices in paise (INR)
    private static final Map<Plan, Long> PLAN_PRICES = Map.of(
        Plan.FREE,       0L,
        Plan.PRO,        49900L,   // ₹499/month
        Plan.ENTERPRISE, 199900L   // ₹1999/month
    );

    // Plan storage limits in MB
    private static final Map<Plan, Long> PLAN_STORAGE = Map.of(
        Plan.FREE,       15360L,    // 15 GB
        Plan.PRO,        102400L,   // 100 GB
        Plan.ENTERPRISE, 1048576L   // 1 TB
    );

    public PaymentService(PaymentRepository paymentRepository, UserRepository userRepository,
                          EmailService emailService, SystemEventService systemEventService) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.systemEventService = systemEventService;
    }

    public Map<String, Object> createOrder(String userEmail, String planName) throws RazorpayException {
        Plan plan = Plan.valueOf(planName.toUpperCase());
        long amount = PLAN_PRICES.get(plan);

        if (amount == 0) throw new RuntimeException("FREE plan requires no payment");

        if (keyId == null || keyId.isBlank() || keyId.startsWith("your_")) {
            throw new RuntimeException("Razorpay API keys not configured.");
        }

        // ── Simulated mode for test/dev (no real Razorpay call) ──
        if (keyId.startsWith("rzp_test_")) {
            String fakeOrderId = "order_sim_" + System.currentTimeMillis();
            String fakePaymentId = "pay_sim_" + System.currentTimeMillis();

            Payment payment = new Payment();
            payment.setUserEmail(userEmail);
            payment.setRazorpayOrderId(fakeOrderId);
            payment.setRazorpayPaymentId(fakePaymentId);
            payment.setRazorpaySignature("simulated");
            payment.setPlan(plan);
            payment.setAmountPaise(amount);
            payment.setStatus("PENDING_APPROVAL");
            payment.setCreatedAt(LocalDateTime.now());
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);

            systemEventService.log(userEmail, "PAYMENT_PENDING",
                    "Simulated payment for " + plan + " plan — awaiting admin approval");
            systemEventService.notifyAdmins("Payment Pending Approval",
                    userEmail + " requested " + plan + " plan — please review and approve");

            return Map.of(
                "orderId", fakeOrderId,
                "amount", amount,
                "currency", "INR",
                "keyId", keyId,
                "plan", planName,
                "simulated", true
            );
        }

        // ── Real Razorpay flow ──
        RazorpayClient client = new RazorpayClient(keyId, keySecret);
        JSONObject opts = new JSONObject();
        opts.put("amount", amount);
        opts.put("currency", "INR");
        opts.put("receipt", "rcpt_" + System.currentTimeMillis());

        Order order = client.orders.create(opts);
        String orderId = order.get("id");

        Payment payment = new Payment();
        payment.setUserEmail(userEmail);
        payment.setRazorpayOrderId(orderId);
        payment.setPlan(plan);
        payment.setAmountPaise(amount);
        payment.setStatus("CREATED");
        payment.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        return Map.of(
            "orderId", orderId,
            "amount", amount,
            "currency", "INR",
            "keyId", keyId,
            "plan", planName,
            "simulated", false
        );
    }

    public void verifyAndActivate(String orderId, String paymentId, String signature, String userEmail) {
        // Verify HMAC-SHA256 signature
        String payload = orderId + "|" + paymentId;
        if (!verifySignature(payload, signature)) {
            throw new RuntimeException("Payment signature verification failed");
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!payment.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        payment.setRazorpayPaymentId(paymentId);
        payment.setRazorpaySignature(signature);
        payment.setStatus("PENDING_APPROVAL");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Notify admins to review
        systemEventService.log(userEmail, "PAYMENT_PENDING",
                "Payment received for " + payment.getPlan() + " plan — awaiting admin approval");
        systemEventService.notifyAdmins("Payment Pending Approval",
                userEmail + " paid for " + payment.getPlan() + " plan — please review and approve");
    }

    public List<Payment> getPendingPayments() {
        return paymentRepository.findByStatusOrderByCreatedAtDesc("PENDING_APPROVAL");
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc();
    }

    public void approvePayment(Long paymentId, String adminEmail) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        if (!"PENDING_APPROVAL".equals(payment.getStatus()))
            throw new RuntimeException("Payment is not pending approval");

        payment.setStatus("APPROVED");
        paymentRepository.save(payment);

        // Upgrade user plan and storage
        User user = userRepository.findByEmail(payment.getUserEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPlan(payment.getPlan());
        user.setStorageLimitMb(PLAN_STORAGE.get(payment.getPlan()));
        userRepository.save(user);

        systemEventService.log(adminEmail, "APPROVE_PAYMENT",
                "Approved " + payment.getPlan() + " plan for " + payment.getUserEmail());
        systemEventService.notifyAdmins("Payment Approved",
                adminEmail + " approved " + payment.getPlan() + " for " + payment.getUserEmail());
        systemEventService.notifyUser(payment.getUserEmail(), "Plan Activated",
                "Your " + payment.getPlan() + " plan has been activated by admin.");

        emailService.sendPaymentSuccess(payment.getUserEmail(), user.getFirstName(),
                payment.getPlan().name(), payment.getAmountPaise());
    }

    public void rejectPayment(Long paymentId, String adminEmail) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        if (!"PENDING_APPROVAL".equals(payment.getStatus()))
            throw new RuntimeException("Payment is not pending approval");

        payment.setStatus("REJECTED");
        paymentRepository.save(payment);

        systemEventService.log(adminEmail, "REJECT_PAYMENT",
                "Rejected payment for " + payment.getPlan() + " plan from " + payment.getUserEmail());
        systemEventService.notifyUser(payment.getUserEmail(), "Payment Rejected",
                "Your payment for " + payment.getPlan() + " plan was rejected. Please contact support.");
    }

    public List<Payment> getUserPayments(String userEmail) {
        return paymentRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
    }

    private boolean verifySignature(String payload, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computed = HexFormat.of().formatHex(hash);
            return computed.equals(signature);
        } catch (Exception e) {
            return false;
        }
    }
}
