import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import backendURL from "../../backendURL";
import ScreenHeader from "../Wiederverwendbare Komponenten/ScreenHeader";
import * as Icons from "../../icons";

const ACCENTS = ["#19B36A", "#FF7AB6", "#9B7BFF", "#FFD23F", "#5B8DEF"];

// Gesamtscore eines Feedbacks auf einer 5er-Skala: Mittel aus Event-Bewertung (1-5),
// Networking (1-5) und Weiterempfehlung (1-10, dafür auf /5 normalisiert).
// Es zählen nur tatsächlich vorhandene Werte.
function overallScore(f) {
    const parts = [];
    if (typeof f.eventrating === "number") parts.push(f.eventrating);
    if (typeof f.socializingRating === "number") parts.push(f.socializingRating);
    if (typeof f.recommendation === "number") parts.push(f.recommendation / 2);
    if (!parts.length) return null;
    return parts.reduce((a, b) => a + b, 0) / parts.length;
}

// Formatiert einen LocalDateTime-String in Datum + Uhrzeit.
function formatDateTime(value) {
    if (!value) return { date: "—", time: "" };
    const d = new Date(value);
    if (isNaN(d.getTime())) return { date: value, time: "" };
    return {
        date: d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }),
        time: d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    };
}

// Einzelne Event-Karte mit Bild, Eckdaten und Anmelde-Fortschrittsbalken.
const EventCard = ({ event, accent, rating }) => {
    const [imgOk, setImgOk] = useState(true);
    const { date, time } = formatDateTime(event.eventdate);
    const taken = Array.isArray(event.participantIDs) ? event.participantIDs.length : 0;
    const total = event.maxSlots != null ? event.maxSlots : 0;
    const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;

    // Bewertungen gibt es erst, wenn das Event vorbei ist – vorher keine Bewertungs-Anzeige/-Button.
    const eventDate = event.eventdate ? new Date(event.eventdate) : null;
    const eventOver = eventDate != null && !isNaN(eventDate.getTime()) && eventDate.getTime() < Date.now();

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ height: 180, background: accent }}>
                {imgOk ? (
                    <img src={backendURL() + "/events/" + event.id + "/bild"} alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={() => setImgOk(false)} />
                ) : (
                    <div className="placeholder" style={{ width: "100%", height: "100%" }}>
                        <span>{event.name}</span>
                    </div>
                )}
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
                <div className="h3" style={{ marginBottom: 10 }}>{event.name}</div>
                <div className="row" style={{ justifyContent: "space-between", gap: 12, fontSize: 13, marginBottom: 16 }}>
                    <div className="row" style={{ gap: 6, fontWeight: 600 }}>
                        <Icons.Calendar size={14} /> {date}
                        {time && <>
                            <span style={{ margin: "0 2px", color: "var(--muted)" }}>·</span>
                            <Icons.Clock size={14} /> {time}
                        </>}
                    </div>
                    {event.venue && (
                        <div className="row muted" style={{ gap: 4 }}>
                            <Icons.Pin size={14} /> {event.venue}
                        </div>
                    )}
                </div>

                {/* Anmelde-Fortschritt: wie viele der maxSlots-Plätze belegt sind. */}
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span className="muted" style={{ fontWeight: 600 }}>Anmeldungen</span>
                    <span style={{ fontWeight: 700 }}>{taken}/{total}</span>
                </div>
                <div className="progress" style={{ height: 10 }}>
                    <span style={{ width: pct + "%" }} />
                </div>

                {/* Durchschnittliche Event-Bewertung – erst nach dem Event. */}
                {eventOver && (
                    <div className="row" style={{ justifyContent: "space-between", marginTop: 12, fontSize: 13 }}>
                        <span className="muted" style={{ fontWeight: 600 }}>Bewertung</span>
                        <span style={{ fontWeight: 700 }}>
                            {rating && rating.count > 0
                                ? <>★ {rating.avg.toFixed(1)} <span className="muted" style={{ fontWeight: 500 }}>({rating.count})</span></>
                                : <span className="muted" style={{ fontWeight: 500 }}>noch keine</span>}
                        </span>
                    </div>
                )}

                <div className="row" style={{ gap: 8, marginTop: "auto", paddingTop: 16 }}>
                    <Link className="btn ghost" to={"/eventOverview/" + event.id} style={{ flex: 1, justifyContent: "center", padding: 8, fontSize: 13 }}>Details</Link>
                    {eventOver && (
                        <Link className="btn ghost" to={"/eventRatings/" + event.id} style={{ flex: 1, justifyContent: "center", padding: 8, fontSize: 13 }}>Bewertungen</Link>
                    )}
                </div>
            </div>
        </div>
    );
};

const VeranstalterDashboard = ({ currentUser }) => {
    const [events, setEvents] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Als Ersteller-Kennung dient der Anzeigename – so speichert CreateEvent den organizer.
    const organizerName = currentUser?.username || currentUser?.firstName || "";

    useEffect(() => {
        let alive = true;
        const load = () => {
            fetch(backendURL() + "/events")
                .then((r) => r.json())
                .then((all) => { if (alive) setEvents(all.filter((e) => e.organizer === organizerName)); })
                .catch(() => { if (alive) setError("Events konnten nicht geladen werden."); })
                .finally(() => { if (alive) setLoading(false); });
            // Bewertungen mitladen, um Durchschnitt je Event und gesamt zu zeigen.
            fetch(backendURL() + "/feedback")
                .then((r) => r.json())
                .then((all) => { if (alive && Array.isArray(all)) setFeedbacks(all); })
                .catch(() => {});
        };
        load();
        // Live-Update: Anmeldezahlen & Bewertungen alle 3s aktualisieren.
        const iv = setInterval(load, 3000);
        return () => { alive = false; clearInterval(iv); };
    }, [organizerName]);

    const totalRegistrations = events.reduce(
        (sum, e) => sum + (Array.isArray(e.participantIDs) ? e.participantIDs.length : 0), 0
    );
    const budget = currentUser?.budget != null ? currentUser.budget.toLocaleString("de-DE") + " €" : "–";

    // Bewertung je Event (Gesamtscore aus Event, Networking & Empfehlung) und über alle Events gesamt.
    const ratingByEvent = {};
    for (const e of events) {
        const vals = feedbacks
            .filter((f) => f.eventId === e.id)
            .map(overallScore)
            .filter((v) => v != null);
        ratingByEvent[e.id] = vals.length
            ? { avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length }
            : { avg: 0, count: 0 };
    }
    const allRatings = events.flatMap((e) =>
        feedbacks.filter((f) => f.eventId === e.id).map(overallScore).filter((v) => v != null)
    );
    const avgRatingOverall = allRatings.length
        ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
        : "–";

    const stats = [
        { label: "Events", value: events.length, icon: "📅", color: "var(--accent-soft)" },
        { label: "Anmeldungen", value: totalRegistrations, icon: "👥", color: "#FFE6F0" },
        { label: "Budget", value: budget, icon: "💰", color: "#FFF6D6" },
        { label: "Bewertung", value: avgRatingOverall, icon: "⭐", color: "#E6EEFD" },
    ];

    return (
        <div className="screen-enter">
            <ScreenHeader
                title="Veranstalter Dashboard"
                subtitle="Verwalte deine Events und erreiche Studierende."
                action={<Link className="btn primary" to="/createEvent"><Icons.Plus size={14} /> Neues Event</Link>}
            />

            {error && <div style={{ color: "var(--pop-pink)", marginBottom: 16, fontSize: 14 }}>{error}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                {stats.map((s) => (
                    <div key={s.label} className="card" style={{ padding: 22 }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                            <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: s.color, display: "grid", placeItems: "center", fontSize: 16 }}>{s.icon}</div>
                        </div>
                        <div className="h1" style={{ fontSize: 38, marginTop: 12 }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="h2" style={{ marginTop: 32, marginBottom: 16 }}>Meine Events</div>
            {loading ? (
                <div className="muted">Lädt…</div>
            ) : events.length === 0 ? (
                <div className="card" style={{ padding: 32, textAlign: "center" }}>
                    <div className="muted" style={{ marginBottom: 16 }}>Du hast noch keine Events erstellt.</div>
                    <Link className="btn primary" to="/createEvent" style={{ display: "inline-flex" }}><Icons.Plus size={14} /> Erstes Event erstellen</Link>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
                    {events.map((event, i) => (
                        <EventCard key={event.id} event={event} accent={ACCENTS[i % ACCENTS.length]} rating={ratingByEvent[event.id]} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VeranstalterDashboard;
