// ============================================================================
// EvaluationPanel — Questionnaire Likert post-décision (objectif O4)
// Source : prototype académique. Ce panneau capture la perception clinicien
// d'une recommandation IA pour permettre une étude utilisateur ultérieure.
// Aucune donnée n'est envoyée à un serveur dans cette version.
// ============================================================================

import { useState } from 'react';
import {
  recordEvaluation,
  type Cohort,
  type DecisionAction,
  type LikertResponses,
} from '../../engine/evaluationService';
import { BG, SURFACE, BORDER, AMBER, GREEN, MUTED, BRIGHT } from './v3DarkTheme';

interface Props {
  decisionId: string;
  decisionAction: DecisionAction;
  cohort: Cohort;
  actorEmail: string;
  actorSpecialty?: string;
  onSubmitted: () => void;
  onSkip: () => void;
}

interface Question {
  key: keyof LikertResponses;
  prompt: string;
  scaleLow: string;
  scaleHigh: string;
}

const QUESTIONS: Question[] = [
  {
    key: 'trustAI',
    prompt: "J'ai confiance dans la recommandation IA proposée.",
    scaleLow: 'Pas du tout',
    scaleHigh: 'Totalement',
  },
  {
    key: 'explanationClarity',
    prompt: "Les explications fournies sont claires et compréhensibles.",
    scaleLow: 'Très peu',
    scaleHigh: 'Très claires',
  },
  {
    key: 'usefulness',
    prompt: "Cette interface m'a aidé(e) à prendre ma décision.",
    scaleLow: 'Inutile',
    scaleHigh: 'Très utile',
  },
  {
    key: 'timeToDecide',
    prompt: "Cet outil m'a permis de décider plus rapidement qu'à l'habitude.",
    scaleLow: 'Ralenti',
    scaleHigh: 'Très accéléré',
  },
  {
    key: 'wouldUseInPractice',
    prompt: "Je recommanderais cet outil à mes confrères en pratique réelle.",
    scaleLow: 'Non',
    scaleHigh: 'Oui absolument',
  },
];

export default function EvaluationPanel({
  decisionId,
  decisionAction,
  cohort,
  actorEmail,
  actorSpecialty,
  onSubmitted,
  onSkip,
}: Props) {
  const [answers, setAnswers] = useState<Partial<LikertResponses>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = QUESTIONS.every((q) => typeof answers[q.key] === 'number');

  const handleSubmit = () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError(null);
    const r = recordEvaluation({
      actorEmail,
      actorSpecialty,
      decisionId,
      decisionAction,
      responses: answers as LikertResponses,
      freeComment: comment,
    });
    setSubmitting(false);
    if (r.persisted) {
      onSubmitted();
    } else {
      setError(r.error ?? 'Enregistrement impossible');
    }
  };

  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${AMBER}40`,
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: `0 0 24px rgba(255,171,0,0.06)`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: AMBER,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 4,
            }}
          >
            Évaluation utilisateur · objectif O4
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: BRIGHT, marginBottom: 4 }}>
            Comment évaluez-vous cette interaction ?
          </div>
          <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>
            Cohorte <strong style={{ color: BRIGHT }}>{cohort}</strong>
            {' · '}
            {cohort === 'A' ? 'recommandation IA AVEC explications visibles' : 'recommandation IA SANS explications visibles'}
            {' · '}
            réponses anonymisées localement (aucun envoi serveur).
          </div>
        </div>
        <button
          onClick={onSkip}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER}`,
            borderRadius: 7,
            padding: '5px 12px',
            color: MUTED,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Passer
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {QUESTIONS.map((q) => {
          const value = answers[q.key];
          return (
            <div key={q.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: BRIGHT, fontWeight: 600 }}>{q.prompt}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: MUTED, width: 70, textAlign: 'right' }}>{q.scaleLow}</span>
                {[1, 2, 3, 4, 5].map((n) => {
                  const selected = value === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setAnswers((a) => ({ ...a, [q.key]: n }))}
                      aria-label={`${q.prompt} — note ${n} sur 5`}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: `1.5px solid ${selected ? AMBER : BORDER}`,
                        background: selected ? `${AMBER}25` : 'rgba(255,255,255,0.04)',
                        color: selected ? AMBER : BRIGHT,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: selected ? `0 0 8px ${AMBER}55` : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
                <span style={{ fontSize: 10, color: MUTED, width: 90 }}>{q.scaleHigh}</span>
              </div>
            </div>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Commentaire libre (optionnel)…"
        rows={2}
        style={{
          width: '100%',
          background: BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: '8px 10px',
          color: BRIGHT,
          fontSize: 12,
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />

      {error && (
        <div style={{ fontSize: 11, color: '#FF453A', fontWeight: 600 }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            background: allAnswered ? GREEN : 'rgba(255,255,255,0.08)',
            border: 'none',
            color: allAnswered ? '#07090F' : MUTED,
            fontSize: 12,
            fontWeight: 800,
            cursor: allAnswered && !submitting ? 'pointer' : 'not-allowed',
            boxShadow: allAnswered ? `0 0 16px ${GREEN}33` : 'none',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Enregistrement…' : '✓ Enregistrer mon évaluation'}
        </button>
      </div>
    </div>
  );
}
