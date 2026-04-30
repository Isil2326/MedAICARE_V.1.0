/*
 * Variante A — Dégradé émeraude classique
 * Forme de goutte : chemin EXACT du Lucide <Droplet> utilisé dans l'application
 * (PatientDashboard & DevicesView), mis à l'échelle 3.25× + stéthoscope discret
 */
export function A_Precision() {
  /* Lucide Droplet path (24×24 viewBox) :
     M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5
     c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z
     Transformé : translate(12, -1) scale(3.25)
       → tip ≈ (51, 9)  |  équateur gauche ≈ (28, 48)  |  bas ≈ (51, 71)
     StrokeWidth local = 1.54 → ~5px visuel */

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
         style={{ background: "#F0FDF4", fontFamily: "'Inter', sans-serif" }}>

      <div style={{ width: 280, height: 280 }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
             style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="bgA" x1="10" y1="5" x2="90" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#34D399"/>
              <stop offset="50%"  stopColor="#10B981"/>
              <stop offset="100%" stopColor="#065F46"/>
            </linearGradient>
            <radialGradient id="shineA" cx="30%" cy="18%" r="52%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.20"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          <rect width="100" height="100" rx="22" fill="url(#bgA)"/>
          <rect width="100" height="100" rx="22" fill="url(#shineA)"/>

          {/* ── GOUTTE Lucide Droplet (path exact de l'application) ── */}
          <g transform="translate(12, -1) scale(3.25)">
            <path
              d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"
              stroke="white" strokeWidth="1.54" strokeLinejoin="round"
            />
          </g>

          {/* ── STÉTHOSCOPE — petit & discret, style version cœur ── */}
          {/* Arceau binaural */}
          <path d="M 6 35 C 6 14 24 14 24 35"
            stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="6"  cy="36" r="2.8" fill="white"/>
          <circle cx="24" cy="35" r="2.8" fill="white"/>
          {/* Tube */}
          <path d="M 24 38.5 C 23 47 22 52 22 57"
            stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
          {/* Pièce thoracique — sur le bord gauche du cercle de la goutte */}
          <circle cx="22" cy="60" r="9"   stroke="white" strokeWidth="4.5"/>
          <circle cx="22" cy="60" r="3.2" fill="white"/>

          {/* Reflet intérieur */}
          <path d="M 62 22 C 64 32 65 43 64 53"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.38"/>
        </svg>
      </div>

      <div style={{ textAlign: "center", maxWidth: 310 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                      color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
          Variante A · Émeraude
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#064E3B",
                      letterSpacing: "-0.02em", marginBottom: 8 }}>
          Dégradé Classique
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Forme de goutte Lucide Droplet (icône de l'app)
          · dégradé émeraude diagonal · stéthoscope discret
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", background: "white",
                    borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 34, height: 34 }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="bgA2" x1="10" y1="5" x2="90" y2="95" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34D399"/>
                <stop offset="100%" stopColor="#065F46"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#bgA2)"/>
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
