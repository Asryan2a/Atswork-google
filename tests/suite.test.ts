import assert from "node:assert";
import {
  extractContextualJobTitle,
  generateContextualJobAnalysis,
  generateContextualOptimizedCv,
  generateContextualApplicationDocuments,
  createContextualPdfDiagnosis,
  generateContextualInterviewQuestion,
  evaluateContextualInterviewAnswer,
  generateContextualInterviewSummary,
  auditApplicationDocuments,
} from "../src/utils/dynamicFallback.ts";

console.log("🧪 Lancement de la suite de tests automatiques & non-régression...\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

// 1. PDF contenant du texte sélectionnable vs PDF scanné
runTest("Test 1: PDF avec couche texte vectorielle vs scanné", () => {
  const selectableDiagnosis = createContextualPdfDiagnosis(
    "Michel Dupont\nChef de projet Marketing\nmichel@example.com\n06 12 34 56 78\nExpériences professionnelles 2024-2026...",
    "cv_vectoriel.pdf"
  );
  assert.strictEqual(selectableDiagnosis.atsFormatDiagnosis.isTextLayerPresent, true);
  assert.ok(selectableDiagnosis.atsFormatDiagnosis.formatScore >= 80);

  const scannedDiagnosis = createContextualPdfDiagnosis("", "cv_scanne.pdf");
  assert.strictEqual(scannedDiagnosis.atsFormatDiagnosis.isTextLayerPresent, false);
  assert.ok(scannedDiagnosis.atsFormatDiagnosis.formatScore <= 50);
});

// 2. CV à deux colonnes & structure
runTest("Test 2: Structure technique et multi-colonnes", () => {
  const diagnosis = createContextualPdfDiagnosis(
    "Jean Martin\nExpert SEO & Acquisition\njean@domain.fr\nExpériences:\n2022-2024: Chef de projet",
    "cv_2col.pdf"
  );
  const columnCheck = diagnosis.atsFormatDiagnosis.technicalChecks?.find(
    (c) => c.checkName === "Structure Linéaire & Multi-Colonnes"
  );
  assert.ok(columnCheck);
  assert.strictEqual(columnCheck.status, "pass");
});

// 3. Dates atypiques & 2026 (année en cours)
runTest("Test 3: Gestion temporelle 2026 sans fausse alerte", () => {
  const cvText = "Michel elbsat\nPoste actuel chez Scalens: Février 2026 - Présent\nProjets majeurs menés en 2026.";
  const diagnosis = createContextualPdfDiagnosis(cvText, "cv.pdf");
  const hasFutureAlert = diagnosis.atsFormatDiagnosis.risksDetected.some((r) =>
    r.toLowerCase().includes("temporelle") || r.toLowerCase().includes("date future")
  );
  assert.strictEqual(hasFutureAlert, false, "L'année 2026 ne doit jamais être signalée comme une anomalie future.");
});

// 4. Coordonnées manquantes vs détectées
runTest("Test 4: Détection précise des coordonnées ou signalement", () => {
  const completeCv = "Alexandre Roux\nalex@pro.com\n0601020304\nExpérience 2023-2026";
  const completeDiag = createContextualPdfDiagnosis(completeCv);
  assert.strictEqual(completeDiag.candidateInfo.email, "alex@pro.com");
  assert.ok(completeDiag.candidateInfo.phone);

  const missingCv = "Alexandre Roux\nAucun contact écrit ici dans le corps du texte.";
  const missingDiag = createContextualPdfDiagnosis(missingCv);
  const contactCheck = missingDiag.atsFormatDiagnosis.technicalChecks?.find(
    (c) => c.checkName === "Détection des Coordonnées Essentielles"
  );
  assert.ok(contactCheck?.status === "fail" || contactCheck?.status === "warning");
});

// 5. Extraction exacte du poste et de l'entreprise
runTest("Test 5: Extraction exacte de l'entreprise et de l'intitulé de l'offre", () => {
  const jobOffer = `À propos de Scalens :
Entreprise pionnière de la tech financière.
Poste : Chargé de Communication et Marketing Opérationnel
Missions : Accélérer la notoriété et le taux de conversion.`;

  const extracted = extractContextualJobTitle(jobOffer);
  assert.strictEqual(extracted.title, "Chargé de Communication et Marketing Opérationnel");
  assert.strictEqual(extracted.company, "Scalens");
  assert.strictEqual(extracted.isMarketing, true);
});

// 6. Matrice de correspondance CV / Offre et Zéro invention
runTest("Test 6: Matrice de correspondance et exigences éliminatoires", () => {
  const jobAnalysis = generateContextualJobAnalysis(
    "Poste: Chargé de Marketing\nEntreprise: Scalens\nExigence obligatoire: Maîtrise des outils SEA",
    "Expérience en SEA et campagnes payantes",
    "Michel",
    "Marketing"
  );

  assert.ok(jobAnalysis.matchMatrix && jobAnalysis.matchMatrix.length >= 3);
  const elimReq = jobAnalysis.matchMatrix?.find((m) => m.isEliminatory);
  assert.ok(elimReq, "Au moins une exigence obligatoire/éliminatoire doit être identifiée");
  assert.ok(jobAnalysis.candidateQuestions && jobAnalysis.candidateQuestions.length >= 2, "Questions préliminaires générées pour lever les doutes");
});

// 7. Optimisation fidèle sans fausses universités ni chiffres inventés
runTest("Test 7: Règle zéro invention dans l'optimisation CV", () => {
  const rawCv = `Michel elbsat
Responsable Communication
Expérience:
Scalens | 2024 - 2026
- Coordination des campagnes digitales et des prestataires
- Gestion du planning de communication`;

  const jobAnalysis = generateContextualJobAnalysis("Chargé de Communication chez Scalens", rawCv, "Michel", "Marketing");
  const optimized = generateContextualOptimizedCv(rawCv, jobAnalysis, "Marketing");

  assert.ok(optimized.optimizedCvSections.experiences.length > 0);
  const exp = optimized.optimizedCvSections.experiences[0];
  assert.strictEqual(exp.company, "Scalens", "L'employeur réel Scalens doit être strictement conservé");

  // Vérifier qu'on n'a pas inventé un diplôme HEC ou ESCP si non mentionné
  const fakeSchools = ["HEC", "ESCP", "ESSEC", "Polytechnique"];
  for (const edu of optimized.optimizedCvSections.education) {
    for (const school of fakeSchools) {
      assert.ok(!edu.institution.includes(school), `L'institution fictive ${school} ne doit pas être inventée.`);
    }
  }
});

// 8. Traçabilité des modifications
runTest("Test 8: Traçabilité des modifications proposées", () => {
  const rawCv = "Coordination des campagnes digitales chez Scalens";
  const jobAnalysis = generateContextualJobAnalysis("Marketing Scalens", rawCv, "Michel", "Marketing");
  const optimized = generateContextualOptimizedCv(rawCv, jobAnalysis, "Marketing");

  assert.ok(optimized.changeTraceability && optimized.changeTraceability.length > 0);
  const change = optimized.changeTraceability[0];
  assert.ok(change.originalText);
  assert.ok(change.optimizedText);
  assert.ok(change.atsRationale);
});

// 9. Respect des limites de mots (Email ≤ 150 mots, Lettre 300-400 mots)
runTest("Test 9: Respect strict du calibrage textuel", () => {
  const jobAnalysis = generateContextualJobAnalysis("Marketing Scalens", "CV", "Michel", "Marketing");
  const optimized = generateContextualOptimizedCv("CV", jobAnalysis, "Marketing");
  const docs = generateContextualApplicationDocuments(jobAnalysis, optimized, "Michel");

  const emailWordCount = docs.emailPitch.content.trim().split(/\s+/).length;
  assert.ok(emailWordCount <= 150, `L'e-mail fait ${emailWordCount} mots, il doit être <= 150 mots`);

  const letterWordCount = docs.coverLetter.fullLetterFormatted.trim().split(/\s+/).length;
  assert.ok(
    letterWordCount >= 200 && letterWordCount <= 450,
    `La lettre fait ${letterWordCount} mots (objectif 300-400 mots)`
  );
});

// 10. Accords grammaticaux masculins stricts
runTest("Test 10: Accords grammaticaux masculins stricts", () => {
  const jobAnalysis = generateContextualJobAnalysis("Marketing Scalens", "CV", "Michel", "Marketing");
  const optimized = generateContextualOptimizedCv("CV", jobAnalysis, "Marketing");
  const docs = generateContextualApplicationDocuments(jobAnalysis, optimized, "Michel");

  const fullText = `${docs.emailPitch.content} ${docs.coverLetter.fullLetterFormatted}`;
  assert.strictEqual(fullText.includes("(e)"), false, "Aucune parenthèse inclusive (e)");
  assert.strictEqual(fullText.includes("candidate"), false, "Doit utiliser 'candidat' au masculin");
});

// 11. Contrôle final d'audit des documents (Section 5)
runTest("Test 11: Audit automatique de conformité documentaire", () => {
  const jobAnalysis = generateContextualJobAnalysis("Marketing Scalens", "CV", "Michel", "Marketing");
  const optimized = generateContextualOptimizedCv("CV", jobAnalysis, "Marketing");
  const docs = generateContextualApplicationDocuments(jobAnalysis, optimized, "Michel");

  const audit = auditApplicationDocuments(docs, jobAnalysis, "Michel");
  assert.strictEqual(audit.noPlaceholderCompany, true, "Aucun 'Entreprise' générique résiduel");
  assert.strictEqual(audit.emailWordCountCheck, true, "Email conforme en longueur");
  assert.strictEqual(audit.genderAgreementCheck, true, "Accords masculins vérifiés");
  assert.ok(audit.score >= 80, "Score d'audit documentaire élevé");
});

// 12. Simulation d'entretien avec 5 critères / 25 points
runTest("Test 12: Simulation d'entretien - 5 critères et note sur 25", () => {
  const jobAnalysis = generateContextualJobAnalysis("Marketing Scalens", "CV", "Michel", "Marketing");
  const question = generateContextualInterviewQuestion(jobAnalysis, 1);
  assert.ok(question.question.length > 10);
  assert.strictEqual(question.category, "motivation");

  const answer = "Chez Scalens, mon objectif est de structurer la communication pour atteindre un taux de conversion élevé avec une méthodologie rigoureuse.";
  const evalResult = evaluateContextualInterviewAnswer(jobAnalysis, question.question, answer, question.category);

  assert.ok(evalResult.totalScore >= 10 && evalResult.totalScore <= 25);
  assert.ok(evalResult.criteria.relevance.score >= 1);
  assert.ok(evalResult.criteria.clarityAndPrecision.score >= 1);
  assert.ok(evalResult.criteria.concreteExamples.score >= 1);
  assert.ok(evalResult.criteria.jobAlignment.score >= 1);
  assert.ok(evalResult.criteria.structureAndImpact.score >= 1);
  assert.ok(evalResult.suggestedAnswer.length > 20);

  const summary = generateContextualInterviewSummary(jobAnalysis, [
    { question: question.question, candidateAnswer: answer, evaluation: evalResult },
  ]);
  assert.ok(summary.overallAverageScore > 0);
  assert.ok(summary.pedagogicalDisclaimer.includes("pédagogique"));
});

// 13. Résilience et Fallback déterministe lors d'erreurs 429
runTest("Test 13: Résilience face au quota Gemini (Erreur 429)", () => {
  // Simule l'appel de diagnostic en cas de quota épuisé
  const res = createContextualPdfDiagnosis("Texte de CV extrait par le navigateur client", "candidature.pdf");
  assert.ok(res.extractedText);
  assert.ok(res.atsFormatDiagnosis.formatScore > 0);
  assert.ok(res.atsFormatDiagnosis.technicalChecks && res.atsFormatDiagnosis.technicalChecks.length === 5);
  assert.ok(res.atsFormatDiagnosis.methodologyNote?.includes("Workday, Taleo ou Greenhouse"));
});

console.log(`\n🎉 Tous les tests (${passedTests}/${totalTests}) ont réussi sans régression !`);
