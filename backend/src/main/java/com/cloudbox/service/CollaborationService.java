package com.cloudbox.service;

import com.cloudbox.dto.CollaborationCommentDTO;
import com.cloudbox.dto.CollaborationCommentRequest;
import com.cloudbox.dto.CollaborationFileDTO;
import com.cloudbox.model.CollaborationComment;
import com.cloudbox.model.FileEntity;
import com.cloudbox.model.FileShare;
import com.cloudbox.repository.CollaborationCommentRepository;
import com.cloudbox.repository.FileRepository;
import com.cloudbox.repository.FileShareRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CollaborationService {

    private final FileRepository fileRepository;
    private final FileShareRepository fileShareRepository;
    private final CollaborationCommentRepository collaborationCommentRepository;
    private final SystemEventService systemEventService;

    public CollaborationService(
            FileRepository fileRepository,
            FileShareRepository fileShareRepository,
            CollaborationCommentRepository collaborationCommentRepository,
            SystemEventService systemEventService
    ) {
        this.fileRepository = fileRepository;
        this.fileShareRepository = fileShareRepository;
        this.collaborationCommentRepository = collaborationCommentRepository;
        this.systemEventService = systemEventService;
    }

    public List<CollaborationFileDTO> getAccessibleCollaborationFiles(String userEmail) {
        Map<Long, CollaborationFileDTO> files = new LinkedHashMap<>();

        fileShareRepository.findByOwnerEmailOrderByCreatedAtDesc(userEmail)
                .forEach(share -> files.putIfAbsent(share.getFile().getId(), mapFile(share.getFile(), "OWNER", "FULL")));

        fileShareRepository.findBySharedWithOrderByCreatedAtDesc(userEmail)
                .forEach(share -> files.putIfAbsent(
                        share.getFile().getId(),
                        mapFile(share.getFile(), "SHARED_WITH_ME", share.getPermission())
                ));

        files.values().forEach(file -> file.setComments(getCommentsForFile(file.getFileId(), userEmail)));

        return files.values().stream().toList();
    }

    public List<CollaborationCommentDTO> getCommentsForFile(Long fileId, String userEmail) {
        ensureCollaborationAccess(fileId, userEmail);

        return collaborationCommentRepository.findByFileIdOrderByCreatedAtAsc(fileId)
                .stream()
                .map(this::mapComment)
                .toList();
    }

    public CollaborationCommentDTO addComment(CollaborationCommentRequest request, String userEmail) {
        if (request.getFileId() == null) {
            throw new RuntimeException("File is required");
        }

        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new RuntimeException("Comment message is required");
        }

        FileEntity file = ensureCollaborationAccess(request.getFileId(), userEmail);

        CollaborationComment comment = new CollaborationComment();
        comment.setFile(file);
        comment.setUserEmail(userEmail);
        comment.setMessage(request.getMessage().trim());
        comment.setCreatedAt(LocalDateTime.now());

        CollaborationComment savedComment = collaborationCommentRepository.save(comment);

        systemEventService.log(userEmail, "COLLAB_COMMENT",
                "Commented on " + file.getFileName());

        if (!file.getOwnerEmail().equals(userEmail)) {
            systemEventService.notifyUser(
                    file.getOwnerEmail(),
                    "New Collaboration Comment",
                    userEmail + " commented on " + file.getFileName()
            );
        }

        fileShareRepository.findByFileId(file.getId()).stream()
                .map(FileShare::getSharedWith)
                .filter(sharedWith -> !sharedWith.equals(userEmail))
                .distinct()
                .forEach(sharedWith -> systemEventService.notifyUser(
                        sharedWith,
                        "New Collaboration Comment",
                        userEmail + " added a comment on " + file.getFileName()
                ));

        return mapComment(savedComment);
    }

    private FileEntity ensureCollaborationAccess(Long fileId, String userEmail) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        boolean isOwner = file.getOwnerEmail().equals(userEmail);
        boolean isSharedUser = fileShareRepository.findByFileIdAndSharedWith(fileId, userEmail).isPresent();

        if (!isOwner && !isSharedUser) {
            throw new RuntimeException("Unauthorized");
        }

        return file;
    }

    private CollaborationFileDTO mapFile(FileEntity file, String accessType, String permission) {
        CollaborationFileDTO dto = new CollaborationFileDTO();
        dto.setFileId(file.getId());
        dto.setFileName(file.getFileName());
        dto.setOwnerEmail(file.getOwnerEmail());
        dto.setAccessType(accessType);
        dto.setPermission(permission);
        return dto;
    }

    private CollaborationCommentDTO mapComment(CollaborationComment comment) {
        CollaborationCommentDTO dto = new CollaborationCommentDTO();
        dto.setId(comment.getId());
        dto.setFileId(comment.getFile().getId());
        dto.setFileName(comment.getFile().getFileName());
        dto.setUserEmail(comment.getUserEmail());
        dto.setMessage(comment.getMessage());
        dto.setCreatedAt(comment.getCreatedAt());
        return dto;
    }
}
