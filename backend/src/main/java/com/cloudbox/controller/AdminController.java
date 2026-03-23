package com.cloudbox.controller;

import com.cloudbox.dto.AdminFileDTO;
import com.cloudbox.dto.AdminSettingsRequest;
import com.cloudbox.dto.FileShareDTO;
import com.cloudbox.model.AdminNotification;
import com.cloudbox.model.AdminSetting;
import com.cloudbox.model.SystemLog;
import com.cloudbox.model.User;
import com.cloudbox.model.FileEntity;
import com.cloudbox.service.AdminService;
import com.cloudbox.service.FileService;
import com.cloudbox.repository.UserRepository;
import com.cloudbox.repository.FileRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;
    private final FileService fileService;
    private final FileRepository fileRepository;

    public AdminController(
            AdminService adminService,
            UserRepository userRepository,
            FileService fileService,
            FileRepository fileRepository
    ) {
        this.adminService = adminService;
        this.userRepository = userRepository;
        this.fileService = fileService;
        this.fileRepository = fileRepository;
    }

    // ================= USERS =================

    @GetMapping("/users")
    public List<User> getUsers() {
        return adminService.getAllUsers();
    }

    @PutMapping("/suspend/{id}")
    public User suspendUser(@PathVariable Long id) {
        return adminService.suspendUser(id);
    }

    @PutMapping("/unsuspend/{id}")
    public User unsuspendUser(@PathVariable Long id) {
        return adminService.unsuspendUser(id);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    // ================= SEARCH =================

    @GetMapping("/search")
    public List<User> searchUsers(@RequestParam String email) {
        return adminService.searchUsers(email);
    }

    @GetMapping("/active")
    public List<User> activeUsers() {
        return adminService.getActiveUsers();
    }

    @GetMapping("/suspended")
    public List<User> suspendedUsers() {
        return adminService.getSuspendedUsers();
    }

    // ================= DASHBOARD =================

    @GetMapping("/dashboard")
    public Map<String, Object> getAdminDashboard() {

        Map<String, Object> data = new HashMap<>();

        // 📊 stats
        data.put("totalUsers", userRepository.count());
        data.put("totalFiles", fileService.getTotalFiles());
        data.put("totalStorage", fileService.getTotalStorage());

        // 📁 recent files
        List<FileEntity> recentFiles = fileRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getUploadedAt().compareTo(a.getUploadedAt()))
                .limit(5)
                .toList();

        data.put("recentFiles", recentFiles);

        return data;
    }

    @GetMapping("/files")
    public List<AdminFileDTO> getAllFiles() {
        return adminService.getAllFiles();
    }

    @DeleteMapping("/file/{id}")
    public ResponseEntity<String> deleteFile(@PathVariable Long id, Authentication auth) throws IOException {
        adminService.deleteFile(id, auth.getName());
        return ResponseEntity.ok("File deleted successfully");
    }

    @GetMapping("/logs")
    public List<SystemLog> getLogs() {
        return adminService.getLogs();
    }

    @GetMapping("/notifications")
    public List<AdminNotification> getNotifications() {
        return adminService.getNotifications();
    }

    @GetMapping("/collaboration")
    public List<SystemLog> getCollaborationActivity() {
        return adminService.getCollaborationActivity();
    }

    @GetMapping("/settings")
    public AdminSetting getSettings() {
        return adminService.getSettings();
    }

    @PostMapping("/settings")
    public AdminSetting saveSettings(@RequestBody AdminSettingsRequest request, Authentication auth) {
        return adminService.saveSettings(request, auth.getName());
    }

    @GetMapping("/shares")
    public List<FileShareDTO> getAllShares() {
        return adminService.getAllShares();
    }

    @DeleteMapping("/share/{id}")
    public ResponseEntity<String> revokeShare(@PathVariable Long id, Authentication auth) {
        adminService.revokeShare(id, auth.getName());
        return ResponseEntity.ok("Share revoked successfully");
    }
}
