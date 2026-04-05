package com.cloudbox.repository;

import com.cloudbox.model.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FileRepository extends JpaRepository<FileEntity, Long> {

    // ✅ User files
    List<FileEntity> findByOwnerEmail(String email);

    // ✅ Folder-based files
    List<FileEntity> findByFolderAndOwnerEmail(String folder, String email);

    // ✅ Count files per user (dashboard)
    long countByOwnerEmail(String email);


    // ✅ Non-deleted files only
    List<FileEntity> findByOwnerEmailAndDeletedFalse(String email);

    // ✅ Trashed files
    List<FileEntity> findByOwnerEmailAndDeletedTrue(String email);


    // ✅ Get all files (admin)
    List<FileEntity> findAll();

}