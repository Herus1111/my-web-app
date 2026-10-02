import { useState, useEffect, useCallback } from "react";

import backendURL from "../../backendURL";
import ScreenHeader from "../Wiederverwendbare Komponenten/ScreenHeader";
import Avatar from "../Wiederverwendbare Komponenten/Avatar";
import * as Icons from "../../icons";

// Feste Palette, damit ein Nutzer immer dieselbe Avatar-Farbe bekommt.
const AV_COLORS = ["#5B8DEF", "#FF7AB6", "#19B36A", "#9B7BFF", "#FFD23F"];
function colorFor(text) {
    let sum = 0;
    for (let i = 0; i < (text || "").length; i++) sum += text.charCodeAt(i);
    return AV_COLORS[sum % AV_COLORS.length];
}

function userName(user) {
    if (!user) return "Unbekannt";
    return (user.firstName + " " + user.lastName).trim() || user.username;
}

const FreundeUebersicht = ({ currentUser }) => {
    const me = currentUser.id;

    const [friendships, setFriendships] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    const loadFriendships = useCallback(() => {
        return fetch(backendURL() + "/friendships/" + me)
            .then((r) => r.json())
            .then(setFriendships)
            .catch(() => setError("Freundschaften konnten nicht geladen werden."));
    }, [me]);

    useEffect(() => {
        Promise.all([
            loadFriendships(),
            fetch(backendURL() + "/users").then((r) => r.json()).then(setUsers).catch(() => {})
        ]).finally(() => setLoading(false));
    }, [loadFriendships]);

    // Freundschaften/Anfragen live halten: alle 3s neu laden, damit Änderungen der
    // Gegenseite (annehmen, zurückziehen, entfernen) ohne manuellen Reload sichtbar werden.
    // Die Nutzerliste wird mitaktualisiert, damit auch neu registrierte Absender korrekt erscheinen.
    useEffect(() => {
        const iv = setInterval(() => {
            loadFriendships();
            fetch(backendURL() + "/users").then((r) => r.json()).then(setUsers).catch(() => {});
        }, 3000);
        return () => clearInterval(iv);
    }, [loadFriendships]);

    // Die "andere" Person einer Freundschaft (ich kann Absender oder Empfänger sein).
    const otherId = (f) => (f.studentId === me ? f.friendId : f.studentId);
    const userById = (id) => users.find((u) => u.id === id);

    const accepted = friendships.filter((f) => f.status === "ACCEPTED");
    const incoming = friendships.filter((f) => f.status === "PENDING" && f.friendId === me);
    const outgoing = friendships.filter((f) => f.status === "PENDING" && f.studentId === me);

    // Alle bereits verbundenen IDs (Freund oder offene Anfrage) – die blenden wir beim Hinzufügen aus.
    const connectedIds = new Set(friendships.map(otherId));
    // Nur Studierende können befreundet werden – Veranstalter tauchen nicht als hinzufügbar auf.
    const addableUsers = users.filter(
        (u) => u.id !== me && u.type === "Student" && !connectedIds.has(u.id) && userName(u).toLowerCase().includes(search.toLowerCase())
    );

    // Eine Aktion ausführen und danach die Freundschaften neu laden.
    function act(url, method) {
        setError("");
        return fetch(backendURL() + url, { method })
            .then((r) => { if (!r.ok) throw new Error(); return loadFriendships(); })
            .catch(() => setError("Aktion fehlgeschlagen."));
    }

    const sendRequest = (id) => act("/friendships/request?studentId=" + me + "&friendId=" + id, "POST");
    const accept = (id) => act("/friendships/accept?studentId=" + id + "&friendId=" + me, "PUT");
    const decline = (id) => act("/friendships/decline?studentId=" + id + "&friendId=" + me, "POST");
    const cancel = (id) => act("/friendships/delete?studentId=" + me + "&friendId=" + id, "DELETE");
    const removeFriend = (id) => act("/friendships/delete?studentId=" + me + "&friendId=" + id, "DELETE");

    return (
        <div className="screen-enter">
            <ScreenHeader
                title="Freunde"
                subtitle="Verwalte deine Freundschaften und Anfragen."
                action={
                    <button className={"btn " + (showAdd ? "ghost" : "primary")} onClick={() => { setShowAdd((v) => !v); setSearch(""); }}>
                        {showAdd ? "Fertig" : (<><Icons.Plus size={14} /> Freund hinzufügen</>)}
                    </button>
                }
            />

            {error && <div style={{ color: "var(--pop-pink)", marginBottom: 16, fontSize: 14 }}>{error}</div>}

            {loading ? (
                <div className="muted">Lädt…</div>
            ) : (
                <>
                    {/* Freund hinzufügen: Nutzer, mit denen noch keine Freundschaft/Anfrage besteht */}
                    {showAdd && (
                        <div className="card" style={{ padding: 18, marginBottom: 24 }}>
                            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
                                <div className="h3">Nutzer finden</div>
                                <div className="row" style={{ padding: "6px 12px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--paper)" }}>
                                    <Icons.Search size={16} className="muted" />
                                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen…"
                                        style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: 200, color: "var(--ink)" }} />
                                </div>
                            </div>
                            {addableUsers.length === 0 ? (
                                <div className="muted" style={{ fontSize: 14 }}>Keine weiteren Nutzer gefunden.</div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                                    {addableUsers.map((u) => {
                                        const name = userName(u);
                                        return (
                                            <div key={u.id} className="row" style={{ gap: 12, padding: 10, borderRadius: 12, border: "1px solid var(--line)" }}>
                                                <Avatar name={name} color={colorFor(name)} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                                                    <div className="muted" style={{ fontSize: 12 }}>@{u.username}</div>
                                                </div>
                                                <button className="btn primary" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => sendRequest(u.id)}>Anfragen</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Eingehende Freundschaftsanfragen */}
                    {incoming.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <div className="h3" style={{ marginBottom: 16 }}>Anfragen ({incoming.length})</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                                {incoming.map((f) => {
                                    const id = otherId(f);
                                    const name = userName(userById(id));
                                    return (
                                        <div key={f.id} className="card popped" style={{ padding: 18 }}>
                                            <div className="row" style={{ gap: 14, marginBottom: 14 }}>
                                                <Avatar name={name} color={colorFor(name)} size="lg" />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
                                                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>möchte dich als Freund hinzufügen</div>
                                                </div>
                                            </div>
                                            <div className="row" style={{ gap: 8 }}>
                                                <button className="btn primary" style={{ flex: 1, justifyContent: "center", padding: 8, fontSize: 13 }} onClick={() => accept(id)}><Icons.Check size={14} /> Annehmen</button>
                                                <button className="btn ghost" style={{ flex: 1, justifyContent: "center", padding: 8, fontSize: 13 }} onClick={() => decline(id)}>Ablehnen</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Gesendete, noch offene Anfragen */}
                    {outgoing.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <div className="h3" style={{ marginBottom: 16 }}>Gesendet ({outgoing.length})</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                                {outgoing.map((f) => {
                                    const id = otherId(f);
                                    const name = userName(userById(id));
                                    return (
                                        <div key={f.id} className="card" style={{ padding: 18 }}>
                                            <div className="row" style={{ gap: 14 }}>
                                                <Avatar name={name} color={colorFor(name)} size="lg" />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
                                                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Anfrage ausstehend</div>
                                                </div>
                                                <button className="btn ghost" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => cancel(id)}>Zurückziehen</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Bestätigte Freunde */}
                    <div className="h3" style={{ marginBottom: 16 }}>Alle Freunde ({accepted.length})</div>
                    {accepted.length === 0 ? (
                        <div className="muted" style={{ fontSize: 14 }}>
                            Noch keine Freunde. Tippe auf <b>Freund hinzufügen</b>, um jemanden anzufragen.
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                            {accepted.map((f) => {
                                const id = otherId(f);
                                const user = userById(id);
                                const name = userName(user);
                                return (
                                    <div key={f.id} className="card" style={{ padding: 18 }}>
                                        <div className="row" style={{ gap: 14, marginBottom: 14 }}>
                                            <Avatar name={name} color={colorFor(name)} size="lg" />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
                                                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{user ? "@" + user.username : "Freund"}</div>
                                            </div>
                                        </div>
                                        <div className="row" style={{ gap: 8 }}>
                                            <button className="btn ghost" style={{ flex: 1, justifyContent: "center", padding: 8, fontSize: 13 }} onClick={() => removeFriend(id)}>Entfernen</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FreundeUebersicht;
