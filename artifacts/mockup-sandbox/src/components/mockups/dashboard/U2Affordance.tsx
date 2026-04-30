/**
 * U2 — Affordances Visibles & Interaction Claire
 * Dimension : chaque élément interactif dit ce qu'il fait, avant d'être cliqué
 *
 * COMPROMIS EXPLICITE :
 * On sacrifie la densité visuelle pour l'évidence d'interaction.
 * Les boutons ont des labels en 2 lignes (action + conséquence).
 * Les zones cliquables sont séparées des zones informationnelles.
 * La zone de décision est physiquement isolée du reste.
 * Tradeoff : moins d'info dans l'espace visible, mais zéro ambiguité d'action.
 *
 * Principes appliqués :
 * - Chaque CTA a un label primaire (verbe) + sublabel (conséquence)
 * - Les 3 niveaux d'action (primary / modify / dismiss) se distinguent par FORME pas seulement couleur
 * - Les cibles tactiles font ≥ 48px de haut
 * - Les raccourcis clavier sont affichés
 * - Les actions irréversibles ont un label explicite
 */

const BG      = "#07090F";
const SURFACE = "#0E1118";
const SURFACE2 = "#12161F";
const BORDER  = "rgba(255,255,255,0.07)";
const AMBER   = "#FFAB00";
const CYAN    = "#00E5FF";
const VIOLET  = "#BF5AF2";
const GREEN   = "#30D158";
const RED     = "#FF453A";
const MUTED   = "rgba(255,255,255,0.40)";
const BRIGHT  = "#FFFFFF";

const CAUSES = [
  { icon: "↓", label: "Tendance glycémique", val: "−18 mg/dL / 45 min", pct: 42, color: CYAN },
  { icon: "⚡", label: "Activité physique",   val: "Modérée · 40 min",   pct: 33, color: VIOLET },
  { icon: "◉", label: "Bolus résiduel",       val: "3.5U actif · 2h30",  pct: 25, color: GREEN },
];

function KbdHint({ keys }: { keys: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 9, color: "rgba(255,255,255,0.28)",
      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 4, padding: "1px 5px",
    }}>
      {keys}
    </span>
  );
}

export function U2Affordance() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: BG, fontFamily: "'Inter', system-ui, sans-serif",
      color: BRIGHT, fontSize: 13, overflow: "hidden",
    }}>

      {/* NAV */}
      <nav style={{
        height: 48, display: "flex", alignItems: "center",
        padding: "0 24px", gap: 10, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`, background: SURFACE,
      }}>
        <img src="/logo-mark.png" alt="" style={{ width: 22, height: "auto", opacity: 0.7, filter: "brightness(0) invert(1)" }} />
        <span style={{ fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.03em" }}>
          MediAI Care
        </span>
        <div style={{ flex: 1 }} />
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)",
          borderRadius: 6, padding: "5px 12px",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: RED, boxShadow: `0 0 0 3px rgba(255,69,58,0.15)` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: RED }}>3 alertes actives</span>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 10, fontWeight: 700 }}>DR</div>
      </nav>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* INFO ZONE — left 55% — non-interactive, read only */}
        <div style={{
          flex: 1, overflow: "hidden auto", padding: "20px 24px",
          borderRight: `2px solid rgba(255,255,255,0.06)`,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          {/* Label zone info */}
          <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.20)", textTransform: "uppercase", letterSpacing: "0.16em", display: "flex", alignItems: "center", gap: 8 }}>
            <span>ZONE D'INFORMATION</span>
            <span style={{ flex: 1, height: 1, background: BORDER, display: "block" }} />
            <span>Lecture seule</span>
          </div>

          {/* Alert identity */}
          <div style={{ background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "16px 20px` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Alerte active · Patiente</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,171,0,0.10)", border: `2px solid rgba(255,171,0,0.30)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: AMBER, fontSize: 14 }}>MD</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: BRIGHT, letterSpacing: "-0.03em" }}>Marie Dupont</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>41 ans · T1D · P-007 · Freestyle Libre 2</div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: MUTED, marginBottom: 2 }}>Avant hypo prédite</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: AMBER, letterSpacing: "-0.05em", lineHeight: 1, textShadow: `0 0 20px ${AMBER}44` }}>35:00</div>
              </div>
            </div>
          </div>

          {/* XAI — information only */}
          <div style={{ background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "16px 20px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>
              Explication IA — 3 signaux identifiés
            </div>
            {CAUSES.map(c => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${c.color}12`, border: `1px solid ${c.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: c.color, fontWeight: 900, flexShrink: 0 }}>{c.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BRIGHT }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{c.val}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: c.color, letterSpacing: "-0.04em" }}>{c.pct}%</div>
                  <div style={{ fontSize: 9, color: MUTED }}>contribution</div>
                </div>
              </div>
            ))}
            <div style={{ display: "flex" }}>
              <div style={{ height: 4, flex: 42, background: CYAN, borderRadius: "3px 0 0 3px" }} />
              <div style={{ height: 4, flex: 33, background: VIOLET }} />
              <div style={{ height: 4, flex: 25, background: GREEN, borderRadius: "0 3px 3px 0" }} />
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { l: "Glycémie", v: "142", u: "mg/dL ↗", c: CYAN },
              { l: "TIR 24h",  v: "71",  u: "%",       c: GREEN },
              { l: "HbA1c",   v: "6.9", u: "%",        c: VIOLET },
              { l: "Bolus",   v: "3.5", u: "U · 2h30", c: MUTED },
            ].map(m => (
              <div key={m.l} style={{ flex: 1, background: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}`, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: MUTED, marginBottom: 3 }}>{m.l}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: m.c, letterSpacing: "-0.04em" }}>{m.v}<span style={{ fontSize: 11, fontWeight: 500 }}>{m.u}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* DECISION ZONE — right 45% — interactive only */}
        <div style={{
          width: 420, flexShrink: 0,
          display: "flex", flexDirection: "column",
          background: SURFACE2, overflow: "hidden auto",
          padding: "20px 24px", gap: 14,
        }}>
          {/* Label zone décision */}
          <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.20)", textTransform: "uppercase", letterSpacing: "0.16em", display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span>ZONE DE DÉCISION</span>
            <span style={{ flex: 1, height: 1, background: BORDER, display: "block" }} />
          </div>

          {/* Suggestion box */}
          <div style={{ background: `rgba(255,171,0,0.07)`, border: `1.5px solid rgba(255,171,0,0.22)`, borderRadius: 14, padding: "14px 18px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>Suggestion thérapeutique IA</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: BRIGHT, letterSpacing: "-0.02em", lineHeight: 1.4 }}>
              Réduire bolus de <span style={{ color: AMBER }}>10%</span>
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
              OU · 15g glucides rapides maintenant
            </div>
          </div>

          {/* ═══ CTA PRINCIPAL — taille maximale, label double ═══ */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>
              Action primaire recommandée
            </div>
            <button style={{
              width: "100%", minHeight: 64, borderRadius: 14,
              border: "none", background: AMBER,
              cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, boxShadow: `0 0 28px rgba(255,171,0,0.30)`,
            }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#07090F", letterSpacing: "-0.02em" }}>
                ✓ Appliquer la suggestion IA
              </span>
              <span style={{ fontSize: 10, color: "rgba(0,0,0,0.55)", fontWeight: 600 }}>
                Enregistre la décision · Notifie la patiente · <KbdHint keys="⌘ ↵" />
              </span>
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ fontSize: 10, color: MUTED }}>OU</span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>

          {/* ═══ CTA SECONDAIRE — modifier ═══ */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>
              Ajuster la suggestion
            </div>
            <button style={{
              width: "100%", minHeight: 56, borderRadius: 14,
              border: `2px solid rgba(255,255,255,0.18)`,
              background: "rgba(255,255,255,0.05)",
              cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: BRIGHT }}>
                ✎ Modifier et valider
              </span>
              <span style={{ fontSize: 10, color: MUTED }}>
                Ouvre l'éditeur de plan · <KbdHint keys="⌘ E" />
              </span>
            </button>
          </div>

          {/* Predicted outcomes if applied */}
          <div style={{ background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "12px 16px` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>
              Si vous appliquez · résultat estimé
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: MUTED }}>Glucose min prédit</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: GREEN }}>82 <span style={{ fontSize: 11 }}>mg/dL</span></div>
                <div style={{ fontSize: 10, color: MUTED }}>vs 64 sans action</div>
              </div>
              <div style={{ width: 1, background: BORDER }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: MUTED }}>TIR sur 24h</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: CYAN }}>+2%</div>
                <div style={{ fontSize: 10, color: MUTED }}>71% → 73%</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* ═══ CTA TERTIAIRE — ignorer (séparé, en bas) ═══ */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,69,58,0.40)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>
              Ne pas agir
            </div>
            <button style={{
              width: "100%", minHeight: 44, borderRadius: 10,
              border: `1px solid rgba(255,69,58,0.20)`,
              background: "rgba(255,69,58,0.05)",
              cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,69,58,0.70)" }}>
                Ignorer cette alerte
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,69,58,0.40)" }}>
                Requiert une annotation de motif · <KbdHint keys="Esc" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
