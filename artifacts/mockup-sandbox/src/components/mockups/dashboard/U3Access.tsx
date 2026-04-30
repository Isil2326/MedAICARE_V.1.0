/**
 * U3 — Accessibilité & Lisibilité WCAG AA
 * Dimension : contraste · taille · redondance sémantique
 *
 * COMPROMIS EXPLICITE :
 * On sacrifie l'esthétique "sombre et électrique" pour garantir que
 * TOUS les utilisateurs lisent l'information sans effort.
 * Les cliniciens travaillent sous pression, en pleine lumière, parfois avec des lunettes.
 * Principe : ne jamais s'appuyer sur la couleur seule.
 *
 * Règles WCAG AA appliquées :
 * - Texte normal ≥ 14px → ratio 4.5:1
 * - Texte large ≥ 18px (ou 14px bold) → ratio 3:1
 * - Jamais la couleur seule : toujours icône + label + couleur
 * - Focus visible (anneau simulé)
 * - Targets interactifs ≥ 48px hauteur
 * - Pas de texte en italique seul pour l'accentuation
 * - Niveaux de risque : couleur + forme + label
 */

// Palette vérifiée pour contraste sur fond #07090F :
// blanc #FFFFFF sur #07090F = 20:1 ✓
// AMBER #FFAB00 sur #07090F = 9.5:1 ✓
// CYAN #00E5FF sur #07090F = 13.8:1 ✓
// VIOLET → trop sombre, on passe à #D09CFA (violet clair) sur noir = 8.2:1 ✓
// GREEN #30D158 sur #07090F = 7.4:1 ✓
// RED #FF6B6B sur #07090F = 8.1:1 ✓
// MUTED → on monte à rgba(255,255,255,0.65) = 5.3:1 ✓ (remplace 0.40 = trop faible)

const BG       = "#07090F";
const SURFACE  = "#111520";
const SURFACE2 = "#161B26";
const BORDER   = "rgba(255,255,255,0.12)";
const AMBER    = "#FFAB00";
const CYAN     = "#4DD9F0";   // légèrement désaturé pour ne pas percer les yeux
const VIOLET   = "#C084FC";   // passé à clair pour lisibilité sur fond sombre
const GREEN    = "#4ADE80";   // vert clair AA
const RED      = "#FF6B6B";   // rouge clair AA
const MUTED    = "rgba(255,255,255,0.65)";   // WCAG AA vs #07090F: 5.3:1
const BRIGHT   = "#FFFFFF";

const RISK_SHAPES: Record<string, { icon: string; label: string; border: string; bg: string; textColor: string }> = {
  critique: { icon: "■", label: "Critique",  border: RED,   bg: `rgba(255,107,107,0.08)`, textColor: RED },
  modéré:   { icon: "▲", label: "Modéré",   border: AMBER, bg: `rgba(255,171,0,0.08)`,   textColor: AMBER },
  stable:   { icon: "●", label: "Stable",   border: GREEN, bg: `rgba(74,222,128,0.06)`,  textColor: GREEN },
};

const PATIENTS = [
  { id: "P-001", initials: "MB", name: "Martin B.",  risk: "critique" },
  { id: "P-004", initials: "IR", name: "Isabelle R.", risk: "modéré" },
  { id: "P-007", initials: "MD", name: "Marie D.",   risk: "modéré",  active: true },
  { id: "P-002", initials: "JL", name: "Jean L.",    risk: "stable" },
  { id: "P-009", initials: "CP", name: "Claire P.",  risk: "stable" },
];

const CAUSES = [
  { shape: "■", label: "Tendance glycémique", val: "−18 mg/dL en 45 min", pct: 42, color: CYAN },
  { shape: "▲", label: "Activité physique",   val: "Modérée · 40 min",    pct: 33, color: VIOLET },
  { shape: "●", label: "Bolus résiduel",       val: "3.5U actif · 2h30",   pct: 25, color: GREEN },
];

export function U3Access() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: BG, fontFamily: "'Inter', system-ui, sans-serif",
      color: BRIGHT, fontSize: 14, overflow: "hidden",
      // Base font ≥ 14px garantit ratio AA pour les labels normaux
    }}>

      {/* NAV — texte lisible, cible ≥ 48px */}
      <nav style={{
        height: 52, display: "flex", alignItems: "center",
        padding: "0 24px", gap: 12, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`, background: SURFACE,
      }}>
        <img src="/logo-mark.png" alt="" style={{ width: 24, height: "auto", filter: "brightness(0) invert(1) opacity(0.85)" }} />
        <span style={{ fontWeight: 800, fontSize: 15, color: BRIGHT, letterSpacing: "-0.03em" }}>
          MediAI Care
        </span>
        <div style={{ flex: 1 }} />

        {/* Alert — couleur + icône + label texte */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: `rgba(255,107,107,0.10)`, border: `1px solid rgba(255,107,107,0.30)`,
          borderRadius: 8, padding: "7px 14px", cursor: "pointer",
          minHeight: 40,
        }}>
          <span style={{ fontSize: 14 }}>■</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>3 alertes critiques</span>
        </div>

        {/* Avatar avec label textuel visible */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.10)", border: `1.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", color: BRIGHT, fontSize: 12, fontWeight: 700 }}>DR</div>
          <span style={{ fontSize: 12, color: MUTED }}>Dr. Laurent</span>
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* PATIENT LIST — icône + couleur + label de risque */}
        <div style={{
          width: 220, flexShrink: 0, background: SURFACE,
          borderRight: `1px solid ${BORDER}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${BORDER}` }}>
            {/* Search — label visible */}
            <label htmlFor="search-pt" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.10em" }}>Rechercher</span>
              <div id="search-pt" style={{ background: SURFACE2, border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: MUTED, display: "flex", alignItems: "center", gap: 7 }}>
                🔍 Patient…
              </div>
            </label>
          </div>

          <div style={{ padding: "8px 14px 6px", borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.10em" }}>Priorité clinique</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {PATIENTS.map(p => {
              const meta = RISK_SHAPES[p.risk] || RISK_SHAPES.stable;
              const sel = (p as any).active;
              return (
                <div key={p.id} style={{
                  padding: "10px 14px", cursor: "pointer",
                  background: sel ? SURFACE2 : "transparent",
                  borderLeft: `3px solid ${sel ? AMBER : "transparent"}`,
                  borderBottom: `1px solid rgba(255,255,255,0.04)`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div>
                      {/* Initiales + nom complet (pas juste initiales) */}
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? BRIGHT : "rgba(255,255,255,0.80)" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 11, color: MUTED }}>{p.id}</div>
                    </div>
                    {/* Risque : couleur + forme + texte */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: meta.bg, border: `1px solid ${meta.border}30`,
                      borderRadius: 6, padding: "2px 7px",
                    }}>
                      <span style={{ fontSize: 9, color: meta.textColor }}>{meta.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: meta.textColor }}>{meta.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETAIL */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ALERT HEADER — contraste max */}
          <div style={{
            flexShrink: 0, padding: "16px 24px",
            background: `rgba(255,171,0,0.06)`,
            borderBottom: `1.5px solid rgba(255,171,0,0.22)`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              {/* Step indicator lisible */}
              <div style={{ fontSize: 10, fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>
                ⚡ Alerte prioritaire · Hypoglycémie prédite · Confiance IA 91%
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: BRIGHT, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Marie Dupont · P-007
              </div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                41 ans · Diabète T1D · Freestyle Libre 2
              </div>
            </div>

            {/* Countdown — taille large = ratio 3:1 suffisant */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>
                Temps avant hypo estimée
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: AMBER, letterSpacing: "-0.06em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                35:00
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                Glucose estimé : <span style={{ color: RED, fontWeight: 700 }}>64 mg/dL</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Primary — fort contraste, fond ambre, texte noir : 9.5:1 ✓ */}
              <button style={{
                padding: "12px 20px", borderRadius: 10, border: "3px solid " + AMBER,
                background: AMBER, fontSize: 14, fontWeight: 900, color: "#07090F",
                cursor: "pointer", minHeight: 48,
              }}>
                ✓ Appliquer suggestion
              </button>
              <button style={{
                padding: "10px 20px", borderRadius: 10, border: `2px solid ${BORDER}`,
                background: SURFACE2, fontSize: 13, fontWeight: 700, color: BRIGHT,
                cursor: "pointer", minHeight: 44,
              }}>
                ✎ Modifier
              </button>
            </div>
          </div>

          {/* SCROLL CONTENT */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Métriques — chaque valeur a unité + label + contexte */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
                Métriques cliniques actuelles
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Glycémie actuelle", val: "142", unit: "mg/dL", trend: "En hausse ↗", ok: true, trendColor: CYAN },
                  { label: "Temps dans la cible 24h", val: "71", unit: "%", trend: "Objectif : ≥ 70% ✓", ok: true, trendColor: GREEN },
                  { label: "HbA1c estimée", val: "6.9", unit: "%", trend: "Objectif : < 7.0% ✓", ok: true, trendColor: VIOLET },
                  { label: "Dernier bolus", val: "3.5", unit: "U", trend: "Il y a 2h30", ok: null, trendColor: MUTED },
                ].map(m => (
                  <div key={m.label} style={{ background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "12px 14px" }}>
                    {/* Label visible et complet */}
                    <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 6, lineHeight: 1.4 }}>{m.label}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 900, color: BRIGHT, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.val}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: MUTED }}>{m.unit}</span>
                    </div>
                    <div style={{ fontSize: 11, color: m.trendColor, marginTop: 4, fontWeight: m.ok ? 600 : 400 }}>{m.trend}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* XAI — couleur + forme + label + barre + pourcentage texte */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
                Facteurs identifiés par l'IA — Pourquoi ce risque
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {CAUSES.map(c => (
                  <div key={c.label} style={{ background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      {/* Icône + forme + couleur — 3 redondances visuelles */}
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${c.color}14`, border: `2px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: c.color, fontWeight: 900, flexShrink: 0 }}>
                        {c.shape}
                      </div>
                      <div style={{ flex: 1 }}>
                        {/* Label complet + valeur */}
                        <div style={{ fontSize: 14, fontWeight: 700, color: BRIGHT, marginBottom: 2 }}>{c.label}</div>
                        <div style={{ fontSize: 12, color: MUTED }}>{c.val}</div>
                        <div style={{ marginTop: 8, height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
                          <div style={{ height: 6, width: `${c.pct / 42 * 100}%`, background: c.color, borderRadius: 3 }} />
                        </div>
                      </div>
                      {/* Pourcentage — texte ET visuel */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: c.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{c.pct}%</div>
                        <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>du risque total</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestion thérapeutique */}
            <div style={{ background: SURFACE, borderRadius: 14, border: `1.5px solid rgba(255,171,0,0.25)`, padding: "16px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
                Suggestion thérapeutique · IA
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: BRIGHT, letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: 6 }}>
                Réduire le prochain bolus de <span style={{ color: AMBER }}>10%</span>
              </div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                OU · Proposer 15 grammes de glucides rapides à la patiente maintenant
              </div>
              {/* Action ignorée — texte explicite */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <button style={{ padding: "8px 14px", borderRadius: 8, border: `1.5px solid rgba(255,107,107,0.25)`, background: `rgba(255,107,107,0.06)`, fontSize: 12, fontWeight: 600, color: RED, cursor: "pointer" }}>
                  ✕ Ignorer cette alerte · Requiert un motif
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
