package com.cloudbox.service;

import com.cloudbox.dto.UserProfileDTO;
import com.cloudbox.model.SystemLog;
import com.cloudbox.model.User;
import com.cloudbox.model.UserNotification;
import com.cloudbox.repository.SystemLogRepository;
import com.cloudbox.repository.UserNotificationRepository;
import com.cloudbox.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final SystemLogRepository systemLogRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final SystemEventService systemEventService;

    public UserService(
            UserRepository userRepository,
            SystemLogRepository systemLogRepository,
            UserNotificationRepository userNotificationRepository,
            SystemEventService systemEventService
    ) {
        this.userRepository = userRepository;
        this.systemLogRepository = systemLogRepository;
        this.userNotificationRepository = userNotificationRepository;
        this.systemEventService = systemEventService;
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
        List<UserNotification> notifications = userNotificationRepository.findTop20ByUserEmailOrderByCreatedAtDesc(email);
        notifications.forEach(notification -> notification.setRead(true));
        userNotificationRepository.saveAll(notifications);
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

        return dto;
    }
}
