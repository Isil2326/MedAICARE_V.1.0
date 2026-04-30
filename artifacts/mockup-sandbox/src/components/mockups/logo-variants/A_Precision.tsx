/*
 * Variante A — Référence Shutterstock clonée
 * Même composition : fond blanc/clair · goutte remplie (émeraude) ·
 * stéthoscope blanc discret sur le bord gauche · courbe de reflet intérieure
 */
export function A_Precision() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>

      {/* ── LOGO MARK ── */}
      <div style={{ width: 260, height: 300 }}>
        <svg viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            {/* Dégradé émeraude dans la goutte remplie */}
            <linearGradient id="dropA" x1="57" y1="7" x2="57" y2="94" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#34D399"/>
              <stop offset="45%"  stopColor="#10B981"/>
              <stop offset="100%" stopColor="#065F46"/>
            </linearGradient>
          </defs>

          {/* ── GOUTTE REMPLIE — forme organique type référence ── */}
          <path
            d="M 57 7
               C 27 31 23 56 23 70
               C 23 88 37 94 57 94
               C 77 94 91 88 91 70
               C 91 56 87 31 57 7 Z"
            fill="url(#dropA)"
          />

          {/* Contour fin pour la définition */}
          <path
            d="M 57 7
               C 27 31 23 56 23 70
               C 23 88 37 94 57 94
               C 77 94 91 88 91 70
               C 91 56 87 31 57 7 Z"
            stroke="#059669" strokeWidth="0.8" opacity="0.4"
          />

          {/* Reflet courbe intérieure haut-droite (comme référence) */}
          <path d="M 71 18 C 81 32 84 50 81 63"
            stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.55"/>

          {/* ── STÉTHOSCOPE — blanc, discret, bord gauche ── */}
          {/* Arceau binaural — à l'extérieur gauche de la goutte */}
          <path d="M 4 36 C 4 15 22 15 22 36"
            stroke="white" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="4"  cy="37" r="2.5" fill="white"/>
          <circle cx="22" cy="36" r="2.5" fill="white"/>
          {/* Tube descendant */}
          <path d="M 22 39.5 C 22 51 21 57 21 63"
            stroke="white" strokeWidth="4" strokeLinecap="round"/>
          {/* Pièce thoracique — chevauchant le bord gauche de la goutte */}
          <circle cx="21" cy="70" r="8.5" stroke="white" strokeWidth="4"/>
          <circle cx="21" cy="70" r="3"   fill="white"/>

          {/* ── WORDMARK sous la goutte ── */}
          <text x="57" y="108" textAnchor="middle"
                fontFamily="Inter, sans-serif" fontSize="11" fontWeight="800"
                letterSpacing="-0.3">
            <tspan fill="#10B981">Medi</tspan><tspan fill="#10B981">AI</tspan>
            <tspan fill="#334155"> Care</tspan>
          </text>
        </svg>
      </div>

      {/* ── Label ── */}
      <div style={{ textAlign: "center", maxWidth: 310 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
          Variante A · Référence
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#064E3B",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Goutte remplie — fond blanc
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Clone de la composition Shutterstock · fond blanc · goutte émeraude solide
          · stéthoscope blanc discret sur le bord gauche · reflet intérieur
        </div>
      </div>

      {/* ── Mini icon app ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <rect width="100" height="100" fill="white"/>
            <defs>
              <linearGradient id="dropA3" x1="57" y1="7" x2="57" y2="95" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34D399"/>
                <stop offset="100%" stopColor="#065F46"/>
              </linearGradient>
            </defs>
            {/* Drop shifted up to fit in square icon */}
            <g transform="translate(0, -5)">
              <path d="M 57 7 C 27 31 23 56 23 70 C 23 88 37 94 57 94 C 77 94 91 88 91 70 C 91 56 87 31 57 7 Z" fill="url(#dropA3)"/>
              <path d="M 71 18 C 81 32 84 50 81 63" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.55"/>
              <path d="M 4 36 C 4 15 22 15 22 36" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="4" cy="37" r="2.5" fill="white"/>
              <circle cx="22" cy="36" r="2.5" fill="white"/>
              <path d="M 22 39.5 C 22 51 21 57 21 63" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="21" cy="70" r="8.5" stroke="white" strokeWidth="4"/>
              <circle cx="21" cy="70" r="3" fill="white"/>
            </g>
          </svg>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em" }}>Medi</span>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em",
                         background: "linear-gradient(135deg,#10B981,#047857)",
                         WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8",
                         letterSpacing: "0.08em", marginLeft: 2 }}>CARE</span>
        </div>
      </div>
    </div>
  );
}
