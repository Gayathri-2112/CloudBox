package com.cloudbox.controller;

import com.cloudbox.dto.FileShareDTO;
import com.cloudbox.dto.FileUploadResponse;
import com.cloudbox.dto.FileViewInfoDTO;
import com.cloudbox.dto.FolderRequest;
import com.cloudbox.dto.MoveFileRequest;
import com.cloudbox.dto.RenameFolderRequest;
import com.cloudbox.dto.ShareFileRequest;
import com.cloudbox.dto.CollaborationCommentDTO;
import com.cloudbox.dto.CollaborationCommentRequest;
import com.cloudbox.dto.CollaborationFileDTO;
import com.cloudbox.dto.PermissionFileMetadataDTO;
import com.cloudbox.model.FileEntity;
import com.cloudbox.repository.FileRepository;
import com.cloudbox.service.CollaborationService;
import com.cloudbox.service.FolderService;
import com.cloudbox.service.FileShareService;
import com.cloudbox.service.FileService;
import com.cloudbox.service.MinioStorageService;
import com.cloudbox.service.PermissionValidatorService;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;
    private final FileShareService fileShareService;
    private final FolderService folderService;
    private final CollaborationService collaborationService;
    private final PermissionValidatorService permissionValidatorService;
    private final MinioStorageService storageService;
    private final FileRepository fileRepository;

    public FileController(
            FileService fileService,
            FileShareService fileShareService,
            FolderService folderService,
            CollaborationService collaborationService,
            PermissionValidatorService permissionValidatorService,
            MinioStorageService storageService,
            FileRepository fileRepository) {
        this.fileService = fileService;
        this.fileShareService = fileShareService;
        this.folderService = folderService;
        this.collaborationService = collaborationService;
        this.permissionValidatorService = permissionValidatorService;
        this.storageService = storageService;
        this.fileRepository = fileRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "root") String folder,
            Authentication auth) throws Exception {

        String email = auth.getName();
        FileEntity savedFile = fileService.uploadFile(file, email, folder);
        return ResponseEntity.ok(new FileUploadResponse(savedFile.getFileName(), savedFile.getFileUrl()));
    }

    @GetMapping
    public ResponseEntity<List<FileEntity>> getFiles(Authentication auth) {
        return ResponseEntity.ok(fileService.getUserFiles(auth.getName()));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<ByteArrayResource> download(
            @PathVariable Long id,
            Authentication auth) throws Exception {
        FileEntity file = fileService.getFileForDownload(id, auth.getName());

        String key = file.getStorageKey();
        if (key == null || key.isBlank()) {
            String url = file.getFileUrl();
            if (url != null && url.contains("/")) key = url.substring(url.lastIndexOf("/") + 1);
        }
        if (key == null || key.isBlank()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        byte[] content = storageService.getFileBytes(key);
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.getFileName()).build().toString())
                .contentLength(content.length)
                .body(new ByteArrayResource(content));
    }

    @GetMapping("/download-url/{id}")
    public ResponseEntity<FileViewInfoDTO> downloadUrl(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(new FileViewInfoDTO(fileService.getDownloadUrl(id, auth.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(
            @PathVariable Long id,
            Authentication auth) throws Exception {

        fileService.deleteFile(id, auth.getName());
        return ResponseEntity.ok("File deleted");
    }

    @GetMapping("/{fileId}/available-permissions")
    public ResponseEntity<PermissionFileMetadataDTO> getAvailablePermissions(
            @PathVariable Long fileId,
            Authentication auth) {
        FileEntity file = fileService.getFileById(fileId);

        if (!file.getOwnerEmail().equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<String> availablePermissions = permissionValidatorService.getAllowedPermissions(file.getFileName());
        PermissionFileMetadataDTO response = new PermissionFileMetadataDTO(
                file.getId(),
                file.getFileName(),
                file.getContentType(),
                file.getSize(),
                availablePermissions);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/share")
    public ResponseEntity<FileShareDTO> shareFile(
            @RequestBody ShareFileRequest request,
            Authentication auth) {
        return ResponseEntity.ok(fileShareService.shareFile(request, auth.getName()));
    }

    @PostMapping("/share/bulk")
    public ResponseEntity<List<FileShareDTO>> shareFileBulk(
            @RequestBody ShareFileRequest request,
            Authentication auth) {
        return ResponseEntity.ok(fileShareService.shareFileWithMany(request, auth.getName()));
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

    @PutMapping("/shares/{id}")
    public ResponseEntity<FileShareDTO> updateSharePermission(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication auth) {
        String newPermission = payload.get("permission");
        if (newPermission == null || newPermission.isBlank()) {
            return ResponseEntity.badRequest().body(null);
        }
        return ResponseEntity.ok(fileShareService.updateSharePermission(id, newPermission, auth.getName()));
    }

    @GetMapping("/folders")
    public ResponseEntity<List<String>> getFolders(Authentication auth) {
        return ResponseEntity.ok(folderService.getUserFolders(auth.getName()));
    }

    @PostMapping("/folders")
    public ResponseEntity<String> createFolder(@RequestBody FolderRequest request, Authentication auth)
            throws Exception {
        folderService.createFolder(auth.getName(), request.getName());
        return ResponseEntity.ok("Folder created");
    }

    @PutMapping("/folders/rename")
    public ResponseEntity<String> renameFolder(
            @RequestBody RenameFolderRequest request,
            Authentication auth) throws Exception {
        folderService.renameFolder(auth.getName(), request.getOldName(), request.getNewName());
        return ResponseEntity.ok("Folder renamed");
    }

    @DeleteMapping("/folders/{name}")
    public ResponseEntity<String> deleteFolder(@PathVariable String name, Authentication auth) throws Exception {
        folderService.deleteFolder(auth.getName(), name);
        return ResponseEntity.ok("Folder deleted");
    }

    @PutMapping("/move")
    public ResponseEntity<FileEntity> moveFile(@RequestBody MoveFileRequest request, Authentication auth)
            throws Exception {
        return ResponseEntity
                .ok(folderService.moveFile(auth.getName(), request.getFileId(), request.getTargetFolder()));
    }

    @GetMapping("/collaboration")
    public ResponseEntity<List<CollaborationFileDTO>> getCollaborationFiles(Authentication auth) {
        return ResponseEntity.ok(collaborationService.getAccessibleCollaborationFiles(auth.getName()));
    }

    @GetMapping("/collaboration/{fileId}/comments")
    public ResponseEntity<List<CollaborationCommentDTO>> getComments(
            @PathVariable Long fileId,
            Authentication auth) {
        return ResponseEntity.ok(collaborationService.getCommentsForFile(fileId, auth.getName()));
    }

    @PostMapping("/collaboration/comment")
    public ResponseEntity<CollaborationCommentDTO> addComment(
            @RequestBody CollaborationCommentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(collaborationService.addComment(request, auth.getName()));
    }

    @GetMapping("/preview/{id}")
    public ResponseEntity<ByteArrayResource> previewFile(
            @PathVariable Long id,
            Authentication auth) throws Exception {

        String email = auth.getName();
        FileEntity file = fileService.getFileIfAccessible(id, email);

        // Use MinioStorageService directly — resolves storageKey to MinIO object
        String key = file.getStorageKey();
        if (key == null || key.isBlank()) {
            // fallback: extract key from fileUrl
            String url = file.getFileUrl();
            if (url != null && url.contains("/")) {
                key = url.substring(url.lastIndexOf("/") + 1);
            }
        }
        if (key == null || key.isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        byte[] content = storageService.getFileBytes(key);

        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank() || contentType.equals("application/octet-stream")) {
            try {
                contentType = Files.probeContentType(Path.of(file.getFileName()));
            } catch (Exception e) {
                contentType = null;
            }
        }
        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(file.getFileName()).build().toString())
                .contentLength(content.length)
                .body(new ByteArrayResource(content));
    }

    @GetMapping("/preview-url/{id}")
    public ResponseEntity<FileViewInfoDTO> previewUrl(
            @PathVariable Long id,
            Authentication auth) {
        FileEntity file = fileService.getFileIfAccessible(id, auth.getName());
        return ResponseEntity.ok(new FileViewInfoDTO(file.getFileUrl()));
    }

    // ── Extract plain text from a DOCX for editing ──
    @GetMapping("/docx-text/{id}")
    public ResponseEntity<Map<String, String>> getDocxText(
            @PathVariable Long id,
            Authentication auth) throws Exception {
        FileEntity file = fileService.getFileIfAccessible(id, auth.getName());

        if (!file.getFileName().toLowerCase().matches(".*\\.docx?$")) {
            return ResponseEntity.badRequest().build();
        }

        String key = resolveStorageKey(file);
        if (key == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        StringBuilder sb = new StringBuilder();
        byte[] fileBytes = storageService.getFileBytes(key);
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(fileBytes))) {
            for (XWPFParagraph p : doc.getParagraphs()) {
                sb.append(p.getText()).append("\n");
            }
        }
        return ResponseEntity.ok(Map.of("text", sb.toString(), "fileName", file.getFileName()));
    }

    // ── Save edited plain text back into the DOCX ──
    @PutMapping("/docx-text/{id}")
    public ResponseEntity<String> saveDocxText(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) throws Exception {
        FileEntity file = fileService.getFileIfAccessible(id, auth.getName());

        boolean isOwner = file.getOwnerEmail().equals(auth.getName());
        boolean canEdit = fileShareService.canEditFile(id, auth.getName());

        if (!isOwner && !canEdit) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not have edit permission for this file");
        }

        String key = resolveStorageKey(file);
        if (key == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        String newText = body.getOrDefault("text", "");
        String[] lines = newText.split("\n", -1);

        byte[] fileBytes = storageService.getFileBytes(key);
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(fileBytes))) {
            int size = doc.getParagraphs().size();
            for (int i = size - 1; i >= 0; i--) {
                doc.removeBodyElement(doc.getPosOfParagraph(doc.getParagraphs().get(i)));
            }
            for (String line : lines) {
                XWPFParagraph para = doc.createParagraph();
                XWPFRun run = para.createRun();
                run.setText(line);
            }
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                doc.write(out);
                storageService.replaceFile(key, out.toByteArray(), file.getContentType());
            }
        }
        return ResponseEntity.ok("Saved");
    }

    private String resolveStorageKey(FileEntity file) {
        if (file.getStorageKey() != null && !file.getStorageKey().isBlank()) return file.getStorageKey();
        String url = file.getFileUrl();
        if (url != null && url.contains("/")) return url.substring(url.lastIndexOf("/") + 1);
        return null;
    }


    // ΓöÇΓöÇ Trash / Restore / Empty Trash ΓöÇΓöÇ
    @PutMapping("/{id}/trash")
    public ResponseEntity<String> moveToTrash(@PathVariable Long id, Authentication auth) {
        fileService.moveToTrash(id, auth.getName());
        return ResponseEntity.ok("Moved to trash");
    }

    @GetMapping("/trash")
    public ResponseEntity<List<FileEntity>> getTrash(Authentication auth) {
        return ResponseEntity.ok(fileService.getTrash(auth.getName()));
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<String> restoreFromTrash(@PathVariable Long id, Authentication auth) {
        fileService.restoreFromTrash(id, auth.getName());
        return ResponseEntity.ok("Restored");
    }

    @DeleteMapping("/trash/empty")
    public ResponseEntity<String> emptyTrash(Authentication auth) {
        try {
            fileService.emptyTrash(auth.getName());
            return ResponseEntity.ok("Trash emptied");
        } catch (Exception e) {
            e.printStackTrace(); // 🔥 IMPORTANT
            return ResponseEntity.status(500).body("Error emptying trash");
        }
    }

    @PutMapping("/{id}/star")
    public ResponseEntity<String> toggleStar(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(fileService.toggleStar(id, auth.getName()));
    }

    // ΓöÇΓöÇ Rename ΓöÇΓöÇ
    @PutMapping("/{id}/rename")
    public ResponseEntity<String> renameFile(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        fileService.renameFile(id, body.get("newName"), auth.getName());
        return ResponseEntity.ok("Renamed");
    }

    // ΓöÇΓöÇ Sort files ΓöÇΓöÇ
    @GetMapping("/sorted")
    public ResponseEntity<List<FileEntity>> getSortedFiles(
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            Authentication auth) {
        List<FileEntity> files = fileService.getUserFiles(auth.getName());
        files = new java.util.ArrayList<>(files);
        java.util.Comparator<FileEntity> cmp = switch (sortBy) {
            case "name" -> java.util.Comparator.comparing(f -> f.getFileName().toLowerCase());
            case "size" -> java.util.Comparator.comparingLong(f -> f.getFileSize() != null ? f.getFileSize() : 0L);
            default -> java.util.Comparator.comparing(f -> f.getUploadDate() != null ? f.getUploadDate() : java.time.LocalDateTime.MIN);
        };
        if ("desc".equalsIgnoreCase(order)) cmp = cmp.reversed();
        files.sort(cmp);
        return ResponseEntity.ok(files);
    }

    // ΓöÇΓöÇ Delete comment ΓöÇΓöÇ
    @DeleteMapping("/collaboration/comment/{commentId}")
    public ResponseEntity<String> deleteComment(@PathVariable Long commentId, Authentication auth) {
        collaborationService.deleteComment(commentId, auth.getName());
        return ResponseEntity.ok("Comment deleted");
    }

    @GetMapping("/last-modified/{id}")
    public ResponseEntity<Map<String, Object>> lastModified(@PathVariable Long id, Authentication auth) {
        FileEntity file = fileService.getFileIfAccessible(id, auth.getName());
        return ResponseEntity.ok(Map.of(
            "lastModifiedAt", file.getLastModifiedAt() != null ? file.getLastModifiedAt().toString() : "",
            "fileSize", file.getSize() != null ? file.getSize() : 0L
        ));
    }

    @GetMapping("/stream/{storageKey}")
    public ResponseEntity<ByteArrayResource> streamFile(@PathVariable String storageKey) throws Exception {
        var opt = fileRepository.findAll().stream()
                .filter(f -> storageKey.equals(f.getStorageKey())).findFirst();
        byte[] content = storageService.getFileBytes(storageKey);
        String ct = opt.map(FileEntity::getContentType)
                .filter(s -> s != null && !s.isBlank())
                .orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE);
        String name = opt.map(FileEntity::getFileName).orElse(storageKey);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(ct))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(name).build().toString())
                .contentLength(content.length)
                .body(new ByteArrayResource(content));
    }
}
