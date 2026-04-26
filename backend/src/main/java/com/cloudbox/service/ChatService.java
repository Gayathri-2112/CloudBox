package com.cloudbox.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.cloudbox.model.FileEntity;
import com.cloudbox.model.FileShare;
import com.cloudbox.model.PlanConfig;
import com.cloudbox.model.Role;
import com.cloudbox.model.SystemLog;
import com.cloudbox.repository.FileRepository;
import com.cloudbox.repository.FileShareRepository;
import com.cloudbox.repository.PaymentRepository;
import com.cloudbox.repository.SystemLogRepository;
import com.cloudbox.repository.UserRepository;

@Service
public class ChatService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileShareRepository fileShareRepository;
    private final SystemLogRepository systemLogRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final RestTemplate restTemplate = new RestTemplate();
    private volatile long lastRequestTime = 0;

    @Value("${openai.api.key:}")
    private String openAiKey;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    public ChatService(FileRepository fileRepository, UserRepository userRepository,
            FileShareRepository fileShareRepository, SystemLogRepository systemLogRepository,
            PaymentRepository paymentRepository, PaymentService paymentService) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.fileShareRepository = fileShareRepository;
        this.systemLogRepository = systemLogRepository;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
    }

    // ── Landing page ──────────────────────────────────────────────────────────
    public String chatLanding(String userMessage) {
        String landingSystem = buildLandingSystemPrompt();
        if (isNoKey()) return fallbackLanding(userMessage);
        String result = callOpenAI(landingSystem, userMessage);
        return result != null ? result : fallbackLanding(userMessage);
    }

    private String buildLandingSystemPrompt() {
        List<PlanConfig> configs = paymentService.getAllPlanConfigs();
        String planInfo = configs.stream().map(c -> {
            String price = c.getPricePaise() == 0 ? "Free" : "₹" + (c.getPricePaise() / 100) + "/month";
            return c.getPlan().name() + ": " + formatStorageMb(c.getStorageMb()) + " (" + price + ")";
        }).collect(Collectors.joining(", "));
        return "You are CloudBox Assistant, a helpful chatbot for the CloudBox cloud storage platform.\n"
                + "Current plans: " + planInfo + ".\n"
                + "Features: upload up to 50MB, share with View/Download/Edit permissions, public links, collaboration, folders, trash/restore.\n"
                + "Keep answers short (2-4 sentences). Be friendly.";
    }

    // ── User Dashboard ────────────────────────────────────────────────────────
    public String chatDashboard(String userMessage, String userEmail) {
        UserData d = buildUserData(userEmail);
        if (isNoKey()) return answerFromData(userMessage, d);
        String prompt = "You are CloudBox Assistant. Answer using the user's real data. Be concise.\n\n" + d.toContext();
        String result = callOpenAI(prompt, userMessage);
        return result != null ? result : answerFromData(userMessage, d);
    }

    // ── Admin Dashboard ───────────────────────────────────────────────────────
    public String chatAdmin(String userMessage) {
        String context = buildAdminContext();
        if (isNoKey()) return answerAdminFallback(userMessage, context);
        String prompt = "You are CloudBox Admin Assistant. Help the admin understand platform statistics. "
                + "Answer based on the real platform data below. Be concise.\n\n" + context;
        String result = callOpenAI(prompt, userMessage);
        return result != null ? result : answerAdminFallback(userMessage, context);
    }

    private String buildAdminContext() {
        long totalUsers = userRepository.countByRole(Role.USER);
        long suspendedUsers = userRepository.findBySuspendedTrue().size();
        long totalFiles = fileRepository.count();
        long pendingPayments = paymentRepository.countByStatus("PENDING_APPROVAL");
        long approvedPayments = paymentRepository.countByStatus("APPROVED");
        long rejectedPayments = paymentRepository.countByStatus("REJECTED");
        long refundedPayments = paymentRepository.countByStatus("REFUNDED");
        long totalRevenuePaise = paymentRepository.sumApprovedAmountPaise();
        long totalRefundedPaise = paymentRepository.sumRefundedAmountPaise();

        String planInfo = paymentService.getAllPlanConfigs().stream().map(c -> {
            String price = c.getPricePaise() == 0 ? "Free" : "₹" + (c.getPricePaise() / 100) + "/mo";
            return c.getPlan().name() + "=" + formatStorageMb(c.getStorageMb()) + "@" + price;
        }).collect(Collectors.joining(", "));

        return String.format(
            "Platform Stats: TotalUsers=%d, Suspended=%d, TotalFiles=%d\n"
            + "Payments: Pending=%d, Approved=%d, Rejected=%d, Refunded=%d\n"
            + "Revenue: TotalReceived=₹%.0f, TotalRefunded=₹%.0f, Net=₹%.0f\n"
            + "Plans: %s",
            totalUsers, suspendedUsers, totalFiles,
            pendingPayments, approvedPayments, rejectedPayments, refundedPayments,
            totalRevenuePaise / 100.0, totalRefundedPaise / 100.0,
            (totalRevenuePaise - totalRefundedPaise) / 100.0, planInfo);
    }

    private String answerAdminFallback(String msg, String context) {
        String m = msg.toLowerCase();

        // Parse values from context for clean responses
        long totalUsers = userRepository.countByRole(Role.USER);
        long suspendedUsers = userRepository.findBySuspendedTrue().size();
        long activeUsers = totalUsers - suspendedUsers;
        long totalFiles = fileRepository.count();
        long pendingPayments = paymentRepository.countByStatus("PENDING_APPROVAL");
        long approvedPayments = paymentRepository.countByStatus("APPROVED");
        long rejectedPayments = paymentRepository.countByStatus("REJECTED");
        long refundedPayments = paymentRepository.countByStatus("REFUNDED");
        long totalRevenuePaise = paymentRepository.sumApprovedAmountPaise();
        long totalRefundedPaise = paymentRepository.sumRefundedAmountPaise();
        long netRevenuePaise = totalRevenuePaise - totalRefundedPaise;

        if (m.contains("user") && (m.contains("how many") || m.contains("total") || m.contains("count") || m.contains("number")))
            return String.format("There are %d registered users — %d active and %d suspended.", totalUsers, activeUsers, suspendedUsers);
        if (m.contains("suspend"))
            return suspendedUsers == 0 ? "No users are currently suspended."
                    : String.format("%d user%s currently suspended.", suspendedUsers, suspendedUsers != 1 ? "s are" : " is");
        if (m.contains("revenue") || m.contains("earning") || m.contains("money") || m.contains("income"))
            return String.format("Total received: ₹%.0f | Refunded: ₹%.0f | Net revenue: ₹%.0f.",
                    totalRevenuePaise / 100.0, totalRefundedPaise / 100.0, netRevenuePaise / 100.0);
        if (m.contains("pending") || m.contains("approval"))
            return pendingPayments == 0 ? "No payments are pending approval."
                    : String.format("%d payment%s pending approval.", pendingPayments, pendingPayments != 1 ? "s are" : " is");
        if (m.contains("payment") || m.contains("transaction"))
            return String.format("Payments — Approved: %d, Pending: %d, Rejected: %d, Refunded: %d.",
                    approvedPayments, pendingPayments, rejectedPayments, refundedPayments);
        if (m.contains("refund") || m.contains("cancel"))
            return String.format("%d payment%s refunded, totalling ₹%.0f.",
                    refundedPayments, refundedPayments != 1 ? "s" : "", totalRefundedPaise / 100.0);
        if (m.contains("file") && (m.contains("how many") || m.contains("total") || m.contains("count")))
            return String.format("There are %d files stored on the platform.", totalFiles);
        if (m.contains("plan") || m.contains("price") || m.contains("pricing")) {
            String planInfo = paymentService.getAllPlanConfigs().stream().map(c -> {
                String price = c.getPricePaise() == 0 ? "Free" : "₹" + (c.getPricePaise() / 100) + "/mo";
                return c.getPlan().name() + ": " + formatStorageMb(c.getStorageMb()) + " @ " + price;
            }).collect(Collectors.joining(" | "));
            return "Current plans — " + planInfo + ".";
        }
        if (m.contains("overview") || m.contains("summary") || m.contains("stats") || m.contains("dashboard"))
            return String.format("Platform overview: %d users (%d active), %d files, %d pending payments, net revenue ₹%.0f.",
                    totalUsers, activeUsers, totalFiles, pendingPayments, netRevenuePaise / 100.0);
        if (m.contains("hello") || m.contains("hi"))
            return "Hi Admin! Ask me about users, payments, revenue, files, or plan configs.";
        return String.format("Platform has %d users, %d files, %d pending payments. Ask about users, revenue, payments, or plans.",
                totalUsers, totalFiles, pendingPayments);
    }

    // ── User data record ──────────────────────────────────────────────────────
    private record UserData(
            String email, String plan, long limitMb,
            long totalFiles, long totalBytes, long trashedFiles,
            long images, long docs, long videos, long audio, long others,
            List<String> recentFiles, Set<String> folders,
            List<FileShare> sharedByMe, List<FileShare> sharedWithMe,
            List<SystemLog> recentActivity) {
        String toContext() {
            double usedMb = totalBytes / (1024.0 * 1024);
            double pct = limitMb > 0 ? usedMb * 100.0 / limitMb : 0;
            return String.format(
                    "User:%s Plan:%s Storage:%.1fMB/%dMB(%.1f%%) Files:%d Trash:%d "
                    + "Images:%d Docs:%d Videos:%d Audio:%d Folders:%s Recent:%s SharedByMe:%d SharedWithMe:%d",
                    email, plan, usedMb, limitMb, pct, totalFiles, trashedFiles,
                    images, docs, videos, audio,
                    folders.isEmpty() ? "root" : String.join(",", folders),
                    recentFiles.isEmpty() ? "none" : String.join(",", recentFiles),
                    sharedByMe.size(), sharedWithMe.size());
        }
    }

    private UserData buildUserData(String email) {
        List<FileEntity> files = fileRepository.findByOwnerEmailAndDeletedFalse(email);
        long totalBytes = files.stream().mapToLong(f -> f.getSize() != null ? f.getSize() : 0).sum();
        long trashedFiles = fileRepository.findByOwnerEmailAndDeletedTrue(email).size();
        long images = count(files, "jpg|jpeg|png|gif|webp|svg");
        long docs = count(files, "pdf|doc|docx|txt|xls|xlsx|ppt|pptx|csv");
        long videos = count(files, "mp4|mkv|avi|mov|webm");
        long audio = count(files, "mp3|wav|ogg|flac");

        List<String> recentFiles = files.stream()
                .filter(f -> f.getUploadDate() != null)
                .sorted((a, b) -> b.getUploadDate().compareTo(a.getUploadDate()))
                .limit(5).map(FileEntity::getFileName).toList();
        Set<String> folders = files.stream()
                .map(FileEntity::getFolder).filter(Objects::nonNull).collect(Collectors.toSet());

        var user = userRepository.findByEmail(email).orElse(null);
        long limitMb = (user != null && user.getStorageLimitMb() != null) ? user.getStorageLimitMb() : 15360L;
        String plan = (user != null && user.getPlan() != null) ? user.getPlan().name() : "FREE";

        List<FileShare> sharedByMe = fileShareRepository.findByOwnerEmailOrderByCreatedAtDesc(email);
        List<FileShare> sharedWithMe = fileShareRepository.findBySharedWithOrderByCreatedAtDesc(email);
        List<SystemLog> activity = systemLogRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream().limit(10).toList();

        return new UserData(email, plan, limitMb, files.size(), totalBytes, trashedFiles,
                images, docs, videos, audio, 0, recentFiles, folders, sharedByMe, sharedWithMe, activity);
    }

    private long count(List<FileEntity> files, String ext) {
        return files.stream().filter(f -> f.getFileName() != null
                && f.getFileName().toLowerCase().matches(".*\\.(" + ext + ")$")).count();
    }

    private String formatStorageMb(long mb) {
        if (mb >= 1048576) return (mb / 1048576) + " TB";
        if (mb >= 1024) return (mb / 1024) + " GB";
        return mb + " MB";
    }

    // ── Smart answers from real user data ─────────────────────────────────────
    private String answerFromData(String msg, UserData d) {
        String m = msg.toLowerCase();
        double usedMb = d.totalBytes() / (1024.0 * 1024);
        double pct = d.limitMb() > 0 ? usedMb * 100.0 / d.limitMb() : 0;

        if (m.contains("how many file") || m.contains("number of file") || m.contains("total file") || m.contains("files do i"))
            return String.format("You have %d file%s: %d image%s, %d document%s, %d video%s, %d audio file%s.",
                    d.totalFiles(), s(d.totalFiles()), d.images(), s(d.images()), d.docs(), s(d.docs()),
                    d.videos(), s(d.videos()), d.audio(), s(d.audio()));
        if (m.contains("storage") || m.contains("space") || m.contains("how much") || m.contains("used"))
            return String.format("You've used %.1f MB of your %d MB (%d GB) — %.1f%% used. Plan: %s.",
                    usedMb, d.limitMb(), d.limitMb() / 1024, pct, d.plan());
        if (m.contains("plan") || m.contains("upgrade") || m.contains("limit"))
            return String.format("You're on the %s plan (%d MB / %d GB). %.1f MB used (%.1f%% full).",
                    d.plan(), d.limitMb(), d.limitMb() / 1024, usedMb, pct);
        if (m.contains("trash") || m.contains("deleted"))
            return d.trashedFiles() == 0 ? "Your trash is empty."
                    : String.format("You have %d file%s in trash.", d.trashedFiles(), s(d.trashedFiles()));
        if (m.contains("share") || m.contains("sharing") || m.contains("shared")) {
            String byMe = d.sharedByMe().isEmpty() ? "none"
                    : d.sharedByMe().stream().limit(3)
                            .map(sh -> sh.getFile().getFileName() + " → " + sh.getSharedWith())
                            .collect(Collectors.joining(", "));
            String withMe = d.sharedWithMe().isEmpty() ? "none"
                    : d.sharedWithMe().stream().limit(3)
                            .map(sh -> sh.getFile().getFileName() + " from " + sh.getOwnerEmail())
                            .collect(Collectors.joining(", "));
            return String.format("Shared by you: %d file%s (%s). Shared with you: %d file%s (%s).",
                    d.sharedByMe().size(), s(d.sharedByMe().size()), byMe,
                    d.sharedWithMe().size(), s(d.sharedWithMe().size()), withMe);
        }
        if (m.contains("recent") || m.contains("latest") || m.contains("last upload"))
            return d.recentFiles().isEmpty() ? "No files uploaded yet."
                    : "Recent uploads: " + String.join(", ", d.recentFiles()) + ".";
        if (m.contains("folder"))
            return d.folders().isEmpty() ? "All files are in the root folder."
                    : "Your folders: " + String.join(", ", d.folders()) + " (" + d.folders().size() + " total).";
        if (m.contains("activity") || m.contains("history") || m.contains("log"))
            return d.recentActivity().isEmpty() ? "No recent activity."
                    : "Recent actions: " + d.recentActivity().stream().limit(5)
                            .map(l -> l.getAction().replace("_", " ").toLowerCase())
                            .collect(Collectors.joining(", ")) + ".";
        if (m.contains("cloud provider") || m.contains("storage provider") || m.contains("minio") || m.contains("s3") || m.contains("aws") || m.contains("gcs"))
            return "You can configure cloud storage providers (MinIO, AWS S3, Backblaze, Cloudflare R2, etc.) from the Cloud Providers page in your sidebar.";
        if (m.contains("public link") || m.contains("share link") || m.contains("shareable"))
            return "You can create public shareable links for your files from the My Files page. Click the share icon and choose 'Public Link'.";
        if (m.contains("notif"))
            return "Notifications are sent for file shares, plan changes, and admin actions. Check the Notifications page in your sidebar.";
        if (m.contains("upload") || m.contains("add file"))
            return String.format("You have %d file%s uploaded. Use the Upload page to add more (max 50 MB each).", d.totalFiles(), s(d.totalFiles()));
        if (m.contains("image") || m.contains("photo"))
            return String.format("You have %d image file%s.", d.images(), s(d.images()));
        if (m.contains("document") || m.contains("pdf") || m.contains("doc"))
            return String.format("You have %d document%s (PDFs, Word, Excel, etc.).", d.docs(), s(d.docs()));
        if (m.contains("video"))
            return String.format("You have %d video file%s.", d.videos(), s(d.videos()));
        if (m.contains("audio") || m.contains("music") || m.contains("song"))
            return String.format("You have %d audio file%s.", d.audio(), s(d.audio()));
        if (m.contains("hello") || m.contains("hi") || m.contains("hey"))
            return String.format("Hi! You have %d files using %.1f MB of %d MB. Ask me anything!", d.totalFiles(), usedMb, d.limitMb());
        return String.format("You have %d files, %.1f MB used of %d MB. I can answer questions about your files, storage, shares, folders, activity, or cloud providers.", d.totalFiles(), usedMb, d.limitMb());
    }

    private String s(long n) { return n != 1 ? "s" : ""; }

    // ── Landing fallback ──────────────────────────────────────────────────────
    private String fallbackLanding(String msg) {
        String m = msg.toLowerCase();
        String pricingInfo = paymentService.getAllPlanConfigs().stream().map(c -> {
            String price = c.getPricePaise() == 0 ? "Free" : "₹" + (c.getPricePaise() / 100) + "/month";
            return c.getPlan().name() + " (" + formatStorageMb(c.getStorageMb()) + ", " + price + ")";
        }).collect(Collectors.joining(" | "));

        if (m.contains("plan") || m.contains("price") || m.contains("cost") || m.contains("pricing") || m.contains("storage"))
            return "Plans: " + pricingInfo + ".";
        if (m.contains("feature") || m.contains("what can") || m.contains("offer"))
            return "CloudBox features: ☁ Upload (50 MB max), 📁 Folders, 🔗 Public links, 👥 Share with View/Download/Edit, 💬 Collaboration & comments, 🗑 Trash & restore.";
        if (m.contains("how it work") || m.contains("get started"))
            return "Sign up free → upload files → share with others or create public links. Organize into folders, collaborate with comments.";
        if (m.contains("share") || m.contains("sharing"))
            return "Share files with specific users (View/Download/Edit permissions) or create public links with optional expiry.";
        if (m.contains("secure") || m.contains("safe") || m.contains("privacy"))
            return "CloudBox uses JWT authentication, encrypted storage, and permission-based access control.";
        if (m.contains("hello") || m.contains("hi") || m.contains("hey"))
            return "Hi! I'm the CloudBox Assistant. Ask me about features, pricing, or how to use CloudBox!";
        return "I can help with CloudBox features, storage plans, file sharing, and more. What would you like to know?";
    }

    // ── OpenAI call ───────────────────────────────────────────────────────────
    private String callOpenAI(String systemPrompt, String userMessage) {
        long now = System.currentTimeMillis();
        if (now - lastRequestTime < 1000) return null;
        lastRequestTime = now;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiKey);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", "gpt-3.5-turbo");
            body.put("max_tokens", 200);
            body.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userMessage)));
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> rawResponse = restTemplate.postForEntity(OPENAI_URL,
                    new HttpEntity<>(body, headers), Map.class);
            if (rawResponse.getBody() != null) {
                var choices = (List<?>) rawResponse.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    var message = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            System.err.println("[ChatService] OpenAI error: " + e.getMessage());
        }
        return null;
    }

    private boolean isNoKey() {
        return openAiKey == null || openAiKey.isBlank() || openAiKey.equals("YOUR_OPENAI_API_KEY_HERE");
    }
}
