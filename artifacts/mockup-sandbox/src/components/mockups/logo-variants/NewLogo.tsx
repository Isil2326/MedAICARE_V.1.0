/*
 * NOUVEAU LOGO — MediAI Care
 * Composition : goutte de sang (rouge) + anneaux de ripple concentriques
 * Basé sur la référence image fournie · bleu → rouge sang/glucose
 * Wordmark : "MediAI Care" · Slogan : "Reprenez le contrôle"
 */
export function NewLogo() {

  /* ─────────────────────────────────────────────────────────────
   * SVG Helper — le logo mark seul (réutilisé en plusieurs tailles)
   * ViewBox 200×170, crop ripples + drop + crescent
   * ───────────────────────────────────────────────────────────── */
  const LogoMark = ({ size = 220 }: { size?: number }) => (
    <svg
      viewBox="0 0 200 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size * (170 / 200) }}
    >
      <defs>
        {/* Dégradé goutte : bordeaux profond en haut → rouge vif en bas */}
        <linearGradient id="dropRed" x1="100" y1="12" x2="100" y2="148"
          gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6B1010"/>
          <stop offset="35%"  stopColor="#B91C1C"/>
          <stop offset="80%"  stopColor="#DC2626"/>
          <stop offset="100%" stopColor="#EF4444"/>
        </linearGradient>

        {/* Ombre portée sur la goutte */}
        <filter id="dropShadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#7F1D1D" floodOpacity="0.30"/>
        </filter>
      </defs>

      {/* ── ANNEAUX DE RIPPLE ── dessinés en premier (derrière la goutte)
          3 bandes elliptiques concentriques, rouge décroissant vers l'extérieur */}

      {/* Anneau 3 — le plus grand */}
      <ellipse cx="100" cy="148" rx="78" ry="19" fill="#FCA5A5" opacity="0.50"/>
      <ellipse cx="100" cy="148" rx="66" ry="13" fill="white"/>

      {/* Anneau 2 */}
      <ellipse cx="100" cy="148" rx="57" ry="14" fill="#EF4444" opacity="0.68"/>
      <ellipse cx="100" cy="148" rx="46" ry="9"  fill="white"/>

      {/* Anneau 1 — le plus proche de la goutte */}
      <ellipse cx="100" cy="148" rx="38" ry="9.5" fill="#DC2626" opacity="0.85"/>
      <ellipse cx="100" cy="148" rx="28" ry="5.5" fill="white"/>

      {/* ── GOUTTE — forme organique identique à la référence ──
          Tip en haut (100,12), corps large, base arrondie (centre 100,108 r=35) */}
      <path
        d="M 100 12
           C 68 42 63 80 63 108
           A 37 37 0 1 0 137 108
           C 137 80 132 42 100 12 Z"
        fill="url(#dropRed)"
        filter="url(#dropShadow)"
      />

      {/* ── REFLET EN CROISSANT — identique à la référence
          Épaisse forme blanche sur le bas-droite de l'intérieur de la goutte */}
      <path
        d="M 113 70
           C 133 93 133 122 122 138
           C 112 146 99 140 95 129
           C 107 136 126 115 124 90
           C 122 78 116 66 113 70 Z"
        fill="white"
        opacity="0.82"
      />
    </svg>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 0, padding: "40px 32px" }}>

      {/* ── PRÉSENTATION PRINCIPALE ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 48 }}>

        {/* Logo mark grande taille */}
        <LogoMark size={240} />

        {/* Wordmark */}
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em",
                        lineHeight: 1, marginBottom: 6 }}>
            <span style={{ color: "#111827" }}>Medi</span>
            <span style={{
              background: "linear-gradient(135deg, #DC2626, #991B1B)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>AI</span>
            <span style={{ color: "#111827" }}> Care</span>
          </div>
          {/* Slogan */}
          <div style={{ fontSize: 14, fontWeight: 500, color: "#6B7280",
                        letterSpacing: "0.08em", textTransform: "uppercase",
                        fontStyle: "italic" }}>
            Reprenez le contrôle
          </div>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 640, height: 1,
                    background: "#F1F5F9", marginBottom: 40 }}/>

      {/* ── VARIANTES DE COULEUR DE FOND ── */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center",
                    marginBottom: 40 }}>

        {/* Sur blanc */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ width: 100, height: 100, borderRadius: 20, background: "#FFFFFF",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.10)", display: "flex",
                        alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <LogoMark size={88} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8",
                         letterSpacing: "0.12em", textTransform: "uppercase" }}>Fond blanc</span>
        </div>

        {/* Sur sombre */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ width: 100, height: 100, borderRadius: 20,
                        background: "linear-gradient(135deg,#1E293B,#0F172A)",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.28)", display: "flex",
                        alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <LogoMark size={88} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8",
                         letterSpacing: "0.12em", textTransform: "uppercase" }}>Fond sombre</span>
        </div>

        {/* Sur rouge clair */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ width: 100, height: 100, borderRadius: 20, background: "#FEF2F2",
                        boxShadow: "0 2px 16px rgba(220,38,38,0.12)", display: "flex",
                        alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <LogoMark size={88} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8",
                         letterSpacing: "0.12em", textTransform: "uppercase" }}>Fond rouge pâle</span>
        </div>

        {/* Wordmark horizontal */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ height: 100, borderRadius: 20, background: "#FFFFFF",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.10)", display: "flex",
                        alignItems: "center", justifyContent: "center", padding: "0 20px",
                        gap: 12 }}>
            <div style={{ width: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogoMark size={50} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                <span style={{ color: "#111827" }}>Medi</span>
                <span style={{
                  background: "linear-gradient(135deg, #DC2626, #991B1B)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                }}>AI</span>
                <span style={{ color: "#111827" }}> Care</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 500, color: "#9CA3AF",
                            letterSpacing: "0.10em", textTransform: "uppercase",
                            fontStyle: "italic", marginTop: 3 }}>
                Reprenez le contrôle
              </div>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8",
                         letterSpacing: "0.12em", textTransform: "uppercase" }}>Wordmark horizontal</span>
        </div>
      </div>

      {/* ── NOTE DESIGN ── */}
      <div style={{ maxWidth: 500, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.7 }}>
          Goutte de sang rouge · anneaux concentriques (ripple) · croissant blanc intérieur ·
          gradient bordeaux profond → rouge vif
        </div>
      </div>

    </div>
  );
}
