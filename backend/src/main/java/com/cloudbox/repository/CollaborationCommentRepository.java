package com.cloudbox.repository;

import com.cloudbox.model.CollaborationComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CollaborationCommentRepository extends JpaRepository<CollaborationComment, Long> {

    List<CollaborationComment> findByFileIdOrderByCreatedAtAsc(Long fileId);
}
