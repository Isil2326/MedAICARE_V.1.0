export function C_UltraMinimal() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#FAFAF9", fontFamily: "'Inter', sans-serif" }}>

      {/* Logo at large scale */}
      <div style={{ width: 280, height: 280 }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            {/* Mono vert profond — "Less is more" */}
            <linearGradient id="bgC" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#10B981"/>
              <stop offset="100%" stopColor="#059669"/>
            </linearGradient>
            <radialGradient id="shineC" cx="40%" cy="18%" r="48%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.12"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
            {/* Drop clip path pour l'effet de fond */}
            <clipPath id="dropClip">
              <path d="M 52 10 C 67 31 79 48 79 65 A 27 27 0 1 1 25 65 C 25 48 37 31 52 10 Z"/>
            </clipPath>
          </defs>

          {/* Background — cercle pur, minimaliste */}
          <circle cx="50" cy="50" r="46" fill="url(#bgC)"/>
          <circle cx="50" cy="50" r="46" fill="url(#shineC)"/>

          {/* Drop — contour seul, lignes très fines = élégance */}
          <path
            d="M 52 10
               C 67 31 79 48 79 65
               A 27 27 0 1 1 25 65
               C 25 48 37 31 52 10 Z"
            stroke="white" strokeWidth="4" strokeLinejoin="round"
          />

          {/* Stéthoscope ultra-épuré :
              arceau très fin, pas de boules de jonction, just la forme essentielle */}
          <path d="M 5 36 C 5 14 23 14 23 36"
            stroke="white" strokeWidth="3.5" strokeLinecap="round"/>

          {/* Tube */}
          <path d="M 23 39 C 22 51 21 57 21 63"
            stroke="white" strokeWidth="3.5" strokeLinecap="round"/>

          {/* Chest piece — cercle seul, minimal, pas de point central */}
          <circle cx="21" cy="72" r="8" stroke="white" strokeWidth="3.5"/>
        </svg>
      </div>

      {/* Label */}
      <div style={{ textAlign: "center", maxWidth: 300 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
          Variante C
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1C1917",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Ultra Minimal
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Forme circulaire · lignes ultra-fines · pas de points de jonction
          · pureté géométrique absolue
        </div>
      </div>

      {/* Wordmark preview */}
      <div style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", background: "white",
                    borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 36, height: 36 }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="bgC2" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#10B981"/>
                <stop offset="100%" stopColor="#059669"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#bgC2)"/>
            <path d="M 52 10 C 67 31 79 48 79 65 A 27 27 0 1 1 25 65 C 25 48 37 31 52 10 Z"
              stroke="white" strokeWidth="4" strokeLinejoin="round"/>
            <path d="M 5 36 C 5 14 23 14 23 36" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M 23 39 C 22 51 21 57 21 63" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="21" cy="72" r="8" stroke="white" strokeWidth="3.5"/>
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em" }}>Medi</span>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em",
                           background: "linear-gradient(135deg,#10B981,#059669)",
                           WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8",
                           letterSpacing: "0.08em", marginLeft: 2 }}>CARE</span>
          </div>
          <div style={{ fontSize: 7.5, fontWeight: 700, color: "#94A3B8",
                        letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Votre santé, augmentée
          </div>
        </div>
      </div>
    </div>
  );
}
