package com.cloudbox.controller;

import com.cloudbox.dto.FileShareDTO;
import com.cloudbox.dto.FolderRequest;
import com.cloudbox.dto.MoveFileRequest;
import com.cloudbox.dto.RenameFolderRequest;
import com.cloudbox.dto.ShareFileRequest;
import com.cloudbox.dto.CollaborationCommentDTO;
import com.cloudbox.dto.CollaborationCommentRequest;
import com.cloudbox.dto.CollaborationFileDTO;
import com.cloudbox.model.FileEntity;
import com.cloudbox.service.CollaborationService;
import com.cloudbox.service.FolderService;
import com.cloudbox.service.FileShareService;
import com.cloudbox.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileService fileService;

    @Autowired
    private FileShareService fileShareService;

    @Autowired
    private FolderService folderService;

    @Autowired
    private CollaborationService collaborationService;

    @PostMapping("/upload")
    public ResponseEntity<FileEntity> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "root") String folder,
            Authentication auth
    ) throws Exception {

        String email = auth.getName();
        return ResponseEntity.ok(fileService.uploadFile(file, email, folder));
    }

    @GetMapping
    public ResponseEntity<List<FileEntity>> getFiles(Authentication auth) {
        return ResponseEntity.ok(fileService.getUserFiles(auth.getName()));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<ByteArrayResource> download(
            @PathVariable Long id,
            Authentication auth
    ) throws Exception {

        byte[] data = fileService.downloadFile(id, auth.getName());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=file")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new ByteArrayResource(data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(
            @PathVariable Long id,
            Authentication auth
    ) throws Exception {

        fileService.deleteFile(id, auth.getName());
        return ResponseEntity.ok("File deleted");
    }

    @PostMapping("/share")
    public ResponseEntity<FileShareDTO> shareFile(
            @RequestBody ShareFileRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(fileShareService.shareFile(request, auth.getName()));
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<List<FileShareDTO>> getSharedWithMe(Authentication auth) {
        return ResponseEntity.ok(fileShareService.getFilesSharedWithUser(auth.getName()));
    }

    @GetMapping("/shared-by-me")
    public ResponseEntity<List<FileShareDTO>> getSharedByMe(Authentication auth) {
        return ResponseEntity.ok(fileShareService.getFilesSharedByUser(auth.getName()));
    }

    @DeleteMapping("/shares/{id}")
    public ResponseEntity<String> revokeShare(@PathVariable Long id, Authentication auth) {
        fileShareService.revokeShareByOwner(id, auth.getName());
        return ResponseEntity.ok("Share revoked");
    }

    @GetMapping("/folders")
    public ResponseEntity<List<String>> getFolders(Authentication auth) {
        return ResponseEntity.ok(folderService.getUserFolders(auth.getName()));
    }

    @PostMapping("/folders")
    public ResponseEntity<String> createFolder(@RequestBody FolderRequest request, Authentication auth) throws Exception {
        folderService.createFolder(auth.getName(), request.getName());
        return ResponseEntity.ok("Folder created");
    }

    @PutMapping("/folders/rename")
    public ResponseEntity<String> renameFolder(
            @RequestBody RenameFolderRequest request,
            Authentication auth
    ) throws Exception {
        folderService.renameFolder(auth.getName(), request.getOldName(), request.getNewName());
        return ResponseEntity.ok("Folder renamed");
    }

    @DeleteMapping("/folders/{name}")
    public ResponseEntity<String> deleteFolder(@PathVariable String name, Authentication auth) throws Exception {
        folderService.deleteFolder(auth.getName(), name);
        return ResponseEntity.ok("Folder deleted");
    }

    @PutMapping("/move")
    public ResponseEntity<FileEntity> moveFile(@RequestBody MoveFileRequest request, Authentication auth) throws Exception {
        return ResponseEntity.ok(folderService.moveFile(auth.getName(), request.getFileId(), request.getTargetFolder()));
    }

    @GetMapping("/collaboration")
    public ResponseEntity<List<CollaborationFileDTO>> getCollaborationFiles(Authentication auth) {
        return ResponseEntity.ok(collaborationService.getAccessibleCollaborationFiles(auth.getName()));
    }

    @GetMapping("/collaboration/{fileId}/comments")
    public ResponseEntity<List<CollaborationCommentDTO>> getComments(
            @PathVariable Long fileId,
            Authentication auth
    ) {
        return ResponseEntity.ok(collaborationService.getCommentsForFile(fileId, auth.getName()));
    }

    @PostMapping("/collaboration/comment")
    public ResponseEntity<CollaborationCommentDTO> addComment(
            @RequestBody CollaborationCommentRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(collaborationService.addComment(request, auth.getName()));
    }
}
