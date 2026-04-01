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
import com.cloudbox.repository.FileRepository;
import com.cloudbox.service.CollaborationService;
import com.cloudbox.service.FolderService;
import com.cloudbox.service.FileShareService;
import com.cloudbox.service.FileService;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

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

    @Autowired
    private FileRepository fileRepository;

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

    @PostMapping("/share/bulk")
    public ResponseEntity<List<FileShareDTO>> shareFileBulk(
            @RequestBody ShareFileRequest request,
            Authentication auth
    ) {
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
    @GetMapping("/preview/{id}")
    public ResponseEntity<Resource> previewFile(
            @PathVariable Long id,
            Authentication auth
    ) throws Exception {

        String email = auth.getName();
        FileEntity file = fileService.getFileIfAccessible(id, email);

        Path path = Paths.get(file.getFilePath());
        Resource resource = new UrlResource(path.toUri());

        String contentType = file.getFileType();
        if (contentType == null) contentType = "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + file.getFileName() + "\"")
                .body(resource);
    }

    // ── Extract plain text from a DOCX for editing ──
    @GetMapping("/docx-text/{id}")
    public ResponseEntity<Map<String, String>> getDocxText(
            @PathVariable Long id,
            Authentication auth
    ) throws Exception {
        FileEntity file = fileService.getFileIfAccessible(id, auth.getName());

        if (!file.getFileName().toLowerCase().matches(".*\\.docx?$")) {
            return ResponseEntity.badRequest().build();
        }

        StringBuilder sb = new StringBuilder();
        try (XWPFDocument doc = new XWPFDocument(new FileInputStream(file.getFilePath()))) {
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
            Authentication auth
    ) throws Exception {
        FileEntity file = fileService.getFileIfAccessible(id, auth.getName());

        boolean isOwner = file.getOwnerEmail().equals(auth.getName());
        boolean canEdit = fileShareService.canEditFile(id, auth.getName());

        if (!isOwner && !canEdit) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not have edit permission for this file");
        }

        String newText = body.getOrDefault("text", "");
        String[] lines = newText.split("\n", -1);

        try (XWPFDocument doc = new XWPFDocument(new FileInputStream(file.getFilePath()))) {
            int size = doc.getParagraphs().size();
            for (int i = size - 1; i >= 0; i--) {
                doc.removeBodyElement(doc.getPosOfParagraph(doc.getParagraphs().get(i)));
            }
            for (String line : lines) {
                XWPFParagraph para = doc.createParagraph();
                XWPFRun run = para.createRun();
                run.setText(line);
            }
            try (FileOutputStream out = new FileOutputStream(file.getFilePath())) {
                doc.write(out);
            }
        }
        return ResponseEntity.ok("Saved");
    }
}
