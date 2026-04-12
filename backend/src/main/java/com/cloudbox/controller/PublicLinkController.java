package com.cloudbox.controller;

import com.cloudbox.model.FileEntity;
import com.cloudbox.model.PublicFileLink;
import com.cloudbox.service.EmailService;
import com.cloudbox.service.MinioStorageService;
import com.cloudbox.service.PublicLinkService;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicLinkController {

    private final PublicLinkService publicLinkService;
    private final EmailService emailService;
    private final MinioStorageService minioStorageService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public PublicLinkController(PublicLinkService publicLinkService,
                                EmailService emailService, MinioStorageService minioStorageService) {
        this.publicLinkService = publicLinkService;
        this.emailService = emailService;
        this.minioStorageService = minioStorageService;
    }

    // ── Create a public link (authenticated owner only) ──
    @PostMapping("/link")
    public ResponseEntity<Map<String, String>> createLink(
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        Long fileId = Long.valueOf(body.get("fileId").toString());
        String permission = (String) body.getOrDefault("permission", "VIEW");
        Integer expiryHours = body.containsKey("expiryHours")

                ? Integer.valueOf(body.get("expiryHours").toString()) : null;

        return ResponseEntity.ok(publicLinkService.createLink(fileId, auth.getName(), permission, expiryHours));
    }

    // ── List links for a file ──
    @GetMapping("/links/{fileId}")
    public ResponseEntity<List<PublicFileLink>> getLinks(
            @PathVariable Long fileId, Authentication auth) {
        return ResponseEntity.ok(publicLinkService.getLinksForFile(fileId, auth.getName()));
    }

    // ── Revoke a link ──
    @DeleteMapping("/link/{token}")
    public ResponseEntity<String> revokeLink(
            @PathVariable String token, Authentication auth) {
        publicLinkService.revokeLink(token, auth.getName());
        return ResponseEntity.ok("Link revoked");
    }

    // ── Access file via public token (NO auth required) ──
    @GetMapping("/file/{token}")
    public ResponseEntity<ByteArrayResource> accessPublicFile(@PathVariable String token) throws Exception {
        PublicFileLink link = publicLinkService.validateToken(token);
        var file = link.getFile();

        String key = file.getStorageKey();
        if (key == null || key.isBlank()) {
            String url = file.getFileUrl();
            if (url != null && url.contains("/")) key = url.substring(url.lastIndexOf("/") + 1);
        }
        if (key == null || key.isBlank()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        byte[] content = minioStorageService.getFileBytes(key);
        String contentType = file.getContentType() != null
                ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        ContentDisposition cd = link.getPermission().equals("DOWNLOAD")
                ? ContentDisposition.attachment().filename(file.getFileName()).build()
                : ContentDisposition.inline().filename(file.getFileName()).build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .contentLength(content.length)
                .body(new ByteArrayResource(content));
    }

    // ── Get file info via public token (for preview page) ──
    @GetMapping("/info/{token}")
    public ResponseEntity<Map<String, String>> getPublicFileInfo(@PathVariable String token) {
        PublicFileLink link = publicLinkService.validateToken(token);
        var file = link.getFile();
        return ResponseEntity.ok(Map.of(
                "fileName", file.getFileName(),
                "fileType", file.getContentType() != null ? file.getContentType() : "",
                "permission", link.getPermission(),

                "fileUrl", file.getFileUrl() != null ? file.getFileUrl() : ""
        ));

    }

    // ── Update permission of an existing link ──
    @PutMapping("/link/{token}/permission")
    public ResponseEntity<String> updateLinkPermission(
            @PathVariable String token,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String newPermission = body.get("permission");
        if (newPermission == null || newPermission.isBlank())
            return ResponseEntity.badRequest().body("Permission is required");
        publicLinkService.updateLinkPermission(token, auth.getName(), newPermission.toUpperCase());
        return ResponseEntity.ok("Updated");
    }

    // ── Send a new link via email (creates link with chosen permission) ──
    @PostMapping("/link/email")
    public ResponseEntity<String> sendNewLinkByEmail(
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        String recipientEmail = (String) body.get("email");
        if (recipientEmail == null || recipientEmail.isBlank())
            return ResponseEntity.badRequest().body("Email is required");

        Long fileId = Long.valueOf(body.get("fileId").toString());
        String permission = body.containsKey("permission") ? (String) body.get("permission") : "VIEW";
        Integer expiryHours = body.containsKey("expiryHours")
                ? Integer.valueOf(body.get("expiryHours").toString()) : null;

        Map<String, String> result = publicLinkService.createLink(fileId, auth.getName(), permission, expiryHours);
        String token = result.get("token");
        String linkUrl = frontendUrl + "/shared/" + token;

        PublicFileLink link = publicLinkService.validateToken(token);
        emailService.sendPublicLink(recipientEmail, auth.getName(),
                link.getFile().getFileName(), linkUrl, permission);

        return ResponseEntity.ok("Email sent");
    }

    // ── Extract docx text via public token (EDIT permission required) ──
    @PostMapping("/docx-text/{token}")
    public ResponseEntity<Map<String, String>> getPublicDocxText(@PathVariable String token) throws Exception {
        PublicFileLink link = publicLinkService.validateToken(token);
        if (!"EDIT".equals(link.getPermission()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        FileEntity file = link.getFile();
        String key = resolveKey(file);
        if (key == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        byte[] bytes = minioStorageService.getFileBytes(key);
        StringBuilder sb = new StringBuilder();
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(bytes))) {
            for (XWPFParagraph p : doc.getParagraphs()) sb.append(p.getText()).append("\n");
        }
        return ResponseEntity.ok(Map.of("text", sb.toString(), "fileName", file.getFileName()));
    }

    // ── Save edited docx text via public token (EDIT permission required) ──
    @PutMapping("/docx-save/{token}")
    public ResponseEntity<String> savePublicDocxText(
            @PathVariable String token,
            @RequestBody Map<String, String> body) throws Exception {
        PublicFileLink link = publicLinkService.validateToken(token);
        if (!"EDIT".equals(link.getPermission()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No edit permission");

        FileEntity file = link.getFile();
        String key = resolveKey(file);
        if (key == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        String newText = body.getOrDefault("text", "");
        byte[] bytes = minioStorageService.getFileBytes(key);
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(bytes))) {
            int size = doc.getParagraphs().size();
            for (int i = size - 1; i >= 0; i--)
                doc.removeBodyElement(doc.getPosOfParagraph(doc.getParagraphs().get(i)));
            for (String line : newText.split("\n", -1)) {
                XWPFParagraph para = doc.createParagraph();
                XWPFRun run = para.createRun();
                run.setText(line);
            }
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                doc.write(out);
                minioStorageService.replaceFile(key, out.toByteArray(), file.getContentType());
            }
        }
        return ResponseEntity.ok("Saved");
    }

    private String resolveKey(FileEntity file) {
        if (file.getStorageKey() != null && !file.getStorageKey().isBlank()) return file.getStorageKey();
        String url = file.getFileUrl();
        if (url != null && url.contains("/")) return url.substring(url.lastIndexOf("/") + 1);
        return null;
    }
}
