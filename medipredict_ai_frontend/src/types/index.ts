// ── Auth Types ──────────────────────────────────────────────
export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dateOfBirth: string;
    gender: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface UserSummary {
    id: number;
    healthId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profilePictureUrl: string | null;
    emailVerified: boolean;
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: UserSummary;
}

// ── User Types ──────────────────────────────────────────────
export interface ProfileResponse {
    id: number;
    healthId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender: string;
    role: string;
    profilePictureUrl: string | null;
    emailVerified: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface HealthProfileResponse {
    id: number;
    height: number;
    weight: number;
    bmi: number;
    glucoseLevel: number;
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    insulinLevel: number;
    heartRate: number;
    smokingStatus: string;
    totalAssessments: number;
    avgRiskLevel: string;
    avgRiskScore: number;
    nextCheckupDate: string;
    nextCheckupIn: string;
    alcoholConsumption: string;
    physicalActivityLevel: string;
    dietType: string;
    existingConditions: string;
    currentMedications: string;
    familyHistory: string;
    allergies: string;
    lastUpdated: string;
}

export interface StatsResponse {
    avgRiskLevel: string;
    avgRiskScore: number;
    totalAssessments: number;
    riskChangePct: number;
    newAssessmentsThisMonth: number;
    nextCheckupDate: string;
    nextCheckupIn: string;
}

// ── Assessment Types ────────────────────────────────────────
export type DiseaseType = 'DIABETES' | 'HEART_DISEASE' | 'LIVER_DISEASE' | 'KIDNEY_DISEASE' | 'THYROID_DISEASE' | 'PULMONARY_DISEASE' | 'STROKE' | 'ANEMIA' | 'FULL_SCAN';
export type AssessmentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface AssessmentCreateRequest {
    diseaseType: DiseaseType;
    glucose?: number;
    insulin?: number;
    bmi?: number;
    age?: number;
    bloodPressure?: number;
    pregnancies?: number;
    skinThickness?: number;
    dpf?: number;
    cholesterol?: number;
    heartRate?: number;
    restingBP?: number;
    chestPainType?: number;
    fastingBS?: number;
    stDepression?: number;
    slope?: number;
    numVessels?: number;
    thal?: string;
    totalBilirubin?: number;
    directBilirubin?: number;
    alkalinePhosphotase?: number;
    altaminoTransferase?: number;
    aspartateAminoTransferase?: number;
    totalProteins?: number;
    albumin?: number;
    agRatio?: number;
    specificGravity?: number;
    albumin2?: number;
    sugar?: number;
    bloodGlucoseRandom?: number;
    bloodUrea?: number;
    serumCreatinine?: number;
    sodium?: number;
    potassium?: number;
    haemoglobin?: number;
    reportId?: number;
}

export interface RiskFactor {
    name: string;
    value: string;
    level: string;
    score: number;
}

export interface AssessmentResponse {
    id: number;
    diseaseType: DiseaseType;
    riskScore: number;
    riskLevel: string;
    riskTrend: number;
    riskFactors: RiskFactor[];
    suggestions: string[];
    status: AssessmentStatus;
    createdAt: string;
    completedAt: string;
}

export interface AssessmentHistoryItem {
    id: number;
    diseaseType: DiseaseType;
    riskScore: number;
    riskLevel: string;
    riskTrend: number;
    status: AssessmentStatus;
    createdAt: string;
}

export interface SummaryStats {
    totalAssessments: number;
    avgRiskLevel?: string;
    avgRiskScore?: number;
    averageRiskScore?: number;
    highRiskCount?: number;
    byDiseaseType?: Record<string, number>;
    riskTrendLastMonth?: number;
    riskTrend?: number;
}

// ── Report Types ────────────────────────────────────────────
export type ReportStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export interface ReportResponse {
    id: number;
    fileName: string;
    originalFileName: string;
    fileType: string;
    fileSize: number;
    extractedtext: string;
    status: ReportStatus;
    assessmentId: number | null;
    uploadedAt: string;
    processedAt: string | null;
}

// ── Navigation Types ────────────────────────────────────────
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    ResetPassword: undefined;
    Landing: undefined;
    AuthenticatedWebLayout: undefined;
    MainTabs: {
        screen?: keyof MainTabParamList;
    };
    DiseaseSelection: undefined;
    Home: undefined;
    Diet: undefined;
    Exercise: undefined;
    History: undefined;
    Reports: undefined;
    Profile: undefined;
    RequiredTests: { diseaseType: DiseaseType };
    HealthAnalysis: { diseaseType: DiseaseType };
    Analyzing: { assessmentId: number };
    Result: { assessmentId: number };
    Suggestions: { suggestions?: string[] };
    ClinicCenters: undefined;
    Scheduler: undefined;
    Advisor: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Diet: undefined;
    Exercise: undefined;
    History: undefined;
    Reports: undefined;
    Profile: undefined;
};
