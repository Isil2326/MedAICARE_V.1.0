// ============================================================================
// LAB REPORT SERVICE — v3.2.3
// Parser UNIVERSEL : accepte n'importe quel QR code
// Formats : JSON MediAI · JSON libre · URL · Texte clé-valeur · Tout
// ============================================================================

import type {
  LabReportPayload,
  LabResult,
  LabReport,
  DiabetesPanelSummary,
} from '../types/medical';

const STORAGE_KEY = 'mediai_lab_reports_v1';

// ============================================================================
// PARSER UNIVERSEL — accepte tout, extrait ce qu'il peut
// ============================================================================

/** Résultat du parsing : toujours OK, avec plus ou moins de données extraites */
export interface ParseResult {
  /** true = format natif MediAI reconnu, false = format externe */
  isNativeFormat: boolean;
  /** Payload complète si format natif, partielle sinon */
  payload: LabReportPayload | null;
  /** Données brutes extraites d'un QR externe */
  extractedData: ExtractedData | null;
  /** Texte brut du QR (toujours disponible) */
  rawText: string;
  /** Format détecté */
  detectedFormat: 'mediai-json' | 'generic-json' | 'url' | 'key-value' | 'text' | 'unknown';
  /** Message pour l'utilisateur */
  message: string;
}

export interface ExtractedData {
  labName?: string;
  patientName?: string;
  date?: string;
  values: ExtractedValue[];
  rawFields: Record<string, string>;
}

export interface ExtractedValue {
  label: string;
  value: number;
  unit: string;
  code?: string;
  suggestedCode?: string;
}

// Dictionnaire de correspondance label → code interne
const LABEL_TO_CODE: Record<string, string> = {
  'hba1c': 'HBA1C', 'hb a1c': 'HBA1C', 'hemoglobine glyquee': 'HBA1C',
  'hemoglobine glycosylee': 'HBA1C', 'a1c': 'HBA1C', 'glycated hemoglobin': 'HBA1C',
  'glycemie a jeun': 'FASTING_GLUCOSE', 'fasting glucose': 'FASTING_GLUCOSE',
  'glucose a jeun': 'FASTING_GLUCOSE', 'glycemie': 'FASTING_GLUCOSE', 'glucose': 'FASTING_GLUCOSE',
  'glycemie post': 'POSTPRANDIAL_GLUCOSE', 'postprandial': 'POSTPRANDIAL_GLUCOSE',
  'glycemie 2h': 'POSTPRANDIAL_GLUCOSE', 'post prandiale': 'POSTPRANDIAL_GLUCOSE',
  'cholesterol total': 'TOTAL_CHOL', 'cholesterol': 'TOTAL_CHOL', 'total cholesterol': 'TOTAL_CHOL',
  'hdl': 'HDL', 'hdl cholesterol': 'HDL', 'hdl-c': 'HDL', 'bon cholesterol': 'HDL',
  'ldl': 'LDL', 'ldl cholesterol': 'LDL', 'ldl-c': 'LDL', 'mauvais cholesterol': 'LDL',
  'triglycerides': 'TRIGLYCERIDES', 'tg': 'TRIGLYCERIDES',
  'creatinine': 'CREATININE', 'creat': 'CREATININE', 'creatinine serique': 'CREATININE',
  'egfr': 'EGFR', 'dfg': 'EGFR', 'filtration glomerulaire': 'EGFR', 'gfr': 'EGFR',
  'microalbuminurie': 'MICROALBUMINURIA', 'albumine urinaire': 'MICROALBUMINURIA',
  'tsh': 'TSH', 'thyreostimuline': 'TSH', 'thyroid': 'TSH',
};

const CODE_DEFAULTS: Record<string, { unit: string; refLow?: number; refHigh?: number; category: string }> = {
  HBA1C: { unit: '%', refHigh: 5.7, category: 'glycemia' },
  FASTING_GLUCOSE: { unit: 'mg/dL', refLow: 70, refHigh: 100, category: 'glycemia' },
  POSTPRANDIAL_GLUCOSE: { unit: 'mg/dL', refLow: 70, refHigh: 140, category: 'glycemia' },
  TOTAL_CHOL: { unit: 'mg/dL', refHigh: 200, category: 'lipids' },
  HDL: { unit: 'mg/dL', refLow: 40, category: 'lipids' },
  LDL: { unit: 'mg/dL', refHigh: 130, category: 'lipids' },
  TRIGLYCERIDES: { unit: 'mg/dL', refHigh: 150, category: 'lipids' },
  CREATININE: { unit: 'mg/dL', refLow: 0.6, refHigh: 1.2, category: 'renal' },
  EGFR: { unit: 'mL/min/1.73m²', refLow: 90, category: 'renal' },
  MICROALBUMINURIA: { unit: 'mg/L', refHigh: 30, category: 'renal' },
  TSH: { unit: 'mUI/L', refLow: 0.4, refHigh: 4.0, category: 'thyroid' },
};

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchCode(label: string): string | undefined {
  const n = normalize(label);
  for (const [key, code] of Object.entries(LABEL_TO_CODE)) {
    if (n.includes(key) || key.includes(n)) return code;
  }
  return undefined;
}

function extractNumbersFromText(text: string): ExtractedValue[] {
  const values: ExtractedValue[] = [];
  // Pattern: "Label : 7.2 %" or "Label = 142 mg/dL" or "Label 89 mL/min"
  const regex = /([A-Za-zÀ-ÿ\s\-()]{3,})\s*[:=\-–]\s*([\d.,]+)\s*([A-Za-z/%²µ·.]+)?/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const label = match[1].trim();
    const numStr = match[2].replace(',', '.');
    const value = parseFloat(numStr);
    const unit = match[3]?.trim() || '';
    if (!isNaN(value) && label.length > 2) {
      const code = matchCode(label);
      values.push({ label, value, unit: unit || CODE_DEFAULTS[code || '']?.unit || '', suggestedCode: code });
    }
  }
  return values;
}

function tryParseNativeJson(raw: string): LabReportPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.reportId && Array.isArray(parsed.results) && parsed.results.length > 0) {
      return parsed as LabReportPayload;
    }
  } catch { /* not native JSON */ }
  return null;
}

function tryParseGenericJson(raw: string): ExtractedData | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const rawFields: Record<string, string> = {};
    const values: ExtractedValue[] = [];
    let labName: string | undefined;
    let patientName: string | undefined;
    let date: string | undefined;

    function crawl(obj: Record<string, unknown>, prefix = '') {
      for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          crawl(val as Record<string, unknown>, fullKey);
        } else if (Array.isArray(val)) {
          val.forEach((item, i) => {
            if (typeof item === 'object' && item !== null) {
              crawl(item as Record<string, unknown>, `${fullKey}[${i}]`);
            } else {
              rawFields[`${fullKey}[${i}]`] = String(item);
            }
          });
        } else {
          rawFields[fullKey] = String(val ?? '');
          const nKey = normalize(key);
          if (typeof val === 'number') {
            const code = matchCode(key);
            if (code) {
              values.push({
                label: key, value: val,
                unit: CODE_DEFAULTS[code]?.unit || '', suggestedCode: code,
              });
            }
          }
          if (nKey.includes('lab') || nKey.includes('labo')) labName = String(val);
          if (nKey.includes('patient') || nKey.includes('nom')) patientName = String(val);
          if (nKey.includes('date')) date = String(val);
        }
      }
    }
    crawl(parsed);
    if (Object.keys(rawFields).length > 0) {
      return { labName, patientName, date, values, rawFields };
    }
  } catch { /* not JSON */ }
  return null;
}

function tryParseUrl(raw: string): ExtractedData | null {
  try {
    const url = new URL(raw.trim());
    const rawFields: Record<string, string> = {};
    const values: ExtractedValue[] = [];
    rawFields['url'] = url.href;
    rawFields['host'] = url.hostname;
    url.searchParams.forEach((val, key) => {
      rawFields[key] = val;
      const num = parseFloat(val);
      if (!isNaN(num)) {
        const code = matchCode(key);
        if (code) {
          values.push({ label: key, value: num, unit: CODE_DEFAULTS[code]?.unit || '', suggestedCode: code });
        }
      }
    });
    return { labName: url.hostname, values, rawFields };
  } catch { /* not URL */ }
  return null;
}

function tryParseKeyValue(raw: string): ExtractedData | null {
  const lines = raw.split(/[\n;|]+/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const rawFields: Record<string, string> = {};
  const values: ExtractedValue[] = [];
  let labName: string | undefined;
  let patientName: string | undefined;
  let date: string | undefined;

  for (const line of lines) {
    const sep = line.match(/^(.+?)\s*[:=\-–]\s*(.+)$/);
    if (sep) {
      const key = sep[1].trim();
      const val = sep[2].trim();
      rawFields[key] = val;
      const nKey = normalize(key);
      if (nKey.includes('lab') || nKey.includes('labo')) labName = val;
      if (nKey.includes('patient') || nKey.includes('nom')) patientName = val;
      if (nKey.includes('date')) date = val;

      const num = parseFloat(val.replace(',', '.'));
      if (!isNaN(num)) {
        const code = matchCode(key);
        const unitMatch = val.match(/[\d.,]+\s*(.+)/);
        values.push({
          label: key, value: num,
          unit: unitMatch?.[1]?.trim() || CODE_DEFAULTS[code || '']?.unit || '',
          suggestedCode: code,
        });
      }
    }
  }
  if (values.length > 0 || Object.keys(rawFields).length >= 2) {
    return { labName, patientName, date, values, rawFields };
  }
  return null;
}

/**
 * PARSER UNIVERSEL — accepte n'importe quel QR code
 * Stratégie : essayer chaque format du plus spécifique au plus générique
 */
export function parseQrPayload(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      isNativeFormat: false, payload: null, extractedData: null,
      rawText: raw, detectedFormat: 'unknown',
      message: 'QR code vide.',
    };
  }

  // 1. Format natif MediAI
  const native = tryParseNativeJson(trimmed);
  if (native) {
    return {
      isNativeFormat: true, payload: native, extractedData: null,
      rawText: trimmed, detectedFormat: 'mediai-json',
      message: 'Format MediAI reconnu — bilan complet extrait.',
    };
  }

  // 2. JSON générique
  const genericJson = tryParseGenericJson(trimmed);
  if (genericJson) {
    return {
      isNativeFormat: false, payload: null, extractedData: genericJson,
      rawText: trimmed, detectedFormat: 'generic-json',
      message: `Format JSON détecté — ${genericJson.values.length} valeur(s) médicale(s) reconnue(s).`,
    };
  }

  // 3. URL
  const urlData = tryParseUrl(trimmed);
  if (urlData) {
    return {
      isNativeFormat: false, payload: null, extractedData: urlData,
      rawText: trimmed, detectedFormat: 'url',
      message: `Lien détecté (${urlData.labName}). ${urlData.values.length} valeur(s) extraite(s).`,
    };
  }

  // 4. Texte clé-valeur
  const kvData = tryParseKeyValue(trimmed);
  if (kvData) {
    return {
      isNativeFormat: false, payload: null, extractedData: kvData,
      rawText: trimmed, detectedFormat: 'key-value',
      message: `Texte structuré détecté — ${kvData.values.length} valeur(s) médicale(s) reconnue(s).`,
    };
  }

  // 5. Texte libre — tenter d'en extraire des chiffres
  const freeValues = extractNumbersFromText(trimmed);
  if (freeValues.length > 0) {
    return {
      isNativeFormat: false, payload: null,
      extractedData: { values: freeValues, rawFields: { content: trimmed } },
      rawText: trimmed, detectedFormat: 'text',
      message: `${freeValues.length} valeur(s) numérique(s) détectée(s) dans le texte.`,
    };
  }

  // 6. Aucun format reconnu — on garde le texte brut pour saisie manuelle
  return {
    isNativeFormat: false, payload: null,
    extractedData: { values: [], rawFields: { content: trimmed } },
    rawText: trimmed, detectedFormat: 'unknown',
    message: 'Format non reconnu — vous pouvez saisir les résultats manuellement.',
  };
}

/**
 * Convertit des ExtractedValues en LabResult[] complets
 */
export function convertToLabResults(values: ExtractedValue[]): LabResult[] {
  return values
    .filter(v => v.suggestedCode)
    .map(v => {
      const code = v.suggestedCode!;
      const defaults = CODE_DEFAULTS[code];
      const refRange: { low?: number; high?: number } = {};
      if (defaults?.refLow) refRange.low = defaults.refLow;
      if (defaults?.refHigh) refRange.high = defaults.refHigh;

      let flag: LabResult['flag'] = 'normal';
      if (refRange.low && v.value < refRange.low) flag = 'low';
      if (refRange.high && v.value > refRange.high) flag = 'high';
      if (refRange.low && v.value < refRange.low * 0.7) flag = 'critical-low';
      if (refRange.high && v.value > refRange.high * 1.3) flag = 'critical-high';

      return {
        code,
        label: v.label,
        value: v.value,
        unit: v.unit || defaults?.unit || '',
        refRange,
        flag,
        category: defaults?.category || 'other',
      } as LabResult;
    });
}

/**
 * Crée un payload MediAI à partir de données extraites + saisie manuelle
 */
export function buildPayloadFromExtracted(
  extracted: ExtractedData,
  manualResults: LabResult[],
): LabReportPayload {
  const autoResults = convertToLabResults(extracted.values);
  // Merge : manuels écrasent auto si même code
  const manualCodes = new Set(manualResults.map(r => r.code));
  const merged = [...manualResults, ...autoResults.filter(r => !manualCodes.has(r.code))];

  return {
    version: '1.0',
    reportId: 'EXT-' + Date.now().toString(36).toUpperCase(),
    laboratory: {
      name: extracted.labName || 'Laboratoire externe',
      accreditation: 'Non vérifié',
    },
    patient: {
      externalId: 'EXT-PAT',
      firstName: extracted.patientName?.split(' ')[0] || '',
      lastName: extracted.patientName?.split(' ').slice(1).join(' ') || '',
    },
    collectionDate: extracted.date || new Date().toISOString(),
    reportDate: new Date().toISOString(),
    results: merged,
  };
}

// ============================================================================
// ANALYSE PANEL DIABÈTE
// ============================================================================

export const ALL_ANALYSES = [
  { code: 'HBA1C', label: 'HbA1c', unit: '%', category: 'glycemia' },
  { code: 'FASTING_GLUCOSE', label: 'Glycémie à jeun', unit: 'mg/dL', category: 'glycemia' },
  { code: 'POSTPRANDIAL_GLUCOSE', label: 'Glycémie post-prandiale', unit: 'mg/dL', category: 'glycemia' },
  { code: 'TOTAL_CHOL', label: 'Cholestérol total', unit: 'mg/dL', category: 'lipids' },
  { code: 'HDL', label: 'HDL', unit: 'mg/dL', category: 'lipids' },
  { code: 'LDL', label: 'LDL', unit: 'mg/dL', category: 'lipids' },
  { code: 'TRIGLYCERIDES', label: 'Triglycérides', unit: 'mg/dL', category: 'lipids' },
  { code: 'CREATININE', label: 'Créatinine', unit: 'mg/dL', category: 'renal' },
  { code: 'EGFR', label: 'eGFR', unit: 'mL/min/1.73m²', category: 'renal' },
  { code: 'MICROALBUMINURIA', label: 'Microalbuminurie', unit: 'mg/L', category: 'renal' },
  { code: 'TSH', label: 'TSH', unit: 'mUI/L', category: 'thyroid' },
] as const;

const PHYSIOLOGICAL_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  HBA1C: { min: 3, max: 20, unit: '%' },
  FASTING_GLUCOSE: { min: 30, max: 600, unit: 'mg/dL' },
  POSTPRANDIAL_GLUCOSE: { min: 30, max: 700, unit: 'mg/dL' },
  TOTAL_CHOL: { min: 50, max: 500, unit: 'mg/dL' },
  HDL: { min: 10, max: 150, unit: 'mg/dL' },
  LDL: { min: 20, max: 400, unit: 'mg/dL' },
  TRIGLYCERIDES: { min: 20, max: 1500, unit: 'mg/dL' },
  CREATININE: { min: 0.2, max: 15, unit: 'mg/dL' },
  EGFR: { min: 5, max: 200, unit: 'mL/min/1.73m²' },
  MICROALBUMINURIA: { min: 0, max: 500, unit: 'mg/L' },
  TSH: { min: 0.01, max: 100, unit: 'mUI/L' },
};

export function validateResult(result: LabResult): { ok: boolean; message?: string } {
  const range = PHYSIOLOGICAL_RANGES[result.code];
  if (!range) return { ok: true };
  if (result.value < range.min || result.value > range.max) {
    return {
      ok: false,
      message: `${result.label} : ${result.value} ${result.unit} hors plage physiologique.`,
    };
  }
  return { ok: true };
}

export function computeFlag(result: LabResult): LabResult['flag'] {
  const { value, refRange } = result;
  if (refRange.low !== undefined && value < refRange.low) {
    return (refRange.low - value) / refRange.low > 0.3 ? 'critical-low' : 'low';
  }
  if (refRange.high !== undefined && value > refRange.high) {
    return (value - refRange.high) / refRange.high > 0.3 ? 'critical-high' : 'high';
  }
  return 'normal';
}

export function detectAnomalies(payload: LabReportPayload): string[] {
  const anomalies: string[] = [];
  for (const result of payload.results) {
    const v = validateResult(result);
    if (!v.ok && v.message) anomalies.push(v.message);
    const flag = result.flag ?? computeFlag(result);
    if (flag === 'critical-low' || flag === 'critical-high') {
      anomalies.push(`${result.label} ${flag === 'critical-low' ? 'critique bas' : 'critique haut'} : ${result.value} ${result.unit}`);
    }
  }
  return anomalies;
}

export function extractDiabetesPanel(payload: LabReportPayload): DiabetesPanelSummary {
  const find = (code: string) => payload.results.find(r => r.code === code)?.value;
  return {
    hba1c: find('HBA1C'), fastingGlucose: find('FASTING_GLUCOSE'),
    postprandialGlucose: find('POSTPRANDIAL_GLUCOSE'),
    totalCholesterol: find('TOTAL_CHOL'), hdl: find('HDL'), ldl: find('LDL'),
    triglycerides: find('TRIGLYCERIDES'), creatinine: find('CREATININE'),
    egfr: find('EGFR'), microalbuminuria: find('MICROALBUMINURIA'),
    tsh: find('TSH'), reportDate: payload.reportDate,
  };
}

// ============================================================================
// PERSISTANCE
// ============================================================================

function generateUuid(): string {
  return 'lr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

function generateTraceId(): string {
  return 'TRC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function loadAll(): LabReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as LabReport[] : [];
  } catch { return []; }
}

function saveAll(reports: LabReport[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); }
  catch (e) { console.error('[LabReport] save failed', e); }
}

export function saveLabReport(
  patientId: string,
  payload: LabReportPayload,
  source: LabReport['source'] = 'qr-scan',
): LabReport {
  const anomalies = detectAnomalies(payload);
  const report: LabReport = {
    id: generateUuid(), patientId, source,
    scannedAt: Date.now(), payload,
    validation: {
      schemaValid: true,
      signatureValid: !!payload.signature,
      anomaliesDetected: anomalies,
    },
    traceId: generateTraceId(),
    appliedToPredictions: false,
  };
  const all = loadAll();
  all.unshift(report);
  saveAll(all);
  return report;
}

export function getReportsForPatient(patientId: string): LabReport[] {
  return loadAll().filter(r => r.patientId === patientId).sort((a, b) => b.scannedAt - a.scannedAt);
}

export function getLatestReportForPatient(patientId: string): LabReport | undefined {
  return getReportsForPatient(patientId)[0];
}

export function deleteLabReport(reportId: string): boolean {
  const all = loadAll();
  const filtered = all.filter(r => r.id !== reportId);
  if (filtered.length === all.length) return false;
  saveAll(filtered);
  return true;
}

export function markAsAppliedToPredictions(reportId: string): void {
  const all = loadAll();
  const idx = all.findIndex(r => r.id === reportId);
  if (idx >= 0) { all[idx].appliedToPredictions = true; saveAll(all); }
}

// ============================================================================
// SAMPLE GENERATOR (pour démo / tests QR)
// ============================================================================

export function generateSamplePayload(patientName?: string): LabReportPayload {
  const now = new Date();
  const collection = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return {
    version: '1.0',
    reportId: 'BIO-' + Date.now().toString(36).toUpperCase(),
    laboratory: { name: 'Laboratoire BioSanté Plus', accreditation: 'COFRAC ISO 15189', contact: 'contact@biosante-plus.fr' },
    patient: {
      externalId: 'PAT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      firstName: patientName?.split(' ')[0] ?? 'Marc',
      lastName: patientName?.split(' ')[1] ?? 'Dupont',
      birthDate: '1978-04-12',
    },
    collectionDate: collection.toISOString(),
    reportDate: now.toISOString(),
    prescriber: 'Dr. M. Renaud',
    results: [
      { code: 'HBA1C', loincCode: '4548-4', label: 'Hémoglobine glyquée (HbA1c)', value: 7.2, unit: '%', refRange: { low: 4, high: 5.7, text: '< 5.7' }, flag: 'high', category: 'glycemia' },
      { code: 'FASTING_GLUCOSE', loincCode: '1558-6', label: 'Glycémie à jeun', value: 142, unit: 'mg/dL', refRange: { low: 70, high: 100 }, flag: 'high', category: 'glycemia' },
      { code: 'POSTPRANDIAL_GLUCOSE', loincCode: '6749-6', label: 'Glycémie post-prandiale (2h)', value: 198, unit: 'mg/dL', refRange: { low: 70, high: 140 }, flag: 'high', category: 'glycemia' },
      { code: 'TOTAL_CHOL', loincCode: '2093-3', label: 'Cholestérol total', value: 215, unit: 'mg/dL', refRange: { high: 200 }, flag: 'high', category: 'lipids' },
      { code: 'HDL', loincCode: '2085-9', label: 'HDL Cholestérol', value: 48, unit: 'mg/dL', refRange: { low: 40 }, flag: 'normal', category: 'lipids' },
      { code: 'LDL', loincCode: '13457-7', label: 'LDL Cholestérol', value: 142, unit: 'mg/dL', refRange: { high: 130 }, flag: 'high', category: 'lipids' },
      { code: 'TRIGLYCERIDES', loincCode: '2571-8', label: 'Triglycérides', value: 168, unit: 'mg/dL', refRange: { high: 150 }, flag: 'high', category: 'lipids' },
      { code: 'CREATININE', loincCode: '2160-0', label: 'Créatinine sérique', value: 0.95, unit: 'mg/dL', refRange: { low: 0.6, high: 1.2 }, flag: 'normal', category: 'renal' },
      { code: 'EGFR', loincCode: '33914-3', label: 'Débit de filtration glomérulaire (eGFR)', value: 89, unit: 'mL/min/1.73m²', refRange: { low: 90 }, flag: 'low', category: 'renal' },
      { code: 'MICROALBUMINURIA', loincCode: '14957-5', label: 'Microalbuminurie', value: 18, unit: 'mg/L', refRange: { high: 30 }, flag: 'normal', category: 'renal' },
      { code: 'TSH', loincCode: '3016-3', label: 'TSH (Thyréostimuline)', value: 2.4, unit: 'mUI/L', refRange: { low: 0.4, high: 4.0 }, flag: 'normal', category: 'thyroid' },
    ],
    signature: 'sha256:demo-signature-' + Math.random().toString(36).substr(2, 16),
  };
}

export function generateSampleQrString(patientName?: string): string {
  return JSON.stringify(generateSamplePayload(patientName));
}
