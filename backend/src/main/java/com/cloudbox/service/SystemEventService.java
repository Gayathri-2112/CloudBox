package com.cloudbox.service;

import com.cloudbox.model.AdminNotification;
import com.cloudbox.model.SystemLog;
import com.cloudbox.model.UserNotification;
import com.cloudbox.repository.AdminNotificationRepository;
import com.cloudbox.repository.SystemLogRepository;
import com.cloudbox.repository.UserNotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class SystemEventService {

    private final SystemLogRepository systemLogRepository;
    private final AdminNotificationRepository adminNotificationRepository;
    private final UserNotificationRepository userNotificationRepository;

    public SystemEventService(
            SystemLogRepository systemLogRepository,
            AdminNotificationRepository adminNotificationRepository,
            UserNotificationRepository userNotificationRepository
    ) {
        this.systemLogRepository = systemLogRepository;
        this.adminNotificationRepository = adminNotificationRepository;
        this.userNotificationRepository = userNotificationRepository;
    }

    public void log(String userEmail, String action, String details) {
        SystemLog log = new SystemLog();
        log.setUserEmail(userEmail);
        log.setAction(action);
        log.setDetails(details);
        log.setCreatedAt(LocalDateTime.now());
        systemLogRepository.save(log);
    }

    public void notifyAdmins(String title, String message) {
        AdminNotification notification = new AdminNotification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCreatedAt(LocalDateTime.now());
        adminNotificationRepository.save(notification);
    }

    public void notifyUser(String userEmail, String title, String message) {
        UserNotification notification = new UserNotification();
        notification.setUserEmail(userEmail);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        userNotificationRepository.save(notification);
    }
}
