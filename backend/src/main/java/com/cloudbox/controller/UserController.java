package com.cloudbox.controller;


import com.cloudbox.dto.UserProfileDTO;
import com.cloudbox.model.SystemLog;
// import com.cloudbox.model.User;
import com.cloudbox.model.UserNotification;
import com.cloudbox.service.UserService;

import org.springframework.web.bind.annotation.*;


import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ================= GET PROFILE =================
    @GetMapping("/profile")
    public UserProfileDTO getProfile(Principal principal) {
        return userService.getProfileDTO(principal.getName());
    }

    // ================= UPDATE PROFILE =================
    @PutMapping("/profile")
    public UserProfileDTO updateProfile(@RequestBody UserProfileDTO dto,
            Principal principal) {
        return userService.updateProfileDTO(principal.getName(), dto);
    }

    @GetMapping("/activity")
    public List<SystemLog> getActivity(Principal principal) {
        return userService.getUserActivity(principal.getName());
    }

    @GetMapping("/collaboration")
    public List<SystemLog> getCollaborationActivity(Principal principal) {
        return userService.getUserCollaborationActivity(principal.getName());
    }

    @GetMapping("/notifications")
    public List<UserNotification> getNotifications(Principal principal) {
        return userService.getUserNotifications(principal.getName());
    }

    @GetMapping("/notifications/unread-count")
    public long getUnreadNotificationCount(Principal principal) {
        return userService.getUnreadNotificationCount(principal.getName());
    }

    @PutMapping("/notifications/read-all")
    public String markAllNotificationsRead(Principal principal) {
        userService.markAllNotificationsRead(principal.getName());
        return "Notifications marked as read";
    }

    @GetMapping("/storage")
    public java.util.Map<String, Long> getStorageInfo(Principal principal) {
        return userService.getStorageInfo(principal.getName());
    }

    @PostMapping("/cancel-plan")
    public UserProfileDTO cancelPlan(Principal principal) {
        return userService.cancelPlan(principal.getName());
    }
}
