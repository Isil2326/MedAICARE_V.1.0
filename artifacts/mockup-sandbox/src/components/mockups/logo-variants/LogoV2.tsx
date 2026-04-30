/*
 * VARIATION 2 — Dark Signature
 * Même image · fond sombre premium · hiérarchie affirmée
 */
export function LogoV2() {
  const src = "/logo-mark.png";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0B1120 0%, #0F172A 60%, #131E32 100%)",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 36, padding: "36px 28px"
    }}>

      {/* ── Hero : logo + wordmark centré sur fond sombre ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

        {/* Halo subtil derrière le logo */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            position: "absolute",
            width: 160, height: 100,
            background: "radial-gradient(ellipse, rgba(30,136,229,0.18) 0%, transparent 70%)",
            borderRadius: "50%", transform: "translateY(20px)"
          }}/>
          <img src={src} alt="MediAI Care" style={{ width: 160, height: "auto", position: "relative" }} />
        </div>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 7 }}>
            <span style={{ color: "#F1F5F9" }}>Medi</span>
            <span style={{
              background: "linear-gradient(135deg, #60A5FA, #1D4ED8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>AI</span>
            <span style={{ color: "#F1F5F9" }}> Care</span>
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "#475569",
            letterSpacing: "0.20em", textTransform: "uppercase"
          }}>
            Reprenez le contrôle
          </div>
        </div>
      </div>

      {/* ── Séparateur ── */}
      <div style={{ width: 280, height: 1, background: "rgba(255,255,255,0.06)" }}/>

      {/* ── Wordmark horizontal sur fond sombre ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 24px", borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}>
        <img src={src} alt="MediAI Care" style={{ width: 48, height: "auto" }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            <span style={{ color: "#E2E8F0" }}>Medi</span>
            <span style={{
              background: "linear-gradient(135deg, #60A5FA, #1D4ED8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>AI</span>
            <span style={{ color: "#E2E8F0" }}> Care</span>
          </div>
          <div style={{
            fontSize: 8.5, fontWeight: 600, color: "#475569",
            letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 3
          }}>
            Reprenez le contrôle
          </div>
        </div>
      </div>

      {/* ── Swatches sur fond sombre ── */}
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { bg: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", label: "Sombre" },
          { bg: "#FFFFFF",               border: "none",                              label: "Blanc" },
          { bg: "#0D2137",               border: "1px solid rgba(30,136,229,0.20)",   label: "Navy" },
        ].map(({ bg, border, label }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 16,
              background: bg, border,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <img src={src} alt="" style={{ width: 60, height: "auto" }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, color: "#334155", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
