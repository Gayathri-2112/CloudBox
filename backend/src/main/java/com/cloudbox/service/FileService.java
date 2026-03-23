package com.cloudbox.service;

import com.cloudbox.model.FileEntity;
import com.cloudbox.model.AdminSetting;
import com.cloudbox.repository.AdminSettingRepository;
import com.cloudbox.repository.FileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FileService {

    private final String uploadDir = "uploads/";

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private AdminSettingRepository adminSettingRepository;

    @Autowired
    private SystemEventService systemEventService;

    @Autowired
    private FileShareService fileShareService;

    @Autowired
    private FolderService folderService;

    // =========================
    // 📤 UPLOAD FILE
    // =========================
    public FileEntity uploadFile(MultipartFile file, String userEmail, String folder) throws IOException {

        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        if (folder == null || folder.isEmpty()) {
            folder = "root";
        }

        folderService.ensureFolderExists(userEmail, folder);

        AdminSetting settings = adminSettingRepository.findById(1L).orElse(null);
        if (settings != null && settings.getStorageLimit() != null && settings.getStorageLimit() > 0) {
            long maxBytes = settings.getStorageLimit() * 1024 * 1024;
            long currentUsage = getUserStorage(userEmail);
            if (currentUsage + file.getSize() > maxBytes) {
                throw new RuntimeException("Storage limit exceeded for this user");
            }
        }

        File directory = new File(uploadDir + userEmail + "/" + folder);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String uniqueName = UUID.randomUUID() + "_" + file.getOriginalFilename();

        Path filePath = Paths.get(directory.getAbsolutePath(), uniqueName);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        FileEntity entity = new FileEntity();
        entity.setFileName(file.getOriginalFilename());
        entity.setFileType(file.getContentType());
        entity.setFilePath(filePath.toString());
        entity.setFileSize(file.getSize());
        entity.setOwnerEmail(userEmail);
        entity.setFolder(folder);
        entity.setUploadedAt(LocalDateTime.now());

        FileEntity savedFile = fileRepository.save(entity);
        systemEventService.log(userEmail, "UPLOAD_FILE", "Uploaded " + savedFile.getFileName() + " to folder " + folder);
        systemEventService.notifyAdmins("File Uploaded", userEmail + " uploaded " + savedFile.getFileName());

        return savedFile;
    }

    // =========================
    // 📥 DOWNLOAD FILE
    // =========================
    public byte[] downloadFile(Long fileId, String userEmail) throws IOException {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        boolean isOwner = file.getOwnerEmail().equals(userEmail);
        boolean hasShareAccess = fileShareService.canDownloadFile(fileId, userEmail);

        if (!isOwner && !hasShareAccess) {
            throw new RuntimeException("Unauthorized");
        }

        if (isOwner) {
            systemEventService.log(userEmail, "DOWNLOAD_FILE", "Downloaded own file " + file.getFileName());
        } else {
            systemEventService.log(userEmail, "DOWNLOAD_SHARED_FILE",
                    "Downloaded shared file " + file.getFileName() + " from " + file.getOwnerEmail());
            systemEventService.notifyUser(
                    file.getOwnerEmail(),
                    "Shared File Downloaded",
                    userEmail + " downloaded your shared file " + file.getFileName()
            );
        }

        return Files.readAllBytes(Paths.get(file.getFilePath()));
    }

    // =========================
    // ❌ DELETE FILE
    // =========================
    public void deleteFile(Long fileId, String userEmail) throws IOException {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwnerEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        fileShareService.deleteSharesForFile(fileId);
        Files.deleteIfExists(Paths.get(file.getFilePath()));
        fileRepository.delete(file);
        systemEventService.log(userEmail, "DELETE_FILE", "Deleted file " + file.getFileName());
    }

    // =========================
    // 📂 USER FILES
    // =========================
    public List<FileEntity> getUserFiles(String email) {
        return fileRepository.findByOwnerEmail(email);
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
                .mapToLong(FileEntity::getFileSize)
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
                .mapToLong(FileEntity::getFileSize)
                .sum();
    }

    public List<FileEntity> getAllFiles() {
        return fileRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getUploadedAt().compareTo(a.getUploadedAt()))
                .toList();
    }

    public void deleteFileAsAdmin(Long fileId, String adminEmail) throws IOException {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        fileShareService.deleteSharesForFile(fileId);
        Files.deleteIfExists(Paths.get(file.getFilePath()));
        fileRepository.delete(file);

        systemEventService.log(adminEmail, "ADMIN_DELETE_FILE",
                "Admin deleted " + file.getFileName() + " owned by " + file.getOwnerEmail());
        systemEventService.notifyAdmins("File Deleted by Admin",
                adminEmail + " deleted " + file.getFileName() + " owned by " + file.getOwnerEmail());
    }
}
