/**
 * DIRECTION B — Radar de Risque XAI
 * Principe : Signal visuel · Widget IA explicable · Prédiction timeline
 * Design pro : couleurs médicales · hiérarchie forte · above the fold = tout visible
 */

const PATIENTS_ALERTS = [
  { name: "Martin Bernard", age: 68, risk: 92, glucose: 228, delta: "+22/15min", status: "Hyper active", color: "#EF4444", bg: "#FEF2F2" },
  { name: "Isabelle Roux", age: 54, risk: 71, glucose: 172, delta: "+12/15min", status: "Hausse rapide", color: "#F59E0B", bg: "#FFFBEB" },
  { name: "Marie Dupont", age: 41, risk: 58, glucose: 142, delta: "+8/15min", status: "Surveillance", color: "#3B82F6", bg: "#EFF6FF" },
];

const TIMELINE_POINTS = [
  { t: "-2h", g: 118, predicted: false },
  { t: "-1h30", g: 125, predicted: false },
  { t: "-1h", g: 134, predicted: false },
  { t: "-30m", g: 139, predicted: false },
  { t: "Maintenant", g: 142, predicted: false },
  { t: "+30m", g: 132, predicted: true },
  { t: "+1h", g: 108, predicted: true },
  { t: "+1h30", g: 81, predicted: true },
  { t: "+2h", g: 64, predicted: true },
];

// Map glucose to Y position (70–200 range → 0–100%)
const gToY = (g: number) => Math.max(0, Math.min(100, 100 - ((g - 50) / 180) * 100));

export function ClinicDashB() {
  const pts = TIMELINE_POINTS.map((p, i) => ({
    ...p,
    x: (i / (TIMELINE_POINTS.length - 1)) * 100,
    y: gToY(p.glucose),
  }));

  const svgPts = pts.map(p => `${p.x * 4},${p.y * 1.3}`).join(" ");
  const svgPredPts = pts.filter(p => !p.predicted).slice(-1).concat(pts.filter(p => p.predicted)).map(p => `${p.x * 4},${p.y * 1.3}`).join(" ");

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column",
                  background: "#F0F4F8", fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13, color: "#0F172A", overflow: "hidden" }}>

      {/* ════ NAV ════ */}
      <nav style={{ height: 52, background: "#0D47A1", display: "flex", alignItems: "center",
                    padding: "0 20px", gap: 16, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo-mark.png" alt="" style={{ width: 26, height: "auto", filter: "brightness(0) invert(1)" }} />
          <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.03em", color: "white" }}>
            MediAI Care
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
                         background: "rgba(255,255,255,0.1)", padding: "2px 8px",
                         borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Clinicien
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Patient context pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 8,
                      background: "rgba(255,255,255,0.12)", borderRadius: 8,
                      padding: "5px 14px", border: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%",
                        background: "linear-gradient(135deg, #90CAF9, #42A5F5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "#0D47A1" }}>MD</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Marie Dupont</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>41 ans · T1D</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>▾</span>
        </div>

        <button style={{ padding: "6px 14px", borderRadius: 7,
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "rgba(255,255,255,0.75)", fontSize: 12,
                          fontWeight: 600, cursor: "pointer" }}>
          ← Retour cohorte
        </button>

        <div style={{ width: 32, height: 32, borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", color: "white",
                      fontSize: 12, fontWeight: 700 }}>DR</div>
      </nav>

      {/* ════ MAIN GRID ════ */}
      <div style={{ flex: 1, display: "grid",
                    gridTemplateColumns: "1fr 340px",
                    gridTemplateRows: "auto 1fr",
                    gap: 12, padding: 12, overflow: "hidden" }}>

        {/* ── COLONNE GAUCHE ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden", minHeight: 0 }}>

          {/* Ligne 1: KPIs inline */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: "💉", label: "Glycémie", val: "142", unit: "mg/dL", sub: "↗ hausse modérée", color: "#1565C0", border: "#BBDEFB" },
              { icon: "🎯", label: "TIR 24h", val: "71%", unit: "", sub: "Cible ≥ 70% ✓", color: "#0D9488", border: "#99F6E4" },
              { icon: "⏱️", label: "Capteur", val: "4j 7h", unit: "", sub: "Libre 2 · Actif", color: "#7C3AED", border: "#DDD6FE" },
              { icon: "💊", label: "Dernier bolus", val: "3.5U", unit: "", sub: "Il y a 2h30", color: "#92400E", border: "#FDE68A" },
            ].map(k => (
              <div key={k.label} style={{ flex: 1, background: "#FFFFFF", borderRadius: 10,
                                          padding: "12px 14px",
                                          border: `1px solid ${k.border}`,
                                          boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8",
                               textTransform: "uppercase", letterSpacing: "0.08em",
                               display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  {k.icon} {k.label}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: k.color,
                                  letterSpacing: "-0.04em" }}>{k.val}</span>
                  {k.unit && <span style={{ fontSize: 12, color: "#94A3B8" }}>{k.unit}</span>}
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ════ XAI WIDGET + RADAR ════ */}
          <div style={{ display: "flex", gap: 12, flex: "0 0 auto" }}>

            {/* XAI Widget */}
            <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 12,
                          border: "1px solid #E2E8F0", overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
              {/* Header */}
              <div style={{ background: "linear-gradient(90deg, #0D47A1 0%, #1565C0 100%)",
                             padding: "12px 18px", display: "flex",
                             alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)",
                                   textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Explication IA · Confiance 91%
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF" }}>
                      Risque d'hypoglycémie dans 35 min
                    </div>
                  </div>
                </div>
                {/* Confidence bar */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#FCD34D" }}>91%</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Confiance</div>
                </div>
              </div>

              <div style={{ padding: "14px 18px" }}>
                {/* Facteurs causaux */}
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B",
                               textTransform: "uppercase", letterSpacing: "0.08em",
                               marginBottom: 8 }}>Facteurs déclenchants identifiés</div>

                {[
                  { icon: "📉", label: "Tendance glycémique", detail: "Descente de −18 mg/dL sur 45 min", weight: 42, color: "#1565C0" },
                  { icon: "🏃", label: "Activité physique", detail: "Détectée via accéléromètre · intensité modérée", weight: 33, color: "#7C3AED" },
                  { icon: "🍽️", label: "Bolus post-repas", detail: "3.5U il y a 2h30 · effet résiduel estimé", weight: 25, color: "#0D9488" },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                                   alignItems: "center", marginBottom: 3 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 13 }}>{f.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{f.label}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: f.color }}>{f.weight}%</span>
                    </div>
                    <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2 }}>
                      <div style={{ height: 4, width: `${f.weight}%`, background: f.color,
                                     borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{f.detail}</div>
                  </div>
                ))}

                {/* Suggestion */}
                <div style={{ marginTop: 10, background: "#FFF8E1", border: "1px solid #FDE68A",
                               borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#92400E",
                                 textTransform: "uppercase", letterSpacing: "0.08em",
                                 marginBottom: 4 }}>Suggestion thérapeutique</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#78350F" }}>
                    Réduire prochain bolus de 10% · OU ·  15g glucides rapides maintenant
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button style={{ flex: 1, padding: "8px", borderRadius: 8,
                                    background: "#0D47A1", border: "none",
                                    fontWeight: 700, fontSize: 12, color: "white",
                                    cursor: "pointer" }}>
                    ✓ Valider
                  </button>
                  <button style={{ flex: 1, padding: "8px", borderRadius: 8,
                                    background: "#F1F5F9", border: "1.5px solid #E2E8F0",
                                    fontWeight: 600, fontSize: 12, color: "#475569",
                                    cursor: "pointer" }}>
                    ✎ Modifier
                  </button>
                  <button style={{ padding: "8px 12px", borderRadius: 8,
                                    background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                                    fontWeight: 500, fontSize: 12, color: "#94A3B8",
                                    cursor: "pointer" }}>
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Radar de Risque */}
            <div style={{ width: 200, background: "#FFFFFF", borderRadius: 12,
                          border: "1px solid #E2E8F0", padding: "14px 16px",
                          boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                          display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8",
                             textTransform: "uppercase", letterSpacing: "0.08em",
                             marginBottom: 12 }}>Radar de Risque</div>

              {/* Arc gauge */}
              <div style={{ position: "relative", width: 140, height: 80, overflow: "hidden" }}>
                <svg viewBox="0 0 140 80" style={{ width: "100%", height: "100%" }}>
                  {/* Background arcs */}
                  <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="#E2E8F0" strokeWidth="14" strokeLinecap="round" />
                  {/* Risk fill (58% = about 105 degrees) */}
                  <path d="M 10 75 A 60 60 0 0 1 80 17" fill="none" stroke="url(#riskGrad)" strokeWidth="14" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22C55E" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                  {/* Needle */}
                  <line x1="70" y1="75" x2="80" y2="20" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="70" cy="75" r="5" fill="#1565C0" />
                </svg>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                               textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#F59E0B",
                                 letterSpacing: "-0.04em" }}>58</div>
                  <div style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase",
                                 letterSpacing: "0.08em", marginTop: -2 }}>/ 100</div>
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#92400E",
                             background: "#FFFBEB", border: "1px solid #FDE68A",
                             borderRadius: 6, padding: "3px 10px" }}>
                Risque Modéré
              </div>

              {/* Legend */}
              <div style={{ width: "100%", marginTop: 12, display: "flex",
                             flexDirection: "column", gap: 4 }}>
                {[
                  { label: "Stable",   range: "0–30",  color: "#22C55E" },
                  { label: "Modéré",   range: "31–60", color: "#F59E0B", active: true },
                  { label: "Élevé",    range: "61–80", color: "#F97316" },
                  { label: "Critique", range: "81–100", color: "#EF4444" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", justifyContent: "space-between",
                                              alignItems: "center",
                                              padding: "3px 6px", borderRadius: 5,
                                              background: l.active ? "#FFF8E1" : "transparent" }}>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
                      <span style={{ fontSize: 11, fontWeight: l.active ? 700 : 400,
                                      color: l.active ? "#92400E" : "#64748B" }}>{l.label}</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>{l.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════ COURBE PRÉDICTIVE ════ */}
          <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 1px 3px rgba(15,23,42,0.04)", overflow: "hidden",
                        minHeight: 0 }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #F1F5F9",
                           display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>
                  Courbe CGM + Prédiction IA
                </span>
                <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: 10 }}>
                  −2h → Maintenant → +2h
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748B" }}>
                <span>── Mesuré</span>
                <span style={{ color: "#1565C0" }}>- - Prédit</span>
                <span style={{ color: "#22C55E" }}>░ Zone cible (70–180)</span>
              </div>
            </div>
            <div style={{ padding: "12px 18px 8px", height: 120 }}>
              <svg viewBox="0 0 400 100" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                {/* Target zone 70-180 */}
                <rect x="0" y="11" width="400" height="61" fill="rgba(21,101,192,0.05)" />
                <line x1="0" y1="11" x2="400" y2="11" stroke="rgba(21,101,192,0.25)" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="72" x2="400" y2="72" stroke="rgba(239,68,68,0.35)" strokeWidth="1" strokeDasharray="4,4" />

                {/* Measured curve */}
                <polyline
                  points="0,68 44,64 89,60 133,54 178,52 222,50"
                  fill="none" stroke="#1565C0" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                />
                {/* Prediction cone */}
                <polygon
                  points="222,50 267,56 311,72 356,84 400,92 400,104 356,100 311,88 267,68 222,50"
                  fill="rgba(21,101,192,0.08)"
                />
                {/* Predicted mean */}
                <polyline
                  points="222,50 267,56 311,72 356,84 400,92"
                  fill="none" stroke="#1565C0" strokeWidth="2" strokeDasharray="5,4"
                  strokeLinecap="round" strokeLinejoin="round"
                />

                {/* Hypo threshold label */}
                <circle cx="222" cy="50" r="5" fill="#1565C0" />
                {/* Projected hypo zone */}
                <rect x="311" y="72" width="89" height="28" fill="rgba(239,68,68,0.08)" />

                {/* Time labels */}
                {["-2h", "-1h", "Maintenant", "+1h", "+2h"].map((t, i) => (
                  <text key={t} x={i * 100} y="98" fontSize="8"
                        fill="#94A3B8" textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>
                    {t}
                  </text>
                ))}
                <text x="222" y="11" fontSize="8" fill="#94A3B8" textAnchor="middle">│</text>
              </svg>
            </div>
            {/* Annotation */}
            <div style={{ padding: "0 18px 12px", display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "#FEF2F2", border: "1px solid #FECACA",
                             borderRadius: 7, padding: "6px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C" }}>
                  ⚠ Prédiction : Hypo à +1h30 (64 mg/dL)
                </div>
                <div style={{ fontSize: 10, color: "#EF4444", marginTop: 1 }}>
                  Intervalle de confiance 85–95%
                </div>
              </div>
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE",
                             borderRadius: 7, padding: "6px 12px", display: "flex",
                             alignItems: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1565C0" }}>
                  142 mg/dL · maintenant
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── COLONNE DROITE — Alertes prioritaires ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden", minHeight: 0 }}>

          {/* Autres patients en alerte */}
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E2E8F0",
                        boxShadow: "0 1px 3px rgba(15,23,42,0.04)", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9",
                           display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#0F172A" }}>
                Alertes prioritaires
              </span>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>3 / 10 patients</span>
            </div>
            {PATIENTS_ALERTS.map(p => (
              <div key={p.name} style={{ padding: "10px 16px", borderBottom: "1px solid #F8FAFC",
                                          display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: p.bg,
                               display: "flex", alignItems: "center", justifyContent: "center",
                               fontSize: 10, fontWeight: 800, color: p.color, flexShrink: 0 }}>
                  {p.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap",
                                 overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{p.age} ans · {p.status}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: p.color }}>{p.glucose}</div>
                  <div style={{ fontSize: 10, color: p.color, fontWeight: 600 }}>{p.delta}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Décisions en attente */}
          <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                        overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9",
                           display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#0F172A" }}>
                Décisions en attente
              </span>
              <span style={{ fontSize: 11, background: "#EFF6FF", color: "#1565C0",
                              fontWeight: 700, borderRadius: 20, padding: "1px 8px" }}>2</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {[
                {
                  patient: "M. Bernard",
                  action: "Augmenter basale nuit +15%",
                  reason: "TIR nocturne < 50% depuis 5j",
                  urgency: "high", time: "il y a 2h"
                },
                {
                  patient: "I. Roux",
                  action: "Ajuster ratio glucidique déjeuner",
                  reason: "Pics post-prandiaux répétés",
                  urgency: "medium", time: "il y a 5h"
                },
              ].map(d => (
                <div key={d.patient} style={{ padding: "12px 16px",
                                               borderBottom: "1px solid #F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                                 marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                      {d.patient}
                    </span>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>{d.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", marginBottom: 3 }}>
                    {d.action}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>
                    {d.reason}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ padding: "5px 12px", borderRadius: 6,
                                      background: "#0D47A1", border: "none",
                                      fontSize: 11, fontWeight: 700, color: "white",
                                      cursor: "pointer" }}>Valider</button>
                    <button style={{ padding: "5px 12px", borderRadius: 6,
                                      background: "#F1F5F9", border: "1.5px solid #E2E8F0",
                                      fontSize: 11, fontWeight: 600, color: "#475569",
                                      cursor: "pointer" }}>Modifier</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan de soins actuel (accordéon fermé) */}
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E2E8F0",
                        padding: "12px 16px", boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                        cursor: "pointer", display: "flex", justifyContent: "space-between",
                        alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>
              📋 Plan de soins · Historique · Paramètres
            </span>
            <span style={{ color: "#94A3B8" }}>▾</span>
          </div>
        </div>
      </div>
    </div>
  );
}
