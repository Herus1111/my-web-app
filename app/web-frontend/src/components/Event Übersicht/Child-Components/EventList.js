import { useState } from "react";
import { Link } from "react-router-dom";
import backendURL from "../../../backendURL";
import * as Icons from "../../../icons";

// Formatiert einen LocalDateTime-String (z.B. "2025-12-18T18:00") in Datum + Uhrzeit.
function formatDateTime(value) {
    if (!value) return { date: "—", time: "" };
    const d = new Date(value);
    if (isNaN(d.getTime())) return { date: value, time: "" };
    return {
        date: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }),
        time: d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    };
}

const ACCENTS = ["#19B36A", "#FF7AB6", "#9B7BFF", "#FFD23F", "#5B8DEF"];

const EventCard = ({ event, accent, currentUser }) => {
    const [imgOk, setImgOk] = useState(true);
    const { date, time } = formatDateTime(event.eventdate);
    const free = event.maxSlots != null ? event.maxSlots : null;

    // Status des eingeloggten Nutzers: angemeldet (Termin offen) vs. besucht (Termin vorbei).
    const me = currentUser?.id;
    const registered = me != null && Array.isArray(event.participantIDs) && event.participantIDs.includes(me);
    const evDate = event.eventdate ? new Date(event.eventdate) : null;
    const over = evDate != null && !isNaN(evDate.getTime()) && evDate.getTime() < Date.now();
    const status = registered ? (over ? "visited" : "registered") : null;

    return (
        <Link className="card" to={{ pathname: "/eventOverview/" + event.id, state: { from: "/eventOverview" } }}
            style={{ padding: 0, overflow: "hidden", display: "block", transition: "transform .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
            <div style={{ position: "relative", height: 170, background: accent }}>
                {imgOk ? (
                    <img src={backendURL() + "/events/" + event.id + "/bild"} alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={() => setImgOk(false)} />
                ) : (
                    <div className="placeholder" style={{ width: "100%", height: "100%" }}>
                        <span>{event.name}</span>
                    </div>
                )}
                {free != null && (
                    <span className="chip green" style={{ position: "absolute", top: 12, right: 12 }}>
                        {free} Plätze
                    </span>
                )}
                <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                    {event.type === "MiniEvent" && <span className="chip pink">🍳 Mini-Event</span>}
                    {status && (
                        <span className={"chip " + (status === "visited" ? "green" : "blue")}>
                            {status === "visited" ? "✓ Besucht" : "🕒 Angemeldet"}
                        </span>
                    )}
                </div>
            </div>
            <div style={{ padding: 16 }}>
                <div className="h3" style={{ marginBottom: 6 }}>{event.name}</div>
                <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                    {event.organizer}{event.venue ? " · " + event.venue : ""}
                </div>
                <div className="row" style={{ gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <Icons.Calendar size={14} /> {date}
                    {time && <>
                        <span style={{ margin: "0 4px", color: "var(--muted)" }}>·</span>
                        <Icons.Clock size={14} /> {time}
                    </>}
                </div>
            </div>
        </Link>
    );
};

const EventList = ({ events, emptyText, currentUser }) => {
    if (!events || events.length === 0) {
        return (
            <div className="card" style={{ padding: 32, textAlign: "center" }}>
                <div className="muted">{emptyText || "Aktuell sind keine Events in der Datenbank."}</div>
            </div>
        );
    }
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
            {events.map((event, i) => (
                <EventCard key={event.id} event={event} accent={ACCENTS[i % ACCENTS.length]} currentUser={currentUser} />
            ))}
        </div>
    );
};

export default EventList;
