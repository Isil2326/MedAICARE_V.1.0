/**
 * DIRECTION A — Signal Clinique Clair
 * Principe : Less is More · Hiérarchie radicale · 3 features vitales above the fold
 * Design pro : grille 8px · typographie Inter · palette bleue médicale
 */

const PATIENTS = [
  { id: "P-001", name: "Martin Bernard", age: 68, type: "T2D", hba1c: 8.4, tir: 42, risk: "critical", glucose: 228, trend: "↑↑", lastEvent: "Hyper détectée" },
  { id: "P-004", name: "Isabelle Roux", age: 54, type: "T1D", hba1c: 7.8, tir: 58, risk: "high", glucose: 172, trend: "↑", lastEvent: "Bolus oublié" },
  { id: "P-007", name: "Marie Dupont", age: 41, type: "T1D", hba1c: 6.9, tir: 71, risk: "moderate", glucose: 142, trend: "↗", lastEvent: "Activité détectée" },
  { id: "P-002", name: "Jean Leroy", age: 33, type: "T1D", hba1c: 6.4, tir: 78, risk: "low", glucose: 94, trend: "→", lastEvent: "RAS" },
  { id: "P-009", name: "Claire Petit", age: 61, type: "T2D", hba1c: 7.1, tir: 65, risk: "low", glucose: 108, trend: "↓", lastEvent: "Contrôle OK" },
];

const RISK_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: "Critique",  color: "#B91C1C", bg: "#FEF2F2", dot: "#EF4444" },
  high:     { label: "Élevé",    color: "#92400E", bg: "#FFFBEB", dot: "#F59E0B" },
  moderate: { label: "Modéré",   color: "#1E40AF", bg: "#EFF6FF", dot: "#3B82F6" },
  low:      { label: "Stable",   color: "#166534", bg: "#F0FDF4", dot: "#22C55E" },
};

const SELECTED = PATIENTS[2]; // Marie Dupont sélectionnée

export function ClinicDashA() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column",
                  background: "#F8FAFD", fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13, color: "#0F172A", overflow: "hidden" }}>

      {/* ════ NAV ════ */}
      <nav style={{ height: 52, background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
                    display: "flex", alignItems: "center", padding: "0 24px",
                    gap: 0, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 32 }}>
          <img src="/logo-mark.png" alt="" style={{ width: 28, height: "auto" }} />
          <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#0F172A" }}>Medi</span>
            <span style={{ color: "#1565C0" }}>AI</span>
            <span style={{ color: "#0F172A" }}> Care</span>
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8",
                         letterSpacing: "0.08em", textTransform: "uppercase",
                         background: "#F1F5F9", padding: "2px 8px", borderRadius: 20,
                         marginLeft: 4 }}>Clinicien</span>
        </div>

        {/* Tabs */}
        {[
          { label: "Vue cohorte", active: false },
          { label: "Tableau de bord", active: true },
          { label: "Modèles IA", active: false },
        ].map(t => (
          <div key={t.label} style={{
            padding: "0 16px", height: 52, display: "flex", alignItems: "center",
            fontSize: 13, fontWeight: t.active ? 600 : 400,
            color: t.active ? "#1565C0" : "#64748B",
            borderBottom: t.active ? "2px solid #1565C0" : "2px solid transparent",
            cursor: "pointer", marginBottom: t.active ? -1 : 0
          }}>
            {t.label}
          </div>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Alert badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6,
                        background: "#FEF2F2", border: "1px solid #FECACA",
                        borderRadius: 20, padding: "4px 12px 4px 8px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#B91C1C" }}>3 alertes actives</span>
          </div>
          {/* Avatar */}
          <div style={{ width: 32, height: 32, borderRadius: "50%",
                        background: "linear-gradient(135deg, #1565C0, #0D47A1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontSize: 12, fontWeight: 700 }}>DR</div>
        </div>
      </nav>

      {/* ════ KPI STRIP — 3 features vitales above the fold ════ */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
                    padding: "12px 24px", display: "flex", gap: 24, flexShrink: 0 }}>
        {[
          { icon: "👥", val: "10", label: "Patients suivis", sub: "2 nouveaux ce mois", color: "#1565C0", bg: "#E3F2FD" },
          { icon: "🎯", val: "67%", label: "TIR cohorte", sub: "+3% vs mois dernier", color: "#0D9488", bg: "#F0FDFA" },
          { icon: "⚡", val: "3", label: "Alertes prioritaires", sub: "Nécessitent action", color: "#B91C1C", bg: "#FEF2F2" },
          { icon: "🤖", val: "94%", label: "Précision IA", sub: "Modèle v2.4 · Actif", color: "#7C3AED", bg: "#F5F3FF" },
        ].map(k => (
          <div key={k.label} style={{ display: "flex", alignItems: "center", gap: 12,
                                      flex: 1, padding: "8px 16px", borderRadius: 10,
                                      background: k.bg }}>
            <div style={{ fontSize: 22 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.val}</div>
              <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 12, marginTop: 1 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ════ MAIN 2-COL LAYOUT ════ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: Liste patients ── */}
        <div style={{ width: 280, borderRight: "1px solid #E2E8F0",
                      background: "#FFFFFF", display: "flex", flexDirection: "column",
                      overflow: "hidden", flexShrink: 0 }}>

          {/* Search */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                          borderRadius: 8, padding: "8px 12px", fontSize: 13,
                          color: "#94A3B8", display: "flex", alignItems: "center", gap: 8 }}>
              🔍 Rechercher un patient…
            </div>
          </div>

          <div style={{ padding: "8px 12px", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8",
                           textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Triés par priorité clinique
            </span>
          </div>

          {/* Patient rows */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {PATIENTS.map(p => {
              const meta = RISK_META[p.risk];
              const selected = p.id === SELECTED.id;
              return (
                <div key={p.id} style={{
                  padding: "10px 16px",
                  background: selected ? "#EFF6FF" : "transparent",
                  borderLeft: selected ? "3px solid #1565C0" : "3px solid transparent",
                  borderBottom: "1px solid #F1F5F9",
                  cursor: "pointer",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                                alignItems: "flex-start", marginBottom: 4 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
                        {p.age} ans · {p.type} · {p.id}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: meta.dot }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: meta.color }}>{meta.label}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#64748B" }}>TIR {p.tir}%</span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>HbA1c {p.hba1c}%</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: p.glucose > 180 ? "#B91C1C" : p.glucose < 70 ? "#92400E" : "#166534" }}>
                      {p.glucose} mg/dL {p.trend}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Dossier patient sélectionné ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Patient header */}
          <div style={{ padding: "16px 24px", background: "#FFFFFF",
                        borderBottom: "1px solid #E2E8F0", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%",
                                background: "linear-gradient(135deg, #BBDEFB, #90CAF9)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 800, color: "#1565C0", fontSize: 13 }}>MD</div>
                  <div>
                    <span style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>Marie Dupont</span>
                    <span style={{ fontSize: 12, color: "#64748B", marginLeft: 10 }}>
                      41 ans · T1D · Suivi depuis 3 ans · P-007
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0",
                                  background: "white", fontSize: 12, fontWeight: 600,
                                  color: "#475569", cursor: "pointer" }}>
                  Historique complet
                </button>
                <button style={{ padding: "7px 14px", borderRadius: 8, border: "none",
                                  background: "#1565C0", fontSize: 12, fontWeight: 600,
                                  color: "white", cursor: "pointer" }}>
                  Plan de soins →
                </button>
              </div>
            </div>
          </div>

          {/* Content scroll */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex",
                        flexDirection: "column", gap: 16 }}>

            {/* Row 1: Glycémie actuelle + TIR */}
            <div style={{ display: "flex", gap: 16 }}>

              {/* Glycémie actuelle */}
              <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 12,
                            border: "1px solid #E2E8F0", padding: "16px 20px",
                            boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8",
                               textTransform: "uppercase", letterSpacing: "0.08em",
                               marginBottom: 8 }}>Glycémie actuelle</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: "#0D47A1",
                                  letterSpacing: "-0.04em" }}>142</span>
                  <span style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>mg/dL</span>
                  <span style={{ fontSize: 22, marginLeft: 4 }}>↗</span>
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                  Hausse modérée · +8 mg/dL / 15 min
                </div>
                <div style={{ marginTop: 10, background: "#E3F2FD", borderRadius: 6,
                               padding: "4px 10px", display: "inline-block" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#1565C0" }}>
                    ✓ Dans la cible thérapeutique (70–180)
                  </span>
                </div>
              </div>

              {/* TIR 24h */}
              <div style={{ width: 180, background: "#FFFFFF", borderRadius: 12,
                            border: "1px solid #E2E8F0", padding: "16px 20px",
                            boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8",
                               textTransform: "uppercase", letterSpacing: "0.08em",
                               marginBottom: 8 }}>TIR · 24h</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#0D9488",
                               letterSpacing: "-0.04em" }}>71%</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Cible ≥ 70%</div>
                {/* Mini TIR bar */}
                <div style={{ marginTop: 12, borderRadius: 4, overflow: "hidden", height: 8,
                               display: "flex" }}>
                  <div style={{ width: "3%", background: "#1E40AF" }} />
                  <div style={{ width: "7%", background: "#EF4444" }} />
                  <div style={{ width: "71%", background: "#22C55E" }} />
                  <div style={{ width: "15%", background: "#F59E0B" }} />
                  <div style={{ width: "4%", background: "#B91C1C" }} />
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                  Très bas · Bas · Cible · Élevé · Très élevé
                </div>
              </div>

              {/* Stats 7j */}
              <div style={{ width: 180, background: "#FFFFFF", borderRadius: 12,
                            border: "1px solid #E2E8F0", padding: "16px 20px",
                            boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8",
                               textTransform: "uppercase", letterSpacing: "0.08em",
                               marginBottom: 10 }}>7 derniers jours</div>
                {[
                  { label: "Moy. glucose", val: "138 mg/dL" },
                  { label: "Écart-type", val: "±24 mg/dL" },
                  { label: "Hypos", val: "2 épisodes" },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between",
                                              marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#64748B" }}>{s.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ════ XAI WIDGET — Killer Feature ════ */}
            <div style={{
              background: "linear-gradient(135deg, #0D47A1 0%, #1565C0 60%, #1976D2 100%)",
              borderRadius: 14, padding: "20px 24px",
              boxShadow: "0 4px 24px rgba(13,71,161,0.25), 0 1px 4px rgba(13,71,161,0.15)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                            alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8,
                                   background: "rgba(255,255,255,0.15)",
                                   display: "flex", alignItems: "center",
                                   justifyContent: "center", fontSize: 16 }}>🤖</div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)",
                                     textTransform: "uppercase", letterSpacing: "0.10em" }}>
                        Recommandation IA · Confiance 91%
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF",
                                     marginTop: 1 }}>
                        ⚡ Risque d'hypoglycémie dans 35 min
                      </div>
                    </div>
                  </div>

                  {/* Pourquoi */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)",
                                   textTransform: "uppercase", letterSpacing: "0.08em",
                                   marginBottom: 6 }}>Pourquoi l'IA le prédit :</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {[
                        { icon: "📉", text: "Tendance glycémique descendante depuis 45 min (−18 mg/dL)" },
                        { icon: "🏃", text: "Activité physique modérée détectée (accéléromètre)" },
                        { icon: "🍽️", text: "Dernier repas il y a 2h30 · Bolus de 3.5U administré" },
                      ].map(r => (
                        <div key={r.text} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 13, flexShrink: 0 }}>{r.icon}</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)",
                                          lineHeight: 1.4 }}>{r.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggestion */}
                  <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10,
                                 padding: "10px 14px", marginBottom: 14,
                                 border: "1px solid rgba(255,255,255,0.2)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)",
                                   marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Suggestion thérapeutique
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>
                      Réduire le prochain bolus de 10% · OU suggérer 15g de glucides rapides maintenant
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={{ padding: "8px 20px", borderRadius: 8,
                                      background: "#FFFFFF", border: "none",
                                      fontWeight: 700, fontSize: 12,
                                      color: "#0D47A1", cursor: "pointer" }}>
                      ✓ Appliquer la suggestion
                    </button>
                    <button style={{ padding: "8px 20px", borderRadius: 8,
                                      background: "rgba(255,255,255,0.12)",
                                      border: "1px solid rgba(255,255,255,0.25)",
                                      fontWeight: 600, fontSize: 12,
                                      color: "#FFFFFF", cursor: "pointer" }}>
                      Modifier / Arbitrer
                    </button>
                    <button style={{ padding: "8px 16px", borderRadius: 8,
                                      background: "transparent",
                                      border: "1px solid rgba(255,255,255,0.15)",
                                      fontWeight: 500, fontSize: 12,
                                      color: "rgba(255,255,255,0.65)", cursor: "pointer" }}>
                      Ignorer
                    </button>
                  </div>
                </div>

                {/* Risk gauge */}
                <div style={{ marginLeft: 24, textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 44, fontWeight: 900, color: "#FCD34D",
                                 lineHeight: 1 }}>67</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)",
                                 textTransform: "uppercase", letterSpacing: "0.08em",
                                 marginTop: 2 }}>Score de risque</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 3, justifyContent: "center" }}>
                    {[0.8, 1, 0.7, 0.5, 0.3].map((h, i) => (
                      <div key={i} style={{ width: 8, height: 32 * h, borderRadius: 3,
                                             background: i < 3 ? "#FCD34D" : "rgba(255,255,255,0.2)",
                                             alignSelf: "flex-end" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
                    Modéré→Élevé
                  </div>
                </div>
              </div>
            </div>

            {/* Onglets détail (repliables) */}
            <div style={{ background: "#FFFFFF", borderRadius: 12,
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0" }}>
                {["Courbe CGM", "Profil AGP", "Plan de soins", "Historique"].map((t, i) => (
                  <div key={t} style={{
                    padding: "10px 18px", fontSize: 12, fontWeight: i === 0 ? 700 : 500,
                    color: i === 0 ? "#1565C0" : "#64748B",
                    borderBottom: i === 0 ? "2px solid #1565C0" : "2px solid transparent",
                    cursor: "pointer"
                  }}>{t}</div>
                ))}
                <div style={{ flex: 1 }} />
                <div style={{ padding: "10px 16px", fontSize: 11, color: "#94A3B8",
                               display: "flex", alignItems: "center" }}>Dernières 6h</div>
              </div>
              {/* Mini CGM chart placeholder */}
              <div style={{ padding: "16px 20px", height: 100, position: "relative",
                             overflow: "hidden" }}>
                {/* Target zone */}
                <div style={{ position: "absolute", top: "20%", left: 20, right: 20, height: "50%",
                               background: "rgba(21,101,192,0.06)", borderRadius: 4,
                               border: "1px dashed rgba(21,101,192,0.2)" }} />
                {/* Curve */}
                <svg viewBox="0 0 400 68" style={{ width: "100%", height: "100%", position: "absolute",
                                                   top: 0, left: 0 }} preserveAspectRatio="none">
                  <polyline
                    points="0,48 40,44 80,40 120,36 160,32 200,38 240,34 280,30 320,34 360,38 400,36"
                    fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                  <circle cx="400" cy="36" r="4" fill="#1565C0" />
                </svg>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
