package com.cloudbox.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendSimple(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
        } catch (Exception e) {
            // log but don't crash the app if mail fails
            System.err.println("Email send failed: " + e.getMessage());
        }
    }

    public void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("HTML email send failed: " + e.getMessage());
        }
    }

    // ── Specific email templates ──

    public void sendWelcome(String to, String name) {
        sendHtml(to, "Welcome to CloudBox!",
            "<h2>Welcome, " + name + "!</h2>" +
            "<p>Your CloudBox account is ready. You have <strong>15 GB</strong> of free storage.</p>" +
            "<p><a href='" + frontendUrl + "/dashboard' style='background:#4285f4;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;'>Go to Dashboard</a></p>"
        );
    }

    public void sendFileShared(String to, String ownerEmail, String fileName, String permission) {
        sendHtml(to, ownerEmail + " shared a file with you",
            "<h2>A file was shared with you</h2>" +
            "<p><strong>" + ownerEmail + "</strong> shared <strong>" + fileName + "</strong> with you.</p>" +
            "<p>Permission: <strong>" + permission + "</strong></p>" +
            "<p><a href='" + frontendUrl + "/shared-with' style='background:#4285f4;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;'>View Shared Files</a></p>"
        );
    }

    public void sendPaymentSuccess(String to, String name, String plan, long amountPaise) {
        double amount = amountPaise / 100.0;
        sendHtml(to, "Payment Successful — CloudBox " + plan + " Plan",
            "<h2>Payment Confirmed!</h2>" +
            "<p>Hi " + name + ", your payment of <strong>₹" + String.format("%.2f", amount) + "</strong> was successful.</p>" +
            "<p>You are now on the <strong>" + plan + "</strong> plan.</p>" +
            "<p><a href='" + frontendUrl + "/dashboard' style='background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;'>Go to Dashboard</a></p>"
        );
    }

    public void sendPasswordReset(String to, String name) {
        sendHtml(to, "Your CloudBox password was reset",
            "<h2>Password Reset</h2>" +
            "<p>Hi " + name + ", your CloudBox password has been successfully reset.</p>" +
            "<p>If you did not do this, please contact support immediately.</p>"
        );
    }
}
