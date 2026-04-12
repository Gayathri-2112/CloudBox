package com.cloudbox.service;

import com.cloudbox.dto.UserProfileDTO;
import com.cloudbox.model.AdminSetting;
import com.cloudbox.model.SystemLog;
import com.cloudbox.model.User;
import com.cloudbox.model.UserNotification;
import com.cloudbox.repository.AdminSettingRepository;
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

    public UserService(
            UserRepository userRepository,
            SystemLogRepository systemLogRepository,
            UserNotificationRepository userNotificationRepository,
            SystemEventService systemEventService,
            FileService fileService,
            AdminSettingRepository adminSettingRepository) {
        this.userRepository = userRepository;
        this.systemLogRepository = systemLogRepository;
        this.userNotificationRepository = userNotificationRepository;
        this.systemEventService = systemEventService;
        this.fileService = fileService;
        this.adminSettingRepository = adminSettingRepository;
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

        user.setPlan(com.cloudbox.model.Plan.FREE);
        user.setStorageLimitMb(15360L); // reset to 15 GB
        userRepository.save(user);

        systemEventService.log(email, "CANCEL_PLAN", "Cancelled plan, reverted to FREE");
        return mapToDTO(user);
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
