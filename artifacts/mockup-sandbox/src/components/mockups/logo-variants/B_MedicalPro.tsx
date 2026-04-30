/*
 * Variante B — Dégradé radial depuis le centre (lumière intérieure)
 * Même forme Lucide Droplet · rendu premium "glow"
 */
export function B_MedicalPro() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#F0F9FF", fontFamily: "'Inter', sans-serif" }}>

      <div style={{ width: 280, height: 280 }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            {/* Radial glow — lumière vive au centre, forêt en périphérie */}
            <radialGradient id="bgB" cx="52%" cy="45%" r="60%" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#6EE7B7"/>
              <stop offset="45%"  stopColor="#10B981"/>
              <stop offset="100%" stopColor="#064E3B"/>
            </radialGradient>
            <radialGradient id="shineB" cx="35%" cy="20%" r="50%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          <rect width="100" height="100" rx="22" fill="url(#bgB)"/>
          <rect width="100" height="100" rx="22" fill="url(#shineB)"/>

          {/* ── GOUTTE Lucide Droplet ── */}
          <g transform="translate(12, -1) scale(3.25)">
            <path
              d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"
              stroke="white" strokeWidth="1.54" strokeLinejoin="round"
            />
          </g>

          {/* ── STÉTHOSCOPE — identique version cœur ── */}
          <path d="M 6 35 C 6 14 24 14 24 35"
            stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="6"  cy="36" r="2.8" fill="white"/>
          <circle cx="24" cy="35" r="2.8" fill="white"/>
          <path d="M 24 38.5 C 23 47 22 52 22 57"
            stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="22" cy="60" r="9"   stroke="white" strokeWidth="4.5"/>
          <circle cx="22" cy="60" r="3.2" fill="white"/>

          {/* Reflet */}
          <path d="M 62 22 C 64 32 65 43 64 53"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.38"/>
        </svg>
      </div>

      <div style={{ textAlign: "center", maxWidth: 310 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
          Variante B · Glow
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#134E4A",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Radial Premium
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Forme de goutte Lucide Droplet (icône de l'app)
          · dégradé radial depuis le centre · lumière intérieure
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", background: "white",
                    borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 34, height: 34 }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <radialGradient id="bgB2" cx="52%" cy="45%" r="60%" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#6EE7B7"/>
                <stop offset="100%" stopColor="#064E3B"/>
              </radialGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#bgB2)"/>
            <g transform="translate(12, -1) scale(3.25)">
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"
                stroke="white" strokeWidth="1.54" strokeLinejoin="round"/>
            </g>
            <path d="M 6 35 C 6 14 24 14 24 35" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="6" cy="36" r="2.8" fill="white"/>
            <circle cx="24" cy="35" r="2.8" fill="white"/>
            <path d="M 24 38.5 C 23 47 22 52 22 57" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="22" cy="60" r="9" stroke="white" strokeWidth="4.5"/>
            <circle cx="22" cy="60" r="3.2" fill="white"/>
          </svg>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em" }}>Medi</span>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em",
                           background: "radial-gradient(circle,#10B981,#064E3B)",
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
