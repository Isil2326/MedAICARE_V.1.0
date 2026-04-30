/*
 * NOUVEAU LOGO — MediAI Care
 * Image originale intégrée directement (fond blanc supprimé)
 */
export function NewLogo() {

  const logoSrc = "/logo-mark.png";

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 0, padding: "40px 32px" }}>

      {/* ── Présentation principale ── */}
      <div style={{ display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 8, marginBottom: 48 }}>

        <img src={logoSrc} alt="MediAI Care" style={{ width: 220, height: "auto" }} />

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em",
                        lineHeight: 1, marginBottom: 6 }}>
            <span style={{ color: "#111827" }}>Medi</span>
            <span style={{
              background: "linear-gradient(135deg, #1E88E5, #0D47A1)",
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
          { bg: "#FFFFFF", label: "Fond blanc",     shadow: "0 2px 16px rgba(0,0,0,0.10)" },
          { bg: "linear-gradient(135deg,#1E293B,#0F172A)", label: "Fond sombre", shadow: "0 2px 16px rgba(0,0,0,0.28)" },
          { bg: "#EFF6FF", label: "Fond bleu pâle", shadow: "0 2px 16px rgba(30,136,229,0.12)" },
        ].map(({ bg, label, shadow }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column",
                                    alignItems: "center", gap: 8 }}>
            <div style={{ width: 100, height: 100, borderRadius: 20,
                          background: bg, boxShadow: shadow,
                          display: "flex", alignItems: "center",
                          justifyContent: "center", overflow: "hidden" }}>
              <img src={logoSrc} alt="MediAI Care" style={{ width: 80, height: "auto" }} />
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
            <img src={logoSrc} alt="MediAI Care" style={{ width: 50, height: "auto" }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 900,
                            letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                <span style={{ color: "#111827" }}>Medi</span>
                <span style={{
                  background: "linear-gradient(135deg, #1E88E5, #0D47A1)",
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
