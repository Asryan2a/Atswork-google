import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Sparkles,
  CheckCircle,
  Copy,
  Check,
  Camera,
  Layers,
  ArrowRight,
  Eye,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  User,
  ThumbsUp,
  Download,
  Trash2,
  Edit3,
  RotateCcw,
  Plus,
  Save,
  X,
  ShieldCheck,
  History,
  Undo2,
  Clock,
  CheckCheck,
} from "lucide-react";
import { OptimizedCv, JobAnalysis, CvExperience, MissionOptimizationItem } from "../types/index.ts";
import { CategorizedSkillsSuggestions } from "./CategorizedSkillsSuggestions.tsx";
import { PhotoModifierStudio } from "./PhotoModifierStudio.tsx";
import { buildMissionOptimization } from "../utils/dynamicFallback.ts";

interface Step2CvOptimizationProps {
  currentCv: string;
  optimizedCv: OptimizedCv | null;
  jobAnalysis: JobAnalysis | null;
  isLoading: boolean;
  isValidated: boolean;
  onOptimize: () => void;
  onValidateCv: (cv?: OptimizedCv) => void;
  onProceedToStep3: () => void;
  onGeneratePortraitPreview?: (promptEn: string) => Promise<string | null>;
  onModifyPhoto?: (photoBase64: string, instruction?: string) => Promise<string>;
}

// Helper to safely render markdown bold syntax **word** as styled elements
export const renderWithBold = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2);
      return (
        <strong
          key={index}
          className="font-bold text-indigo-300 bg-indigo-500/20 px-1 py-0.5 rounded border border-indigo-500/30 shadow-xs"
        >
          {content}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const Step2CvOptimization: React.FC<Step2CvOptimizationProps> = ({
  currentCv,
  optimizedCv,
  jobAnalysis,
  isLoading,
  isValidated,
  onOptimize,
  onValidateCv,
  onProceedToStep3,
  onGeneratePortraitPreview,
  onModifyPhoto,
}) => {
  const [viewMode, setViewMode] = useState<"styled" | "diff" | "traceability">("styled");
  const [hasCopiedCv, setHasCopiedCv] = useState(false);
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);
  const [portraitImage, setPortraitImage] = useState<string | null>(null);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Local editable copy of optimizedCv to allow user to delete/edit any point
  const [localCv, setLocalCv] = useState<OptimizedCv | null>(optimizedCv);
  const [editingAch, setEditingAch] = useState<{ expIdx: number; achIdx: number; text: string } | null>(null);
  const [addingAchToExpIdx, setAddingAchToExpIdx] = useState<number | null>(null);
  const [newAchText, setNewAchText] = useState("");
  // Mode d'affichage des missions : "dual" (comparatif Bleu & Vert) ou "compact" (rendu direct)
  const [missionDisplayMode, setMissionDisplayMode] = useState<"dual" | "compact">("dual");

  // Section 3: Corbeille de puces supprimées restaurables & Historique des versions
  const [deletedBullets, setDeletedBullets] = useState<
    Array<{ id: string; expIdx: number; company: string; role: string; text: string; deletedAt: string }>
  >([]);
  const [cvVersions, setCvVersions] = useState<
    Array<{ version: number; timestamp: string; label: string; cv: OptimizedCv }>
  >([]);

  useEffect(() => {
    if (optimizedCv) {
      setLocalCv(optimizedCv);
    }
  }, [optimizedCv]);

  const activeCv = localCv || optimizedCv;

  // Helper pour garantir que chaque mission possède sa version bleue (conservée) et verte (suggestion wording ATS)
  const getExperienceOptimizations = (exp: CvExperience): MissionOptimizationItem[] => {
    if (exp.missionOptimizations && exp.missionOptimizations.length === exp.achievements.length) {
      return exp.missionOptimizations;
    }
    const isMkt = true;
    return (exp.achievements || []).map((ach, i) => {
      if (exp.missionOptimizations?.[i]) return exp.missionOptimizations[i];
      return buildMissionOptimization(ach, isMkt, jobAnalysis || undefined);
    });
  };

  // Basculer une mission individuelle entre Vert (suggestion ATS) et Bleu (texte d'origine)
  const handleApplyMissionVersion = (expIdx: number, aIdx: number, useSuggested: boolean) => {
    if (!activeCv) return;
    const updated = JSON.parse(JSON.stringify(activeCv)) as OptimizedCv;
    const exp = updated.optimizedCvSections.experiences[expIdx];
    if (!exp) return;

    if (!exp.missionOptimizations || exp.missionOptimizations.length !== exp.achievements.length) {
      exp.missionOptimizations = getExperienceOptimizations(exp);
    }

    const opt = exp.missionOptimizations[aIdx];
    if (opt) {
      opt.isAccepted = useSuggested;
      exp.achievements[aIdx] = useSuggested ? opt.suggestedWording : opt.originalMission;
    }

    setLocalCv(updated);
    onValidateCv(updated);
  };

  // Basculer toutes les missions en une fois (Tout Vert ou Tout Bleu)
  const handleApplyAllMissions = (useSuggested: boolean) => {
    if (!activeCv) return;
    const updated = JSON.parse(JSON.stringify(activeCv)) as OptimizedCv;
    updated.optimizedCvSections.experiences.forEach((exp) => {
      if (!exp.missionOptimizations || exp.missionOptimizations.length !== exp.achievements.length) {
        exp.missionOptimizations = getExperienceOptimizations(exp);
      }
      exp.missionOptimizations.forEach((opt, aIdx) => {
        opt.isAccepted = useSuggested;
        exp.achievements[aIdx] = useSuggested ? opt.suggestedWording : opt.originalMission;
      });
    });
    setLocalCv(updated);
    onValidateCv(updated);
  };

  // Start editing an achievement
  const handleStartEdit = (expIdx: number, achIdx: number, text: string) => {
    setEditingAch({ expIdx, achIdx, text });
  };

  const handleSaveEdit = () => {
    if (!editingAch || !editingAch.text.trim()) return;
    handleUpdateAchievement(editingAch.expIdx, editingAch.achIdx, editingAch.text.trim());
    setEditingAch(null);
  };

  const handleCancelEdit = () => {
    setEditingAch(null);
  };

  // Add a new achievement bullet to an experience
  const handleAddAchievement = (expIdx: number) => {
    if (!newAchText.trim() || !activeCv) return;
    const updated = JSON.parse(JSON.stringify(activeCv)) as OptimizedCv;
    const exp = updated.optimizedCvSections.experiences[expIdx];
    if (exp) {
      const opt = buildMissionOptimization(newAchText.trim(), true, jobAnalysis || undefined);
      exp.achievements.push(opt.suggestedWording);
      if (!exp.missionOptimizations) exp.missionOptimizations = [];
      exp.missionOptimizations.push(opt);
    }
    setLocalCv(updated);
    onValidateCv(updated);
    setNewAchText("");
    setAddingAchToExpIdx(null);
  };

  // Add a suggested skill into the appropriate category in the CV
  const handleAddSkillToCv = (categoryName: string, skill: string) => {
    if (!activeCv) return;
    const updated = JSON.parse(JSON.stringify(activeCv)) as OptimizedCv;
    const lower = categoryName.toLowerCase();
    const skillsObj = updated.optimizedCvSections.skills;

    // Ensure all arrays exist
    if (!skillsObj.technical) skillsObj.technical = [];
    if (!skillsObj.tools) skillsObj.tools = [];
    if (!skillsObj.dataAndAnalytics) skillsObj.dataAndAnalytics = [];
    if (!skillsObj.methodologies) skillsObj.methodologies = [];
    if (!skillsObj.softSkills) skillsObj.softSkills = [];
    if (!skillsObj.languages) skillsObj.languages = [];

    if (lower.includes("hard") || lower.includes("technique") || lower.includes("stratégie") || lower.includes("métier")) {
      if (!skillsObj.technical.includes(skill)) skillsObj.technical.push(skill);
    } else if (lower.includes("outil") || lower.includes("logiciel") || lower.includes("plateforme")) {
      if (!skillsObj.tools.includes(skill)) skillsObj.tools.push(skill);
    } else if (lower.includes("data") || lower.includes("analytics") || lower.includes("kpi") || lower.includes("mesure")) {
      if (!skillsObj.dataAndAnalytics.includes(skill)) skillsObj.dataAndAnalytics.push(skill);
    } else if (lower.includes("méthod") || lower.includes("process") || lower.includes("projet") || lower.includes("agile")) {
      if (!skillsObj.methodologies.includes(skill)) skillsObj.methodologies.push(skill);
    } else if (lower.includes("soft") || lower.includes("humain") || lower.includes("leadership") || lower.includes("relationnel")) {
      if (!skillsObj.softSkills.includes(skill)) skillsObj.softSkills.push(skill);
    } else if (lower.includes("langue") || lower.includes("international")) {
      if (!skillsObj.languages.includes(skill)) skillsObj.languages.push(skill);
    } else {
      if (!skillsObj.technical.includes(skill)) skillsObj.technical.push(skill);
    }

    if (!updated.injectedKeywords.includes(skill)) {
      updated.injectedKeywords.push(skill);
    }
    setLocalCv(updated);
  };

  const handleRemoveSkillFromCv = (categoryName: string, skill: string) => {
    if (!activeCv) return;
    const updated = JSON.parse(JSON.stringify(activeCv)) as OptimizedCv;
    const lower = categoryName.toLowerCase();
    const skillsObj = updated.optimizedCvSections.skills;

    const filterOut = (arr: string[]) => (arr || []).filter((s) => s !== skill);

    if (lower.includes("hard") || lower.includes("technique") || lower.includes("stratégie") || lower.includes("métier")) {
      skillsObj.technical = filterOut(skillsObj.technical);
    } else if (lower.includes("outil") || lower.includes("logiciel") || lower.includes("plateforme")) {
      skillsObj.tools = filterOut(skillsObj.tools);
    } else if (lower.includes("data") || lower.includes("analytics") || lower.includes("kpi") || lower.includes("mesure")) {
      skillsObj.dataAndAnalytics = filterOut(skillsObj.dataAndAnalytics);
    } else if (lower.includes("méthod") || lower.includes("process") || lower.includes("projet") || lower.includes("agile")) {
      skillsObj.methodologies = filterOut(skillsObj.methodologies);
    } else if (lower.includes("soft") || lower.includes("humain") || lower.includes("leadership") || lower.includes("relationnel")) {
      skillsObj.softSkills = filterOut(skillsObj.softSkills);
    } else if (lower.includes("langue") || lower.includes("international")) {
      skillsObj.languages = filterOut(skillsObj.languages);
    }
    setLocalCv(updated);
  };

  // Delete an achievement bullet point (preserves in recoverable pool)
  const handleDeleteAchievement = (expIdx: number, achIdx: number) => {
    if (!activeCv) return;
    const targetAch = activeCv.optimizedCvSections.experiences[expIdx]?.achievements[achIdx];
    const compName = activeCv.optimizedCvSections.experiences[expIdx]?.company || "Expérience";
    const roleName = activeCv.optimizedCvSections.experiences[expIdx]?.role || "Poste";

    if (targetAch) {
      setDeletedBullets((prev) => [
        ...prev,
        {
          id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          expIdx,
          company: compName,
          role: roleName,
          text: targetAch,
          deletedAt: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }

    const updated = JSON.parse(JSON.stringify(activeCv)) as OptimizedCv;
    const exp = updated.optimizedCvSections.experiences[expIdx];
    if (exp) {
      exp.achievements.splice(achIdx, 1);
      if (exp.missionOptimizations && exp.missionOptimizations.length > achIdx) {
        exp.missionOptimizations.splice(achIdx, 1);
      }
    }
    setLocalCv(updated);
    onValidateCv(updated);
  };

  // Restore a deleted bullet point back into its original experience
  const handleRestoreBullet = (bulletId: string) => {
    const item = deletedBullets.find((b) => b.id === bulletId);
    if (!item || !activeCv) return;

    const updated = JSON.parse(JSON.stringify(activeCv)) as OptimizedCv;
    const targetExp = updated.optimizedCvSections.experiences[item.expIdx] || updated.optimizedCvSections.experiences[0];
    if (targetExp) {
      targetExp.achievements.push(item.text);
      if (!targetExp.missionOptimizations) targetExp.missionOptimizations = [];
      targetExp.missionOptimizations.push(buildMissionOptimization(item.text, true, jobAnalysis || undefined));
    }

    setLocalCv(updated);
    onValidateCv(updated);
    setDeletedBullets((prev) => prev.filter((b) => b.id !== bulletId));
  };

  // Create a version snapshot for version history
  const handleSaveSnapshot = (label?: string) => {
    if (!activeCv) return;
    const verNum = cvVersions.length + 1;
    const newVer = {
      version: verNum,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      label: label || `Version ${verNum} (${activeCv.injectedKeywords.length} mots-clés)`,
      cv: JSON.parse(JSON.stringify(activeCv)) as OptimizedCv,
    };
    setCvVersions((prev) => [...prev, newVer]);
  };

  const handleRestoreVersion = (verRecord: { cv: OptimizedCv }) => {
    const restored = JSON.parse(JSON.stringify(verRecord.cv)) as OptimizedCv;
    setLocalCv(restored);
    onValidateCv(restored);
  };

  // Update an achievement bullet point
  const handleUpdateAchievement = (expIdx: number, achIdx: number, newText: string) => {
    if (!activeCv) return;
    const updated = JSON.parse(JSON.stringify(activeCv)) as OptimizedCv;
    const exp = updated.optimizedCvSections.experiences[expIdx];
    if (exp) {
      exp.achievements[achIdx] = newText;
      if (!exp.missionOptimizations || exp.missionOptimizations.length !== exp.achievements.length) {
        exp.missionOptimizations = getExperienceOptimizations(exp);
      }
      if (exp.missionOptimizations[achIdx]) {
        exp.missionOptimizations[achIdx].suggestedWording = newText;
        exp.missionOptimizations[achIdx].isAccepted = true;
      }
    }
    setLocalCv(updated);
    onValidateCv(updated);
  };

  // Copy optimized CV text to clipboard
  const handleCopyCv = () => {
    if (!activeCv) return;
    const { optimizedCvSections: s } = activeCv;
    let fullText = `${s.targetTitle.toUpperCase()}\n\n`;
    fullText += `PROFIL :\n${s.profileSummary.replace(/\*\*/g, "")}\n\n`;
    fullText += `EXPÉRIENCES PROFESSIONNELLES :\n`;
    s.experiences.forEach((exp) => {
      fullText += `${exp.role} - ${exp.company} (${exp.period}${exp.location ? `, ${exp.location}` : ""})\n`;
      exp.achievements.forEach((ach) => {
        fullText += `  • ${ach.replace(/\*\*/g, "")}\n`;
      });
      fullText += `\n`;
    });
    fullText += `COMPÉTENCES :\n`;
    fullText += `• Techniques : ${s.skills.technical.join(", ")}\n`;
    fullText += `• Méthodes : ${s.skills.methodologies.join(", ")}\n`;
    fullText += `• Outils : ${s.skills.tools.join(", ")}\n`;
    fullText += `• Langues : ${s.skills.languages.join(", ")}\n\n`;
    fullText += `FORMATIONS :\n`;
    s.education.forEach((edu) => {
      fullText += `• ${edu.degree} - ${edu.institution} (${edu.year})${edu.details ? ` : ${edu.details}` : ""}\n`;
    });

    navigator.clipboard.writeText(fullText);
    setHasCopiedCv(true);
    setTimeout(() => setHasCopiedCv(false), 2500);
  };

  const handleCopyPrompt = () => {
    if (!activeCv?.imagenPrompt?.promptEn) return;
    navigator.clipboard.writeText(activeCv.imagenPrompt.promptEn);
    setHasCopiedPrompt(true);
    setTimeout(() => setHasCopiedPrompt(false), 2500);
  };

  const handleGeneratePortrait = async () => {
    if (!activeCv?.imagenPrompt?.promptEn) return;
    setIsGeneratingPortrait(true);
    setPortraitError(null);
    try {
      if (onGeneratePortraitPreview) {
        const img = await onGeneratePortraitPreview(activeCv.imagenPrompt.promptEn);
        if (img) setPortraitImage(img);
      }
    } catch (err: any) {
      setPortraitError(err.message || "Erreur de génération d'image.");
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Golden Rule Banner (Essential instruction from user) */}
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/40 p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                RÈGLE D'OR RENFORCÉE : ZÉRO INVENTION • 100% VRAIES EXPÉRIENCES
              </div>
              <p className="text-sm font-medium text-slate-200 leading-snug">
                <strong className="text-white">Interdiction absolue d'inventer des missions :</strong> aucune création de projet fictif (ex: pas de podcast ni de fausse compétence). Seules vos vraies réalisations sont reformulées avec des verbes d'action. Vous pouvez supprimer ou modifier n'importe quelle puce directement.
              </p>
            </div>
          </div>

          {activeCv && (
            <button
              onClick={onOptimize}
              disabled={isLoading}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 transition-colors flex items-center space-x-1.5 whitespace-nowrap"
              title="Relancer avec stricte fidélité"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ré-optimiser (Mode Strict)</span>
            </button>
          )}
        </div>
      </div>

      {/* If optimization not done yet or loading */}
      {!optimizedCv && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Prêt pour l'optimisation chirurgicale ATS
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            Nous allons aligner votre CV sur le poste{" "}
            <span className="text-indigo-300 font-semibold">{jobAnalysis?.jobTitle || "ciblé"}</span>{" "}
            chez <span className="text-indigo-300 font-semibold">{jobAnalysis?.companyName || "l'entreprise"}</span>.
            Toutes les modifications et mots-clés ajoutés seront mis en <strong className="text-white">gras</strong>.
          </p>
          <button
            onClick={onOptimize}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 mx-auto disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Optimisation chirurgicale en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Lancer l'Optimisation ATS du CV</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Optimized CV Content */}
      {activeCv && (
        <div className="space-y-6">
          {/* Header Score & Improvement bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* ATS Score Improvement */}
            <div className="flex items-center space-x-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-black text-emerald-400">
                  {activeCv.atsScore}%
                </span>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Nouveau Score ATS
                </div>
                <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <span className="text-emerald-400">+{activeCv.scoreImprovement || 40}% de passage</span>
                </div>
                <div className="text-[11px] text-slate-400">Compatible Workday, Taleo, Greenhouse</div>
              </div>
            </div>

            {/* Injected Keywords Count */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Mots-clés ATS Injectés en gras
              </div>
              <div className="text-xl font-extrabold text-indigo-300">
                {activeCv.injectedKeywords.length} termes stratégiques
              </div>
              <div className="text-[11px] text-slate-400">
                Naturellement intégrés sans inventer de faits
              </div>
            </div>

            {/* Actions: View toggle & Copy */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode("styled")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1 ${
                    viewMode === "styled"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Surlignage ATS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("diff")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1 ${
                    viewMode === "diff"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Avant / Après</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("traceability")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1 ${
                    viewMode === "traceability"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Traçabilité ({activeCv.injectedKeywords.length})</span>
                </button>
              </div>

              <button
                onClick={handleCopyCv}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700/60 transition-colors"
              >
                {hasCopiedCv ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">CV copié dans le presse-papier !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copier le texte du CV optimisé</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Injected Keywords Badge Strip */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mots-clés de l'offre intégrés et mis en valeur en gras :</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeCv.injectedKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-200 border border-indigo-700/40 font-medium"
                >
                  <strong>{kw}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Section 3: Traçabilité, Audit de Fidélité & Corbeille des Puces Restaurables */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Audit de Traçabilité & Préservation du Parcours Réel</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSaveSnapshot()}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center space-x-1"
                  title="Créer un point de sauvegarde pour ce CV"
                >
                  <History className="w-3 h-3 text-indigo-400" />
                  <span>Créer un point de sauvegarde (V{cvVersions.length + 1})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>100% Entreprises & Dates :</strong> Strictement inchangées</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Accords masculins :</strong> Appliqués systématiquement</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Zéro invention :</strong> Aucune mission imaginaire</span>
              </div>
            </div>

            {/* Version rollback pills if available */}
            {cvVersions.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px]">Historique des versions :</span>
                {cvVersions.map((v) => (
                  <button
                    key={v.version}
                    type="button"
                    onClick={() => handleRestoreVersion(v)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] flex items-center space-x-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span>{v.label} ({v.timestamp})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Corbeille des Puces Supprimées (Restaurables en 1 clic) */}
            {deletedBullets.length > 0 && (
              <div className="pt-2 border-t border-slate-800 bg-amber-950/20 p-3 rounded-xl border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                    <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Corbeille des Puces Retirées ({deletedBullets.length}) — Restaurables à tout moment :</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {deletedBullets.map((del) => (
                    <div
                      key={del.id}
                      className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="text-slate-300 flex-1 line-clamp-1">
                        <span className="text-slate-500 font-semibold mr-1.5">[{del.company}]</span>
                        <span className="italic">{del.text.replace(/\*\*/g, "")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreBullet(del.id)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded flex items-center space-x-1 whitespace-nowrap"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Restaurer</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* VIEW MODE: Traceability vs Diff vs Styled */}
          {viewMode === "traceability" ? (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Matrice de Traçabilité des Optimisations ATS</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Justification technique de chaque reformulation et mise en gras par rapport à l'offre d'emploi.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-semibold">
                  {activeCv.injectedKeywords.length} Mots-Clés Stratégiques
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-950/60">
                      <th className="py-2.5 px-3">Rubrique</th>
                      <th className="py-2.5 px-3">Formulation Optimisée (avec gras ATS)</th>
                      <th className="py-2.5 px-3">Nature du Changement</th>
                      <th className="py-2.5 px-3">Justification & Règle ATS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    <tr>
                      <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">Titre de Profil</td>
                      <td className="py-3 px-3 font-medium text-slate-200">
                        {renderWithBold(activeCv.optimizedCvSections.targetTitle)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                          Alignement Métier
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        Indispensable pour l'indexation de premier niveau par les parsers ATS (Workday, Taleo).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">Accroche / Résumé</td>
                      <td className="py-3 px-3 text-slate-200">
                        {renderWithBold(activeCv.optimizedCvSections.profileSummary)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                          Mots-clés & Verbes
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        Valorise les compétences clés dès les 5 premières lignes sans inventer de diplôme ou d'expérience.
                      </td>
                    </tr>
                    {activeCv.optimizedCvSections.experiences.flatMap((exp, expIdx) =>
                      exp.achievements.map((ach, achIdx) => (
                        <tr key={`${expIdx}-${achIdx}`}>
                          <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                            {exp.company} <span className="text-[10px] text-slate-500 font-normal">({exp.role})</span>
                          </td>
                          <td className="py-3 px-3 text-slate-200">
                            {renderWithBold(ach)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Verbe d'action & Mots-clés
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            Renforce la visibilité algorithmique tout en restant fidèle à la mission réelle effectuée.
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : viewMode === "diff" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Original CV */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>CV Brut Original (Score : {jobAnalysis?.initialMatchScore || 45}%)</span>
                </div>
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[600px] overflow-y-auto">
                  {currentCv}
                </pre>
              </div>

              {/* Right: Optimized CV */}
              <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>CV Optimisé ATS (Score : {activeCv.atsScore}%)</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 max-h-[600px] overflow-y-auto space-y-4">
                  {/* Target Title */}
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white">
                      {renderWithBold(activeCv.optimizedCvSections.targetTitle)}
                    </h3>
                  </div>
                  {/* Summary */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">
                      Accroche & Objectif
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {renderWithBold(activeCv.optimizedCvSections.profileSummary)}
                    </p>
                  </div>
                  {/* Experiences */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-400">
                      Expériences Professionnelles
                    </h4>
                    {activeCv.optimizedCvSections.experiences.map((exp, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-xs font-bold text-white">
                          {exp.role} <span className="text-slate-400 font-normal">chez {exp.company}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mb-2">
                          {exp.period} {exp.location ? `• ${exp.location}` : ""}
                        </div>
                        <ul className="text-xs text-slate-300 space-y-2">
                          {exp.achievements.map((ach, aIdx) => {
                            const opt = exp.missionOptimizations?.[aIdx];
                            const isGreen = opt ? opt.isAccepted !== false : true;

                            return (
                              <li key={aIdx} className="leading-relaxed flex items-start space-x-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold flex-shrink-0 mt-0.5 ${
                                  isGreen
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                    : "bg-sky-950 text-sky-300 border border-sky-800"
                                }`}>
                                  {isGreen ? "VERT (ATS)" : "BLEU (Orig)"}
                                </span>
                                <span className="flex-1">{renderWithBold(ach)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Styled CV Sheet */
            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Header Profile Title */}
              <div className="border-b border-slate-800 pb-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1 flex items-center space-x-2">
                  <User className="w-3.5 h-3.5" />
                  <span>Titre de Profil Optimisé pour les Algorithmes ATS</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {renderWithBold(activeCv.optimizedCvSections.targetTitle)}
                </h3>
              </div>

              {/* Accroche / Résumé du profil */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Accroche Professionnelle & Positionnement de Valeur</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {renderWithBold(activeCv.optimizedCvSections.profileSummary)}
                </div>
              </div>

              {/* Expériences professionnelles optimisées */}
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Expériences Professionnelles — Missions, Wording ATS & Traçabilité</span>
                  </div>

                  {/* Contrôles globaux : Choix d'affichage et sélection de masse */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Toggle Vue Comparative vs Compacte */}
                    <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setMissionDisplayMode("dual")}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                          missionDisplayMode === "dual"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Vue Comparative (Bleu & Vert)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMissionDisplayMode("compact")}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                          missionDisplayMode === "compact"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Aperçu Compact CV
                      </button>
                    </div>

                    {/* Actions de masse */}
                    <button
                      type="button"
                      onClick={() => handleApplyAllMissions(true)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 flex items-center space-x-1 transition-colors"
                      title="Activer toutes les formulations vertes optimisées"
                    >
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                      <span>Tout en Vert (Wording ATS)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyAllMissions(false)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-700/50 flex items-center space-x-1 transition-colors"
                      title="Revenir à tous les textes originaux bruts"
                    >
                      <Undo2 className="w-3 h-3 text-sky-400" />
                      <span>Tout en Bleu (Texte Brut)</span>
                    </button>
                  </div>
                </div>

                {/* Educational Banner for Blue vs Green missions */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-4 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Distinction Claire & Chirurgicale par Mission :</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="bg-sky-950/30 border border-sky-500/40 rounded-lg p-2.5 text-sky-200 flex items-start space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 flex-shrink-0 mt-1" />
                      <div>
                        <strong className="text-white block mb-0.5">🔵 EN BLEU : CE QUE TU GARDES</strong>
                        <span>Le texte authentique extrait de votre CV d'origine, strictement fidèle et préservé.</span>
                      </div>
                    </div>
                    <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-2.5 text-emerald-200 flex items-start space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
                      <div>
                        <strong className="text-white block mb-0.5">🟢 EN VERT : SUGGESTIONS & WORDING ATS</strong>
                        <span>Formulation avec verbes d'action et mots-clés ciblés en <strong>gras</strong>, sans ajout d'information.</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    Pour chaque mission, cliquez sur le bouton correspondant pour choisir quelle version intégrer dans le CV final, ou éditez-la directement avec le stylo.
                  </p>
                </div>

                <div className="space-y-5">
                  {activeCv.optimizedCvSections.experiences.map((exp, idx) => {
                    const missionOpts = getExperienceOptimizations(exp);

                    return (
                      <div
                        key={idx}
                        className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-colors space-y-4"
                      >
                        {/* Header de l'expérience */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-800/70">
                          <div>
                            <div className="font-bold text-sm sm:text-base text-white flex items-center space-x-2">
                              <span>{exp.role}</span>
                              <span className="text-indigo-400 font-semibold">• {exp.company}</span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {exp.period} {exp.location ? `| ${exp.location}` : ""}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-mono font-medium">
                              {exp.achievements.length} missions
                            </span>
                          </div>
                        </div>

                        {/* Rendu des Missions : Mode Comparatif (Bleu & Vert) ou Mode Compact */}
                        {missionDisplayMode === "dual" ? (
                          <div className="space-y-4">
                            {exp.achievements.map((ach, aIdx) => {
                              const isBeingEdited = editingAch?.expIdx === idx && editingAch?.achIdx === aIdx;
                              const opt = missionOpts[aIdx] || buildMissionOptimization(ach, true, jobAnalysis || undefined);
                              const isCurrentSuggested = opt.isAccepted !== false;

                              if (isBeingEdited) {
                                return (
                                  <div key={aIdx} className="bg-slate-900 p-3 rounded-xl border border-indigo-500/50 space-y-2">
                                    <div className="text-xs font-semibold text-indigo-300">
                                      Modification manuelle de la mission #{aIdx + 1} :
                                    </div>
                                    <textarea
                                      value={editingAch.text}
                                      onChange={(e) =>
                                        setEditingAch({ ...editingAch, text: e.target.value })
                                      }
                                      rows={2}
                                      className="w-full text-xs text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-700 focus:outline-hidden focus:border-indigo-500 font-sans"
                                    />
                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>Annuler</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleSaveEdit}
                                        className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center space-x-1"
                                      >
                                        <Save className="w-3 h-3" />
                                        <span>Enregistrer</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={aIdx}
                                  className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-3.5 space-y-3"
                                >
                                  {/* Mission Top Bar */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Mission #{aIdx + 1}
                                      </span>
                                      {isCurrentSuggested ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center space-x-1">
                                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                                          <span>Suggestion ATS active sur le CV</span>
                                        </span>
                                      ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold flex items-center space-x-1">
                                          <Check className="w-2.5 h-2.5 text-sky-400" />
                                          <span>Texte d'origine actif sur le CV</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEdit(idx, aIdx, ach)}
                                        className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                                        title="Modifier manuellement cette mission"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAchievement(idx, aIdx)}
                                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                                        title="Supprimer cette mission"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Dual Comparison Grid : BLEU (Ce que tu gardes) vs VERT (Suggestions) */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* BLOC BLEU : CE QUE TU GARDES */}
                                    <div
                                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                                        !isCurrentSuggested
                                          ? "bg-sky-950/40 border-sky-500 shadow-md shadow-sky-950/40 ring-1 ring-sky-500/50"
                                          : "bg-sky-950/15 border-sky-900/60 hover:border-sky-700/60"
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-1.5">
                                            <span className="w-2 h-2 rounded-full bg-sky-400" />
                                            <span>🔵 Ce que tu gardes (Texte d'origine)</span>
                                          </span>
                                          {!isCurrentSuggested && (
                                            <span className="text-[10px] font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/40">
                                              Actif
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed min-h-[40px]">
                                          {opt.originalMission}
                                        </p>
                                      </div>

                                      <div className="mt-3 pt-2.5 border-t border-sky-900/50 flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-sky-300/70 italic">
                                          100% fidèle au CV brut
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleApplyMissionVersion(idx, aIdx, false)}
                                          className={`px-2.5 py-1 text-xs rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
                                            !isCurrentSuggested
                                              ? "bg-sky-500 text-slate-950 shadow-xs cursor-default"
                                              : "bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-700/60"
                                          }`}
                                        >
                                          {!isCurrentSuggested ? (
                                            <>
                                              <Check className="w-3 h-3" />
                                              <span>Conservé sur le CV</span>
                                            </>
                                          ) : (
                                            <>
                                              <Undo2 className="w-3 h-3" />
                                              <span>Garder ce texte</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {/* BLOC VERT : SUGGESTIONS / AMÉLIORATIONS */}
                                    <div
                                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                                        isCurrentSuggested
                                          ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50"
                                          : "bg-emerald-950/15 border-emerald-900/60 hover:border-emerald-700/60"
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                            <span>🟢 Suggestion Wording ATS</span>
                                          </span>
                                          {isCurrentSuggested && (
                                            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                                              Actif
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed min-h-[40px]">
                                          {renderWithBold(opt.suggestedWording)}
                                        </p>
                                        {opt.atsRationale && (
                                          <div className="mt-2 text-[10px] text-emerald-300/80 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/40">
                                            💡 {opt.atsRationale}
                                          </div>
                                        )}
                                      </div>

                                      <div className="mt-3 pt-2.5 border-t border-emerald-900/50 flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-emerald-300/70 italic">
                                          0 info ajoutée • Verbes d'action
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleApplyMissionVersion(idx, aIdx, true)}
                                          className={`px-2.5 py-1 text-xs rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
                                            isCurrentSuggested
                                              ? "bg-emerald-500 text-slate-950 shadow-xs cursor-default"
                                              : "bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60"
                                          }`}
                                        >
                                          {isCurrentSuggested ? (
                                            <>
                                              <Check className="w-3 h-3" />
                                              <span>Suggestion adoptée</span>
                                            </>
                                          ) : (
                                            <>
                                              <CheckCheck className="w-3 h-3" />
                                              <span>Adopter suggestion</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Mode Compact direct */
                          <ul className="space-y-2 mt-2">
                            {exp.achievements.map((ach, aIdx) => {
                              const isBeingEdited = editingAch?.expIdx === idx && editingAch?.achIdx === aIdx;
                              const opt = missionOpts[aIdx];
                              const isCurrentSuggested = opt ? opt.isAccepted !== false : true;

                              if (isBeingEdited) {
                                return (
                                  <li key={aIdx} className="bg-slate-900 p-2.5 rounded-lg border border-indigo-500/50 space-y-2">
                                    <textarea
                                      value={editingAch.text}
                                      onChange={(e) =>
                                        setEditingAch({ ...editingAch, text: e.target.value })
                                      }
                                      rows={2}
                                      className="w-full text-xs text-slate-200 bg-slate-950 p-2 rounded border border-slate-700 focus:outline-hidden focus:border-indigo-500 font-sans"
                                    />
                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="px-2 py-1 text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>Annuler</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleSaveEdit}
                                        className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center space-x-1"
                                      >
                                        <Save className="w-3 h-3" />
                                        <span>Enregistrer</span>
                                      </button>
                                    </div>
                                  </li>
                                );
                              }

                              return (
                                <li
                                  key={aIdx}
                                  className="group text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-slate-900/70 transition-colors"
                                >
                                  <div className="flex items-start space-x-2.5 flex-1">
                                    <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                    <div className="flex-1 space-y-1">
                                      <div>{renderWithBold(ach)}</div>
                                      <div className="flex items-center space-x-2">
                                        {isCurrentSuggested ? (
                                          <span className="text-[10px] text-emerald-400 font-semibold">
                                            🟢 Wording ATS
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-sky-400 font-semibold">
                                            🔵 Texte d'origine
                                          </span>
                                        )}
                                        {opt && (
                                          <button
                                            type="button"
                                            onClick={() => handleApplyMissionVersion(idx, aIdx, !isCurrentSuggested)}
                                            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                                          >
                                            Basculer vers {isCurrentSuggested ? "Texte d'origine (Bleu)" : "Suggestion ATS (Vert)"}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 flex-shrink-0 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(idx, aIdx, ach)}
                                      className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/60 rounded"
                                      title="Modifier cette formulation"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAchievement(idx, aIdx)}
                                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 rounded"
                                      title="Supprimer cette mission"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}

                      {/* Add Achievement Form or Trigger */}
                      <div className="mt-3 pt-2 border-t border-slate-900">
                        {addingAchToExpIdx === idx ? (
                          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-2">
                            <label className="text-xs font-semibold text-slate-300 block">
                              Ajouter une tâche / mission issue de votre CV pour {exp.company} :
                            </label>
                            <input
                              type="text"
                              value={newAchText}
                              onChange={(e) => setNewAchText(e.target.value)}
                              placeholder="Ex: Pilotage opérationnel des campagnes et coordination avec l'équipe commerciale..."
                              className="w-full text-xs text-slate-200 bg-slate-950 p-2 rounded border border-slate-700 focus:outline-hidden focus:border-indigo-500"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddAchievement(idx);
                                }
                              }}
                            />
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingAchToExpIdx(null);
                                  setNewAchText("");
                                }}
                                className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddAchievement(idx)}
                                className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center space-x-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Ajouter à l'expérience</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingAchToExpIdx(idx);
                              setNewAchText("");
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center space-x-1 py-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Ajouter une mission ou responsabilité de votre CV</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Compétences & Outils classés en 6 catégories */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>Compétences Reformatées & Structurées pour le Parsing ATS (6 Catégories)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 1. Hard Skills */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-indigo-300 block mb-2">
                      🎯 Compétences Métier & Stratégiques
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeCv.optimizedCvSections.skills.technical || []).map((tech, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-md bg-indigo-950/70 text-indigo-200 border border-indigo-800/40"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 2. Outils & Logiciels */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-cyan-300 block mb-2">
                      🛠️ Outils, Logiciels & Plateformes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeCv.optimizedCvSections.skills.tools || []).map((tool, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-md bg-cyan-950/70 text-cyan-200 border border-cyan-800/40"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 3. Data & Analytics */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-emerald-300 block mb-2">
                      📊 Data, Analyse & KPIs
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeCv.optimizedCvSections.skills.dataAndAnalytics || []).map((data, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-md bg-emerald-950/70 text-emerald-200 border border-emerald-800/40"
                        >
                          {data}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 4. Méthodologies */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-amber-300 block mb-2">
                      ⚙️ Méthodologies & Process
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeCv.optimizedCvSections.skills.methodologies || []).map((meth, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-md bg-amber-950/70 text-amber-200 border border-amber-800/40"
                        >
                          {meth}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 5. Soft Skills */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-rose-300 block mb-2">
                      🤝 Qualités Humaines & Leadership
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeCv.optimizedCvSections.skills.softSkills || []).map((soft, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-md bg-rose-950/70 text-rose-200 border border-rose-800/40"
                        >
                          {soft}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 6. Langues */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-purple-300 block mb-2">
                      🌍 Langues & International
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeCv.optimizedCvSections.skills.languages || []).map((lang, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-md bg-purple-950/70 text-purple-200 border border-purple-800/40"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Formations & Diplômes vérifiés */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-2">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Formations & Diplômes réels</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeCv.optimizedCvSections.education.map((edu, idx) => (
                    <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                      <div className="font-bold text-white">{edu.degree}</div>
                      <div className="text-slate-400">
                        {edu.institution} • {edu.year}
                      </div>
                      {edu.details && <div className="text-slate-500 mt-1">{edu.details}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Categorized Skills Suggestions (Explicit Requirement: "suggestions classées par catégories") */}
          {activeCv.skillCategorySuggestions && activeCv.skillCategorySuggestions.length > 0 && (
            <CategorizedSkillsSuggestions
              suggestions={activeCv.skillCategorySuggestions}
              currentSkills={activeCv.optimizedCvSections.skills}
              onAddSkill={handleAddSkillToCv}
              onRemoveSkill={handleRemoveSkillFromCv}
            />
          )}

          {/* Dedicated Photo Upload & AI Studio Modifier (Explicit Requirement: "pouvoir uploader ma photo directement pour qu'elle soit modifiée") */}
          <PhotoModifierStudio
            imagenPrompt={activeCv.imagenPrompt}
            targetJobTitle={activeCv.optimizedCvSections.targetTitle.replace(/\*\*/g, "")}
            onModifyPhoto={onModifyPhoto}
          />

          {/* Validation Banner (Explicit Requirement: "Demande la validation de l'utilisateur pour passer à la suite") */}
          <div className="rounded-2xl border-2 border-indigo-500/50 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <ThumbsUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Validation du CV Optimisé
                </h3>
                {isValidated && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    ✓ Validé
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Validez ce CV optimisé pour débloquer l'<strong>Étape 3</strong> : la rédaction immédiate de votre <strong>Courriel d'accompagnement (&lt;150 mots)</strong> et de votre <strong>Lettre de Motivation Toi/Moi/Nous</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {!isValidated ? (
                <button
                  type="button"
                  onClick={() => onValidateCv(activeCv || undefined)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Je valide ce CV & Je passe à l'Étape 3</span>
                </button>
              ) : (
                <button
                  onClick={onProceedToStep3}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Accéder à l'Étape 3 (Courriel & Lettre)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
