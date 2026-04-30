/**
 * V2 — Timeline Primaire
 * Axe exploré : inverser la hiérarchie — la courbe CGM devient le centre de gravité
 * Insight : les médecins sont entraînés à lire les courbes glycémiques en premier.
 * L'IA devrait ANNOTER ce que le clinicien regarde déjà, pas créer un nouveau bloc.
 * Les facteurs XAI apparaissent comme des marqueurs temporels SUR la timeline.
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

// Timeline events (x position as % of chart width 0-100)
// Measured: 0-55%, Predicted: 55-100%
const EVENTS = [
  { x: 18, icon: "🍽️", label: "Bolus 3.5U", y: 35, color: "#0D9488", above: true },
  { x: 38, icon: "🏃", label: "Activité", y: 25, color: "#7C3AED", above: false },
  { x: 55, icon: "📍", label: "Maintenant\n142 mg/dL", y: 18, color: "#1565C0", above: true },
];

export function XaiV2() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "#F0F4F8", fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 13, color: "#0F172A", overflow: "hidden",
    }}>

      {/* NAV */}
      <nav style={{
        height: 52, background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 8, flexShrink: 0,
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

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* PATIENT LIST — compact */}
        <div style={{
          width: 236, flexShrink: 0, background: "#FFFFFF",
          borderRight: "1px solid #E2E8F0",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 9, padding: "8px 11px", fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 7 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Rechercher…
            </div>
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
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#0F172A" }}>{p.name}</span>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: RISK_DOT[p.risk], display: "block", marginTop: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.glucose > 180 ? "#991B1B" : sel ? "#0D47A1" : "#475569" }}>
                    {p.glucose} mg/dL {p.trend}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETAIL — timeline-first */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Patient strip (compact) */}
          <div style={{
            background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
            padding: "10px 22px", flexShrink: 0,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#BBDEFB,#64B5F6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#0D47A1", fontSize: 12 }}>MD</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>Marie Dupont</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#1E40AF", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 20, padding: "2px 8px" }}>Modéré</span>
                </div>
                <span style={{ fontSize: 11, color: "#64748B" }}>41 ans · T1D · Freestyle Libre 2 · P-007</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button style={{ padding: "6px 13px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "white", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>Historique</button>
              <button style={{ padding: "6px 13px", borderRadius: 8, border: "none", background: "#1565C0", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer" }}>Plan →</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* ════ TIMELINE HERO — primary visual ════ */}
            <div style={{
              background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0",
              overflow: "hidden", boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
            }}>
              {/* Chart header */}
              <div style={{ padding: "14px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                    Courbe glycémique · −3h → +2h
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                    Mesuré (trait plein) · Prédit par IA (trait pointillé) · Événements annotés
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#94A3B8", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ display: "inline-block", width: 16, height: 2, background: "#1565C0", borderRadius: 1 }} />
                    Mesuré
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ display: "inline-block", width: 16, height: 2, background: "#1565C0", borderRadius: 1, opacity: 0.4, borderTop: "2px dashed #1565C0", height: 0 }} />
                    Prédit
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(239,68,68,0.12)", borderRadius: 2, border: "1px solid rgba(239,68,68,0.3)" }} />
                    Zone de risque
                  </span>
                </div>
              </div>

              {/* Big chart */}
              <div style={{ padding: "0 20px 16px", height: 220, position: "relative" }}>
                <svg viewBox="0 0 560 180" style={{ width: "100%", height: "100%", overflow: "visible" }} preserveAspectRatio="none">

                  {/* Y axis labels */}
                  <text x="-2" y="22" fontSize="8" fill="#94A3B8" textAnchor="end">250</text>
                  <text x="-2" y="64" fontSize="8" fill="rgba(21,101,192,0.6)" textAnchor="end">180</text>
                  <text x="-2" y="118" fontSize="8" fill="rgba(239,68,68,0.6)" textAnchor="end">70</text>
                  <text x="-2" y="160" fontSize="8" fill="#94A3B8" textAnchor="end">50</text>

                  {/* Grid lines */}
                  <line x1="0" y1="64" x2="560" y2="64" stroke="rgba(21,101,192,0.15)" strokeWidth="1" strokeDasharray="4,3" />
                  <line x1="0" y1="118" x2="560" y2="118" stroke="rgba(239,68,68,0.18)" strokeWidth="1" strokeDasharray="4,3" />

                  {/* Target zone fill */}
                  <rect x="0" y="64" width="560" height="54" fill="rgba(21,101,192,0.04)" />

                  {/* Prediction zone background */}
                  <rect x="308" y="0" width="252" height="180" fill="rgba(148,163,184,0.05)" />

                  {/* PREDICTION CONE (uncertainty) */}
                  <polygon
                    points="308,80 364,95 420,118 476,138 532,152 560,160 560,180 532,175 476,168 420,158 364,148 308,132"
                    fill="rgba(21,101,192,0.06)"
                  />

                  {/* Measured curve */}
                  <polyline
                    points="0,110 56,98 112,90 168,80 224,76 280,74 308,80"
                    fill="none" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                  {/* Predicted mean */}
                  <polyline
                    points="308,80 364,95 420,118 476,138 532,152 560,160"
                    fill="none" stroke="#1565C0" strokeWidth="2" strokeDasharray="6,4" strokeLinecap="round"
                  />

                  {/* NOW marker */}
                  <line x1="308" y1="0" x2="308" y2="180" stroke="#1565C0" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5" />
                  <circle cx="308" cy="80" r="6" fill="#1565C0" />
                  <circle cx="308" cy="80" r="11" fill="rgba(21,101,192,0.12)" />

                  {/* IA ANNOTATION — Hypo prédite */}
                  <line x1="448" y1="0" x2="448" y2="180" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
                  <rect x="318" y="4" width="180" height="52" rx="8" fill="#FEF2F2" stroke="#FECACA" strokeWidth="1" />
                  <text x="328" y="20" fontSize="8.5" fontWeight="700" fill="#991B1B">⚡ IA PRÉDIT — Hypoglycémie</text>
                  <text x="328" y="33" fontSize="8" fill="#B91C1C">dans ~35 min · Glycémie estimée : 64 mg/dL</text>
                  <text x="328" y="46" fontSize="8" fill="#EF4444">Confiance : 91% · Score : 67/100</text>

                  {/* Hypo zone fill */}
                  <rect x="420" y="118" width="140" height="62" fill="rgba(239,68,68,0.08)" />

                  {/* EVENT ANNOTATIONS */}
                  {/* Bolus (at x~100, y~90) */}
                  <line x1="100" y1="90" x2="100" y2="145" stroke="#0D9488" strokeWidth="1" strokeDasharray="2,2" />
                  <rect x="46" y="145" width="108" height="26" rx="5" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="1" />
                  <text x="100" y="157" fontSize="8" fontWeight="700" fill="#0D6657" textAnchor="middle">🍽️ Bolus 3.5U · −2h30</text>
                  <text x="100" y="167" fontSize="7" fill="#0D9488" textAnchor="middle">Effet résiduel actif</text>

                  {/* Activity (at x~210, y~76) */}
                  <line x1="210" y1="76" x2="210" y2="145" stroke="#7C3AED" strokeWidth="1" strokeDasharray="2,2" />
                  <rect x="162" y="145" width="96" height="26" rx="5" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1" />
                  <text x="210" y="157" fontSize="8" fontWeight="700" fill="#6D28D9" textAnchor="middle">🏃 Activité · −45min</text>
                  <text x="210" y="167" fontSize="7" fill="#7C3AED" textAnchor="middle">Intensité modérée</text>

                  {/* X axis time labels */}
                  {[
                    { x: 0, label: "−3h" }, { x: 112, label: "−2h" }, { x: 224, label: "−1h" },
                    { x: 308, label: "Maintenant" }, { x: 420, label: "+1h" }, { x: 532, label: "+2h" },
                  ].map(t => (
                    <text key={t.label} x={t.x} y="178" fontSize="7.5" fill={t.x === 308 ? "#1565C0" : "#94A3B8"}
                      textAnchor={t.x === 0 ? "start" : t.x === 532 ? "end" : "middle"} fontWeight={t.x === 308 ? "700" : "400"}>
                      {t.label}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* ════ XAI inline compact ════ */}
            <div style={{
              background: "linear-gradient(100deg, #06193D, #0D47A1)",
              borderRadius: 14, padding: "16px 20px",
              boxShadow: "0 4px 20px rgba(13,71,161,0.20)",
            }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 20 }}>🤖</span>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Explication IA</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF" }}>⚡ Hypo dans 35 min</div>
                  </div>
                </div>

                {/* Factors horizontal */}
                <div style={{ flex: 1, display: "flex", gap: 10 }}>
                  {[
                    { icon: "📉", label: "Tendance ↓", detail: "−18 mg/dL / 45min", pct: 42, color: "#93C5FD" },
                    { icon: "🏃", label: "Activité", detail: "Modérée détectée", pct: 33, color: "#C4B5FD" },
                    { icon: "🍽️", label: "Bolus actif", detail: "3.5U résiduel", pct: 25, color: "#6EE7B7" },
                  ].map(f => (
                    <div key={f.label} style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.10)" }}>
                      <div style={{ fontSize: 16, marginBottom: 3 }}>{f.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: f.color }}>{f.label} · {f.pct}%</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.50)", marginTop: 1 }}>{f.detail}</div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", background: "rgba(252,211,77,0.15)", border: "1px solid rgba(252,211,77,0.30)", borderRadius: 8, padding: "6px 10px", lineHeight: 1.4 }}>
                    Réduire bolus 10% ou 15g glucides
                  </div>
                  <button style={{ width: "100%", padding: "8px", borderRadius: 9, border: "none", background: "#FFFFFF", fontSize: 12, fontWeight: 700, color: "#0D47A1", cursor: "pointer" }}>
                    ✓ Appliquer
                  </button>
                  <button style={{ width: "100%", padding: "8px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.20)", background: "rgba(255,255,255,0.08)", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.70)", cursor: "pointer" }}>
                    Modifier / Ignorer
                  </button>
                </div>
              </div>
            </div>

            {/* MÉTRIQUES secondaires (compactes) */}
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "Glycémie", val: "142 mg/dL", sub: "↗ +8/15min", color: "#0D47A1", bg: "#EFF6FF", b: "#BFDBFE" },
                { label: "TIR 24h", val: "71%", sub: "Cible ≥ 70% ✓", color: "#0D9488", bg: "#F0FDFA", b: "#99F6E4" },
                { label: "HbA1c", val: "6.9%", sub: "< 7.0% ✓", color: "#7C3AED", bg: "#F5F3FF", b: "#DDD6FE" },
                { label: "Dernier bolus", val: "3.5U", sub: "il y a 2h30", color: "#92400E", bg: "#FEFCE8", b: "#FDE68A" },
                { label: "Prochain RDV", val: "Lun 12", sub: "Dr. Laurent", color: "#475569", bg: "#F8FAFC", b: "#E2E8F0" },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, background: m.bg, border: `1px solid ${m.b}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: m.color, letterSpacing: "-0.03em" }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{m.sub}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
