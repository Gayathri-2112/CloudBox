package com.cloudbox.service;

import com.cloudbox.model.FileEntity;
import com.cloudbox.model.PublicFileLink;
import com.cloudbox.repository.FileRepository;
import com.cloudbox.repository.PublicFileLinkRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PublicLinkService {

    private final PublicFileLinkRepository linkRepository;
    private final FileRepository fileRepository;
    private final SystemEventService systemEventService;

    public PublicLinkService(PublicFileLinkRepository linkRepository,
                             FileRepository fileRepository,
                             SystemEventService systemEventService) {
        this.linkRepository = linkRepository;
        this.fileRepository = fileRepository;
        this.systemEventService = systemEventService;
    }

    public Map<String, String> createLink(Long fileId, String ownerEmail,
                                          String permission, Integer expiryHours) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwnerEmail().equals(ownerEmail))
            throw new RuntimeException("Only the file owner can create public links");

        String perm = (permission == null || permission.isBlank()) ? "VIEW" : permission.toUpperCase();
        if (!perm.equals("VIEW") && !perm.equals("DOWNLOAD") && !perm.equals("EDIT"))
            throw new RuntimeException("Permission must be VIEW, DOWNLOAD or EDIT");

        String token = UUID.randomUUID().toString().replace("-", "");

        PublicFileLink link = new PublicFileLink();
        link.setToken(token);
        link.setFile(file);
        link.setOwnerEmail(ownerEmail);
        link.setPermission(perm);
        link.setCreatedAt(LocalDateTime.now());
        if (expiryHours != null && expiryHours > 0)
            link.setExpiresAt(LocalDateTime.now().plusHours(expiryHours));

        linkRepository.save(link);
        systemEventService.log(ownerEmail, "CREATE_PUBLIC_LINK",
                "Created public link for " + file.getFileName());

        return Map.of("token", token, "permission", perm);
    }

    public PublicFileLink validateToken(String token) {
        PublicFileLink link = linkRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Link not found or invalid"));
        if (link.isExpired())
            throw new RuntimeException("This link has expired");
        return link;
    }

    public List<PublicFileLink> getLinksForFile(Long fileId, String ownerEmail) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getOwnerEmail().equals(ownerEmail))
            throw new RuntimeException("Unauthorized");
        return linkRepository.findByFileId(fileId);
    }

    public void revokeLink(String token, String ownerEmail) {
        PublicFileLink link = linkRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Link not found"));
        if (!link.getOwnerEmail().equals(ownerEmail))
            throw new RuntimeException("Unauthorized");
        linkRepository.delete(link);
        systemEventService.log(ownerEmail, "REVOKE_PUBLIC_LINK",
                "Revoked public link for " + link.getFile().getFileName());
    }

    public void updateLinkPermission(String token, String ownerEmail, String newPermission) {
        PublicFileLink link = linkRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Link not found"));
        if (!link.getOwnerEmail().equals(ownerEmail))
            throw new RuntimeException("Unauthorized");
        String perm = newPermission.toUpperCase();
        if (!perm.equals("VIEW") && !perm.equals("DOWNLOAD") && !perm.equals("EDIT"))
            throw new RuntimeException("Permission must be VIEW, DOWNLOAD or EDIT");
        link.setPermission(perm);
        linkRepository.save(link);
        systemEventService.log(ownerEmail, "UPDATE_PUBLIC_LINK_PERMISSION",
                "Updated public link permission for " + link.getFile().getFileName() + " to " + perm);
    }
}
