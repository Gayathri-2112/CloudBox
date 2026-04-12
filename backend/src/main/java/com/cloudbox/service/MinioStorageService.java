package com.cloudbox.service;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.errors.ErrorResponseException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

@Service
public class MinioStorageService {

    private final MinioClient minioClient;
    private final String bucketName;
    private final String minioUrl;

    public MinioStorageService(
            MinioClient minioClient,
            @Value("${minio.bucket-name}") String bucketName,
            @Value("${minio.url}") String minioUrl) {
        this.minioClient = minioClient;
        this.bucketName = bucketName;
        this.minioUrl = minioUrl;
    }

    public StoredFile uploadFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        String objectName = buildObjectName(file.getOriginalFilename());

        try (InputStream inputStream = file.getInputStream()) {
            ensureBucketExists();

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(defaultContentType(file.getContentType()))
                            .build());

            return new StoredFile(objectName, getFileUrl(objectName));
        } catch (Exception ex) {
            throw new RuntimeException("Failed to upload file to MinIO", ex);
        }
    }

    public void deleteFile(String fileName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .build());
        } catch (ErrorResponseException ex) {
            if (ex.errorResponse() != null && "NoSuchKey".equals(ex.errorResponse().code())) {
                return;
            }
            throw new RuntimeException("Failed to delete file from MinIO", ex);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to delete file from MinIO", ex);
        }
    }

    public String getFileUrl(String fileName) {
        String encodedFileName = UriUtils.encodePathSegment(fileName, StandardCharsets.UTF_8);
        return minioUrl + "/" + bucketName + "/" + encodedFileName;
    }

    public byte[] getFileBytes(String fileName) {
        try (InputStream inputStream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(fileName)
                        .build())) {
            return inputStream.readAllBytes();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to read file from MinIO", ex);
        }
    }

    public void replaceFile(String fileName, byte[] content, String contentType) {
        try {
            ensureBucketExists();
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(new ByteArrayInputStream(content), content.length, -1)
                            .contentType(defaultContentType(contentType))
                            .build());
        } catch (Exception ex) {
            throw new RuntimeException("Failed to update file in MinIO", ex);
        }
    }

    private void ensureBucketExists() throws Exception {
        boolean bucketExists = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucketName).build());

        if (!bucketExists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
        }

        // Set public read policy so direct URLs work
        String policy = "{"
                + "\"Version\":\"2012-10-17\","
                + "\"Statement\":[{"
                + "\"Effect\":\"Allow\","
                + "\"Principal\":{\"AWS\":[\"*\"]},"
                + "\"Action\":[\"s3:GetObject\"],"
                + "\"Resource\":[\"arn:aws:s3:::" + bucketName + "/*\"]"
                + "}]"
                + "}";
        try {
            minioClient.setBucketPolicy(
                io.minio.SetBucketPolicyArgs.builder()
                    .bucket(bucketName)
                    .config(policy)
                    .build());
        } catch (Exception ignored) {
            // Policy may already be set or not supported — non-fatal
        }
    }

    private String buildObjectName(String originalFilename) {
        String safeName = Objects.requireNonNullElse(originalFilename, "file")
                .replace("\\", "_")
                .replace("/", "_")
                .replaceAll("\\s+", "_");
        return System.currentTimeMillis() + "_" + safeName;
    }

    private String defaultContentType(String contentType) {
        return (contentType == null || contentType.isBlank())
                ? "application/octet-stream"
                : contentType;
    }

    public record StoredFile(String fileName, String fileUrl) {
        //
    }
}
