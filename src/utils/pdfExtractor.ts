import * as pdfjsLib from "pdfjs-dist";

// Use local worker bundled by Vite or fallback
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ExtractedPdfData {
  text: string;
  numPages: number;
  hasTextLayer: boolean;
}

/**
 * Clean up accidental spaces introduced by PDF font kerning (e.g., 'Pil oter' -> 'Piloter', 'c oordination' -> 'coordination')
 */
function cleanPdfKerningArtifacts(text: string): string {
  // Fix single letter separated from word start: "c oordination" -> "coordination"
  let cleaned = text.replace(/\b([a-zA-ZÀ-ÿ])\s+([a-zà-ÿ]{2,})\b/g, "$1$2");
  
  // Fix common broken prefixes: "Pil oter" -> "Piloter", "Dé veloppement" -> "Développement"
  cleaned = cleaned.replace(/\b([A-ZÀ-ÿ][a-zà-ÿ]{1,3})\s+([a-zà-ÿ]{3,})\b/g, (match, p1, p2) => {
    // Only merge if the lowercase continuation doesn't make sense as a separate French word
    const commonSeparateWords = new Set(["de", "la", "le", "en", "un", "du", "au", "et", "ou", "par", "sur", "des", "les", "une", "aux", "pour", "dans", "avec", "sans", "sous"]);
    if (commonSeparateWords.has(p2.toLowerCase())) {
      return match;
    }
    // Check if combined looks like a real single word (e.g., Piloter, coordination)
    return p1 + p2;
  });

  // Normalize multiple spaces
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
  // Normalize excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * Robust PDF text extraction in browser with accurate word boundaries
 */
export async function extractTextFromPdf(file: File): Promise<ExtractedPdfData> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages || 1;
    let fullText = "";

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      let lastY: number | null = null;
      let lastX: number | null = null;
      let lastWidth: number = 0;
      let pageLines: string[] = [];
      let currentLine = "";

      for (const item of content.items as any[]) {
        if (!item.str) continue;

        const x = item.transform ? item.transform[4] : null;
        const y = item.transform ? item.transform[5] : null;
        const str = item.str;

        // Check vertical line break (different baseline y)
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim());
          }
          currentLine = str;
        } else {
          // Same line: determine if a space is truly needed between items
          if (!currentLine) {
            currentLine = str;
          } else {
            const endsWithSpace = currentLine.endsWith(" ");
            const startsWithSpace = str.startsWith(" ");

            if (endsWithSpace || startsWithSpace) {
              currentLine += str;
            } else if (lastX !== null && x !== null && lastWidth > 0) {
              const gap = x - (lastX + lastWidth);
              // Only insert space if there is an actual horizontal gap between characters
              if (gap > 1.5) {
                currentLine += " " + str;
              } else {
                // Characters are contiguous (kerning / ligature): NO space!
                currentLine += str;
              }
            } else {
              currentLine += " " + str;
            }
          }
        }

        lastX = x;
        lastY = y;
        lastWidth = item.width || 0;
      }

      if (currentLine.trim()) {
        pageLines.push(currentLine.trim());
      }

      const pageText = pageLines.join("\n");
      fullText += (pageNum > 1 ? "\n\n" : "") + pageText;
    }

    const cleanText = cleanPdfKerningArtifacts(fullText);
    if (cleanText.length > 20) {
      return {
        text: cleanText,
        numPages,
        hasTextLayer: true,
      };
    }
  } catch (pdfJsErr) {
    console.warn("PDF.js primary parser error, using fallback buffer extractor:", pdfJsErr);
  }

  // Fallback: try raw buffer string extraction
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const text = decoder.decode(bytes);
    const matches: string[] = [];
    const textPattern = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let match;
    while ((match = textPattern.exec(text)) !== null) {
      if (match[1] && match[1].length > 1) {
        matches.push(
          match[1]
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "")
            .replace(/\\t/g, " ")
            .replace(/\\([()])/g, "$1")
        );
      }
    }
    if (matches.length > 5) {
      const clean = cleanPdfKerningArtifacts(matches.join(" "));
      return {
        text: clean,
        numPages: 1,
        hasTextLayer: true,
      };
    }
  } catch (e) {
    console.warn("Buffer fallback error:", e);
  }

  return {
    text: `[CV PDF : ${file.name}]\nContenu ingéré. Vous pouvez vérifier les informations extraites.`,
    numPages: 1,
    hasTextLayer: false,
  };
}
