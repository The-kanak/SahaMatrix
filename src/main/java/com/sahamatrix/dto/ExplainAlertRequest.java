package com.sahamatrix.dto;

public record ExplainAlertRequest(
    String phcId,
    String medicine,
    String lang
) {}
