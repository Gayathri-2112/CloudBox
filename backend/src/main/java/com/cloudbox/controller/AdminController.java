package com.cloudbox.controller;

import com.cloudbox.dto.AdminFileDTO;
import com.cloudbox.dto.AdminSettingsRequest;
import com.cloudbox.dto.FileShareDTO;
import com.cloudbox.model.*;
import com.cloudbox.service.AdminService;
import com.cloudbox.service.FileService;
import com.cloudbox.service.PaymentService;
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
    private final PaymentService paymentService;

    public AdminController(
            AdminService adminService,
            UserRepository userRepository,
            FileService fileService,
            FileRepository fileRepository,
            PaymentService paymentService) {
        this.adminService = adminService;
        this.userRepository = userRepository;
        this.fileService = fileService;
        this.fileRepository = fileRepository;
        this.paymentService = paymentService;
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
        data.put("totalUsers", userRepository.countByRole(Role.USER));
        data.put("totalFiles", fileService.getTotalFiles());
        data.put("totalStorage", fileService.getTotalStorage());

        // 📁 recent files
        List<FileEntity> recentFiles = fileRepository.findAll()
                .stream()
                .sorted((a, b) -> {
                    if (b.getUploadDate() == null && a.getUploadDate() == null) {
                        return 0;
                    }
                    if (b.getUploadDate() == null) {
                        return -1;
                    }
                    if (a.getUploadDate() == null) {
                        return 1;
                    }
                    return b.getUploadDate().compareTo(a.getUploadDate());
                })
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

    @PutMapping("/users/{id}/storage-limit")
    public ResponseEntity<User> setUserStorageLimit(
            @PathVariable Long id,
            @RequestBody com.cloudbox.dto.UserStorageLimitRequest payload,
            Authentication auth) {
        Long storageLimitMb = payload.getStorageLimitMb();
        User updated = adminService.updateUserStorageLimit(id, storageLimitMb, auth.getName());
        return ResponseEntity.ok(updated);
    }

    // ================= PAYMENTS =================

    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/payments/pending")
    public ResponseEntity<List<Payment>> getPendingPayments() {
        return ResponseEntity.ok(paymentService.getPendingPayments());
    }

    @PutMapping("/payments/{id}/approve")
    public ResponseEntity<String> approvePayment(@PathVariable Long id, Authentication auth) {
        paymentService.approvePayment(id, auth.getName());
        return ResponseEntity.ok("Payment approved and plan activated");
    }

    @PutMapping("/payments/{id}/reject")
    public ResponseEntity<String> rejectPayment(@PathVariable Long id, Authentication auth) {
        paymentService.rejectPayment(id, auth.getName());
        return ResponseEntity.ok("Payment rejected");
    }
}
