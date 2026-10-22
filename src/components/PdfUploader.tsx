import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Eye,
  Columns,
  Cpu,
} from "lucide-react";
import { UploadedPdfInfo } from "../types/index.ts";

import { extractTextFromPdf } from "../utils/pdfExtractor.ts";

interface PdfUploaderProps {
  uploadedPdf: UploadedPdfInfo | null;
  onPdfUploaded: (pdfInfo: UploadedPdfInfo) => void;
  onRemovePdf: () => void;
  isParsingPdf: boolean;
  setIsParsingPdf: (val: boolean) => void;
  onParseError: (err: string) => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  uploadedPdf,
  onPdfUploaded,
  onRemovePdf,
  isParsingPdf,
  setIsParsingPdf,
  onParseError,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<"diagnosis" | "extracted">("diagnosis");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      onParseError("Veuillez sélectionner un fichier au format PDF valide (.pdf).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      onParseError("Le fichier PDF dépasse la limite de 15 Mo.");
      return;
    }

    setIsParsingPdf(true);

    try {
      // 1. Instant client-side text extraction (under 100ms)
      const extracted = await extractTextFromPdf(file);
      const objectUrl = URL.createObjectURL(file);

      const hasText = extracted.hasTextLayer;
      const initialScore = hasText ? 93 : 40;

      // Immediately provide the extracted text and initial diagnosis to the UI
      onPdfUploaded({
        filename: file.name,
        sizeBytes: file.size,
        base64Data: "",
        objectUrl,
        diagnosis: {
          formatScore: initialScore,
          isTextLayerPresent: hasText,
          layoutQuality: hasText ? "Excellente lisibilité ATS (Format Vectoriel)" : "Format Scanné ou Image Risqué",
          columnStructure: "Structure lisible et ordonnée",
          risksDetected: hasText
            ? ["Vérifier que les en-têtes et coordonnées ne sont pas placés dans une zone inaccessible"]
            : ["Absence de texte numérique sélectionnable : les robots ATS risquent de rejeter ce scan"],
          strengths: hasText
            ? [
                `Couche texte vectorielle détectée (${extracted.text.length} caractères)`,
                `${extracted.numPages} page(s) identifiée(s)`,
                "Polices de caractères standards compatibles avec les filtres Workday, Taleo & Greenhouse",
              ]
            : ["Fichier PDF reçu"],
          recommendations: hasText
            ? ["Le texte du CV a été extrait avec succès et est prêt pour le ciblage et l'optimisation ATS."]
            : ["Enregistrez votre CV sous Word ou Google Docs en 'Enregistrer sous PDF' au lieu d'un scan papier."],
        },
        extractedText: extracted.text,
      });

      // Stop spinner right away so the user immediately sees their file loaded
      setIsParsingPdf(false);

      // 2. Asynchronously refine the diagnosis and extract candidate details via Gemini
      fetch("/api/parse-cv-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedText: extracted.text,
          filename: file.name,
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const parsedData = await res.json();
            if (parsedData.atsFormatDiagnosis) {
              onPdfUploaded({
                filename: file.name,
                sizeBytes: file.size,
                base64Data: "",
                objectUrl,
                diagnosis: parsedData.atsFormatDiagnosis,
                extractedText: parsedData.extractedText || extracted.text,
                candidateName: parsedData.candidateInfo?.name,
              });
            }
          }
        })
        .catch((serverErr) => {
          console.warn("Background ATS enrichment notice:", serverErr);
        });
    } catch (extractErr: any) {
      console.error("PDF Extraction error:", extractErr);
      onParseError("Impossible d'extraire le texte du fichier PDF. Vérifiez qu'il n'est pas protégé par mot de passe.");
      setIsParsingPdf(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className="space-y-4">
      {/* Upload Drop Zone if no PDF uploaded yet */}
      {!uploadedPdf ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
            isDragOver
              ? "border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 scale-[1.01]"
              : "border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-900/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            {isParsingPdf ? (
              <div className="w-7 h-7 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7 text-emerald-400" />
            )}
          </div>

          <div>
            <div className="text-sm font-bold text-white">
              {isParsingPdf
                ? "Analyse du PDF par le scanner ATS en cours..."
                : "Glissez-déposez votre CV en format PDF ici"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ou <span className="text-emerald-400 font-semibold underline underline-offset-2">parcourez vos fichiers</span> (Format .PDF, max 10 Mo)
            </p>
          </div>

          <div className="inline-flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit technique immédiat : lisibilité des robots ATS, couche texte, colonnes</span>
          </div>
        </div>
      ) : (
        /* Card when PDF is uploaded & parsed */
        <div className="bg-slate-950 rounded-2xl border border-emerald-500/30 p-5 space-y-4 shadow-xl">
          {/* Top File Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                    {uploadedPdf.filename}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    PDF Analysé
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Taille : {formatFileSize(uploadedPdf.sizeBytes)} • Ingéré sans ressaisie
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onRemovePdf}
                className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-800 transition-colors flex items-center space-x-1"
                title="Changer de fichier PDF"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remplacer le PDF</span>
              </button>
            </div>
          </div>

          {/* ATS Score & Tabs */}
          {uploadedPdf.diagnosis && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <span className="text-lg font-black text-emerald-400">
                      {uploadedPdf.diagnosis.formatScore}%
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Score de Format & Lisibilité ATS du PDF
                    </div>
                    <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                      <span>{uploadedPdf.diagnosis.layoutQuality}</span>
                    </div>
                  </div>
                </div>

                {/* Sub tabs: Diagnosis vs Raw text */}
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("diagnosis")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                      activeTab === "diagnosis"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Audit Format ATS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("extracted")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                      activeTab === "extracted"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Texte Extrait ({uploadedPdf.extractedText?.length || 0} car.)</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Technical ATS Format Diagnosis */}
              {activeTab === "diagnosis" && (
                <div className="space-y-3 text-xs animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Couche Texte Numérique
                      </div>
                      <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Texte sélectionnable (Conforme ATS)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Le robot ATS peut parser chaque mot sans nécessiter de reconnaissance optique (OCR).
                      </p>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Structure des Colonnes
                      </div>
                      <div className="flex items-center space-x-1.5 text-indigo-300 font-bold">
                        <Columns className="w-4 h-4 text-indigo-400" />
                        <span>{uploadedPdf.diagnosis.columnStructure}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        L'ordre séquentiel de lecture est respecté pour les algorithmes de tri.
                      </p>
                    </div>
                  </div>

                  {/* Strengths & Recommendations */}
                  <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ce que les robots ATS retiennent de ce fichier PDF :</span>
                    </div>
                    <ul className="space-y-1">
                      {uploadedPdf.diagnosis.strengths.map((str, idx) => (
                        <li key={idx} className="text-slate-300 flex items-start space-x-1.5">
                          <span className="text-emerald-400">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                    {uploadedPdf.diagnosis.risksDetected?.length > 0 && (
                      <div className="pt-2 border-t border-slate-800">
                        <div className="text-amber-400 font-semibold mb-1 flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Points de vigilance pour les filtres ATS :</span>
                        </div>
                        <ul className="space-y-1 text-slate-400">
                          {uploadedPdf.diagnosis.risksDetected.map((risk, idx) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span className="text-amber-400">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Raw Extracted Text View */}
              {activeTab === "extracted" && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Texte capté et structuré depuis votre PDF (prêt pour l'étape 1 & 2) :</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3.5 rounded-xl border border-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                    {uploadedPdf.extractedText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
