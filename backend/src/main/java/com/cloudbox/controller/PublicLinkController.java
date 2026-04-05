package com.cloudbox.controller;

import com.cloudbox.model.PublicFileLink;
import com.cloudbox.service.FileService;
import com.cloudbox.service.PublicLinkService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicLinkController {

    private final PublicLinkService publicLinkService;
    private final FileService fileService;

    public PublicLinkController(PublicLinkService publicLinkService, FileService fileService) {
        this.publicLinkService = publicLinkService;
        this.fileService = fileService;
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
        byte[] content = fileService.getPublicFileContent(file.getId());
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
}
