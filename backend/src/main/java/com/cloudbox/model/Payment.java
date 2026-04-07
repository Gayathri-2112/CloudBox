package com.cloudbox.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;

    @Enumerated(EnumType.STRING)
    private Plan plan;

    private Long amountPaise; // amount in paise (INR smallest unit)
    private String status;    // CREATED, PAID, FAILED
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    public Long getId() { return id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String e) { this.userEmail = e; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String s) { this.razorpayOrderId = s; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String s) { this.razorpayPaymentId = s; }
    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String s) { this.razorpaySignature = s; }
    public Plan getPlan() { return plan; }
    public void setPlan(Plan p) { this.plan = p; }
    public Long getAmountPaise() { return amountPaise; }
    public void setAmountPaise(Long a) { this.amountPaise = a; }
    public String getStatus() { return status; }
    public void setStatus(String s) { this.status = s; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime t) { this.paidAt = t; }
}
