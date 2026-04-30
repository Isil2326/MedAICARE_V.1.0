/**
 * V3 — Focus Urgence Adaptif
 * Axe exploré : l'espace lui-même encode l'urgence
 * Insight : A1 traite toutes les situations de la même façon (même layout, alerte ou non).
 * Ce design : quand une alerte est active, le layout SE RESTRUCTURE.
 * La liste patients se réduit à des points colorés. L'alerte prend tout l'espace.
 * Le médecin ne peut pas "ne pas voir" l'urgence — la UI l'y force.
 */

const PATIENTS = [
  { id: "P-001", name: "Martin Bernard", risk: "critical", initials: "MB" },
  { id: "P-004", name: "Isabelle Roux",  risk: "high",     initials: "IR" },
  { id: "P-007", name: "Marie Dupont",   risk: "moderate", initials: "MD" },
  { id: "P-002", name: "Jean Leroy",     risk: "low",      initials: "JL" },
  { id: "P-009", name: "Claire Petit",   risk: "low",      initials: "CP" },
];

const RISK_COL: Record<string, { bg: string; border: string; text: string }> = {
  critical: { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B" },
  high:     { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
  moderate: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
  low:      { bg: "#F0FDF4", border: "#BBF7D0", text: "#14532D" },
};

const RISK_DOT: Record<string, string> = {
  critical: "#EF4444", high: "#F59E0B", moderate: "#3B82F6", low: "#22C55E",
};

const SEL = PATIENTS[2];

export function XaiV3() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "#F0F4F8", fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 13, color: "#0F172A", overflow: "hidden",
    }}>

      {/* NAV — contexte réduit, accent sur l'alerte */}
      <nav style={{
        height: 52, background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
        display: "flex", alignItems: "center", padding: "0 20px", gap: 8,
        flexShrink: 0,
      }}>
        <img src="/logo-mark.png" alt="" style={{ width: 26, height: "auto" }} />
        <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.04em" }}>
          Medi<span style={{ color: "#1565C0" }}>AI</span> Care
        </span>
        <div style={{ flex: 1 }} />

        {/* Mode alerte badge — prominent */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#FEF2F2", border: "1.5px solid #FECACA",
          borderRadius: 10, padding: "6px 16px",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444",
                         boxShadow: "0 0 0 3px rgba(239,68,68,0.20)" }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#991B1B" }}>MODE ALERTE ACTIF</span>
          <span style={{ fontSize: 11, color: "#EF4444" }}>3 patients prioritaires</span>
        </div>

        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1565C0,#0D47A1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 800, marginLeft: 8 }}>DR</div>
      </nav>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── PATIENT STRIP — réduit à des dots ── */}
        <div style={{
          width: 56, flexShrink: 0, background: "#FFFFFF",
          borderRight: "1px solid #E2E8F0",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "12px 0", gap: 10,
        }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, textAlign: "center", lineHeight: 1.3 }}>
            10<br />pts
          </div>
          {PATIENTS.map(p => {
            const sel = p.id === SEL.id;
            return (
              <div key={p.id} style={{
                width: 36, height: 36, borderRadius: "50%",
                background: sel ? "#0D47A1" : RISK_COL[p.risk].bg,
                border: `2px solid ${sel ? "#0D47A1" : RISK_COL[p.risk].border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 900,
                color: sel ? "white" : RISK_COL[p.risk].text,
                cursor: "pointer",
                boxShadow: sel ? "0 0 0 3px rgba(13,71,161,0.20)" : "none",
                position: "relative",
              }}>
                {p.initials}
                {/* Risk dot */}
                {!sel && (
                  <span style={{
                    position: "absolute", top: -2, right: -2,
                    width: 9, height: 9, borderRadius: "50%",
                    background: RISK_DOT[p.risk],
                    border: "1.5px solid white",
                  }} />
                )}
              </div>
            );
          })}
          <div style={{ marginTop: 4, fontSize: 9, color: "#94A3B8", textAlign: "center", lineHeight: 1.4 }}>
            +5<br />autres
          </div>
        </div>

        {/* ── ALERT FOCUS ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ALERT HEADER — grande bannière */}
          <div style={{
            background: "linear-gradient(100deg, #7F1D1D, #991B1B, #B91C1C)",
            padding: "14px 22px", flexShrink: 0,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Patient mini */}
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 13 }}>MD</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#FFFFFF" }}>ALERTE · Marie Dupont</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>41 ans · T1D · P-007</span>
                </div>
                <div style={{ fontSize: 13, color: "#FCA5A5", marginTop: 2, fontWeight: 600 }}>
                  ⚡ Hypoglycémie prédite · Glycémie estimée 64 mg/dL
                </div>
              </div>
            </div>

            {/* COUNTDOWN */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2 }}>
                Temps restant estimé
              </div>
              <div style={{ fontSize: 42, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.05em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                35:00
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.50)", marginTop: 2 }}>avant l'événement prédit</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "8px 14px", borderRadius: 9, border: "1.5px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.10)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.80)", cursor: "pointer" }}>
                Fausse alerte
              </button>
              <button style={{ padding: "8px 14px", borderRadius: 9, border: "none", background: "#FFFFFF", fontSize: 12, fontWeight: 700, color: "#991B1B", cursor: "pointer" }}>
                ✓ Prendre en charge
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* ════ XAI — LARGE, CENTRE ════ */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                {
                  icon: "📉", label: "Tendance descendante", pct: 42,
                  detail: "−18 mg/dL en 45 min continus",
                  context: "Signal le plus fort. La glycémie descend à un rythme qui dépasse le seuil d'alerte.",
                  color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE",
                },
                {
                  icon: "🏃", label: "Activité physique", pct: 33,
                  detail: "Exercice modéré · 40 min",
                  context: "Détecté via accéléromètre. L'activité augmente la sensibilité à l'insuline.",
                  color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE",
                },
                {
                  icon: "🍽️", label: "Bolus résiduel", pct: 25,
                  detail: "3.5U administrés il y a 2h30",
                  context: "L'insuline administrée est encore active. Effet résiduel estimé à 1.2U.",
                  color: "#0D6657", bg: "#F0FDFA", border: "#99F6E4",
                },
              ].map(f => (
                <div key={f.label} style={{
                  background: f.bg, border: `1.5px solid ${f.border}`,
                  borderRadius: 14, padding: "16px 18px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: 28 }}>{f.icon}</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: f.color, letterSpacing: "-0.04em" }}>{f.pct}%</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: f.color, marginBottom: 6 }}>{f.detail}</div>
                  <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>{f.context}</div>
                  {/* Weight bar */}
                  <div style={{ marginTop: 10, height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${f.pct / 42 * 100}%`, background: f.color, borderRadius: 2, opacity: 0.7 }} />
                  </div>
                  <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>Contribution au risque</div>
                </div>
              ))}
            </div>

            {/* ════ SUGGESTION + ACTIONS GRANDES ════ */}
            <div style={{ display: "flex", gap: 12 }}>

              {/* Suggestion */}
              <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #0A2F6E, #1565C0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em" }}>Recommandation IA · 91% confiance</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Suggestion thérapeutique</div>
                  </div>
                </div>

                <div style={{ background: "#FFF8E1", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#78350F", lineHeight: 1.4, marginBottom: 4 }}>
                    Réduire le prochain bolus de <span style={{ color: "#B45309" }}>10%</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#92400E" }}>
                    OU · Proposer 15g de glucides rapides à la patiente maintenant
                  </div>
                </div>

                {/* Conséquences attendues */}
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6 }}>Résultat attendu si appliqué</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { label: "Glucose min prédit", val: "82 mg/dL", sub: "vs 64 sans action", color: "#0D9488" },
                    { label: "TIR maintenu", val: "71% → 73%", sub: "+2% sur 24h", color: "#1565C0" },
                  ].map(r => (
                    <div key={r.label} style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: r.color }}>{r.val}</div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>{r.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIONS — grandes, distinctes */}
              <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em" }}>Votre décision</div>
                <button style={{
                  flex: 1, borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #0D47A1, #1565C0)",
                  fontSize: 14, fontWeight: 800, color: "white", cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(13,71,161,0.30)",
                  lineHeight: 1.4,
                }}>
                  ✓ Appliquer<br />
                  <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.8 }}>Valider la suggestion</span>
                </button>
                <button style={{
                  flex: 1, borderRadius: 14,
                  border: "2px solid #E2E8F0", background: "#FFFFFF",
                  fontSize: 14, fontWeight: 700, color: "#475569", cursor: "pointer",
                  lineHeight: 1.4,
                }}>
                  ✎ Modifier<br />
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#94A3B8" }}>Ajuster et valider</span>
                </button>
                <button style={{
                  padding: "10px", borderRadius: 10,
                  border: "1.5px solid #E2E8F0", background: "#F8FAFC",
                  fontSize: 12, fontWeight: 500, color: "#94A3B8", cursor: "pointer",
                }}>
                  Ignorer · annoter
                </button>
              </div>
            </div>

            {/* Contexte patient minimal */}
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E2E8F0", padding: "12px 18px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 8 }}>Contexte · Marie Dupont</div>
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { label: "Glycémie", val: "142 mg/dL ↗" },
                  { label: "TIR 24h", val: "71%" },
                  { label: "HbA1c estimée", val: "6.9%" },
                  { label: "Dernier bolus", val: "3.5U · 2h30" },
                  { label: "Capteur", val: "Libre 2 · 4j 7h" },
                ].map(c => (
                  <div key={c.label}>
                    <div style={{ fontSize: 10, color: "#94A3B8" }}>{c.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{c.val}</div>
                  </div>
                ))}
                <div style={{ flex: 1 }} />
                <button style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #BFDBFE", background: "#EFF6FF", fontSize: 11, fontWeight: 600, color: "#1565C0", cursor: "pointer" }}>
                  Voir dossier complet →
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
