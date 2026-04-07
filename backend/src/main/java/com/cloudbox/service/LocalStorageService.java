package com.cloudbox.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalStorageService {

    @Value("${storage.upload-dir:uploads/}")
    private String uploadDir;

    public record StoredFile(String storageKey, String fileUrl) {}

    public StoredFile uploadFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new RuntimeException("File is empty");

        String uniqueName = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        Path dest = dir.resolve(uniqueName);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        // fileUrl is the relative storage key — served via /api/files/stream/{key}
        return new StoredFile(uniqueName, "/api/files/stream/" + uniqueName);
    }

    public byte[] readFile(String storageKey) throws IOException {
        Path path = Paths.get(uploadDir).resolve(storageKey);
        if (!Files.exists(path)) throw new RuntimeException("File not found on disk: " + storageKey);
        return Files.readAllBytes(path);
    }

    public void writeFile(String storageKey, byte[] content) throws IOException {
        Path path = Paths.get(uploadDir).resolve(storageKey);
        Files.createDirectories(path.getParent());
        Files.write(path, content);
    }

    public void deleteFile(String storageKey) {
        try {
            Path path = Paths.get(uploadDir).resolve(storageKey);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            System.err.println("Failed to delete file: " + storageKey + " — " + e.getMessage());
        }
    }

    public Path resolvePath(String storageKey) {
        return Paths.get(uploadDir).resolve(storageKey);
    }

    private String sanitize(String name) {
        if (name == null) return "file";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
