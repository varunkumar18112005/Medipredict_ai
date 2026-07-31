package com.example.Backend.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.Backend.Dto.AssessmentDto;
import com.example.Backend.model.Assessment;
import com.example.Backend.model.User;
import com.example.Backend.Repository.AssessmentRepository;
import com.example.Backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.ml.service.url:http://ml-service:8000}")
    private String mlServiceUrl;

    // ── Create & Predict ─────────────────────────────────────────────

    public AssessmentDto.Response createAssessment(String email, AssessmentDto.CreateRequest req) {
        User user = findUser(email);

        Assessment assessment = Assessment.builder()
                .user(user)
                .diseaseType(req.getDiseaseType())
                .inputDataJson(toJson(req))
                .status(Assessment.AssessmentStatus.PROCESSING)
                .build();

        assessment = assessmentRepository.save(assessment);
        
        req.setUserName(user.getFullName());
        runPrediction(assessment.getId(), req);

        // Reload with results
        assessment = assessmentRepository.findById(assessment.getId()).orElseThrow();
        return toResponse(assessment);
    }

    @Async
    public void runPrediction(Long assessmentId, AssessmentDto.CreateRequest req) {
        assessmentRepository.findById(assessmentId).ifPresent(assessment -> {
            try {
                Thread.sleep(1000); // Simulate AI processing time

                Map<String, Object> prediction = fetchMlPrediction(assessment.getDiseaseType(), req);
                double riskScore = (Double) prediction.get("score");
                @SuppressWarnings("unchecked")
                List<String> suggestions = (List<String>) prediction.get("suggestions");

                String riskLevel = classifyRisk(riskScore);

                // Get previous score for trend
                List<Assessment> history = assessmentRepository
                        .findByUserAndDiseaseTypeOrderByCreatedAtDesc(
                                assessment.getUser(), assessment.getDiseaseType());
                double trend = 0.0;
                if (history.size() > 1) {
                    Double prev = history.get(1).getRiskScore();
                    if (prev != null && prev > 0) {
                        trend = ((riskScore - prev) / prev) * 100;
                    }
                }

                List<AssessmentDto.RiskFactor> factors = buildRiskFactors(assessment.getDiseaseType(), req);

                assessment.setRiskScore(riskScore);
                assessment.setRiskLevel(riskLevel);
                assessment.setRiskTrend(trend);
                assessment.setRiskFactorsJson(toJson(factors));
                assessment.setSuggestionsJson(toJson(suggestions));
                assessment.setCompletedAt(LocalDateTime.now());
                assessment.setStatus(Assessment.AssessmentStatus.COMPLETED);

                assessmentRepository.save(assessment);
                log.info("Assessment {} completed: {}% {} risk", assessmentId, riskScore, riskLevel);

            } catch (Exception e) {
                log.error("Assessment {} failed: {}", assessmentId, e.getMessage());
                assessment.setStatus(Assessment.AssessmentStatus.FAILED);
                assessmentRepository.save(assessment);
            }
        });
    }

    // ── Scoring Logic via ML Service ─────────────────────────────────

    private Map<String, Object> fetchMlPrediction(Assessment.DiseaseType type, AssessmentDto.CreateRequest r) {
        String reqType = type == Assessment.DiseaseType.FULL_SCAN ? "DIABETES" : type.name();
        try {
            RestTemplate restTemplate = new RestTemplate();
            String mlUrl = mlServiceUrl + "/predict";

            Map<String, Object> payload = objectMapper.convertValue(r, new TypeReference<Map<String, Object>>() {
            });
            payload.put("diseaseType", reqType);

            ResponseEntity<Map> response = restTemplate.postForEntity(mlUrl, payload, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = new HashMap<>();
                Object scoreVal = response.getBody().get("riskScore");
                result.put("score", scoreVal instanceof Number ? ((Number) scoreVal).doubleValue() : 0.0);

                Object sugg = response.getBody().get("suggestions");
                result.put("suggestions", sugg instanceof List ? (List<String>) sugg
                        : new ArrayList<>(List.of("Maintain physical activity.")));
                return result;
            }
        } catch (Exception e) {
            log.error("Failed to fetch ML Prediction for {}. Falling back to heuristic assessment.", type, e);
        }

        // Fallback Heuristic Risk Calculation with clinically sound suggestions
        double score = computeHeuristicFallback(type, r);
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("score", score);
        fallback.put("suggestions", generateFallbackSuggestions(type, score));
        return fallback;
    }

    private List<String> generateFallbackSuggestions(Assessment.DiseaseType type, double score) {
        List<String> list = new ArrayList<>();
        if (score < 30.0) {
            list.add("Your biological markers indicate a LOW risk profile. Continue maintaining your current healthy lifestyle.");
            list.add("Engage in at least 150 minutes of moderate aerobic physical activity per week.");
            list.add("Maintain a balanced nutrient-dense diet and schedule routine annual health screenings.");
        } else if (score < 60.0) {
            list.add("Your biological markers indicate a MODERATE risk profile. Dietary and lifestyle interventions are recommended.");
            list.add("Reduce consumption of refined sugars, saturated fats, and processed foods.");
            list.add("Schedule a follow-up consultation with your healthcare provider within 2-4 weeks.");
        } else {
            list.add("Your biological markers indicate an ELEVATED risk profile. Prompt clinical evaluation is advised.");
            list.add("Consult a specialist physician for comprehensive diagnostic testing and risk mitigation.");
            list.add("Monitor your physiological parameters regularly and follow prescribed medical guidance.");
        }
        return list;
    }

    // Heuristic approximations kept as Fallbacks in case ML Service is unreachable
    private double computeHeuristicFallback(Assessment.DiseaseType type, AssessmentDto.CreateRequest r) {
        return switch (type) {
            case DIABETES -> computeDiabetesRisk(r);
            case HEART_DISEASE -> computeHeartRisk(r);
            case LIVER_DISEASE -> computeLiverRisk(r);
            case KIDNEY_DISEASE -> computeKidneyRisk(r);
            case THYROID_DISEASE -> computeThyroidRisk(r);
            case PULMONARY_DISEASE -> computePulmonaryRisk(r);
            case STROKE -> computeStrokeRisk(r);
            case ANEMIA -> computeAnemiaRisk(r);
            case FULL_SCAN -> (computeDiabetesRisk(r) + computeHeartRisk(r)) / 2.0;
        };
    }

    private double computeDiabetesRisk(AssessmentDto.CreateRequest r) {
        double score = 0;
        if (r.getGlucose() != null) score += normalize(r.getGlucose(), 70, 200) * 35;
        if (r.getHba1c() != null) score += normalize(r.getHba1c(), 4.0, 10.0) * 30;
        if (r.getBloodPressure() != null) score += normalize(r.getBloodPressure(), 90, 180) * 10;
        if (r.getInsulin() != null) score += normalize(r.getInsulin(), 0, 200) * 10;
        if (r.getBmi() != null) score += normalize(r.getBmi(), 18, 45) * 10;
        if (r.getAge() != null) score += normalize(r.getAge(), 20, 80) * 5;
        return Math.min(score, 100);
    }

    private double computeHeartRisk(AssessmentDto.CreateRequest r) {
        double score = 0;
        if (r.getRestingBP() != null) score += normalize(r.getRestingBP(), 90, 180) * 25;
        if (r.getCholesterol() != null) score += normalize(r.getCholesterol(), 150, 350) * 25;
        if (r.getFastingBS() != null && r.getFastingBS() == 1) score += 15;
        if (r.getRestingECG() != null) score += normalize(r.getRestingECG(), 0, 2) * 10;
        if (r.getMaxHeartRate() != null) score += normalize(r.getMaxHeartRate(), 60, 200) * 10;
        if (r.getChestPainType() != null) score += normalize(r.getChestPainType(), 0, 3) * 15;
        return Math.min(score, 100);
    }

    private double computeLiverRisk(AssessmentDto.CreateRequest r) {
        double score = 0;
        if (r.getTotalBilirubin() != null) score += normalize(r.getTotalBilirubin(), 0.1, 15) * 25;
        if (r.getDirectBilirubin() != null) score += normalize(r.getDirectBilirubin(), 0.0, 5) * 20;
        if (r.getAlt() != null) score += normalize(r.getAlt(), 7, 300) * 20;
        if (r.getAst() != null) score += normalize(r.getAst(), 10, 300) * 20;
        if (r.getAlp() != null) score += normalize(r.getAlp(), 44, 400) * 10;
        if (r.getAlbumin() != null) score += (1 - normalize(r.getAlbumin(), 2.0, 5.5)) * 15;
        return Math.min(score, 100);
    }

    private double computeKidneyRisk(AssessmentDto.CreateRequest r) {
        double score = 0;
        if (r.getSerumCreatinine() != null) score += normalize(r.getSerumCreatinine(), 0.5, 10) * 30;
        if (r.getBloodUrea() != null) score += normalize(r.getBloodUrea(), 7, 150) * 20;
        if (r.getEgfr() != null) score += (1 - normalize(r.getEgfr(), 15, 120)) * 20;
        if (r.getUrineAlbumin() != null) score += normalize(r.getUrineAlbumin(), 0, 300) * 15;
        if (r.getHaemoglobin() != null) score += (1 - normalize(r.getHaemoglobin(), 6, 18)) * 10;
        if (r.getBloodPressure() != null) score += normalize(r.getBloodPressure(), 90, 180) * 5;
        return Math.min(score, 100);
    }

    private double computeThyroidRisk(AssessmentDto.CreateRequest r) {
        double score = 0;
        if (r.getTsh() != null) score += normalize(Math.abs(r.getTsh() - 2.0), 0, 10) * 45;
        if (r.getFreeT3() != null) score += normalize(Math.abs(r.getFreeT3() - 2.8), 0, 3) * 20;
        if (r.getFreeT4() != null) score += normalize(Math.abs(r.getFreeT4() - 1.2), 0, 2) * 20;
        if (r.getAntiTpo() != null) score += normalize(r.getAntiTpo(), 0, 100) * 15;
        return Math.min(score, 100);
    }

    private double computePulmonaryRisk(AssessmentDto.CreateRequest r) {
        double score = 0;
        if (r.getOxygenSaturation() != null) score += (1 - normalize(r.getOxygenSaturation(), 85, 100)) * 35;
        if (r.getFev1FvcRatio() != null) score += (1 - normalize(r.getFev1FvcRatio(), 0.5, 1.0)) * 25;
        if (r.getRespiratoryRate() != null) score += normalize(r.getRespiratoryRate(), 12, 30) * 15;
        if (r.getSmokingHistory() != null && r.getSmokingHistory() == 1) score += 15;
        if (r.getFev1() != null) score += (1 - normalize(r.getFev1(), 1.0, 5.0)) * 10;
        return Math.min(score, 100);
    }

    private double computeStrokeRisk(AssessmentDto.CreateRequest r) {
        double score = 0;
        if (r.getBloodPressure() != null) score += normalize(r.getBloodPressure(), 90, 180) * 30;
        if (r.getGlucose() != null) score += normalize(r.getGlucose(), 70, 200) * 20;
        if (r.getCholesterol() != null) score += normalize(r.getCholesterol(), 150, 350) * 15;
        if (r.getBmi() != null) score += normalize(r.getBmi(), 18, 45) * 15;
        if (r.getAge() != null) score += normalize(r.getAge(), 20, 85) * 10;
        if (r.getHeartDiseaseHistory() != null && r.getHeartDiseaseHistory() == 1) score += 10;
        return Math.min(score, 100);
    }

    private double computeAnemiaRisk(AssessmentDto.CreateRequest r) {
        double score = 0;
        if (r.getHaemoglobin() != null) score += (1 - normalize(r.getHaemoglobin(), 8, 16)) * 35;
        if (r.getRbcCount() != null) score += (1 - normalize(r.getRbcCount(), 3.0, 6.0)) * 25;
        if (r.getHematocrit() != null) score += (1 - normalize(r.getHematocrit(), 30, 50)) * 20;
        if (r.getFerritin() != null) score += (1 - normalize(r.getFerritin(), 10, 300)) * 20;
        return Math.min(score, 100);
    }

    private double normalize(double value, double min, double max) {
        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }

    private String classifyRisk(double score) {
        if (score < 25)
            return "LOW";
        if (score < 50)
            return "MODERATE";
        if (score < 75)
            return "HIGH";
        return "CRITICAL";
    }

    // ── Risk Factors ─────────────────────────────────────────────────

    private List<AssessmentDto.RiskFactor> buildRiskFactors(
            Assessment.DiseaseType type, AssessmentDto.CreateRequest r) {
        List<AssessmentDto.RiskFactor> factors = new ArrayList<>();

        if (type == Assessment.DiseaseType.DIABETES || type == Assessment.DiseaseType.FULL_SCAN) {
            if (r.getGlucose() != null) {
                factors.add(
                        createFactor("Blood Glucose", r.getGlucose() + " mg/dL", r.getGlucose(), 100, 140, 70, 200));
            }
            if (r.getInsulin() != null) {
                factors.add(createFactor("Insulin Level", r.getInsulin() + " μU/mL", r.getInsulin(), 25, 100, 0, 200));
            }
        }

        if (type == Assessment.DiseaseType.HEART_DISEASE || type == Assessment.DiseaseType.FULL_SCAN) {
            if (r.getCholesterol() != null) {
                factors.add(createFactor("Cholesterol", r.getCholesterol() + " mg/dL", r.getCholesterol(), 200, 240,
                        150, 350));
            }
            if (r.getHeartRate() != null) {
                factors.add(createFactor("Resting Heart Rate", r.getHeartRate() + " bpm", (double) r.getHeartRate(), 80,
                        100, 50, 120));
            }
        }

        if (type == Assessment.DiseaseType.LIVER_DISEASE) {
            if (r.getTotalBilirubin() != null) {
                factors.add(createFactor("Total Bilirubin", r.getTotalBilirubin() + " mg/dL", r.getTotalBilirubin(),
                        1.2, 2.5, 0.1, 15));
            }
            if (r.getAlkalinePhosphotase() != null) {
                factors.add(createFactor("Alkaline Phosphatase", r.getAlkalinePhosphotase() + " IU/L",
                        r.getAlkalinePhosphotase(), 140, 250, 44, 500));
            }
        }

        if (type == Assessment.DiseaseType.KIDNEY_DISEASE) {
            if (r.getSerumCreatinine() != null) {
                factors.add(createFactor("Serum Creatinine", r.getSerumCreatinine() + " mg/dL", r.getSerumCreatinine(),
                        1.2, 2.5, 0.5, 10));
            }
            if (r.getBloodUrea() != null) {
                factors.add(createFactor("Blood Urea", r.getBloodUrea() + " mg/dL", r.getBloodUrea(), 20, 50, 7, 150));
            }
        }

        if (type == Assessment.DiseaseType.THYROID_DISEASE) {
            if (r.getTsh() != null) {
                factors.add(createFactor("Thyroid Stimulating Hormone (TSH)", r.getTsh() + " uIU/mL", r.getTsh(), 4.5, 10.0, 0.1, 15.0));
            }
            if (r.getT3() != null) {
                factors.add(createFactor("Free T3", r.getT3() + " pg/mL", r.getT3(), 2.0, 4.4, 0.5, 6.0));
            }
            if (r.getT4() != null) {
                factors.add(createFactor("Free T4", r.getT4() + " ng/dL", r.getT4(), 0.9, 1.8, 0.1, 3.0));
            }
        }

        if (type == Assessment.DiseaseType.PULMONARY_DISEASE) {
            if (r.getOxygenSaturation() != null) {
                double oxygen = r.getOxygenSaturation();
                String level = oxygen < 90 ? "HIGH" : (oxygen < 95 ? "MODERATE" : "NORMAL");
                double satScore = (100.0 - oxygen) * 6.6;
                factors.add(AssessmentDto.RiskFactor.builder()
                        .name("Oxygen Saturation (SpO2)")
                        .value(oxygen + "%")
                        .level(level)
                        .score(Math.min(satScore, 100.0))
                        .build());
            }
            if (r.getFev1FvcRatio() != null) {
                double ratio = r.getFev1FvcRatio();
                String level = ratio < 0.7 ? "HIGH" : "NORMAL";
                factors.add(AssessmentDto.RiskFactor.builder()
                        .name("FEV1/FVC Ratio")
                        .value(String.format("%.2f", ratio))
                        .level(level)
                        .score((1.0 - ratio) * 100)
                        .build());
            }
            if (r.getRespiratoryRate() != null) {
                factors.add(createFactor("Respiratory Rate", r.getRespiratoryRate() + " breaths/min", (double) r.getRespiratoryRate(), 20, 26, 12, 35));
            }
        }

        if (type == Assessment.DiseaseType.STROKE) {
            if (r.getAvgGlucoseLevel() != null) {
                factors.add(createFactor("Average Glucose Level", r.getAvgGlucoseLevel() + " mg/dL", r.getAvgGlucoseLevel(), 140, 200, 70, 300));
            }
        }

        if (type == Assessment.DiseaseType.ANEMIA) {
            if (r.getHaemoglobin() != null) {
                double hb = r.getHaemoglobin();
                String level = hb < 11.0 ? "HIGH" : (hb < 13.0 ? "MODERATE" : "NORMAL");
                factors.add(AssessmentDto.RiskFactor.builder()
                        .name("Hemoglobin")
                        .value(hb + " g/dL")
                        .level(level)
                        .score((16.0 - hb) * 12.5)
                        .build());
            }
            if (r.getRbcCount() != null) {
                double rbc = r.getRbcCount();
                String level = rbc < 3.8 ? "HIGH" : (rbc < 4.2 ? "MODERATE" : "NORMAL");
                factors.add(AssessmentDto.RiskFactor.builder()
                        .name("Red Blood Cell Count")
                        .value(rbc + " M/uL")
                        .level(level)
                        .score((5.5 - rbc) * 40)
                        .build());
            }
            if (r.getHematocrit() != null) {
                double hct = r.getHematocrit();
                String level = hct < 36 ? "HIGH" : (hct < 40 ? "MODERATE" : "NORMAL");
                factors.add(AssessmentDto.RiskFactor.builder()
                        .name("Hematocrit")
                        .value(hct + "%")
                        .level(level)
                        .score((50.0 - hct) * 5)
                        .build());
            }
        }

        // Common Core Factors for all diseases
        if (r.getBmi() != null) {
            factors.add(createFactor("Body Mass Index (BMI)", String.format("%.1f", r.getBmi()), r.getBmi(), 25, 30, 18,
                    45));
        }
        if (r.getBloodPressure() != null) {
            factors.add(createFactor("Blood Pressure", r.getBloodPressure() + " mmHg", (double) r.getBloodPressure(),
                    120, 140, 60, 180));
        }
        if (r.getAge() != null) {
            factors.add(createFactor("Age", r.getAge() + " years", (double) r.getAge(), 40, 60, 20, 80));
        }

        return factors;
    }

    private AssessmentDto.RiskFactor createFactor(String name, String valueStr, double value, double modThreshold,
            double highThreshold, double minScale, double maxScale) {
        String level = value >= highThreshold ? "HIGH" : (value >= modThreshold ? "MODERATE" : "NORMAL");
        double score = normalize(value, minScale, maxScale) * 100;
        return AssessmentDto.RiskFactor.builder()
                .name(name)
                .value(valueStr)
                .level(level)
                .score(score)
                .build();
    }

    // ── Suggestions ───────────────────────────────────────────────────
    // Suggestions are now generated by the Python ML Service natively.

    // ── Query Methods ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AssessmentDto.HistoryResponse> getHistory(String email, Pageable pageable) {
        User user = findUser(email);
        return assessmentRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::toHistoryResponse);
    }

    @Transactional(readOnly = true)
    public AssessmentDto.Response getById(String email, Long id) {
        User user = findUser(email);
        Assessment a = assessmentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new NoSuchElementException("Assessment not found: " + id));
        return toResponse(a);
    }

    @Transactional(readOnly = true)
    public AssessmentDto.SummaryStats getSummaryStats(String email) {
        User user = findUser(email);
        long total = assessmentRepository.countCompletedByUser(user);
        Double avgScore = assessmentRepository.findAvgRiskScoreByUser(user);
        List<Object[]> byType = assessmentRepository.countByDiseaseTypeForUser(user);
        Map<String, Long> typeMap = byType.stream()
                .filter(row -> row != null && row[0] != null && row[1] != null)
                .collect(Collectors.toMap(
                        row -> row[0].toString(),
                        row -> (Long) row[1]));
        return AssessmentDto.SummaryStats.builder()
                .totalAssessments((int) total)
                .avgRiskScore(avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0)
                .avgRiskLevel(avgScore != null ? classifyRisk(avgScore) : "UNKNOWN")
                .byDiseaseType(typeMap)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AssessmentDto.HistoryResponse> getByDiseaseType(
            String email, Assessment.DiseaseType type) {
        User user = findUser(email);
        return assessmentRepository
                .findByUserAndDiseaseTypeOrderByCreatedAtDesc(user, type)
                .stream().map(this::toHistoryResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, List<AssessmentDto.TrendPoint>> getTrends(String email) {
        User user = findUser(email);
        List<Assessment> assessments = assessmentRepository.findCompletedOrScoredByUserOrderByCreatedAtAsc(user);

        Map<String, List<AssessmentDto.TrendPoint>> trends = new HashMap<>();
        if (assessments != null) {
            for (Assessment a : assessments) {
                if (a == null || a.getDiseaseType() == null) continue;
                String disease = a.getDiseaseType().name();
                LocalDateTime time = a.getCreatedAt() != null ? a.getCreatedAt() : 
                                     (a.getCompletedAt() != null ? a.getCompletedAt() : LocalDateTime.now());
                
                AssessmentDto.TrendPoint tp = AssessmentDto.TrendPoint.builder()
                        .date(time.toString())
                        .riskScore(a.getRiskScore() != null ? a.getRiskScore() : 0.0)
                        .riskLevel(a.getRiskLevel() != null ? a.getRiskLevel() : "LOW")
                        .build();
                
                trends.computeIfAbsent(disease, k -> new ArrayList<>()).add(tp);
            }
        }
        return trends;
    }

    public void delete(String email, Long id) {
        User user = findUser(email);
        Assessment a = assessmentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new NoSuchElementException("Assessment not found: " + id));
        assessmentRepository.delete(a);
    }

    public Map<String, Object> chatWithAdvisor(String email, String message, Long assessmentId) {
        User user = findUser(email);

        Optional<Assessment> assessmentOpt = Optional.empty();
        if (assessmentId != null) {
            assessmentOpt = assessmentRepository.findByIdAndUser(assessmentId, user);
        } else {
            assessmentOpt = assessmentRepository.findFirstByUserAndStatusOrderByCreatedAtDesc(user, Assessment.AssessmentStatus.COMPLETED);
        }

        Map<String, Object> vitals = new HashMap<>();
        String diseaseType = null;

        if (assessmentOpt.isPresent()) {
            Assessment a = assessmentOpt.get();
            diseaseType = a.getDiseaseType().name();
            String inputJson = a.getInputDataJson();
            if (inputJson != null && !inputJson.isEmpty()) {
                try {
                    vitals = objectMapper.readValue(inputJson, new TypeReference<Map<String, Object>>() {});
                } catch (Exception e) {
                    log.error("Failed to parse inputDataJson for assessment {}", a.getId(), e);
                }
            }
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String mlUrl = mlServiceUrl + "/chat";

            Map<String, Object> payload = new HashMap<>();
            payload.put("message", message);
            payload.put("vitals", vitals);
            payload.put("diseaseType", diseaseType);

            ResponseEntity<Map> response = restTemplate.postForEntity(mlUrl, payload, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to communicate with ML Service chat endpoint", e);
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("response", "### MediPredict AI Advisor 🤖\n\nI apologize, but I am currently unable to connect to the ML Microservice to process your request. Please try again in a few moments, or check if the ML service is running.");
        return fallback;
    }


    // ── Mappers ───────────────────────────────────────────────────────

    private AssessmentDto.Response toResponse(Assessment a) {
        return AssessmentDto.Response.builder()
                .id(a.getId())
                .diseaseType(a.getDiseaseType())
                .riskScore(a.getRiskScore() != null ? a.getRiskScore() : 0.0)
                .riskLevel(a.getRiskLevel() != null ? a.getRiskLevel() : "LOW")
                .riskTrend(a.getRiskTrend() != null ? a.getRiskTrend() : 0.0)
                .riskFactors(parseRiskFactors(a.getRiskFactorsJson()))
                .suggestions(parseSuggestions(a.getSuggestionsJson()))
                .status(a.getStatus())
                .createdAt(a.getCreatedAt() != null ? a.getCreatedAt() : (a.getCompletedAt() != null ? a.getCompletedAt() : LocalDateTime.now()))
                .completedAt(a.getCompletedAt())
                .build();
    }

    private AssessmentDto.HistoryResponse toHistoryResponse(Assessment a) {
        return AssessmentDto.HistoryResponse.builder()
                .id(a.getId())
                .diseaseType(a.getDiseaseType())
                .riskScore(a.getRiskScore() != null ? a.getRiskScore() : 0.0)
                .riskLevel(a.getRiskLevel() != null ? a.getRiskLevel() : "LOW")
                .riskTrend(a.getRiskTrend() != null ? a.getRiskTrend() : 0.0)
                .status(a.getStatus())
                .createdAt(a.getCreatedAt() != null ? a.getCreatedAt() : (a.getCompletedAt() != null ? a.getCompletedAt() : LocalDateTime.now()))
                .inputDataJson(a.getInputDataJson())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + email));
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private List<AssessmentDto.RiskFactor> parseRiskFactors(String json) {
        if (json == null)
            return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<String> parseSuggestions(String json) {
        if (json == null)
            return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
