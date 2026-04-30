/**
 * V3-Dark — Salle de Contrôle Médicale
 * Rupture totale : fond quasi-noir · couleurs électriques · typo display
 * Inspiré : Vercel · Linear · dashboards de mission critique
 * "Quand chaque seconde compte, l'UI doit crier sans bruit"
 */

const PATIENTS = [
  { id: "P-001", initials: "MB", risk: "#EF4444", active: false, name: "M. Bernard" },
  { id: "P-004", initials: "IR", risk: "#F59E0B", active: false, name: "I. Roux" },
  { id: "P-007", initials: "MD", risk: "#F59E0B", active: true,  name: "M. Dupont" },
  { id: "P-002", initials: "JL", risk: "#34D399", active: false, name: "J. Leroy" },
  { id: "P-009", initials: "CP", risk: "#34D399", active: false, name: "C. Petit" },
];

const BG = "#07090F";
const SURFACE = "#0E1118";
const BORDER = "rgba(255,255,255,0.07)";
const AMBER  = "#FFAB00";
const AMBER_DIM = "rgba(255,171,0,0.12)";
const CYAN   = "#00E5FF";
const PURPLE = "#BF5AF2";
const GREEN  = "#30D158";
const MUTED  = "rgba(255,255,255,0.40)";
const BRIGHT = "#FFFFFF";

const CAUSES = [
  { icon: "↓", label: "Tendance glycémique", val: "−18 mg/dL", sub: "sur 45 min", pct: 42, color: CYAN,   glow: "rgba(0,229,255,0.15)" },
  { icon: "⚡", label: "Activité physique",   val: "Modérée",   sub: "accéléromètre", pct: 33, color: PURPLE, glow: "rgba(191,90,242,0.12)" },
  { icon: "◉", label: "Bolus résiduel",       val: "3.5U actif", sub: "il y a 2h30", pct: 25, color: GREEN,  glow: "rgba(48,209,88,0.10)" },
];

export function V3Dark() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: BG, fontFamily: "'Inter', system-ui, sans-serif",
      color: BRIGHT, fontSize: 13, overflow: "hidden",
    }}>

      {/* ══ NAV — minimal, dark ══ */}
      <nav style={{
        height: 48, display: "flex", alignItems: "center",
        padding: "0 20px", gap: 8, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
        background: SURFACE,
      }}>
        <img src="/logo-mark.png" alt="" style={{ width: 24, height: "auto", filter: "brightness(0) invert(1) opacity(0.85)" }} />
        <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: "-0.04em", color: BRIGHT }}>
          Medi<span style={{ color: AMBER }}>AI</span> Care
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: AMBER, background: AMBER_DIM, border: "1px solid rgba(255,171,0,0.25)", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Clinicien Pro
        </span>
        <div style={{ flex: 1 }} />

        {/* Pulse alert */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 6, padding: "5px 12px",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444",
                         boxShadow: "0 0 0 4px rgba(239,68,68,0.15)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#EF4444" }}>3 alertes actives</span>
        </div>

        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 11, fontWeight: 700, marginLeft: 12 }}>DR</div>
      </nav>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* PATIENT STRIP — glowing dots */}
        <div style={{
          width: 52, flexShrink: 0, display: "flex", flexDirection: "column",
          alignItems: "center", padding: "16px 0", gap: 12,
          borderRight: `1px solid ${BORDER}`, background: SURFACE,
        }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.10em", textAlign: "center", lineHeight: 1.4 }}>
            10<br />pts
          </div>
          {PATIENTS.map(p => (
            <div key={p.id} style={{
              width: 34, height: 34, borderRadius: "50%", cursor: "pointer",
              background: p.active ? AMBER_DIM : "rgba(255,255,255,0.04)",
              border: `1.5px solid ${p.active ? AMBER : p.risk + "55"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 800, color: p.active ? AMBER : MUTED,
              boxShadow: p.active
                ? `0 0 0 4px ${AMBER_DIM}, 0 0 14px ${AMBER_DIM}`
                : `0 0 6px ${p.risk}22`,
              position: "relative",
            }}>
              {p.initials}
              {!p.active && <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: p.risk, border: "1.5px solid " + BG }} />}
            </div>
          ))}
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.20)", textAlign: "center" }}>+5</div>
        </div>

        {/* FOCUS ZONE */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ═══ ALERT HEADER ═══ */}
          <div style={{
            flexShrink: 0, padding: "16px 24px",
            background: `linear-gradient(135deg, rgba(255,171,0,0.08) 0%, rgba(255,171,0,0.03) 100%)`,
            borderBottom: `1px solid rgba(255,171,0,0.15)`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            {/* Left: identity + alert label */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: AMBER_DIM, border: `1.5px solid rgba(255,171,0,0.35)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, color: AMBER, fontSize: 13,
                boxShadow: `0 0 16px rgba(255,171,0,0.20)`,
              }}>MD</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>
                  ⚡ Alerte prioritaire · IA confiance 91%
                </div>
                <div style={{ fontSize: 19, fontWeight: 900, color: BRIGHT, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                  Marie Dupont · Hypoglycémie prédite
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
                  41 ans · T1D · P-007 · Freestyle Libre 2
                </div>
              </div>
            </div>

            {/* COUNTDOWN — hero display */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>
                Temps avant événement
              </div>
              <div style={{
                fontSize: 60, fontWeight: 900, color: AMBER,
                letterSpacing: "-0.06em", lineHeight: 1,
                textShadow: `0 0 30px ${AMBER}55, 0 0 60px ${AMBER}22`,
                fontVariantNumeric: "tabular-nums",
              }}>
                35:00
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,171,0,0.55)", marginTop: 2 }}>
                Glucose prédit : 64 mg/dL
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 168 }}>
              <button style={{
                padding: "10px 18px", borderRadius: 9,
                border: "none", background: AMBER,
                fontSize: 13, fontWeight: 800, color: "#07090F",
                cursor: "pointer", letterSpacing: "-0.01em",
                boxShadow: `0 0 20px ${AMBER}44`,
              }}>
                ✓ Prendre en charge
              </button>
              <button style={{
                padding: "8px 18px", borderRadius: 9,
                border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)",
                fontSize: 12, fontWeight: 600, color: MUTED, cursor: "pointer",
              }}>
                Fausse alerte
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* ═══ XAI CARDS — vivid on dark ═══ */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>
                Pourquoi l'IA prédit ce risque — 3 signaux combinés
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {CAUSES.map(c => (
                  <div key={c.label} style={{
                    background: SURFACE, borderRadius: 14,
                    border: `1px solid ${c.color}30`,
                    padding: "16px 18px",
                    boxShadow: `0 0 20px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                    position: "relative", overflow: "hidden",
                  }}>
                    {/* Glow accent top */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${c.color}, transparent)`, borderRadius: "14px 14px 0 0" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${c.color}15`, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: c.color, fontWeight: 900 }}>
                        {c.icon}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: c.color, letterSpacing: "-0.04em" }}>{c.pct}%</div>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: BRIGHT, marginBottom: 3 }}>{c.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: c.color, marginBottom: 2 }}>{c.val}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{c.sub}</div>

                    {/* Contribution bar */}
                    <div style={{ marginTop: 12, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ height: 3, width: `${c.pct / 42 * 100}%`, background: c.color, borderRadius: 2, boxShadow: `0 0 6px ${c.color}` }} />
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Contribution</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUGGESTION + OUTCOMES */}
            <div style={{ display: "flex", gap: 12 }}>

              {/* Suggestion */}
              <div style={{ flex: 1, background: SURFACE, borderRadius: 14, border: `1px solid ${AMBER}25`, padding: "16px 20px", boxShadow: `0 0 24px rgba(255,171,0,0.06)` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>Suggestion thérapeutique · IA</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: BRIGHT, lineHeight: 1.3, marginBottom: 4, letterSpacing: "-0.02em" }}>
                  Réduire le prochain bolus de <span style={{ color: AMBER }}>10%</span>
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>
                  OU · Suggérer 15g de glucides rapides maintenant
                </div>

                {/* Outcomes */}
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { label: "Glucose min prédit", val: "82", unit: "mg/dL", sub: "vs 64 sans action", color: GREEN },
                    { label: "TIR si action", val: "+2%", unit: "", sub: "71% → 73% sur 24h", color: CYAN },
                    { label: "Confiance IA", val: "91", unit: "%", sub: "Modèle v2.4", color: PURPLE },
                  ].map(o => (
                    <div key={o.label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 3 }}>{o.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: o.color, letterSpacing: "-0.04em" }}>{o.val}<span style={{ fontSize: 13, fontWeight: 500 }}>{o.unit}</span></div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{o.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Big CTAs */}
              <div style={{ width: 188, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.14em" }}>Votre décision</div>
                <button style={{
                  flex: 1, borderRadius: 12, border: "none",
                  background: `linear-gradient(135deg, ${AMBER}, #FF8C00)`,
                  fontSize: 15, fontWeight: 900, color: "#07090F",
                  cursor: "pointer", letterSpacing: "-0.02em",
                  boxShadow: `0 4px 20px ${AMBER}44`,
                  lineHeight: 1.4,
                }}>
                  ✓ Appliquer
                  <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.65, marginTop: 3 }}>Valider la suggestion</div>
                </button>
                <button style={{
                  flex: 1, borderRadius: 12, border: `1.5px solid rgba(255,255,255,0.12)`,
                  background: "rgba(255,255,255,0.05)",
                  fontSize: 14, fontWeight: 700, color: BRIGHT,
                  cursor: "pointer", lineHeight: 1.4,
                }}>
                  ✎ Modifier
                  <div style={{ fontSize: 10, fontWeight: 400, color: MUTED, marginTop: 3 }}>Ajuster et valider</div>
                </button>
                <button style={{ padding: "9px", borderRadius: 9, border: `1px solid ${BORDER}`, background: "transparent", fontSize: 12, fontWeight: 500, color: MUTED, cursor: "pointer" }}>
                  Ignorer · Annoter
                </button>
              </div>
            </div>

            {/* Context bar */}
            <div style={{
              background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}`,
              padding: "12px 18px", display: "flex", gap: 24, alignItems: "center",
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.14em", flexShrink: 0 }}>Contexte</div>
              {[
                { label: "Glycémie", val: "142 mg/dL ↗", color: CYAN },
                { label: "TIR 24h", val: "71%", color: GREEN },
                { label: "HbA1c", val: "6.9%", color: PURPLE },
                { label: "Bolus", val: "3.5U · 2h30", color: AMBER },
                { label: "Capteur", val: "Libre 2 · 4j 7h", color: BRIGHT },
              ].map(c => (
                <div key={c.label}>
                  <div style={{ fontSize: 9, color: MUTED, marginBottom: 2 }}>{c.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: c.color }}>{c.val}</div>
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <button style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", fontSize: 11, fontWeight: 600, color: MUTED, cursor: "pointer" }}>
                Dossier complet →
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
