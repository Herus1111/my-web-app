import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";

import backendURL from "../../../backendURL";
import useFetch from "../../../useFetch";
import InfoBlock from "../../Wiederverwendbare Komponenten/InfoBlock";
import WeatherTile from "../../Wiederverwendbare Komponenten/WeatherTile";
import Avatar from "../../Wiederverwendbare Komponenten/Avatar";
import * as Icons from "../../../icons";

function formatDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
        + " · " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function friendName(user) {
    if (!user) return "Unbekannt";
    return ((user.firstName || "") + " " + (user.lastName || "")).trim() || user.username || "Unbekannt";
}

// Anzeigename, so wie CreateEvent ihn im organizer ablegt.
function organizerName(user) {
    if (!user) return null;
    return user.username || user.firstName || null;
}

const FriendsAlreadyJoining = ({ event, currentUser, participantIDs }) => {
    const me = currentUser?.id;
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        if (!me || !event?.id || !Array.isArray(participantIDs) || participantIDs.length === 0) {
            setFriends([]);
            return;
        }

        let alive = true;
        Promise.all([
            fetch(backendURL() + "/friendships/" + me).then((r) => r.json()).catch(() => []),
            fetch(backendURL() + "/users").then((r) => r.json()).catch(() => []),
        ]).then(([friendships, users]) => {
            if (!alive) return;
            const accepted = (friendships || []).filter((f) => f.status === "ACCEPTED");
            const friendIds = accepted.map((f) => (f.studentId === me ? f.friendId : f.studentId));
            const byId = new Map((users || []).map((u) => [u.id, u]));
            const matchingFriends = friendIds
                .map((id) => byId.get(id))
                .filter(Boolean)
                .filter((u) => participantIDs.includes(u.id));
            setFriends(matchingFriends);
        }).catch(() => {
            if (alive) setFriends([]);
        });

        return () => { alive = false; };
    }, [event?.id, me, participantIDs]);

    if (!event || event.type !== "MiniEvent" || currentUser?.type === "Veranstalter" || friends.length === 0) {
        return null;
    }

    return (
        <div className="card" style={{ padding: 16, marginTop: 12, border: "1px solid var(--line)" }}>
            <div className="h3" style={{ marginBottom: 6 }}>Deine Freunde nehmen schon teil</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                Schau dir an, wer aus deinem Freundeskreis bereits dabei ist, bevor du dich anmeldest.
            </div>
            <div className="stack" style={{ gap: 8 }}>
                {friends.map((friend) => {
                    const name = friendName(friend);
                    return (
                        <div key={friend.id} className="row" style={{ gap: 10 }}>
                            <Avatar name={name} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                                <div className="muted" style={{ fontSize: 12 }}>@{friend.username}</div>
                            </div>
                            <span className="muted" style={{ fontSize: 12 }}><Icons.Check size={12} /> Dabei</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Kachel zum Einladen von Freunden. Erscheint nur, solange das Event noch nicht
// stattgefunden hat und der eingeloggte Student selbst teilnimmt.
// Es können nur bestätigte Freunde eingeladen werden (Backend prüft das ebenfalls).
const InviteFriends = ({ eventId, currentUser, participantIDs, eventOrganizer }) => {
    const me = currentUser.id;
    const [friends, setFriends] = useState([]);   // Nutzerobjekte der bestätigten Freunde
    const [invitedIds, setInvitedIds] = useState([]); // bereits eingeladene inviteeIds für dieses Event
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // Bereits verschickte Einladungen für dieses Event laden (damit wir "Eingeladen" anzeigen können).
    const loadInvitations = useCallback(() => {
        return fetch(backendURL() + "/events/invitations/event/" + eventId)
            .then((r) => r.json())
            .then((invs) => setInvitedIds(Array.isArray(invs) ? invs.map((i) => i.inviteeId) : []))
            .catch(() => {});
    }, [eventId]);

    useEffect(() => {
        // Freundschaften + alle Nutzer laden und daraus die bestätigten Freunde bilden.
        Promise.all([
            fetch(backendURL() + "/friendships/" + me).then((r) => r.json()).catch(() => []),
            fetch(backendURL() + "/users").then((r) => r.json()).catch(() => []),
            loadInvitations(),
        ])
            .then(([friendships, users]) => {
                const accepted = (friendships || []).filter((f) => f.status === "ACCEPTED");
                const friendIds = accepted.map((f) => (f.studentId === me ? f.friendId : f.studentId));
                const byId = new Map((users || []).map((u) => [u.id, u]));
                const friendUsers = friendIds.map((id) => byId.get(id)).filter(Boolean);
                // Der Veranstalter des Events kann nicht eingeladen werden.
                setFriends(friendUsers.filter((u) => organizerName(u) !== eventOrganizer));
            })
            .finally(() => setLoading(false));
    }, [me, loadInvitations, eventOrganizer]);

    function invite(friendId) {
        setError("");
        setBusyId(friendId);
        fetch(backendURL() + "/events/invitations/invite?eventId=" + eventId + "&inviterId=" + me + "&inviteeId=" + friendId, { method: "POST" })
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || "Einladung fehlgeschlagen.");
                setInvitedIds((prev) => (prev.includes(friendId) ? prev : [...prev, friendId]));
            })
            .catch((err) => setError(err.message))
            .finally(() => setBusyId(null));
    }

    return (
        <div className="card" style={{ padding: 20 }}>
            <div className="h3" style={{ marginBottom: 4 }}>Freunde einladen</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
                Lade deine Freunde ein, bevor das Event startet.
            </div>

            {loading ? (
                <div className="muted" style={{ fontSize: 13 }}>Lädt Freunde…</div>
            ) : friends.length === 0 ? (
                <div className="muted" style={{ fontSize: 13 }}>
                    Du hast noch keine Freunde. Füge welche unter <Link to="/friendsOverview">Freunde</Link> hinzu.
                </div>
            ) : (
                <div className="stack" style={{ gap: 8 }}>
                    {friends.map((f) => {
                        const name = friendName(f);
                        const already = participantIDs.includes(f.id);
                        const invited = invitedIds.includes(f.id);
                        return (
                            <div key={f.id} className="row" style={{ gap: 10 }}>
                                <Avatar name={name} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                                    <div className="muted" style={{ fontSize: 12 }}>@{f.username}</div>
                                </div>
                                {already ? (
                                    <span className="muted" style={{ fontSize: 12 }}><Icons.Check size={12} /> Nimmt teil</span>
                                ) : invited ? (
                                    <span className="muted" style={{ fontSize: 12 }}><Icons.Check size={12} /> Eingeladen</span>
                                ) : (
                                    <button className="btn primary" style={{ padding: "8px 12px", fontSize: 13 }}
                                        disabled={busyId === f.id} onClick={() => invite(f.id)}>
                                        {busyId === f.id ? "…" : <><Icons.Send size={13} /> Einladen</>}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {error && <div style={{ color: "var(--pop-pink)", fontSize: 12, marginTop: 10 }}>{error}</div>}
        </div>
    );
};

const EventDetail = ({ currentUser }) => {
    const { id } = useParams();
    const location = useLocation();
    const { data: event, isPending, error } = useFetch(backendURL() + "/events/" + id);
    const [imgOk, setImgOk] = useState(true);

    // Teilnehmer lokal halten, damit der Beitritt sofort sichtbar ist.
    const [participantIDs, setParticipantIDs] = useState([]);
    const [joining, setJoining] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [joinError, setJoinError] = useState("");

    // Sobald das Event geladen ist, die Teilnehmerliste übernehmen.
    useEffect(() => {
        if (event && Array.isArray(event.participantIDs)) setParticipantIDs(event.participantIDs);
    }, [event]);

    // Teilnehmerzahl live halten: alle 3s neu laden, damit auch Beitritte
    // anderer Nutzer sofort im Fortschritt sichtbar werden.
    useEffect(() => {
        let alive = true;
        const load = () => {
            fetch(backendURL() + "/events/" + id + "/participantIds")
                .then((r) => r.json())
                .then((ids) => { if (alive && Array.isArray(ids)) setParticipantIDs(ids); })
                .catch(() => {});
        };
        const iv = setInterval(load, 3000);
        return () => { alive = false; clearInterval(iv); };
    }, [id]);

    // Jedes Event darf nur einmal bewertet werden.
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    useEffect(() => {
        const myName = currentUser?.username;
        if (!myName) return;
        let alive = true;
        fetch(backendURL() + "/feedback")
            .then((r) => r.json())
            .then((all) => {
                if (!alive || !Array.isArray(all)) return;
                setFeedbackGiven(all.some((f) => f.eventId === Number(id) && f.username === myName));
            })
            .catch(() => {});
        return () => { alive = false; };
    }, [id, currentUser]);

    function handleJoin() {
        setJoinError("");
        setJoining(true);
        fetch(backendURL() + "/events/" + id + "/addUser/" + currentUser.id, { method: "POST" })
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || "Beitritt fehlgeschlagen.");
                // Eigene ID lokal ergänzen -> belegte Plätze & Button aktualisieren sich.
                setParticipantIDs((prev) => (prev.includes(currentUser.id) ? prev : [...prev, currentUser.id]));
            })
            .catch((err) => setJoinError(err.message))
            .finally(() => setJoining(false));
    }

    // Event vorzeitig wieder verlassen: eigene ID aus der Teilnehmerliste entfernen.
    function handleLeave() {
        setJoinError("");
        setLeaving(true);
        fetch(backendURL() + "/events/" + id + "/removeUser/" + currentUser.id, { method: "DELETE" })
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || "Verlassen fehlgeschlagen.");
                setParticipantIDs((prev) => prev.filter((pid) => pid !== currentUser.id));
            })
            .catch((err) => setJoinError(err.message))
            .finally(() => setLeaving(false));
    }

    // Nur Studierende nehmen an Events teil – Veranstalter organisieren sie nur.
    const isOrganizer = currentUser?.type === "Veranstalter";
    // "Zurück" führt zur Herkunft (z.B. Event-Graph), sonst zur Übersicht bzw. dem Dashboard.
    const backTo = location.state?.from || (isOrganizer ? "/organizerDashboard" : "/eventOverview");

    if (isPending) return <div className="muted" style={{ padding: 12 }}>Lädt Event…</div>;
    if (error || !event) {
        return (
            <div className="card" style={{ padding: 24 }}>
                <div className="h3" style={{ marginBottom: 8 }}>Event nicht gefunden</div>
                <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>{error}</div>
                <Link className="btn ghost" to={backTo}>← Zurück</Link>
            </div>
        );
    }

    const taken = participantIDs.length;
    const total = event.maxSlots != null ? event.maxSlots : 0;
    const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;
    const joined = currentUser != null && participantIDs.includes(currentUser.id);
    const full = total > 0 && taken >= total;

    // Ersteller eines Mini-Events (organizer = eigener Anzeigename). Darf Freunde
    // einladen, auch ohne selbst teilzunehmen.
    const myOrganizerName = organizerName(currentUser);
    const isCreator = !isOrganizer && event.type === "MiniEvent"
        && myOrganizerName != null && event.organizer === myOrganizerName;

    // Ist das Event schon vorbei? (Nur Startzeitpunkt vorhanden -> Vergangenheit = vorbei.)
    // Ist es vorbei, kann man nicht mehr beitreten/verlassen; wer teilgenommen hat, darf Feedback geben.
    const eventDate = event.eventdate ? new Date(event.eventdate) : null;
    const eventOver = eventDate != null && !isNaN(eventDate.getTime()) && eventDate.getTime() < Date.now();

    return (
        <div className="screen-enter">
            <Link className="btn ghost" to={backTo} style={{ marginBottom: 16 }}>← Zurück</Link>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 22 }}>
                <div className="stack">
                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ height: 320, background: "var(--accent)", position: "relative" }}>
                            {imgOk ? (
                                <img src={backendURL() + "/events/" + event.id + "/bild"} alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={() => setImgOk(false)} />
                            ) : (
                                <div className="placeholder" style={{ width: "100%", height: "100%" }}>
                                    <span>Kein Bild</span>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: 28 }}>
                            <div className="h1">{event.name}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 22 }}>
                                <InfoBlock icon={<Icons.Users size={16} />} label="Veranstalter" value={event.organizer || "—"} />
                                <InfoBlock icon={<Icons.Pin size={16} />} label="Ort" value={event.venue || "—"} />
                                <InfoBlock icon={<Icons.Calendar size={16} />} label="Wann" value={formatDateTime(event.eventdate)} />
                            </div>

                            {/* Typspezifische Angaben: MiniEvent bzw. VeranstalterEvent (kommen erst seit
                                der Event-Typ-Unterscheidung im Backend mit). Genre gilt für beide. */}
                            {(event.genre || event.type === "VeranstalterEvent" || event.type === "MiniEvent") && (
                                <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 18 }}>
                                    {event.genre && <span className="chip">{event.genre}</span>}
                                    {event.type === "VeranstalterEvent" && (
                                        <span className="chip">🎟️ {event.ticketPreis != null && event.ticketPreis > 0 ? Number(event.ticketPreis).toFixed(2) + " €" : "Kostenlos"}</span>
                                    )}
                                    {event.type === "VeranstalterEvent" && event.mindestalter != null && event.mindestalter > 0 && (
                                        <span className="chip">ab {event.mindestalter} Jahren</span>
                                    )}
                                    {event.type === "MiniEvent" && <span className="chip pink">🍳 Mini-Event</span>}
                                </div>
                            )}

                            {event.type === "MiniEvent" && (event.treffpunktHinweis || event.mitbringliste) && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 16 }}>
                                    {event.treffpunktHinweis && (
                                        <InfoBlock icon={<Icons.Pin size={16} />} label="Treffpunkt-Hinweis" value={event.treffpunktHinweis} />
                                    )}
                                    {event.mitbringliste && (
                                        <InfoBlock icon={<Icons.Check size={16} />} label="Mitbringen" value={event.mitbringliste} />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="stack">
                    <div className="card popped" style={{ padding: 24 }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                            <div className="h3">Freie Plätze</div>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800 }}>
                                {taken}<span style={{ color: "var(--muted)" }}>/{total}</span>
                            </div>
                        </div>
                        <div className="progress" style={{ marginTop: 12, height: 12 }}>
                            <span style={{ width: pct + "%" }} />
                        </div>

                        {/* Teilnahme nur für Studierende – Veranstalter sehen keinen Button.
                            Ist das Event vorbei, kann man nicht mehr beitreten/verlassen. */}
                        {!isOrganizer && !eventOver && (
                            <div style={{ marginTop: 18 }}>
                                {joined ? (
                                    <button className="btn danger" onClick={handleLeave} disabled={leaving}
                                        style={{ width: "100%", justifyContent: "center", padding: "14px 18px", fontSize: 15 }}>
                                        {leaving ? "Wird verlassen…" : <><Icons.X size={16} /> Event verlassen</>}
                                    </button>
                                ) : (
                                    <button className="btn primary" onClick={handleJoin} disabled={joining || full}
                                        style={{ width: "100%", justifyContent: "center", padding: "14px 18px", fontSize: 15 }}>
                                        {full ? "Ausgebucht" : (joining ? "Wird angemeldet…" : <>Teilnehmen <Icons.ArrowRight size={14} /></>)}
                                    </button>
                                )}
                            </div>
                        )}
                        {joinError && (
                            <div style={{ color: "var(--pop-pink)", fontSize: 12, marginTop: 10, textAlign: "center" }}>{joinError}</div>
                        )}
                        {!isOrganizer && !eventOver && (
                            <FriendsAlreadyJoining event={event} currentUser={currentUser} participantIDs={participantIDs} />
                        )}
                        {joined && !eventOver && (
                            <div className="muted" style={{ fontSize: 12, marginTop: 10, textAlign: "center" }}>
                                <Icons.Check size={12} /> Du bist angemeldet. Du kannst jederzeit wieder absagen.
                            </div>
                        )}
                        {eventOver && (
                            <div className="muted" style={{ fontSize: 12, marginTop: 18, textAlign: "center" }}>
                                <Icons.Clock size={12} /> Dieses Event ist bereits vorbei.
                            </div>
                        )}
                    </div>

                    {/* Veranstalter: Zugang zu den Bewertungen dieses Events. */}
                    {isOrganizer && (
                        <div className="card" style={{ padding: 20 }}>
                            <div className="h3" style={{ marginBottom: 4 }}>Bewertungen</div>
                            <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
                                Sieh, wie die Teilnehmer dieses Event bewertet haben.
                            </div>
                            <Link className="btn primary" to={"/eventRatings/" + event.id}
                                style={{ width: "100%", justifyContent: "center", padding: "14px 18px", fontSize: 15 }}>
                                <Icons.Star size={16} /> Zu den Bewertungen
                            </Link>
                        </div>
                    )}

                    {/* Vor dem Event Freunde einladen: als angemeldeter Teilnehmer oder als Ersteller des Mini-Events. */}
                    {!isOrganizer && !eventOver && (joined || isCreator) && (
                        <InviteFriends eventId={event.id} currentUser={currentUser} participantIDs={participantIDs}
                            eventOrganizer={event.type === "MiniEvent" ? event.organizer : null} />
                    )}

                    {/* Nach dem Event & selbst teilgenommen: Feedback geben. */}
                    {!isOrganizer && joined && eventOver && (
                        <div className="card popped" style={{ padding: 20 }}>
                            <div className="h3" style={{ marginBottom: 4 }}>Wie war's?</div>
                            {feedbackGiven ? (
                                <div className="muted" style={{ fontSize: 12 }}>
                                    <Icons.Check size={12} /> Du hast dieses Event schon bewertet. Danke dafür!
                                </div>
                            ) : (
                                <>
                                    <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
                                        Du hast an diesem Event teilgenommen. Teile dein Feedback und hilf anderen bei der Auswahl.
                                    </div>
                                    <Link className="btn primary" to={"/feedbackWindow?eventId=" + event.id}
                                        style={{ width: "100%", justifyContent: "center", padding: "14px 18px", fontSize: 15 }}>
                                        <Icons.Star size={16} /> Feedback geben
                                    </Link>
                                </>
                            )}
                        </div>
                    )}

                    {/* Wetter als eigene Kachel. */}
                    <div className="card" style={{ padding: 20 }}>
                        <div className="h3" style={{ marginBottom: 12 }}>Wetter</div>
                        <WeatherTile weather={event.weather} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
