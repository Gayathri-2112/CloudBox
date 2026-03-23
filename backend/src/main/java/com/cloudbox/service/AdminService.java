package com.cloudbox.service;

import com.cloudbox.dto.AdminFileDTO;
import com.cloudbox.dto.AdminSettingsRequest;
import com.cloudbox.dto.FileShareDTO;
import com.cloudbox.model.AdminNotification;
import com.cloudbox.model.AdminSetting;
import com.cloudbox.model.FileEntity;
import com.cloudbox.model.SystemLog;
import com.cloudbox.model.User;
import com.cloudbox.repository.AdminNotificationRepository;
import com.cloudbox.repository.AdminSettingRepository;
import com.cloudbox.repository.FileRepository;
import com.cloudbox.repository.SystemLogRepository;
import com.cloudbox.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final FileService fileService;
    private final SystemLogRepository systemLogRepository;
    private final AdminNotificationRepository adminNotificationRepository;
    private final AdminSettingRepository adminSettingRepository;
    private final SystemEventService systemEventService;
    private final FileShareService fileShareService;

    public AdminService(
            UserRepository userRepository,
            FileRepository fileRepository,
            FileService fileService,
            SystemLogRepository systemLogRepository,
            AdminNotificationRepository adminNotificationRepository,
            AdminSettingRepository adminSettingRepository,
            SystemEventService systemEventService,
            FileShareService fileShareService
    ) {
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.fileService = fileService;
        this.systemLogRepository = systemLogRepository;
        this.adminNotificationRepository = adminNotificationRepository;
        this.adminSettingRepository = adminSettingRepository;
        this.systemEventService = systemEventService;
        this.fileShareService = fileShareService;
    }

    // ✅ Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ✅ Suspend user
    public User suspendUser(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setSuspended(true);
        User savedUser = userRepository.save(user);
        systemEventService.log(savedUser.getEmail(), "SUSPEND_USER", "User account suspended by admin");
        systemEventService.notifyAdmins("User Suspended", savedUser.getEmail() + " was suspended");
        return savedUser;
    }

    // ✅ Unsuspend user (NEW)
    public User unsuspendUser(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setSuspended(false);
        User savedUser = userRepository.save(user);
        systemEventService.log(savedUser.getEmail(), "UNSUSPEND_USER", "User account reactivated by admin");
        systemEventService.notifyAdmins("User Reactivated", savedUser.getEmail() + " was reactivated");
        return savedUser;
    }

    // ✅ Delete user
    public void deleteUser(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        userRepository.deleteById(id);
        systemEventService.log(user.getEmail(), "DELETE_USER", "User deleted by admin");
        systemEventService.notifyAdmins("User Deleted", user.getEmail() + " was deleted");
    }

    // 🔍 Search users by email (NEW)
    public List<User> searchUsers(String email) {
        return userRepository.findByEmailContainingIgnoreCase(email);
    }

    // 🟢 Active users (NEW)
    public List<User> getActiveUsers() {
        return userRepository.findBySuspendedFalse();
    }

    // 🔴 Suspended users (NEW)
    public List<User> getSuspendedUsers() {
        return userRepository.findBySuspendedTrue();
    }

    public List<AdminFileDTO> getAllFiles() {
        return fileRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getUploadedAt().compareTo(a.getUploadedAt()))
                .map(this::mapFileToDto)
                .toList();
    }

    public void deleteFile(Long id, String adminEmail) throws IOException {
        fileService.deleteFileAsAdmin(id, adminEmail);
    }

    public List<SystemLog> getLogs() {
        return systemLogRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<AdminNotification> getNotifications() {
        return adminNotificationRepository.findTop20ByOrderByCreatedAtDesc();
    }

    public List<SystemLog> getCollaborationActivity() {
        return systemLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(log -> isCollaborationAction(log.getAction()))
                .toList();
    }

    public AdminSetting getSettings() {
        return adminSettingRepository.findById(1L).orElseGet(this::createDefaultSettings);
    }

    public AdminSetting saveSettings(AdminSettingsRequest request, String adminEmail) {
        AdminSetting settings = adminSettingRepository.findById(1L).orElseGet(this::createDefaultSettings);
        settings.setStorageLimit(request.getStorageLimit());
        settings.setAllowSignup(request.isAllowSignup());
        settings.setUpdatedAt(LocalDateTime.now());

        AdminSetting savedSettings = adminSettingRepository.save(settings);

        systemEventService.log(adminEmail, "UPDATE_SETTINGS",
                "Updated settings: storageLimit=" + savedSettings.getStorageLimit()
                        + "MB, allowSignup=" + savedSettings.isAllowSignup());
        systemEventService.notifyAdmins("System Settings Updated",
                adminEmail + " updated storage and signup settings");

        return savedSettings;
    }

    public List<FileShareDTO> getAllShares() {
        return fileShareService.getAllShares();
    }

    public void revokeShare(Long shareId, String adminEmail) {
        fileShareService.revokeShareAsAdmin(shareId, adminEmail);
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

    private AdminSetting createDefaultSettings() {
        AdminSetting settings = new AdminSetting();
        settings.setId(1L);
        settings.setStorageLimit(0L);
        settings.setAllowSignup(true);
        settings.setUpdatedAt(LocalDateTime.now());
        return adminSettingRepository.save(settings);
    }

    private AdminFileDTO mapFileToDto(FileEntity file) {
        AdminFileDTO dto = new AdminFileDTO();
        dto.setId(file.getId());
        dto.setFileName(file.getFileName());
        dto.setUserEmail(file.getOwnerEmail());
        dto.setSize(file.getFileSize());
        dto.setCreatedAt(file.getUploadedAt());
        return dto;
    }
}
