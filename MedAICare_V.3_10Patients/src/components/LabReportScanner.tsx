// ============================================================================
// LAB REPORT SCANNER v4.0.0 — MediAI Care · Thème Naturel
// Parser UNIVERSEL : 4 modes — Upload · Caméra · Saisie manuelle · Démo
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
import { cn } from '../utils/cn';

interface Props {
  patientId: string;
  patientName?: string;
  onClose: () => void;
  onSaved: (report: LabReport) => void;
}

type Step = 'choose' | 'camera' | 'processing' | 'preview' | 'saved' | 'manual' | 'assisted';

interface FormLine {
  id: string;
  code: string;
  label: string;
  value: string;
  unit: string;
}

const INPUT_CLS = 'w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[12.5px] placeholder:text-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition';
const LABEL_CLS = 'text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1';

export default function LabReportScanner({ patientId, patientName, onClose, onSaved }: Props) {
  const [step, setStep]               = useState<Step>('choose');
  const [error, setError]             = useState<string | null>(null);
  const [payload, setPayload]         = useState<LabReportPayload | null>(null);
  const [savedReport, setSavedReport] = useState<LabReport | null>(null);
  const [manualJson, setManualJson]   = useState('');
  const [qrImageUrl, setQrImageUrl]   = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);

  const [parseResult, setParseResult]   = useState<ParseResult | null>(null);
  const [formLines, setFormLines]       = useState<FormLine[]>([]);
  const [formLabName, setFormLabName]   = useState('');
  const [formDate, setFormDate]         = useState('');

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);
  const fileRef   = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const initAssistedForm = useCallback((result: ParseResult) => {
    setParseResult(result);
    const lines: FormLine[] = [];

    if (result.extractedData) {
      for (const v of result.extractedData.values) {
        if (v.suggestedCode) {
          lines.push({ id: Math.random().toString(36).substr(2, 8), code: v.suggestedCode, label: v.label, value: String(v.value), unit: v.unit });
        }
      }
      setFormLabName(result.extractedData.labName || '');
      setFormDate(result.extractedData.date || new Date().toISOString().split('T')[0]);
    } else {
      setFormLabName('');
      setFormDate(new Date().toISOString().split('T')[0]);
    }

    if (lines.length === 0) {
      const defaults = ['HBA1C', 'FASTING_GLUCOSE', 'TOTAL_CHOL', 'LDL', 'CREATININE'];
      for (const code of defaults) {
        const meta = ALL_ANALYSES.find(a => a.code === code);
        if (meta) lines.push({ id: Math.random().toString(36).substr(2, 8), code: meta.code, label: meta.label, value: '', unit: meta.unit });
      }
    }

    setFormLines(lines);
    setStep('assisted');
  }, []);

  const handleDecoded = useCallback((raw: string) => {
    stopCamera();
    setError(null);
    setStep('processing');

    setTimeout(() => {
      const result = parseQrPayload(raw);
      if (result.isNativeFormat && result.payload) {
        setPayload(result.payload);
        setStep('preview');
      } else {
        initAssistedForm(result);
      }
    }, 600);
  }, [stopCamera, initAssistedForm]);

  const addFormLine = useCallback((code: string) => {
    const meta = ALL_ANALYSES.find(a => a.code === code);
    if (!meta) return;
    setFormLines(prev => [...prev, { id: Math.random().toString(36).substr(2, 8), code: meta.code, label: meta.label, value: '', unit: meta.unit }]);
  }, []);

  const removeFormLine  = useCallback((id: string) => setFormLines(prev => prev.filter(l => l.id !== id)), []);
  const updateFormValue = useCallback((id: string, value: string) => setFormLines(prev => prev.map(l => l.id === id ? { ...l, value } : l)), []);

  const submitAssistedForm = useCallback(() => {
    const filledLines = formLines.filter(l => l.value.trim() !== '' && !isNaN(parseFloat(l.value)));
    if (filledLines.length === 0) { setError("Saisissez au moins une valeur d'analyse."); return; }

    const manualResults: LabResult[] = filledLines.map(l => {
      const meta = ALL_ANALYSES.find(a => a.code === l.code);
      const defaults: Record<string, { refLow?: number; refHigh?: number }> = {
        HBA1C: { refHigh: 5.7 }, FASTING_GLUCOSE: { refLow: 70, refHigh: 100 },
        POSTPRANDIAL_GLUCOSE: { refLow: 70, refHigh: 140 },
        TOTAL_CHOL: { refHigh: 200 }, HDL: { refLow: 40 }, LDL: { refHigh: 130 },
        TRIGLYCERIDES: { refHigh: 150 }, CREATININE: { refLow: 0.6, refHigh: 1.2 },
        EGFR: { refLow: 90 }, MICROALBUMINURIA: { refHigh: 30 }, TSH: { refLow: 0.4, refHigh: 4.0 },
      };
      const ref   = defaults[l.code] || {};
      const value = parseFloat(l.value);
      let flag: LabResult['flag'] = 'normal';
      if (ref.refLow && value < ref.refLow) flag = 'low';
      if (ref.refHigh && value > ref.refHigh) flag = 'high';
      return { code: l.code, label: meta?.label || l.label, value, unit: l.unit || meta?.unit || '', refRange: { low: ref.refLow, high: ref.refHigh }, flag, category: meta?.category || 'other' } as LabResult;
    });

    let finalPayload: LabReportPayload;
    if (parseResult?.extractedData) {
      finalPayload = buildPayloadFromExtracted(parseResult.extractedData, manualResults);
    } else {
      finalPayload = {
        version: '1.0',
        reportId: 'MAN-' + Date.now().toString(36).toUpperCase(),
        laboratory: { name: formLabName || 'Laboratoire externe', accreditation: 'Non vérifié' },
        patient: { externalId: patientId, firstName: patientName?.split(' ')[0] || '', lastName: patientName?.split(' ').slice(1).join(' ') || '' },
        collectionDate: formDate || new Date().toISOString(),
        reportDate: new Date().toISOString(),
        results: manualResults,
      };
    }
    if (formLabName) finalPayload.laboratory.name = formLabName;
    if (formDate)    finalPayload.collectionDate = formDate;
    setPayload(finalPayload);
    setStep('preview');
  }, [formLines, parseResult, formLabName, formDate, patientId, patientName]);

  const generateDownloadableQr = useCallback(async () => {
    setGeneratingQr(true);
    setError(null);
    try {
      const jsonStr = generateSampleQrString(patientName);
      const dataUrl = await QRCode.toDataURL(jsonStr, { width: 800, margin: 2, color: { dark: '#000000', light: '#ffffff' }, errorCorrectionLevel: 'M' });
      setQrImageUrl(dataUrl);
    } catch { setError('Erreur lors de la génération du QR code.'); }
    setGeneratingQr(false);
  }, [patientName]);

  const downloadQr = useCallback(() => {
    if (!qrImageUrl) return;
    const a = document.createElement('a');
    a.href = qrImageUrl;
    a.download = `bilan-${patientName?.replace(/\s/g, '-') ?? 'patient'}-${Date.now()}.png`;
    a.click();
  }, [qrImageUrl, patientName]);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setStep('processing');
    setScanAttempts(prev => prev + 1);
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const sizes = [{ w: img.width, h: img.height }, { w: Math.min(img.width, 1200), h: Math.min(img.height, 1200) }, { w: img.width * 2, h: img.height * 2 }];
      for (const size of sizes) {
        const canvas = document.createElement('canvas');
        canvas.width = size.w; canvas.height = size.h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) continue;
        ctx.drawImage(img, 0, 0, size.w, size.h);
        const imageData = ctx.getImageData(0, 0, size.w, size.h);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
        if (code?.data) { URL.revokeObjectURL(url); handleDecoded(code.data); return; }
      }
      URL.revokeObjectURL(url);
      setError('Aucun QR code détecté dans cette image.\nVous pouvez saisir les résultats manuellement.');
      initAssistedForm({ isNativeFormat: false, payload: null, extractedData: { values: [], rawFields: {} }, rawText: '[image sans QR détecté]', detectedFormat: 'unknown', message: 'QR non détecté — saisie manuelle proposée.' });
    };
    img.onerror = () => { URL.revokeObjectURL(url); setError("Format d'image non supporté. Utilisez JPG, PNG ou WEBP."); setStep('choose'); };
    img.src = url;
  }, [handleDecoded, initAssistedForm]);

  const startCamera = useCallback(async () => {
    setError(null); setStep('camera'); setScanAttempts(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (!videoRef.current) { setError("Erreur d'initialisation vidéo."); setStep('choose'); return; }
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      await videoRef.current.play();
      let frameCount = 0;
      const scan = () => {
        const video = videoRef.current; const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) { rafRef.current = requestAnimationFrame(scan); return; }
        if (++frameCount % 3 !== 0) { rafRef.current = requestAnimationFrame(scan); return; }
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { rafRef.current = requestAnimationFrame(scan); return; }
        ctx.drawImage(video, 0, 0);
        const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) { handleDecoded(code.data); return; }
        setScanAttempts(Math.floor(frameCount / 30));
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('NotAllowed') || msg.includes('Permission')) setError("Accès caméra refusé. Autorisez dans les paramètres de votre navigateur.");
      else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) setError("Aucune caméra détectée. Utilisez l'import photo.");
      else if (location.protocol !== 'https:' && location.hostname !== 'localhost') setError("La caméra nécessite HTTPS. Utilisez l'import photo.");
      else setError("Impossible d'accéder à la caméra. Utilisez l'import photo.");
      setStep('choose');
    }
  }, [handleDecoded]);

  const handleManualSubmit = useCallback(() => { if (!manualJson.trim()) { setError('Collez le contenu du QR code.'); return; } handleDecoded(manualJson.trim()); }, [manualJson, handleDecoded]);
  const handleDemo         = useCallback(() => handleDecoded(generateSampleQrString(patientName)), [handleDecoded, patientName]);
  const handleConfirm      = useCallback(() => { if (!payload) return; const report = saveLabReport(patientId, payload, 'qr-scan'); setSavedReport(report); setStep('saved'); onSaved(report); }, [payload, patientId, onSaved]);

  const availableAnalyses = ALL_ANALYSES.filter(a => !formLines.some(l => l.code === a.code));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 ring-1 ring-brand-200 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-brand-700" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Scanner un bilan biologique</h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {step === 'assisted' ? 'Saisie assistée — complétez les résultats' : 'Tout QR code accepté · 11 biomarqueurs diabète'}
              </p>
            </div>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">

          {/* Erreur */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-coral-50 border border-coral-200">
              <div className="flex items-start gap-2 text-coral-700 text-[13px] font-medium">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="whitespace-pre-line">{error}</div>
              </div>
              <button onClick={() => setError(null)} className="mt-2 text-[11px] text-coral-500 hover:text-coral-700 underline transition font-semibold">Fermer</button>
            </div>
          )}

          {/* ── STEP: Choix du mode ── */}
          {step === 'choose' && (
            <div className="space-y-5">
              <p className="text-[13px] text-slate-500 font-medium mb-3">Choisissez un mode d'acquisition :</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { Icon: Upload,  color: 'blue',   title: 'Importer une photo',  sub: 'Photo du QR code',           onClick: () => fileRef.current?.click() },
                  { Icon: Camera,  color: 'brand',  title: 'Scanner en direct',   sub: 'Pointer la caméra',           onClick: startCamera },
                  { Icon: FileText,color: 'violet', title: 'Saisie texte',        sub: 'Coller le contenu du QR',    onClick: () => { setStep('manual'); setError(null); } },
                  { Icon: Edit3,   color: 'amber',  title: 'Saisie des résultats',sub: 'Remplir depuis le rapport',  onClick: () => initAssistedForm({ isNativeFormat: false, payload: null, extractedData: { values: [], rawFields: {} }, rawText: '', detectedFormat: 'unknown', message: 'Saisie manuelle directe.' }) },
                ].map(({ Icon, color, title, sub, onClick }) => (
                  <button key={title} onClick={onClick} className={cn(
                    'group p-5 rounded-2xl border transition text-left',
                    color === 'blue'   && 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100',
                    color === 'brand'  && 'bg-brand-50 border-brand-200 hover:border-brand-400 hover:bg-brand-100',
                    color === 'violet' && 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100',
                    color === 'amber'  && 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100',
                  )}>
                    <Icon className={cn(
                      'w-7 h-7 mb-3 group-hover:scale-110 transition',
                      color === 'blue'   && 'text-blue-600',
                      color === 'brand'  && 'text-brand-600',
                      color === 'violet' && 'text-purple-600',
                      color === 'amber'  && 'text-amber-600',
                    )} />
                    <div className="text-[13px] font-bold text-slate-900">{title}</div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">{sub}</div>
                  </button>
                ))}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); if (e.target) e.target.value = ''; }} />
              </div>

              {/* Séparateur */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">ou testez</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* QR exemple */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-blue-50 border border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-900 mb-1">QR code d'exemple MediAI</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Générez un QR au format MediAI pour tester le pipeline complet.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {!qrImageUrl ? (
                        <button onClick={generateDownloadableQr} disabled={generatingQr} className="flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-800 font-semibold transition disabled:opacity-50">
                          {generatingQr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Générer le QR
                        </button>
                      ) : (
                        <>
                          <button onClick={downloadQr} className="flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-800 font-semibold transition">
                            <Download className="w-3.5 h-3.5" /> Télécharger
                          </button>
                          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold transition">
                            <Upload className="w-3.5 h-3.5" /> Réimporter
                          </button>
                        </>
                      )}
                      <button onClick={handleDemo} className="flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition">
                        Charger directement
                      </button>
                    </div>
                  </div>
                  {qrImageUrl && (
                    <div className="shrink-0">
                      <img src={qrImageUrl} alt="QR Code" className="w-28 h-28 rounded-xl border border-slate-200 shadow-sm" />
                    </div>
                  )}
                </div>
              </div>

              {scanAttempts > 0 && (
                <p className="text-[11px] text-slate-400 text-center font-medium">
                  {scanAttempts} tentative{scanAttempts > 1 ? 's' : ''} effectuée{scanAttempts > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* ── STEP: Saisie manuelle texte ── */}
          {step === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Contenu du QR code (JSON, texte, URL…)</label>
                <textarea
                  value={manualJson}
                  onChange={e => setManualJson(e.target.value)}
                  placeholder={'Accepte tout format :\n• JSON MediAI\n• JSON générique\n• URL avec paramètres\n• Texte clé: valeur\n• Tout autre contenu'}
                  className="w-full h-40 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-[12px] font-mono placeholder:text-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 resize-none transition"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setStep('choose'); setManualJson(''); setError(null); }} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold transition">
                  Retour
                </button>
                <button onClick={handleManualSubmit} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[13px] transition">
                  Analyser
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Formulaire de saisie assistée ── */}
          {step === 'assisted' && (
            <div className="space-y-4">
              {parseResult && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <ScanLine className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[12px] text-blue-800 font-bold">
                        {parseResult.detectedFormat === 'unknown' ? 'Saisie manuelle des résultats' : `Format détecté : ${parseResult.detectedFormat}`}
                      </p>
                      <p className="text-[11px] text-blue-600 mt-0.5 font-medium">{parseResult.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>Laboratoire</label>
                  <input value={formLabName} onChange={e => setFormLabName(e.target.value)} placeholder="Nom du laboratoire" className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Date du prélèvement</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className={INPUT_CLS} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={LABEL_CLS}>Résultats d'analyses</label>
                  <span className="text-[10px] text-slate-400 font-medium">{formLines.filter(l => l.value.trim()).length}/{formLines.length} rempli(s)</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {formLines.map(line => (
                    <div key={line.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-slate-800 font-semibold truncate">{line.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{line.code}</p>
                      </div>
                      <input type="number" step="any" value={line.value} onChange={e => updateFormValue(line.id, e.target.value)} placeholder="—"
                        className="w-24 px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-[13px] text-center tabular-nums focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/20 transition" />
                      <span className="text-[11px] text-slate-400 w-16 text-right font-medium">{line.unit}</span>
                      <button onClick={() => removeFormLine(line.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-coral-600 hover:bg-coral-50 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {availableAnalyses.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] text-slate-400 font-medium">Ajouter :</span>
                      {availableAnalyses.map(a => (
                        <button key={a.code} onClick={() => addFormLine(a.code)}
                          className="text-[10px] px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition font-semibold">
                          + {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {parseResult?.rawText && parseResult.rawText !== '[image sans QR détecté]' && (
                <details className="group">
                  <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 transition font-medium">Voir les données brutes du QR</summary>
                  <pre className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-mono overflow-x-auto max-h-32 overflow-y-auto">
                    {parseResult.rawText}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => { setStep('choose'); setFormLines([]); setParseResult(null); setError(null); }} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold transition">Retour</button>
                <button onClick={submitAssistedForm} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[13px] transition flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Valider les résultats
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Caméra ── */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[4/3]">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-brand-400/70 rounded-2xl relative">
                    <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
                    <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent animate-pulse top-1/2" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-[11px] text-white font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  Recherche du QR code… ({scanAttempts}s)
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { stopCamera(); setStep('choose'); }} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold transition">Retour</button>
                <button onClick={() => { stopCamera(); fileRef.current?.click(); }} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 text-[13px] font-semibold transition">
                  <Upload className="w-3.5 h-3.5 inline mr-1.5" /> Importer une photo
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); if (e.target) e.target.value = ''; }} />
            </div>
          )}

          {/* ── STEP: Processing ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
              <p className="text-[13px] text-slate-700 font-semibold">Analyse en cours…</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Décodage · Détection du format · Extraction</p>
            </div>
          )}

          {/* ── STEP: Aperçu ── */}
          {step === 'preview' && payload && (() => {
            const normalCount   = payload.results.filter(r => (r.flag ?? 'normal') === 'normal').length;
            const abnormalCount = payload.results.length - normalCount;
            const anomalies     = detectAnomalies(payload);
            return (
              <div className="space-y-4">
                {/* Infos labo */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[14px] font-bold text-slate-900">{payload.laboratory.name}</p>
                      {payload.laboratory.accreditation && <p className="text-[11px] text-slate-400 font-medium">{payload.laboratory.accreditation}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Rapport</p>
                      <p className="text-[11px] text-slate-700 font-mono">{payload.reportId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div>
                      <p className="text-slate-400 font-medium">Patient</p>
                      <p className="text-slate-800 font-semibold">{payload.patient.firstName} {payload.patient.lastName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Prélèvement</p>
                      <p className="text-slate-800 font-semibold">{new Date(payload.collectionDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>

                {/* Compteurs */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200">
                    <p className="text-[22px] font-black text-brand-700">{normalCount}</p>
                    <p className="text-[11px] text-brand-600 font-bold">Normaux</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                    <p className="text-[22px] font-black text-amber-700">{abnormalCount}</p>
                    <p className="text-[11px] text-amber-600 font-bold">Hors normes</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                    <p className="text-[22px] font-black text-blue-700">{payload.results.length}</p>
                    <p className="text-[11px] text-blue-600 font-bold">Total</p>
                  </div>
                </div>

                {/* Anomalies */}
                {anomalies.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-coral-50 border border-coral-200">
                    <p className="text-[12px] font-bold text-coral-700 mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Anomalies
                    </p>
                    <ul className="space-y-0.5 text-[11px] text-coral-800 font-medium">
                      {anomalies.map((a, i) => <li key={i}>• {a}</li>)}
                    </ul>
                  </div>
                )}

                {/* Résultats */}
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {payload.results.map(r => (
                    <div key={r.code} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-slate-800 font-semibold truncate">{r.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Réf : {r.refRange.low ?? '—'} – {r.refRange.high ?? '—'} {r.unit}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[13px] font-bold text-slate-900 tabular-nums">{r.value} {r.unit}</span>
                        <FlagBadge flag={r.flag} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setPayload(null); setStep('choose'); }} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold transition">Annuler</button>
                  <button onClick={handleConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[13px] transition flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Enregistrer dans mon dossier
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ── STEP: Succès ── */}
          {step === 'saved' && savedReport && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 ring-1 ring-brand-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-brand-600" />
              </div>
              <h3 className="text-[17px] font-black text-slate-900 mb-1">Bilan enregistré avec succès</h3>
              <p className="text-[13px] text-slate-500 mb-5 max-w-sm mx-auto font-medium">
                Les résultats ont été ajoutés à votre dossier et seront intégrés dans vos prochaines prédictions.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 mb-6 font-medium">
                <Eye className="w-3 h-3" /> Trace : <code className="text-brand-700 font-mono font-bold">{savedReport.traceId}</code>
              </div>
              <div>
                <button onClick={onClose} className="px-8 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[13px] transition shadow-[0_2px_8px_rgba(16,185,129,0.3)]">Fermer</button>
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
    'critical-low':  { label: 'Critique ↓', cls: 'text-coral-700 bg-coral-50 border-coral-200' },
    'critical-high': { label: 'Critique ↑', cls: 'text-coral-700 bg-coral-50 border-coral-200' },
    'low':           { label: 'Bas',        cls: 'text-amber-700 bg-amber-50 border-amber-200' },
    'high':          { label: 'Élevé',      cls: 'text-amber-700 bg-amber-50 border-amber-200' },
    'normal':        { label: 'Normal',     cls: 'text-brand-700 bg-brand-50 border-brand-200' },
  };
  const c = config[flag ?? 'normal'] ?? config.normal;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${c.cls}`}>{c.label}</span>;
}
