package com.cloudbox.service;

import com.cloudbox.dto.UserProfileDTO;
import com.cloudbox.model.AdminSetting;
import com.cloudbox.model.SystemLog;
import com.cloudbox.model.User;
import com.cloudbox.model.UserNotification;
import com.cloudbox.repository.AdminSettingRepository;
import com.cloudbox.repository.PaymentRepository;
import com.cloudbox.repository.SystemLogRepository;
import com.cloudbox.repository.UserNotificationRepository;
import com.cloudbox.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final SystemLogRepository systemLogRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final SystemEventService systemEventService;
    private final FileService fileService;
    private final AdminSettingRepository adminSettingRepository;
    private final PaymentRepository paymentRepository;

    public UserService(
            UserRepository userRepository,
            SystemLogRepository systemLogRepository,
            UserNotificationRepository userNotificationRepository,
            SystemEventService systemEventService,
            FileService fileService,
            AdminSettingRepository adminSettingRepository,
            PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.systemLogRepository = systemLogRepository;
        this.userNotificationRepository = userNotificationRepository;
        this.systemEventService = systemEventService;
        this.fileService = fileService;
        this.adminSettingRepository = adminSettingRepository;
        this.paymentRepository = paymentRepository;
    }

    // ================= GET PROFILE (SAFE) =================
    public UserProfileDTO getProfileDTO(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToDTO(user);
    }

    // ================= UPDATE PROFILE =================
    public UserProfileDTO updateProfileDTO(String email, UserProfileDTO dto) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ Update only allowed fields
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setGender(dto.getGender());
        user.setAge(dto.getAge());
        user.setLocation(dto.getLocation());

        userRepository.save(user);
        systemEventService.log(email, "UPDATE_PROFILE", "Updated profile information");

        return mapToDTO(user);
    }

    public List<SystemLog> getUserActivity(String email) {
        return systemLogRepository.findByUserEmailOrderByCreatedAtDesc(email);
    }

    public List<SystemLog> getUserCollaborationActivity(String email) {
        return systemLogRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .filter(log -> isCollaborationAction(log.getAction()))
                .toList();
    }

    /**
     * Get user ID by email.
     */
    public Long getUserIdByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    public List<UserNotification> getUserNotifications(String email) {
        return userNotificationRepository.findTop20ByUserEmailOrderByCreatedAtDesc(email);
    }

    public long getUnreadNotificationCount(String email) {
        return userNotificationRepository.countByUserEmailAndIsReadFalse(email);
    }

    public void markAllNotificationsRead(String email) {
        List<UserNotification> notifications = userNotificationRepository
                .findTop20ByUserEmailOrderByCreatedAtDesc(email);
        notifications.forEach(notification -> notification.setRead(true));
        userNotificationRepository.saveAll(notifications);
    }

    @Transactional
    public Map<String, Long> getStorageInfo(String email) {
        long used = fileService.getUserStorage(email);
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        AdminSetting settings = adminSettingRepository.findById(1L).orElse(null);

        long limitMb;
        if (user.getStorageLimitMb() != null && user.getStorageLimitMb() > 0) {
            limitMb = user.getStorageLimitMb();
            System.out.println("User " + email + " has per-user limit: " + limitMb + " MB");
        } else if (settings != null && settings.getStorageLimit() != null && settings.getStorageLimit() > 0) {
            limitMb = settings.getStorageLimit();
            System.out.println("User " + email + " using global limit: " + limitMb + " MB");
        } else {
            limitMb = 15360L; // default 15 GB
            System.out.println("User " + email + " using default limit: " + limitMb + " MB");
        }

        System.out.println("User " + email + " storage info - used: " + used + " bytes, limit: " + limitMb + " MB");
        return Map.of("usedBytes", used, "limitMb", limitMb);
    }

    @Transactional
    public UserProfileDTO cancelPlan(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPlan() == null || user.getPlan().name().equals("FREE"))
            throw new RuntimeException("You are already on the FREE plan");

        // Enforce 24-hour cancellation window
        paymentRepository.findTopByUserEmailAndStatusOrderByPaidAtDesc(email, "APPROVED")
                .ifPresent(payment -> {
                    if (payment.getPaidAt() != null &&
                        payment.getPaidAt().isBefore(java.time.LocalDateTime.now().minusHours(24))) {
                        throw new RuntimeException("Cancellation window has expired. Plans can only be cancelled within 24 hours of payment approval.");
                    }
                });

        com.cloudbox.model.Plan cancelledPlan = user.getPlan();

        user.setPlan(com.cloudbox.model.Plan.FREE);
        user.setStorageLimitMb(15360L);
        userRepository.save(user);

        // Record a REFUNDED payment entry for admin tracking
        paymentRepository.findTopByUserEmailAndStatusOrderByPaidAtDesc(email, "APPROVED")
                .ifPresent(original -> {
                    com.cloudbox.model.Payment refund = new com.cloudbox.model.Payment();
                    refund.setUserEmail(email);
                    refund.setRazorpayOrderId(original.getRazorpayOrderId());
                    refund.setRazorpayPaymentId(original.getRazorpayPaymentId());
                    refund.setRazorpaySignature(original.getRazorpaySignature());
                    refund.setPlan(cancelledPlan);
                    refund.setAmountPaise(original.getAmountPaise());
                    refund.setStatus("REFUNDED");
                    refund.setCreatedAt(java.time.LocalDateTime.now());
                    refund.setPaidAt(java.time.LocalDateTime.now());
                    paymentRepository.save(refund);
                });

        systemEventService.log(email, "CANCEL_PLAN", "Cancelled " + cancelledPlan + " plan, reverted to FREE");
        return mapToDTO(user);
    }

    // Returns hours remaining in cancellation window, or -1 if expired/no payment
    public long getCancellationHoursRemaining(String email) {
        return paymentRepository.findTopByUserEmailAndStatusOrderByPaidAtDesc(email, "APPROVED")
                .map(payment -> {
                    if (payment.getPaidAt() == null) return -1L;
                    long hoursElapsed = java.time.Duration.between(payment.getPaidAt(), java.time.LocalDateTime.now()).toHours();
                    long remaining = 24 - hoursElapsed;
                    return remaining > 0 ? remaining : -1L;
                })
                .orElse(-1L);
    }

    @Transactional
    public void deleteOwnAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete all user files from DB (storage cleanup is best-effort)
        var files = fileService.getUserFiles(email);
        for (var file : files) {
            try {
                fileService.deleteFile(file.getId(), email);
            } catch (Exception ignored) {
            }
        }
        // Delete trashed files too
        var trashed = fileService.getTrash(email);
        for (var file : trashed) {
            try {
                fileService.deleteFile(file.getId(), email);
            } catch (Exception ignored) {
            }
        }

        // Delete notifications
        var notifications = userNotificationRepository.findTop20ByUserEmailOrderByCreatedAtDesc(email);
        userNotificationRepository.deleteAll(notifications);

        // Delete activity logs
        var logs = systemLogRepository.findByUserEmailOrderByCreatedAtDesc(email);
        systemLogRepository.deleteAll(logs);

        // Delete the user
        userRepository.delete(user);
        systemEventService.log(email, "DELETE_ACCOUNT", "User deleted their own account");
    }

    private boolean isCollaborationAction(String action) {
        if (action == null) {
            return false;
        }

        return action.contains("SHARE")
                || action.contains("COLLAB")
                || action.contains("DOWNLOAD_SHARED")
                || action.contains("DOWNLOAD_SHARED_FILE");
    }

    // ================= HELPER =================
    private UserProfileDTO mapToDTO(User user) {

        UserProfileDTO dto = new UserProfileDTO();

        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setGender(user.getGender());
        dto.setAge(user.getAge());
        dto.setLocation(user.getLocation());
        dto.setPlan(user.getPlan() != null ? user.getPlan().name() : "FREE");

        return dto;
    }
}
