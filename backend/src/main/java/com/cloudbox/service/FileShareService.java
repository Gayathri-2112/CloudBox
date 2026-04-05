package com.cloudbox.service;

import com.cloudbox.dto.FileShareDTO;
import com.cloudbox.dto.ShareFileRequest;
import com.cloudbox.dto.ShareRecipientDTO;
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
    private final PermissionValidatorService permissionValidatorService;

    public FileShareService(
            FileRepository fileRepository,
            FileShareRepository fileShareRepository,
            UserRepository userRepository,
            SystemEventService systemEventService,
            PermissionValidatorService permissionValidatorService) {
        this.fileRepository = fileRepository;
        this.fileShareRepository = fileShareRepository;
        this.userRepository = userRepository;
        this.systemEventService = systemEventService;
        this.permissionValidatorService = permissionValidatorService;
    }

    public FileShareDTO shareFile(ShareFileRequest request, String ownerEmail) {

        if (request.getFileId() == null) {
            throw new RuntimeException("File is required");
        }

        // Check if new recipients format is being used
        if (request.getRecipients() != null && !request.getRecipients().isEmpty()) {
            return shareFileWithGranularPermissions(request, ownerEmail);
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

    /**
     * Share file with granular permissions for each recipient (new format)
     */
    public FileShareDTO shareFileWithGranularPermissions(ShareFileRequest request, String ownerEmail) {
        if (request.getFileId() == null)
            throw new RuntimeException("File is required");
        if (request.getRecipients() == null || request.getRecipients().isEmpty())
            throw new RuntimeException("At least one recipient is required");


        FileEntity file = fileRepository.findById(request.getFileId())
                .orElseThrow(() -> new RuntimeException("File not found"));

        // Share with first recipient and return that response
        ShareRecipientDTO firstRecipient = request.getRecipients().get(0);

        // Share with all recipients
        for (ShareRecipientDTO recipient : request.getRecipients()) {
            shareSingle(request.getFileId(), recipient.getEmail().trim(), recipient.getPermission(), ownerEmail);
        }

        // Return DTO with available permissions
        return shareSingle(request.getFileId(), firstRecipient.getEmail().trim(), firstRecipient.getPermission(),
                ownerEmail);
    }

    public List<FileShareDTO> shareFileWithMany(ShareFileRequest request, String ownerEmail) {
        if (request.getFileId() == null)
            throw new RuntimeException("File is required");
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

        // ✅ VALIDATE PERMISSION AGAINST FILE TYPE
        if (!permissionValidatorService.isPermissionAllowed(file.getFileName(), perm)) {
            List<String> allowed = permissionValidatorService.getAllowedPermissions(file.getFileName());
            throw new RuntimeException(
                    "Permission '" + perm + "' is not allowed for this file type. Allowed: " + allowed);
        }

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
                "Shared " + file.getFileName() + " with " + recipient.getEmail());
        systemEventService.notifyAdmins("File Shared",
                ownerEmail + " shared " + file.getFileName() + " with " + recipient.getEmail());
        systemEventService.notifyUser(
                recipient.getEmail(),
                "File Shared With You",
                ownerEmail + " shared " + file.getFileName() + " with permission " + permission);

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
                ownerEmail + " revoked your access to " + share.getFile().getFileName());
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
                "Your access to " + fileName + " was revoked by an administrator");
    }

    public FileShareDTO updateSharePermission(Long shareId, String newPermission, String ownerEmail) {
        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Share record not found"));

        // Verify owner
        if (!share.getOwnerEmail().equals(ownerEmail)) {
            throw new RuntimeException("Unauthorized: Only the owner can update share permissions");
        }

        String normalizedPermission = normalizePermission(newPermission);

        // Validate permission against file type
        if (!permissionValidatorService.isPermissionAllowed(share.getFile().getFileName(), normalizedPermission)) {
            List<String> allowed = permissionValidatorService.getAllowedPermissions(share.getFile().getFileName());
            throw new RuntimeException(
                    "Permission '" + normalizedPermission + "' is not allowed for this file type. Allowed: " + allowed);
        }

        share.setPermission(normalizedPermission);
        FileShare updatedShare = fileShareRepository.save(share);

        systemEventService.log(ownerEmail, "UPDATE_SHARE_PERMISSION",
                "Updated permission for " + share.getFile().getFileName() + " shared with " + share.getSharedWith()
                        + " to " + normalizedPermission);
        systemEventService.notifyUser(
                share.getSharedWith(),
                "Share Permission Updated",
                ownerEmail + " updated your permission for " + share.getFile().getFileName() + " to "
                        + normalizedPermission);

        return mapToDto(updatedShare);
    }

    public boolean canViewFile(Long fileId, String userEmail) {
        return fileShareRepository
                .findByFileIdAndSharedWith(fileId, userEmail)
                .map(share -> share.getPermission().equals("VIEW") ||
                        share.getPermission().equals("DOWNLOAD"))
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
        dto.setFileType(share.getFile().getFileType());
        dto.setFileSize(share.getFile().getFileSize());
        dto.setFileUrl(share.getFile().getFileUrl());
        dto.setOwnerEmail(share.getOwnerEmail());
        dto.setSharedWith(share.getSharedWith());
        dto.setPermission(share.getPermission());
        dto.setCreatedAt(share.getCreatedAt());

        // ✅ SET AVAILABLE PERMISSIONS BASED ON FILE TYPE
        dto.setAvailablePermissions(
                permissionValidatorService.getAllowedPermissions(share.getFile().getFileName()));

        dto.setCanView(
                "VIEW".equalsIgnoreCase(share.getPermission()) ||
                        "DOWNLOAD".equalsIgnoreCase(share.getPermission()));

        dto.setCanDownload(
                "DOWNLOAD".equalsIgnoreCase(share.getPermission()) ||
                        "EDIT".equalsIgnoreCase(share.getPermission()));

        dto.setCanEdit(
                "EDIT".equalsIgnoreCase(share.getPermission()));

        return dto;
    }
}
