package com.cloudbox.service;

import com.cloudbox.model.FileEntity;
import com.cloudbox.model.AdminSetting;
import com.cloudbox.model.Role;
import com.cloudbox.model.User;
import com.cloudbox.repository.AdminSettingRepository;
import com.cloudbox.repository.CollaborationCommentRepository;
import com.cloudbox.repository.FileRepository;
import com.cloudbox.repository.PublicFileLinkRepository;
import com.cloudbox.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final CollaborationCommentRepository collaborationCommentRepository;
    private final AdminSettingRepository adminSettingRepository;
    private final SystemEventService systemEventService;
    private final FileShareService fileShareService;
    private final FolderService folderService;
    private final MinioStorageService storageService;
    private final EmailService emailService;
    private final PublicFileLinkRepository publicLinkRepository;

    public FileService(
            FileRepository fileRepository,
            UserRepository userRepository,
            CollaborationCommentRepository collaborationCommentRepository,
            AdminSettingRepository adminSettingRepository,
            SystemEventService systemEventService,
            FileShareService fileShareService,
            FolderService folderService,
            MinioStorageService storageService,
            EmailService emailService,
            PublicFileLinkRepository publicLinkRepository) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.collaborationCommentRepository = collaborationCommentRepository;
        this.adminSettingRepository = adminSettingRepository;
        this.systemEventService = systemEventService;
        this.fileShareService = fileShareService;
        this.folderService = folderService;
        this.storageService = storageService;
        this.emailService = emailService;
        this.publicLinkRepository = publicLinkRepository;
    }

    // ── Upload ──
    @Transactional
    public FileEntity uploadFile(MultipartFile file, String userEmail, String folder) throws IOException {
        if (file.isEmpty()) throw new RuntimeException("File is empty");
        if (folder == null || folder.isEmpty()) folder = "root";

        folderService.ensureFolderExists(userEmail, folder);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AdminSetting settings = adminSettingRepository.findById(1L).orElse(null);
        long limitMb;
        if (user.getStorageLimitMb() != null && user.getStorageLimitMb() > 0) {
            limitMb = user.getStorageLimitMb();
        } else if (settings != null && settings.getStorageLimit() != null && settings.getStorageLimit() > 0) {
            limitMb = settings.getStorageLimit();
        } else {
            limitMb = 15360L;
        }

        long currentUsage = getUserStorage(userEmail);
        if (currentUsage + file.getSize() > limitMb * 1024 * 1024) {
            throw new RuntimeException("Storage limit exceeded. Used " +
                    (currentUsage / (1024 * 1024)) + " MB of " + limitMb + " MB.");
        }

        MinioStorageService.StoredFile stored = storageService.uploadFile(file);

        FileEntity entity = new FileEntity();
        entity.setFileName(file.getOriginalFilename());
        entity.setStorageKey(stored.fileName());
        entity.setFileUrl(stored.fileUrl());
        entity.setContentType(file.getContentType());
        entity.setSize(file.getSize());
        entity.setOwnerEmail(userEmail);
        entity.setFolder(folder);
        entity.setUploadDate(LocalDateTime.now());

        FileEntity saved = fileRepository.save(entity);
        systemEventService.log(userEmail, "UPLOAD_FILE", "Uploaded " + saved.getFileName());
        systemEventService.notifyAdmins("File Uploaded", userEmail + " uploaded " + saved.getFileName());

        // Send upload confirmation email
        String sizeLabel = formatSize(file.getSize());
        emailService.sendFileUploaded(userEmail, user.getFirstName(), saved.getFileName(), sizeLabel, folder);

        return saved;
    }

    // ── Download / access ──
    public FileEntity getFileForDownload(Long fileId, String userEmail) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        boolean isOwner = file.getOwnerEmail().equals(userEmail);
        boolean canDownload = fileShareService.canDownloadFile(fileId, userEmail);
        if (!isOwner && !canDownload) throw new RuntimeException("Unauthorized");
        if (isOwner) {
            systemEventService.log(userEmail, "DOWNLOAD_FILE", "Downloaded " + file.getFileName());
        } else {
            systemEventService.log(userEmail, "DOWNLOAD_SHARED_FILE", "Downloaded shared " + file.getFileName());
            systemEventService.notifyUser(file.getOwnerEmail(), "Shared File Downloaded",
                    userEmail + " downloaded your file " + file.getFileName());
        }
        return file;
    }

    public String getDownloadUrl(Long fileId, String userEmail) {
        return getFileForDownload(fileId, userEmail).getFileUrl();
    }

    public FileEntity getFileById(Long fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
    }

    // ── Delete ──
    @Transactional
    public void deleteFile(Long fileId, String userEmail) throws IOException {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!file.getOwnerEmail().equals(userEmail) && user.getRole() != Role.ADMIN)
            throw new RuntimeException("Unauthorized");

        try { publicLinkRepository.deleteAll(publicLinkRepository.findByFileId(fileId)); } catch (Exception ignored) {}
        fileShareService.deleteSharesForFile(fileId);
        collaborationCommentRepository.deleteByFileId(fileId);

        try {
            String key = resolveKey(file);
            if (key != null && !key.isBlank()) storageService.deleteFile(key);
        } catch (Exception e) {
            System.out.println("MinIO delete failed, ignoring: " + file.getFileName());
        }

        fileRepository.delete(file);
        systemEventService.log(userEmail, "DELETE_FILE", "Deleted " + file.getFileName());
    }

    @Transactional
    public void deleteFileAsAdmin(Long fileId, String adminEmail) throws IOException {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        try { publicLinkRepository.deleteAll(publicLinkRepository.findByFileId(fileId)); } catch (Exception ignored) {}
        fileShareService.deleteSharesForFile(fileId);
        collaborationCommentRepository.deleteByFileId(fileId);

        try {
            String key = resolveKey(file);
            if (key != null && !key.isBlank()) storageService.deleteFile(key);
        } catch (Exception e) {
            System.out.println("Admin delete: MinIO file missing, ignoring: " + file.getFileName());
        }

        fileRepository.delete(file);
        systemEventService.log(adminEmail, "ADMIN_DELETE_FILE", "Admin deleted " + file.getFileName());
        systemEventService.notifyAdmins("File Deleted by Admin", adminEmail + " deleted " + file.getFileName());
    }

    // ── File lists ──
    public List<FileEntity> getUserFiles(String email) {
        return fileRepository.findByOwnerEmailAndDeletedFalse(email);
    }

    public List<FileEntity> getFilesByFolder(String email, String folder) {
        return fileRepository.findByFolderAndOwnerEmail(folder, email);
    }

    public List<FileEntity> getAllFiles() {
        return fileRepository.findAll().stream()
                .sorted((a, b) -> compareUploadDates(b, a)).toList();
    }

    // ── Stats ──
    public long getUserFileCount(String email) { return fileRepository.countByOwnerEmail(email); }

    public long getUserStorage(String email) {
        return fileRepository.findByOwnerEmail(email).stream()
                .mapToLong(f -> f.getFileSize() != null ? f.getFileSize() : 0L).sum();
    }

    public long getTotalFiles() { return fileRepository.count(); }

    public long getTotalStorage() {
        return fileRepository.findAll().stream()
                .mapToLong(f -> f.getFileSize() != null ? f.getFileSize() : 0L).sum();
    }

    // ── Access control ──
    public FileEntity getFileIfAccessible(Long fileId, String userEmail) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        boolean isOwner = file.getOwnerEmail().equals(userEmail);
        boolean hasAccess = fileShareService.canViewFile(fileId, userEmail)
                || fileShareService.canDownloadFile(fileId, userEmail);
        if (!isOwner && !hasAccess) throw new RuntimeException("Unauthorized");
        return file;
    }

    // ── Content read/write ──
    public byte[] getFileContent(Long fileId, String userEmail) throws IOException {
        FileEntity file = getFileIfAccessible(fileId, userEmail);
        return storageService.getFileBytes(resolveKey(file));
    }

    public byte[] getPublicFileContent(Long fileId) throws IOException {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        return storageService.getFileBytes(resolveKey(file));
    }

    public void replaceFileContent(Long fileId, String userEmail, byte[] content, String contentType) throws IOException {
        FileEntity file = getFileIfAccessible(fileId, userEmail);
        boolean isOwner = file.getOwnerEmail().equals(userEmail);
        boolean canEdit = fileShareService.canEditFile(fileId, userEmail);
        if (!isOwner && !canEdit) throw new RuntimeException("No edit permission");
        storageService.replaceFile(resolveKey(file), content, contentType);
        file.setSize((long) content.length);
        file.setLastModifiedAt(LocalDateTime.now());
        fileRepository.save(file);
    }

    // ── Star / Trash / Rename ──
    public String toggleStar(Long fileId, String userEmail) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getOwnerEmail().equals(userEmail)) throw new RuntimeException("Unauthorized");
        file.setStarred(!file.isStarred());
        fileRepository.save(file);
        return file.isStarred() ? "Starred" : "Unstarred";
    }

    public void moveToTrash(Long fileId, String userEmail) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getOwnerEmail().equals(userEmail)) throw new RuntimeException("Unauthorized");
        file.setDeleted(true);
        file.setDeletedAt(LocalDateTime.now());
        fileRepository.save(file);
        systemEventService.log(userEmail, "MOVE_TO_TRASH", "Moved " + file.getFileName() + " to trash");
    }

    public List<FileEntity> getTrash(String userEmail) {
        return fileRepository.findByOwnerEmailAndDeletedTrue(userEmail);
    }

    public void restoreFromTrash(Long fileId, String userEmail) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getOwnerEmail().equals(userEmail)) throw new RuntimeException("Unauthorized");
        file.setDeleted(false);
        file.setDeletedAt(null);
        fileRepository.save(file);
        systemEventService.log(userEmail, "RESTORE_FROM_TRASH", "Restored " + file.getFileName());
    }

    @Transactional
    public void emptyTrash(String userEmail) {
        List<FileEntity> trashed = getTrash(userEmail);

        for (FileEntity file : trashed) {
            // Clean up all related records first (foreign key safety)
            try { publicLinkRepository.deleteAll(publicLinkRepository.findByFileId(file.getId())); } catch (Exception ignored) {}
            try { fileShareService.deleteSharesForFile(file.getId()); } catch (Exception ignored) {}
            try { collaborationCommentRepository.deleteByFileId(file.getId()); } catch (Exception ignored) {}

            // Try to delete from MinIO — skip if not found
            try {
                String key = resolveKey(file);
                if (key != null && !key.isBlank()) {
                    storageService.deleteFile(key);
                }
            } catch (Exception e) {
                System.out.println("MinIO delete skipped for: " + file.getFileName() + " — " + e.getMessage());
            }

            // Always remove from DB
            fileRepository.delete(file);
        }

        systemEventService.log(userEmail, "EMPTY_TRASH", "Emptied trash (" + trashed.size() + " files)");
    }

    public void renameFile(Long fileId, String newName, String userEmail) {
        if (newName == null || newName.isBlank()) throw new RuntimeException("Name required");
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getOwnerEmail().equals(userEmail)) throw new RuntimeException("Unauthorized");
        file.setFileName(newName.trim());
        fileRepository.save(file);
        systemEventService.log(userEmail, "RENAME_FILE", "Renamed to " + newName);
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }

    // ── Helpers ──
    private String resolveKey(FileEntity file) {
        if (file.getStorageKey() != null && !file.getStorageKey().isBlank()) {
            return file.getStorageKey();
        }

// fallback → try fileUrl
        if (file.getFileUrl() != null && file.getFileUrl().contains("/")) {
            return file.getFileUrl().substring(file.getFileUrl().lastIndexOf("/") + 1);
        }

        throw new RuntimeException("Storage key missing for file: " + file.getFileName());
    }

    private int compareUploadDates(FileEntity a, FileEntity b) {
        if (a.getUploadDate() == null && b.getUploadDate() == null) return 0;
        if (a.getUploadDate() == null) return -1;
        if (b.getUploadDate() == null) return 1;
        return a.getUploadDate().compareTo(b.getUploadDate());
    }
}
