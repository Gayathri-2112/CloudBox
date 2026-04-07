package com.cloudbox.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "files")
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "file_size")
    private Long size;

    @Column(name = "file_type")
    private String contentType;

    @JsonIgnore
    @Column(name = "storage_key")
    private String storageKey;

    private String ownerEmail;
    private String folder;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadDate;

    private boolean starred = false;
    private boolean deleted = false;
    private LocalDateTime deletedAt;
    private LocalDateTime lastModifiedAt;

    public FileEntity() {
    }

    // ✅ GETTERS & SETTERS

    public Long getId() {
        return id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getFolder() {
        return folder;
    }

    public void setFolder(String folder) {
        this.folder = folder;
    }

    public LocalDateTime getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(LocalDateTime uploadDate) {
        this.uploadDate = uploadDate;
    }

    public Long getFileSize() {
        return size;
    }

    public void setFileSize(Long fileSize) {
        this.size = fileSize;
    }

    public String getFileType() {
        return contentType;
    }

    public void setFileType(String fileType) {
        this.contentType = fileType;
    }

    public LocalDateTime getUploadedAt() {
        return uploadDate;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadDate = uploadedAt;
    }

    public boolean isStarred() { return starred; }
    public void setStarred(boolean starred) { this.starred = starred; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public LocalDateTime getLastModifiedAt() { return lastModifiedAt; }
    public void setLastModifiedAt(LocalDateTime lastModifiedAt) { this.lastModifiedAt = lastModifiedAt; }
}
