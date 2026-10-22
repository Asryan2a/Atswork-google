import { GoogleGenAI, Type } from "@google/genai";
import {
  generateContextualJobAnalysis,
  generateContextualOptimizedCv,
  generateContextualApplicationDocuments,
  createContextualPdfDiagnosis,
  generateContextualInterviewQuestion,
  evaluateContextualInterviewAnswer,
  generateContextualInterviewSummary,
} from "../utils/dynamicFallback.ts";

// Initialize Gemini client with proper telemetry header
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export interface PdfParsingResult {
  extractedText: string;
  candidateInfo: {
    name: string;
    title: string;
    email?: string;
    phone?: string;
  };
  atsFormatDiagnosis: {
    formatScore: number;
    isTextLayerPresent: boolean;
    layoutQuality: string;
    columnStructure: string;
    risksDetected: string[];
    strengths: string[];
    recommendations: string[];
  };
}

export interface JobRequirementMatchResult {
  requirement: string;
  priority: string; // "obligatoire" | "souhaitée" | "complémentaire"
  isEliminatory: boolean;
  cvEvidence: string;
  matchLevel: string; // "fort" | "partiel" | "non_démontré" | "à_confirmer"
  recommendedAction: string;
  isAiInterpretation: boolean;
}

export interface JobAnalysisResult {
  jobTitle: string;
  companyName: string;
  companyTone: string;
  keyChallenges: string[];
  atsKeywords: {
    hardSkills: string[];
    softSkills: string[];
    toolsAndTech: string[];
    certificationsOrEducation: string[];
  };
  initialMatchScore: number;
  initialAssessment: string;
  keyMatches: string[];
  gapsIdentified: string[];
  matchMatrix?: JobRequirementMatchResult[];
  candidateQuestions?: string[];
}

export interface SkillCategorySuggestion {
  categoryName: string;
  description: string;
  currentSkills: string[];
  suggestedAdditions: string[];
  whyImportantForAts: string;
}

export interface OptimizedCvResult {
  atsScore: number;
  scoreImprovement: number;
  injectedKeywords: string[];
  summary: string;
  optimizedCvSections: {
    targetTitle: string;
    profileSummary: string; // contains **bold** for ATS keywords
    experiences: Array<{
      role: string;
      company: string;
      period: string;
      location?: string;
      achievements: string[]; // contains **bold** for ATS keywords & metrics
    }>;
    skills: {
      technical: string[]; // Hard skills métier & stratégiques
      tools: string[]; // Outils, logiciels & plateformes
      methodologies: string[]; // Méthodologies & process
      dataAndAnalytics: string[]; // Data, KPIs & pilotage
      softSkills: string[]; // Leadership & Qualités humaines
      languages: string[]; // Langues
    };
    education: Array<{
      degree: string;
      institution: string;
      year: string;
      details?: string;
    }>;
  };
  skillCategorySuggestions: SkillCategorySuggestion[];
  imagenPrompt: {
    sector: string;
    styleDescription: string;
    promptEn: string;
    promptFr: string;
    recommendedDressCode: string;
  };
}

export interface CandidateDocumentsResult {
  emailPitch: {
    subject: string;
    wordCount: number;
    content: string;
  };
  coverLetter: {
    wordCount: number;
    toiSection: string; // The company & their challenges
    moiSection: string; // The candidate & proven achievements from CV
    nousSection: string; // The synergy & clear interview call to action
    fullLetterFormatted: string;
  };
  followUpEmail: {
    timing: string; // e.g., "7 à 10 jours après envoi"
    subject: string;
    content: string;
  };
}

/**
 * Step 1: Analyze Job Offer & Initial CV Matching
 */
export async function analyzeJobAndProfile(
  jobDescription: string,
  currentCv: string,
  extraNotes?: string
): Promise<JobAnalysisResult> {
  try {
    const ai = getGeminiClient();

    const systemInstruction = `Tu es un expert recruteur international et spécialiste des algorithmes de filtrage ATS (Applicant Tracking System).
Ton rôle est d'analyser en profondeur une offre d'emploi et de la confronter au CV actuel d'un candidat.
Réponds EXCLUSIVEMENT en JSON valide respectant scrupuleusement la structure demandée.

Règles d'analyse :
- EXTRACTION EXACTE DU POSTE ET DE L'ENTREPRISE :
  * Extrais l'intitulé EXACT du poste tel qu'écrit dans l'offre (ex: "Chargé de Communication et Marketing Opérationnel"). Ne remplace JAMAIS l'intitulé par un titre générique comme "Responsable Marketing Digital" ou "Lead Développeur" si l'offre stipule "Chargé de Communication et Marketing Opérationnel".
  * Extrais le NOM RÉEL de l'entreprise qui recrute (ex: "Scalens", "Doctolib", etc.) depuis le texte, l'en-tête, la section "À propos" ou les phrases de présentation. Ne mets JAMAIS le mot générique "Entreprise". Si le nom est strictement introuvable, indique "Entreprise confidentielle".
  * Identifie le ton dominant (ex: "Startup innovante & agile", "Corporate exigeant & structuré", "Cabinet de conseil stratégique").
- Définis les défis majeurs de l'entreprise (ce pour quoi ils recrutent).
- Liste tous les mots-clés ATS décisifs (Hard skills, Soft skills, Outils & Méthodes).
- Évalue honnêtement le score d'adéquation initial (de 0 à 100) du CV actuel sans optimisation (ne jamais gonfler artificiellement ce score).
- MATRICE DE CORRESPONDANCE CV / OFFRE (5 à 8 exigences clés) :
  Pour chaque exigence :
  * requirement : intitulé précis de l'exigence
  * priority : "obligatoire", "souhaitée" ou "complémentaire"
  * isEliminatory : true si l'exigence est mentionnée comme indispensable / éliminatoire
  * cvEvidence : preuve textuelle vérifiable dans le CV (ou "Non démontrée dans le CV actuel")
  * matchLevel : "fort", "partiel", "non_démontré" ou "à_confirmer"
  * recommendedAction : conseil concret pour valoriser le profil
  * isAiInterpretation : true s'il s'agit d'une déduction de l'IA plutôt que d'un fait textuel
- LECTURE EXHAUSTIVE DU CV & AUCUN FAUX NÉGATIF :
  * Recherche scrupuleusement TOUS les acronymes, abréviations et synonymes dans le CV brut (ex: "CRO" = Conversion Rate Optimization = optimisation de la conversion / parcours client ; "GA4" = Google Analytics ; "SEA" = Google Ads ; etc.).
  * Si le terme, un acronyme (comme "CRO") ou un concept figure dans le texte brut du CV, TU DOIS OBLIGATOIREMENT le reconnaître comme présent ('fort'), citer la phrase exacte dans 'cvEvidence', et NE JAMAIS prétendre qu'il est absent ou non mentionné !
- Formule 2 à 4 "candidateQuestions" ciblées à poser au candidat pour lever les ambiguïtés sans préjuger de ses compétences.
- RÈGLE ABSOLUE : Une compétence non mentionnée dans le CV ne signifie pas que le candidat ne la possède pas.`;

    const prompt = `Voici l'offre d'emploi à analyser :
---
${jobDescription}
---

Voici le CV actuel du candidat :
---
${currentCv || "Non fourni pour le moment (évaluation globale de l'offre uniquement)."}
---
${extraNotes ? `Notes complémentaires du candidat : ${extraNotes}` : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            jobTitle: { type: Type.STRING },
            companyName: { type: Type.STRING },
            companyTone: { type: Type.STRING },
            keyChallenges: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            atsKeywords: {
              type: Type.OBJECT,
              properties: {
                hardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                toolsAndTech: { type: Type.ARRAY, items: { type: Type.STRING } },
                certificationsOrEducation: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["hardSkills", "softSkills", "toolsAndTech", "certificationsOrEducation"],
            },
            initialMatchScore: { type: Type.INTEGER },
            initialAssessment: { type: Type.STRING },
            keyMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
            gapsIdentified: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchMatrix: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  requirement: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  isEliminatory: { type: Type.BOOLEAN },
                  cvEvidence: { type: Type.STRING },
                  matchLevel: { type: Type.STRING },
                  recommendedAction: { type: Type.STRING },
                  isAiInterpretation: { type: Type.BOOLEAN },
                },
                required: ["requirement", "priority", "cvEvidence", "matchLevel", "recommendedAction"],
              },
            },
            candidateQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "jobTitle",
            "companyName",
            "companyTone",
            "keyChallenges",
            "atsKeywords",
            "initialMatchScore",
            "initialAssessment",
            "keyMatches",
            "gapsIdentified",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return parsed as JobAnalysisResult;
  } catch (err: any) {
    console.warn("Gemini analyzeJobAndProfile quota/network notice, falling back:", err?.message);
    return generateContextualJobAnalysis(jobDescription, currentCv, "Candidat", "Corporate") as any;
  }
}

/**
 * Step 2: Surgical CV Optimization for ATS (Rule of gold: NO LIES / NO INVENTED EXPERIENCES)
 * Plus Imagen 4.0 prompt tailored to industry
 */
export async function optimizeCvForAts(
  currentCv: string,
  jobAnalysis: JobAnalysisResult,
  targetSector?: string
): Promise<OptimizedCvResult> {
  try {
    const ai = getGeminiClient();

  const systemInstruction = `Tu es un auditeur de carrière et rédacteur chirurgical de CV spécialisé dans les filtres ATS (Applicant Tracking Systems : Workday, Taleo, Greenhouse).

🚨 RÈGLES FONDAMENTALES ABSOLUES :

1. DATE DE RÉFÉRENCE TEMPORELLE : NOUS SOMMES EN NOVEMBRE 2026.
   - L'année 2026 est l'année EN COURS.
   - Une date comme 'Février 2026' ou toute date de 2026 est une date réelle, normale, cohérente et passée/en cours.
   - IL EST STRICTEMENT INTERDIT de signaler une "anomalie temporelle" sur l'année 2026.
   - Ne critique JAMAIS de fausses coquilles d'espacement (ex: 'Pil oter', 'c oordination') issues du parsing PDF.

2. ACCORD GRAMMATICAL : LE CANDIDAT EST UN HOMME.
   - Tous les textes (titre de profil, synthèse, réalisations, adjectifs, participes passés) DOIVENT être rédigés STRICTEMENT AU MASCULIN (ex: "Professionnel confirmé", "Reconnu pour", "Passionné", "Diplômé").
   - INTERDICTION STRICTE des formulations inclusives avec des parenthèses comme "(e)" ou "(le)" ou des formes féminines.

3. INTERDICTION FORMELLE D'INVENTER DES CHIFFRES, DES POURCENTAGES OU DES MÉTRIQUES :
   - Si le CV original ne contient pas de chiffre précis (ex: +28%, +35%, 1.2M€, 99.9%), IL EST STRICTEMENT INTERDIT DE LES INVENTER.
   - Ne crée aucun pourcentage de conversion inventé comme "+28%".
   - Décris l'impact réel et l'excellence opérationnelle avec des verbes d'action puissants sans fabriquer de fausses données quantitatives.

4. INTERDICTION FORMELLE D'INVENTER DES DIPLÔMES OU DES ÉCOLES :
   - Conserve STRICTEMENT et UNIQUEMENT les diplômes, établissements scolaires et années de formation présents dans le CV réel du candidat.
   - Si le CV ne mentionne pas de "Master en Marketing & Stratégie Digitale" ou d'école de commerce spécifique, NE L'INVENTE SOUS AUCUN PRÉTEXTE.
   - Si aucune formation n'est listée dans le CV, reproduis fidèlement le parcours sans créer de fausse scolarité.

5. ALIGNEMENT STRICT SUR L'OFFRE ET LE MÉTIER DU CANDIDAT :
   - Adapte l'intitulé de profil (targetTitle) STRICTEMENT au secteur et au poste réel :
     - Si le poste ou le CV relève du MARKETING (ex: Marketing Digital, Lead Gen, Brand, Communication), l'intitulé DOIT être un titre Marketing (ex: "RESPONSABLE MARKETING DIGITAL & STRATÉGIE", "CHEF DE PROJET MARKETING").
     - INTERDICTION FORMELLE d'attribuer un titre de développeur web (comme "Lead Développeur Fullstack React") à un profil Marketing ou Commercial !
     - Le titre doit correspondre à 100% à l'intitulé ciblé (${jobAnalysis.jobTitle}).

6. RÈGLE DE CONSERVATION INTÉGRALE DES EXPÉRIENCES ET MISSIONS :
   - CONSERVE STRICTEMENT TOUTES LES EXPÉRIENCES du candidat (entreprises réelles, dates, lieux, intitulés réels).
   - CONSERVE L'INTÉGRALITÉ DES MISSIONS ET PUCES RÉELLES :
     * Si une expérience comporte 4, 5, 6, 7 ou 8 puces/missions dans le CV original, TU DOIS TOUTES LES CONSERVER (même nombre de puces ou davantage).
     * IL EST STRICTEMENT INTERDIT de supprimer des missions ou de résumer une expérience en seulement 2 ou 3 puces génériques !
     * Reprends chaque tâche réelle du candidat et bonifie-la chirurgicalement : utilise un verbe d'action fort au masculin, clarifie la portée opérationnelle, et intègre naturellement les mots-clés ATS de l'offre en **gras**.
     * RÈGLE D'ÉLIMINATION STRICTE : La SEULE exception où une puce peut être écartée est si elle n'a rigoureusement AUCUN rapport direct ni indirect avec les compétences recherchées ou s'il s'agit d'un doublon textuel évident.
     * Dans tous les autres cas : REPRENDS 100% DE LA MATIÈRE DU CV et sublime chaque phrase sans rien amputer.
     * INTERDICTION STRICTE DE SUBSTITUER UNE MISSION PAR UNE PHRASE HORS SUJET : Chaque suggestion de wording doit porter sur le MÊME sujet exact, les MÊMES outils logiciels et les MÊMES canaux que l'original du candidat (ex: si le CV cite HubSpot, CRM et e-mailing, la suggestion DOIT garder HubSpot, CRM et e-mailing ; si le CV cite médias sociaux, LinkedIn, Instagram et WordPress, la suggestion DOIT garder LinkedIn, Instagram et WordPress) !
   - AUCUN projet imaginaire (ex: pas de création de podcast si non mentionné dans le CV). Ne fabrique aucun fait.

7. CATÉGORISATION COMPLÈTE DES COMPÉTENCES & SUGGESTIONS :
   - Classe les compétences du candidat en 6 catégories distinctes :
     1. Compétences Métier & Stratégiques (technical)
     2. Outils, Logiciels & Plateformes (tools)
     3. Méthodologies & Process de travail (methodologies)
     4. Data, Analyse & KPIs de performance (dataAndAnalytics)
     5. Soft Skills & Leadership (softSkills)
     6. Langues (languages)
   - Fournis dans "skillCategorySuggestions" une liste de suggestions par catégorie, avec les compétences actuelles, les ajouts pertinents issus de l'offre et la justification pour passer les filtres ATS.

8. MISE EN VALEUR :
   - Utilise la syntaxe markdown **mot-clé** (en gras) pour mettre en évidence les termes ATS valorisés.`;

  const prompt = `Voici le CV STRICTEMENT RÉEL du candidat à optimiser :
---
${currentCv}
---

Poste ciblé dans l'offre : "${jobAnalysis.jobTitle}" chez "${jobAnalysis.companyName}"
Ton de l'entreprise : ${jobAnalysis.companyTone}
Mots-clés recherchés par l'offre : ${JSON.stringify(jobAnalysis.atsKeywords)}
Défis clés de l'entreprise : ${jobAnalysis.keyChallenges.join(", ")}
Secteur : ${targetSector || "Secteur correspondant à l'offre"}

RAPPEL IMPÉRATIF :
- Le candidat est un HOMME : accorde strictement au masculin (pas de "(e)", pas d'inclusif).
- N'invente AUCUN chiffre ni pourcentage (ex: JAMAIS de "+28%").
- N'invente AUCUN diplôme imaginaire (ex: pas de "Master en Marketing" s'il n'est pas dans le CV).
- Conserve et bonifie 100% des missions et puces réelles de chaque expérience sans en supprimer (interdiction de résumer une expérience détaillée en 2 puces).
- Ne crée AUCUNE mission imaginaire (ex: pas de création de podcast).
- Structure toutes les compétences par catégories.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.2, // Strict adherence to facts
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          atsScore: { type: Type.INTEGER },
          scoreImprovement: { type: Type.INTEGER },
          injectedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING },
          optimizedCvSections: {
            type: Type.OBJECT,
            properties: {
              targetTitle: { type: Type.STRING },
              profileSummary: { type: Type.STRING },
              experiences: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING },
                    company: { type: Type.STRING },
                    period: { type: Type.STRING },
                    location: { type: Type.STRING },
                    achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["role", "company", "period", "achievements"],
                },
              },
              skills: {
                type: Type.OBJECT,
                properties: {
                  technical: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tools: { type: Type.ARRAY, items: { type: Type.STRING } },
                  methodologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dataAndAnalytics: { type: Type.ARRAY, items: { type: Type.STRING } },
                  softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["technical", "tools", "methodologies", "dataAndAnalytics", "softSkills", "languages"],
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    degree: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    year: { type: Type.STRING },
                    details: { type: Type.STRING },
                  },
                  required: ["degree", "institution", "year"],
                },
              },
            },
            required: ["targetTitle", "profileSummary", "experiences", "skills", "education"],
          },
          skillCategorySuggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                categoryName: { type: Type.STRING },
                description: { type: Type.STRING },
                currentSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedAdditions: { type: Type.ARRAY, items: { type: Type.STRING } },
                whyImportantForAts: { type: Type.STRING },
              },
              required: ["categoryName", "description", "currentSkills", "suggestedAdditions", "whyImportantForAts"],
            },
          },
          imagenPrompt: {
            type: Type.OBJECT,
            properties: {
              sector: { type: Type.STRING },
              styleDescription: { type: Type.STRING },
              promptEn: { type: Type.STRING },
              promptFr: { type: Type.STRING },
              recommendedDressCode: { type: Type.STRING },
            },
            required: ["sector", "styleDescription", "promptEn", "promptFr", "recommendedDressCode"],
          },
        },
        required: [
          "atsScore",
          "scoreImprovement",
          "injectedKeywords",
          "summary",
          "optimizedCvSections",
          "skillCategorySuggestions",
          "imagenPrompt",
        ],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return parsed as OptimizedCvResult;
  } catch (err: any) {
    console.warn("Gemini optimizeCvForAts quota/network notice, falling back:", err?.message);
    return generateContextualOptimizedCv(currentCv, jobAnalysis as any, targetSector || "Corporate") as any;
  }
}

/**
 * Step 3: Application Documents Drafting (Email Pitch max 150 words + Cover Letter Toi/Moi/Nous 300-400 words + Relance)
 */
export async function generateApplicationDocuments(
  jobAnalysis: JobAnalysisResult,
  optimizedCv: OptimizedCvResult,
  candidateName: string,
  extraToneInstructions?: string
): Promise<CandidateDocumentsResult> {
  try {
    const ai = getGeminiClient();

  const systemInstruction = `Tu es un rédacteur d'élite en communication de recrutement et stratégie de carrière.
Tu rédiges les documents de candidature basés sur le CV optimisé et l'analyse de l'entreprise.

🚨 RÈGLES FORMELLES ET ABSOLUES :
1. LE CANDIDAT EST UN HOMME :
   - Tous les textes doivent être accordés STRICTEMENT AU MASCULIN (ex: "diplômé", "confirmé", "passionné", "candidat", "motivé", "engagé").
   - INTERDICTION des formes féminines ou des parenthèses inclusives comme "(e)".

2. ZÉRO INVENTION DE CHIFFRES OU MÉTRIQUES :
   - Si les expériences du CV ne contiennent pas de pourcentage ou de chiffre particulier, NE LES INVENTE PAS (pas de '+28%', '+35%', etc.).
   - Mets en valeur l'impact réel, les compétences clés et la rigueur d'exécution sans créer de fausses statistiques.

3. CONCORDANCE ABSOLUE AVEC LE POSTE ET L'ENTREPRISE :
   - Le poste visé est STRICTEMENT "${jobAnalysis.jobTitle}" chez "${jobAnalysis.companyName}".
   - L'objet des courriels et la lettre doivent cibler EXCLUSIVEMENT "${jobAnalysis.jobTitle}" chez "${jobAnalysis.companyName}".
   - INTERDICTION ABSOLUE d'écrire "au sein de Entreprise" : utilise TOUJOURS le nom réel de l'entreprise ("${jobAnalysis.companyName}") ou "au sein de votre entreprise" si le nom est confidentiel.
   - INTERDICTION ABSOLUE de faire référence à des rôles sans rapport (ex: "Lead Développeur Fullstack React / Node.js" ou Doctolib) quand l'offre concerne "${jobAnalysis.jobTitle}".

4. GRAMMAIRE ET ÉLÉGANCE RÉDACTIONNELLE EN FRANÇAIS :
   - RÈGLE GRAMMATICALE IMPÉRATIVE : Ne JAMAIS faire suivre la préposition "dans" d'un verbe à l'infinitif !
     * FAUX : "j'ai développé une solide expertise dans Augmenter le taux de conversion..."
     * VRAI : "j'ai développé une solide expertise dédiée à augmenter le taux de conversion..." ou "pour optimiser le taux de conversion..." ou "dans l'optimisation du taux de conversion...".
   - Toutes les phrases doivent être naturelles, soignées et de niveau exécutif.
   - La section "TOI" doit être ultra-spécifique à l'entreprise "${jobAnalysis.companyName}" et à ses défis opérationnels.

Contraintes de structure :
1. LE COURRIEL D'ACCOMPAGNEMENT (MAXIMUM 150 MOTS) :
   - Objet percutant : Candidature ${jobAnalysis.jobTitle} - ${candidateName || "Le Candidat"}.
   - Accroche directe et engageante.
   - Démonstration du fit avec 2 à 3 points forts réels.
   - Appel à l'action clair.
   - Moins de 150 mots au total.

2. LA LETTRE DE MOTIVATION (300 À 400 MOTS) - STRUCTURE TOI / MOI / NOUS :
   - BLOC 1 : "TOI" (L'entreprise ${jobAnalysis.companyName}) -> Compréhension de leurs défis spécifiques (${jobAnalysis.keyChallenges.join(", ")}).
   - BLOC 2 : "MOI" (Le candidat) -> Parcours réel et compétences concrètes sans faux chiffres.
   - BLOC 3 : "NOUS" (La synergie) -> Contribution mutuelle et invitation enthousiaste à un entretien.
   - Longueur totale : Strictement entre 300 et 400 mots.

3. LE COURRIEL DE RELANCE (J+7 à J+10) :
   - Courriel poli, proactif, réaffirmant l'intérêt et la pertinence du profil pour le poste de ${jobAnalysis.jobTitle} chez ${jobAnalysis.companyName}.`;

  const prompt = `Voici les données vérifiées :
Poste ciblé : ${jobAnalysis.jobTitle}
Entreprise ciblée : ${jobAnalysis.companyName}
Ton de l'entreprise : ${jobAnalysis.companyTone}
Défis de l'entreprise : ${jobAnalysis.keyChallenges.join(" | ")}
Candidat (Homme) : ${candidateName || "Le Candidat"}
CV optimisé et réalisations réelles :
Titre : ${optimizedCv.optimizedCvSections.targetTitle}
Accroche : ${optimizedCv.optimizedCvSections.profileSummary}
Expériences : ${JSON.stringify(optimizedCv.optimizedCvSections.experiences)}
Mots-clés valorisés : ${optimizedCv.injectedKeywords.join(", ")}
${extraToneInstructions ? `Instructions supplémentaires de style : ${extraToneInstructions}` : ""}

RAPPEL : Le candidat est un homme (accord masculin strict). Pas de faux pourcentages (+28% interdit). Objet et corps de texte dédiés à ${jobAnalysis.jobTitle} chez ${jobAnalysis.companyName}.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          emailPitch: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              wordCount: { type: Type.INTEGER },
              content: { type: Type.STRING },
            },
            required: ["subject", "wordCount", "content"],
          },
          coverLetter: {
            type: Type.OBJECT,
            properties: {
              wordCount: { type: Type.INTEGER },
              toiSection: { type: Type.STRING },
              moiSection: { type: Type.STRING },
              nousSection: { type: Type.STRING },
              fullLetterFormatted: { type: Type.STRING },
            },
            required: ["wordCount", "toiSection", "moiSection", "nousSection", "fullLetterFormatted"],
          },
          followUpEmail: {
            type: Type.OBJECT,
            properties: {
              timing: { type: Type.STRING },
              subject: { type: Type.STRING },
              content: { type: Type.STRING },
            },
            required: ["timing", "subject", "content"],
          },
        },
        required: ["emailPitch", "coverLetter", "followUpEmail"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return parsed as CandidateDocumentsResult;
  } catch (err: any) {
    console.warn("Gemini generateApplicationDocuments quota/network notice, falling back:", err?.message);
    return generateContextualApplicationDocuments(jobAnalysis as any, optimizedCv as any, candidateName, extraToneInstructions) as any;
  }
}

/**
 * Image generation for professional portrait preview
 */
export async function generatePortraitPreview(promptEn: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-image",
    contents: {
      parts: [
        {
          text: `${promptEn}, high quality LinkedIn headshot, corporate professional portrait, 8k resolution, clean bokeh background, realistic skin texture, photorealistic`,
        },
      ],
    },
  });

  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image data generated by the model");
}

/**
 * Sanitizes risks to ensure no temporal hallucinations about 2026 and no false PDF kerning complaints
 */
function sanitizeAtsRisks(risks: string[]): string[] {
  if (!Array.isArray(risks)) return [];
  return risks.filter((risk) => {
    const lower = risk.toLowerCase();
    // Filter out 2026 / future temporal hallucinations
    if (
      lower.includes("temporelle") ||
      lower.includes("2026") ||
      lower.includes("anticipation future") ||
      lower.includes("date future")
    ) {
      return false;
    }
    // Filter out false typographic kerning complaints
    if (
      lower.includes("pil oter") ||
      lower.includes("c oordination") ||
      (lower.includes("coquille") && lower.includes("typograph")) ||
      lower.includes("espace intempestif") ||
      lower.includes("espacement de mots")
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Fast & Reliable ATS Format Diagnosis and Text Structuring using Gemini
 */
export async function diagnoseCvAts(
  extractedText: string,
  filename: string
): Promise<PdfParsingResult> {
  try {
    const ai = getGeminiClient();

    const systemInstruction = `Tu es le moteur d'ingestion et d'analyse technique ATS (Applicant Tracking System) de référence mondiale (équivalent aux parsers de Workday, Taleo, Greenhouse, SmartRecruiters).
Tu reçois le texte extrait directement d'un fichier CV PDF "${filename}".

🚨 RÈGLES FONDAMENTALES D'AUDIT :
1. CONTEXTE TEMPOREL : NOUS SOMMES EN NOVEMBRE 2026. L'année 2026 est l'année EN COURS.
   - Une date comme 'Février 2026' ou toute date de l'année 2026 est une date réelle, normale, cohérente et passée ou en cours.
   - IL EST STRICTEMENT INTERDIT de signaler une "anomalie temporelle", une erreur de saisie ou une anticipation future sur l'année 2026 !
2. TYPOGRAPHIE & KERNING :
   - INTERDICTION STRICTE de relever de fausses coquilles typographiques ou des espacements de caractères (comme 'Pil oter', 'c oordination') qui proviennent de la couche de rendu du fichier PDF.
   - Ne signale des risques QUE s'il s'agit de véritables anomalies structurelles de parsing ATS (ex: absence de coordonnées, texte sous forme d'image scannée, tableaux imbriqués illisibles).

Tes missions :
1. Restructurer fidèlement et proprement le texte extrait pour qu'il soit parfaitement lisible (Conserve TOUS les faits, entreprises, dates, missions, technologies, diplômes réels).
2. Extraire les coordonnées et le titre du candidat (nom, titre, email, téléphone si présents).
3. Produire un audit technique ATS approfondi :
   - Évaluer un score de lisibilité ATS du format (sur 100)
   - Vérifier la présence de couche texte (true car le texte a été extrait)
   - Analyser la qualité de la structure et l'ordre de lecture
   - Lister les points forts techniques pour les filtres ATS
   - Détecter les éventuels risques réels (sans faux positifs de date ou d'espacement)
   - Formuler des recommandations d'optimisation ATS précises.

Réponds EXCLUSIVEMENT en JSON valide.`;

    const prompt = `Voici le texte extrait du CV PDF "${filename}" :
---
${extractedText.slice(0, 15000)}
---
Effectue l'audit de parsing ATS et la structuration du profil. Rappel : nous sommes en novembre 2026.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedText: {
              type: Type.STRING,
              description: "Le texte structuré et nettoyé du CV.",
            },
            candidateInfo: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
              },
              required: ["name", "title"],
            },
            atsFormatDiagnosis: {
              type: Type.OBJECT,
              properties: {
                formatScore: { type: Type.INTEGER },
                isTextLayerPresent: { type: Type.BOOLEAN },
                layoutQuality: { type: Type.STRING },
                columnStructure: { type: Type.STRING },
                risksDetected: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                "formatScore",
                "isTextLayerPresent",
                "layoutQuality",
                "columnStructure",
                "risksDetected",
                "strengths",
                "recommendations",
              ],
            },
          },
          required: ["extractedText", "candidateInfo", "atsFormatDiagnosis"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}") as PdfParsingResult;
    if (parsed.atsFormatDiagnosis?.risksDetected) {
      parsed.atsFormatDiagnosis.risksDetected = sanitizeAtsRisks(parsed.atsFormatDiagnosis.risksDetected);
    }
    return parsed;
  } catch (err: any) {
    console.warn("Gemini diagnoseCvAts quota/network notice, falling back to deterministic parser:", err?.message);
    return createContextualPdfDiagnosis(extractedText, filename) as any;
  }
}

/**
 * PDF Parsing using Gemini Multimodal (when raw base64 is passed)
 */
export async function parseCvPdf(
  base64Data: string,
  filename: string
): Promise<PdfParsingResult> {
  try {
    const ai = getGeminiClient();

    const systemInstruction = `Tu es le moteur d'ingestion et d'analyse ATS (Applicant Tracking System) de référence mondiale.
Rappel absolu : Nous sommes en novembre 2026. L'année 2026 est normale. Ne signale aucune anomalie temporelle sur 2026. Ne signale pas de coquilles d'espacement (ex: 'Pil oter', 'c oordination').
Extrais fidèlement le texte du CV PDF et produis un audit ATS.
Réponds EXCLUSIVEMENT en JSON valide.`;

    // Clean base64 data: remove any whitespace or line breaks
    const cleaned = base64Data.replace(/[\r\n\s]/g, "");

    const pdfPart = {
      inlineData: {
        mimeType: "application/pdf",
        data: cleaned,
      },
    };

    const textPart = {
      text: `Analyse ce fichier PDF de CV "${filename}". Extrais l'intégralité du texte et évalue sa lisibilité pour les robots ATS (date de référence : novembre 2026).`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [pdfPart, textPart],
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedText: { type: Type.STRING },
            candidateInfo: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
              },
              required: ["name", "title"],
            },
            atsFormatDiagnosis: {
              type: Type.OBJECT,
              properties: {
                formatScore: { type: Type.INTEGER },
                isTextLayerPresent: { type: Type.BOOLEAN },
                layoutQuality: { type: Type.STRING },
                columnStructure: { type: Type.STRING },
                risksDetected: { type: Type.ARRAY, items: { type: Type.STRING } },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                "formatScore",
                "isTextLayerPresent",
                "layoutQuality",
                "columnStructure",
                "risksDetected",
                "strengths",
                "recommendations",
              ],
            },
          },
          required: ["extractedText", "candidateInfo", "atsFormatDiagnosis"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}") as PdfParsingResult;
    if (parsed.atsFormatDiagnosis?.risksDetected) {
      parsed.atsFormatDiagnosis.risksDetected = sanitizeAtsRisks(parsed.atsFormatDiagnosis.risksDetected);
    }
    return parsed;
  } catch (err: any) {
    console.warn("Gemini parseCvPdf quota/network notice, falling back to deterministic parser:", err?.message);
    return createContextualPdfDiagnosis("", filename) as any;
  }
}

/**
 * Image-to-Image transformation of user-uploaded photo into a professional portrait
 */
export async function modifyUserPhoto(
  base64Image: string,
  mimeType: string = "image/jpeg",
  promptInstruction: string
): Promise<string> {
  const ai = getGeminiClient();
  const cleaned = base64Image.replace(/^data:[^;]+;base64,/, "").trim();

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-image",
    contents: {
      parts: [
        {
          inlineData: {
            data: cleaned,
            mimeType: mimeType || "image/jpeg",
          },
        },
        {
          text: `Professional photo headshot modification for CV and LinkedIn.
Instruction: ${promptInstruction}.
Retain the facial identity of the person in the photo while enhancing lighting to studio quality 3-point soft lighting, refining business attire appropriate for the professional sector, and creating a soft, elegant background bokeh blur. Crisp focus, clean photorealistic skin texture, corporate excellence.`,
        },
      ],
    },
  });

  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("Le modèle n'a pas retourné de données d'image modifiée.");
}

/**
 * 7. SIMULATION D'ENTRETIEN RENFORCÉE
 * Génère la prochaine question adaptée à l'offre, au CV et aux réponses précédentes.
 */
export async function generateInterviewQuestion(
  jobAnalysis: any,
  currentCv: string,
  turnNumber: number,
  previousTurns: Array<{ question: string; answer?: string }> = []
): Promise<{
  question: string;
  category: "motivation" | "métier" | "mise_en_situation" | "comportementale_star" | "projection";
  context: string;
}> {
  try {
    const ai = getGeminiClient();

    const categories: Array<"motivation" | "métier" | "mise_en_situation" | "comportementale_star" | "projection"> = [
      "motivation",
      "métier",
      "mise_en_situation",
      "comportementale_star",
      "projection",
    ];
    const targetCategory = categories[(turnNumber - 1) % categories.length];

    const systemInstruction = `Tu es un recruteur expert et bienveillant menant un entretien d'embauche pour le poste de "${jobAnalysis.jobTitle}" chez "${jobAnalysis.companyName}".
Ton rôle est de poser UNE SEULE QUESTION précise, réaliste et stimulante, adaptée à l'offre et au parcours du candidat (CV fourni).
Tu adaptes la question aux éventuelles questions déjà posées.

Règles :
1. Catégorie visée pour ce tour #${turnNumber} : "${targetCategory}".
   - "motivation" : pourquoi ce poste, pourquoi cette entreprise (${jobAnalysis.companyName}), adéquation avec le projet pro.
   - "métier" : compétences techniques réelles, maîtrise des outils ou missions clés de l'offre.
   - "mise_en_situation" : cas concret opérationnel auquel le candidat sera confronté chez ${jobAnalysis.companyName}.
   - "comportementale_star" : question STAR invitant à raconter une situation vécue, la tâche, les actions concrètes et le résultat mesurable.
   - "projection" : comment le candidat s'organise sur les 90 premiers jours ou fait face à un défi identifié de l'entreprise.
2. Pose UNE SEULE question claire et directe. Pas de questions multiples.
3. Reste respectueux du parcours réel du candidat sans inventer d'expériences fictives.
4. Réponds en JSON strict.`;

    const prompt = `Poste : ${jobAnalysis.jobTitle}
Entreprise : ${jobAnalysis.companyName}
Enjeux de l'entreprise : ${JSON.stringify(jobAnalysis.keyChallenges || [])}
CV du candidat :
${currentCv.slice(0, 4000)}

Historique des échanges précédents :
${JSON.stringify(previousTurns.slice(-3))}

Génère la question #${turnNumber} dans la catégorie "${targetCategory}".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: ["motivation", "métier", "mise_en_situation", "comportementale_star", "projection"],
            },
            context: { type: Type.STRING },
          },
          required: ["question", "category", "context"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (err: any) {
    console.warn("Gemini generateInterviewQuestion quota/network notice, falling back:", err?.message);
    return generateContextualInterviewQuestion(jobAnalysis, turnNumber);
  }
}

/**
 * Évalue la réponse du candidat sur la grille de 5 critères notés de 0 à 5 (Total /25).
 */
export async function evaluateInterviewAnswer(
  jobAnalysis: any,
  currentCv: string,
  question: string,
  candidateAnswer: string,
  category: string
): Promise<{
  totalScore: number;
  criteria: {
    relevance: { score: number; feedback: string };
    clarityAndPrecision: { score: number; feedback: string };
    concreteExamples: { score: number; feedback: string };
    jobAlignment: { score: number; feedback: string };
    structureAndImpact: { score: number; feedback: string };
  };
  strengths: string[];
  improvementAreas: string[];
  concreteAdvice: string;
  suggestedAnswer: string;
}> {
  try {
    const ai = getGeminiClient();

  const systemInstruction = `Tu es un jury expert de recrutement évaluant la réponse d'un candidat pour le poste de "${jobAnalysis.jobTitle}" chez "${jobAnalysis.companyName}".
Le candidat est un homme (accords grammaticaux masculins stricts).

Tu dois évaluer la réponse selon EXACTEMENT 5 CRITÈRES notés de 0 à 5 :
1. Pertinence (score 0 à 5) : la réponse répond-elle directement à la question posée sans digression ?
2. Clarté et précision (score 0 à 5) : vocabulaire professionnel, concision, fluidité d'expression.
3. Présence d'exemples concrets (score 0 à 5) : faits réels, contexte précis, chiffres ou méthodes mentionnées.
4. Adéquation avec le poste (score 0 à 5) : lien direct avec les missions et enjeux de ${jobAnalysis.companyName}.
5. Structure et impact (score 0 à 5) : structuration (intro, développement, conclusion percutante, posture proactive).

TotalScore = somme des 5 critères (sur 25).
Sois juste et bienveillant mais exigeant :
- Une réponse courte ou vague ne dépasse pas 2 ou 3 par critère.
- Une excellente réponse argumentée avec méthode STAR mérite 4 ou 5.

Tu dois impérativement fournir :
- strengths : 2 à 3 points forts observables.
- improvementAreas : 2 axes d'amélioration précis et constructifs.
- concreteAdvice : 1 conseil spécifique et immédiatement actionnable pour convaincre le recruteur en direct.
- suggestedAnswer : Une formulation modèle idéale appliquant la méthode STAR (Situation, Tâche, Action, Résultat) fondée sur les vraies compétences du candidat.

Réponds EXCLUSIVEMENT en JSON valide.`;

  const prompt = `Poste : ${jobAnalysis.jobTitle} chez ${jobAnalysis.companyName}
CV extrait : ${currentCv.slice(0, 3000)}
Question posée (${category}) : "${question}"
Réponse fournie par le candidat :
"${candidateAnswer}"

Évalue cette réponse sur la grille 5 critères / 25 points.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalScore: { type: Type.INTEGER },
          criteria: {
            type: Type.OBJECT,
            properties: {
              relevance: {
                type: Type.OBJECT,
                properties: { score: { type: Type.INTEGER }, feedback: { type: Type.STRING } },
                required: ["score", "feedback"],
              },
              clarityAndPrecision: {
                type: Type.OBJECT,
                properties: { score: { type: Type.INTEGER }, feedback: { type: Type.STRING } },
                required: ["score", "feedback"],
              },
              concreteExamples: {
                type: Type.OBJECT,
                properties: { score: { type: Type.INTEGER }, feedback: { type: Type.STRING } },
                required: ["score", "feedback"],
              },
              jobAlignment: {
                type: Type.OBJECT,
                properties: { score: { type: Type.INTEGER }, feedback: { type: Type.STRING } },
                required: ["score", "feedback"],
              },
              structureAndImpact: {
                type: Type.OBJECT,
                properties: { score: { type: Type.INTEGER }, feedback: { type: Type.STRING } },
                required: ["score", "feedback"],
              },
            },
            required: [
              "relevance",
              "clarityAndPrecision",
              "concreteExamples",
              "jobAlignment",
              "structureAndImpact",
            ],
          },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
          concreteAdvice: { type: Type.STRING },
          suggestedAnswer: { type: Type.STRING },
        },
        required: [
          "totalScore",
          "criteria",
          "strengths",
          "improvementAreas",
          "concreteAdvice",
          "suggestedAnswer",
        ],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  // Ensure totalScore is sum of criteria
  if (parsed.criteria) {
    const sum =
      (parsed.criteria.relevance?.score || 0) +
      (parsed.criteria.clarityAndPrecision?.score || 0) +
      (parsed.criteria.concreteExamples?.score || 0) +
      (parsed.criteria.jobAlignment?.score || 0) +
      (parsed.criteria.structureAndImpact?.score || 0);
    parsed.totalScore = sum;
  }
  return parsed;
  } catch (err: any) {
    console.warn("Gemini evaluateInterviewAnswer quota/network notice, falling back:", err?.message);
    return evaluateContextualInterviewAnswer(jobAnalysis, question, candidateAnswer, category);
  }
}

/**
 * Synthèse finale personnalisée de la session d'entretien
 */
export async function generateInterviewSummary(
  jobAnalysis: any,
  turns: Array<{ question: string; candidateAnswer?: string; evaluation?: any }>
): Promise<{
  averageScore: number;
  questionsAnswered: number;
  demonstratedSkills: string[];
  personalizedImprovementPlan: string[];
}> {
  const answered = turns.filter((t) => t.candidateAnswer && t.evaluation);
  if (answered.length === 0) {
    return {
      averageScore: 0,
      questionsAnswered: 0,
      demonstratedSkills: [],
      personalizedImprovementPlan: ["Répondez à au moins une question pour générer votre bilan d'entretien."],
    };
  }

  const avg = Math.round(
    answered.reduce((acc, t) => acc + (t.evaluation?.totalScore || 0), 0) / answered.length
  );

  const ai = getGeminiClient();
  const prompt = `Poste : ${jobAnalysis.jobTitle} chez ${jobAnalysis.companyName}
Questions et réponses évaluées :
${JSON.stringify(answered.map((t) => ({ q: t.question, a: t.candidateAnswer, score: t.evaluation?.totalScore })))}

Génère une synthèse constructive de fin d'entretien :
- demonstratedSkills : 4 compétences clés que le candidat a validées dans ses réponses.
- personalizedImprovementPlan : 3 actions concrètes prioritaires pour son vrai entretien chez ${jobAnalysis.companyName}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            demonstratedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            personalizedImprovementPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["demonstratedSkills", "personalizedImprovementPlan"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      averageScore: avg,
      questionsAnswered: answered.length,
      demonstratedSkills: parsed.demonstratedSkills || [],
      personalizedImprovementPlan: parsed.personalizedImprovementPlan || [],
    };
  } catch (e) {
    return {
      averageScore: avg,
      questionsAnswered: answered.length,
      demonstratedSkills: ["Posture professionnelle", "Clarté de la communication", "Alignement avec l'offre"],
      personalizedImprovementPlan: [
        "Systématiser la structure STAR (Situation, Tâche, Action, Résultat) pour chaque exemple.",
        `Relier chaque réponse à un défi précis de ${jobAnalysis.companyName}.`,
        "Préparer 2 questions percutantes à poser au recruteur en fin d'entretien.",
      ],
    };
  }
}



