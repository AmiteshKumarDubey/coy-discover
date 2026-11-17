export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 72px)",
        gap: "12px",
        padding: "24px",
      }}
    >
      <span style={{ fontSize: "48px" }}>🏠</span>
      <p style={{ color: "#606070", fontSize: "16px", fontWeight: 600, letterSpacing: "0.02em" }}>
        Home
      </p>
      <p style={{ color: "#404050", fontSize: "13px", textAlign: "center", maxWidth: "240px" }}>
        This is a placeholder. Head to Discover to start swiping!
      </p>
    </div>
  );
}
