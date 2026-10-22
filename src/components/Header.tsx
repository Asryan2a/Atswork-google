import React from "react";
import { Sparkles, FileText, CheckCircle2, Send, Clock, Printer, RotateCcw, Brain } from "lucide-react";
import { ApplicationStep } from "../types/index.ts";

interface HeaderProps {
  currentStep: ApplicationStep;
  onSelectStep: (step: ApplicationStep) => void;
  canAccessStep2: boolean;
  canAccessStep3: boolean;
  isCvValidated: boolean;
  onReset: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  canAccessStep2,
  canAccessStep3,
  isCvValidated,
  onReset,
  onPrint,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">
                  Candidature ATS <span className="text-indigo-400">Pro</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  IA Chirurgicale
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Optimisation ATS sans mensonge • Pitch 150 mots • Lettre Toi/Moi/Nous • Relance
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrint}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Exporter / Imprimer en PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onReset}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 transition-colors"
              title="Nouvelle session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          </div>
        </div>

        {/* Step Navigation Bar */}
        <div className="flex items-center overflow-x-auto py-2.5 space-x-2 sm:space-x-4 border-t border-slate-800/60 no-scrollbar">
          {/* Étape 1 */}
          <button
            onClick={() => onSelectStep("step1_analysis")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              currentStep === "step1_analysis"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === "step1_analysis"
                  ? "bg-indigo-600 text-white"
                  : canAccessStep2
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {canAccessStep2 ? "✓" : "1"}
            </div>
            <span>Étape 1 : Analyse de l'Offre</span>
          </button>

          <span className="text-slate-600 text-xs hidden sm:inline">→</span>

          {/* Étape 2 */}
          <button
            onClick={() => canAccessStep2 && onSelectStep("step2_optimization")}
            disabled={!canAccessStep2}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              currentStep === "step2_optimization"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                : canAccessStep2
                ? "text-slate-300 hover:text-white hover:bg-slate-800/50"
                : "text-slate-600 cursor-not-allowed opacity-60"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === "step2_optimization"
                  ? "bg-indigo-600 text-white"
                  : isCvValidated
                  ? "bg-emerald-500 text-white"
                  : canAccessStep2
                  ? "bg-slate-700 text-slate-300"
                  : "bg-slate-800 text-slate-600"
              }`}
            >
              {isCvValidated ? "✓" : "2"}
            </div>
            <span>Étape 2 : Optimisation CV (ATS)</span>
            {isCvValidated && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <span className="text-slate-600 text-xs hidden sm:inline">→</span>

          {/* Étape 3 */}
          <button
            onClick={() => canAccessStep3 && onSelectStep("step3_documents")}
            disabled={!canAccessStep3}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              currentStep === "step3_documents"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                : canAccessStep3
                ? "text-slate-300 hover:text-white hover:bg-slate-800/50"
                : "text-slate-600 cursor-not-allowed opacity-60"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === "step3_documents"
                  ? "bg-indigo-600 text-white"
                  : canAccessStep3
                  ? "bg-slate-700 text-slate-300"
                  : "bg-slate-800 text-slate-600"
              }`}
            >
              3
            </div>
            <span>Étape 3 : Candidature (Pitch & Lettre)</span>
          </button>

          <span className="text-slate-600 text-xs hidden sm:inline">|</span>

          {/* Module Relance */}
          <button
            onClick={() => onSelectStep("step_relance")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              currentStep === "step_relance"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-amber-200 hover:bg-slate-800/50"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Courriels de Relance (J+7 / J+10)</span>
          </button>

          <span className="text-slate-600 text-xs hidden sm:inline">|</span>

          {/* Module Simulation Entretien */}
          <button
            onClick={() => onSelectStep("step_interview")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              currentStep === "step_interview"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-emerald-200 hover:bg-slate-800/50"
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulation d'Entretien (Grille /25)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
