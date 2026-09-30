package com.sahamatrix.dto;

public record RecommendationDto(
    String id,
    String medicine,
    double quantity,
    double distanceKm,
    boolean crossState,
    LocationNodeDto from,
    LocationNodeDto to
) {}
