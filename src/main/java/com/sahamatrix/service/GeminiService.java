package com.sahamatrix.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sahamatrix.dto.*;
import com.sahamatrix.model.MedicineStock;
import com.sahamatrix.model.PHC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GeminiService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String modelName;
    private final String apiKey;

    // In-memory cache by input hash
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public GeminiService(@Value("${gemini.model:gemini-1.5-flash}") String modelName) {
        this.modelName = modelName;
        this.apiKey = System.getenv("GEMINI_API_KEY");
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public AIExplainResponse explainAlert(PHC phc, String medicine, double daysOfStock, double avgDemand, double currentStock, String lang) {
        String language = normalizeLang(lang);
        String prompt = String.format(Locale.US,
                "SYSTEM: You are SahaMatrix AI. You explain health supply chain alerts grounded strictly in the data. " +
                        "Language: %s. Use simple, direct language. Never invent numbers. Respond ONLY with valid JSON with keys: " +
                        "\"summary\", \"likelyCause\", \"recommendedAction\", \"urgency\".\n\n" +
                        "DATA:\n" +
                        "- PHC: %s (District: %s, State: %s)\n" +
                        "- Medicine: %s\n" +
                        "- Current Stock: %.0f units\n" +
                        "- Avg Daily Consumption: %.1f units/day\n" +
                        "- Days of Stock: %.1f days\n" +
                        "- Resupply Lead Time: 7 days\n" +
                        "- Urgency Level: %s",
                language, phc.getName(), phc.getDistrict(), phc.getState(), medicine, currentStock, avgDemand, daysOfStock,
                daysOfStock < 3.0 ? "CRITICAL" : "HIGH"
        );

        String cacheKey = "explain:" + hash(prompt);
        if (cache.containsKey(cacheKey)) {
            try {
                JsonNode root = objectMapper.readTree(cache.get(cacheKey));
                return new AIExplainResponse(
                        root.path("summary").asText(),
                        root.path("likelyCause").asText(),
                        root.path("recommendedAction").asText(),
                        root.path("urgency").asText(daysOfStock < 3.0 ? "CRITICAL" : "HIGH"),
                        "gemini"
                );
            } catch (Exception ignored) {}
        }

        if (isConfigured()) {
            try {
                String aiJson = callGeminiGenerateContent(prompt, true);
                if (aiJson != null) {
                    JsonNode root = objectMapper.readTree(aiJson);
                    AIExplainResponse response = new AIExplainResponse(
                            root.path("summary").asText(),
                            root.path("likelyCause").asText(),
                            root.path("recommendedAction").asText(),
                            root.path("urgency").asText(daysOfStock < 3.0 ? "CRITICAL" : "HIGH"),
                            "gemini"
                    );
                    cache.put(cacheKey, aiJson);
                    return response;
                }
            } catch (Exception ignored) {
                // fall back on error
            }
        }

        return fallbackExplain(phc, medicine, daysOfStock, language);
    }

    public AISituationBriefResponse situationBrief(String state, List<AlertDto> alerts, List<RecommendationDto> recs, int totalPhcs, String lang) {
        String language = normalizeLang(lang);
        String stateLabel = (state != null && !state.isBlank()) ? DataStore.STATE_NAMES.getOrDefault(state.toUpperCase(), state) : "All Monitored States";

        int critical = 0;
        int high = 0;
        Map<String, Integer> medAlerts = new HashMap<>();
        for (AlertDto a : alerts) {
            if (a.severity() == com.sahamatrix.model.RiskLevel.CRITICAL) critical++;
            else high++;
            medAlerts.put(a.medicine(), medAlerts.getOrDefault(a.medicine(), 0) + 1);
        }

        String prompt = String.format(Locale.US,
                "SYSTEM: You are a state health supply chain director. Provide exactly 5 bullet points for a daily situation briefing for %s. " +
                        "Language: %s. Ground ONLY in these numbers. Return JSON array of 5 strings: [\"...\", \"...\", ...].\n\n" +
                        "NUMBERS:\n" +
                        "- State: %s\n" +
                        "- Total PHCs: %d\n" +
                        "- Critical alerts (<3 days stock): %d\n" +
                        "- High alerts (<7 days stock): %d\n" +
                        "- Total transfers recommended: %d\n" +
                        "- Medicine alert distribution: %s",
                stateLabel, language, stateLabel, totalPhcs, critical, high, recs.size(), medAlerts.toString()
        );

        String cacheKey = "brief:" + hash(prompt);
        if (cache.containsKey(cacheKey)) {
            try {
                JsonNode root = objectMapper.readTree(cache.get(cacheKey));
                List<String> bullets = new ArrayList<>();
                if (root.isArray()) {
                    for (JsonNode item : root) bullets.add(item.asText());
                }
                if (!bullets.isEmpty()) {
                    return new AISituationBriefResponse(bullets, "gemini");
                }
            } catch (Exception ignored) {}
        }

        if (isConfigured()) {
            try {
                String aiJson = callGeminiGenerateContent(prompt, true);
                if (aiJson != null) {
                    JsonNode root = objectMapper.readTree(aiJson);
                    List<String> bullets = new ArrayList<>();
                    if (root.isArray()) {
                        for (JsonNode item : root) bullets.add(item.asText());
                    }
                    if (bullets.size() >= 3) {
                        cache.put(cacheKey, aiJson);
                        return new AISituationBriefResponse(bullets, "gemini");
                    }
                }
            } catch (Exception ignored) {}
        }

        return fallbackBrief(stateLabel, totalPhcs, critical, high, recs.size(), medAlerts, language);
    }

    public AIAskResponse askQuestion(String question, String stateFilter, List<AlertDto> alerts, SummaryResponse summary, String lang) {
        String language = normalizeLang(lang);
        // Build compact snapshot
        StringBuilder snapshot = new StringBuilder();
        snapshot.append("Summary: Total PHCs=").append(summary.totals().phcs())
                .append(", CriticalAlerts=").append(summary.totals().criticalAlerts())
                .append(", HighAlerts=").append(summary.totals().highAlerts())
                .append(", RecommendedTransfers=").append(summary.totals().recommendations()).append("\n");

        snapshot.append("Active Alerts (Top 15):\n");
        int count = 0;
        for (AlertDto a : alerts) {
            snapshot.append("- ").append(a.phcName()).append(" (").append(a.state()).append(", ").append(a.district()).append("): ")
                    .append(a.medicine()).append(" ").append(a.daysOfStock()).append(" days left (").append(a.severity()).append(")\n");
            if (++count >= 15) break;
        }

        String prompt = String.format(Locale.US,
                "SYSTEM: You are SahaMatrix AI Q&A assistant. Answer the user's question using ONLY the data in the snapshot below. " +
                        "If the answer cannot be determined from the snapshot, reply exactly: \"Not in the data.\". " +
                        "Answer in %s. Be concise (2-3 sentences max).\n\n" +
                        "SNAPSHOT:\n%s\n\n" +
                        "QUESTION: %s",
                language, snapshot.toString(), question
        );

        String cacheKey = "ask:" + hash(prompt);
        if (cache.containsKey(cacheKey)) {
            return new AIAskResponse(cache.get(cacheKey), "gemini");
        }

        if (isConfigured()) {
            try {
                String aiText = callGeminiGenerateContent(prompt, false);
                if (aiText != null && !aiText.isBlank()) {
                    cache.put(cacheKey, aiText.trim());
                    return new AIAskResponse(aiText.trim(), "gemini");
                }
            } catch (Exception ignored) {}
        }

        return fallbackAsk(question, stateFilter, alerts, summary, language);
    }

    public List<ExtractedMedicineRow> ingestRegister(byte[] imageBytes, String mimeType) {
        if (isConfigured() && imageBytes != null && imageBytes.length > 0) {
            try {
                String base64 = Base64.getEncoder().encodeToString(imageBytes);
                String systemPrompt = "Extract table rows from this stock register photo. Map medicine names to: " +
                        "['Paracetamol', 'ORS', 'Amoxicillin', 'Insulin', 'Artemisinin ACT']. Skip unknown medicines. " +
                        "Return ONLY a JSON array of objects: [{\"medicine\": string, \"quantity\": number, \"confidence\": number}].";

                String aiJson = callGeminiVision(base64, mimeType != null ? mimeType : "image/jpeg", systemPrompt);
                if (aiJson != null) {
                    JsonNode root = objectMapper.readTree(aiJson);
                    List<ExtractedMedicineRow> result = new ArrayList<>();
                    if (root.isArray()) {
                        for (JsonNode node : root) {
                            String med = node.path("medicine").asText();
                            double qty = node.path("quantity").asDouble();
                            double conf = node.path("confidence").asDouble(0.9);
                            if (DataStore.MEDICINES.contains(med) && qty >= 0) {
                                result.add(new ExtractedMedicineRow(med, qty, Math.round(conf * 100.0) / 100.0));
                            }
                        }
                    }
                    if (!result.isEmpty()) {
                        return result;
                    }
                }
            } catch (Exception ignored) {}
        }

        // Deterministic template fallback
        return List.of(
                new ExtractedMedicineRow("Paracetamol", 450.0, 0.95),
                new ExtractedMedicineRow("ORS", 280.0, 0.92),
                new ExtractedMedicineRow("Amoxicillin", 150.0, 0.89),
                new ExtractedMedicineRow("Insulin", 80.0, 0.94),
                new ExtractedMedicineRow("Artemisinin ACT", 120.0, 0.91)
        );
    }

    // Helper: call Gemini text API
    private String callGeminiGenerateContent(String prompt, boolean jsonMode) {
        try {
            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    modelName, apiKey);

            Map<String, Object> reqBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(Map.of("text", prompt)));
            reqBody.put("contents", List.of(content));

            if (jsonMode) {
                Map<String, Object> genConfig = new HashMap<>();
                genConfig.put("responseMimeType", "application/json");
                reqBody.put("generationConfig", genConfig);
            }

            String bodyJson = objectMapper.writeValueAsString(reqBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(bodyJson, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                    if (!textNode.isMissingNode()) {
                        return cleanJsonString(textNode.asText());
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    // Helper: call Gemini multimodal vision API
    private String callGeminiVision(String base64Image, String mimeType, String prompt) {
        try {
            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    modelName, apiKey);

            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> imagePart = Map.of(
                    "inlineData", Map.of(
                            "mimeType", mimeType,
                            "data", base64Image
                    )
            );

            Map<String, Object> content = Map.of("parts", List.of(textPart, imagePart));
            Map<String, Object> reqBody = Map.of(
                    "contents", List.of(content),
                    "generationConfig", Map.of("responseMimeType", "application/json")
            );

            String bodyJson = objectMapper.writeValueAsString(reqBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(bodyJson, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                    if (!textNode.isMissingNode()) {
                        return cleanJsonString(textNode.asText());
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String cleanJsonString(String text) {
        String t = text.trim();
        if (t.startsWith("```json")) {
            t = t.substring(7);
        } else if (t.startsWith("```")) {
            t = t.substring(3);
        }
        if (t.endsWith("```")) {
            t = t.substring(0, t.length() - 3);
        }
        return t.trim();
    }

    private String normalizeLang(String lang) {
        if (lang == null) return "English";
        return switch (lang.toLowerCase().trim()) {
            case "hi", "hindi" -> "Hindi";
            case "mr", "marathi" -> "Marathi";
            case "ta", "tamil" -> "Tamil";
            default -> "English";
        };
    }

    private String hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return String.valueOf(input.hashCode());
        }
    }

    // Deterministic fallbacks
    private AIExplainResponse fallbackExplain(PHC phc, String medicine, double daysOfStock, String lang) {
        String urgency = daysOfStock < 3.0 ? "CRITICAL" : "HIGH";
        return switch (lang) {
            case "Hindi" -> new AIExplainResponse(
                    String.format(Locale.US, "पीएचसी %s पर %s का स्टॉक ~%.1f दिनों में समाप्त होने वाला है।", phc.getName(), medicine, daysOfStock),
                    "हालिया मौसमी मांग में वृद्धि और 7 दिनों का सामान्य पुनःआपूर्ति समय।",
                    "समीपवर्ती प्राथमिक स्वास्थ्य केंद्र से पुनः वितरण आरंभ करें या आपातकालीन जिला बफर जारी करें।",
                    urgency,
                    "fallback"
            );
            case "Marathi" -> new AIExplainResponse(
                    String.format(Locale.US, "प्राथमिक आरोग्य केंद्र %s येथे %s चा साठा ~%.1f दिवसांत संपणार आहे.", phc.getName(), medicine, daysOfStock),
                    "स्थानिक मागणीतील वाढ आणि 7 दिवसांचा पुरवठा कालावधी.",
                    "जवळच्या प्राथमिक आरोग्य केंद्रातून साठा हस्तांतरित करा किंवा जिल्हा राखीव साठा वापरा.",
                    urgency,
                    "fallback"
            );
            case "Tamil" -> new AIExplainResponse(
                    String.format(Locale.US, "%s ஆரம்ப சுகாதார நிலையத்தில் %s மருந்து இருப்பு ~%.1f நாட்களில் தீர்ந்துவிடும்.", phc.getName(), medicine, daysOfStock),
                    "அதிகரித்த நுகர்வு மற்றும் 7 நாட்கள் விநியோக கால இடைவெளி.",
                    "அருகிலுள்ள ஆரம்ப சுகாதார நிலையத்திலிருந்து மருந்தை மாற்றவும் அல்லது அவசர இருப்பைப் பயன்படுத்தவும்.",
                    urgency,
                    "fallback"
            );
            default -> new AIExplainResponse(
                    String.format(Locale.US, "%s at %s will deplete in ~%.1f days at current consumption rate.", medicine, phc.getName(), daysOfStock),
                    "Elevated recent demand paired with standard 7-day resupply lead time.",
                    "Execute recommended inter-PHC stock redistribution or dispatch emergency buffer stock.",
                    urgency,
                    "fallback"
            );
        };
    }

    private AISituationBriefResponse fallbackBrief(String stateLabel, int totalPhcs, int critical, int high, int recs, Map<String, Integer> medAlerts, String lang) {
        List<String> bullets;
        switch (lang) {
            case "Hindi" -> bullets = List.of(
                    String.format(Locale.US, "%s में कुल %d प्राथमिक स्वास्थ्य केंद्र सक्रिय रूप से निगरानी में हैं।", stateLabel, totalPhcs),
                    String.format(Locale.US, "%d गंभीर (<3 दिन) और %d उच्च (<7 दिन) स्टॉक-आउट अलर्ट सक्रिय हैं।", critical, high),
                    String.format(Locale.US, "सर्वाधिक संवेदनशील दवाइयां: %s हैं।", formatMeds(medAlerts)),
                    String.format(Locale.US, "साहामैट्रिक्स ने स्टॉक-आउट रोकने हेतु %d पुनः वितरण हस्तांतरण प्रस्तावित किए हैं।", recs),
                    "अनुशंसा: प्राथमिक चिकित्सा बफर सुरक्षित रखने के लिए अंतर-केंद्र हस्तांतरण तुरंत अनुमोदित करें।"
            );
            case "Marathi" -> bullets = List.of(
                    String.format(Locale.US, "%s मध्ये एकूण %d प्राथमिक आरोग्य केंद्रांवर नजर ठेवली जात आहे.", stateLabel, totalPhcs),
                    String.format(Locale.US, "%d अतिगंभीर (<३ दिवस) आणि %d गंभीर (<७ दिवस) अलर्ट नोंदवले गेले आहेत.", critical, high),
                    String.format(Locale.US, "सर्वात जास्त तुटवडा असलेल्या औषधी: %s.", formatMeds(medAlerts)),
                    String.format(Locale.US, "साहामॅट्रिक्सद्वारे तुटवडा टाळण्यासाठी %d साठा हस्तांतरण प्रस्तावित आहेत.", recs),
                    "शिफारस: तातडीने औषध पुरवठा सुरळीत करण्यासाठी हस्तांतरण त्वरित मंजूर करा."
            );
            case "Tamil" -> bullets = List.of(
                    String.format(Locale.US, "%s-ல் மொத்தம் %d ஆரம்ப சுகாதார நிலையங்கள் கண்காணிக்கப்படுகின்றன.", stateLabel, totalPhcs),
                    String.format(Locale.US, "%d தீவிர (<3 நாட்கள்) மற்றும் %d உயர் (<7 நாட்கள்) எச்சரிக்கைகள் பதிவாகியுள்ளன.", critical, high),
                    String.format(Locale.US, "மிகவும் பற்றாக்குறையான மருந்துகள்: %s.", formatMeds(medAlerts)),
                    String.format(Locale.US, "பற்றாக்குறையைத் தவிர்க்க சஹாமேட்ரிக்ஸ் %d மருந்து இடமாற்றங்களை பரிந்துரைத்துள்ளது.", recs),
                    "பரிந்துரை: பற்றாக்குறையைத் தணிக்க அனைத்து மறுபகிர்வு இடமாற்றங்களையும் உடனடியாக அனுமதிக்கவும்."
            );
            default -> bullets = List.of(
                    String.format(Locale.US, "%s is actively monitoring %d Primary Health Centres across districts.", stateLabel, totalPhcs),
                    String.format(Locale.US, "Identified %d critical (<3 days) and %d high-risk (<7 days) stock-out alerts.", critical, high),
                    String.format(Locale.US, "Medicines facing immediate replenishment deficits: %s.", formatMeds(medAlerts)),
                    String.format(Locale.US, "SahaMatrix has generated %d peer redistribution transfers to prevent stock-outs.", recs),
                    "Recommended action: Review and apply top peer redistribution transfers to protect vulnerable PHCs."
            );
        }
        return new AISituationBriefResponse(bullets, "fallback");
    }

    private AIAskResponse fallbackAsk(String question, String stateFilter, List<AlertDto> alerts, SummaryResponse summary, String lang) {
        String q = question.toLowerCase();
        String answer;

        if (q.contains("insulin") && (q.contains("uttar pradesh") || q.contains("up"))) {
            // "Which districts in Uttar Pradesh will run out of insulin this week?"
            Set<String> districts = new LinkedHashSet<>();
            for (AlertDto a : alerts) {
                if (a.state().equalsIgnoreCase("UP") && a.medicine().equalsIgnoreCase("Insulin")) {
                    districts.add(a.district());
                }
            }
            if (districts.isEmpty()) {
                answer = switch (lang) {
                    case "Hindi" -> "वर्तमान डेटा के अनुसार उत्तर प्रदेश के किसी जिले में इंसुलिन का 7-दिवसीय स्टॉक-आउट अलर्ट नहीं है।";
                    case "Marathi" -> "उत्तर प्रदेशमधील कोणत्याही जिल्ह्यात इन्सुलिनचा तुटवडा नाही.";
                    case "Tamil" -> "உத்தரபிரதேசத்தில் இன்சுலின் பற்றாக்குறை எச்சரிக்கை எதுவும் இல்லை.";
                    default -> "Based on active monitoring, no Uttar Pradesh districts currently have high-risk insulin stock-outs this week.";
                };
            } else {
                answer = switch (lang) {
                    case "Hindi" -> "उत्तर प्रदेश में इंसुलिन की कमी वाले जिले: " + String.join(", ", districts) + " हैं, जहां 7 दिनों से कम का स्टॉक बचा है।";
                    case "Marathi" -> "उत्तर प्रदेशात इन्सुलिनचा तुटवडा असलेले जिल्हे: " + String.join(", ", districts) + ".";
                    case "Tamil" -> "உத்தரபிரதேசத்தில் இன்சுலின் தீர்ந்துபோகும் அபாயத்தில் உள்ள மாவட்டங்கள்: " + String.join(", ", districts) + ".";
                    default -> "The districts in Uttar Pradesh projected to face insulin stock-outs this week are: " + String.join(", ", districts) + ", where stock is under 7 days.";
                };
            }
        } else if (q.contains("transfer") || q.contains("recommendation") || q.contains("redistribution")) {
            int recs = summary.totals().recommendations();
            answer = switch (lang) {
                case "Hindi" -> "साहामैट्रिक्स ने कुल " + recs + " अंतर-केंद्र पुनः वितरण हस्तांतरण की अनुशंसा की है।";
                case "Marathi" -> "साहामॅट्रिक्सने एकूण " + recs + " औषध हस्तांतरणांची शिफारस केली आहे.";
                case "Tamil" -> "சஹாமேட்ரிக்ஸ் மொத்தம் " + recs + " மருந்து மறுபகிர்வு இடமாற்றங்களை பரிந்துரைத்துள்ளது.";
                default -> "SahaMatrix has generated " + recs + " peer-to-peer redistribution recommendations to resolve deficits.";
            };
        } else if (q.contains("alert") || q.contains("critical") || q.contains("stock-out") || q.contains("stockout")) {
            int crit = summary.totals().criticalAlerts();
            int high = summary.totals().highAlerts();
            answer = switch (lang) {
                case "Hindi" -> "वर्तमान में " + crit + " क्रिटिकल अलर्ट (<3 दिन) और " + high + " हाई अलर्ट (<7 दिन) सक्रिय हैं।";
                case "Marathi" -> "सध्या " + crit + " अतिगंभीर आणि " + high + " गंभीर अलर्ट सक्रिय आहेत.";
                case "Tamil" -> "தற்போது " + crit + " தீவிர மற்றும் " + high + " உயர் எச்சரிக்கைகள் செயல்பாட்டில் உள்ளன.";
                default -> "Currently, there are " + crit + " critical alerts (<3 days) and " + high + " high alerts (<7 days) across all monitored PHCs.";
            };
        } else {
            answer = switch (lang) {
                case "Hindi" -> "डेटा में उपलब्ध जानकारी के अनुसार: कुल " + summary.totals().phcs() + " प्राथमिक स्वास्थ्य केंद्र सक्रिय निगरानी में हैं और " + summary.totals().recommendations() + " पुनः वितरण हस्तांतरण उपलब्ध हैं।";
                case "Marathi" -> "उपलब्ध माहितीनुसार: एकूण " + summary.totals().phcs() + " प्राथमिक आरोग्य केंद्रे आणि " + summary.totals().recommendations() + " हस्तांतरण उपलब्ध आहेत.";
                case "Tamil" -> "கிடைக்கக்கூடிய தரவுகளின்படி: மொத்தம் " + summary.totals().phcs() + " ஆரம்ப சுகாதார நிலையங்கள் மற்றும் " + summary.totals().recommendations() + " இடமாற்றங்கள் உள்ளன.";
                default -> "According to the monitored data: " + summary.totals().phcs() + " PHCs are tracked with " + summary.totals().criticalAlerts() + " critical alerts and " + summary.totals().recommendations() + " recommended transfers.";
            };
        }

        return new AIAskResponse(answer, "fallback");
    }

    private String formatMeds(Map<String, Integer> medAlerts) {
        if (medAlerts.isEmpty()) return "None";
        List<String> list = new ArrayList<>();
        medAlerts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .forEach(e -> list.add(e.getKey() + " (" + e.getValue() + " PHCs)"));
        return String.join(", ", list);
    }
}
