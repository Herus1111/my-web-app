// Hinweis-Banner für Screens, die im Design schon fertig sind, aber noch mit
// Platzhalterdaten laufen (Gamification noch nicht ans Backend angebunden).
const DemoNote = ({ children }) => {
    return (
        <div className="card" style={{
            padding: "12px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 10,
            background: "#FFF6D6", borderColor: "#E0BE4A"
        }}>
            <span style={{ fontSize: 18 }}>🚧</span>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#8B6E00" }}>
                {children || "Vorschau-Ansicht mit Beispieldaten – dieses Feature ist noch nicht angebunden."}
            </div>
        </div>
    );
};

export default DemoNote;
