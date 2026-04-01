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

        // resolve single recipient from either field
        String recipient = request.getSharedWith();
        if ((recipient == null || recipient.isBlank())
                && request.getSharedWithList() != null
                && !request.getSharedWithList().isEmpty()) {
            recipient = request.getSharedWithList().get(0);
        }

        if (recipient == null || recipient.isBlank()) {
            throw new RuntimeException("Recipient email is required");
        }

        return shareSingle(request.getFileId(), recipient.trim(), request.getPermission(), ownerEmail);
    }

    public List<FileShareDTO> shareFileWithMany(ShareFileRequest request, String ownerEmail) {
        if (request.getFileId() == null) throw new RuntimeException("File is required");
        if (request.getSharedWithList() == null || request.getSharedWithList().isEmpty())
            throw new RuntimeException("At least one recipient is required");

        return request.getSharedWithList().stream()
                .map(email -> shareSingle(request.getFileId(), email.trim(), request.getPermission(), ownerEmail))
                .toList();
    }

    private FileShareDTO shareSingle(Long fileId, String recipientEmail, String permission, String ownerEmail) {

        String perm = normalizePermission(permission);

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwnerEmail().equals(ownerEmail)) {
            throw new RuntimeException("You can only share your own files");
        }

        User recipient = userRepository.findByEmail(recipientEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + recipientEmail));

        if (recipient.getRole().name().equals("ADMIN")) {
            throw new RuntimeException("Files cannot be shared with admin");
        }

        if (recipient.getEmail().equals(ownerEmail)) {
            throw new RuntimeException("You cannot share a file with yourself");
        }

        if (fileShareRepository.existsByFileIdAndSharedWith(file.getId(), recipient.getEmail())) {
            // update permission instead of throwing
            FileShare existing = fileShareRepository.findByFileIdAndSharedWith(file.getId(), recipient.getEmail())
                    .orElseThrow();
            existing.setPermission(perm);
            return mapToDto(fileShareRepository.save(existing));
        }

        FileShare share = new FileShare();
        share.setFile(file);
        share.setOwnerEmail(ownerEmail);
        share.setSharedWith(recipient.getEmail());
        share.setPermission(perm);
        share.setCreatedAt(LocalDateTime.now());

        FileShare savedShare = fileShareRepository.save(share);

        systemEventService.log(ownerEmail, "SHARE_FILE",
                "Shared " + file.getFileName() + " with " + recipient.getEmail() + " [" + perm + "]");
        systemEventService.notifyUser(recipient.getEmail(), "File Shared With You",
                ownerEmail + " shared " + file.getFileName() + " with " + perm + " permission");

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
    
    public boolean canViewFile(Long fileId, String userEmail) {
        return fileShareRepository
                .findByFileIdAndSharedWith(fileId, userEmail)
                .map(share -> {
                    String p = share.getPermission();
                    return p.equals("VIEW") || p.equals("DOWNLOAD") || p.equals("EDIT");
                })
                .orElse(false);
    }

    public boolean canDownloadFile(Long fileId, String userEmail) {
        return fileShareRepository.findByFileIdAndSharedWith(fileId, userEmail)
                .map(share -> "DOWNLOAD".equalsIgnoreCase(share.getPermission())
                           || "EDIT".equalsIgnoreCase(share.getPermission()))
                .orElse(false);
    }

    public boolean canEditFile(Long fileId, String userEmail) {
        return fileShareRepository.findByFileIdAndSharedWith(fileId, userEmail)
                .map(share -> "EDIT".equalsIgnoreCase(share.getPermission()))
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
        if (!normalized.equals("VIEW") && !normalized.equals("DOWNLOAD") && !normalized.equals("EDIT")) {
            throw new RuntimeException("Permission must be VIEW, DOWNLOAD, or EDIT");
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
        dto.setCanView(
    "VIEW".equalsIgnoreCase(share.getPermission()) ||
    "DOWNLOAD".equalsIgnoreCase(share.getPermission()) ||
    "EDIT".equalsIgnoreCase(share.getPermission())
);
        dto.setCanDownload(
    "DOWNLOAD".equalsIgnoreCase(share.getPermission()) ||
    "EDIT".equalsIgnoreCase(share.getPermission())
);
        dto.setCanEdit("EDIT".equalsIgnoreCase(share.getPermission()));
        return dto;
    }
}
