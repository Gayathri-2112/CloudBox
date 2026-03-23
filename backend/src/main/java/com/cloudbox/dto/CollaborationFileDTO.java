package com.cloudbox.dto;

import java.util.List;

public class CollaborationFileDTO {

    private Long fileId;
    private String fileName;
    private String ownerEmail;
    private String accessType;
    private String permission;
    private List<CollaborationCommentDTO> comments;

    public Long getFileId() {
        return fileId;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getAccessType() {
        return accessType;
    }

    public void setAccessType(String accessType) {
        this.accessType = accessType;
    }

    public String getPermission() {
        return permission;
    }

    public void setPermission(String permission) {
        this.permission = permission;
    }

    public List<CollaborationCommentDTO> getComments() {
        return comments;
    }

    public void setComments(List<CollaborationCommentDTO> comments) {
        this.comments = comments;
    }
}
