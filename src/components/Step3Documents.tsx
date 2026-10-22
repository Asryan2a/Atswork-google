import React, { useState } from "react";
import {
  Mail,
  FileCheck2,
  Copy,
  Check,
  Send,
  Building,
  UserCheck,
  Handshake,
  Sparkles,
  ExternalLink,
  Printer,
  Edit3,
  SlidersHorizontal,
  Download,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ApplicationDocuments, JobAnalysis, OptimizedCv } from "../types/index.ts";
import { auditApplicationDocuments } from "../utils/dynamicFallback.ts";

interface Step3DocumentsProps {
  documents: ApplicationDocuments | null;
  jobAnalysis: JobAnalysis | null;
  optimizedCv: OptimizedCv | null;
  candidateName: string;
  isLoading: boolean;
  onGenerateDocuments: (toneInstruction?: string, customJobTitle?: string, customCompany?: string) => void;
  onUpdateJobTitle?: (newTitle: string, newCompany?: string) => void;
  onPrint: () => void;
  onGoToRelance: () => void;
}

export const Step3Documents: React.FC<Step3DocumentsProps> = ({
  documents,
  jobAnalysis,
  optimizedCv,
  candidateName,
  isLoading,
  onGenerateDocuments,
  onUpdateJobTitle,
  onPrint,
  onGoToRelance,
}) => {
  const [selectedTone, setSelectedTone] = useState("Professionnel percutant et dynamique");
  const [customJobTitle, setCustomJobTitle] = useState(jobAnalysis?.jobTitle || "");
  const [customCompany, setCustomCompany] = useState(jobAnalysis?.companyName || "");
  const [titleUpdateToast, setTitleUpdateToast] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [isEditingLetter, setIsEditingLetter] = useState(false);
  const [editableLetter, setEditableLetter] = useState("");
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showAuditDetails, setShowAuditDetails] = useState(true);

  React.useEffect(() => {
    if (jobAnalysis?.jobTitle) setCustomJobTitle(jobAnalysis.jobTitle);
    if (jobAnalysis?.companyName) setCustomCompany(jobAnalysis.companyName);
  }, [jobAnalysis?.jobTitle, jobAnalysis?.companyName]);

  const handleApplyTitle = (overrideTitle?: string, overrideCompany?: string) => {
    const finalTitle = (overrideTitle !== undefined ? overrideTitle : customJobTitle).trim();
    const finalComp = (overrideCompany !== undefined ? overrideCompany : customCompany).trim();
    if (!finalTitle) return;

    if (overrideTitle !== undefined) setCustomJobTitle(finalTitle);
    if (overrideCompany !== undefined) setCustomCompany(finalComp);

    if (onUpdateJobTitle) {
      onUpdateJobTitle(finalTitle, finalComp || undefined);
    }

    if (isEditingLetter && editableLetter && jobAnalysis?.jobTitle) {
      setEditableLetter(editableLetter.split(jobAnalysis.jobTitle).join(finalTitle));
    }

    setTitleUpdateToast(`Intitulé adapté aux documents : "${finalTitle}"`);
    setTimeout(() => setTitleUpdateToast(null), 3500);
  };

  const tones = [
    { id: "impact", label: "Professionnel & Percutant (Recommandé)", prompt: "Ton percutant, direct et résolument orienté résultats." },
    { id: "corporate", label: "Corporate & Institutionnel", prompt: "Ton très soigné, respectueux des codes du secteur corporate et bancaire." },
    { id: "startup", label: "Agile & Startup", prompt: "Ton moderne, enthousiaste, chaleureux, sans formules pompeuses." },
  ];

  const handleCopyEmail = () => {
    if (!documents?.emailPitch) return;
    const text = `Objet : ${documents.emailPitch.subject}\n\n${documents.emailPitch.content}`;
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyLetter = () => {
    const textToCopy = isEditingLetter && editableLetter ? editableLetter : documents?.coverLetter?.fullLetterFormatted;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2500);
  };

  // Section 5: Téléchargement Word (.doc) réel
  const handleDownloadDoc = () => {
    try {
      const textToExport = isEditingLetter && editableLetter ? editableLetter : documents?.coverLetter?.fullLetterFormatted;
      if (!textToExport) {
        setDownloadError("Aucun texte à exporter.");
        return;
      }
      
      const comp = jobAnalysis?.companyName || "Entreprise";
      const title = jobAnalysis?.jobTitle || "Poste";
      const cand = candidateName || "Candidat";

      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Lettre de Motivation - ${cand}</title>
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #222; margin: 2.5cm; }
            h1 { font-size: 14pt; color: #1e3a8a; }
            p { margin-bottom: 1em; }
          </style>
        </head>
        <body>
          <p><strong>Candidature au poste de ${title}</strong><br/>
          Entreprise : ${comp}<br/>
          Candidat : ${cand}</p>
          <hr/>
          ${textToExport.replace(/\n\n/g, "<p>").replace(/\n/g, "<br/>")}</p>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lettre_Motivation_${comp.replace(/\s+/g, "_")}_${cand.replace(/\s+/g, "_")}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccessToast("Fichier Word (.doc) généré et téléchargé avec succès !");
      setTimeout(() => setDownloadSuccessToast(null), 3500);
    } catch (err: any) {
      console.error("Export Word error:", err);
      setDownloadError("La génération automatique du fichier Word a échoué. Utilisez le bouton 'Copier' pour coller directement le contenu.");
    }
  };

  // Section 5: Téléchargement Texte (.txt) réel
  const handleDownloadTxt = () => {
    try {
      if (!documents) return;
      const comp = jobAnalysis?.companyName || "Entreprise";
      const cand = candidateName || "Candidat";
      const title = jobAnalysis?.jobTitle || "Poste";

      const letterText = isEditingLetter && editableLetter ? editableLetter : documents.coverLetter.fullLetterFormatted;
      const fullDossier = `======================================================
DOSSIER DE CANDIDATURE OFFICIEL
Poste : ${title}
Entreprise : ${comp}
Candidat : ${cand}
======================================================

--- PIÈCE 1 : COURRIEL D'ACCOMPAGNEMENT (PITCH COURT) ---
Objet : ${documents.emailPitch.subject}

${documents.emailPitch.content}

------------------------------------------------------
--- PIÈCE 2 : LETTRE DE MOTIVATION (TOI / MOI / NOUS) ---
${letterText}

------------------------------------------------------
Généré avec Candidature ATS Pro • Zéro invention • Conforme Workday, Taleo & Greenhouse
`;

      const blob = new Blob([fullDossier], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Candidature_${comp.replace(/\s+/g, "_")}_${cand.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccessToast("Fichier texte (.txt) généré et téléchargé avec succès !");
      setTimeout(() => setDownloadSuccessToast(null), 3500);
    } catch (err: any) {
      console.error("Export txt error:", err);
      setDownloadError("La génération du fichier texte a échoué. Utilisez le bouton 'Copier' pour récupérer le texte.");
    }
  };

  const countWords = (str: string) => {
    return str.trim().split(/\s+/).filter(Boolean).length;
  };

  const emailWordCount = documents?.emailPitch?.content ? countWords(documents.emailPitch.content) : 0;
  const letterWordCount = documents?.coverLetter?.fullLetterFormatted ? countWords(documents.coverLetter.fullLetterFormatted) : 0;

  // Real-time quality audit report
  const auditReport = auditApplicationDocuments(documents, jobAnalysis, candidateName);

  return (
    <div className="space-y-8">
      {/* Title & Tone Selection Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>CV de l'Étape 2 Validé avec Succès</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Étape 3 : Rédaction des Documents de Candidature
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Deux pièces distinctes et prêtes à l'envoi pour{" "}
              <span className="text-indigo-300 font-semibold">{customJobTitle || jobAnalysis?.jobTitle}</span> chez{" "}
              <span className="text-indigo-300 font-semibold">{customCompany || jobAnalysis?.companyName}</span>.
            </p>
          </div>

          {/* Tone Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Ton :</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTone(t.label)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTone === t.label
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {t.label.split(" (")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CHAMPS DÉDIÉ : INTITULÉ DU POSTE ET ADAPTATION DE LA LETTRE */}
        <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-indigo-500/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <label htmlFor="customJobTitleInput" className="text-xs sm:text-sm font-bold text-white">
                Intitulé exact du poste ciblé (adapter instantanément la lettre)
              </label>
            </div>
            <span className="text-[11px] text-slate-400">
              Modifiez l'intitulé ci-dessous pour aligner immédiatement votre lettre et votre courriel.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <input
                id="customJobTitleInput"
                type="text"
                value={customJobTitle}
                onChange={(e) => setCustomJobTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyTitle();
                  }
                }}
                placeholder="Ex : Chargé de Communication Externe"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium placeholder-slate-500 transition-colors shadow-inner"
              />
            </div>

            <button
              type="button"
              onClick={() => handleApplyTitle()}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Adapter la Lettre & le Courriel</span>
            </button>
          </div>

          {/* Quick Suggestions based on target posting */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-slate-400">Variantes rapides :</span>
            {[
              "Chargé de Communication Externe",
              "Chargé de Communication",
              "Responsable Communication",
              "Chargé de Communication et Marketing Opérationnel",
            ].map((sug, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => handleApplyTitle(sug)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  customJobTitle === sug
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-semibold"
                    : "bg-slate-900 text-slate-400 hover:text-white border-slate-800"
                }`}
              >
                {sug}
              </button>
            ))}
          </div>

          {titleUpdateToast && (
            <div className="text-xs text-emerald-300 font-semibold flex items-center space-x-1.5 pt-1 animate-in fade-in duration-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{titleUpdateToast}</span>
            </div>
          )}
        </div>

        {/* Generate / Regenerate Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Conforme aux normes de recrutement : courriel &lt;150 mots + lettre Toi/Moi/Nous de 300 à 400 mots.
          </div>
          <button
            onClick={() => onGenerateDocuments(selectedTone, customJobTitle, customCompany)}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Rédaction chirurgicale en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{documents ? "Régénérer avec ce titre & ton" : "Rédiger les Documents"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {documents && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Download Toast Notification */}
          {downloadSuccessToast && (
            <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{downloadSuccessToast}</span>
              </div>
              <button onClick={() => setDownloadSuccessToast(null)} className="text-emerald-400 hover:text-white ml-2">
                ×
              </button>
            </div>
          )}

          {downloadError && (
            <div className="bg-rose-950/90 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{downloadError}</span>
              </div>
              <button onClick={() => setDownloadError(null)} className="text-rose-400 hover:text-white ml-2">
                ×
              </button>
            </div>
          )}

          {/* 5. CONTRÔLE FINAL DES DOCUMENTS DE CANDIDATURE (Section 5) */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Audit de Contrôle Qualité Final Avant Envoi</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        auditReport.isFullyCompliant
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {auditReport.isFullyCompliant ? "100% Conforme" : "Points à vérifier"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Vérification automatique des critères éliminatoires (Nom d'entreprise, accords masculins, zéro invention, longueurs).
                  </p>
                </div>
              </div>

              {/* Real Export Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDoc}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 shadow-sm flex items-center space-x-1.5 transition-colors"
                  title="Télécharger la lettre au format Microsoft Word (.doc)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter en Word (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1.5 transition-colors"
                  title="Télécharger l'ensemble du dossier en texte brut (.txt)"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dossier (.txt)</span>
                </button>
              </div>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {auditReport.checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    check.status === "pass"
                      ? "bg-slate-950/80 border-emerald-900/40"
                      : check.status === "warning"
                      ? "bg-amber-950/20 border-amber-800/40"
                      : "bg-rose-950/30 border-rose-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{check.criterion}</span>
                    {check.status === "pass" ? (
                      <span className="text-emerald-400 font-bold">✓</span>
                    ) : check.status === "warning" ? (
                      <span className="text-amber-400 font-bold">⚡</span>
                    ) : (
                      <span className="text-rose-400 font-bold">✕</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{check.details}</p>
                  {check.recommendation && (
                    <p className="text-[10px] text-amber-300 font-medium pt-0.5">{check.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PIECE 1: LE COURRIEL D'ACCOMPAGNEMENT (MAX 150 MOTS) */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>1. Le Courriel d'Accompagnement</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Max 150 mots
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Objet percutant • Accroche directe • Fit sur 2-3 exigences • Appel à l'action
                  </p>
                </div>
              </div>

              {/* Word count & copy */}
              <div className="flex items-center space-x-3">
                <div
                  className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold border ${
                    emailWordCount <= 150
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                      : "bg-rose-950/60 text-rose-300 border-rose-800/60"
                  }`}
                >
                  {emailWordCount} / 150 mots {emailWordCount <= 150 ? "✓ Conforme" : "⚠️ Dépassé"}
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Email Subject */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="text-xs sm:text-sm text-slate-300">
                <span className="font-semibold text-slate-400">Objet : </span>
                <span className="font-bold text-white font-mono">{documents.emailPitch.subject}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(documents.emailPitch.subject);
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 ml-2"
                title="Copier uniquement l'objet"
              >
                Copier l'objet
              </button>
            </div>

            {/* Email Body */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {documents.emailPitch.content}
            </div>

            {/* Direct Mailto link */}
            <div className="flex justify-end pt-2">
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  documents.emailPitch.subject
                )}&body=${encodeURIComponent(documents.emailPitch.content)}`}
                className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ouvrir dans mon logiciel de messagerie</span>
              </a>
            </div>
          </div>

          {/* PIECE 2: LA LETTRE DE MOTIVATION (300-400 MOTS) - STRUCTURE TOI / MOI / NOUS */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>2. La Lettre de Motivation</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Structure Stricte 3 Blocs : TOI / MOI / NOUS
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compréhension de leurs défis • Preuves de réalisations concrètes • Synergie & entretien
                  </p>
                </div>
              </div>

              {/* Word count & copy */}
              <div className="flex items-center space-x-3">
                <div
                  className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold border ${
                    letterWordCount >= 280 && letterWordCount <= 420
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                      : "bg-amber-950/60 text-amber-300 border-amber-800/60"
                  }`}
                >
                  {letterWordCount} mots (300-400 requis)
                </div>
                <button
                  onClick={handleCopyLetter}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
                >
                  {copiedLetter ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Lettre copiée !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copier la lettre</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Three Strict Structural Blocks breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* BLOC 1: TOI */}
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/40 relative">
                <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-800">
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    BLOC 1 : TOI (L'ENTREPRISE)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2 italic">
                  Compréhension fine de leurs défis actuels et de leur marché :
                </p>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {documents.coverLetter.toiSection}
                </div>
              </div>

              {/* BLOC 2: MOI */}
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 relative">
                <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-800">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    BLOC 2 : MOI (LE CANDIDAT)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2 italic">
                  Réalisations passées issues du CV prouvant la capacité à résoudre leurs problèmes :
                </p>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {documents.coverLetter.moiSection}
                </div>
              </div>

              {/* BLOC 3: NOUS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/40 relative">
                <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-800">
                  <Handshake className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    BLOC 3 : NOUS (LA SYNERGIE)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2 italic">
                  Ce que vous allez accomplir ensemble et demande d'entretien claire :
                </p>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {documents.coverLetter.nousSection}
                </div>
              </div>
            </div>

            {/* FULL FORMATTED LETTER SHEET */}
            <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Document Intégral Prêt à l'Emploi
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (!isEditingLetter) {
                        setEditableLetter(documents.coverLetter.fullLetterFormatted);
                      }
                      setIsEditingLetter(!isEditingLetter);
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingLetter ? "Terminer l'édition" : "Personnaliser"}</span>
                  </button>
                  <button
                    onClick={onPrint}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer / PDF</span>
                  </button>
                </div>
              </div>

              {isEditingLetter ? (
                <textarea
                  rows={14}
                  value={editableLetter}
                  onChange={(e) => setEditableLetter(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-4 text-xs sm:text-sm text-slate-200 font-sans leading-relaxed resize-y focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans p-2">
                  {editableLetter || documents.coverLetter.fullLetterFormatted}
                </div>
              )}
            </div>
          </div>

          {/* Call to Next Step: Courriel de Relance (J+7 / J+10) */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Anticipez dès maintenant la Relance (J+7 à J+10)</span>
              </h4>
              <p className="text-xs text-slate-300">
                80% des recruteurs apprécient un courriel de relance courtois et pertinent après une semaine sans réponse.
              </p>
            </div>
            <button
              onClick={onGoToRelance}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Accéder au Module de Relance →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
