// Kleiner Info-Kasten mit Icon, Label und Wert.
// Portiert aus design-reference/src/screens-1.jsx.
const InfoBlock = ({ icon, label, value }) => {
    return (
        <div style={{ padding: 14, background: "var(--bg)", borderRadius: 14 }}>
            <div className="row" style={{ gap: 6, color: "var(--muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{value}</div>
        </div>
    );
};

export default InfoBlock;
