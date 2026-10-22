import type { IncomingMessage, ServerResponse } from "node:http";
import {
  analyzeJobAndProfile,
  optimizeCvForAts,
  generateApplicationDocuments,
  generatePortraitPreview,
  modifyUserPhoto,
  parseCvPdf,
  diagnoseCvAts,
  generateInterviewQuestion,
  evaluateInterviewAnswer,
  generateInterviewSummary,
} from "./geminiService.ts";

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export async function handleApiRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<boolean> {
  if (!pathname.startsWith("/api/")) {
    return false;
  }

  // Handle CORS & Preflight if needed
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }

  try {
    if (pathname === "/api/parse-cv-pdf" && req.method === "POST") {
      const body = await readJsonBody<{
        extractedText?: string;
        pdfBase64?: string;
        filename?: string;
      }>(req);

      const filename = body.filename || "cv.pdf";

      // Preferred: Fast and bulletproof diagnosis from client-extracted text
      if (body.extractedText && body.extractedText.trim().length > 0) {
        const result = await diagnoseCvAts(body.extractedText, filename);
        sendJson(res, 200, result);
        return true;
      }

      // Secondary: Raw Base64 PDF parsing via Gemini Multimodal
      if (body.pdfBase64) {
        const cleanedBase64 = body.pdfBase64.replace(/^data:[^;]+;base64,/, "").trim();
        const result = await parseCvPdf(cleanedBase64, filename);
        sendJson(res, 200, result);
        return true;
      }

      sendJson(res, 400, { error: "Texte ou fichier PDF manquant." });
      return true;
    }

    if (pathname === "/api/analyze-job" && req.method === "POST") {
      const body = await readJsonBody<{
        jobDescription: string;
        currentCv: string;
        extraNotes?: string;
      }>(req);

      if (!body.jobDescription) {
        sendJson(res, 400, { error: "Veuillez fournir la description de l'offre d'emploi." });
        return true;
      }

      const result = await analyzeJobAndProfile(body.jobDescription, body.currentCv, body.extraNotes);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === "/api/optimize-cv" && req.method === "POST") {
      const body = await readJsonBody<{
        currentCv: string;
        jobAnalysis: any;
        targetSector?: string;
      }>(req);

      if (!body.currentCv) {
        sendJson(res, 400, { error: "Veuillez renseigner votre CV actuel pour l'optimisation." });
        return true;
      }

      const result = await optimizeCvForAts(body.currentCv, body.jobAnalysis, body.targetSector);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === "/api/generate-documents" && req.method === "POST") {
      const body = await readJsonBody<{
        jobAnalysis: any;
        optimizedCv: any;
        candidateName: string;
        extraToneInstructions?: string;
      }>(req);

      if (!body.optimizedCv || !body.jobAnalysis) {
        sendJson(res, 400, { error: "Analyse et CV optimisé requis pour générer les documents." });
        return true;
      }

      const result = await generateApplicationDocuments(
        body.jobAnalysis,
        body.optimizedCv,
        body.candidateName,
        body.extraToneInstructions
      );
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === "/api/generate-portrait" && req.method === "POST") {
      const body = await readJsonBody<{ promptEn: string }>(req);
      if (!body.promptEn) {
        sendJson(res, 400, { error: "Prompt requis." });
        return true;
      }
      try {
        const imageUrl = await generatePortraitPreview(body.promptEn);
        sendJson(res, 200, { imageUrl });
      } catch (err: any) {
        sendJson(res, 500, {
          error: "Impossible de générer l'image en direct (nécessite un compte payant pour Nano Banana / Image Flash). Utilisez le prompt Imagen 4.0 généré dans votre outil favori !",
          detail: err?.message,
        });
      }
      return true;
    }

    if (pathname === "/api/modify-user-photo" && req.method === "POST") {
      const body = await readJsonBody<{
        photoBase64: string;
        mimeType?: string;
        promptInstruction?: string;
        targetSector?: string;
        jobTitle?: string;
      }>(req);

      if (!body.photoBase64) {
        sendJson(res, 400, { error: "Photo requise pour la retouche." });
        return true;
      }

      try {
        const instruction =
          body.promptInstruction ||
          `Retouche ce portrait pour une candidature au poste de ${body.jobTitle || "professionnel"} dans le secteur ${body.targetSector || "corporate"}. Éclairage studio 3 points doux, arrière-plan élégant avec bokeh flouté, tenue professionnelle soignée et photoréaliste.`;

        const imageUrl = await modifyUserPhoto(
          body.photoBase64,
          body.mimeType || "image/jpeg",
          instruction
        );
        sendJson(res, 200, { imageUrl });
      } catch (err: any) {
        sendJson(res, 500, {
          error: "La transformation d'image nécessite un compte payant ou un modèle actif. Nous fournissons le recadrage studio direct et le prompt Imagen 4.0 complet !",
          detail: err?.message,
        });
      }
      return true;
    }

    // 7. SIMULATION D'ENTRETIEN API
    if (pathname === "/api/interview/next-question" && req.method === "POST") {
      const body = await readJsonBody<{
        jobAnalysis: any;
        currentCv: string;
        turnNumber: number;
        previousTurns?: Array<{ question: string; answer?: string }>;
      }>(req);

      if (!body.jobAnalysis) {
        sendJson(res, 400, { error: "Analyse de l'offre requise." });
        return true;
      }

      const result = await generateInterviewQuestion(
        body.jobAnalysis,
        body.currentCv || "",
        body.turnNumber || 1,
        body.previousTurns || []
      );
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === "/api/interview/evaluate" && req.method === "POST") {
      const body = await readJsonBody<{
        jobAnalysis: any;
        currentCv: string;
        question: string;
        candidateAnswer: string;
        category?: string;
      }>(req);

      if (!body.candidateAnswer || !body.question) {
        sendJson(res, 400, { error: "Question et réponse du candidat requises." });
        return true;
      }

      const result = await evaluateInterviewAnswer(
        body.jobAnalysis,
        body.currentCv || "",
        body.question,
        body.candidateAnswer,
        body.category || "métier"
      );
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === "/api/interview/summary" && req.method === "POST") {
      const body = await readJsonBody<{
        jobAnalysis: any;
        turns: Array<{ question: string; candidateAnswer?: string; evaluation?: any }>;
      }>(req);

      if (!body.turns || body.turns.length === 0) {
        sendJson(res, 400, { error: "Échanges d'entretien requis pour la synthèse." });
        return true;
      }

      const result = await generateInterviewSummary(body.jobAnalysis, body.turns);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === "/api/fetch-job-url" && req.method === "POST") {
      const body = await readJsonBody<{ url: string }>(req);
      if (!body.url || !/^https?:\/\//i.test(body.url.trim())) {
        sendJson(res, 400, { error: "Veuillez fournir une URL d'offre d'emploi valide débutant par http:// ou https://." });
        return true;
      }

      try {
        const response = await fetch(body.url.trim(), {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          sendJson(res, 200, {
            success: false,
            error: `Le site de l'offre a répondu avec le statut ${response.status}. Vous pouvez copier-coller le texte de l'offre directement ci-dessous.`,
          });
          return true;
        }

        const html = await response.text();
        let cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
          .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
          .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ");

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1].trim() : "";

        cleanText = cleanText
          .replace(/<(?:br|p|div|li|h[1-6]|tr)[^>]*>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");

        const lines = cleanText
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        const relevantLines = lines.filter((l) => {
          const low = l.toLowerCase();
          return (
            !low.includes("cookies") &&
            !low.includes("politique de confidentialité") &&
            !low.includes("tous droits réservés") &&
            !low.includes("conditions générales") &&
            !low.includes("javascript est désactivé")
          );
        });

        const extracted = relevantLines.slice(0, 150).join("\n");

        if (extracted.length < 80) {
          sendJson(res, 200, {
            success: false,
            error: "Le contenu textuel de cette page est protégé ou restreint. Veuillez copier-coller le texte de l'annonce directement ci-dessous.",
          });
          return true;
        }

        sendJson(res, 200, {
          success: true,
          extractedText: extracted,
          pageTitle,
        });
        return true;
      } catch (fetchErr: any) {
        sendJson(res, 200, {
          success: false,
          error: "Impossible d'accéder automatiquement à ce lien. Vous pouvez copier-coller le texte de l'offre directement ci-dessous.",
        });
        return true;
      }
    }

    // Health check
    if (pathname === "/api/health") {
      sendJson(res, 200, { status: "ok", timestamp: new Date().toISOString() });
      return true;
    }

    return false;
  } catch (error: any) {
    console.error("API error at", pathname, error);
    sendJson(res, 500, {
      error: error?.message || "Une erreur interne s'est produite lors du traitement IA.",
    });
    return true;
  }
}
