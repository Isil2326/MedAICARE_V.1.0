export function A_Precision() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#F0FDF4", fontFamily: "'Inter', sans-serif" }}>

      {/* Logo at large scale */}
      <div style={{ width: 280, height: 280 }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="bgA" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#34D399"/>
              <stop offset="50%"  stopColor="#10B981"/>
              <stop offset="100%" stopColor="#047857"/>
            </linearGradient>
            <radialGradient id="shineA" cx="28%" cy="22%" r="55%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Background */}
          <rect width="100" height="100" rx="22" fill="url(#bgA)"/>
          <rect width="100" height="100" rx="22" fill="url(#shineA)"/>

          {/* Water drop — mathematically precise teardrop
              Tip (54,8) · Circle center (54,64) r=27 · Left(27,64) · Right(81,64) */}
          <path
            d="M 54 8
               C 69 29 81 46 81 64
               A 27 27 0 1 1 27 64
               C 27 46 39 29 54 8 Z"
            stroke="white" strokeWidth="5" strokeLinejoin="round"
          />

          {/* Binaural spring — compact U-arch, upper-left, fully outside drop */}
          <path d="M 6 36 C 6 15 24 15 24 36"
            stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="6"  cy="37" r="2.6" fill="white"/>
          <circle cx="24" cy="36" r="2.6" fill="white"/>

          {/* Tube — natural curve to chest piece */}
          <path d="M 24 39.5 C 23 51 22 57 22 62"
            stroke="white" strokeWidth="4.5" strokeLinecap="round"/>

          {/* Chest piece — ring + center dot, overlapping lower-left of drop */}
          <circle cx="22" cy="71" r="9"   stroke="white" strokeWidth="4.5"/>
          <circle cx="22" cy="71" r="3.2" fill="white"/>

          {/* Interior drop reflection */}
          <path d="M 63 23 C 65 32 66 42 65 50"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.4"/>
        </svg>
      </div>

      {/* Label */}
      <div style={{ textAlign: "center", maxWidth: 300 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
          Variante A
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#064E3B",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Précision
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Goutte géométrique parfaite · stéthoscope compact
          et discret · style BP Journal · dégradé émeraude 3 tons
        </div>
      </div>

      {/* Wordmark preview */}
      <div style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", background: "white",
                    borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 36, height: 36 }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="bgA2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#34D399"/>
                <stop offset="100%" stopColor="#047857"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#bgA2)"/>
            <path d="M 54 8 C 69 29 81 46 81 64 A 27 27 0 1 1 27 64 C 27 46 39 29 54 8 Z"
              stroke="white" strokeWidth="5" strokeLinejoin="round"/>
            <path d="M 6 36 C 6 15 24 15 24 36" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="6" cy="37" r="2.6" fill="white"/>
            <circle cx="24" cy="36" r="2.6" fill="white"/>
            <path d="M 24 39.5 C 23 51 22 57 22 62" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="22" cy="71" r="9" stroke="white" strokeWidth="4.5"/>
            <circle cx="22" cy="71" r="3.2" fill="white"/>
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em" }}>Medi</span>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em",
                           background: "linear-gradient(135deg,#10B981,#047857)",
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
