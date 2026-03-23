package com.cloudbox.repository;

import com.cloudbox.model.FolderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<FolderEntity, Long> {

    List<FolderEntity> findByOwnerEmailOrderByNameAsc(String ownerEmail);

    Optional<FolderEntity> findByOwnerEmailAndName(String ownerEmail, String name);

    boolean existsByOwnerEmailAndName(String ownerEmail, String name);
}
