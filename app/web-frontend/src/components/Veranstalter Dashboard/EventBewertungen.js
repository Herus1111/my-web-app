import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import backendURL from "../../backendURL";
import useFetch from "../../useFetch";
import ScreenHeader from "../Wiederverwendbare Komponenten/ScreenHeader";

// Durchschnitt einer numerischen Kennzahl über alle Feedbacks (ignoriert leere Werte).
function avg(list, key) {
    const vals = list.map((f) => f[key]).filter((v) => typeof v === "number");
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Sterne-Anzeige (nur Darstellung, gerundet auf ganze Sterne).
const Stars = ({ value }) => {
    const full = Math.round(value || 0);
    return (
        <span style={{ letterSpacing: 1, fontSize: 18 }}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ color: n <= full ? "var(--pop-yellow)" : "var(--line)" }}>★</span>
            ))}
        </span>
    );
};

// Kompakte Kennzahl-Kachel für die Zusammenfassung oben.
const SummaryTile = ({ label, value, suffix }) => (
    <div className="card" style={{ padding: 20 }}>
        <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
        <div className="h1" style={{ fontSize: 34, marginTop: 8 }}>
            {value}{value !== "–" && suffix ? <span className="muted" style={{ fontSize: 16 }}> {suffix}</span> : null}
        </div>
    </div>
);

// Bewertungsübersicht eines Events – nur für Veranstalter. Zeigt Durchschnittswerte
// und alle einzelnen Rückmeldungen der Teilnehmer.
const EventBewertungen = () => {
    const { id } = useParams();
    const eventId = Number(id);
    const { data: event } = useFetch(backendURL() + "/events/" + id);

    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        const load = () => {
            fetch(backendURL() + "/feedback")
                .then((r) => r.json())
                .then((all) => { if (alive && Array.isArray(all)) setFeedbacks(all.filter((f) => f.eventId === eventId)); })
                .catch(() => {})
                .finally(() => { if (alive) setLoading(false); });
        };
        load();
        // Neue Bewertungen ohne Reload sichtbar machen.
        const iv = setInterval(load, 3000);
        return () => { alive = false; clearInterval(iv); };
    }, [eventId]);

    const count = feedbacks.length;
    const avgEvent = avg(feedbacks, "eventrating");
    const avgSocial = avg(feedbacks, "socializingRating");
    const avgRec = avg(feedbacks, "recommendation");
    const fmt = (v) => (v != null ? v.toFixed(1) : "–");

    return (
        <div className="screen-enter">
            <Link className="btn ghost" to="/organizerDashboard" style={{ marginBottom: 16 }}>← Zurück zum Dashboard</Link>
            <ScreenHeader
                title={"Bewertungen" + (event ? " · " + event.name : "")}
                subtitle="So haben die Teilnehmer dieses Event bewertet."
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
                <SummaryTile label="Event-Bewertung" value={fmt(avgEvent)} suffix="/ 5 ⭐" />
                <SummaryTile label="Networking" value={fmt(avgSocial)} suffix="/ 5 ⭐" />
                <SummaryTile label="Weiterempfehlung" value={fmt(avgRec)} suffix="/ 10" />
                <SummaryTile label="Rückmeldungen" value={String(count)} />
            </div>

            {loading ? (
                <div className="muted">Lädt Bewertungen…</div>
            ) : count === 0 ? (
                <div className="card" style={{ padding: 32, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🕸️</div>
                    <div className="muted">Für dieses Event gibt es noch keine Bewertungen.</div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                    {feedbacks.map((f) => (
                        <div key={f.id} className="card" style={{ padding: 20 }}>
                            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                                <div style={{ fontWeight: 700 }}>{f.username || "Anonym"}</div>
                                <span className="chip" style={{ fontSize: 12 }}>Empfehlung {f.recommendation != null ? f.recommendation : "–"}/10</span>
                            </div>

                            <div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                <span className="muted">Event</span>
                                <Stars value={f.eventrating} />
                            </div>
                            <div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 12 }}>
                                <span className="muted">Networking</span>
                                <Stars value={f.socializingRating} />
                            </div>

                            {f.userLiked ? (
                                <div style={{ fontSize: 13, marginBottom: 8 }}>
                                    <span style={{ color: "var(--pop-green, #19B36A)", fontWeight: 700 }}>+ Gefallen:</span> {f.userLiked}
                                </div>
                            ) : null}
                            {f.userDisliked ? (
                                <div style={{ fontSize: 13 }}>
                                    <span style={{ color: "var(--pop-pink)", fontWeight: 700 }}>– Kritik:</span> {f.userDisliked}
                                </div>
                            ) : null}
                            {!f.userLiked && !f.userDisliked && (
                                <div className="muted" style={{ fontSize: 12 }}>Kein Freitext-Kommentar.</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventBewertungen;
