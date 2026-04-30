export function C_UltraMinimal() {
  /*
   * Goutte C — "Slim" (fine & élégante, type "goutte de médicament")
   * Nettement plus étroite que A et B, presque calligraphique.
   * Épaules discrètes, pointe haute et fine.
   * Stéthoscope petit & discret, même style que la version cœur.
   */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#FAFAF9", fontFamily: "'Inter', sans-serif" }}>

      <div style={{ width: 280, height: 280 }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            {/* Dégradé vertical froid — "clinique" */}
            <linearGradient id="bgC" x1="50" y1="2" x2="50" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#34D399"/>
              <stop offset="55%"  stopColor="#059669"/>
              <stop offset="100%" stopColor="#047857"/>
            </linearGradient>
            <radialGradient id="shineC" cx="55%" cy="12%" r="42%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.24"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          <rect width="100" height="100" rx="22" fill="url(#bgC)"/>
          <rect width="100" height="100" rx="22" fill="url(#shineC)"/>

          {/*
           * GOUTTE "SLIM" — beaucoup plus étroite, style médicament
           * Largeur max ~36 unités (vs ~48 pour A et B)
           * tip: (57, 5)
           * Cercle: centre (57, 70), r=18
           * Right: (75, 70) gauche: (39, 70)
           * Path: tip → droite → arc bas → gauche → tip
           */}
          <path
            d="M 57 5
               C 57 5 75 30 75 70
               A 18 18 0 1 1 39 70
               C 39 30 57 5 57 5 Z"
            stroke="white" strokeWidth="4.5" strokeLinejoin="round"
          />

          {/* STÉTHOSCOPE petit & discret
              Le drop est plus à droite (centré ~57), binaural et chest piece s'ajustent */}
          <path d="M 6 35 C 6 14 24 14 24 35"
            stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
          <circle cx="6"  cy="36" r="2" fill="white"/>
          <circle cx="24" cy="35" r="2" fill="white"/>
          <path d="M 24 38 C 23 50 22 56 22 63"
            stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
          <circle cx="22" cy="71.5" r="8" stroke="white" strokeWidth="3.8"/>
          <circle cx="22" cy="71.5" r="2.8" fill="white"/>

          {/* Reflet intérieur — côté droit du slim drop */}
          <path d="M 65 18 C 66 28 67 40 66 52"
            stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.38"/>
        </svg>
      </div>

      <div style={{ textAlign: "center", maxWidth: 310 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
          Variante C
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1C1917",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Slim
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Goutte étroite & calligraphique · style goutte de médicament
          · silhouette fine & élégante · dégradé vertical
        </div>
      </div>

      {/* Mini wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", background: "white",
                    borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 34, height: 34 }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="bgC2" x1="50" y1="2" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#34D399"/>
                <stop offset="100%" stopColor="#047857"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#bgC2)"/>
            <path d="M 57 5 C 57 5 75 30 75 70 A 18 18 0 1 1 39 70 C 39 30 57 5 57 5 Z"
              stroke="white" strokeWidth="4.5" strokeLinejoin="round"/>
            <path d="M 6 35 C 6 14 24 14 24 35" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
            <circle cx="6" cy="36" r="2" fill="white"/>
            <circle cx="24" cy="35" r="2" fill="white"/>
            <path d="M 24 38 C 23 50 22 56 22 63" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
            <circle cx="22" cy="71.5" r="8" stroke="white" strokeWidth="3.8"/>
            <circle cx="22" cy="71.5" r="2.8" fill="white"/>
          </svg>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em" }}>Medi</span>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em",
                           background: "linear-gradient(135deg,#34D399,#047857)",
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
