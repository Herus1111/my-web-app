import { Link, useLocation } from "react-router-dom";

const NichtGefunden = () => {
    const location = useLocation();
    return (
        <div className="screen-enter" style={{ display: "grid", placeItems: "center", minHeight: 520 }}>
            <div className="card dot-bg" style={{ padding: "48px 40px", textAlign: "center", maxWidth: 480 }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>🧭</div>
                <div className="h2" style={{ marginBottom: 12 }}>Seite nicht gefunden</div>
                <div className="muted" style={{ fontSize: 15, marginBottom: 24 }}>
                    <strong>{location.pathname}</strong> gibt es hier nicht.
                </div>
                <Link className="btn primary" to="/">Zurück zur Startseite</Link>
            </div>
        </div>
    );
};

export default NichtGefunden;
