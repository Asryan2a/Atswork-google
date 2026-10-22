import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Square,
  Play,
  Headphones,
  Send,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Target,
  FileText,
  UserCheck,
  Star,
  Compass,
  ArrowRight,
  MessageSquare,
  BarChart3,
  ThumbsUp,
  Brain,
  Lightbulb,
} from "lucide-react";
import {
  JobAnalysis,
  OptimizedCv,
  InterviewTurn,
  InterviewEvaluation,
  InterviewSessionSummary,
} from "../types/index.ts";
import {
  generateContextualInterviewQuestion,
  evaluateContextualInterviewAnswer,
} from "../utils/dynamicFallback.ts";

interface InterviewSimulationTabProps {
  jobAnalysis: JobAnalysis | null;
  currentCv: string;
  optimizedCv: OptimizedCv | null;
  candidateName: string;
  onGoToDocuments?: () => void;
}

export const InterviewSimulationTab: React.FC<InterviewSimulationTabProps> = ({
  jobAnalysis,
  currentCv,
  optimizedCv,
  candidateName,
  onGoToDocuments,
}) => {
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [currentTurnNumber, setCurrentTurnNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentCategory, setCurrentCategory] = useState<
    "motivation" | "métier" | "mise_en_situation" | "comportementale_star" | "projection"
  >("motivation");
  const [currentContext, setCurrentContext] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [latestEvaluation, setLatestEvaluation] = useState<InterviewEvaluation | null>(null);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<InterviewSessionSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Vocal Simulation States
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(true);
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(true);
  const [isSpeakingRecruiter, setIsSpeakingRecruiter] = useState(false);
  const [isListeningCandidate, setIsListeningCandidate] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Clean voice synth on unmount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRec) {
        setSpeechRecognitionSupported(false);
      }
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/\*\*/g, "").replace(/[#*_]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "fr-FR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const frVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("fr") &&
          (v.name.includes("Google") ||
            v.name.includes("Thomas") ||
            v.name.includes("Amélie") ||
            v.name.includes("Natural"))
      ) || voices.find((v) => v.lang.startsWith("fr"));

    if (frVoice) {
      utterance.voice = frVoice;
    }

    utterance.onstart = () => {
      setIsSpeakingRecruiter(true);
    };

    utterance.onend = () => {
      setIsSpeakingRecruiter(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      setIsSpeakingRecruiter(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeakingRecruiter(false);
    }
  };

  const startVoiceRecording = () => {
    stopSpeaking();
    setVoiceNotice(null);

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechRecognitionSupported(false);
      setVoiceNotice(
        "La dictée vocale n'est pas prise en charge nativement par ce navigateur. Utilisez Chrome, Edge ou Safari."
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "fr-FR";

      const baseText = answerInput.trim() ? answerInput.trim() + " " : "";

      recognition.onstart = () => {
        setIsListeningCandidate(true);
        setRecordingSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setAnswerInput(baseText + transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event?.error);
        if (event.error === "not-allowed") {
          setVoiceNotice("Accès au microphone bloqué. Autorisez le microphone dans les paramètres de votre navigateur.");
        }
        stopVoiceRecording();
      };

      recognition.onend = () => {
        setIsListeningCandidate(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn("Error starting speech recognition:", err);
      setIsListeningCandidate(false);
      setVoiceNotice("Erreur d'initialisation du microphone : " + (err?.message || ""));
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListeningCandidate(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const comp = jobAnalysis?.companyName || "l'entreprise ciblée";
  const postTitle = jobAnalysis?.jobTitle || "le poste ciblé";
  const name = candidateName || "Julien Moreau";

  // Category labels and badges
  const categoryMeta: Record<string, { label: string; color: string; desc: string }> = {
    motivation: {
      label: "1. Motivation & Fit Entreprise",
      color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      desc: "Pourquoi ce poste, pourquoi cette entreprise, cohérence du projet professionnel.",
    },
    métier: {
      label: "2. Compétences Métier & Outils",
      color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      desc: "Maîtrise technique opérationnelle, méthodologies et processus clés de l'offre.",
    },
    mise_en_situation: {
      label: "3. Cas Concret & Mise en Situation",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      desc: "Résolution d'un imprévu, arbitrage de priorités et gestion de parties prenantes.",
    },
    comportementale_star: {
      label: "4. Question Comportementale (Méthode STAR)",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      desc: "Situation vécue, Tâche, Actions concrètes réalisées et Résultat mesurable.",
    },
    projection: {
      label: "5. Projection & Plan à 30-90 jours",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      desc: "Organisation de la prise de poste, priorités d'action et premiers livrables.",
    },
  };

  // Load first question on mount or job change
  useEffect(() => {
    if (jobAnalysis && turns.length === 0 && !currentQuestion) {
      loadNextQuestion(1);
    }
  }, [jobAnalysis]);

  const loadNextQuestion = async (turnNum: number) => {
    if (!jobAnalysis) return;
    setIsLoadingQuestion(true);
    setErrorMessage(null);
    setLatestEvaluation(null);
    setAnswerInput("");

    let questionToSpeak = "";
    try {
      const res = await fetch("/api/interview/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobAnalysis,
          currentCv,
          turnNumber: turnNum,
          previousTurns: turns.map((t) => ({ question: t.question, answer: t.candidateAnswer })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentQuestion(data.question);
        setCurrentCategory(data.category || "motivation");
        setCurrentContext(data.context || "");
        setCurrentTurnNumber(turnNum);
        questionToSpeak = data.question;
      } else {
        throw new Error("Erreur serveur API question");
      }
    } catch (e) {
      // Robust contextual fallback
      const fallback = generateContextualInterviewQuestion(jobAnalysis, turnNum);
      setCurrentQuestion(fallback.question);
      setCurrentCategory(fallback.category);
      setCurrentContext(fallback.context);
      setCurrentTurnNumber(turnNum);
      questionToSpeak = fallback.question;
    } finally {
      setIsLoadingQuestion(false);
      if (autoSpeakQuestion && isVoiceModeActive && questionToSpeak) {
        setTimeout(() => speakText(questionToSpeak), 200);
      }
    }
  };

  const handleEvaluateAnswer = async () => {
    stopVoiceRecording();
    stopSpeaking();
    if (!answerInput.trim() || !jobAnalysis || !currentQuestion) return;
    setIsEvaluating(true);
    setErrorMessage(null);

    const userAns = answerInput.trim();

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobAnalysis,
          currentCv,
          question: currentQuestion,
          candidateAnswer: userAns,
          category: currentCategory,
        }),
      });

      if (res.ok) {
        const evalData: InterviewEvaluation = await res.json();
        setLatestEvaluation(evalData);

        // Record turn
        const newTurn: InterviewTurn = {
          id: `turn-${currentTurnNumber}-${Date.now()}`,
          questionNumber: currentTurnNumber,
          category: currentCategory,
          question: currentQuestion,
          candidateAnswer: userAns,
          evaluation: evalData,
        };
        setTurns((prev) => [...prev, newTurn]);
      } else {
        throw new Error("Fallback evaluation");
      }
    } catch (e) {
      // Dynamic fallback evaluation strictly faithful to criteria
      const evalData = evaluateContextualInterviewAnswer(
        jobAnalysis,
        currentQuestion,
        userAns,
        currentCategory
      );
      setLatestEvaluation(evalData);

      const newTurn: InterviewTurn = {
        id: `turn-${currentTurnNumber}-${Date.now()}`,
        questionNumber: currentTurnNumber,
        category: currentCategory,
        question: currentQuestion,
        candidateAnswer: userAns,
        evaluation: evalData,
      };
      setTurns((prev) => [...prev, newTurn]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    const nextNum = currentTurnNumber + 1;
    loadNextQuestion(nextNum);
  };

  const handleFinishSession = async () => {
    if (!jobAnalysis || turns.length === 0) return;
    setIsLoadingQuestion(true);

    try {
      const res = await fetch("/api/interview/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobAnalysis,
          turns,
        }),
      });

      if (res.ok) {
        const sumData: InterviewSessionSummary = await res.json();
        setSessionSummary(sumData);
        setIsSessionCompleted(true);
      } else {
        throw new Error("Fallback summary");
      }
    } catch (e) {
      const answered = turns.filter((t) => t.evaluation);
      const avg = Math.round(
        answered.reduce((acc, t) => acc + (t.evaluation?.totalScore || 0), 0) / (answered.length || 1)
      );
      setSessionSummary({
        averageScore: avg,
        questionsAnswered: answered.length,
        demonstratedSkills: [
          "Posture professionnelle directe et claire",
          `Alignement avec la culture et les enjeux de ${comp}`,
          "Capacité à structurer une réponse concrète",
          "Respect de l'authenticité du parcours",
        ],
        personalizedImprovementPlan: [
          "Systématiser la structure STAR (Situation, Tâche, Actions prises, Résultat obtenu).",
          `Mentionner des exemples précis liés au périmètre de ${comp}.`,
          "Conclure chaque prise de parole par l'impact positif que vous apporterez.",
        ],
      });
      setIsSessionCompleted(true);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleRestart = () => {
    setTurns([]);
    setCurrentTurnNumber(1);
    setCurrentQuestion("");
    setLatestEvaluation(null);
    setIsSessionCompleted(false);
    setSessionSummary(null);
    loadNextQuestion(1);
  };

  // Helper to render criterion score bar
  const renderCriterionBar = (name: string, score: number, max: number = 5, feedback: string) => {
    const percent = Math.min(100, Math.max(0, (score / max) * 100));
    const color =
      score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-indigo-500" : score >= 2 ? "bg-amber-500" : "bg-rose-500";

    return (
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200">{name}</span>
          <span className="font-mono font-bold text-white">
            {score} / {max}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
        </div>
        <p className="text-[11px] text-slate-400 leading-tight pt-0.5">{feedback}</p>
      </div>
    );
  };

  if (!jobAnalysis) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Analyse de l'Offre Requise</h2>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Pour adapter les questions d'entretien de manière chirurgicale, veuillez d'abord renseigner l'offre à l'Étape 1.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-white">
                  Simulation d'Entretien Renforcée
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Grille 5 Critères / 25
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Préparez-vous en conditions réelles pour le poste de{" "}
                <span className="text-indigo-300 font-semibold">{postTitle}</span> chez{" "}
                <span className="text-indigo-300 font-semibold">{comp}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {turns.length > 0 && !isSessionCompleted && (
              <button
                type="button"
                onClick={handleFinishSession}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors flex items-center space-x-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Terminer & Bilan ({turns.length} rép.)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
              title="Recommencer la simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Methodology note */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>
              1 question à la fois • Alternance thématique • Débriefing immédiat • Accords masculins configurés
            </span>
          </div>
          <div className="text-indigo-300 font-medium font-mono">
            {turns.length} question{turns.length > 1 ? "s" : ""} répondue{turns.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* VOCAL MODE CONTROLS & AUDIO SETTINGS BAR */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-rose-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <Headphones className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Simulation en Mode 100% Vocal</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Audio & Micro Actifs</span>
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Le recruteur formule les questions à voix haute. Vous répondez au micro avec transcription et débriefing en direct.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              const next = !autoSpeakQuestion;
              setAutoSpeakQuestion(next);
              if (!next) stopSpeaking();
            }}
            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center space-x-2 transition-all ${
              autoSpeakQuestion
                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                : "bg-slate-950 text-slate-400 hover:text-white border-slate-800"
            }`}
            title="Active la lecture automatique de chaque question dès son affichage"
          >
            {autoSpeakQuestion ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span>Lecture auto : {autoSpeakQuestion ? "Activée" : "Désactivée"}</span>
          </button>

          {isSpeakingRecruiter && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="text-xs px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
              <span>Couper la voix</span>
            </button>
          )}
        </div>
      </div>

      {/* FINAL SYNTHESIS MODAL / VIEW */}
      {isSessionCompleted && sessionSummary && (
        <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bilan Personnalisé de Fin de Simulation</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                Synthèse de Performance pour {postTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Évaluation consolidée sur {sessionSummary.questionsAnswered} échange(s) chez {comp}.
              </p>
            </div>

            <div className="flex items-center space-x-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase">Moyenne Globale</div>
                <div className="text-xs text-emerald-400 font-semibold">Grille 5 critères</div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
                {sessionSummary.averageScore} <span className="text-xs font-normal text-slate-400">/ 25</span>
              </div>
            </div>
          </div>

          {/* Demonstrated Skills & Improvement Plan Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Demonstrated Skills */}
            <div className="bg-slate-950 p-5 rounded-xl border border-emerald-900/40 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                <ThumbsUp className="w-4 h-4 text-emerald-400" />
                <span>Points Forts & Compétences Démontrées :</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {sessionSummary.demonstratedSkills.map((skill, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Plan */}
            <div className="bg-slate-950 p-5 rounded-xl border border-amber-900/40 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Plan d'Amélioration Prioritaire Avant l'Entretien :</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {sessionSummary.personalizedImprovementPlan.map((plan, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-amber-400 font-bold">⚡</span>
                    <span>{plan}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleRestart}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Relancer une nouvelle session</span>
            </button>
            {onGoToDocuments && (
              <button
                type="button"
                onClick={onGoToDocuments}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Revenir aux Documents de Candidature</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE QUESTION PANEL (Only if session not completed) */}
      {!isSessionCompleted && (
        <div className="space-y-6">
          {/* Current Question Card */}
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Question #{currentTurnNumber}
                </span>
                <span className="text-slate-600">•</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                    categoryMeta[currentCategory]?.color || "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                  }`}
                >
                  {categoryMeta[currentCategory]?.label || currentCategory}
                </span>
              </div>
              
              {/* Recruiter Audio Action Button */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeakingRecruiter) {
                      stopSpeaking();
                    } else {
                      speakText(currentQuestion);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all border ${
                    isSpeakingRecruiter
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse shadow-md shadow-rose-500/10"
                      : "bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                  }`}
                  title="Écouter la question du recruteur lue à haute voix"
                >
                  {isSpeakingRecruiter ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      <span>Arrêter la voix</span>
                      <span className="flex items-center space-x-0.5 ml-1">
                        <span className="w-1 h-2 bg-rose-400 rounded-full animate-pulse" />
                        <span className="w-1 h-3.5 bg-rose-400 rounded-full animate-pulse" />
                        <span className="w-1 h-2.5 bg-rose-400 rounded-full animate-pulse" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Écouter la question</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="py-2">
              {isLoadingQuestion ? (
                <div className="flex items-center space-x-3 py-6 text-slate-400 text-sm">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Le recruteur prépare sa question sur-mesure...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-base sm:text-lg font-bold text-white leading-snug flex items-start space-x-3">
                    <span className="text-indigo-400 text-xl font-serif">“</span>
                    <span className="flex-1">{currentQuestion}</span>
                    <span className="text-indigo-400 text-xl font-serif">”</span>
                  </div>
                  {currentContext && (
                    <p className="text-xs text-indigo-300/80 bg-indigo-950/40 border border-indigo-800/30 px-3 py-1.5 rounded-lg">
                      💡 <strong>Objectif recruteur :</strong> {currentContext}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Candidate Answer Input with Voice Panel */}
            {!latestEvaluation && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                {/* Voice Recording Control Banner */}
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <Mic className={`w-4 h-4 ${isListeningCandidate ? "text-rose-400 animate-pulse" : "text-indigo-400"}`} />
                      <span className="text-xs font-bold text-white">
                        {isListeningCandidate ? (
                          <span className="text-rose-400 flex items-center space-x-2 font-mono">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                            <span>ENREGISTREMENT VOCAL EN DIRECT ({formatTimer(recordingSeconds)})</span>
                          </span>
                        ) : (
                          <span>Réponse au microphone ou au clavier :</span>
                        )}
                      </span>
                    </div>

                    {/* Microphone Record Actions */}
                    {!isListeningCandidate ? (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-indigo-600 to-indigo-500 hover:from-rose-500 hover:to-indigo-400 shadow-md shadow-rose-600/25 transition-all flex items-center justify-center space-x-2 w-full sm:w-auto"
                      >
                        <Mic className="w-4 h-4 text-white" />
                        <span>🎙️ Parler au micro (Démarrer)</span>
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={stopVoiceRecording}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center space-x-1.5"
                        >
                          <Square className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>Mettre en pause</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            stopVoiceRecording();
                            handleEvaluateAnswer();
                          }}
                          disabled={!answerInput.trim() || isEvaluating}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Terminer & Évaluer</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pulsing Voice Waves animation */}
                  {isListeningCandidate && (
                    <div className="bg-rose-950/30 border border-rose-500/40 p-3 rounded-xl flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-end space-x-1 h-6">
                          {[6, 12, 18, 24, 16, 10, 20, 14, 8].map((h, i) => (
                            <span
                              key={i}
                              className="w-1 bg-rose-400 rounded-full animate-pulse"
                              style={{
                                height: `${Math.max(4, (h + ((recordingSeconds * 7 + i * 3) % 15)))}px`,
                                animationDuration: "0.6s",
                                animationDelay: `${i * 80}ms`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-rose-200 font-medium">
                          Parlez naturellement dans votre microphone. Vos propos sont transcrits en temps réel ci-dessous...
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-300 shrink-0 ml-2">
                        {formatTimer(recordingSeconds)}
                      </span>
                    </div>
                  )}

                  {voiceNotice && (
                    <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-lg flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{voiceNotice}</span>
                    </div>
                  )}
                </div>

                {/* Textarea for Transcription & Editing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Transcription en direct / Vous pouvez modifier ou enrichir le texte :</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {answerInput.trim().split(/\s+/).filter(Boolean).length} mots
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Votre réponse s'écrira ici automatiquement lorsque vous parlerez au micro, ou vous pouvez la saisir directement..."
                    className={`w-full rounded-xl bg-slate-950 border p-3.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-hidden leading-relaxed font-sans transition-colors ${
                      isListeningCandidate ? "border-rose-500/60 ring-1 ring-rose-500/30" : "border-slate-700 focus:border-indigo-500"
                    }`}
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-slate-400">
                    💡 Conseil : structurez en STAR (Situation, Tâche, Actions, Résultat) pour maximiser votre score sur 25.
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={isEvaluating || !answerInput.trim()}
                      onClick={handleEvaluateAnswer}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isEvaluating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Évaluation sur la grille (5 critères)...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Soumettre ma réponse au jury</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LATEST EVALUATION FEEDBACK ACCORDION */}
          {latestEvaluation && (
            <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6 animate-in slide-in-from-bottom-3 duration-400">
              {/* Score header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Award className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">
                      Évaluation Détaillée de votre Réponse (Question #{currentTurnNumber})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Décomposition selon les 5 critères officiels de recrutement.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeakingRecruiter) {
                        stopSpeaking();
                      } else {
                        const feedbackSpeech = `Votre score est de ${latestEvaluation.totalScore} sur 25. Points forts : ${latestEvaluation.strengths.slice(0, 2).join(". ")}. ${latestEvaluation.concreteAdvice ? "Conseil clé : " + latestEvaluation.concreteAdvice : ""}`;
                        speakText(feedbackSpeech);
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
                      isSpeakingRecruiter
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                        : "bg-slate-950 hover:bg-slate-800 text-indigo-300 border-slate-800"
                    }`}
                    title="Écouter la synthèse de l'évaluation lue à voix haute"
                  >
                    {isSpeakingRecruiter ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        <span>Couper la voix</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Écouter le débriefing</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase">Note :</span>
                    <span
                      className={`text-xl font-black ${
                        latestEvaluation.totalScore >= 20
                          ? "text-emerald-400"
                          : latestEvaluation.totalScore >= 15
                          ? "text-indigo-400"
                          : latestEvaluation.totalScore >= 10
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {latestEvaluation.totalScore} / 25
                    </span>
                  </div>
                </div>
              </div>

              {/* 5 Criteria Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {renderCriterionBar(
                  "1. Pertinence",
                  latestEvaluation.criteria.relevance.score,
                  5,
                  latestEvaluation.criteria.relevance.feedback
                )}
                {renderCriterionBar(
                  "2. Clarté & Précision",
                  latestEvaluation.criteria.clarityAndPrecision.score,
                  5,
                  latestEvaluation.criteria.clarityAndPrecision.feedback
                )}
                {renderCriterionBar(
                  "3. Exemples Concrets",
                  latestEvaluation.criteria.concreteExamples.score,
                  5,
                  latestEvaluation.criteria.concreteExamples.feedback
                )}
                {renderCriterionBar(
                  "4. Adéquation Poste",
                  latestEvaluation.criteria.jobAlignment.score,
                  5,
                  latestEvaluation.criteria.jobAlignment.feedback
                )}
                {renderCriterionBar(
                  "5. Structure & Impact",
                  latestEvaluation.criteria.structureAndImpact.score,
                  5,
                  latestEvaluation.criteria.structureAndImpact.feedback
                )}
              </div>

              {/* Strengths & Improvement Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Points Forts Détectés :</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5">
                    {latestEvaluation.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-950/20 border border-amber-800/40 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Axes d'Amélioration Concrets :</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5">
                    {latestEvaluation.improvementAreas.map((ia, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-amber-400 font-bold">⚡</span>
                        <span>{ia}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Concrete Advice to Convince */}
              {latestEvaluation.concreteAdvice && (
                <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Conseil Spécifique pour Convaincre en Direct :</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {latestEvaluation.concreteAdvice}
                  </p>
                </div>
              )}

              {/* Suggested STAR Optimized Answer */}
              {latestEvaluation.suggestedAnswer && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Suggestion de Formulation Modèle (Méthode STAR) :</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    {latestEvaluation.suggestedAnswer}
                  </p>
                </div>
              )}

              {/* Next Question or Finish Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleFinishSession}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/60"
                >
                  Arrêter et voir le bilan final
                </button>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Passer à la Question Suivante (#{currentTurnNumber + 1})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PREVIOUS TURNS HISTORY */}
          {turns.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Historique des Échanges ({turns.length})</span>
                </h4>
              </div>

              <div className="space-y-3">
                {turns.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300">
                        Q{t.questionNumber} : {t.question}
                      </span>
                      {t.evaluation && (
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                          {t.evaluation.totalScore} / 25
                        </span>
                      )}
                    </div>
                    {t.candidateAnswer && (
                      <p className="text-slate-400 line-clamp-2 italic">
                        « {t.candidateAnswer} »
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
