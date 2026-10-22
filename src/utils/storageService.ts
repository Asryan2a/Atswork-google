/**
 * Local Storage Persistence Service for TURBO CANDIDATURE IA
 * Guarantees 100% privacy: data is stored solely in the user's browser localStorage.
 */

export interface SavedSessionData {
  version: number;
  lastUpdated: string;
  candidateName: string;
  targetSector: string;
  jobDescription: string;
  currentCv: string;
  originalCvText: string;
  jobAnalysis: any;
  optimizedCv: any;
  documents: any;
  cvVersions: any[];
  interviewTurns: any[];
  interviewSummary: any;
  relanceSettings: any;
}

const STORAGE_KEY = "turbo_candidature_session_v2";

export function saveSessionToStorage(data: Partial<SavedSessionData>): void {
  try {
    const existing = loadSessionFromStorage() || {
      version: 2,
      lastUpdated: new Date().toISOString(),
      candidateName: "Michel elbsat",
      targetSector: "Marketing Digital & Communication",
      jobDescription: "",
      currentCv: "",
      originalCvText: "",
      jobAnalysis: null,
      optimizedCv: null,
      documents: null,
      cvVersions: [],
      interviewTurns: [],
      interviewSummary: null,
      relanceSettings: {},
    };

    const merged: SavedSessionData = {
      ...existing,
      ...data,
      version: 2,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn("Storage quota exceeded or unavailable:", err);
  }
}

export function loadSessionFromStorage(): SavedSessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSessionData;
  } catch (err) {
    console.warn("Failed to load session from storage:", err);
    return null;
  }
}

export function clearSessionFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear session:", err);
  }
}

export function exportSessionAsJsonFile(): void {
  const session = loadSessionFromStorage();
  if (!session) {
    alert("Aucune session sauvegardée à exporter.");
    return;
  }

  const jsonStr = JSON.stringify(session, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `candidature_${session.candidateName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
