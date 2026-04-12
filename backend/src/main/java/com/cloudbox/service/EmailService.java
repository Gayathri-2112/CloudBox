package com.cloudbox.service;

import org.springframework.beans.factory.annotation.Value;
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

    // ── Core send ──
    private void send(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(from, "CloudBox");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send to " + to + ": " + e.getMessage());
        }
    }

    // ── Shared layout wrapper ──
    private String wrap(String accentColor, String iconEmoji, String title, String body) {
        return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
            "<title>" + title + "</title></head>" +
            "<body style='margin:0;padding:0;background:#dce8f5;font-family:Manrope,Inter,Arial,sans-serif;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='background:#dce8f5;padding:40px 16px;'>" +
            "<tr><td align='center'>" +
            // Card
            "<table width='560' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:20px;" +
            "box-shadow:0 8px 40px rgba(66,133,244,0.12);overflow:hidden;max-width:100%;'>" +
            // Header bar
            "<tr><td style='background:linear-gradient(135deg,#1b59e1,#4285f4);padding:32px 40px;text-align:center;'>" +
            "<div style='font-size:36px;margin-bottom:10px;'>" + iconEmoji + "</div>" +
            "<div style='color:#fff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:0.75;margin-bottom:6px;'>CloudBox</div>" +
            "<div style='color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;'>" + title + "</div>" +
            "</td></tr>" +
            // Body
            "<tr><td style='padding:36px 40px;color:#1a2236;'>" + body + "</td></tr>" +
            // Footer
            "<tr><td style='background:#f5f8ff;padding:20px 40px;text-align:center;border-top:1px solid #e8f0fe;'>" +
            "<p style='margin:0;font-size:12px;color:#9baabf;'>You received this email because you have a CloudBox account.<br>" +
            "© 2026 CloudBox. All rights reserved.</p>" +
            "</td></tr>" +
            "</table>" +
            "</td></tr></table></body></html>";
    }

    private String btn(String url, String label, String color) {
        return "<div style='text-align:center;margin:28px 0;'>" +
            "<a href='" + url + "' style='display:inline-block;background:" + color + ";color:#fff;" +
            "text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;" +
            "letter-spacing:-0.2px;box-shadow:0 4px 16px rgba(66,133,244,0.3);'>" + label + "</a></div>";
    }

    private String fileBox(String fileName, String fileSize, String permission) {
        String permColor = "EDIT".equals(permission) ? "#b45309" : "DOWNLOAD".equals(permission) ? "#16a34a" : "#4285f4";
        String permBg    = "EDIT".equals(permission) ? "#fef9c3" : "DOWNLOAD".equals(permission) ? "#dcfce7" : "#e8f0fe";
        return "<div style='background:#f5f8ff;border:1.5px solid #d0daea;border-radius:12px;padding:16px 20px;" +
            "margin:20px 0;display:flex;align-items:center;gap:14px;'>" +
            "<div style='font-size:28px;'>📄</div>" +
            "<div style='flex:1;'>" +
            "<div style='font-size:15px;font-weight:700;color:#1a2236;'>" + fileName + "</div>" +
            (fileSize != null ? "<div style='font-size:12px;color:#9baabf;margin-top:2px;'>" + fileSize + "</div>" : "") +
            "</div>" +
                (permission != null ?
                        "<span style='display:inline-block;background:" + permBg + ";color:" + permColor + ";" +
                                "font-size:11px;font-weight:700;" +
                                "padding:0 12px;height:22px;line-height:22px;" +
                                "border-radius:20px;'>" + permission + "</span>"
                        : "")+
            "</div>";
    }

    private String divider() {
        return "<hr style='border:none;border-top:1px solid #eef2f9;margin:24px 0;'/>";
    }

    private String p(String text) {
        return "<p style='margin:0 0 14px;font-size:15px;line-height:1.65;color:#374151;'>" + text + "</p>";
    }

    private String h(String text) {
        return "<h2 style='margin:0 0 16px;font-size:18px;font-weight:700;color:#1a2236;'>" + text + "</h2>";
    }

    // ══════════════════════════════════════
    // 1. WELCOME EMAIL
    // ══════════════════════════════════════
    public void sendWelcome(String to, String name) {
        String body =
            h("Welcome to CloudBox, " + name + "! 🎉") +
            p("Your account is ready. You start with <strong>15 GB of free storage</strong> — enough to store thousands of documents, photos, and files.") +
            divider() +
            "<table width='100%' cellpadding='0' cellspacing='0'>" +
            "<tr>" +
            featureCell("📁", "Upload Files", "Any file type up to 50 MB") +
            featureCell("🔗", "Share Links", "Share with anyone, even without an account") +
            featureCell("✏️", "Collaborate", "Edit and comment on shared files") +
            "</tr></table>" +
            divider() +
            btn(frontendUrl + "/dashboard", "Go to Dashboard →", "#4285f4") +
            p("<small style='color:#9baabf;'>Need more storage? Upgrade to Pro (100 GB) or Enterprise (1 TB) anytime.</small>");

        send(to, "Welcome to CloudBox — Your storage is ready", wrap("#4285f4", "☁️", "Welcome aboard!", body));
    }

    private String featureCell(String icon, String title, String desc) {
        return "<td style='padding:8px;text-align:center;vertical-align:top;width:33%;'>" +
            "<div style='font-size:24px;margin-bottom:6px;'>" + icon + "</div>" +
            "<div style='font-size:13px;font-weight:700;color:#1a2236;margin-bottom:3px;'>" + title + "</div>" +
            "<div style='font-size:12px;color:#9baabf;'>" + desc + "</div>" +
            "</td>";
    }

    // ══════════════════════════════════════
    // 2. FILE UPLOADED
    // ══════════════════════════════════════
    public void sendFileUploaded(String to, String name, String fileName, String fileSize, String folder) {
        String body =
            h("File uploaded successfully") +
            p("Hi <strong>" + name + "</strong>, your file has been securely stored in CloudBox.") +
            fileBox(fileName, fileSize, null) +
            "<table width='100%' cellpadding='0' cellspacing='0' style='margin:16px 0;'>" +
            "<tr>" +
            infoCell("📂 Folder", folder != null ? folder : "root") +
            infoCell("📦 Size", fileSize != null ? fileSize : "—") +
            "</tr></table>" +
            divider() +
            btn(frontendUrl + "/files", "View My Files →", "#4285f4") +
            p("<small style='color:#9baabf;'>You can share, move, rename, or delete this file from your dashboard.</small>");

        send(to, "File uploaded: " + fileName, wrap("#4285f4", "📤", "Upload Successful", body));
    }

    private String infoCell(String label, String value) {
        return "<td style='padding:10px 12px;background:#f5f8ff;border-radius:8px;margin:4px;width:48%;'>" +
            "<div style='font-size:11px;color:#9baabf;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;'>" + label + "</div>" +
            "<div style='font-size:14px;font-weight:700;color:#1a2236;margin-top:3px;'>" + value + "</div>" +
            "</td>";
    }

    // ══════════════════════════════════════
    // 3. FILE SHARED — sent to recipient
    // ══════════════════════════════════════
    public void sendFileShared(String to, String ownerEmail, String fileName, String permission) {
        String accessUrl = frontendUrl + "/shared-with";
        String permLabel = "EDIT".equals(permission) ? "View &amp; Edit" :
                           "DOWNLOAD".equals(permission) ? "View &amp; Download" : "View only";

        String body =
            h("A file has been shared with you") +
            p("<strong>" + ownerEmail + "</strong> shared a file with you on CloudBox.") +
            fileBox(fileName, null, permission) +
            "<div style='background:#eff6ff;border-left:4px solid #4285f4;border-radius:0 8px 8px 0;" +
            "padding:14px 18px;margin:16px 0;'>" +
            "<div style='font-size:13px;font-weight:700;color:#1a2236;margin-bottom:4px;'>Your access level</div>" +
            "<div style='font-size:14px;color:#4285f4;font-weight:600;'>" + permLabel + "</div>" +
            "</div>" +
            divider() +
            btn(accessUrl, "Open Shared File →", "#4285f4") +
            p("<small style='color:#9baabf;'>You need a CloudBox account to access this file. " +
              "<a href='" + frontendUrl + "/register' style='color:#4285f4;'>Create one free</a> if you don't have one.</small>");

        send(to, ownerEmail + " shared \"" + fileName + "\" with you",
             wrap("#4285f4", "📨", "File Shared With You", body));
    }

    // ══════════════════════════════════════
    // 4. FILE SHARED — confirmation to owner
    // ══════════════════════════════════════
    public void sendShareConfirmation(String to, String ownerName, String fileName, String sharedWith, String permission) {
        String body =
            h("Share confirmed") +
            p("Hi <strong>" + ownerName + "</strong>, your file was successfully shared.") +
            fileBox(fileName, null, permission) +
            "<table width='100%' cellpadding='0' cellspacing='0' style='margin:16px 0;'>" +
            "<tr>" +
            infoCell("👤 Shared with", sharedWith) +
            infoCell("🔑 Permission", permission) +
            "</tr></table>" +
            divider() +
            btn(frontendUrl + "/shared-by", "Manage Shared Files →", "#16a34a") +
            p("<small style='color:#9baabf;'>You can revoke access at any time from the Shared By Me page.</small>");

        send(to, "You shared \"" + fileName + "\" with " + sharedWith,
             wrap("#16a34a", "✅", "File Shared", body));
    }

    // ══════════════════════════════════════
    // 5. PAYMENT SUCCESS
    // ══════════════════════════════════════
    public void sendPaymentSuccess(String to, String name, String plan, long amountPaise) {
        double amount = amountPaise / 100.0;
        String storageLabel = "PRO".equals(plan) ? "100 GB" : "ENTERPRISE".equals(plan) ? "1 TB" : "15 GB";

        String body =
            h("Payment confirmed — " + plan + " Plan") +
            p("Hi <strong>" + name + "</strong>, your payment was successful and your plan has been upgraded.") +
            "<div style='background:linear-gradient(135deg,#1b59e1,#4285f4);border-radius:14px;padding:24px;margin:20px 0;text-align:center;'>" +
            "<div style='color:rgba(255,255,255,0.75);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;'>Amount Paid</div>" +
            "<div style='color:#fff;font-size:36px;font-weight:900;letter-spacing:-1px;'>₹" + String.format("%.2f", amount) + "</div>" +
            "<div style='color:rgba(255,255,255,0.75);font-size:13px;margin-top:6px;'>" + plan + " Plan · " + storageLabel + " Storage</div>" +
            "</div>" +
            divider() +
            btn(frontendUrl + "/dashboard", "Go to Dashboard →", "#4285f4") +
            p("<small style='color:#9baabf;'>Your storage has been upgraded immediately. Thank you for choosing CloudBox!</small>");

        send(to, "Payment confirmed — CloudBox " + plan + " Plan",
             wrap("#4285f4", "💳", "Payment Successful", body));
    }

    // ══════════════════════════════════════
    // 6. SHARE PUBLIC LINK
    // ══════════════════════════════════════
    public void sendPublicLink(String to, String senderEmail, String fileName, String linkUrl, String permission) {
        String permLabel = "EDIT".equals(permission) ? "View &amp; Edit" :
                           "DOWNLOAD".equals(permission) ? "View &amp; Download" : "View only";
        String body =
            h("Someone shared a file link with you") +
            p("<strong>" + senderEmail + "</strong> shared a file with you via CloudBox.") +
            fileBox(fileName, null, permission) +
            "<div style='background:#eff6ff;border-left:4px solid #4285f4;border-radius:0 8px 8px 0;" +
            "padding:14px 18px;margin:16px 0;'>" +
            "<div style='font-size:13px;font-weight:700;color:#1a2236;margin-bottom:4px;'>Access level</div>" +
            "<div style='font-size:14px;color:#4285f4;font-weight:600;'>" + permLabel + "</div>" +
            "</div>" +
            divider() +
            btn(linkUrl, "Open File →", "#4285f4") +
            p("<small style='color:#9baabf;'>No account required — just click the link above to access the file.</small>");

        send(to, senderEmail + " shared \"" + fileName + "\" with you",
             wrap("#4285f4", "🔗", "File Link Shared", body));
    }

    // ══════════════════════════════════════
    // 7. PASSWORD RESET
    // ══════════════════════════════════════
    public void sendPasswordReset(String to, String name) {
        String body =
            h("Your password was reset") +
            p("Hi <strong>" + name + "</strong>, your CloudBox password has been successfully changed.") +
            "<div style='background:#fef9c3;border:1.5px solid #fde68a;border-radius:10px;padding:14px 18px;margin:16px 0;'>" +
            "<div style='font-size:14px;color:#b45309;font-weight:600;'>⚠️ Didn't do this?</div>" +
            "<div style='font-size:13px;color:#92400e;margin-top:4px;'>If you didn't reset your password, contact support immediately. Your account may be compromised.</div>" +
            "</div>" +
            divider() +
            btn(frontendUrl + "/login", "Sign In →", "#4285f4");

        send(to, "Your CloudBox password was changed",
             wrap("#f59e0b", "🔐", "Password Changed", body));
    }
}
