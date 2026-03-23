package com.cloudbox.service;

import com.cloudbox.dto.FileShareDTO;
import com.cloudbox.dto.ShareFileRequest;
import com.cloudbox.model.FileEntity;
import com.cloudbox.model.FileShare;
import com.cloudbox.model.User;
import com.cloudbox.repository.FileRepository;
import com.cloudbox.repository.FileShareRepository;
import com.cloudbox.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FileShareService {

    private final FileRepository fileRepository;
    private final FileShareRepository fileShareRepository;
    private final UserRepository userRepository;
    private final SystemEventService systemEventService;

    public FileShareService(
            FileRepository fileRepository,
            FileShareRepository fileShareRepository,
            UserRepository userRepository,
            SystemEventService systemEventService
    ) {
        this.fileRepository = fileRepository;
        this.fileShareRepository = fileShareRepository;
        this.userRepository = userRepository;
        this.systemEventService = systemEventService;
    }

    public FileShareDTO shareFile(ShareFileRequest request, String ownerEmail) {

        if (request.getFileId() == null) {
            throw new RuntimeException("File is required");
        }

        if (request.getSharedWith() == null || request.getSharedWith().isBlank()) {
            throw new RuntimeException("Recipient email is required");
        }

        String permission = normalizePermission(request.getPermission());

        FileEntity file = fileRepository.findById(request.getFileId())
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwnerEmail().equals(ownerEmail)) {
            throw new RuntimeException("You can only share your own files");
        }

        User recipient = userRepository.findByEmail(request.getSharedWith().trim())
                .orElseThrow(() -> new RuntimeException("Recipient user not found"));

        if (recipient.getEmail().equals(ownerEmail)) {
            throw new RuntimeException("You cannot share a file with yourself");
        }

        if (fileShareRepository.existsByFileIdAndSharedWith(file.getId(), recipient.getEmail())) {
            throw new RuntimeException("File is already shared with this user");
        }

        FileShare share = new FileShare();
        share.setFile(file);
        share.setOwnerEmail(ownerEmail);
        share.setSharedWith(recipient.getEmail());
        share.setPermission(permission);
        share.setCreatedAt(LocalDateTime.now());

        FileShare savedShare = fileShareRepository.save(share);

        systemEventService.log(ownerEmail, "SHARE_FILE",
                "Shared " + file.getFileName() + " with " + recipient.getEmail());
        systemEventService.notifyAdmins("File Shared",
                ownerEmail + " shared " + file.getFileName() + " with " + recipient.getEmail());
        systemEventService.notifyUser(
                recipient.getEmail(),
                "File Shared With You",
                ownerEmail + " shared " + file.getFileName() + " with permission " + permission
        );

        return mapToDto(savedShare);
    }

    public List<FileShareDTO> getFilesSharedWithUser(String userEmail) {
        return fileShareRepository.findBySharedWithOrderByCreatedAtDesc(userEmail)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    public List<FileShareDTO> getFilesSharedByUser(String ownerEmail) {
        return fileShareRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    public List<FileShareDTO> getAllShares() {
        return fileShareRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    public void revokeShareByOwner(Long shareId, String ownerEmail) {
        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Share record not found"));

        if (!share.getOwnerEmail().equals(ownerEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        fileShareRepository.delete(share);
        systemEventService.log(ownerEmail, "REVOKE_SHARE",
                "Revoked access to " + share.getFile().getFileName() + " for " + share.getSharedWith());
        systemEventService.notifyUser(
                share.getSharedWith(),
                "Share Revoked",
                ownerEmail + " revoked your access to " + share.getFile().getFileName()
        );
    }

    public void revokeShareAsAdmin(Long shareId, String adminEmail) {
        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Share record not found"));

        String fileName = share.getFile().getFileName();
        String owner = share.getOwnerEmail();
        String sharedWith = share.getSharedWith();

        fileShareRepository.delete(share);

        systemEventService.log(adminEmail, "ADMIN_REVOKE_SHARE",
                "Admin revoked access to " + fileName + " shared by " + owner + " with " + sharedWith);
        systemEventService.notifyAdmins("Share Revoked by Admin",
                adminEmail + " revoked a share for " + fileName);
        systemEventService.notifyUser(
                sharedWith,
                "Share Revoked by Admin",
                "Your access to " + fileName + " was revoked by an administrator"
        );
    }

    public boolean canDownloadFile(Long fileId, String userEmail) {
        return fileShareRepository.findByFileIdAndSharedWith(fileId, userEmail)
                .map(share -> "DOWNLOAD".equalsIgnoreCase(share.getPermission()))
                .orElse(false);
    }

    public void deleteSharesForFile(Long fileId) {
        List<FileShare> shares = fileShareRepository.findByFileId(fileId);
        if (!shares.isEmpty()) {
            fileShareRepository.deleteAll(shares);
        }
    }

    private String normalizePermission(String permission) {
        if (permission == null || permission.isBlank()) {
            return "VIEW";
        }

        String normalized = permission.trim().toUpperCase();
        if (!normalized.equals("VIEW") && !normalized.equals("DOWNLOAD")) {
            throw new RuntimeException("Permission must be VIEW or DOWNLOAD");
        }

        return normalized;
    }

    private FileShareDTO mapToDto(FileShare share) {
        FileShareDTO dto = new FileShareDTO();
        dto.setId(share.getId());
        dto.setFileId(share.getFile().getId());
        dto.setFileName(share.getFile().getFileName());
        dto.setOwnerEmail(share.getOwnerEmail());
        dto.setSharedWith(share.getSharedWith());
        dto.setPermission(share.getPermission());
        dto.setCreatedAt(share.getCreatedAt());
        return dto;
    }
}
