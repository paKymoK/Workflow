package com.takypok.mediaservice.model.dto;

import java.time.Instant;

public record ChunkedUploadedFile(String name, long sizeBytes, Instant modifiedAt) {}
