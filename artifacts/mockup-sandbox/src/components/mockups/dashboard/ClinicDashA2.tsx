/**
 * A2 — Premium Medical · Dark Nav
 * Raffinements vs Direction A :
 * - Barre de navigation marine foncée (autorité clinique)
 * - XAI widget avec fond sombre pleine largeur + typographie amplifiée
 * - Colonne patients avec barre de risque latérale colorée
 * - Métriques avec micro-tendances (sparklines)
 * - Onglets CGM réorganisés · zone prédiction annotée
 * - Couleurs fonctionnelles plus nettes · contrastes AAA
 */

const PATIENTS = [
  { id: "P-001", name: "Martin Bernard", age: 68, type: "T2D", tir: 42, risk: "critical", glucose: 228, trend: "↑↑", alert: "Hyper active" },
  { id: "P-004", name: "Isabelle Roux",   age: 54, type: "T1D", tir: 58, risk: "high",     glucose: 172, trend: "↑",  alert: "Bolus manqué" },
  { id: "P-007", name: "Marie Dupont",    age: 41, type: "T1D", tir: 71, risk: "moderate", glucose: 142, trend: "↗", alert: "Surveillance" },
  { id: "P-002", name: "Jean Leroy",      age: 33, type: "T1D", tir: 78, risk: "low",      glucose:  94, trend: "→", alert: "RAS" },
  { id: "P-009", name: "Claire Petit",    age: 61, type: "T2D", tir: 65, risk: "low",      glucose: 108, trend: "↓", alert: "RAS" },
];

const RISK: Record<string, { barColor: string; badge: string; badgeBg: string; badgeText: string }> = {
  critical: { barColor: "#EF4444", badge: "Critique",  badgeBg: "#FFF1F1", badgeText: "#991B1B" },
  high:     { barColor: "#F59E0B", badge: "Élevé",    badgeBg: "#FEFCE8", badgeText: "#92400E" },
  moderate: { barColor: "#3B82F6", badge: "Modéré",   badgeBg: "#EFF6FF", badgeText: "#1E40AF" },
  low:      { barColor: "#22C55E", badge: "Stable",   badgeBg: "#F0FDF4", badgeText: "#14532D" },
};

const SEL = PATIENTS[2];

export function ClinicDashA2() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "#F0F4F8", fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 13, color: "#0F172A", overflow: "hidden",
    }}>

      {/* ══ NAV MARINE ══ */}
      <nav style={{
        height: 52, flexShrink: 0,
        background: "linear-gradient(90deg, #06193D 0%, #0A2F6E 60%, #0D47A1 100%)",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 0,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 32 }}>
          <img src="/logo-mark.png" alt="" style={{ width: 28, height: "auto", filter: "brightness(0) invert(1) opacity(0.9)" }} />
          <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.04em", color: "white" }}>
            MediAI Care
          </span>
        </div>

        {[
          { label: "Cohorte", active: false },
          { label: "Tableau de bord", active: true },
          { label: "Modèles IA", active: false },
        ].map(t => (
          <div key={t.label} style={{
            padding: "0 16px", height: 52, display: "flex", alignItems: "center",
            fontSize: 13, fontWeight: t.active ? 700 : 400,
            color: t.active ? "#FFFFFF" : "rgba(255,255,255,0.5)",
            borderBottom: `2px solid ${t.active ? "rgba(255,255,255,0.8)" : "transparent"}`,
            cursor: "pointer",
          }}>{t.label}</div>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.30)",
          borderRadius: 20, padding: "5px 14px 5px 10px",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", display: "block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FCA5A5" }}>3 alertes</span>
        </div>

        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.13)",
          border: "1px solid rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 800, marginLeft: 16,
        }}>DR</div>
      </nav>

      {/* ══ KPI STRIP ══ */}
      <div style={{
        background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
        display: "flex", flexShrink: 0,
      }}>
        {[
          { icon: "👥", val: "10", label: "Patients suivis", sub: "+2 ce mois",    color: "#1565C0", border: "#BFDBFE", bg: "#EFF6FF" },
          { icon: "⚡", val: "3",  label: "Alertes critiques", sub: "Action requise", color: "#991B1B", border: "#FECACA", bg: "#FFF1F1" },
          { icon: "🎯", val: "67%", label: "TIR cohorte",    sub: "Cible ≥ 70%",   color: "#0D9488", border: "#99F6E4", bg: "#F0FDFA" },
          { icon: "🤖", val: "91%", label: "Précision IA",   sub: "Modèle v2.4",   color: "#7C3AED", border: "#DDD6FE", bg: "#F5F3FF" },
        ].map((k, i) => (
          <div key={k.label} style={{
            flex: 1, padding: "14px 22px",
            borderRight: i < 3 ? "1px solid #F1F5F9" : "none",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: k.bg, border: `1px solid ${k.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: k.color, letterSpacing: "-0.05em", lineHeight: 1.1 }}>{k.val}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{k.label}</div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LISTE PATIENTS — avec barre latérale de risque ── */}
        <div style={{
          width: 272, flexShrink: 0,
          background: "#FFFFFF", borderRight: "1px solid #E2E8F0",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#F8FAFC", border: "1.5px solid #E2E8F0",
              borderRadius: 10, padding: "9px 12px", fontSize: 12, color: "#94A3B8",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Rechercher un patient…
            </div>
          </div>

          <div style={{ padding: "7px 16px 6px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em" }}>
              Priorité clinique
            </span>
            <span style={{ fontSize: 10, color: "#94A3B8" }}>5/10</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {PATIENTS.map(p => {
              const meta = RISK[p.risk];
              const sel = p.id === SEL.id;
              return (
                <div key={p.id} style={{
                  display: "flex", cursor: "pointer",
                  background: sel ? "#EFF6FF" : "transparent",
                  borderBottom: "1px solid #F8FAFC",
                }}>
                  {/* Barre latérale colorée */}
                  <div style={{ width: 3, flexShrink: 0, background: sel ? "#1565C0" : meta.barColor, opacity: sel ? 1 : 0.5 }} />
                  <div style={{ flex: 1, padding: "11px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{p.age} ans · {p.type}</div>
                      </div>
                      <div style={{
                        alignSelf: "flex-start",
                        fontSize: 10, fontWeight: 700,
                        color: meta.badgeText, background: meta.badgeBg,
                        borderRadius: 20, padding: "2px 8px",
                      }}>{meta.badge}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{
                        fontSize: 14, fontWeight: 800, lineHeight: 1,
                        color: p.glucose > 180 ? "#991B1B" : p.glucose < 70 ? "#92400E" : sel ? "#0D47A1" : "#334155",
                      }}>{p.glucose} <span style={{ fontSize: 12 }}>{p.trend}</span></span>
                      <span style={{ fontSize: 11, color: "#CBD5E1" }}>·</span>
                      <span style={{ fontSize: 11, color: "#64748B" }}>TIR {p.tir}%</span>
                    </div>
                    {p.alert !== "RAS" && (
                      <div style={{ marginTop: 5, fontSize: 10, fontWeight: 600, color: meta.badgeText, background: meta.badgeBg, borderRadius: 4, padding: "1px 6px", display: "inline-block" }}>
                        {p.alert}
                      </div>
                    )}
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
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "linear-gradient(135deg, #0D47A1, #1976D2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, color: "white", fontSize: 15, letterSpacing: "0.04em",
                }}>MD</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>Marie Dupont</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1E40AF", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 20, padding: "2px 9px" }}>
                      Modéré
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "#64748B" }}>41 ans · T1D · 3 ans de suivi · P-007 · Freestyle Libre 2</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "white", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                  Historique
                </button>
                <button style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #1565C0, #0D47A1)", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer" }}>
                  Plan de soins →
                </button>
              </div>
            </div>
          </div>

          {/* Scroll */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Métriques */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Glycémie", val: "142", unit: "mg/dL", sub: "↗ +8 / 15min", color: "#0D47A1", good: true, goodText: "Dans la cible", microVal: [138,135,140,138,142] },
                { label: "TIR · 24h", val: "71%", unit: "", sub: "Cible ≥ 70% ✓", color: "#0D9488", good: true, goodText: "Objectif atteint", microVal: [65,68,70,69,71] },
                { label: "HbA1c estimée", val: "6.9%", unit: "", sub: "Cible < 7.0% ✓", color: "#7C3AED", good: true, goodText: "Contrôlé", microVal: [7.8,7.2,7.1,7.0,6.9] },
              ].map(m => (
                <div key={m.label} style={{ background: "#FFFFFF", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 8 }}>
                    {m.label}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontSize: 32, fontWeight: 900, color: m.color, letterSpacing: "-0.05em", lineHeight: 1 }}>{m.val}</span>
                        {m.unit && <span style={{ fontSize: 12, color: "#94A3B8" }}>{m.unit}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{m.sub}</div>
                    </div>
                    {/* Micro sparkline */}
                    <svg width="50" height="28" viewBox="0 0 50 28">
                      <polyline
                        points={m.microVal.map((v, i) => {
                          const minV = Math.min(...m.microVal), maxV = Math.max(...m.microVal);
                          const x = i / (m.microVal.length - 1) * 46 + 2;
                          const y = 26 - ((v - minV) / (maxV - minV || 1)) * 22;
                          return `${x},${y}`;
                        }).join(" ")}
                        fill="none" stroke={m.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"
                      />
                      {m.microVal.map((v, i) => {
                        const minV = Math.min(...m.microVal), maxV = Math.max(...m.microVal);
                        const x = i / (m.microVal.length - 1) * 46 + 2;
                        const y = 26 - ((v - minV) / (maxV - minV || 1)) * 22;
                        return i === m.microVal.length - 1 ? <circle key={i} cx={x} cy={y} r="3" fill={m.color} /> : null;
                      })}
                    </svg>
                  </div>
                  <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, padding: "3px 8px" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", display: "block" }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#14532D" }}>{m.goodText}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ════ XAI WIDGET — Marine full-width ════ */}
            <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 6px 28px rgba(6,25,61,0.20)" }}>

              {/* Barre supérieure bleue marine */}
              <div style={{
                background: "linear-gradient(100deg, #06193D 0%, #0A2F6E 50%, #0D47A1 100%)",
                padding: "18px 24px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      Recommandation IA · Confiance 91%
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", marginTop: 2, letterSpacing: "-0.01em" }}>
                      ⚡ Risque d'hypoglycémie dans 35 min
                    </div>
                  </div>
                </div>
                {/* Score numerique */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#FCD34D", letterSpacing: "-0.05em", lineHeight: 1 }}>67</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 2 }}>Score de risque</div>
                  {/* Mini scale */}
                  <div style={{ display: "flex", gap: 2, marginTop: 5, justifyContent: "center" }}>
                    {["#22C55E","#F59E0B","#F59E0B","#F97316","#EF4444"].map((c,i) => (
                      <div key={i} style={{ width: 14, height: 4, borderRadius: 2, background: i < 3 ? c : "rgba(255,255,255,0.15)" }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Corps blanc */}
              <div style={{ background: "#FFFFFF", padding: "18px 24px", border: "1px solid #BFDBFE", borderTop: "none", borderRadius: "0 0 16px 16px" }}>
                <div style={{ display: "flex", gap: 24 }}>

                  {/* Facteurs */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
                      Facteurs déclenchants
                    </div>
                    {[
                      { icon: "📉", label: "Tendance glycémique",  detail: "Descente −18 mg/dL / 45 min", pct: 42, color: "#1565C0" },
                      { icon: "🏃", label: "Activité physique",    detail: "Modérée via accéléromètre", pct: 33, color: "#7C3AED" },
                      { icon: "🍽️", label: "Bolus résiduel",       detail: "3.5U administré il y a 2h30", pct: 25, color: "#0D9488" },
                    ].map(f => (
                      <div key={f.label} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 14 }}>{f.icon}</span>{f.label}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: f.color }}>{f.pct}%</span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: 6, width: `${f.pct}%`, background: f.color, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{f.detail}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ width: 1, background: "#F1F5F9" }} />

                  {/* Suggestion + CTA */}
                  <div style={{ width: 292 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
                      Suggestion thérapeutique
                    </div>
                    <div style={{ background: "#FFF8E1", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#78350F", lineHeight: 1.4 }}>
                        Réduire le prochain bolus de 10%
                      </div>
                      <div style={{ fontSize: 12, color: "#92400E", marginTop: 5, lineHeight: 1.5 }}>
                        OU suggérer 15g de glucides rapides<br />à la patiente maintenant
                      </div>
                    </div>
                    <button style={{
                      width: "100%", padding: "11px", borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg, #0D47A1, #1565C0)",
                      fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer",
                      marginBottom: 8, letterSpacing: "-0.01em",
                    }}>
                      ✓ Appliquer la suggestion
                    </button>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1.5px solid #BFDBFE", background: "#EFF6FF", fontSize: 12, fontWeight: 700, color: "#1565C0", cursor: "pointer" }}>
                        ✎ Modifier
                      </button>
                      <button style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "white", fontSize: 12, fontWeight: 500, color: "#94A3B8", cursor: "pointer" }}>
                        Ignorer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CGM mini */}
            <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
              <div style={{ padding: "11px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 0 }}>
                  {["Courbe CGM", "Profil AGP", "Historique", "Plan de soins"].map((t, i) => (
                    <span key={t} style={{
                      padding: "8px 14px", fontSize: 12, cursor: "pointer",
                      fontWeight: i === 0 ? 700 : 400,
                      color: i === 0 ? "#1565C0" : "#94A3B8",
                      borderBottom: `2px solid ${i === 0 ? "#1565C0" : "transparent"}`,
                    }}>{t}</span>
                  ))}
                </div>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>3 dernières heures</span>
              </div>
              <div style={{ padding: "12px 20px 14px", height: 88 }}>
                <svg viewBox="0 0 400 72" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                  {/* Target zone */}
                  <rect x="0" y="10" width="400" height="44" fill="rgba(21,101,192,0.04)" />
                  <line x1="0" y1="10" x2="400" y2="10" stroke="rgba(21,101,192,0.20)" strokeWidth="1" strokeDasharray="5,3" />
                  <line x1="0" y1="54" x2="400" y2="54" stroke="rgba(239,68,68,0.25)" strokeWidth="1" strokeDasharray="5,3" />
                  {/* Fill */}
                  <polygon points="0,40 57,36 114,34 171,30 228,28 286,26 343,28 400,27 400,72 0,72" fill="rgba(21,101,192,0.06)" />
                  {/* Line */}
                  <polyline points="0,40 57,36 114,34 171,30 228,28 286,26 343,28 400,27" fill="none" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Current dot */}
                  <circle cx="400" cy="27" r="4.5" fill="#1565C0" />
                  <circle cx="400" cy="27" r="8" fill="rgba(21,101,192,0.15)" />
                  {/* Labels */}
                  {["−3h", "−2h", "−1h", "Maintenant"].map((t, i) => (
                    <text key={t} x={i * 133} y="70" fontSize="7.5" fill="#CBD5E1" textAnchor={i === 3 ? "end" : "start"}>{t}</text>
                  ))}
                  <text x="4" y="9" fontSize="7" fill="rgba(21,101,192,0.45)">180 mg/dL</text>
                  <text x="4" y="52" fontSize="7" fill="rgba(239,68,68,0.45)">70 mg/dL</text>
                </svg>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
