/*
 * Variante B — App icon style
 * Même composition référence MAIS fond carré émeraude + goutte blanche inversée
 * (approach "dark mode" — identité app cohérente)
 */
export function B_MedicalPro() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#F0FDF4", fontFamily: "'Inter', sans-serif" }}>

      <div style={{ width: 260, height: 300 }}>
        <svg viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="bgB" x1="10" y1="5" x2="90" y2="98" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#34D399"/>
              <stop offset="50%"  stopColor="#059669"/>
              <stop offset="100%" stopColor="#064E3B"/>
            </linearGradient>
            <radialGradient id="shineB" cx="28%" cy="18%" r="55%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Fond carré arrondi émeraude */}
          <rect width="100" height="98" rx="22" fill="url(#bgB)"/>
          <rect width="100" height="98" rx="22" fill="url(#shineB)"/>

          {/* ── GOUTTE — contour blanc sur fond émeraude ── */}
          <path
            d="M 57 7
               C 27 31 23 56 23 70
               C 23 88 37 94 57 94
               C 77 94 91 88 91 70
               C 91 56 87 31 57 7 Z"
            fill="rgba(255,255,255,0.12)"
            stroke="white" strokeWidth="4.5"
          />

          {/* Reflet intérieur haut-droite */}
          <path d="M 71 18 C 81 32 84 50 81 63"
            stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>

          {/* ── STÉTHOSCOPE — blanc discret, bord gauche ── */}
          <path d="M 4 36 C 4 15 22 15 22 36"
            stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="4"  cy="37" r="2.8" fill="white"/>
          <circle cx="22" cy="36" r="2.8" fill="white"/>
          <path d="M 22 39.5 C 22 51 21 57 21 63"
            stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="21" cy="70" r="8.5" stroke="white" strokeWidth="4.5"/>
          <circle cx="21" cy="70" r="3.2" fill="white"/>

          {/* ── WORDMARK ── */}
          <text x="50" y="110" textAnchor="middle"
                fontFamily="Inter, sans-serif" fontSize="10" fontWeight="800"
                letterSpacing="-0.2">
            <tspan fill="#34D399">Medi</tspan><tspan fill="#34D399">AI</tspan>
            <tspan fill="#334155"> Care</tspan>
          </text>
        </svg>
      </div>

      <div style={{ textAlign: "center", maxWidth: 310 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
          Variante B · App Icon
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#134E4A",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Fond émeraude — contour blanc
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Clone inversé · fond carré émeraude · drop semi-transparente
          · cohérent avec l'identité app existante
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="bgB3" x1="10" y1="5" x2="90" y2="95" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34D399"/>
                <stop offset="100%" stopColor="#064E3B"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="18" fill="url(#bgB3)"/>
            <path d="M 57 7 C 27 31 23 56 23 70 C 23 88 37 94 57 94 C 77 94 91 88 91 70 C 91 56 87 31 57 7 Z" fill="rgba(255,255,255,0.12)" stroke="white" strokeWidth="4.5"/>
            <path d="M 71 18 C 81 32 84 50 81 63" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
            <path d="M 4 36 C 4 15 22 15 22 36" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="4" cy="37" r="2.8" fill="white"/>
            <circle cx="22" cy="36" r="2.8" fill="white"/>
            <path d="M 22 39.5 C 22 51 21 57 21 63" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="21" cy="70" r="8.5" stroke="white" strokeWidth="4.5"/>
            <circle cx="21" cy="70" r="3.2" fill="white"/>
          </svg>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em" }}>Medi</span>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em",
                         background: "linear-gradient(135deg,#10B981,#064E3B)",
                         WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8",
                         letterSpacing: "0.08em", marginLeft: 2 }}>CARE</span>
        </div>
      </div>
    </div>
  );
}
