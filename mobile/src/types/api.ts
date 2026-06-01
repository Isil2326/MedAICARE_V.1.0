/**
 * Types TypeScript miroir des contrats Pydantic du backend MediAI Care (API v1).
 * Source de vérité : docs/api/API_V1_CONTRACTS.md + schémas Pydantic backend.
 *
 * OPEN-LOOP STRICT : aucune structure ici ne décrit une dose, une action ou une
 * décision automatique. Les probabilités, explications et recommandations sont
 * fournies PAR LE BACKEND ; l'application mobile ne les calcule jamais.
 */

export type Role = 'patient' | 'clinician' | 'admin';
export type TargetName = 'hypo' | 'hyper';
export type Audience = 'patient' | 'clinician';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserPublic {
  id: string;
  email: string;
  role: Role;
  is_active: boolean;
}

export interface PatientPublic {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  diabetes_type: string | null;
  is_synthetic: boolean;
}

export interface CgmReading {
  id: string;
  patient_id: string;
  ts: string;
  glucose_mgdl: number;
  trend: string | null;
  source: string;
  device_id: string | null;
  external_event_id: string | null;
  quality_flag: string;
  unit: string | null;
  is_synthetic: boolean;
}

export interface InsulinEvent {
  id: string;
  patient_id: string;
  ts: string;
  units: number;
  insulin_type: string | null;
  source: string;
  device_id: string | null;
  external_event_id: string | null;
  quality_flag: string;
  unit: string | null;
  is_synthetic: boolean;
}

export interface MealEvent {
  id: string;
  patient_id: string;
  ts: string;
  carbs_g: number;
  description: string | null;
  source: string;
  device_id: string | null;
  external_event_id: string | null;
  quality_flag: string;
  unit: string | null;
  is_synthetic: boolean;
}

export interface ActivityEvent {
  id: string;
  patient_id: string;
  ts: string;
  duration_min?: number | null;
  intensity?: string | null;
  description?: string | null;
  source: string;
  device_id: string | null;
  external_event_id: string | null;
  quality_flag: string;
  unit: string | null;
  is_synthetic: boolean;
}

/** ML — /ml/predict : PROBABILITÉ uniquement (open-loop strict). */
export interface PredictRequest {
  patient_id?: string | null;
  at?: string | null;
  target: TargetName;
  horizon_min: number;
  persist?: boolean;
}

export interface PredictResponse {
  patient_id: string;
  at: string;
  target: TargetName;
  horizon_min: number;
  probability: number | null;
  risk_label: string;
  calculable: boolean;
  reason: string | null;
  model_name: string;
  model_version: string;
  calibrated: boolean;
  is_synthetic: boolean;
  persisted: boolean;
  prediction_id: string | null;
  n_cgm_points: number;
  open_loop_notice: string;
}

/** XAI — pondération du modèle, JAMAIS une causalité clinique. */
export type ReliabilityStatus =
  | 'reliable_for_model_debug'
  | 'caution_semantic_limits'
  | 'not_reliable_for_clinical_interpretation';

export interface FeatureContribution {
  feature: string;
  value: number | null;
  contribution: number | null;
  direction: 'augmente' | 'diminue' | 'neutre' | 'indéterminé';
  abs_importance: number | null;
}

export interface LocalExplainRequest {
  patient_id?: string | null;
  target: TargetName;
  horizon_min: number;
  at?: string | null;
  method?: string;
  audience?: Audience;
  persist?: boolean;
  top_k?: number;
}

export interface LocalExplanation {
  patient_id: string;
  at: string;
  target: TargetName;
  horizon_min: number;
  probability: number | null;
  risk_label: string;
  calculable: boolean;
  reason: string | null;
  model_name: string;
  model_version: string;
  calibrated: boolean;
  explains: string;
  xai_method: string;
  method_fallback: boolean;
  top_features: FeatureContribution[];
  baseline: number | null;
  explanation_text_patient: string;
  explanation_text_clinician: string;
  limitations: string;
  open_loop_notice: string;
  synthetic_only: boolean;
  n_cgm_points: number;
  cgm_gap: boolean;
  cached: boolean;
  explanation_id: string | null;
  xai_reliability_status: ReliabilityStatus;
  xai_warnings: string[];
  semantic_limitations: string[];
  calibration_notice: string;
  synthetic_data_notice: string;
}

export interface GlobalFeatureImportance {
  feature: string;
  mean_abs_importance: number | null;
  direction: string;
  aggregated_sign: 'augmente' | 'diminue' | 'mixte' | null;
}

export interface GlobalExplanation {
  target: TargetName;
  horizon_min: number;
  model_id: string;
  model_name: string;
  model_version: string;
  xai_method: string;
  method_fallback: boolean;
  calibrated: boolean;
  explains: string;
  top_features: GlobalFeatureImportance[];
  dataset_version: string | null;
  features_version: string | null;
  synthetic_only: boolean;
  n_background: number;
  generated_at: string;
  limitations: string;
  xai_reliability_status: ReliabilityStatus;
  xai_warnings: string[];
  semantic_limitations: string[];
  calibration_notice: string;
  synthetic_data_notice: string;
  direction_semantics: string;
  evaluation: Record<string, unknown> | null;
}

/** Recommandations — open-loop, validation clinicien obligatoire. */
export type RecommendationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'modified';

export interface RecommendationPublic {
  id: string;
  patient_id: string;
  prediction_id: string | null;
  status: RecommendationStatus | string;
  category: string;
  message: string;
  rationale: Record<string, unknown> | null;
  priority: number;
  target: string | null;
  horizon_min: number | null;
  probability: number | null;
  model_name: string | null;
  model_version: string | null;
  rule_id: string | null;
  rule_version: string | null;
  trigger_name: string | null;
  safety_level: string | null;
  xai_reliability_status: string | null;
  actionability_score: number | null;
  is_synthetic: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface GenerateRequest {
  patient_id?: string | null;
  prediction_id?: string | null;
  target?: TargetName | null;
  horizon_min?: number;
  at?: string | null;
  include_xai?: boolean;
}

export interface GenerateResponse {
  generated: RecommendationPublic[];
  blocked: Record<string, unknown>[];
  calculable: boolean;
  reasons: string[];
  open_loop_notice: string;
}

export interface TimeseriesQuery {
  patient_id?: string | null;
  start?: string | null;
  end?: string | null;
  limit?: number;
  offset?: number;
}
