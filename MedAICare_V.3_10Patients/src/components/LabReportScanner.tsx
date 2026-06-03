// ============================================================================
// LAB REPORT SCANNER — v3.2.3
// Parser UNIVERSEL : accepte n'importe quel QR code
// 4 modes : Upload · Caméra · Saisie manuelle · Démo
// Formulaire assisté pour QR non-MediAI
// ============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera, Upload, X, CheckCircle2, AlertTriangle,
  Loader2, Download, ScanLine, Eye, RefreshCw, FileText,
  PlusCircle, Trash2, Edit3,
} from 'lucide-react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  parseQrPayload, saveLabReport, detectAnomalies, generateSampleQrString,
  buildPayloadFromExtracted, ALL_ANALYSES,
} from '../engine/labReportService';
import type { ParseResult } from '../engine/labReportService';
import type { LabReportPayload, LabReport, LabResult } from '../types/medical';

interface Props {
  patientId: string;
  patientName?: string;
  onClose: () => void;
  onSaved: (report: LabReport) => void;
}

type Step = 'choose' | 'camera' | 'processing' | 'preview' | 'saved' | 'manual' | 'assisted';

// Ligne de formulaire de saisie assistée
interface FormLine {
  id: string;
  code: string;
  label: string;
  value: string;
  unit: string;
}

export default function LabReportScanner({ patientId, patientName, onClose, onSaved }: Props) {
  const [step, setStep] = useState<Step>('choose');
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<LabReportPayload | null>(null);
  const [savedReport, setSavedReport] = useState<LabReport | null>(null);
  const [manualJson, setManualJson] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);

  // Formulaire de saisie assistée
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [formLines, setFormLines] = useState<FormLine[]>([]);
  const [formLabName, setFormLabName] = useState('');
  const [formDate, setFormDate] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // -- Nettoyage caméra --
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // -- Initialiser le formulaire assisté depuis un ParseResult --
  const initAssistedForm = useCallback((result: ParseResult) => {
    setParseResult(result);
    const lines: FormLine[] = [];

    if (result.extractedData) {
      // Pré-remplir avec les valeurs extraites du QR
      for (const v of result.extractedData.values) {
        if (v.suggestedCode) {
          lines.push({
            id: Math.random().toString(36).substr(2, 8),
            code: v.suggestedCode,
            label: v.label,
            value: String(v.value),
            unit: v.unit,
          });
        }
      }
      setFormLabName(result.extractedData.labName || '');
      setFormDate(result.extractedData.date || new Date().toISOString().split('T')[0]);
    } else {
      setFormLabName('');
      setFormDate(new Date().toISOString().split('T')[0]);
    }

    // Si aucune ligne extraite, proposer les champs vides les plus courants
    if (lines.length === 0) {
      const defaults = ['HBA1C', 'FASTING_GLUCOSE', 'TOTAL_CHOL', 'LDL', 'CREATININE'];
      for (const code of defaults) {
        const meta = ALL_ANALYSES.find(a => a.code === code);
        if (meta) {
          lines.push({
            id: Math.random().toString(36).substr(2, 8),
            code: meta.code, label: meta.label, value: '', unit: meta.unit,
          });
        }
      }
    }

    setFormLines(lines);
    setStep('assisted');
  }, []);

  // -- Traitement universel d'un QR décodé --
  const handleDecoded = useCallback((raw: string) => {
    stopCamera();
    setError(null);
    setStep('processing');

    setTimeout(() => {
      const result = parseQrPayload(raw);

      if (result.isNativeFormat && result.payload) {
        // Format MediAI natif → aperçu direct
        setPayload(result.payload);
        setStep('preview');
      } else {
        // Format externe → formulaire de saisie assistée
        initAssistedForm(result);
      }
    }, 600);
  }, [stopCamera, initAssistedForm]);

  // -- Ajouter une ligne au formulaire --
  const addFormLine = useCallback((code: string) => {
    const meta = ALL_ANALYSES.find(a => a.code === code);
    if (!meta) return;
    setFormLines(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 8),
      code: meta.code, label: meta.label, value: '', unit: meta.unit,
    }]);
  }, []);

  // -- Supprimer une ligne --
  const removeFormLine = useCallback((id: string) => {
    setFormLines(prev => prev.filter(l => l.id !== id));
  }, []);

  // -- Modifier une valeur --
  const updateFormValue = useCallback((id: string, value: string) => {
    setFormLines(prev => prev.map(l => l.id === id ? { ...l, value } : l));
  }, []);

  // -- Valider le formulaire assisté → créer le payload --
  const submitAssistedForm = useCallback(() => {
    const filledLines = formLines.filter(l => l.value.trim() !== '' && !isNaN(parseFloat(l.value)));
    if (filledLines.length === 0) {
      setError('Saisissez au moins une valeur d\'analyse.');
      return;
    }

    const manualResults: LabResult[] = filledLines.map(l => {
      const meta = ALL_ANALYSES.find(a => a.code === l.code);
      const defaults: Record<string, { refLow?: number; refHigh?: number }> = {
        HBA1C: { refHigh: 5.7 }, FASTING_GLUCOSE: { refLow: 70, refHigh: 100 },
        POSTPRANDIAL_GLUCOSE: { refLow: 70, refHigh: 140 },
        TOTAL_CHOL: { refHigh: 200 }, HDL: { refLow: 40 }, LDL: { refHigh: 130 },
        TRIGLYCERIDES: { refHigh: 150 }, CREATININE: { refLow: 0.6, refHigh: 1.2 },
        EGFR: { refLow: 90 }, MICROALBUMINURIA: { refHigh: 30 }, TSH: { refLow: 0.4, refHigh: 4.0 },
      };
      const ref = defaults[l.code] || {};
      const value = parseFloat(l.value);
      let flag: LabResult['flag'] = 'normal';
      if (ref.refLow && value < ref.refLow) flag = 'low';
      if (ref.refHigh && value > ref.refHigh) flag = 'high';

      return {
        code: l.code,
        label: meta?.label || l.label,
        value,
        unit: l.unit || meta?.unit || '',
        refRange: { low: ref.refLow, high: ref.refHigh },
        flag,
        category: meta?.category || 'other',
      } as LabResult;
    });

    let finalPayload: LabReportPayload;
    if (parseResult?.extractedData) {
      finalPayload = buildPayloadFromExtracted(parseResult.extractedData, manualResults);
    } else {
      finalPayload = {
        version: '1.0',
        reportId: 'MAN-' + Date.now().toString(36).toUpperCase(),
        laboratory: { name: formLabName || 'Laboratoire externe', accreditation: 'Non vérifié' },
        patient: {
          externalId: patientId,
          firstName: patientName?.split(' ')[0] || '',
          lastName: patientName?.split(' ').slice(1).join(' ') || '',
        },
        collectionDate: formDate || new Date().toISOString(),
        reportDate: new Date().toISOString(),
        results: manualResults,
      };
    }

    // Mettre à jour le nom du labo si saisi
    if (formLabName) finalPayload.laboratory.name = formLabName;
    if (formDate) finalPayload.collectionDate = formDate;

    setPayload(finalPayload);
    setStep('preview');
  }, [formLines, parseResult, formLabName, formDate, patientId, patientName]);

  // =============================================
  // MODE : GÉNÉRER QR EXEMPLE
  // =============================================
  const generateDownloadableQr = useCallback(async () => {
    setGeneratingQr(true);
    setError(null);
    try {
      const jsonStr = generateSampleQrString(patientName);
      const dataUrl = await QRCode.toDataURL(jsonStr, {
        width: 800, margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setQrImageUrl(dataUrl);
    } catch {
      setError('Erreur lors de la génération du QR code.');
    }
    setGeneratingQr(false);
  }, [patientName]);

  const downloadQr = useCallback(() => {
    if (!qrImageUrl) return;
    const a = document.createElement('a');
    a.href = qrImageUrl;
    a.download = `bilan-${patientName?.replace(/\s/g, '-') ?? 'patient'}-${Date.now()}.png`;
    a.click();
  }, [qrImageUrl, patientName]);

  // =============================================
  // MODE : UPLOAD IMAGE
  // =============================================
  const handleFile = useCallback((file: File) => {
    setError(null);
    setStep('processing');
    setScanAttempts(prev => prev + 1);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const sizes = [
        { w: img.width, h: img.height },
        { w: Math.min(img.width, 1200), h: Math.min(img.height, 1200) },
        { w: img.width * 2, h: img.height * 2 },
      ];

      for (const size of sizes) {
        const canvas = document.createElement('canvas');
        canvas.width = size.w;
        canvas.height = size.h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) continue;
        ctx.drawImage(img, 0, 0, size.w, size.h);
        const imageData = ctx.getImageData(0, 0, size.w, size.h);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (code && code.data) {
          URL.revokeObjectURL(url);
          handleDecoded(code.data);
          return;
        }
      }

      URL.revokeObjectURL(url);
      // QR non détecté dans l'image → proposer saisie assistée
      setError(
        'Aucun QR code détecté dans cette image.\n' +
        'Vous pouvez saisir les résultats manuellement.'
      );
      // Ouvrir directement le formulaire assisté avec des champs vides
      initAssistedForm({
        isNativeFormat: false,
        payload: null,
        extractedData: { values: [], rawFields: {} },
        rawText: '[image sans QR détecté]',
        detectedFormat: 'unknown',
        message: 'QR non détecté — saisie manuelle proposée.',
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Format d'image non supporté. Utilisez JPG, PNG ou WEBP.");
      setStep('choose');
    };

    img.src = url;
  }, [handleDecoded, initAssistedForm]);

  // =============================================
  // MODE : CAMÉRA EN DIRECT
  // =============================================
  const startCamera = useCallback(async () => {
    setError(null);
    setStep('camera');
    setScanAttempts(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (!videoRef.current) {
        setError("Erreur d'initialisation vidéo.");
        setStep('choose');
        return;
      }

      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      await videoRef.current.play();

      let frameCount = 0;

      const scan = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        frameCount++;
        if (frameCount % 3 !== 0) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { rafRef.current = requestAnimationFrame(scan); return; }
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code && code.data) {
          handleDecoded(code.data);
          return;
        }
        setScanAttempts(Math.floor(frameCount / 30));
        rafRef.current = requestAnimationFrame(scan);
      };

      rafRef.current = requestAnimationFrame(scan);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError("Accès caméra refusé. Autorisez dans les paramètres de votre navigateur.");
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError("Aucune caméra détectée. Utilisez l'import photo.");
      } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setError("La caméra nécessite HTTPS. Utilisez l'import photo.");
      } else {
        setError("Impossible d'accéder à la caméra. Utilisez l'import photo.");
      }
      setStep('choose');
    }
  }, [handleDecoded]);

  // -- Saisie manuelle JSON --
  const handleManualSubmit = useCallback(() => {
    if (!manualJson.trim()) {
      setError('Collez le contenu du QR code.');
      return;
    }
    handleDecoded(manualJson.trim());
  }, [manualJson, handleDecoded]);

  // -- Charger démo --
  const handleDemo = useCallback(() => {
    handleDecoded(generateSampleQrString(patientName));
  }, [handleDecoded, patientName]);

  // -- Confirmer enregistrement --
  const handleConfirm = useCallback(() => {
    if (!payload) return;
    const report = saveLabReport(patientId, payload, 'qr-scan');
    setSavedReport(report);
    setStep('saved');
    onSaved(report);
  }, [payload, patientId, onSaved]);

  // Analyses disponibles (non encore ajoutées au formulaire)
  const availableAnalyses = ALL_ANALYSES.filter(
    a => !formLines.some(l => l.code === a.code)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl bg-[#0F1729] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/15 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Scanner un bilan biologique</h2>
              <p className="text-[11px] text-white/45">
                {step === 'assisted'
                  ? 'Saisie assistée — complétez les résultats'
                  : 'Tout QR code accepté · 11 biomarqueurs diabète'}
              </p>
            </div>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* Erreur */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25">
              <div className="flex items-start gap-2 text-red-200 text-[13px]">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="whitespace-pre-line">{error}</div>
              </div>
              <button onClick={() => setError(null)} className="mt-2 text-[11px] text-red-300/70 hover:text-red-200 underline transition">
                Fermer
              </button>
            </div>
          )}

          {/* ── STEP: Choix du mode ── */}
          {step === 'choose' && (
            <div className="space-y-5">
              <div>
                <p className="text-[13px] text-white/60 mb-3">Choisissez un mode d'acquisition :</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Upload */}
                  <button onClick={() => fileRef.current?.click()} className="group p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-cyan-500/40 transition text-left">
                    <Upload className="w-7 h-7 text-cyan-300 mb-3 group-hover:scale-110 transition" />
                    <div className="text-[13px] font-medium text-white">Importer une photo</div>
                    <div className="text-[11px] text-white/40 mt-1">Photo du QR code</div>
                  </button>
                  {/* Caméra */}
                  <button onClick={startCamera} className="group p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-teal-500/40 transition text-left">
                    <Camera className="w-7 h-7 text-teal-300 mb-3 group-hover:scale-110 transition" />
                    <div className="text-[13px] font-medium text-white">Scanner en direct</div>
                    <div className="text-[11px] text-white/40 mt-1">Pointer la caméra</div>
                  </button>
                  {/* Saisie manuelle */}
                  <button onClick={() => { setStep('manual'); setError(null); }} className="group p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-violet-500/40 transition text-left">
                    <FileText className="w-7 h-7 text-violet-300 mb-3 group-hover:scale-110 transition" />
                    <div className="text-[13px] font-medium text-white">Saisie texte</div>
                    <div className="text-[11px] text-white/40 mt-1">Coller le contenu du QR</div>
                  </button>
                  {/* Saisie assistée directe */}
                  <button onClick={() => initAssistedForm({
                    isNativeFormat: false, payload: null,
                    extractedData: { values: [], rawFields: {} },
                    rawText: '', detectedFormat: 'unknown',
                    message: 'Saisie manuelle directe.',
                  })} className="group p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-500/40 transition text-left">
                    <Edit3 className="w-7 h-7 text-amber-300 mb-3 group-hover:scale-110 transition" />
                    <div className="text-[13px] font-medium text-white">Saisie des résultats</div>
                    <div className="text-[11px] text-white/40 mt-1">Remplir depuis le rapport papier</div>
                  </button>
                </div>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  if (e.target) e.target.value = '';
                }} />
              </div>

              {/* QR exemple */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-white/25 uppercase tracking-wider">ou testez</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/[0.06] to-teal-500/[0.06] border border-white/[0.08]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-white mb-1">QR code d'exemple MediAI</p>
                    <p className="text-[11px] text-white/45 leading-relaxed">
                      Générez un QR au format MediAI pour tester le pipeline complet.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {!qrImageUrl ? (
                        <button onClick={generateDownloadableQr} disabled={generatingQr} className="flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border border-violet-500/30 transition disabled:opacity-50">
                          {generatingQr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Générer le QR
                        </button>
                      ) : (
                        <>
                          <button onClick={downloadQr} className="flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/30 transition">
                            <Download className="w-3.5 h-3.5" /> Télécharger
                          </button>
                          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 transition">
                            <Upload className="w-3.5 h-3.5" /> Réimporter
                          </button>
                        </>
                      )}
                      <button onClick={handleDemo} className="flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-lg bg-white/5 hover:bg-white/10 text-white/50 border border-white/10 transition">
                        Charger directement
                      </button>
                    </div>
                  </div>
                  {qrImageUrl && (
                    <div className="shrink-0">
                      <img src={qrImageUrl} alt="QR Code" className="w-28 h-28 rounded-lg border border-white/10" />
                    </div>
                  )}
                </div>
              </div>

              {scanAttempts > 0 && (
                <p className="text-[11px] text-white/30 text-center">
                  {scanAttempts} tentative{scanAttempts > 1 ? 's' : ''} effectuée{scanAttempts > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* ── STEP: Saisie manuelle texte ── */}
          {step === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="text-[13px] text-white/60 block mb-2">
                  Collez le contenu du QR code (JSON, texte, URL…) :
                </label>
                <textarea
                  value={manualJson}
                  onChange={e => setManualJson(e.target.value)}
                  placeholder={'Accepte tout format :\n• JSON MediAI\n• JSON générique\n• URL avec paramètres\n• Texte clé: valeur\n• Tout autre contenu'}
                  className="w-full h-40 p-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 text-[12px] font-mono placeholder:text-white/20 focus:outline-none focus:border-teal-500/50 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setStep('choose'); setManualJson(''); setError(null); }} className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[13px] transition">
                  Retour
                </button>
                <button onClick={handleManualSubmit} className="flex-1 px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-medium text-[13px] transition">
                  Analyser
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Formulaire de saisie assistée ── */}
          {step === 'assisted' && (
            <div className="space-y-4">
              {/* Info format détecté */}
              {parseResult && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/25">
                  <div className="flex items-start gap-2">
                    <ScanLine className="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[12px] text-blue-200 font-medium">
                        {parseResult.detectedFormat === 'unknown'
                          ? 'Saisie manuelle des résultats'
                          : `Format détecté : ${parseResult.detectedFormat}`}
                      </p>
                      <p className="text-[11px] text-blue-200/60 mt-0.5">{parseResult.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Infos labo & date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-white/40 block mb-1">Laboratoire</label>
                  <input
                    value={formLabName}
                    onChange={e => setFormLabName(e.target.value)}
                    placeholder="Nom du laboratoire"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/90 text-[12px] placeholder:text-white/20 focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/40 block mb-1">Date du prélèvement</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/90 text-[12px] focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              {/* Tableau des résultats */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-white/40">Résultats d'analyses</label>
                  <span className="text-[10px] text-white/25">{formLines.filter(l => l.value.trim()).length}/{formLines.length} rempli(s)</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {formLines.map(line => (
                    <div key={line.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-white/80 truncate">{line.label}</p>
                        <p className="text-[10px] text-white/30">{line.code}</p>
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={line.value}
                        onChange={e => updateFormValue(line.id, e.target.value)}
                        placeholder="—"
                        className="w-24 px-2 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white/90 text-[13px] text-center tabular-nums focus:outline-none focus:border-teal-500/50"
                      />
                      <span className="text-[11px] text-white/40 w-16 text-right">{line.unit}</span>
                      <button
                        onClick={() => removeFormLine(line.id)}
                        className="w-7 h-7 rounded flex items-center justify-center text-white/20 hover:text-red-300 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Ajouter une analyse */}
                {availableAnalyses.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PlusCircle className="w-3.5 h-3.5 text-white/30" />
                      <span className="text-[11px] text-white/30">Ajouter :</span>
                      {availableAnalyses.map(a => (
                        <button
                          key={a.code}
                          onClick={() => addFormLine(a.code)}
                          className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/80 border border-white/[0.06] transition"
                        >
                          + {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Données brutes (collapsible) */}
              {parseResult?.rawText && parseResult.rawText !== '[image sans QR détecté]' && (
                <details className="group">
                  <summary className="text-[11px] text-white/30 cursor-pointer hover:text-white/50 transition">
                    Voir les données brutes du QR
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/40 font-mono overflow-x-auto max-h-32 overflow-y-auto">
                    {parseResult.rawText}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setStep('choose'); setFormLines([]); setParseResult(null); setError(null); }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[13px] transition"
                >
                  Retour
                </button>
                <button
                  onClick={submitAssistedForm}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-medium text-[13px] transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Valider les résultats
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Caméra ── */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-[4/3]">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-teal-400/60 rounded-2xl relative">
                    <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-teal-300 rounded-tl-lg" />
                    <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-teal-300 rounded-tr-lg" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-teal-300 rounded-bl-lg" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-teal-300 rounded-br-lg" />
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse top-1/2" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-[11px] text-white/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Recherche du QR code… ({scanAttempts}s)
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { stopCamera(); setStep('choose'); }} className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[13px] transition">
                  Retour
                </button>
                <button onClick={() => { stopCamera(); fileRef.current?.click(); }} className="flex-1 px-4 py-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-[13px] border border-cyan-500/25 transition">
                  <Upload className="w-3.5 h-3.5 inline mr-1.5" /> Importer une photo
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                if (e.target) e.target.value = '';
              }} />
            </div>
          )}

          {/* ── STEP: Processing ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-teal-300 animate-spin mb-3" />
              <p className="text-[13px] text-white/60">Analyse en cours…</p>
              <p className="text-[10px] text-white/30 mt-1">Décodage · Détection du format · Extraction</p>
            </div>
          )}

          {/* ── STEP: Aperçu ── */}
          {step === 'preview' && payload && (() => {
            const normalCount = payload.results.filter(r => (r.flag ?? 'normal') === 'normal').length;
            const abnormalCount = payload.results.length - normalCount;
            const anomalies = detectAnomalies(payload);

            return (
              <div className="space-y-4">
                {/* Labo */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[14px] font-medium text-white">{payload.laboratory.name}</p>
                      {payload.laboratory.accreditation && (
                        <p className="text-[11px] text-white/45">{payload.laboratory.accreditation}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/40 uppercase">Rapport</p>
                      <p className="text-[11px] text-white/70 font-mono">{payload.reportId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div>
                      <p className="text-white/40">Patient</p>
                      <p className="text-white/80">{payload.patient.firstName} {payload.patient.lastName}</p>
                    </div>
                    <div>
                      <p className="text-white/40">Prélèvement</p>
                      <p className="text-white/80">{new Date(payload.collectionDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>

                {/* Compteurs */}
                <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[20px] font-bold text-emerald-300">{normalCount}</p>
                    <p className="text-emerald-200/60">Normaux</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[20px] font-bold text-amber-300">{abnormalCount}</p>
                    <p className="text-amber-200/60">Hors normes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[20px] font-bold text-blue-300">{payload.results.length}</p>
                    <p className="text-blue-200/60">Total</p>
                  </div>
                </div>

                {/* Anomalies */}
                {anomalies.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
                    <p className="text-[12px] font-semibold text-red-200 mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Anomalies
                    </p>
                    <ul className="space-y-0.5 text-[11px] text-red-100/80">
                      {anomalies.map((a, i) => <li key={i}>• {a}</li>)}
                    </ul>
                  </div>
                )}

                {/* Résultats */}
                <div className="max-h-56 overflow-y-auto rounded-xl border border-white/[0.08] divide-y divide-white/[0.04]">
                  {payload.results.map(r => (
                    <div key={r.code} className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-white/85 truncate">{r.label}</p>
                        <p className="text-[10px] text-white/35">Réf : {r.refRange.low ?? '—'} – {r.refRange.high ?? '—'} {r.unit}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[13px] font-medium text-white tabular-nums">{r.value} {r.unit}</span>
                        <FlagBadge flag={r.flag} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setPayload(null); setStep('choose'); }} className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[13px] transition">
                    Annuler
                  </button>
                  <button onClick={handleConfirm} className="flex-1 px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-medium text-[13px] transition flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Enregistrer dans mon dossier
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ── STEP: Succès ── */}
          {step === 'saved' && savedReport && (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-300" />
              </div>
              <h3 className="text-[16px] font-semibold text-white mb-1">Bilan enregistré avec succès</h3>
              <p className="text-[13px] text-white/55 mb-5 max-w-sm mx-auto">
                Les résultats ont été ajoutés à votre dossier et seront intégrés dans vos prochaines prédictions.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 mb-6">
                <Eye className="w-3 h-3" /> Trace : <code className="text-teal-300">{savedReport.traceId}</code>
              </div>
              <div>
                <button onClick={onClose} className="px-8 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-medium text-[13px] transition">
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FlagBadge({ flag }: { flag?: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    'critical-low':  { label: 'Critique ↓', cls: 'text-red-200 bg-red-500/15 border-red-500/30' },
    'critical-high': { label: 'Critique ↑', cls: 'text-red-200 bg-red-500/15 border-red-500/30' },
    'low':           { label: 'Bas',        cls: 'text-amber-200 bg-amber-500/15 border-amber-500/30' },
    'high':          { label: 'Élevé',      cls: 'text-amber-200 bg-amber-500/15 border-amber-500/30' },
    'normal':        { label: 'Normal',     cls: 'text-emerald-200 bg-emerald-500/15 border-emerald-500/30' },
  };
  const c = config[flag ?? 'normal'] ?? config.normal;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.cls}`}>{c.label}</span>;
}
