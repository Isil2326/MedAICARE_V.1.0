/**
 * A1 — Signal Raffiné · Respirant
 * Raffinements vs Direction A :
 * - 3 KPIs au lieu de 4 · plus d'impact visuel
 * - Typographie cohérente sur échelle stricte
 * - XAI widget réorganisé : cause → prédiction → action
 * - Plus d'espace partout · gutter 16px → 20px
 * - Liste patients : badges risk redesignés
 * - Section CGM : vrai mini-graphe avec points
 */

const PATIENTS = [
  { id: "P-001", name: "Martin Bernard", age: 68, type: "T2D", hba1c: 8.4, tir: 42, risk: "critical", glucose: 228, trend: "↑↑" },
  { id: "P-004", name: "Isabelle Roux",   age: 54, type: "T1D", hba1c: 7.8, tir: 58, risk: "high",     glucose: 172, trend: "↑" },
  { id: "P-007", name: "Marie Dupont",    age: 41, type: "T1D", hba1c: 6.9, tir: 71, risk: "moderate", glucose: 142, trend: "↗" },
  { id: "P-002", name: "Jean Leroy",      age: 33, type: "T1D", hba1c: 6.4, tir: 78, risk: "low",      glucose:  94, trend: "→" },
  { id: "P-009", name: "Claire Petit",    age: 61, type: "T2D", hba1c: 7.1, tir: 65, risk: "low",      glucose: 108, trend: "↓" },
];

const RISK: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  critical: { label: "Critique",  color: "#991B1B", bg: "#FFF1F1", border: "#FECACA", dot: "#EF4444" },
  high:     { label: "Élevé",    color: "#92400E", bg: "#FEFCE8", border: "#FDE68A", dot: "#F59E0B" },
  moderate: { label: "Modéré",   color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
  low:      { label: "Stable",   color: "#14532D", bg: "#F0FDF4", border: "#BBF7D0", dot: "#22C55E" },
};

const SEL = PATIENTS[2];

// CGM sparkline points (last 3h)
const CGM_PTS = [155, 162, 158, 151, 146, 140, 138, 142].map((g, i) => ({
  x: i / 7 * 100,
  y: 100 - ((g - 60) / 160) * 100,
}));

export function ClinicDashA1() {
  const polyline = CGM_PTS.map(p => `${p.x},${p.y}`).join(" ");
  const fill = CGM_PTS.map(p => `${p.x},${p.y}`).join(" ") + " 100,100 0,100";

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "#F0F4F8", fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 13, color: "#0F172A", overflow: "hidden",
    }}>

      {/* ══ NAV ══ */}
      <nav style={{
        height: 56, background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        display: "flex", alignItems: "center",
        padding: "0 28px", gap: 8, flexShrink: 0,
        boxShadow: "0 1px 0 rgba(15,23,42,0.05)",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 28 }}>
          <img src="/logo-mark.png" alt="" style={{ width: 30, height: "auto" }} />
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.04em", color: "#0F172A" }}>
            Medi<span style={{ color: "#1565C0" }}>AI</span> Care
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: "#1565C0", letterSpacing: "0.10em",
            textTransform: "uppercase", background: "#EFF6FF",
            border: "1px solid #BFDBFE", padding: "2px 8px", borderRadius: 20,
          }}>Pro</span>
        </div>

        {/* Nav tabs */}
        {[
          { label: "Cohorte", active: false },
          { label: "Tableau de bord", active: true },
          { label: "Modèles IA", active: false },
          { label: "Audit", active: false },
        ].map(t => (
          <div key={t.label} style={{
            padding: "0 14px", height: 56, display: "flex", alignItems: "center",
            fontSize: 13, fontWeight: t.active ? 700 : 500,
            color: t.active ? "#1565C0" : "#64748B",
            borderBottom: `2px solid ${t.active ? "#1565C0" : "transparent"}`,
            cursor: "pointer", marginBottom: t.active ? -1 : 0,
          }}>{t.label}</div>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#FFF1F1", border: "1px solid #FECACA",
          borderRadius: 20, padding: "5px 14px 5px 10px", cursor: "pointer",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", display: "block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>3 alertes</span>
        </div>

        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "linear-gradient(135deg, #1565C0, #0D47A1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 12, fontWeight: 800, marginLeft: 8,
        }}>DR</div>
      </nav>

      {/* ══ KPI STRIP — 3 vitaux ══ */}
      <div style={{
        background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
        padding: "0 28px", display: "flex", gap: 0, flexShrink: 0,
      }}>
        {[
          {
            icon: "👥", val: "10", label: "Patients suivis",
            sub: "2 nouveaux", trend: "+20%",
            color: "#1565C0", bg: "#EFF6FF", border: "#BFDBFE",
          },
          {
            icon: "⚡", val: "3", label: "Alertes actives",
            sub: "Prioritaires", trend: "Agir maintenant",
            color: "#991B1B", bg: "#FFF1F1", border: "#FECACA",
          },
          {
            icon: "🎯", val: "67%", label: "TIR cohorte",
            sub: "Cible ≥ 70%", trend: "+3% vs mois",
            color: "#0D9488", bg: "#F0FDFA", border: "#99F6E4",
          },
        ].map((k, i) => (
          <div key={k.label} style={{
            flex: 1, padding: "16px 24px",
            borderRight: i < 2 ? "1px solid #F1F5F9" : "none",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: k.bg, border: `1px solid ${k.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>{k.icon}</div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: k.color, letterSpacing: "-0.05em", lineHeight: 1 }}>
                  {k.val}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: k.color,
                  background: k.bg, border: `1px solid ${k.border}`,
                  borderRadius: 20, padding: "1px 7px",
                }}>{k.trend}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{k.label}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: 0 }}>

        {/* ── PATIENT LIST ── */}
        <div style={{
          width: 268, flexShrink: 0,
          background: "#FFFFFF", borderRight: "1px solid #E2E8F0",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Search */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#F8FAFC", border: "1.5px solid #E2E8F0",
              borderRadius: 10, padding: "9px 12px",
              fontSize: 12, color: "#94A3B8",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Rechercher…
            </div>
          </div>

          <div style={{ padding: "8px 16px 6px", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em" }}>
              Par priorité clinique
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {PATIENTS.map(p => {
              const meta = RISK[p.risk];
              const sel = p.id === SEL.id;
              return (
                <div key={p.id} style={{
                  padding: "11px 16px",
                  background: sel ? "#EFF6FF" : "transparent",
                  borderLeft: `3px solid ${sel ? "#1565C0" : "transparent"}`,
                  borderBottom: "1px solid #F8FAFC",
                  cursor: "pointer",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
                        {p.age} ans · {p.type}
                      </div>
                    </div>
                    <div style={{
                      alignSelf: "flex-start",
                      fontSize: 10, fontWeight: 700, color: meta.color,
                      background: meta.bg, border: `1px solid ${meta.border}`,
                      borderRadius: 20, padding: "2px 8px",
                    }}>{meta.label}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 800,
                      color: p.glucose > 180 ? "#991B1B" : p.glucose < 70 ? "#92400E" : sel ? "#1565C0" : "#334155",
                    }}>{p.glucose} {p.trend}</span>
                    <span style={{ fontSize: 11, color: "#CBD5E1" }}>·</span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>TIR {p.tir}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PATIENT DETAIL ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Patient header */}
          <div style={{
            background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
            padding: "14px 24px", flexShrink: 0,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg, #BBDEFB, #64B5F6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, color: "#0D47A1", fontSize: 14,
              }}>MD</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>Marie Dupont</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: "#1E40AF",
                    background: "#EFF6FF", border: "1px solid #BFDBFE",
                    borderRadius: 20, padding: "2px 9px",
                  }}>Modéré</span>
                </div>
                <span style={{ fontSize: 12, color: "#64748B" }}>
                  41 ans · Diabète T1D · Suivi 3 ans · P-007
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{
                padding: "8px 16px", borderRadius: 9,
                border: "1.5px solid #E2E8F0", background: "white",
                fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
              }}>Historique</button>
              <button style={{
                padding: "8px 16px", borderRadius: 9,
                border: "none", background: "#1565C0",
                fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer",
              }}>Plan de soins →</button>
            </div>
          </div>

          {/* Scroll area */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16,
          }}>

            {/* ── Métriques vitales ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", gap: 12 }}>

              {/* Glycémie live */}
              <div style={{
                background: "#FFFFFF", borderRadius: 14, padding: "18px 22px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 8 }}>
                  Glycémie actuelle
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: "#0D47A1", letterSpacing: "-0.05em", lineHeight: 1 }}>142</span>
                  <div style={{ paddingBottom: 6 }}>
                    <div style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>mg/dL</div>
                    <div style={{ fontSize: 22, lineHeight: 1 }}>↗</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#475569" }}>+8 mg/dL · 15 min · hausse modérée</div>
                <div style={{
                  marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5,
                  background: "#F0FDF4", border: "1px solid #BBF7D0",
                  borderRadius: 6, padding: "4px 10px",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "block" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#14532D" }}>Dans la cible (70–180)</span>
                </div>
              </div>

              {/* TIR */}
              <div style={{
                background: "#FFFFFF", borderRadius: 14, padding: "18px 18px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 8 }}>TIR · 24h</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: "#0D9488", letterSpacing: "-0.05em", lineHeight: 1 }}>71%</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Cible ≥ 70% ✓</div>
                {/* 5-zone bar */}
                <div style={{ marginTop: 12, display: "flex", borderRadius: 4, overflow: "hidden", height: 7 }}>
                  {[
                    { w: 3, color: "#1E40AF" }, { w: 7, color: "#EF4444" },
                    { w: 71, color: "#22C55E" }, { w: 15, color: "#F59E0B" }, { w: 4, color: "#B91C1C" },
                  ].map((z, i) => <div key={i} style={{ width: `${z.w}%`, background: z.color }} />)}
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4, lineHeight: 1.4 }}>
                  ↙ Bas · Cible · Haut ↗
                </div>
              </div>

              {/* HbA1c */}
              <div style={{
                background: "#FFFFFF", borderRadius: 14, padding: "18px 18px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 8 }}>HbA1c estimée</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: "#7C3AED", letterSpacing: "-0.05em", lineHeight: 1 }}>6.9%</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Cible &lt; 7.0% ✓</div>
                <div style={{ marginTop: 12, display: "flex", gap: 4, alignItems: "flex-end" }}>
                  {[6.4, 7.1, 7.8, 7.2, 6.9].map((v, i) => (
                    <div key={i} style={{
                      flex: 1, borderRadius: 3,
                      height: `${((v - 6) / 2) * 36}px`,
                      background: i === 4 ? "#7C3AED" : "#EDE9FE",
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 3 }}>Évolution · 5 derniers relevés</div>
              </div>
            </div>

            {/* ════ XAI WIDGET ════ */}
            <div style={{
              borderRadius: 16, overflow: "hidden",
              boxShadow: "0 4px 24px rgba(13,71,161,0.18), 0 1px 4px rgba(13,71,161,0.10)",
            }}>
              {/* Header */}
              <div style={{
                background: "linear-gradient(100deg, #0A2F6E 0%, #0D47A1 45%, #1565C0 100%)",
                padding: "16px 22px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(255,255,255,0.13)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>🤖</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      Recommandation IA · 91% confiance
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", marginTop: 2 }}>
                      ⚡ Risque d'hypoglycémie dans 35 min
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#FCD34D", lineHeight: 1, letterSpacing: "-0.04em" }}>67</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Score risque</div>
                </div>
              </div>

              {/* Body */}
              <div style={{ background: "#FAFCFF", border: "1px solid #BFDBFE", borderTop: "none", borderRadius: "0 0 16px 16px", padding: "18px 22px" }}>
                <div style={{ display: "flex", gap: 20 }}>

                  {/* Facteurs causaux */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 10 }}>
                      Pourquoi l'IA prédit ce risque
                    </div>
                    {[
                      { icon: "📉", label: "Tendance descendante",  detail: "−18 mg/dL sur 45 min", pct: 42, color: "#1565C0" },
                      { icon: "🏃", label: "Activité physique",     detail: "Modérée · accéléromètre", pct: 33, color: "#7C3AED" },
                      { icon: "🍽️", label: "Bolus résiduel",        detail: "3.5U il y a 2h30", pct: 25, color: "#0D9488" },
                    ].map(f => (
                      <div key={f.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", display: "flex", gap: 6 }}>
                            <span>{f.icon}</span>{f.label}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: f.color }}>{f.pct}%</span>
                        </div>
                        <div style={{ height: 5, background: "#E2E8F0", borderRadius: 3 }}>
                          <div style={{ height: 5, width: `${f.pct}%`, background: f.color, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{f.detail}</div>
                      </div>
                    ))}
                  </div>

                  {/* Séparateur vertical */}
                  <div style={{ width: 1, background: "#E2E8F0", margin: "0 4px" }} />

                  {/* Suggestion + Actions */}
                  <div style={{ width: 280 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 10 }}>
                      Suggestion thérapeutique
                    </div>
                    <div style={{
                      background: "#FFF8E1", border: "1px solid #FDE68A",
                      borderRadius: 10, padding: "12px 14px", marginBottom: 14,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#78350F", lineHeight: 1.5 }}>
                        Réduire le prochain bolus de <strong>10%</strong>
                      </div>
                      <div style={{ fontSize: 12, color: "#92400E", marginTop: 4 }}>
                        OU proposer 15g de glucides rapides maintenant
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button style={{
                        width: "100%", padding: "10px", borderRadius: 10,
                        border: "none", background: "#0D47A1",
                        fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer",
                      }}>
                        ✓ Appliquer la suggestion
                      </button>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{
                          flex: 1, padding: "8px", borderRadius: 9,
                          border: "1.5px solid #E2E8F0", background: "white",
                          fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
                        }}>✎ Modifier</button>
                        <button style={{
                          flex: 1, padding: "8px", borderRadius: 9,
                          border: "1.5px solid #E2E8F0", background: "white",
                          fontSize: 12, fontWeight: 500, color: "#94A3B8", cursor: "pointer",
                        }}>Ignorer</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── COURBE CGM ── */}
            <div style={{
              background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0",
              boxShadow: "0 1px 4px rgba(15,23,42,0.04)", overflow: "hidden",
            }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  {["Courbe CGM", "Profil AGP", "Historique"].map((t, i) => (
                    <span key={t} style={{
                      fontSize: 12, fontWeight: i === 0 ? 700 : 500,
                      color: i === 0 ? "#1565C0" : "#94A3B8",
                      borderBottom: `2px solid ${i === 0 ? "#1565C0" : "transparent"}`,
                      paddingBottom: 10, cursor: "pointer",
                    }}>{t}</span>
                  ))}
                </div>
                <span style={{ fontSize: 11, color: "#94A3B8", alignSelf: "center" }}>Dernières 3h · Temps réel</span>
              </div>
              <div style={{ padding: "12px 20px 14px", height: 96, position: "relative" }}>
                <svg viewBox="0 0 300 80" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                  {/* Target zone */}
                  <rect x="0" y="12" width="300" height="50" fill="rgba(21,101,192,0.05)" />
                  <line x1="0" y1="12" x2="300" y2="12" stroke="rgba(21,101,192,0.2)" strokeWidth="1" strokeDasharray="4,3" />
                  <line x1="0" y1="62" x2="300" y2="62" stroke="rgba(239,68,68,0.25)" strokeWidth="1" strokeDasharray="4,3" />
                  {/* Fill */}
                  <polygon points={fill.replace(/ /g, " ").split(" ").map((pt, i) => {
                    const [x, y] = pt.split(",");
                    return `${parseFloat(x) * 3},${parseFloat(y) * 0.8}`;
                  }).join(" ")} fill="rgba(21,101,192,0.07)" />
                  {/* Line */}
                  <polyline
                    points={CGM_PTS.map(p => `${p.x * 3},${p.y * 0.8}`).join(" ")}
                    fill="none" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                  {/* Dots */}
                  {CGM_PTS.map((p, i) => i === CGM_PTS.length - 1 && (
                    <circle key={i} cx={p.x * 3} cy={p.y * 0.8} r="4" fill="#1565C0" />
                  ))}
                  {/* Labels */}
                  {["−3h", "−2h", "−1h", "Maintenant"].map((t, i) => (
                    <text key={t} x={i * 100} y="78" fontSize="7" fill="#CBD5E1" textAnchor={i === 3 ? "end" : "start"}>{t}</text>
                  ))}
                  {/* 180 label */}
                  <text x="2" y="11" fontSize="7" fill="rgba(21,101,192,0.5)">180</text>
                  <text x="2" y="60" fontSize="7" fill="rgba(239,68,68,0.5)">70</text>
                </svg>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
