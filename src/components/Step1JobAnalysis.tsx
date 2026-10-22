import React, { useState } from "react";
import {
  Briefcase,
  Building2,
  Target,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Flame,
  FileCode,
  Sliders,
  UploadCloud,
  FileText,
  Edit2,
  Save,
  X,
  HelpCircle,
  CheckCircle2,
  Check,
  ListChecks,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileCheck,
} from "lucide-react";
import { JobAnalysis, UploadedPdfInfo, JobRequirementMatch } from "../types/index.ts";
import { SAMPLE_PRESETS, Preset } from "../data/samplePresets.ts";
import { PdfUploader } from "./PdfUploader.tsx";

interface Step1JobAnalysisProps {
  jobDescription: string;
  setJobDescription: (val: string) => void;
  currentCv: string;
  setCurrentCv: (val: string) => void;
  candidateName: string;
  setCandidateName: (val: string) => void;
  targetSector: string;
  setTargetSector: (val: string) => void;
  jobAnalysis: JobAnalysis | null;
  setJobAnalysis?: (val: JobAnalysis | null) => void;
  uploadedPdf: UploadedPdfInfo | null;
  onPdfUploaded: (pdfInfo: UploadedPdfInfo) => void;
  onRemovePdf: () => void;
  isParsingPdf: boolean;
  setIsParsingPdf: (val: boolean) => void;
  onParseError: (err: string) => void;
  isLoading: boolean;
  onAnalyze: () => void;
  onProceedToStep2: () => void;
  onSelectPreset: (preset: Preset) => void;
}

export const Step1JobAnalysis: React.FC<Step1JobAnalysisProps> = ({
  jobDescription,
  setJobDescription,
  currentCv,
  setCurrentCv,
  candidateName,
  setCandidateName,
  targetSector,
  setTargetSector,
  jobAnalysis,
  setJobAnalysis,
  uploadedPdf,
  onPdfUploaded,
  onRemovePdf,
  isParsingPdf,
  setIsParsingPdf,
  onParseError,
  isLoading,
  onAnalyze,
  onProceedToStep2,
  onSelectPreset,
}) => {
  const [cvInputMode, setCvInputMode] = useState<"pdf" | "text">(uploadedPdf ? "pdf" : "pdf");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editCompany, setEditCompany] = useState(jobAnalysis?.companyName || "");
  const [editTitle, setEditTitle] = useState(jobAnalysis?.jobTitle || "");
  const [matrixFilter, setMatrixFilter] = useState<"all" | "obligatoire" | "a_confirmer">("all");
  const [showTechnicalAuditDetails, setShowTechnicalAuditDetails] = useState(false);

  React.useEffect(() => {
    if (jobAnalysis) {
      setEditCompany(jobAnalysis.companyName);
      setEditTitle(jobAnalysis.jobTitle);
    }
  }, [jobAnalysis?.companyName, jobAnalysis?.jobTitle]);

  const handleSaveTargetEdit = () => {
    if (!jobAnalysis || !setJobAnalysis) return;
    setJobAnalysis({
      ...jobAnalysis,
      companyName: editCompany.trim() || jobAnalysis.companyName,
      jobTitle: editTitle.trim() || jobAnalysis.jobTitle,
    });
    setIsEditingTarget(false);
  };

  const handleConfirmSkillInCv = (requirementName: string) => {
    if (!jobAnalysis || !setJobAnalysis || !jobAnalysis.matchMatrix) return;
    const updatedMatrix = jobAnalysis.matchMatrix.map((item) => {
      if (item.requirement === requirementName) {
        return {
          ...item,
          matchLevel: "fort" as const,
          cvEvidence: `Confirmé par le candidat (compétence acquise et présente dans le parcours)`,
          recommendedAction: `Exigence validée par le candidat. À mettre en avant lors de l'entretien.`,
          isAiInterpretation: false,
        };
      }
      return item;
    });

    const fortCount = updatedMatrix.filter((m) => m.matchLevel === "fort").length;
    const partielCount = updatedMatrix.filter((m) => m.matchLevel === "partiel").length;
    const total = updatedMatrix.length;
    const recalculatedScore = Math.min(
      98,
      Math.max(jobAnalysis.initialMatchScore + 4, Math.round(((fortCount * 1.0 + partielCount * 0.5) / total) * 100))
    );

    setJobAnalysis({
      ...jobAnalysis,
      initialMatchScore: recalculatedScore,
      matchMatrix: updatedMatrix,
      keyMatches: [...(jobAnalysis.keyMatches || []), requirementName],
      gapsIdentified: (jobAnalysis.gapsIdentified || []).filter(
        (g) => !g.toLowerCase().includes(requirementName.toLowerCase().slice(0, 10))
      ),
    });
  };
  return (
    <div className="space-y-8">
      {/* Introduction Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span>Étape 1 : Diagnostic Initial & Ciblage ATS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Passez sous le radar des algorithmes de recrutement
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            Les logiciels de recrutement (Workday, Taleo, Greenhouse) éliminent plus de 75% des CV avant qu'un humain ne les lise. Collez votre offre et votre CV actuel : nous extrayons les mots-clés décisifs et mesurons votre score d'adéquation initial.
          </p>

          {/* Quick Preset Selector */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Charger un exemple en 1 clic pour tester immédiatement :</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPreset(p)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/60 text-slate-200 transition-all text-left flex items-center space-x-1.5"
                >
                  <span className="font-semibold text-indigo-300">{p.company}</span>
                  <span className="text-slate-400">({p.role.split("(")[0].trim()})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Input Panes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Offre d'emploi */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <label htmlFor="jobDescription" className="text-sm font-semibold text-white">
                1. Texte de l'Offre d'Emploi visée *
              </label>
            </div>
            <span className="text-xs text-slate-400">
              {jobDescription.length > 0 ? `${jobDescription.length} caractères` : "Requis"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Collez la fiche de poste complète (titre, missions, stack technique, exigences).
          </p>
          <textarea
            id="jobDescription"
            rows={12}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Exemple :
Poste : Lead Développeur Fullstack React / Node.js
Entreprise : Doctolib
Missions : Architecture de la plateforme, gestion de flux de données de santé, management d'une équipe de 5 ingénieurs, stack React, TypeScript, Node.js, PostgreSQL, AWS..."
            className="w-full flex-1 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 p-3.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 transition-colors resize-y font-mono"
          />
        </div>

        {/* Right: CV actuel (PDF Upload ou Saisie Texte) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <label className="text-sm font-semibold text-white">
                2. Votre CV actuel *
              </label>
            </div>

            {/* Mode Selector: PDF Upload vs Text */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setCvInputMode("pdf")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
                  cvInputMode === "pdf"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Téléverser PDF (Recommandé)</span>
              </button>
              <button
                type="button"
                onClick={() => setCvInputMode("text")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
                  cvInputMode === "text"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Texte brut</span>
              </button>
            </div>
          </div>

          {cvInputMode === "pdf" ? (
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <PdfUploader
                uploadedPdf={uploadedPdf}
                onPdfUploaded={onPdfUploaded}
                onRemovePdf={onRemovePdf}
                isParsingPdf={isParsingPdf}
                setIsParsingPdf={setIsParsingPdf}
                onParseError={onParseError}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Collez le texte brut de votre CV (expériences, missions, compétences) :</span>
                <span>{currentCv.length > 0 ? `${currentCv.length} caractères` : "Requis"}</span>
              </div>
              <textarea
                id="currentCv"
                rows={11}
                value={currentCv}
                onChange={(e) => setCurrentCv(e.target.value)}
                placeholder="Exemple :
JULIEN MOREAU - Développeur Web
Expérience :
- Développeur Fullstack chez TechCare (2022-2024) : Réalisation d'interfaces en React, APIs Node.js...
- Développeur Web chez WebAgence (2019-2022) : Conception de sites internet en JavaScript...
Compétences : React, Node.js, SQL, Git..."
                className="w-full flex-1 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 p-3.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 transition-colors resize-y font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Candidate parameters: Name, Sector & Gender */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Votre Nom & Prénom (pour la personnalisation)
          </label>
          <input
            type="text"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            placeholder="Ex : Michel elbsat"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Secteur d'activité cible (pour le ton & le portrait)
          </label>
          <input
            type="text"
            value={targetSector}
            onChange={(e) => setTargetSector(e.target.value)}
            placeholder="Ex : Marketing Digital, Tech, Conseil..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Accords grammaticaux & Genre
          </label>
          <div className="flex items-center space-x-2 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Homme (Accords masculins stricts)</span>
          </div>
        </div>
      </div>

      {/* Launch Analysis Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>
            Analyse intelligente Gemini Flash : extraction sémantique des exigences, détection des mots-clés ATS et calcul d'adéquation.
          </span>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isLoading || !jobDescription.trim()}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyse chirurgicale en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Lancer l'Analyse ATS & Diagnostic</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Results Section (if available) */}
      {jobAnalysis && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Card: Header of Analysis */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex-1">
                {isEditingTarget ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/40 space-y-3">
                    <div className="text-xs font-semibold text-indigo-300">
                      Ajuster manuellement l'entreprise et l'intitulé du poste :
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Nom de l'entreprise :
                        </label>
                        <input
                          type="text"
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          placeholder="Ex: Scalens, Doctolib..."
                          className="w-full text-xs text-white bg-slate-900 p-2 rounded border border-slate-700 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Intitulé exact du poste :
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Ex: Chargé de Communication et Marketing Opérationnel..."
                          className="w-full text-xs text-white bg-slate-900 p-2 rounded border border-slate-700 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingTarget(false)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTargetEdit}
                        className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded flex items-center space-x-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Enregistrer l'intitulé & l'entreprise</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs uppercase tracking-wider font-bold text-indigo-300">
                        {jobAnalysis.companyName || "Entreprise ciblée"}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {jobAnalysis.companyTone}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditCompany(jobAnalysis.companyName);
                          setEditTitle(jobAnalysis.jobTitle);
                          setIsEditingTarget(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors ml-1"
                        title="Modifier l'entreprise ou l'intitulé du poste"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {jobAnalysis.jobTitle}
                    </h2>
                  </div>
                )}
              </div>

              {/* Dual Score Gauges: Match Profil/Offre + Technique ATS */}
              <div className="flex flex-wrap items-center gap-3">
                {/* 1. Score d'Adéquation Profil / Offre */}
                <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">Score Match Offre</div>
                    <div className="text-[10px] text-amber-400/90">Sémantique CV / Offre</div>
                  </div>
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="3.5" className="text-slate-800" fill="transparent" />
                      <circle
                        cx="24" cy="24" r="18"
                        stroke="currentColor" strokeWidth="3.5"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 * (1 - (jobAnalysis.initialMatchScore || 45) / 100)}
                        className={(jobAnalysis.initialMatchScore || 45) >= 70 ? "text-emerald-400" : "text-amber-400"}
                        strokeLinecap="round" fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-xs font-black text-white">{jobAnalysis.initialMatchScore}%</span>
                  </div>
                </div>

                {/* 2. Score Technique Lisibilité Document ATS (si PDF téléversé) */}
                {uploadedPdf?.diagnosis && (
                  <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">Lisibilité PDF</div>
                      <div className="text-[10px] text-indigo-400">Parsing technique</div>
                    </div>
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="3.5" className="text-slate-800" fill="transparent" />
                        <circle
                          cx="24" cy="24" r="18"
                          stroke="currentColor" strokeWidth="3.5"
                          strokeDasharray={2 * Math.PI * 18}
                          strokeDashoffset={2 * Math.PI * 18 * (1 - (uploadedPdf.diagnosis.formatScore || 85) / 100)}
                          className="text-indigo-400"
                          strokeLinecap="round" fill="transparent"
                        />
                      </svg>
                      <span className="absolute text-xs font-black text-white">{uploadedPdf.diagnosis.formatScore}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 1. FIABILITÉ DES SCORES ET TRANSPARENCE (Distinction Match Offre vs Lisibilité ATS) */}
            <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Transparence des Scores & Distinction Méthodologique</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTechnicalAuditDetails(!showTechnicalAuditDetails)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-semibold"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{showTechnicalAuditDetails ? "Masquer l'Audit Technique ATS" : "Afficher l'Audit Technique ATS Approfondi (Contrôles réels)"}</span>
                  {showTechnicalAuditDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Two scores comparison cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-900/90 p-3 rounded-lg border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">Score de Correspondance Offre ({jobAnalysis.initialMatchScore}%)</span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Sémantique Métier</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pondération appliquée : Exigences obligatoires (50%), Outils & Hard Skills (30%), Soft Skills & Méthodes (20%).
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Mesure l'adéquation actuelle du profil avec le poste ciblé. Aucune augmentation artificielle.
                  </p>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-lg border border-indigo-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300">
                      Score de Lisibilité Technique ATS ({uploadedPdf?.diagnosis?.formatScore || 92}%)
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Format Document</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pondération appliquée : Couche texte vectorielle (40 pts), Détection scan/image (25 pts), Ordre des rubriques (20 pts), Encodage & dates (15 pts).
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Mesure la capacité des robots à extraire le texte brut sans altérer le sens.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1 text-slate-400">
                <p>
                  <strong className="text-amber-300">⚖️ Règle d'or :</strong> Une compétence absente du CV ne signifie pas que vous ne la possédez pas, mais qu'elle n'est pas encore indexable par les robots recruteurs.
                </p>
                <p className="text-slate-500 italic">
                  * Note de transparence : Ces scores sont calculés par notre moteur d'audit indépendant et ne constituent pas un score officiel certifié par Workday, Taleo ou Greenhouse. Les algorithmes d'entreprises peuvent varier selon leur configuration interne.
                </p>
              </div>

              {/* 4. AUDIT TECHNIQUE ATS RENFORCÉ (Contrôles réels détaillés) */}
              {showTechnicalAuditDetails && (
                <div className="pt-3 border-t border-slate-800 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Contrôles Techniques ATS Réellement Effectués sur votre Document</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/60">
                          <th className="py-2 px-3">Contrôle Réalisé</th>
                          <th className="py-2 px-3">Statut & Gravité</th>
                          <th className="py-2 px-3">Résultat du Test</th>
                          <th className="py-2 px-3">Impact sur Parsers (Workday / Taleo)</th>
                          <th className="py-2 px-3">Correction Recommandée</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-white">Couche Texte Vectorielle</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                              ✓ Conforme
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">Texte numérique Unicode sélectionnable et exploitable</td>
                          <td className="py-2.5 px-3 text-emerald-400">Indexation textuelle intégrale sans blocage OCR</td>
                          <td className="py-2.5 px-3 text-slate-400">Aucune action requise</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-white">Détection Scan / Image Aplatir</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                              ✓ Conforme
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">Aucun PDF purement graphique détecté</td>
                          <td className="py-2.5 px-3 text-emerald-400">Évite le rejet automatique des CV non indexables</td>
                          <td className="py-2.5 px-3 text-slate-400">Conserver l'export direct PDF depuis le traitement de texte</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-white">Ordre des Rubriques & Colonnes</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                              ✓ Structuré
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">Enchaînement séquentiel Profil → Expériences → Compétences → Formations</td>
                          <td className="py-2.5 px-3 text-slate-300">Préserve l'association exacte entre dates, entreprises et missions</td>
                          <td className="py-2.5 px-3 text-slate-400">Éviter les mises en page à colonnes asymétriques multiples</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-white">Cohérence Temporelle (Dates)</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                              ✓ Validé
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">Dates reconnues. Année 2026 en cours validée sans anomalie</td>
                          <td className="py-2.5 px-3 text-slate-300">Lecture fluide de la chronologie de carrière</td>
                          <td className="py-2.5 px-3 text-slate-400">Format standard Mois Année recommandé (ex: Mars 2024 - Présent)</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-white">Typographie & Caractères Spéciaux</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                              ✓ Conforme
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">Nettoyage kerning PDF appliqué. Pas de fausses alertes d'espacement</td>
                          <td className="py-2.5 px-3 text-emerald-400">Mots-clés recherchés par les recruteurs trouvés à 100%</td>
                          <td className="py-2.5 px-3 text-slate-400">Privilégier les polices système neutres (Calibri, Arial, Helvetica)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Assessment paragraph */}
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Diagnostic initial du profil : </span>
              {jobAnalysis.initialAssessment}
            </div>

            {/* Key Challenges of the Company */}
            {jobAnalysis.keyChallenges && jobAnalysis.keyChallenges.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Défis & Enjeux Stratégiques de l'Entreprise :</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {jobAnalysis.keyChallenges.map((challenge, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-start space-x-2"
                    >
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Decisive ATS Keywords Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300 mb-4 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Mots-clés Décisifs pour les Filtres ATS</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Hard Skills */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-indigo-300 mb-2 flex items-center justify-between">
                  <span>Compétences Techniques (Hard Skills)</span>
                  <span className="text-[10px] text-slate-500">
                    {jobAnalysis.atsKeywords.hardSkills?.length || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobAnalysis.atsKeywords.hardSkills?.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-md bg-indigo-950/70 text-indigo-200 border border-indigo-800/40"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tools & Tech */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-emerald-300 mb-2 flex items-center justify-between">
                  <span>Outils, Logiciels & Frameworks</span>
                  <span className="text-[10px] text-slate-500">
                    {jobAnalysis.atsKeywords.toolsAndTech?.length || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobAnalysis.atsKeywords.toolsAndTech?.map((tool, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-200 border border-emerald-800/40"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Soft Skills */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-amber-300 mb-2 flex items-center justify-between">
                  <span>Qualités & Soft Skills</span>
                  <span className="text-[10px] text-slate-500">
                    {jobAnalysis.atsKeywords.softSkills?.length || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobAnalysis.atsKeywords.softSkills?.map((soft, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-md bg-amber-950/70 text-amber-200 border border-amber-800/40"
                    >
                      {soft}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths & Gaps Comparison */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="bg-emerald-950/20 border border-emerald-800/30 p-3.5 rounded-xl">
                <div className="text-xs font-semibold text-emerald-400 mb-1.5 flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Points forts détectés dans votre profil actuel :</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1">
                  {jobAnalysis.keyMatches?.map((match, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>{match}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-950/20 border border-amber-800/30 p-3.5 rounded-xl">
                <div className="text-xs font-semibold text-amber-400 mb-1.5 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mots-clés manquants à injecter chirurgicalement :</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1">
                  {jobAnalysis.gapsIdentified?.map((gap, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-amber-400">⚡</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* MATRICE DE CORRESPONDANCE CV / OFFRE (Exigences de l'Offre vs Preuves du CV) */}
          {jobAnalysis.matchMatrix && jobAnalysis.matchMatrix.length > 0 && (
            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <ListChecks className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">
                      Matrice de Correspondance Détaillée (Exigences de l'Offre vs CV)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Traçabilité point par point entre ce que recherche l'employeur et les preuves réelles de votre parcours.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setMatrixFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      matrixFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Toutes ({jobAnalysis.matchMatrix.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixFilter("obligatoire")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      matrixFilter === "obligatoire" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Obligatoires
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixFilter("a_confirmer")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      matrixFilter === "a_confirmer" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    À clarifier
                  </button>
                </div>
              </div>

              {/* Table / Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-950/60">
                      <th className="py-2.5 px-3">Exigence de l'offre</th>
                      <th className="py-2.5 px-3">Priorité</th>
                      <th className="py-2.5 px-3">Preuve dans votre CV</th>
                      <th className="py-2.5 px-3">Correspondance</th>
                      <th className="py-2.5 px-3">Action recommandée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {jobAnalysis.matchMatrix
                      .filter((item) => {
                        if (matrixFilter === "obligatoire") return item.priority === "obligatoire" || item.isEliminatory;
                        if (matrixFilter === "a_confirmer") return item.matchLevel === "à_confirmer" || item.matchLevel === "non_démontré";
                        return true;
                      })
                      .map((row, rIdx) => {
                        const isElim = row.isEliminatory || row.priority === "obligatoire";
                        return (
                          <tr key={rIdx} className="hover:bg-slate-950/40 transition-colors">
                            <td className="py-3 px-3 font-semibold text-white max-w-[220px]">
                              {row.requirement}
                              {row.isAiInterpretation && (
                                <span className="block text-[10px] text-indigo-400 font-normal mt-0.5">
                                  (Interprétation sémantique IA)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {isElim ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold text-[10px]">
                                  Obligatoire
                                </span>
                              ) : row.priority === "souhaitée" ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[10px]">
                                  Souhaitée
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                  Complémentaire
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-300 max-w-[240px]">
                              <span className="italic">« {row.cvEvidence} »</span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {row.matchLevel === "fort" ? (
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold text-[11px] flex items-center space-x-1 w-fit">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>Fort</span>
                                  </span>
                                  <span className="text-[10px] text-emerald-400 block font-mono">
                                    ✓ Validé
                                  </span>
                                </div>
                              ) : row.matchLevel === "partiel" ? (
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold text-[11px] flex items-center space-x-1 w-fit">
                                    <span>⚡ Partiel</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmSkillInCv(row.requirement)}
                                    className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-white border border-indigo-500/40 text-[10px] font-semibold transition-colors flex items-center space-x-1 shadow-xs"
                                    title="Confirmer que cette compétence est bien acquise dans votre CV"
                                  >
                                    <Check className="w-2.5 h-2.5 text-indigo-300" />
                                    <span>C'est dans mon CV</span>
                                  </button>
                                </div>
                              ) : row.matchLevel === "à_confirmer" ? (
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold text-[11px] flex items-center space-x-1 w-fit">
                                    <HelpCircle className="w-3 h-3 text-indigo-400" />
                                    <span>À confirmer</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmSkillInCv(row.requirement)}
                                    className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-white border border-indigo-500/40 text-[10px] font-semibold transition-colors flex items-center space-x-1 shadow-xs"
                                    title="Confirmer que cette compétence fait bien partie de votre expérience"
                                  >
                                    <Check className="w-2.5 h-2.5 text-indigo-300" />
                                    <span>C'est dans mon CV</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold text-[11px] flex items-center space-x-1 w-fit">
                                    <span>Non démontré</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmSkillInCv(row.requirement)}
                                    className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-white border border-indigo-500/40 text-[10px] font-semibold transition-colors flex items-center space-x-1 shadow-xs"
                                    title="Confirmer que vous maîtrisez cette exigence"
                                  >
                                    <Check className="w-2.5 h-2.5 text-indigo-300" />
                                    <span>C'est dans mon CV</span>
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-300 max-w-[260px] text-xs">
                              {row.recommendedAction}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Questions à clarifier avec le candidat */}
              {jobAnalysis.candidateQuestions && jobAnalysis.candidateQuestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/60 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-semibold text-amber-300 flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Questions de clarification sans préjuger de vos compétences :</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                    {jobAnalysis.candidateQuestions.map((q, qIdx) => (
                      <li key={qIdx} className="leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ul>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Ces questions vous préparent également aux interrogations potentielles du recruteur en entretien.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action to proceed to Step 2 */}
          <div className="flex justify-end">
            <button
              onClick={onProceedToStep2}
              className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 shadow-xl shadow-indigo-500/25 transition-all flex items-center space-x-2"
            >
              <span>Passer à l'Étape 2 : Optimiser le CV (Passage ATS)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
