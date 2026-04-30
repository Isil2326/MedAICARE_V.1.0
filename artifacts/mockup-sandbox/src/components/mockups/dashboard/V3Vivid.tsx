/**
 * V3-Vivid — Éditorial Haute Saturation
 * Rupture : fond blanc MAIS palette radicalement non-médicale
 * Couleurs : orange électrique · violet · teal · citron
 * Typographie : display, heavy, éditoriale — les chiffres CRIENT
 * Layout : asymétrique · hiérarchie radicale · espace blanc agressif
 */

const PATIENTS = [
  { id: "P-001", initials: "MB", col: "#FF3B30", name: "M. Bernard",  active: false },
  { id: "P-004", initials: "IR", col: "#FF9500", name: "I. Roux",     active: false },
  { id: "P-007", initials: "MD", col: "#FF6B2B", name: "M. Dupont",   active: true  },
  { id: "P-002", initials: "JL", col: "#34C759", name: "J. Leroy",    active: false },
  { id: "P-009", initials: "CP", col: "#34C759", name: "C. Petit",    active: false },
];

const ORANGE = "#FF6B2B";
const VIOLET = "#7B2FBE";
const TEAL   = "#00B5AD";
const CITRON = "#FFD60A";
const INK    = "#0A0A0A";
const SLATE  = "#3D4451";
const LIGHT  = "#F5F4F2";

const CAUSES = [
  { icon: "↓", label: "Tendance", val: "−18 mg/dL / 45min", pct: 42, bg: "#FFF0E8", border: "#FFD5BC", color: ORANGE, barColor: ORANGE },
  { icon: "⚡", label: "Activité", val: "Exercice modéré",    pct: 33, bg: "#F3E8FF", border: "#DFC0FF", color: VIOLET, barColor: VIOLET },
  { icon: "◉", label: "Bolus actif", val: "3.5U · 2h30",    pct: 25, bg: "#E0F7F6", border: "#B3EAE8", color: TEAL,   barColor: TEAL   },
];

export function V3Vivid() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: LIGHT, fontFamily: "'Inter', system-ui, sans-serif",
      color: INK, fontSize: 13, overflow: "hidden",
    }}>

      {/* ══ NAV — lignes noires, brutal-clean ══ */}
      <nav style={{
        height: 52, background: "#FFFFFF",
        borderBottom: "2px solid " + INK,
        display: "flex", alignItems: "center",
        padding: "0 20px", gap: 12, flexShrink: 0,
      }}>
        <img src="/logo-mark.png" alt="" style={{ width: 26, height: "auto" }} />
        <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.05em", color: INK }}>
          MediAI Care
        </span>
        <div style={{ width: 1, height: 20, background: "#E5E5E5", marginLeft: 4 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: ORANGE, background: "#FFF0E8", border: "2px solid " + ORANGE, borderRadius: 6, padding: "2px 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Mode Alerte
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF3B30", boxShadow: "0 0 0 3px rgba(255,59,48,0.15)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FF3B30" }}>3 alertes</span>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: INK, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 800, marginLeft: 12 }}>DR</div>
      </nav>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* PATIENT STRIP */}
        <div style={{
          width: 58, flexShrink: 0,
          background: "#FFFFFF", borderRight: "2px solid " + INK,
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "14px 0", gap: 10,
        }}>
          <div style={{ fontSize: 7, fontWeight: 800, color: SLATE, textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "center", lineHeight: 1.4 }}>10<br/>pts</div>
          {PATIENTS.map(p => (
            <div key={p.id} style={{
              width: 36, height: 36, borderRadius: 10,
              background: p.active ? p.col : "#F5F4F2",
              border: `2px solid ${p.active ? p.col : "#E0E0E0"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 900, color: p.active ? "#FFF" : SLATE,
              cursor: "pointer",
              boxShadow: p.active ? `0 4px 14px ${p.col}50` : "none",
              outline: p.active ? `3px solid ${p.col}30` : "none",
              outlineOffset: 2,
            }}>
              {p.initials}
            </div>
          ))}
          <div style={{ fontSize: 9, color: "#C0C0C0", textAlign: "center" }}>+5</div>
        </div>

        {/* FOCUS */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ═══ ALERT HEADER — editorial, bold ═══ */}
          <div style={{
            flexShrink: 0, background: ORANGE,
            padding: "18px 28px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>
                ALERTE · IA CONFIANCE 91%
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                Marie Dupont — Hypo prédite
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.70)", marginTop: 4 }}>
                41 ans · T1D · Freestyle Libre 2 · P-007
              </div>
            </div>

            {/* Countdown — dominant */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.60)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Avant hypo estimée</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.06em", lineHeight: 0.9, fontVariantNumeric: "tabular-nums" }}>
                35:00
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", marginTop: 6 }}>Glucose prédit : 64 mg/dL</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button style={{ padding: "12px 22px", borderRadius: 10, border: "none", background: "#FFFFFF", fontSize: 14, fontWeight: 900, color: ORANGE, cursor: "pointer" }}>
                ✓ Prendre en charge
              </button>
              <button style={{ padding: "9px 22px", borderRadius: 10, border: "2px solid rgba(255,255,255,0.35)", background: "transparent", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.80)", cursor: "pointer" }}>
                Fausse alerte
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* XAI CARDS — colored backgrounds */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: SLATE, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>
                3 signaux identifiés par l'IA
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {CAUSES.map(c => (
                  <div key={c.label} style={{
                    background: c.bg, borderRadius: 16,
                    border: `2px solid ${c.border}`,
                    padding: "18px 20px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>
                        {c.icon}
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: c.color, letterSpacing: "-0.05em", lineHeight: 1 }}>
                        {c.pct}<span style={{ fontSize: 16 }}>%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: INK, letterSpacing: "-0.02em", marginBottom: 4 }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.color }}>{c.val}</div>
                    {/* bar */}
                    <div style={{ marginTop: 12, height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 3 }}>
                      <div style={{ height: 5, width: `${c.pct / 42 * 100}%`, background: c.barColor, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 9, color: SLATE, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Contribution au risque</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUGGESTION + ACTIONS */}
            <div style={{ display: "flex", gap: 14 }}>

              {/* Suggestion card */}
              <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 16, border: `2px solid ${INK}`, padding: "18px 22px" }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: SLATE, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>
                  Suggestion thérapeutique
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: INK, lineHeight: 1.3, letterSpacing: "-0.03em", marginBottom: 6 }}>
                  Réduire le prochain bolus de{" "}
                  <span style={{ color: ORANGE }}>10%</span>
                </div>
                <div style={{ fontSize: 13, color: SLATE, marginBottom: 16, lineHeight: 1.5 }}>
                  OU · Proposer 15g de glucides rapides maintenant
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { label: "Glucose min prédit", val: "82 mg/dL", sub: "vs 64 sans action", color: TEAL, bg: "#E0F7F6", b: "#B3EAE8" },
                    { label: "Impact TIR 24h", val: "+2%", sub: "71% → 73%", color: VIOLET, bg: "#F3E8FF", b: "#DFC0FF" },
                  ].map(r => (
                    <div key={r.label} style={{ flex: 1, background: r.bg, border: `1.5px solid ${r.b}`, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: r.color, letterSpacing: "-0.04em" }}>{r.val}</div>
                      <div style={{ fontSize: 10, color: SLATE, marginTop: 1 }}>{r.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div style={{ width: 196, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: SLATE, textTransform: "uppercase", letterSpacing: "0.14em" }}>Votre décision</div>
                <button style={{
                  flex: 1, borderRadius: 14, border: "2px solid " + INK,
                  background: INK, fontSize: 16, fontWeight: 900,
                  color: "#FFFFFF", cursor: "pointer", letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                }}>
                  ✓ Appliquer
                  <div style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>Valider la suggestion</div>
                </button>
                <button style={{
                  flex: 1, borderRadius: 14,
                  border: "2px solid " + INK, background: "#FFFFFF",
                  fontSize: 15, fontWeight: 800, color: INK, cursor: "pointer", lineHeight: 1.4,
                }}>
                  ✎ Modifier
                  <div style={{ fontSize: 10, fontWeight: 400, color: SLATE, marginTop: 4 }}>Ajuster et valider</div>
                </button>
                <button style={{ padding: "9px", borderRadius: 10, border: "1.5px solid #D0D0D0", background: "transparent", fontSize: 12, fontWeight: 500, color: SLATE, cursor: "pointer" }}>
                  Ignorer · Annoter
                </button>
              </div>
            </div>

            {/* Context strip */}
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1.5px solid #EBEBEB", padding: "12px 20px", display: "flex", gap: 0 }}>
              {[
                { label: "Glycémie", val: "142 mg/dL", trend: "↗", color: ORANGE },
                { label: "TIR 24h", val: "71%", trend: "✓", color: TEAL },
                { label: "HbA1c", val: "6.9%", trend: "✓", color: VIOLET },
                { label: "Bolus", val: "3.5U · 2h30", trend: "", color: SLATE },
                { label: "Capteur", val: "Libre 2 · 4j 7h", trend: "", color: SLATE },
              ].map((c, i) => (
                <div key={c.label} style={{ flex: 1, paddingLeft: i > 0 ? 16 : 0, borderLeft: i > 0 ? "1px solid #F0F0F0" : "none", marginLeft: i > 0 ? 16 : 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: c.color, letterSpacing: "-0.02em" }}>{c.val} <span style={{ fontSize: 12 }}>{c.trend}</span></div>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>
                <button style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid " + INK, background: "transparent", fontSize: 11, fontWeight: 700, color: INK, cursor: "pointer" }}>
                  Dossier →
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
