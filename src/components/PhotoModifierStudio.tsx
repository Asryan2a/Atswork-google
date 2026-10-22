import React, { useState, useRef } from "react";
import {
  Camera,
  UploadCloud,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  UserCheck,
  ShieldCheck,
  Image as ImageIcon,
  CheckCircle2,
  X,
} from "lucide-react";
import { ImagenPromptData } from "../types/index.ts";

interface PhotoModifierStudioProps {
  imagenPrompt?: ImagenPromptData;
  targetJobTitle?: string;
  onModifyPhoto?: (photoBase64: string, instruction?: string) => Promise<string>;
}

export const PhotoModifierStudio: React.FC<PhotoModifierStudioProps> = ({
  imagenPrompt,
  targetJobTitle = "Poste Visé",
  onModifyPhoto,
}) => {
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [modifiedPhoto, setModifiedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);
  const [hasCopiedImage, setHasCopiedImage] = useState(false);

  // Settings
  const [selectedSector, setSelectedSector] = useState(imagenPrompt?.sector || "Marketing & Communication");
  const [selectedBackdrop, setSelectedBackdrop] = useState("bureau_moderne");
  const [selectedLighting, setSelectedLighting] = useState("studio_doux");
  const [selectedDressCode, setSelectedDressCode] = useState(imagenPrompt?.recommendedDressCode || "Business casual élégant");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Veuillez sélectionner un fichier image valide (JPG, PNG ou WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setOriginalPhoto(dataUrl);
      setErrorMessage(null);
      // Generate instant local studio preview via canvas
      generateLocalStudioPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Generates an instant high-quality local studio enhancement using Canvas
   * (Immediate result, zero wait time)
   */
  const generateLocalStudioPreview = (imgSrc: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Center crop square
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      // Draw backdrop gradient
      const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 80, size / 2, size / 2, size);
      if (selectedBackdrop === "studio_neutre") {
        bgGrad.addColorStop(0, "#2c3444");
        bgGrad.addColorStop(1, "#141722");
      } else if (selectedBackdrop === "lumineux") {
        bgGrad.addColorStop(0, "#3a455a");
        bgGrad.addColorStop(1, "#1e2433");
      } else {
        bgGrad.addColorStop(0, "#1f2a44");
        bgGrad.addColorStop(1, "#0d1321");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // Save context for clipping circular portrait
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.46, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw image
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      // Studio light overlay
      const lightGrad = ctx.createRadialGradient(size * 0.35, size * 0.3, 30, size / 2, size / 2, size * 0.5);
      lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
      lightGrad.addColorStop(0.6, "rgba(255, 255, 255, 0)");
      lightGrad.addColorStop(1, "rgba(0, 0, 0, 0.2)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, size, size);

      ctx.restore();

      // Border ring
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.46, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
      ctx.stroke();

      const previewDataUrl = canvas.toDataURL("image/png");
      setModifiedPhoto(previewDataUrl);
    };
    img.src = imgSrc;
  };

  const handleLaunchAiTransformation = async () => {
    if (!originalPhoto) {
      setErrorMessage("Veuillez d'abord téléverser votre photo.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const backdropLabel =
      selectedBackdrop === "studio_neutre"
        ? "fond studio gris neutre épuré"
        : selectedBackdrop === "lumineux"
        ? "fond loft lumineux avec léger flou"
        : "fond bureau moderne flouté avec bokeh";

    const promptText = `Retouche ce portrait de candidat pour le poste de ${targetJobTitle} dans le secteur ${selectedSector}. Éclairage ${selectedLighting}, ${backdropLabel}, tenue ${selectedDressCode}. Rendu réaliste haute définition sans altérer les traits du visage.`;

    try {
      if (onModifyPhoto) {
        const resultUrl = await onModifyPhoto(originalPhoto, promptText);
        if (resultUrl) {
          setModifiedPhoto(resultUrl);
        }
      } else {
        // Fallback local enhancement with updated settings
        generateLocalStudioPreview(originalPhoto);
      }
    } catch (err: any) {
      // In case of remote API limit, keep the local enhanced preview and advise user
      console.warn("Notice photo generation:", err);
      generateLocalStudioPreview(originalPhoto);
      setErrorMessage(
        "Aperçu studio optimisé généré localement. Vous pouvez également copier le prompt Imagen 4.0 ci-dessous pour l'utiliser dans Google Gemini ou Imagen."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!modifiedPhoto) return;
    const link = document.createElement("a");
    link.href = modifiedPhoto;
    link.download = `portrait-pro-${targetJobTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = () => {
    const prompt =
      imagenPrompt?.promptEn ||
      `Professional corporate studio headshot of a candidate for ${targetJobTitle}, ${selectedSector} sector, ${selectedDressCode}, clean studio lighting, 85mm lens, soft modern bokeh background, photorealistic 8k`;
    navigator.clipboard.writeText(prompt);
    setHasCopiedPrompt(true);
    setTimeout(() => setHasCopiedPrompt(false), 2500);
  };

  return (
    <div className="rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <Camera className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white">
                Studio Portrait Professionnel & Retouche Photo IA
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                Nouveau
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Téléversez directement votre photo pour l'adapter aux codes visuels de votre poste ({targetJobTitle})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Fidélité des traits respectée</span>
        </div>
      </div>

      {/* Main Grid: Upload & Controls / Side by Side Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Upload Drop Zone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Téléversez votre photo (JPG, PNG, WebP)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {!originalPhoto ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-950/60 hover:bg-indigo-950/20 flex flex-col items-center justify-center space-y-2 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="text-sm font-semibold text-white">
                  Cliquez ou glissez-déposez votre photo ici
                </div>
                <div className="text-xs text-slate-400">
                  Photo actuelle (smartphone, selfie propre ou ancien portrait)
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={originalPhoto}
                    alt="Photo d'origine"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Photo originale chargée</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Prête pour la retouche professionnelle
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  Changer de photo
                </button>
              </div>
            )}
          </div>

          {/* Adaptation Parameters */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>2. Paramètres de style adaptés au secteur</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Sector */}
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Secteur cible :</label>
                <select
                  value={selectedSector}
                  onChange={(e) => {
                    setSelectedSector(e.target.value);
                    if (originalPhoto) generateLocalStudioPreview(originalPhoto);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500"
                >
                  <option value="Marketing & Communication">Marketing & Communication</option>
                  <option value="Tech, SaaS & Digital">Tech, SaaS & Digital</option>
                  <option value="Finance & Direction">Finance & Direction</option>
                  <option value="Luxe & Mode">Luxe & Création</option>
                  <option value="Conseil & Stratégie">Conseil & Stratégie</option>
                </select>
              </div>

              {/* Backdrop */}
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Arrière-plan :</label>
                <select
                  value={selectedBackdrop}
                  onChange={(e) => {
                    setSelectedBackdrop(e.target.value);
                    if (originalPhoto) generateLocalStudioPreview(originalPhoto);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500"
                >
                  <option value="bureau_moderne">Bureau moderne flouté (Bokeh)</option>
                  <option value="studio_neutre">Studio uni sobre & élégant</option>
                  <option value="lumineux">Loft lumineux contemporain</option>
                </select>
              </div>

              {/* Lighting */}
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Éclairage :</label>
                <select
                  value={selectedLighting}
                  onChange={(e) => {
                    setSelectedLighting(e.target.value);
                    if (originalPhoto) generateLocalStudioPreview(originalPhoto);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500"
                >
                  <option value="studio_doux">Studio 3 points doux</option>
                  <option value="lumiere_naturelle">Lumière naturelle cinéma</option>
                  <option value="contraste_net">Corporate contrasté et net</option>
                </select>
              </div>

              {/* Dress Code */}
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Tenue vestimentaire :</label>
                <select
                  value={selectedDressCode}
                  onChange={(e) => {
                    setSelectedDressCode(e.target.value);
                    if (originalPhoto) generateLocalStudioPreview(originalPhoto);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500"
                >
                  <option value="Business casual élégant">Business casual élégant</option>
                  <option value="Blazer / Veste sobre">Blazer / Veste sobre</option>
                  <option value="Chemise col ouvert soignée">Chemise col ouvert soignée</option>
                  <option value="Costume corporate classique">Costume corporate classique</option>
                </select>
              </div>
            </div>

            {/* Launch button */}
            <button
              type="button"
              onClick={handleLaunchAiTransformation}
              disabled={isProcessing || !originalPhoto}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Retouche professionnelle IA en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Générer mon portrait professionnel adapté</span>
                </>
              )}
            </button>

            {errorMessage && (
              <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/40 p-3 rounded-xl">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Side-by-Side Visual Result (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Aperçu Studio Avant / Après</span>
              {modifiedPhoto && (
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Prêt pour CV & LinkedIn</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 py-3">
              {/* Original small preview */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center overflow-hidden mx-auto shadow-inner">
                  {originalPhoto ? (
                    <img src={originalPhoto} alt="Original" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Originale</span>
              </div>

              <div className="text-slate-500 font-bold">→</div>

              {/* Modified Studio Result */}
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-slate-900 border-4 border-indigo-500/70 flex items-center justify-center overflow-hidden mx-auto shadow-xl shadow-indigo-500/10 relative group">
                  {modifiedPhoto ? (
                    <img
                      src={modifiedPhoto}
                      alt="Portrait retouché"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="p-3 text-center text-slate-500 text-xs">
                      En attente de photo
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-indigo-300 mt-1.5 block">
                  Portrait Professionnel
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons below result */}
          {modifiedPhoto && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger le Portrait HD (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center space-x-1.5 border border-slate-800 transition-colors"
              >
                {hasCopiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Prompt Imagen 4.0 copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copier le prompt Imagen 4.0</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
