package com.sahamatrix.dto;

public record AskQuestionRequest(
    String question,
    String state,
    String lang
) {}
