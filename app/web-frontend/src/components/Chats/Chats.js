import { useState, useEffect, useCallback, useRef } from "react";

import backendURL from "../../backendURL";
import { subscribeRoom } from "../../chatClient";
import Avatar from "../Wiederverwendbare Komponenten/Avatar";
import * as Icons from "../../icons";

// Feste Palette, damit ein Nutzer/Raum immer dieselbe Avatar-Farbe bekommt.
const AV_COLORS = ["#5B8DEF", "#FF7AB6", "#19B36A", "#9B7BFF", "#FFD23F"];
function colorFor(text) {
    let sum = 0;
    for (let i = 0; i < (text || "").length; i++) sum += text.charCodeAt(i);
    return AV_COLORS[sum % AV_COLORS.length];
}

// Anzeigename eines Raums: bei Privatchats der Name des Gegenübers, sonst der Gruppenname.
function roomTitle(room, meId) {
    if (room.type === "PRIVATE") {
        const other = room.members.find((m) => m.id !== meId);
        if (other) return (other.firstName + " " + other.lastName).trim();
    }
    return room.name;
}

function roomSubtitle(room) {
    return room.type === "PRIVATE" ? "Privatchat" : room.members.length + " Mitglieder";
}

function userName(user) {
    return (user.firstName + " " + user.lastName).trim() || user.username;
}

function timeLabel(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

const Chats = ({ currentUser }) => {
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [newMode, setNewMode] = useState("private"); // "private" | "group"
    const [groupName, setGroupName] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    const scrollRef = useRef(null);

    // Räume des eingeloggten Nutzers laden.
    const loadRooms = useCallback(() => {
        fetch(backendURL() + "/chats?userId=" + currentUser.id)
            .then((r) => r.json())
            .then(setRooms)
            .catch(() => setError("Chats konnten nicht geladen werden."));
    }, [currentUser.id]);

    // Alle Nutzer laden (Auswahl für einen neuen Privatchat).
    const loadUsers = useCallback(() => {
        fetch(backendURL() + "/users")
            .then((r) => r.json())
            .then(setUsers)
            .catch(() => {});
    }, []);

    useEffect(() => {
        loadRooms();
        loadUsers();
        // Raumliste regelmäßig neu laden, damit ein Chat, den jemand anderes mit
        // mir startet, automatisch auftaucht (ohne Seiten-Reload).
        const iv = setInterval(loadRooms, 3000);
        return () => clearInterval(iv);
    }, [loadRooms, loadUsers]);

    // Nachrichten des aktiven Raums initial laden, danach live per WebSocket
    // (/topic/room/{id}) aktualisieren statt zu pollen.
    useEffect(() => {
        if (activeRoomId == null) return;
        let alive = true;
        fetch(backendURL() + "/chats/" + activeRoomId + "/messages")
            .then((r) => r.json())
            .then((data) => { if (alive) setMessages(data); })
            .catch(() => {});

        const unsubscribe = subscribeRoom(activeRoomId, (msg) => setMessages((m) => [...m, msg]));
        return () => { alive = false; unsubscribe(); };
    }, [activeRoomId]);

    // Bei neuen Nachrichten ans Ende scrollen.
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

    function send() {
        if (!draft.trim() || activeRoomId == null) return;
        fetch(backendURL() + "/chats/" + activeRoomId + "/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderId: currentUser.id, content: draft })
        })
            .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
            // Die Nachricht selbst kommt über das /topic/room/{id}-Abonnement zurück,
            // hier also nur den Entwurf leeren (sonst würde sie doppelt erscheinen).
            .then(() => setDraft(""))
            .catch(() => setError("Nachricht konnte nicht gesendet werden."));
    }

    // "Neuen Chat"-Ansicht schließen und alle zugehörigen Eingaben zurücksetzen.
    function closeNew() {
        setShowNew(false);
        setSearch("");
        setNewMode("private");
        setGroupName("");
        setSelectedIds([]);
    }

    // Nutzer für einen Gruppenchat an-/abwählen.
    function toggleMember(id) {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    // Privatchat mit einem anderen Nutzer starten (Backend öffnet einen bestehenden erneut).
    function startChat(otherId) {
        setError("");
        fetch(backendURL() + "/chats/private", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstUserId: currentUser.id, secondUserId: otherId })
        })
            .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
            .then((room) => { closeNew(); loadRooms(); setActiveRoomId(room.id); })
            .catch(() => setError("Chat konnte nicht gestartet werden."));
    }

    // Gruppenchat mit Name und ausgewählten Mitgliedern anlegen.
    function createGroup() {
        if (!groupName.trim() || selectedIds.length === 0) return;
        setError("");
        fetch(backendURL() + "/chats/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: groupName, creatorId: currentUser.id, memberIds: selectedIds })
        })
            .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
            .then((room) => { closeNew(); loadRooms(); setActiveRoomId(room.id); })
            .catch(() => setError("Gruppe konnte nicht erstellt werden."));
    }

    const visibleRooms = rooms
        .filter((r) => roomTitle(r, currentUser.id).toLowerCase().includes(search.toLowerCase()));
    const otherUsers = users.filter((u) => u.id !== currentUser.id && userName(u).toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="screen-enter" style={{ height: "calc(100vh - 130px)", display: "flex", flexDirection: "column" }}>
            <div className="row" style={{ marginBottom: 16 }}>
                <div className="h1">Chats</div>
                <div style={{ flex: 1 }} />
                <div className="row" style={{ padding: "6px 12px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--paper)" }}>
                    <Icons.Search size={16} className="muted" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={showNew ? "Nutzer suchen…" : "Suchen…"}
                        style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: 240, color: "var(--ink)" }}
                    />
                </div>
                <button
                    className="btn ghost"
                    onClick={() => (showNew ? closeNew() : setShowNew(true))}
                >
                    {showNew ? "Abbrechen" : (<><Icons.Plus size={16} /> Neuer Chat</>)}
                </button>
            </div>

            {error && <div style={{ color: "var(--pop-pink)", marginBottom: 12, fontSize: 14 }}>{error}</div>}

            <div className="card" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "320px 1fr", flex: 1, minHeight: 0 }}>

                {/* Linke Spalte: entweder meine Chats oder die Nutzerauswahl für einen neuen Chat */}
                <div style={{ borderRight: "1px solid var(--line)", overflow: "auto" }}>
                    {showNew ? (
                        <>
                            {/* Umschalter: Privatchat oder Gruppenchat */}
                            <div style={{ display: "flex", gap: 8, padding: 12, borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "var(--paper)", zIndex: 1 }}>
                                <button className={"chip" + (newMode === "private" ? " green" : "")} onClick={() => setNewMode("private")} style={{ flex: 1, justifyContent: "center", padding: "8px", cursor: "pointer" }}>Privat</button>
                                <button className={"chip" + (newMode === "group" ? " green" : "")} onClick={() => setNewMode("group")} style={{ flex: 1, justifyContent: "center", padding: "8px", cursor: "pointer" }}>Gruppe</button>
                            </div>

                            {/* Bei Gruppen: Name + Erstellen-Button */}
                            {newMode === "group" && (
                                <div style={{ padding: 12, borderBottom: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8 }}>
                                    <input className="input" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Gruppenname" style={{ borderRadius: 10 }} />
                                    <button className="btn primary" onClick={createGroup} disabled={!groupName.trim() || selectedIds.length === 0} style={{ justifyContent: "center" }}>
                                        Gruppe erstellen{selectedIds.length > 0 ? " (" + selectedIds.length + ")" : ""}
                                    </button>
                                </div>
                            )}

                            {otherUsers.length === 0 ? (
                                <div className="muted" style={{ padding: 20, fontSize: 14 }}>Keine Nutzer gefunden.</div>
                            ) : (
                                otherUsers.map((u) => {
                                    const name = userName(u);
                                    const selected = selectedIds.includes(u.id);
                                    const onClick = newMode === "group" ? () => toggleMember(u.id) : () => startChat(u.id);
                                    return (
                                        <button key={u.id} onClick={onClick} style={{
                                            display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 14,
                                            textAlign: "left", borderBottom: "1px solid var(--line)",
                                            background: selected ? "var(--bg)" : "transparent",
                                        }}>
                                            <Avatar name={name} color={colorFor(name)} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                                                <div className="muted" style={{ fontSize: 13 }}>@{u.username}</div>
                                            </div>
                                            {newMode === "group" ? (
                                                <span style={{ width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", border: "2px solid " + (selected ? "var(--ink)" : "var(--line)"), background: selected ? "var(--accent)" : "transparent" }}>
                                                    {selected && <Icons.Check size={14} />}
                                                </span>
                                            ) : (
                                                <Icons.Plus size={16} className="muted" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </>
                    ) : visibleRooms.length === 0 ? (
                        <div className="muted" style={{ padding: 20, fontSize: 14 }}>
                            Noch keine Chats. Tippe auf <b>+</b>, um einen zu starten.
                        </div>
                    ) : (
                        visibleRooms.map((room) => {
                            const name = roomTitle(room, currentUser.id);
                            const isActive = room.id === activeRoomId;
                            return (
                                <button key={room.id} onClick={() => setActiveRoomId(room.id)} style={{
                                    display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 14,
                                    textAlign: "left", borderBottom: "1px solid var(--line)",
                                    background: isActive ? "var(--bg)" : "transparent",
                                    borderLeft: "3px solid " + (isActive ? "var(--accent)" : "transparent"),
                                }}>
                                    <Avatar name={name} color={colorFor(name)} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                                        <div className="muted" style={{ fontSize: 13 }}>{roomSubtitle(room)}</div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Rechte Spalte: aktiver Chat */}
                <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                    {!activeRoom ? (
                        <div className="muted" style={{ margin: "auto", textAlign: "center", padding: 24, fontSize: 15 }}>
                            Wähle links einen Chat aus oder starte über <b>+</b> einen neuen.
                        </div>
                    ) : (
                        <>
                            <div className="row" style={{ padding: 16, borderBottom: "1px solid var(--line)", gap: 12 }}>
                                <Avatar name={roomTitle(activeRoom, currentUser.id)} color={colorFor(roomTitle(activeRoom, currentUser.id))} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700 }}>{roomTitle(activeRoom, currentUser.id)}</div>
                                    <div className="muted" style={{ fontSize: 12 }}>{roomSubtitle(activeRoom)}</div>
                                </div>
                            </div>

                            <div ref={scrollRef} style={{ flex: 1, padding: 18, overflow: "auto", background: "var(--bg)" }}>
                                {messages.length === 0 ? (
                                    <div className="muted" style={{ textAlign: "center", fontSize: 14, marginTop: 24 }}>
                                        Noch keine Nachrichten. Schreib die erste!
                                    </div>
                                ) : (
                                    <div className="stack" style={{ gap: 10 }}>
                                        {messages.map((m) => {
                                            const mine = m.senderId === currentUser.id;
                                            return (
                                                <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                                                    <div style={{
                                                        maxWidth: "70%", padding: "10px 14px", borderRadius: 16, fontSize: 14,
                                                        background: mine ? "var(--accent)" : "var(--paper)",
                                                        border: "1px solid " + (mine ? "var(--ink)" : "var(--line)"),
                                                    }}>
                                                        {/* In Gruppen den Absender über fremden Nachrichten zeigen */}
                                                        {!mine && activeRoom.type === "GROUP" && (
                                                            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{m.senderName}</div>
                                                        )}
                                                        {m.content}
                                                        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: mine ? "right" : "left" }}>{timeLabel(m.timestamp)}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="row" style={{ padding: 14, borderTop: "1px solid var(--line)", gap: 10 }}>
                                <input
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && send()}
                                    placeholder="Nachricht schreiben…"
                                    style={{ flex: 1, padding: "12px 16px", borderRadius: 999, border: "1px solid var(--line)", outline: "none", fontFamily: "inherit", fontSize: 14, background: "var(--bg)", color: "var(--ink)" }}
                                />
                                <button className="btn primary icon" onClick={send} disabled={!draft.trim()} style={{ padding: 12 }}>
                                    <Icons.Send size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chats;
