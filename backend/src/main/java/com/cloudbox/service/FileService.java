package com.cloudbox.service;

import com.cloudbox.model.FileEntity;
import com.cloudbox.model.AdminSetting;
import com.cloudbox.model.Role;
import com.cloudbox.model.User;
import com.cloudbox.repository.AdminSettingRepository;
import com.cloudbox.repository.CollaborationCommentRepository;
import com.cloudbox.repository.FileRepository;
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
    private final MinioStorageService minioStorageService;

    public FileService(
            FileRepository fileRepository,
            UserRepository userRepository,
            CollaborationCommentRepository collaborationCommentRepository,
            AdminSettingRepository adminSettingRepository,
            SystemEventService systemEventService,
            FileShareService fileShareService,
            FolderService folderService,
            MinioStorageService minioStorageService) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.collaborationCommentRepository = collaborationCommentRepository;
        this.adminSettingRepository = adminSettingRepository;
        this.systemEventService = systemEventService;
        this.fileShareService = fileShareService;
        this.folderService = folderService;
        this.minioStorageService = minioStorageService;
    }

    // =========================
    // 📤 UPLOAD FILE
    // =========================
    @Transactional
    public FileEntity uploadFile(MultipartFile file, String userEmail, String folder) throws IOException {

        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        if (folder == null || folder.isEmpty()) {
            folder = "root";
        }

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
            limitMb = 15360L; // default 15 GB
        }

        long maxBytes = limitMb * 1024 * 1024;
        long currentUsage = getUserStorage(userEmail);

        if (currentUsage + file.getSize() > maxBytes) {
            throw new RuntimeException("Storage limit exceeded. You have used " +
                    (currentUsage / (1024 * 1024)) + " MB of your " + limitMb + " MB limit.");
        }

        MinioStorageService.StoredFile storedFile = minioStorageService.uploadFile(file);

        FileEntity entity = new FileEntity();
        entity.setFileName(file.getOriginalFilename());
        entity.setFileUrl(storedFile.fileUrl());
        entity.setStorageKey(storedFile.fileName());
        entity.setContentType(file.getContentType());
        entity.setSize(file.getSize());
        entity.setOwnerEmail(userEmail);
        entity.setFolder(folder);
        entity.setUploadDate(LocalDateTime.now());

        FileEntity savedFile = fileRepository.save(entity);

        systemEventService.log(userEmail, "UPLOAD_FILE",
                "Uploaded " + savedFile.getFileName() + " to folder " + folder);

        systemEventService.notifyAdmins("File Uploaded",
                userEmail + " uploaded " + savedFile.getFileName());

        return savedFile;
    }

    // =========================
    // 📥 DOWNLOAD FILE
    // =========================
    public String getDownloadUrl(Long fileId, String userEmail) {
        return getFileForDownload(fileId, userEmail).getFileUrl();
    }

    public FileEntity getFileById(Long fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
    }

    public FileEntity getFileForDownload(Long fileId, String userEmail) {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        boolean isOwner = file.getOwnerEmail().equals(userEmail);

        boolean canDownload = fileShareService.canDownloadFile(fileId, userEmail);

        if (!isOwner && !canDownload) {
            throw new RuntimeException("Unauthorized");
        }

        if (isOwner) {
            systemEventService.log(userEmail, "DOWNLOAD_FILE",
                    "Downloaded own file " + file.getFileName());
        } else {
            systemEventService.log(userEmail, "DOWNLOAD_SHARED_FILE",
                    "Downloaded shared file " + file.getFileName());

            systemEventService.notifyUser(
                    file.getOwnerEmail(),
                    "Shared File Downloaded",
                    userEmail + " downloaded your file " + file.getFileName());
        }

        return file;
    }

    // =========================
    // ❌ DELETE FILE
    // =========================
    @Transactional
    public void deleteFile(Long fileId, String userEmail) throws IOException {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!file.getOwnerEmail().equals(userEmail) && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        fileShareService.deleteSharesForFile(fileId);
        collaborationCommentRepository.deleteByFileId(fileId);

        minioStorageService.deleteFile(resolveStorageKey(file));
        fileRepository.delete(file);

        systemEventService.log(userEmail, "DELETE_FILE",
                "Deleted file " + file.getFileName());
    }

    // =========================
    // 📂 USER FILES
    // =========================
    public List<FileEntity> getUserFiles(String email) {

        return fileRepository.findByOwnerEmailAndDeletedFalse(email);



    }

    // =========================
    // 📂 FILES BY FOLDER
    // =========================
    public List<FileEntity> getFilesByFolder(String email, String folder) {
        return fileRepository.findByFolderAndOwnerEmail(folder, email);
    }

    // =========================
    // 📊 USER STATS
    // =========================
    public long getUserFileCount(String email) {
        return fileRepository.countByOwnerEmail(email);
    }

    public long getUserStorage(String email) {
        return fileRepository.findByOwnerEmail(email)
                .stream()
                .mapToLong(file -> file.getFileSize() != null ? file.getFileSize() : 0L)
                .sum();
    }

    // =========================
    // 🧑‍💼 ADMIN STATS
    // =========================
    public long getTotalFiles() {
        return fileRepository.count();
    }

    public long getTotalStorage() {
        return fileRepository.findAll()
                .stream()
                .mapToLong(file -> file.getFileSize() != null ? file.getFileSize() : 0L)
                .sum();
    }

    public List<FileEntity> getAllFiles() {
        return fileRepository.findAll()
                .stream()
                .sorted((a, b) -> compareUploadDates(b, a))
                .toList();
    }

    @Transactional
    public void deleteFileAsAdmin(Long fileId, String adminEmail) throws IOException {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        fileShareService.deleteSharesForFile(fileId);
        collaborationCommentRepository.deleteByFileId(fileId);

        minioStorageService.deleteFile(resolveStorageKey(file));
        fileRepository.delete(file);

        systemEventService.log(adminEmail, "ADMIN_DELETE_FILE",
                "Admin deleted " + file.getFileName());

        systemEventService.notifyAdmins("File Deleted by Admin",
                adminEmail + " deleted " + file.getFileName());
    }

    // =========================
    // 🔐 FILE ACCESS (FIXED)
    // =========================
    public FileEntity getFileIfAccessible(Long fileId, String userEmail) {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        boolean isOwner = file.getOwnerEmail().equals(userEmail);

        // ✅ FIX: allow VIEW OR DOWNLOAD
        boolean hasAccess = fileShareService.canViewFile(fileId, userEmail) ||
                fileShareService.canDownloadFile(fileId, userEmail);

        if (!isOwner && !hasAccess) {
            throw new RuntimeException("Unauthorized");
        }

        return file;
    }

    public byte[] getFileContent(Long fileId, String userEmail) {
        FileEntity file = getFileIfAccessible(fileId, userEmail);
        return minioStorageService.getFileBytes(resolveStorageKey(file));
    }

    public void replaceFileContent(Long fileId, String userEmail, byte[] content, String contentType) {
        FileEntity file = getFileIfAccessible(fileId, userEmail);

        if (!file.getOwnerEmail().equals(userEmail)) {
            throw new RuntimeException("Only the owner can edit this file");
        }

        minioStorageService.replaceFile(resolveStorageKey(file), content,
                contentType != null ? contentType : file.getContentType());
        file.setSize((long) content.length);
        file.setUploadDate(LocalDateTime.now());
        fileRepository.save(file);
    }

    private String resolveStorageKey(FileEntity file) {
        if (file.getStorageKey() != null && !file.getStorageKey().isBlank()) {
            return file.getStorageKey();
        }
        return file.getFileName();
    }

    private int compareUploadDates(FileEntity left, FileEntity right) {
        LocalDateTime leftDate = left.getUploadDate();
        LocalDateTime rightDate = right.getUploadDate();

        if (leftDate == null && rightDate == null) {
            return 0;
        }
        if (leftDate == null) {
            return -1;
        }
        if (rightDate == null) {
            return 1;
        }
        return leftDate.compareTo(rightDate);
    }

    // ── Public file access (no auth) ──
    public byte[] getPublicFileContent(Long fileId) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        return minioStorageService.getFileBytes(resolveStorageKey(file));
    }

    // ── Star / Unstar ──
    public String toggleStar(Long fileId, String userEmail) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getOwnerEmail().equals(userEmail))
            throw new RuntimeException("Unauthorized");
        file.setStarred(!file.isStarred());
        fileRepository.save(file);
        return file.isStarred() ? "Starred" : "Unstarred";
    }

    // ── Soft delete (move to trash) ──
    public void moveToTrash(Long fileId, String userEmail) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getOwnerEmail().equals(userEmail))
            throw new RuntimeException("Unauthorized");
        file.setDeleted(true);
        file.setDeletedAt(LocalDateTime.now());
        fileRepository.save(file);
        systemEventService.log(userEmail, "MOVE_TO_TRASH", "Moved " + file.getFileName() + " to trash");
    }

    // ── Get trash ──
    public List<FileEntity> getTrash(String userEmail) {

        return fileRepository.findByOwnerEmailAndDeletedTrue(userEmail);

    }

    // ── Restore from trash ──
    public void restoreFromTrash(Long fileId, String userEmail) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getOwnerEmail().equals(userEmail))
            throw new RuntimeException("Unauthorized");
        file.setDeleted(false);
        file.setDeletedAt(null);
        fileRepository.save(file);
        systemEventService.log(userEmail, "RESTORE_FROM_TRASH", "Restored " + file.getFileName());
    }

    // ── Empty trash (permanent delete) ──
    @Transactional
    public void emptyTrash(String userEmail) throws IOException {
        List<FileEntity> trashed = getTrash(userEmail);
        for (FileEntity file : trashed) {
            fileShareService.deleteSharesForFile(file.getId());
            collaborationCommentRepository.deleteByFileId(file.getId());
            minioStorageService.deleteFile(resolveStorageKey(file));
            fileRepository.delete(file);
        }
        systemEventService.log(userEmail, "EMPTY_TRASH", "Emptied trash (" + trashed.size() + " files)");
    }

    // ── Rename file ──
    public void renameFile(Long fileId, String newName, String userEmail) {
        if (newName == null || newName.isBlank())
            throw new RuntimeException("New name is required");
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getOwnerEmail().equals(userEmail))
            throw new RuntimeException("Unauthorized");
        file.setFileName(newName.trim());
        fileRepository.save(file);
        systemEventService.log(userEmail, "RENAME_FILE", "Renamed file to " + newName);
    }
}
