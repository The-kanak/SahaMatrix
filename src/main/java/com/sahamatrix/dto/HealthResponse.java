package com.sahamatrix.dto;

public record HealthResponse(
    String status,
    int phcs,
    int states,
    boolean geminiConfigured,
    String version
) {}
