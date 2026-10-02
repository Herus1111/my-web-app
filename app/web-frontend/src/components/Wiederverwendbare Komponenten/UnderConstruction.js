import { Link } from "react-router-dom";

// Generische Platzhalterseite für Routen, die es inhaltlich noch nicht gibt.
// Für Gamification-Elemente, die im Design schon vorhanden sind, wird stattdessen
// WipWrap/WipBadge genutzt.
const UnderConstruction = ({ title = "In Arbeit", note, icon = "🚧", backTo = "/eventOverview", backLabel = "Zu den Events" }) => {
    return (
        <div className="screen-enter" style={{ display: "grid", placeItems: "center", minHeight: 520 }}>
            <div className="card dot-bg" style={{ padding: "48px 40px", textAlign: "center", maxWidth: 520 }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>{icon}</div>
                <div className="h2" style={{ marginBottom: 12 }}>{title}</div>
                {note && <div className="muted" style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>{note}</div>}
                <Link className="btn primary" to={backTo}>{backLabel}</Link>
            </div>
        </div>
    );
};

export default UnderConstruction;
