/**
 * U1 — Hiérarchie d'Information Radicale
 * Dimension : un seul centre de gravité visuel par zone
 *
 * COMPROMIS EXPLICITE :
 * On sacrifie la densité d'information pour forcer l'ordre de lecture.
 * Le médecin voit dans l'ordre exact : QUI → COMBIEN DE TEMPS → QUOI → POURQUOI → ACTION
 * Rien ne peut rivaliser visuellement avec l'étape courante.
 * Tradeoff : moins de contexte visible simultanément, scroll requis pour les détails.
 */

const BG      = "#07090F";
const SURFACE = "#0E1118";
const BORDER  = "rgba(255,255,255,0.07)";
const AMBER   = "#FFAB00";
const CYAN    = "#00E5FF";
const VIOLET  = "#BF5AF2";
const GREEN   = "#30D158";
const MUTED   = "rgba(255,255,255,0.38)";
const BRIGHT  = "#FFFFFF";

// Weight scale: 5 = hero · 1 = background noise
const HIERARCHY = [
  { step: 1, weight: 5, label: "QUI · L'ALERTE CONCERNE", content: "patient" },
  { step: 2, weight: 4, label: "DANS COMBIEN DE TEMPS", content: "countdown" },
  { step: 3, weight: 3, label: "QUE FAIRE MAINTENANT",  content: "action" },
  { step: 4, weight: 2, label: "POURQUOI L'IA PRÉDIT",  content: "xai" },
  { step: 5, weight: 1, label: "CONTEXTE",              content: "context" },
];

const CAUSES = [
  { icon: "↓", label: "Tendance glycémique", val: "−18 mg/dL / 45 min", pct: 42, color: CYAN },
  { icon: "⚡", label: "Activité physique",   val: "Modérée · 40 min",   pct: 33, color: VIOLET },
  { icon: "◉", label: "Bolus résiduel",       val: "3.5U actif · 2h30",  pct: 25, color: GREEN },
];

export function U1Hierarchy() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: BG, fontFamily: "'Inter', system-ui, sans-serif",
      color: BRIGHT, fontSize: 13, overflow: "hidden",
    }}>

      {/* NAV — 1 ligne, ultra-minimal */}
      <nav style={{
        height: 44, display: "flex", alignItems: "center",
        padding: "0 24px", gap: 10, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`, background: SURFACE,
      }}>
        <img src="/logo-mark.png" alt="" style={{ width: 20, height: "auto", opacity: 0.7, filter: "brightness(0) invert(1)" }} />
        <span style={{ fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.03em" }}>
          MediAI Care
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: MUTED }}>Dr. Laurent · Tableau de bord</span>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 10, fontWeight: 700 }}>DR</div>
      </nav>

      {/* SCROLL ZONE — strict linear hierarchy */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* ══ STEP 1 — QUI (weight 5) ══ */}
        <div style={{
          padding: "20px 32px 16px",
          borderBottom: `1px solid ${BORDER}`,
          background: `linear-gradient(180deg, rgba(255,171,0,0.05) 0%, transparent 100%)`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 8 }}>
            ① QUI · L'ALERTE CONCERNE
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(255,171,0,0.10)", border: `2px solid rgba(255,171,0,0.35)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, color: AMBER, fontSize: 16, flexShrink: 0,
              boxShadow: `0 0 20px rgba(255,171,0,0.15)`,
            }}>MD</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: BRIGHT, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                Marie Dupont
              </div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>
                41 ans · Diabète T1D · Freestyle Libre 2 · P-007
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "rgba(255,171,0,0.10)", border: "1px solid rgba(255,171,0,0.25)",
              color: AMBER,
            }}>⚡ Alerte active</div>
          </div>
        </div>

        {/* ══ STEP 2 — COMBIEN DE TEMPS (weight 4) — HERO ══ */}
        <div style={{
          padding: "28px 32px",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: `radial-gradient(ellipse at 50% 0%, rgba(255,171,0,0.06) 0%, transparent 70%)`,
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 10 }}>
              ② TEMPS AVANT L'ÉVÉNEMENT PRÉDIT
            </div>
            {/* HERO: le plus grand élément de la page */}
            <div style={{
              fontSize: 88, fontWeight: 900, color: BRIGHT,
              letterSpacing: "-0.07em", lineHeight: 0.9,
              fontVariantNumeric: "tabular-nums",
              textShadow: `0 0 40px ${AMBER}33`,
            }}>
              35<span style={{ fontSize: 44, color: MUTED }}>:</span>00
            </div>
            <div style={{ fontSize: 14, color: MUTED, marginTop: 10 }}>
              Hypoglycémie prédite · Glucose estimé{" "}
              <span style={{ color: AMBER, fontWeight: 700 }}>64 mg/dL</span>
              {" "}· Confiance IA 91%
            </div>
          </div>

          {/* Gauge — visuel secondaire, petite taille */}
          <div style={{ textAlign: "center" }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={AMBER} strokeWidth="10"
                strokeDasharray={`${0.67 * 251} ${251}`} strokeDashoffset="63" strokeLinecap="round"
                transform="rotate(-90 50 50)" opacity="0.75" />
              <text x="50" y="46" textAnchor="middle" fontSize="14" fontWeight="900" fill={BRIGHT}>67</text>
              <text x="50" y="58" textAnchor="middle" fontSize="8" fill={MUTED}>/ 100</text>
            </svg>
            <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.10em" }}>Score risque</div>
          </div>
        </div>

        {/* ══ STEP 3 — ACTION (weight 3) — AVANT les explications ══ */}
        <div style={{
          padding: "20px 32px",
          borderBottom: `1px solid ${BORDER}`,
          background: SURFACE,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 14 }}>
            ③ QUE FAIRE MAINTENANT
          </div>

          <div style={{
            background: "rgba(255,171,0,0.08)", border: "1px solid rgba(255,171,0,0.20)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Suggestion IA</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: BRIGHT, letterSpacing: "-0.02em" }}>
              Réduire le prochain bolus de <span style={{ color: AMBER }}>10%</span>
            </div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
              OU · Proposer 15g de glucides rapides maintenant
            </div>
          </div>

          {/* Actions : hiérarchie stricte par taille */}
          <div style={{ display: "flex", gap: 10 }}>
            {/* Primary — biggest */}
            <button style={{
              flex: 2, padding: "14px 24px", borderRadius: 12,
              border: "none", background: AMBER,
              fontSize: 15, fontWeight: 900, color: "#07090F",
              cursor: "pointer", letterSpacing: "-0.02em",
              boxShadow: `0 0 24px rgba(255,171,0,0.35)`,
            }}>
              ✓ Appliquer la suggestion
            </button>
            {/* Secondary — medium */}
            <button style={{
              flex: 1, padding: "14px", borderRadius: 12,
              border: `1.5px solid rgba(255,255,255,0.15)`,
              background: "rgba(255,255,255,0.05)",
              fontSize: 14, fontWeight: 700, color: BRIGHT, cursor: "pointer",
            }}>
              ✎ Modifier
            </button>
            {/* Tertiary — smallest */}
            <button style={{
              flex: 1, padding: "14px", borderRadius: 12,
              border: `1px solid ${BORDER}`, background: "transparent",
              fontSize: 12, fontWeight: 500, color: MUTED, cursor: "pointer",
            }}>
              Ignorer
            </button>
          </div>
        </div>

        {/* ══ STEP 4 — POURQUOI (weight 2) ══ */}
        <div style={{ padding: "20px 32px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 14 }}>
            ④ POURQUOI L'IA PRÉDIT CE RISQUE
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {CAUSES.map(c => (
              <div key={c.label} style={{
                flex: 1, background: SURFACE, borderRadius: 12,
                border: `1px solid ${BORDER}`, padding: "14px 16px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: c.color }}>{c.icon}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: c.color, letterSpacing: "-0.03em" }}>{c.pct}%</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: BRIGHT, marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{c.val}</div>
                <div style={{ marginTop: 10, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: 3, width: `${c.pct / 42 * 100}%`, background: c.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ STEP 5 — CONTEXTE (weight 1 — le plus discret) ══ */}
        <div style={{ padding: "14px 32px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.18)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 10 }}>
            ⑤ CONTEXTE PATIENT
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { l: "Glycémie", v: "142 mg/dL ↗", c: "rgba(255,255,255,0.55)" },
              { l: "TIR 24h", v: "71%", c: "rgba(255,255,255,0.55)" },
              { l: "HbA1c", v: "6.9%", c: "rgba(255,255,255,0.55)" },
              { l: "Bolus", v: "3.5U / 2h30", c: "rgba(255,255,255,0.55)" },
              { l: "Capteur", v: "Libre 2 · 4j 7h", c: "rgba(255,255,255,0.55)" },
            ].map(c => (
              <div key={c.l}>
                <div style={{ fontSize: 9, color: MUTED, marginBottom: 2 }}>{c.l}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.c }}>{c.v}</div>
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <button style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${BORDER}`, background: "transparent", fontSize: 11, color: MUTED, cursor: "pointer" }}>Dossier →</button>
          </div>
        </div>

      </div>
    </div>
  );
}
