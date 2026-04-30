/*
 * Variante C — Fond sombre, goutte émeraude remplie + stéthoscope blanc
 * Haute autorité médicale · palette slate/forest
 */
export function C_UltraMinimal() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#F1F5F9", fontFamily: "'Inter', sans-serif" }}>

      <div style={{ width: 260, height: 300 }}>
        <svg viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            {/* Fond carré ardoise profond */}
            <linearGradient id="bgC" x1="0" y1="0" x2="100" y2="98" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#1E293B"/>
              <stop offset="100%" stopColor="#0F172A"/>
            </linearGradient>
            {/* Goutte : dégradé émeraude vif */}
            <linearGradient id="dropC" x1="57" y1="7" x2="57" y2="94" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#6EE7B7"/>
              <stop offset="40%"  stopColor="#10B981"/>
              <stop offset="100%" stopColor="#059669"/>
            </linearGradient>
            <radialGradient id="shineC" cx="30%" cy="20%" r="50%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.14"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Fond carré ardoise */}
          <rect width="100" height="98" rx="22" fill="url(#bgC)"/>
          <rect width="100" height="98" rx="22" fill="url(#shineC)"/>

          {/* ── GOUTTE REMPLIE émeraude sur fond sombre ── */}
          <path
            d="M 57 7
               C 27 31 23 56 23 70
               C 23 88 37 94 57 94
               C 77 94 91 88 91 70
               C 91 56 87 31 57 7 Z"
            fill="url(#dropC)"
          />

          {/* Reflet intérieur */}
          <path d="M 71 18 C 81 32 84 50 81 63"
            stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.6"/>

          {/* ── STÉTHOSCOPE blanc discret ── */}
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
            <tspan fill="#6EE7B7">Medi</tspan><tspan fill="#10B981">AI</tspan>
            <tspan fill="#94A3B8"> Care</tspan>
          </text>
        </svg>
      </div>

      <div style={{ textAlign: "center", maxWidth: 310 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
          Variante C · Dark
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1C1917",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Fond ardoise — goutte émeraude
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Clone premium · fond slate profond · goutte émeraude lumineuse
          · contraste maximal · haute autorité médicale
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden",
                      boxShadow: "0 2px 16px rgba(0,0,0,0.28)" }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="bgC3" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1E293B"/>
                <stop offset="100%" stopColor="#0F172A"/>
              </linearGradient>
              <linearGradient id="dropC3" x1="57" y1="5" x2="57" y2="92" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6EE7B7"/>
                <stop offset="100%" stopColor="#059669"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="18" fill="url(#bgC3)"/>
            <path d="M 57 7 C 27 31 23 56 23 70 C 23 88 37 94 57 94 C 77 94 91 88 91 70 C 91 56 87 31 57 7 Z" fill="url(#dropC3)"/>
            <path d="M 71 18 C 81 32 84 50 81 63" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.6"/>
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
                         background: "linear-gradient(135deg,#6EE7B7,#059669)",
                         WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8",
                         letterSpacing: "0.08em", marginLeft: 2 }}>CARE</span>
        </div>
      </div>
    </div>
  );
}
