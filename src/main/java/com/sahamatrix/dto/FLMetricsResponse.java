package com.sahamatrix.dto;

import java.util.List;

public record FLMetricsResponse(
    int rounds,
    List<RoundLogDto> roundLog,
    List<StateFLMetricDto> states
) {
    public record RoundLogDto(
        int round,
        double globalLoss
    ) {}

    public record StateFLMetricDto(
        String state,
        int samples,
        double localMae,
        double federatedMae
    ) {}
}
