package com.sahamatrix.dto;

public record ExtractedMedicineRow(
    String medicine,
    double quantity,
    double confidence
) {}
