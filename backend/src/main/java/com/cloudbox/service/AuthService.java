package com.cloudbox.service;

import com.cloudbox.dto.LoginRequest;
import com.cloudbox.dto.RegisterRequest;
import com.cloudbox.dto.ResetPasswordRequest;
import com.cloudbox.model.AdminSetting;
import com.cloudbox.model.Role;
import com.cloudbox.model.User;
import com.cloudbox.repository.AdminSettingRepository;
import com.cloudbox.repository.UserRepository;
import com.cloudbox.util.JwtUtil;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final AdminSettingRepository adminSettingRepository;
    private final SystemEventService systemEventService;

    // ✅ Password encoder
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            AdminSettingRepository adminSettingRepository,
            SystemEventService systemEventService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.adminSettingRepository = adminSettingRepository;
        this.systemEventService = systemEventService;
    }

    // ✅ REGISTER
    public String register(RegisterRequest request) {

        AdminSetting settings = adminSettingRepository.findById(1L).orElse(null);
        if (settings != null && !settings.isAllowSignup()) {
            throw new RuntimeException("New user signup is currently disabled");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        // ✅ prevent duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setGender(request.getGender());
        user.setAge(request.getAge());
        user.setLocation(request.getLocation());
        user.setEmail(request.getEmail());

        // ✅ HASH PASSWORD
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setRole(Role.USER);
        // Set default upload/storage limit for new users: 15 GB (15360 MB)
        user.setStorageLimitMb(15360L);

        userRepository.save(user);
        systemEventService.log(user.getEmail(), "REGISTER", "New user registered");
        systemEventService.notifyAdmins("New User Registration", user.getEmail() + " created a new account");

        return "User registered successfully";
    }

    // ✅ LOGIN
    public String login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isSuspended()) {
            throw new RuntimeException("Account suspended by admin");
        }

        // Account lockout check
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(java.time.LocalDateTime.now())) {
            long minutesLeft = java.time.Duration.between(java.time.LocalDateTime.now(), user.getLockedUntil())
                    .toMinutes() + 1;
            throw new RuntimeException("Account locked. Try again in " + minutesLeft + " minute(s)");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            int attempts = user.getLoginAttempts() + 1;
            user.setLoginAttempts(attempts);

            if (attempts >= 5) {
                user.setLockedUntil(java.time.LocalDateTime.now().plusMinutes(15));
                user.setLoginAttempts(0);
                userRepository.save(user);
                systemEventService.log(user.getEmail(), "ACCOUNT_LOCKED",
                        "Account locked after 5 failed login attempts");

                throw new RuntimeException("LOCKED:Account locked for 15 minutes due to too many failed attempts. Reset your password to regain access immediately.");
            }

            userRepository.save(user);
            int remaining = 5 - attempts;
            throw new RuntimeException("ATTEMPTS_LEFT:" + remaining);

        }

        // Reset on successful login
        user.setLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        systemEventService.log(user.getEmail(), "LOGIN", "User logged in successfully");
        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }

    // ✅ RESET PASSWORD
    public String resetPassword(ResetPasswordRequest request) {

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RuntimeException("Email is required");
        }

        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new RuntimeException("New password is required");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        systemEventService.log(user.getEmail(), "PASSWORD_RESET", "User reset password");
        systemEventService.notifyAdmins("Password Reset", user.getEmail() + " reset their account password");

        return "Password reset successfully";
    }
}
