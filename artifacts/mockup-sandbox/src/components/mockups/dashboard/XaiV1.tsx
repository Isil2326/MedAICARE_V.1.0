/**
 * V1 — XAI comme Chaîne Causale
 * Axe exploré : la causalité IA représentée comme un FLUX, pas comme des barres
 * Insight : les barres de progression disent "combien" mais pas "comment A entraîne B"
 * Ce format montre le raisonnement de l'IA comme un graphe de décision clinique
 */

const PATIENTS = [
  { id: "P-001", name: "Martin Bernard", risk: "critical", glucose: 228, trend: "↑↑" },
  { id: "P-004", name: "Isabelle Roux",  risk: "high",     glucose: 172, trend: "↑" },
  { id: "P-007", name: "Marie Dupont",   risk: "moderate", glucose: 142, trend: "↗" },
  { id: "P-002", name: "Jean Leroy",     risk: "low",      glucose:  94, trend: "→" },
  { id: "P-009", name: "Claire Petit",   risk: "low",      glucose: 108, trend: "↓" },
];

const RISK_DOT: Record<string, string> = {
  critical: "#EF4444", high: "#F59E0B", moderate: "#3B82F6", low: "#22C55E",
};

const SEL = PATIENTS[2];

// Causal node definition
const CAUSES = [
  {
    icon: "📉",
    label: "Tendance glycémique",
    detail: "Descente −18 mg/dL",
    sub: "sur 45 min continus",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    confidence: "Très fort",
    confColor: "#1E40AF",
  },
  {
    icon: "🏃",
    label: "Activité physique",
    detail: "Exercice modéré",
    sub: "détecté · accéléromètre",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    confidence: "Fort",
    confColor: "#6D28D9",
  },
  {
    icon: "🍽️",
    label: "Bolus résiduel",
    detail: "3.5U actif",
    sub: "administré il y a 2h30",
    color: "#0D6657",
    bg: "#F0FDFA",
    border: "#99F6E4",
    confidence: "Modéré",
    confColor: "#0D9488",
  },
];

export function XaiV1() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "#F0F4F8", fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 13, color: "#0F172A", overflow: "hidden",
    }}>

      {/* NAV */}
      <nav style={{
        height: 52, background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 8,
        flexShrink: 0, boxShadow: "0 1px 0 rgba(15,23,42,0.04)",
      }}>
        <img src="/logo-mark.png" alt="" style={{ width: 26, height: "auto" }} />
        <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.04em" }}>
          Medi<span style={{ color: "#1565C0" }}>AI</span> Care
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#1565C0", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 20, padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Pro</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF1F1", border: "1px solid #FECACA", borderRadius: 20, padding: "5px 12px 5px 8px" }}>
          <span style={{ width: 6, height: 6, background: "#EF4444", borderRadius: "50%", display: "block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>3 alertes</span>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1565C0,#0D47A1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 800 }}>DR</div>
      </nav>

      {/* KPI */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", display: "flex", flexShrink: 0 }}>
        {[
          { icon: "👥", v: "10", label: "Patients", sub: "+2 nouveaux", color: "#1565C0", bg: "#EFF6FF", b: "#BFDBFE" },
          { icon: "⚡", v: "3",  label: "Alertes critiques", sub: "Action requise", color: "#991B1B", bg: "#FFF1F1", b: "#FECACA" },
          { icon: "🎯", v: "67%", label: "TIR cohorte", sub: "Cible ≥ 70%", color: "#0D9488", bg: "#F0FDFA", b: "#99F6E4" },
        ].map((k, i) => (
          <div key={k.label} style={{ flex: 1, padding: "12px 20px", borderRight: i < 2 ? "1px solid #F1F5F9" : "none", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: k.bg, border: `1px solid ${k.b}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: k.color, letterSpacing: "-0.05em", lineHeight: 1 }}>{k.v}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{k.label}</div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* PATIENT LIST */}
        <div style={{ width: 252, flexShrink: 0, background: "#FFFFFF", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 9, padding: "8px 11px", fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 7 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Rechercher…
            </div>
          </div>
          <div style={{ padding: "6px 14px 5px", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em" }}>Par priorité clinique</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {PATIENTS.map(p => {
              const sel = p.id === SEL.id;
              return (
                <div key={p.id} style={{
                  padding: "10px 14px", cursor: "pointer",
                  background: sel ? "#EFF6FF" : "transparent",
                  borderLeft: `3px solid ${sel ? "#1565C0" : "transparent"}`,
                  borderBottom: "1px solid #F8FAFC",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#0F172A" }}>{p.name}</span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: RISK_DOT[p.risk], display: "block", marginTop: 3, flexShrink: 0 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.glucose > 180 ? "#991B1B" : sel ? "#0D47A1" : "#475569" }}>
                    {p.glucose} {p.trend}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETAIL */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Patient header */}
          <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", padding: "12px 22px", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #BBDEFB, #64B5F6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#0D47A1", fontSize: 13 }}>MD</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>Marie Dupont</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#1E40AF", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 20, padding: "2px 8px" }}>Modéré</span>
                </div>
                <span style={{ fontSize: 11, color: "#64748B" }}>41 ans · T1D · 3 ans · P-007</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "white", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>Historique</button>
              <button style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#1565C0", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer" }}>Plan →</button>
            </div>
          </div>

          {/* Scroll */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Métriques compactes */}
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "Glycémie", val: "142", unit: "mg/dL", sub: "↗ +8/15min", color: "#0D47A1", bg: "#EFF6FF", b: "#BFDBFE" },
                { label: "TIR · 24h", val: "71%", unit: "", sub: "Cible ≥ 70% ✓", color: "#0D9488", bg: "#F0FDFA", b: "#99F6E4" },
                { label: "HbA1c", val: "6.9%", unit: "", sub: "< 7.0% ✓", color: "#7C3AED", bg: "#F5F3FF", b: "#DDD6FE" },
                { label: "Dernier bolus", val: "3.5U", unit: "", sub: "il y a 2h30", color: "#92400E", bg: "#FEFCE8", b: "#FDE68A" },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, background: "#FFFFFF", borderRadius: 12, padding: "12px 14px", border: `1px solid ${m.b}`, background: m.bg }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: m.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 3 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* ════ XAI CHAÎNE CAUSALE ════ */}
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 24px rgba(13,71,161,0.10)" }}>

              {/* Header */}
              <div style={{ background: "linear-gradient(100deg, #0A2F6E, #1565C0)", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Explication IA · 91% confiance</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF" }}>Voici comment l'IA raisonne</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#FCD34D", letterSpacing: "-0.04em", lineHeight: 1 }}>67</div>
                  <div>Score risque</div>
                </div>
              </div>

              {/* Chaîne causale */}
              <div style={{ padding: "22px 24px" }}>

                {/* LABEL */}
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
                  3 signaux combinés → prédiction → action
                </div>

                {/* FLUX: causes → risque → action */}
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>

                  {/* CAUSES */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "0 0 auto" }}>
                    {CAUSES.map((c, i) => (
                      <div key={i} style={{
                        width: 200, background: c.bg, border: `1.5px solid ${c.border}`,
                        borderRadius: 12, padding: "10px 14px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                          <span style={{ fontSize: 18 }}>{c.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.label}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>{c.detail}</div>
                        <div style={{ fontSize: 10, color: "#64748B" }}>{c.sub}</div>
                        <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, background: "white", border: `1px solid ${c.border}`, borderRadius: 20, padding: "1px 8px" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.confColor, display: "block" }} />
                          <span style={{ fontSize: 9, fontWeight: 700, color: c.confColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.confidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CONNECTEUR SVG */}
                  <div style={{ flex: "0 0 100px", position: "relative", alignSelf: "stretch" }}>
                    <svg viewBox="0 0 100 240" style={{ width: "100%", height: "100%", minHeight: 200 }} preserveAspectRatio="none">
                      {/* 3 lines converging to center */}
                      <path d="M 0 40 Q 60 40 70 120" fill="none" stroke="#BFDBFE" strokeWidth="2" strokeDasharray="5,3" />
                      <path d="M 0 120 L 70 120" fill="none" stroke="#BFDBFE" strokeWidth="2" strokeDasharray="5,3" />
                      <path d="M 0 200 Q 60 200 70 120" fill="none" stroke="#BFDBFE" strokeWidth="2" strokeDasharray="5,3" />
                      {/* Arrow */}
                      <path d="M 70 120 L 100 120" fill="none" stroke="#1565C0" strokeWidth="2.5" />
                      <polygon points="96,116 100,120 96,124" fill="#1565C0" />
                    </svg>
                  </div>

                  {/* RISQUE NODE */}
                  <div style={{
                    flex: "0 0 174px",
                    background: "linear-gradient(135deg, #0A2F6E, #0D47A1)",
                    borderRadius: 16, padding: "18px 16px",
                    textAlign: "center",
                    boxShadow: "0 4px 20px rgba(13,71,161,0.30)",
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>⚡</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 4 }}>IA prédit</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.3 }}>
                      Hypoglycémie<br />dans 35 min
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.60)" }}>Glucose estimé</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#FCD34D", letterSpacing: "-0.04em" }}>62 mg/dL</div>
                    <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.50)", background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "3px 10px" }}>
                      Intervalle 85–95%
                    </div>
                  </div>

                  {/* CONNECTEUR 2 */}
                  <div style={{ flex: "0 0 60px", position: "relative" }}>
                    <svg viewBox="0 0 60 40" style={{ width: "100%", height: 40 }}>
                      <path d="M 0 20 L 50 20" fill="none" stroke="#1565C0" strokeWidth="2.5" />
                      <polygon points="46,16 50,20 46,24" fill="#1565C0" />
                    </svg>
                  </div>

                  {/* ACTION NODE */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: "#FFF8E1", border: "1.5px solid #FDE68A", borderRadius: 14, padding: "14px 16px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6 }}>Suggestion thérapeutique</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#78350F", lineHeight: 1.4, marginBottom: 4 }}>
                        Réduire le prochain bolus de 10%
                      </div>
                      <div style={{ fontSize: 11, color: "#92400E" }}>OU · 15g glucides rapides maintenant</div>
                    </div>

                    <button style={{ width: "100%", padding: "11px", borderRadius: 11, border: "none", background: "linear-gradient(135deg, #0D47A1, #1565C0)", fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer" }}>
                      ✓ Appliquer la suggestion
                    </button>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "white", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>✎ Modifier</button>
                      <button style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "white", fontSize: 12, fontWeight: 400, color: "#94A3B8", cursor: "pointer" }}>Ignorer</button>
                    </div>
                  </div>
                </div>

                {/* Légende */}
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #F1F5F9", display: "flex", gap: 20 }}>
                  <span style={{ fontSize: 10, color: "#94A3B8", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ display: "inline-block", width: 20, height: 1, background: "#BFDBFE", borderTop: "2px dashed #BFDBFE" }} />
                    Signal d'entrée
                  </span>
                  <span style={{ fontSize: 10, color: "#94A3B8", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ display: "inline-block", width: 20, height: 2, background: "#1565C0", borderRadius: 1 }} />
                    Inférence IA
                  </span>
                  <span style={{ fontSize: 10, color: "#94A3B8" }}>
                    Modèle : Réseau bayésien · v2.4 · Entraîné sur 12 000 patients
                  </span>
                </div>
              </div>
            </div>

            {/* CGM Mini */}
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "10px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Courbe CGM · 3h</span>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>Temps réel</span>
              </div>
              <div style={{ padding: "10px 18px", height: 70 }}>
                <svg viewBox="0 0 400 56" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                  <rect x="0" y="8" width="400" height="36" fill="rgba(21,101,192,0.04)" />
                  <line x1="0" y1="8" x2="400" y2="8" stroke="rgba(21,101,192,0.20)" strokeWidth="1" strokeDasharray="4,3" />
                  <line x1="0" y1="44" x2="400" y2="44" stroke="rgba(239,68,68,0.22)" strokeWidth="1" strokeDasharray="4,3" />
                  <polyline points="0,32 57,28 114,26 171,22 228,20 286,18 343,20 400,19" fill="none" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="400" cy="19" r="4" fill="#1565C0" />
                  {["−3h","−1h30","Maintenant"].map((t,i) => (
                    <text key={t} x={[0,200,396][i]} y="54" fontSize="7" fill="#CBD5E1" textAnchor={i===2?"end":"start"}>{t}</text>
                  ))}
                </svg>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
