export function A_Precision() {
  /*
   * Goutte A — "Élancée"
   * Silhouette classique mais plus haute et plus étirée.
   * Tip pointu, épaules s'arrondissent progressivement vers un cercle ample en bas.
   * Stéthoscope petit & discret, calqué sur la version cœur.
   */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#F0FDF4", fontFamily: "'Inter', sans-serif" }}>

      <div style={{ width: 280, height: 280 }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="bgA" x1="15" y1="5" x2="85" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#34D399"/>
              <stop offset="48%"  stopColor="#10B981"/>
              <stop offset="100%" stopColor="#065F46"/>
            </linearGradient>
            <radialGradient id="shineA" cx="30%" cy="18%" r="52%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.20"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          <rect width="100" height="100" rx="22" fill="url(#bgA)"/>
          <rect width="100" height="100" rx="22" fill="url(#shineA)"/>

          {/*
           * GOUTTE "ÉLANCÉE" — tip à (55,6), cercle centre (55,68) r=23
           * Contrôle latéral large pour épaules bien marquées
           * Left:  M→(55,6) ← ctrl (30,20)(31,52) ← (32,68)
           * Arc:   (32,68) → bas → (78,68) large arc sweep=1
           * Right: (78,68) ← ctrl (79,52)(80,20) ← (55,6)
           */}
          <path
            d="M 55 6
               C 30 22 32 50 32 68
               A 23 23 0 1 0 78 68
               C 78 50 80 22 55 6 Z"
            stroke="white" strokeWidth="4.8" strokeLinejoin="round"
          />

          {/* STÉTHOSCOPE — petit & discret, identique version cœur
              binaural en haut à gauche, chest piece sur le bord gauche du cercle */}
          <path d="M 6 35 C 6 14 24 14 24 35"
            stroke="white" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="6"  cy="36" r="2.2" fill="white"/>
          <circle cx="24" cy="35" r="2.2" fill="white"/>
          <path d="M 24 38.5 C 23 50 22 56 22 62"
            stroke="white" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="22" cy="70" r="8.5" stroke="white" strokeWidth="4"/>
          <circle cx="22" cy="70" r="3"   fill="white"/>

          {/* Reflet intérieur */}
          <path d="M 65 20 C 67 30 68 42 67 52"
            stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
        </svg>
      </div>

      <div style={{ textAlign: "center", maxWidth: 310 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
          Variante A
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#064E3B",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Élancée
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Tip pointu · épaules larges · cercle ample en bas
          · dégradé émeraude diagonal · stéthoscope discret
        </div>
      </div>

      {/* Mini wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", background: "white",
                    borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 34, height: 34 }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="bgA2" x1="15" y1="5" x2="85" y2="95" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34D399"/>
                <stop offset="100%" stopColor="#065F46"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#bgA2)"/>
            <path d="M 55 6 C 30 22 32 50 32 68 A 23 23 0 1 0 78 68 C 78 50 80 22 55 6 Z"
              stroke="white" strokeWidth="4.8" strokeLinejoin="round"/>
            <path d="M 6 35 C 6 14 24 14 24 35" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="6" cy="36" r="2.2" fill="white"/>
            <circle cx="24" cy="35" r="2.2" fill="white"/>
            <path d="M 24 38.5 C 23 50 22 56 22 62" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="22" cy="70" r="8.5" stroke="white" strokeWidth="4"/>
            <circle cx="22" cy="70" r="3" fill="white"/>
          </svg>
        </div>
        <div>
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
