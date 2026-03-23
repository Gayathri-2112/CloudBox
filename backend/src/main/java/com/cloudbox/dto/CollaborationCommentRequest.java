package com.cloudbox.dto;

public class CollaborationCommentRequest {

    private Long fileId;
    private String message;

    public Long getFileId() {
        return fileId;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
