export function B_MedicalPro() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#F0F9FF", fontFamily: "'Inter', sans-serif" }}>

      {/* Logo at large scale */}
      <div style={{ width: 280, height: 280 }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            {/* Teal-to-emerald diagonal — médical, profond */}
            <linearGradient id="bgB" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#2DD4BF"/>
              <stop offset="45%"  stopColor="#0D9488"/>
              <stop offset="100%" stopColor="#065F46"/>
            </linearGradient>
            <radialGradient id="shineB" cx="72%" cy="20%" r="50%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Background */}
          <rect width="100" height="100" rx="22" fill="url(#bgB)"/>
          <rect width="100" height="100" rx="22" fill="url(#shineB)"/>

          {/* Drop — même forme, légèrement décalée à droite pour plus d'espace au stéthoscope */}
          <path
            d="M 57 7
               C 73 28 85 46 85 65
               A 28 28 0 1 1 29 65
               C 29 46 41 28 57 7 Z"
            stroke="white" strokeWidth="5.5" strokeLinejoin="round"
          />

          {/* Stéthoscope — version "Medical Pro" : arceau plus anguleux
              Les deux embouts sont bien distincts et nettement positionnés */}
          {/* Binaural spring */}
          <path d="M 5 38 C 5 14 25 14 25 38"
            stroke="white" strokeWidth="4.8" strokeLinecap="round"/>
          <circle cx="5"  cy="39" r="3" fill="white"/>
          <circle cx="25" cy="38" r="3" fill="white"/>

          {/* Tube vertical, coude marqué vers la pièce thoracique */}
          <path d="M 25 41.5 C 25 54 23 60 22 65"
            stroke="white" strokeWidth="4.8" strokeLinecap="round"/>

          {/* Chest piece — plus grande, bien ancrée sur le bord gauche du drop */}
          <circle cx="22" cy="74" r="10"  stroke="white" strokeWidth="4.8"/>
          <circle cx="22" cy="74" r="3.8" fill="white"/>

          {/* Reflet interne — côté droit du drop */}
          <path d="M 68 23 C 70 33 71 44 70 53"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>
        </svg>
      </div>

      {/* Label */}
      <div style={{ textAlign: "center", maxWidth: 300 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#0D9488", textTransform: "uppercase", marginBottom: 10 }}>
          Variante B
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#134E4A",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Medical Pro
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Dégradé teal → forest green · pièce thoracique affirmée
          · drop plus ample · lumière en haut à droite
        </div>
      </div>

      {/* Wordmark preview */}
      <div style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", background: "white",
                    borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 36, height: 36 }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="bgB2" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#2DD4BF"/>
                <stop offset="100%" stopColor="#065F46"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#bgB2)"/>
            <path d="M 57 7 C 73 28 85 46 85 65 A 28 28 0 1 1 29 65 C 29 46 41 28 57 7 Z"
              stroke="white" strokeWidth="5.5" strokeLinejoin="round"/>
            <path d="M 5 38 C 5 14 25 14 25 38" stroke="white" strokeWidth="4.8" strokeLinecap="round"/>
            <circle cx="5" cy="39" r="3" fill="white"/>
            <circle cx="25" cy="38" r="3" fill="white"/>
            <path d="M 25 41.5 C 25 54 23 60 22 65" stroke="white" strokeWidth="4.8" strokeLinecap="round"/>
            <circle cx="22" cy="74" r="10" stroke="white" strokeWidth="4.8"/>
            <circle cx="22" cy="74" r="3.8" fill="white"/>
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em" }}>Medi</span>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em",
                           background: "linear-gradient(135deg,#2DD4BF,#065F46)",
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
