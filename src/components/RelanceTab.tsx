import React, { useState } from "react";
import {
  Clock,
  Send,
  Copy,
  Check,
  Calendar,
  Sparkles,
  MessageSquare,
  Linkedin,
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  ShieldAlert,
  BellOff,
  BellRing,
  HelpCircle,
  ThumbsUp,
} from "lucide-react";
import { JobAnalysis, OptimizedCv, ApplicationDocuments } from "../types/index.ts";

interface RelanceTabProps {
  jobAnalysis: JobAnalysis | null;
  optimizedCv: OptimizedCv | null;
  documents: ApplicationDocuments | null;
  candidateName: string;
  onBackToDocuments: () => void;
}

export const RelanceTab: React.FC<RelanceTabProps> = ({
  jobAnalysis,
  optimizedCv,
  documents,
  candidateName,
  onBackToDocuments,
}) => {
  const [activeScenario, setActiveScenario] = useState<
    "j7" | "deadline_passed" | "j15" | "post_interview" | "response_received" | "linkedin"
  >("j7");
  const [recruiterName, setRecruiterName] = useState("");
  const [applicationDateIso, setApplicationDateIso] = useState<string>(() => {
    // Default: 7 days ago
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [promisedDate, setPromisedDate] = useState("la fin de semaine dernière");
  const [isRelanceDeactivated, setIsRelanceDeactivated] = useState(false);
  const [copied, setCopied] = useState(false);

  const postTitle = jobAnalysis?.jobTitle || "votre offre de recrutement";
  const compName = jobAnalysis?.companyName || "votre entreprise";
  const name = candidateName || "Julien Moreau";
  const targetKeySkill = optimizedCv?.injectedKeywords?.[0] || "mon expertise";

  // Calculate elapsed days
  const computeElapsedDays = () => {
    if (!applicationDateIso) return 7;
    const past = new Date(applicationDateIso);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - past.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const elapsedDays = computeElapsedDays();

  // Format date display
  const formatDateDisplay = (iso: string) => {
    if (!iso) return "il y a une semaine";
    try {
      const d = new Date(iso);
      return `le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
    } catch {
      return "récemment";
    }
  };

  const formattedDate = formatDateDisplay(applicationDateIso);

  const getTemplate = () => {
    const greeting = recruiterName ? `Bonjour ${recruiterName},` : "Madame, Monsieur,";

    // 1. Relance J+7 à J+10 : Candidature envoyée sans réponse
    if (activeScenario === "j7") {
      return {
        title: "Relance J+7 à J+10 : Candidature sans réponse (Recommandé)",
        timingBadge: `J+${elapsedDays} (${elapsedDays >= 7 ? "Timing optimal" : "Délai un peu court"})`,
        subject: `Suivi de candidature : ${postTitle} - ${name}`,
        body: `${greeting}

Je me permets de revenir vers vous avec courtoisie concernant ma candidature pour le poste de ${postTitle} au sein de ${compName}, transmise ${formattedDate}.

Toujours particulièrement enthousiasmé par vos projets, notamment autour de ${
          jobAnalysis?.keyChallenges?.[0] || "vos perspectives d'évolution actuelles"
        }, je reste convaincu que mon parcours et mes compétences en ${targetKeySkill} me permettront d'apporter une contribution concrète à vos équipes.

Je tenais à vous renouveler mon vif intérêt pour cette opportunité. Mon CV et ma lettre de motivation restent à votre entière disposition.

Seriez-vous disponible pour un court échange téléphonique de 10 minutes dans les prochains jours ?

En vous souhaitant une excellente journée,

Bien cordialement,
${name}`,
        tip: "Le créneau optimal est un mardi ou jeudi matin entre 9h et 10h. Ne présumez jamais que le recruteur a lu votre CV sans réponse : restez toujours constructif et orienté valeur.",
      };
    }

    // 2. Retour promis dépassé
    if (activeScenario === "deadline_passed") {
      return {
        title: "Délai de retour promis dépassé : Suivi respectueux",
        timingBadge: "Après la date annoncée par le recruteur",
        subject: `Suivi suite à nos échanges : ${postTitle} - ${name}`,
        body: `${greeting}

Suite à nos précédents échanges au cours desquels vous m'aviez indiqué un possible retour d'ici ${promisedDate}, je me permets de prendre de vos nouvelles concernant l'avancement du processus pour le poste de ${postTitle}.

Toujours très motivé à l'idée de rejoindre ${compName}, je reste à votre disposition si des informations ou précisions complémentaires vous étaient utiles.

Je vous remercie par avance pour le temps accordé à mon dossier et vous souhaite une excellente semaine.

Bien cordialement,
${name}`,
        tip: "Rappelez sobrement la date convenue sans reproche. Les recruteurs apprécient cette rigueur professionnelle lorsqu'un processus interne prend du retard.",
      };
    }

    // 3. Relance J+15 : Deuxième et dernière relance courtoise
    if (activeScenario === "j15") {
      return {
        title: "Relance J+15 : Deuxième et dernière relance cordiale",
        timingBadge: "15 jours sans retour",
        subject: `Dernier suivi de candidature - ${postTitle} | ${name}`,
        body: `${greeting}

Sans nouvelles de votre part suite à mes messages concernant le poste de ${postTitle}, je me permets une brève démarche afin de m'assurer que mes éléments vous sont bien parvenus.

Si les entretiens sont toujours en cours, je serais ravi d'échanger avec vous afin d'aborder concrètement vos priorités opérationnelles sur ${
          jobAnalysis?.atsKeywords.hardSkills?.[0] || "ce périmètre"
        }.

Si le poste est d'ores et déjà pourvu ou réorienté, je vous remercie par avance pour votre retour et vous souhaite plein succès dans le développement de vos projets.

Très cordialement,
${name}`,
        tip: "Cette relance 'de clôture' déculpabilise le recruteur débordé et déclenche souvent une réponse rapide pour statuer sur le dossier.",
      };
    }

    // 4. Post-entretien (H+24 à H+48)
    if (activeScenario === "post_interview") {
      return {
        title: "Relance Post-Entretien (H+24 à H+48) : Remerciements & Réaffirmation du Fit",
        timingBadge: "Le lendemain ou surlendemain de l'échange",
        subject: `Merci pour notre échange - Candidature ${postTitle} - ${name}`,
        body: `${greeting}

Je tiens à vous remercier chaleureusement pour le temps que vous m'avez accordé lors de notre entretien au sujet de l'opportunité de ${postTitle}.

Nos échanges ont conforté mon enthousiasme à l'idée de rejoindre ${compName}. La perspective de relever le défi de ${
          jobAnalysis?.keyChallenges?.[0] || "vos enjeux actuels"
        } en mobilisant mes compétences en ${targetKeySkill} résonne parfaitement avec ce que je souhaite accomplir.

Restant à votre disposition pour tout échange complémentaire ou pour transmettre d'éventuelles références, je vous souhaite une excellente semaine.

Bien à vous,
${name}`,
        tip: "Incontournable : 9 recruteurs sur 10 considèrent le courriel de remerciement post-entretien comme un marqueur déterminant de professionnalisme.",
      };
    }

    // 5. Réponse reçue / Entretien décroché (Confirmation & Adaptation)
    if (activeScenario === "response_received") {
      return {
        title: "Confirmation d'Entretien suite à réponse positive",
        timingBadge: "Immédiat après invitation à un échange",
        subject: `Confirmation de notre rendez-vous : ${postTitle} - ${name}`,
        body: `${greeting}

Je vous remercie vivement pour votre retour positif et votre invitation à échanger concernant le poste de ${postTitle} au sein de ${compName}.

Je vous confirme avec grand plaisir ma disponibilité pour notre entretien selon les modalités convenues.

Dans l'attente de cet échange que j'aborde avec beaucoup d'enthousiasme, je vous souhaite une excellente journée.

Bien cordialement,
${name}`,
        tip: "Répondez dans les 2 heures suivant l'invitation. Une réactivité exemplaire renforce immédiatement votre crédibilité.",
      };
    }

    // 6. Message LinkedIn
    return {
      title: "Message de Relance LinkedIn (Format Court & Percutant)",
      timingBadge: "Prise de contact directe sur LinkedIn",
      subject: "Message InMail / Demande de connexion LinkedIn",
      body: `Bonjour ${recruiterName || "Monsieur/Madame"},

J'ai postulé à l'offre de ${postTitle} chez ${compName}. Passionné par vos réalisations en ${
        jobAnalysis?.companyTone || "votre secteur"
      }, j'aimerais vous renouveler mon grand intérêt.

Mes compétences en ${targetKeySkill} correspondent étroitement à vos critères clés. Seriez-vous ouvert(e) à un bref échange informel ? 

Bien cordialement,
${name}`,
      tip: "Moins de 300 caractères si invitation de connexion sans InMail. Très efficace pour court-circuiter les boîtes mails saturées.",
    };
  };

  const currentTemplate = getTemplate();

  const handleCopy = () => {
    const fullText = `Objet : ${currentTemplate.subject}\n\n${currentTemplate.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>Module Spécial « Relances Stratégiques »</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Section 6 Conforme
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Messages sur-mesure pour {postTitle} chez {compName}.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRelanceDeactivated(!isRelanceDeactivated)}
              className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                isRelanceDeactivated
                  ? "bg-slate-800 text-slate-400 border-slate-700"
                  : "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
              }`}
            >
              {isRelanceDeactivated ? <BellOff className="w-3.5 h-3.5" /> : <BellRing className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isRelanceDeactivated ? "Relance Désactivée (Réponse reçue)" : "Relance Active"}</span>
            </button>

            <button
              onClick={onBackToDocuments}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour Documents</span>
            </button>
          </div>
        </div>

        {/* Section 6 Ethics & Rules Banner */}
        <div className="pt-3 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong>Règle de courtoisie :</strong> Aucune affirmation infondée sur la lecture de votre CV. Respect strict des délais annoncés.
            </span>
          </div>
          <div className="text-amber-300 font-medium">
            Délai réel constaté : {elapsedDays} jour{elapsedDays > 1 ? "s" : ""}
          </div>
        </div>

        {/* Scenario Tabs (6 distinct contexts) */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => setActiveScenario("j7")}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              activeScenario === "j7"
                ? "bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-xs"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">J+7 à J+10</div>
            <div className="text-xs font-semibold mt-0.5">Sans réponse</div>
          </button>

          <button
            onClick={() => setActiveScenario("deadline_passed")}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              activeScenario === "deadline_passed"
                ? "bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-xs"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Délai promis</div>
            <div className="text-xs font-semibold mt-0.5">Date dépassée</div>
          </button>

          <button
            onClick={() => setActiveScenario("post_interview")}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              activeScenario === "post_interview"
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-xs"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">H+24 / H+48</div>
            <div className="text-xs font-semibold mt-0.5">Post-Entretien</div>
          </button>

          <button
            onClick={() => setActiveScenario("response_received")}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              activeScenario === "response_received"
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-xs"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Réponse reçue</div>
            <div className="text-xs font-semibold mt-0.5">Confirmation RDV</div>
          </button>

          <button
            onClick={() => setActiveScenario("j15")}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              activeScenario === "j15"
                ? "bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-xs"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">J+15</div>
            <div className="text-xs font-semibold mt-0.5">Dernier suivi</div>
          </button>

          <button
            onClick={() => setActiveScenario("linkedin")}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              activeScenario === "linkedin"
                ? "bg-sky-500/20 text-sky-200 border-sky-500/50 shadow-xs"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">LinkedIn</div>
            <div className="text-xs font-semibold mt-0.5">Message court</div>
          </button>
        </div>
      </div>

      {/* Real Date Calculation & Customization Inputs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Date réelle de candidature / entretien</span>
          </label>
          <input
            type="date"
            value={applicationDateIso}
            onChange={(e) => setApplicationDateIso(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">
            Délai calculé : {elapsedDays} jour(s) écoulé(s)
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Nom ou Titre du recruteur (optionnel)
          </label>
          <input
            type="text"
            value={recruiterName}
            onChange={(e) => setRecruiterName(e.target.value)}
            placeholder="Ex : M. Martin / Sophie / Responsable recrutement"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Délai ou retour promis par l'entreprise
          </label>
          <input
            type="text"
            value={promisedDate}
            onChange={(e) => setPromisedDate(e.target.value)}
            placeholder="Ex : vendredi dernier / sous 10 jours"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Deactivated Notice */}
      {isRelanceDeactivated && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <BellOff className="w-4 h-4 text-slate-500" />
            <span>
              Cette relance est marquée comme <strong>désactivée</strong> (vous avez reçu une réponse ou l'opportunité n'est plus d'actualité).
            </span>
          </div>
          <button
            onClick={() => setIsRelanceDeactivated(false)}
            className="text-amber-300 hover:underline font-semibold"
          >
            Réactiver
          </button>
        </div>
      )}

      {/* Generated Relance Preview Card */}
      {!isRelanceDeactivated && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {currentTemplate.title}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Statut : <span className="text-slate-300 font-mono">{currentTemplate.timingBadge}</span>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copié dans le presse-papier !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le courriel de relance</span>
                </>
              )}
            </button>
          </div>

          {/* Subject */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300">
            <span className="font-semibold text-slate-400">Objet : </span>
            <span className="font-bold text-white font-mono">{currentTemplate.subject}</span>
          </div>

          {/* Body */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
            {currentTemplate.body}
          </div>

          {/* Pro-tip */}
          <div className="flex items-start space-x-2.5 text-xs text-amber-300 bg-amber-950/30 border border-amber-800/40 p-3.5 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Conseil de recruteur : </strong>
              {currentTemplate.tip}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
