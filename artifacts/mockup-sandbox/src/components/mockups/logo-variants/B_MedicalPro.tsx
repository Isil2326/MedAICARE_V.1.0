export function B_MedicalPro() {
  /*
   * Goutte B — "Naturelle" (forme larme organique)
   * Les côtés s'incurvent vers l'extérieur avant de converger vers la pointe —
   * silhouette "ventre de larme" qu'on retrouve dans les icônes médicales premium.
   * Stéthoscope petit & discret, même style que la version cœur.
   */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#F0F9FF", fontFamily: "'Inter', sans-serif" }}>

      <div style={{ width: 280, height: 280 }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="bgB" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#6EE7B7"/>
              <stop offset="40%"  stopColor="#059669"/>
              <stop offset="100%" stopColor="#064E3B"/>
            </linearGradient>
            <radialGradient id="shineB" cx="25%" cy="15%" r="55%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          <rect width="100" height="100" rx="22" fill="url(#bgB)"/>
          <rect width="100" height="100" rx="22" fill="url(#shineB)"/>

          {/*
           * GOUTTE "NATURELLE" — forme larme avec ventre bombé
           * Les côtés gonflent vers l'extérieur au niveau des épaules
           * puis convergent en pointe douce vers le haut.
           *
           * tip: (55, 8)
           * Right side: from (55,8) via (88,28)(84,54) to right of circle (79,66)
           * Arc bottom: (79,66) → bas → (31,66), circle centre (55,66) r=24, sweep=1, large=1
           * Left side:  from (31,66) via (26,54)(22,28) back to (55,8)
           */}
          <path
            d="M 55 8
               C 88 28 84 54 79 66
               A 24 24 0 1 1 31 66
               C 26 54 22 28 55 8 Z"
            stroke="white" strokeWidth="4.8" strokeLinejoin="round"
          />

          {/* STÉTHOSCOPE petit & discret */}
          <path d="M 5 34 C 5 13 23 13 23 34"
            stroke="white" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="5"  cy="35" r="2.2" fill="white"/>
          <circle cx="23" cy="34" r="2.2" fill="white"/>
          <path d="M 23 37.5 C 22 49 21 55 21 61"
            stroke="white" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="21" cy="69.5" r="8.5" stroke="white" strokeWidth="4"/>
          <circle cx="21" cy="69.5" r="3"   fill="white"/>

          {/* Reflet */}
          <path d="M 67 22 C 70 33 71 45 70 55"
            stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.32"/>
        </svg>
      </div>

      <div style={{ textAlign: "center", maxWidth: 310 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
          Variante B
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#134E4A",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Naturelle
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Ventre bombé · côtés qui s'évident vers la pointe
          · silhouette organique · dégradé vert clair → forêt
        </div>
      </div>

      {/* Mini wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", background: "white",
                    borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 34, height: 34 }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="bgB2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#6EE7B7"/>
                <stop offset="100%" stopColor="#064E3B"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#bgB2)"/>
            <path d="M 55 8 C 88 28 84 54 79 66 A 24 24 0 1 1 31 66 C 26 54 22 28 55 8 Z"
              stroke="white" strokeWidth="4.8" strokeLinejoin="round"/>
            <path d="M 5 34 C 5 13 23 13 23 34" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="5" cy="35" r="2.2" fill="white"/>
            <circle cx="23" cy="34" r="2.2" fill="white"/>
            <path d="M 23 37.5 C 22 49 21 55 21 61" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="21" cy="69.5" r="8.5" stroke="white" strokeWidth="4"/>
            <circle cx="21" cy="69.5" r="3" fill="white"/>
          </svg>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em" }}>Medi</span>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em",
                           background: "linear-gradient(135deg,#10B981,#064E3B)",
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
