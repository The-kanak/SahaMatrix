package com.sahamatrix.dto;

public record OutbreakRequest(
    String state,
    String medicine,
    Double multiplier
) {}
