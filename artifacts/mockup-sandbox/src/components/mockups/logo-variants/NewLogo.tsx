/*
 * NOUVEAU LOGO — MediAI Care
 * Forme identique à la référence (goutte + 3 anneaux stroke concentriques)
 * Couleurs : bleu → rouge sang
 */
export function NewLogo() {

  const LogoMark = ({ size = 220 }: { size?: number }) => {
    const h = size * (170 / 200);
    return (
      <svg
        viewBox="0 0 200 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: h }}
      >
        <defs>
          <linearGradient id="dropGrad" x1="76" y1="12" x2="124" y2="148"
            gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#6B1010"/>
            <stop offset="40%"  stopColor="#B91C1C"/>
            <stop offset="100%" stopColor="#EF4444"/>
          </linearGradient>
        </defs>

        {/* ── ANNEAUX stroke — identiques à la référence, rouge au lieu de bleu ── */}
        <ellipse cx="100" cy="148" rx="88" ry="21"
          stroke="#DC2626" strokeWidth="7" fill="none"/>
        <ellipse cx="100" cy="148" rx="66" ry="15"
          stroke="#DC2626" strokeWidth="7" fill="none"/>
        <ellipse cx="100" cy="148" rx="42" ry="9"
          stroke="#DC2626" strokeWidth="6" fill="none"/>

        {/* ── GOUTTE — même forme que la référence ── */}
        <path
          d="M 100 12
             C 60 52 54 100 54 132
             A 46 46 0 1 0 146 132
             C 146 100 140 52 100 12 Z"
          fill="url(#dropGrad)"
        />

        {/* ── REFLET CROISSANT (bas-droite intérieur) ── */}
        <path
          d="M 116 64
             C 140 88 140 122 126 140
             C 114 150 96 144 91 130
             C 106 138 130 116 128 86
             C 126 74 118 62 116 64 Z"
          fill="white"
          opacity="0.80"
        />
      </svg>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 0, padding: "40px 32px" }}>

      {/* ── Présentation principale ── */}
      <div style={{ display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 8, marginBottom: 48 }}>

        <LogoMark size={240} />

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em",
                        lineHeight: 1, marginBottom: 6 }}>
            <span style={{ color: "#111827" }}>Medi</span>
            <span style={{
              background: "linear-gradient(135deg, #DC2626, #991B1B)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>AI</span>
            <span style={{ color: "#111827" }}> Care</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#6B7280",
                        letterSpacing: "0.08em", textTransform: "uppercase",
                        fontStyle: "italic" }}>
            Reprenez le contrôle
          </div>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 640, height: 1,
                    background: "#F1F5F9", marginBottom: 40 }}/>

      {/* ── Variantes de fond ── */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap",
                    justifyContent: "center", marginBottom: 40 }}>

        {[
          { bg: "#FFFFFF",                         label: "Fond blanc",    shadow: "0 2px 16px rgba(0,0,0,0.10)" },
          { bg: "linear-gradient(135deg,#1E293B,#0F172A)", label: "Fond sombre", shadow: "0 2px 16px rgba(0,0,0,0.28)" },
          { bg: "#FEF2F2",                         label: "Fond rouge pâle", shadow: "0 2px 16px rgba(220,38,38,0.12)" },
        ].map(({ bg, label, shadow }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column",
                                    alignItems: "center", gap: 8 }}>
            <div style={{ width: 100, height: 100, borderRadius: 20,
                          background: bg, boxShadow: shadow,
                          display: "flex", alignItems: "center",
                          justifyContent: "center", overflow: "hidden" }}>
              <LogoMark size={88} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8",
                           letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {label}
            </span>
          </div>
        ))}

        {/* Wordmark horizontal */}
        <div style={{ display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 8 }}>
          <div style={{ height: 100, borderRadius: 20, background: "#FFFFFF",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", padding: "0 20px", gap: 12 }}>
            <div style={{ width: 50, display: "flex", alignItems: "center",
                          justifyContent: "center" }}>
              <LogoMark size={50} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900,
                            letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                <span style={{ color: "#111827" }}>Medi</span>
                <span style={{
                  background: "linear-gradient(135deg, #DC2626, #991B1B)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                }}>AI</span>
                <span style={{ color: "#111827" }}> Care</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 500, color: "#9CA3AF",
                            letterSpacing: "0.10em", textTransform: "uppercase",
                            fontStyle: "italic", marginTop: 3 }}>
                Reprenez le contrôle
              </div>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8",
                         letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Wordmark horizontal
          </span>
        </div>
      </div>
    </div>
  );
}
