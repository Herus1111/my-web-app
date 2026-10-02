import { useEffect, useState } from "react";

import EventList from "./Child-Components/EventList";
import ScreenHeader from "../Wiederverwendbare Komponenten/ScreenHeader";
import backendURL from "../../backendURL";
import useFetch from "../../useFetch";

const EventUebersicht = ({ currentUser }) => {
    const { data, isPending, error } = useFetch(backendURL() + "/events");
    const [events, setEvents] = useState([]);
    // Event-IDs im persönlichen Event-Graph (null = noch nicht geladen).
    const [treeIds, setTreeIds] = useState(null);

    useEffect(() => {
        setEvents(data || []);
    }, [data]);

    // Nur Studierende haben einen persönlichen Event-Graph (Veranstalter nehmen nicht teil).
    const isStudent = currentUser?.type === "Student";
    const userId = currentUser?.id;

    // Baum des Nutzers laden -> in der Übersicht sollen nur Events erscheinen, die
    // aktuell im Event-Graph sind (Vorschläge, besuchte, eingeladene).
    useEffect(() => {
        if (!isStudent || userId == null) { setTreeIds(null); return; }
        let alive = true;
        const load = () => {
            fetch(backendURL() + "/EventGraph/" + userId)
                .then((r) => (r.ok ? r.json() : []))
                .then((nodes) => {
                    if (!alive) return;
                    const ids = (Array.isArray(nodes) ? nodes : [])
                        .map((n) => n.eventId)
                        .filter((v) => v != null && v > 0); // Wurzel (eventId -1) ausklammern
                    setTreeIds(new Set(ids));
                })
                .catch(() => { if (alive) setTreeIds(new Set()); });
        };
        load();
        // Der Graph wächst, wenn Events besucht werden -> gelegentlich aktualisieren.
        const iv = setInterval(load, 4000);
        return () => { alive = false; clearInterval(iv); };
    }, [isStudent, userId]);

    // Für Studierende auf die Graph-Events filtern; sonst alle anzeigen.
    const treeLoading = isStudent && treeIds === null;
    const visibleEvents = isStudent && treeIds ? events.filter((e) => treeIds.has(e.id)) : events;

    // "besucht" = angemeldet UND Termin vorbei. "angemeldet" = angemeldet, Termin noch offen.
    const isRegistered = (e) => userId != null && Array.isArray(e.participantIDs) && e.participantIDs.includes(userId);
    const isOver = (e) => { const d = e.eventdate ? new Date(e.eventdate) : null; return d != null && !isNaN(d.getTime()) && d.getTime() < Date.now(); };
    const isDone = (e) => isRegistered(e) && isOver(e);

    // Reiter: aktuelle Events (inkl. angemeldeter, ohne besuchte) vs. beendete.
    const [tab, setTab] = useState("current");
    const currentList = visibleEvents.filter((e) => !isDone(e));
    const doneList = visibleEvents.filter((e) => isDone(e));
    const shownList = isStudent ? (tab === "done" ? doneList : currentList) : visibleEvents;

    return (
        <div className="screen-enter">
            <ScreenHeader
                title="Events entdecken"
                subtitle="Finde offizielle Events, nimm teil und lerne neue Leute kennen."
            />

            {/* Reiter: aktuelle vs. beendete (besuchte) Events. */}
            {isStudent && !isPending && !treeLoading && !error && (
                <div className="row" style={{ marginBottom: 18 }}>
                    <div className="row" style={{ padding: 3, background: "var(--paper)", borderRadius: 999, border: "1px solid var(--line)", boxShadow: "var(--shadow-card)" }}>
                        {[{ id: "current", label: "Events", n: currentList.length }, { id: "done", label: "Beendet", n: doneList.length }].map((t) => (
                            <button key={t.id} onClick={() => setTab(t.id)} style={{
                                padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none",
                                background: tab === t.id ? "var(--ink)" : "transparent",
                                color: tab === t.id ? "white" : "var(--muted)",
                            }}>{t.label} ({t.n})</button>
                        ))}
                    </div>
                </div>
            )}

            {(isPending || treeLoading) && <div className="muted" style={{ padding: 12 }}>Lädt Events…</div>}
            {error && (
                <div className="card" style={{ padding: 20, borderColor: "var(--pop-pink)" }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Events konnten nicht geladen werden.</div>
                    <div className="muted" style={{ fontSize: 13 }}>{error}</div>
                </div>
            )}
            {!isPending && !treeLoading && !error && (
                <EventList
                    events={shownList}
                    currentUser={currentUser}
                    emptyText={!isStudent ? undefined
                        : tab === "done"
                            ? "Noch keine beendeten Events. Sobald ein Event vorbei ist, an dem du teilgenommen hast, erscheint es hier."
                            : "Noch keine Events in deinem Event-Graph. Öffne den Event-Graph, um passende Vorschläge zu erhalten."}
                />
            )}
        </div>
    );
};

export default EventUebersicht;
