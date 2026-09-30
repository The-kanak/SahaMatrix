package com.sahamatrix.dto;

public record AIExplainResponse(
    String summary,
    String likelyCause,
    String recommendedAction,
    String urgency,
    String source
) {}
