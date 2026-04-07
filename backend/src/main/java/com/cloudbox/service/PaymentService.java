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

        if (keyId == null || keyId.startsWith("your_") || keyId.isBlank()) {
            throw new RuntimeException("Razorpay API keys not configured. Add razorpay.key.id and razorpay.key.secret to application.properties");
        }

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
            "plan", planName
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
        payment.setStatus("PAID");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Upgrade user plan and storage
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPlan(payment.getPlan());
        user.setStorageLimitMb(PLAN_STORAGE.get(payment.getPlan()));
        userRepository.save(user);

        systemEventService.log(userEmail, "PAYMENT_SUCCESS",
                "Upgraded to " + payment.getPlan() + " plan");

        emailService.sendPaymentSuccess(userEmail, user.getFirstName(),
                payment.getPlan().name(), payment.getAmountPaise());
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
