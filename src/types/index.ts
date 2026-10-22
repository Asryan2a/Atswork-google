export interface AtsTechnicalCheck {
  checkName: string;
  status: "pass" | "warning" | "fail";
  severity: "Critique" | "Avertissement" | "Conforme";
  details: string;
  potentialImpact: string;
  recommendedFix: string;
  pointsEarned: number;
  maxPoints: number;
}

export interface AtsScoreBreakdown {
  textLayer: { earned: number; max: number };
  structure: { earned: number; max: number };
  typography: { earned: number; max: number };
  headersAndDates: { earned: number; max: number };
}

export interface AtsFormatDiagnosis {
  formatScore: number;
  isTextLayerPresent: boolean;
  layoutQuality: string;
  columnStructure: string;
  risksDetected: string[];
  strengths: string[];
  recommendations: string[];
  technicalChecks?: AtsTechnicalCheck[];
  scoreBreakdown?: AtsScoreBreakdown;
  methodologyNote?: string;
}

export interface UploadedPdfInfo {
  filename: string;
  sizeBytes: number;
  base64Data: string;
  objectUrl?: string;
  diagnosis?: AtsFormatDiagnosis;
  extractedText?: string;
  candidateName?: string;
}

export interface AtsKeywords {
  hardSkills: string[];
  softSkills: string[];
  toolsAndTech: string[];
  certificationsOrEducation: string[];
}

export interface JobRequirementMatch {
  requirement: string;
  priority: "obligatoire" | "souhaitée" | "complémentaire";
  isEliminatory?: boolean;
  cvEvidence: string;
  matchLevel: "fort" | "partiel" | "non_démontré" | "à_confirmer";
  recommendedAction: string;
  isAiInterpretation?: boolean;
}

export interface JobAnalysis {
  jobTitle: string;
  companyName: string;
  companyTone: string;
  keyChallenges: string[];
  atsKeywords: AtsKeywords;
  initialMatchScore: number;
  initialAssessment: string;
  keyMatches: string[];
  gapsIdentified: string[];
  matchMatrix?: JobRequirementMatch[];
  candidateQuestions?: string[];
  jobUrl?: string;
}

export interface MissionOptimizationItem {
  id: string;
  originalMission: string; // En bleu : ce que tu gardes (texte original brut)
  suggestedWording: string; // En vert : suggestions d'améliorations et de wording ATS
  atsRationale?: string; // Explication de l'amélioration de wording
  isAccepted?: boolean; // Statut d'adoption de la suggestion
}

export interface CvExperience {
  role: string;
  company: string;
  period: string;
  location?: string;
  achievements: string[];
  missionOptimizations?: MissionOptimizationItem[];
}

export interface CvEducation {
  degree: string;
  institution: string;
  year: string;
  details?: string;
}

export interface CategorizedSkills {
  technical: string[]; // Compétences Métier & Stratégiques (Hard Skills)
  tools: string[]; // Outils, Logiciels & Plateformes
  methodologies: string[]; // Méthodologies & Process de travail
  dataAndAnalytics: string[]; // Data, Analyse & KPIs de performance
  softSkills: string[]; // Leadership & Qualités humaines
  languages: string[]; // Langues & International
}

export interface SkillCategorySuggestion {
  categoryName: string;
  description: string;
  currentSkills: string[];
  suggestedAdditions: string[];
  whyImportantForAts: string;
}

export interface OptimizedCvSections {
  targetTitle: string;
  profileSummary: string;
  experiences: CvExperience[];
  skills: CategorizedSkills;
  education: CvEducation[];
}

export interface ImagenPromptData {
  sector: string;
  styleDescription: string;
  promptEn: string;
  promptFr: string;
  recommendedDressCode: string;
}

export interface ChangeTraceabilityItem {
  id: string;
  section: string;
  originalText: string;
  optimizedText: string;
  changeType: "action_verb" | "keyword_injection" | "clarification" | "style";
  atsRationale: string;
}

export interface DeletedBulletItem {
  id: string;
  expIdx: number;
  company: string;
  role: string;
  bulletText: string;
  deletedAt: string;
}

export interface DocumentAuditCheckItem {
  criterion: string;
  status: "pass" | "warning" | "fail";
  details: string;
  recommendation?: string;
}

export interface DocumentAuditReport {
  isFullyCompliant: boolean;
  score: number; // 0 to 100
  checks: DocumentAuditCheckItem[];
  companyNameMatch: boolean;
  jobTitleMatch: boolean;
  candidateNameMatch: boolean;
  noPlaceholderCompany: boolean;
  emailWordCountCheck: boolean;
  coverLetterWordCountCheck: boolean;
  genderAgreementCheck: boolean;
}

export interface OptimizedCv {
  atsScore: number;
  scoreImprovement: number;
  injectedKeywords: string[];
  summary: string;
  optimizedCvSections: OptimizedCvSections;
  skillCategorySuggestions: SkillCategorySuggestion[];
  imagenPrompt: ImagenPromptData;
  changeTraceability?: ChangeTraceabilityItem[];
  deletedBulletHistory?: DeletedBulletItem[];
}

export interface CvVersionRecord {
  version: number;
  timestamp: string;
  label: string;
  cv: OptimizedCv;
}

export interface ApplicationDocuments {
  emailPitch: {
    subject: string;
    wordCount: number;
    content: string;
  };
  coverLetter: {
    wordCount: number;
    toiSection: string;
    moiSection: string;
    nousSection: string;
    fullLetterFormatted: string;
  };
  followUpEmail: {
    timing: string;
    subject: string;
    content: string;
  };
}

// Interview Simulation Types (Grille 5 critères / 25)
export interface InterviewCriterionScore {
  score: number; // 0 to 5
  feedback: string;
}

export interface InterviewEvaluation {
  totalScore: number; // 0 to 25
  criteria: {
    relevance: InterviewCriterionScore;
    clarityAndPrecision: InterviewCriterionScore;
    concreteExamples: InterviewCriterionScore;
    jobAlignment: InterviewCriterionScore;
    structureAndImpact: InterviewCriterionScore;
  };
  strengths: string[];
  improvementAreas: string[];
  concreteAdvice: string;
  suggestedAnswer: string;
}

export interface InterviewTurn {
  id: string;
  questionNumber: number;
  category: "motivation" | "métier" | "mise_en_situation" | "comportementale_star" | "projection";
  question: string;
  candidateAnswer?: string;
  evaluation?: InterviewEvaluation;
  isEvaluating?: boolean;
}

export interface InterviewSessionSummary {
  averageScore: number;
  questionsAnswered: number;
  demonstratedSkills: string[];
  personalizedImprovementPlan: string[];
}

export type ApplicationStep =
  | "step1_analysis"
  | "step2_optimization"
  | "step3_documents"
  | "step_relance"
  | "step_interview";
