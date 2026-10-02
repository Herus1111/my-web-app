import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ScreenHeader from "../Wiederverwendbare Komponenten/ScreenHeader";
import backendURL from "../../backendURL";
import * as Icons from "../../icons";

// Abbildung des User-Typs (vom Backend) auf ein lesbares Rollen-Label.
const ROLE_LABELS = {
    Student: "Studierende:r",
    Veranstalter: "Veranstalter:in",
};

const ProfilStudent = ({ currentUser }) => {
    const me = currentUser?.id;
    const myName = currentUser?.username || currentUser?.firstName;
    const [stats, setStats] = useState(null);
    const [likedGenres, setLikedGenres] = useState([]);

    // Echte Nutzerdaten aus dem Login; Fallbacks für den seltenen Fall ohne User.
    const fullName = [currentUser?.firstName, currentUser?.lastName]
        .filter(Boolean).join(" ") || currentUser?.username || "Mein Profil";
    const roleLabel = ROLE_LABELS[currentUser?.type] || "Profil";
    const avatarInitial = (fullName[0] || "?").toUpperCase();

    // Statistiken aus vorhandenen Endpunkten zusammenrechnen (kein eigenes Backend nötig).
    useEffect(() => {
        if (me == null) return;
        let alive = true;
        Promise.all([
            fetch(backendURL() + "/events").then((r) => r.json()).catch(() => []),
            fetch(backendURL() + "/friendships/" + me).then((r) => r.json()).catch(() => []),
            fetch(backendURL() + "/feedback").then((r) => r.json()).catch(() => []),
            fetch(backendURL() + "/users/" + me).then((r) => r.json()).catch(() => null),
        ]).then(([events, friendships, feedback, userDetails]) => {
            if (!alive) return;
            const evs = Array.isArray(events) ? events : [];
            const now = Date.now();
            const isPast = (e) => { const d = e.eventdate ? new Date(e.eventdate) : null; return d != null && !isNaN(d.getTime()) && d.getTime() < now; };
            const participated = evs.filter((e) => Array.isArray(e.participantIDs) && e.participantIDs.includes(me));
            const besucht = participated.filter(isPast).length;
            const anstehend = participated.length - besucht;
            const erstellteMini = evs.filter((e) => e.type === "MiniEvent" && e.organizer === myName).length;
            const freunde = (Array.isArray(friendships) ? friendships : []).filter((f) => f.status === "ACCEPTED").length;
            const feedbacks = (Array.isArray(feedback) ? feedback : []).filter((f) => f.username === myName).length;
            const favoriteGenres = Array.isArray(userDetails?.likedGenres) ? userDetails.likedGenres : [];

            setStats([
                { label: "Besuchte Events", value: besucht, icon: "🎉" },
                { label: "Anstehende Events", value: anstehend, icon: "📅" },
                { label: "Freunde", value: freunde, icon: "🤝" },
                { label: "Erstellte Mini-Events", value: erstellteMini, icon: "🍳" },
                { label: "Feedbacks gegeben", value: feedbacks, icon: "⭐" },
            ]);
            setLikedGenres(favoriteGenres);
        });
        return () => { alive = false; };
    }, [me, myName]);

    return (
        <div className="screen-enter">
            <ScreenHeader title="Profil" action={
                <Link className="btn" to="/settings">
                    <Icons.Settings size={16} /> Einstellungen
                </Link>
            } />

            <div className="card" style={{
                padding: 32, marginBottom: 22, color: "var(--ink)",
                background: "linear-gradient(135deg, var(--accent), var(--paper))",
                display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap",
            }}>
                <div className="av xl" style={{ borderRadius: 24, border: "5px solid var(--paper)" }}>
                    {avatarInitial}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div className="h1" style={{ fontSize: 36 }}>{fullName}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.75 }}>
                        {roleLabel}
                        {currentUser?.username && <> · @{currentUser.username}</>}
                    </div>
                    {currentUser?.email && (
                        <div style={{ fontSize: 13, opacity: 0.65, marginTop: 2 }}>{currentUser.email}</div>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: 22 }}>
                <div className="h3" style={{ marginBottom: 14 }}>Statistiken</div>
                {stats == null ? (
                    <div className="muted" style={{ fontSize: 13 }}>Lädt…</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                        {stats.map((s) => (
                            <div key={s.label} className="row" style={{ padding: 12, background: "var(--bg)", borderRadius: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--paper)", display: "grid", placeItems: "center", fontSize: 18 }}>{s.icon}</div>
                                <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{s.label}</div>
                                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card" style={{ padding: 22, marginTop: 18 }}>
                <div className="h3" style={{ marginBottom: 12 }}>Meine Lieblingsgenres</div>
                {likedGenres.length === 0 ? (
                    <div className="muted" style={{ fontSize: 13 }}>
                        Noch keine Lieblingsgenres – nach positiven Feedbacks zu besuchten Events erscheinen sie hier.
                    </div>
                ) : (
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                        {likedGenres.map((genre) => (
                            <span key={genre} className="chip">{genre}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilStudent;
