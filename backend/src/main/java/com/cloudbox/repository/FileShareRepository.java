package com.cloudbox.repository;

import com.cloudbox.model.FileShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FileShareRepository extends JpaRepository<FileShare, Long> {

    List<FileShare> findBySharedWithOrderByCreatedAtDesc(String sharedWith);

    List<FileShare> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);

    List<FileShare> findByFileId(Long fileId);

    List<FileShare> findAllByOrderByCreatedAtDesc();

    Optional<FileShare> findByFileIdAndSharedWith(Long fileId, String sharedWith);

    boolean existsByFileIdAndSharedWith(Long fileId, String sharedWith);
}
