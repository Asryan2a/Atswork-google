import React, { useState } from "react";
import {
  Wrench,
  Sparkles,
  Plus,
  Check,
  Target,
  BarChart3,
  Cpu,
  Layers,
  HeartHandshake,
  Globe,
  Info,
  X,
} from "lucide-react";
import { SkillCategorySuggestion, CategorizedSkills } from "../types/index.ts";

interface CategorizedSkillsSuggestionsProps {
  suggestions: SkillCategorySuggestion[];
  currentSkills: CategorizedSkills;
  onAddSkill: (categoryName: string, skill: string) => void;
  onRemoveSkill: (categoryName: string, skill: string) => void;
}

export const CategorizedSkillsSuggestions: React.FC<CategorizedSkillsSuggestionsProps> = ({
  suggestions,
  currentSkills,
  onAddSkill,
  onRemoveSkill,
}) => {
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());

  const handleAdd = (categoryName: string, skill: string) => {
    onAddSkill(categoryName, skill);
    setAddedSkills((prev) => new Set(prev).add(`${categoryName}-${skill}`));
  };

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("hard") || lower.includes("technique") || lower.includes("stratégie") || lower.includes("métier")) {
      return <Target className="w-4 h-4 text-indigo-400" />;
    }
    if (lower.includes("outil") || lower.includes("logiciel") || lower.includes("plateforme")) {
      return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
    if (lower.includes("data") || lower.includes("analytics") || lower.includes("kpi") || lower.includes("mesure")) {
      return <BarChart3 className="w-4 h-4 text-emerald-400" />;
    }
    if (lower.includes("méthod") || lower.includes("process") || lower.includes("projet") || lower.includes("agile")) {
      return <Layers className="w-4 h-4 text-amber-400" />;
    }
    if (lower.includes("soft") || lower.includes("humain") || lower.includes("leadership") || lower.includes("relationnel")) {
      return <HeartHandshake className="w-4 h-4 text-rose-400" />;
    }
    if (lower.includes("langue") || lower.includes("international")) {
      return <Globe className="w-4 h-4 text-purple-400" />;
    }
    return <Wrench className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Suggestions de Compétences Classées par Catégories</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
                Audit ATS
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Classement hiérarchisé selon les grilles de lecture des logiciels de recrutement (Workday, Taleo). Cliquez sur <strong className="text-white">+</strong> pour ajouter un mot-clé manquant.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80">
          6 catégories analysées
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {suggestions.map((cat, idx) => (
          <div
            key={idx}
            className="bg-slate-950 rounded-xl p-5 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Category Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {getCategoryIcon(cat.categoryName)}
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {cat.categoryName}
                  </h4>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">
                {cat.description}
              </p>

              {/* Current Skills in this category */}
              <div className="mb-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                  Compétences actuelles détectées dans votre CV :
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.currentSkills && cat.currentSkills.length > 0 ? (
                    cat.currentSkills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Aucune compétence explicite trouvée dans le CV brut
                    </span>
                  )}
                </div>
              </div>

              {/* Suggested Additions */}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-indigo-400 font-semibold mb-1.5 flex items-center space-x-1">
                  <span>Mots-clés de l'offre à intégrer (1 clic pour ajouter) :</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.suggestedAdditions.map((addition, aIdx) => {
                    const isAdded = addedSkills.has(`${cat.categoryName}-${addition}`);
                    return (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleAdd(cat.categoryName, addition)}
                        className={`text-xs px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 font-medium border ${
                          isAdded
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-600/50"
                            : "bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border-indigo-700/50 hover:border-indigo-400"
                        }`}
                        title="Cliquez pour injecter cette compétence dans votre CV"
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>{addition}</span>
                            <span className="text-[10px] text-emerald-400 font-bold">(Ajouté)</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3 text-indigo-400" />
                            <span>{addition}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Why important for ATS */}
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-300">Impact ATS :</strong> {cat.whyImportantForAts}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
