/*
 * VARIATION 1 — Compact Premium
 * Même image · présentation horizontale serrée · typographie resserrée
 */
export function LogoV1() {
  const src = "/logo-mark.png";

  return (
    <div style={{
      minHeight: "100vh", background: "#FAFBFC",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 40, padding: "36px 28px"
    }}>

      {/* ── Hero : logo horizontal centré ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "28px 36px", borderRadius: 20,
        background: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)"
      }}>
        <img src={src} alt="MediAI Care" style={{ width: 72, height: "auto" }} />
        <div>
          <div style={{
            fontSize: 36, fontWeight: 900, letterSpacing: "-0.05em",
            lineHeight: 1, marginBottom: 5
          }}>
            <span style={{ color: "#111827" }}>Medi</span>
            <span style={{ color: "#1565C0" }}>AI</span>
            <span style={{ color: "#111827", fontWeight: 700 }}> Care</span>
          </div>
          <div style={{
            fontSize: 10.5, fontWeight: 600, color: "#94A3B8",
            letterSpacing: "0.18em", textTransform: "uppercase"
          }}>
            Reprenez le contrôle
          </div>
        </div>
      </div>

      {/* ── Grand logo centré ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <img src={src} alt="MediAI Care" style={{ width: 160, height: "auto" }} />
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 5 }}>
            <span style={{ color: "#111827" }}>Medi</span>
            <span style={{ color: "#1565C0" }}>AI</span>
            <span style={{ color: "#111827" }}> Care</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Reprenez le contrôle
          </div>
        </div>
      </div>

      {/* ── Séparateur ── */}
      <div style={{ width: "100%", maxWidth: 400, height: 1, background: "#E9ECF0" }}/>

      {/* ── Swatches ── */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        {[
          { bg: "#FFFFFF", border: "1px solid #E9ECF0", label: "Blanc" },
          { bg: "#0F172A", border: "none",              label: "Sombre" },
          { bg: "#EFF6FF", border: "none",              label: "Bleu pâle" },
        ].map(({ bg, border, label }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 16,
              background: bg, border,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <img src={src} alt="" style={{ width: 60, height: "auto" }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, color: "#CBD5E1", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
