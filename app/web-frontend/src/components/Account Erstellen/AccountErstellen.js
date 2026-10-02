import { useState } from "react";
import { Link } from "react-router-dom";

import CreateUser from "./Child-Komponenten/CreateUser";

// 2-Schritt-Onboarding: Rolle wählen -> Profil-Formular.
// Angelehnt an design-reference/src/onboarding.jsx.
const ROLES = [
    {
        id: "STUDENT",
        icon: "🎓",
        title: "Student",
        desc: "Du entdeckst Events, nimmst teil und erstellst Mini-Events mit Freunden.",
        perks: ["Event-Graph durchstöbern", "An Events teilnehmen", "Mini-Events erstellen", "Freunde einladen"],
    },
    {
        id: "VERANSTALTER",
        icon: "🎪",
        title: "Veranstalter",
        desc: "Du organisierst offizielle Events, erreichst Studierende und verwaltest Anmeldungen.",
        perks: ["Offizielle Events erstellen", "Anmeldungen verwalten", "Statistiken & Dashboard", "Events veröffentlichen"],
    },
];

const AccountErstellen = ({ onFinish }) => {
    const [step, setStep] = useState(0);
    const [role, setRole] = useState(null);
    const [done, setDone] = useState(null);

    if (done) {
        return (
            <div className="screen-enter" style={{ display: "grid", placeItems: "center", minHeight: 500 }}>
                <div className="card popped" style={{ padding: 40, textAlign: "center", maxWidth: 460 }}>
                    <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
                    <div className="h2" style={{ marginBottom: 10 }}>Willkommen, {done.firstName || done.username}!</div>
                    <div className="muted" style={{ fontSize: 15, marginBottom: 24 }}>
                        Dein {done.role === "STUDENT" ? "Studenten" : "Veranstalter"}-Account wurde erstellt.
                        Melde dich jetzt an, um loszulegen.
                    </div>
                    {onFinish ? (
                        <button className="btn primary" onClick={onFinish}>Jetzt einloggen →</button>
                    ) : (
                        <Link className="btn primary" to="/eventOverview">Zu den Events →</Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="screen-enter" style={{ maxWidth: 720, margin: "0 auto" }}>
            <div className="row" style={{ gap: 8, marginBottom: 32 }}>
                {["Rolle wählen", "Dein Profil"].map((label, i) => (
                    <div key={label} style={{ flex: 1 }}>
                        <div style={{ height: 4, borderRadius: 999, background: i <= step ? "var(--accent)" : "var(--line)", marginBottom: 6 }} />
                        <div style={{ fontSize: 12, fontWeight: i === step ? 700 : 500, color: i === step ? "var(--ink)" : "var(--muted)" }}>{label}</div>
                    </div>
                ))}
            </div>

            {step === 0 && (
                <div style={{ animation: "fadeIn .3s ease" }}>
                    <div className="h1" style={{ marginBottom: 10 }}>
                        Willkommen bei <span style={{ color: "var(--accent)" }}>GrowDent</span> 👋
                    </div>
                    <div className="muted" style={{ fontSize: 16, marginBottom: 28 }}>
                        Wähle, wer du bist. Das bestimmt, welche Funktionen du nutzen kannst.
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                        {ROLES.map((r) => (
                            <button key={r.id} type="button" onClick={() => setRole(r.id)}
                                style={{
                                    padding: 28, borderRadius: 24, textAlign: "left", cursor: "pointer",
                                    border: "2px solid " + (role === r.id ? "var(--pop-ink)" : "var(--line)"),
                                    background: role === r.id ? "var(--accent)" : "var(--paper)",
                                    boxShadow: role === r.id ? "0 6px 0 var(--pop-ink)" : "var(--shadow-card)",
                                    transform: role === r.id ? "translateY(-3px)" : "none",
                                    transition: "all .2s", display: "flex", flexDirection: "column", gap: 14,
                                }}>
                                <div style={{ fontSize: 48 }}>{r.icon}</div>
                                <div>
                                    <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>{r.title}</div>
                                    <div style={{ fontSize: 14, lineHeight: 1.5, color: role === r.id ? "var(--ink-2)" : "var(--muted)" }}>{r.desc}</div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {r.perks.map((p) => (
                                        <div key={p} className="row" style={{ gap: 8, fontSize: 13 }}>
                                            <span className="perk-check" style={{ width: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 10 }}>✓</span>
                                            <span style={{ fontWeight: 500 }}>{p}</span>
                                        </div>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="row" style={{ justifyContent: "flex-end", marginTop: 28 }}>
                        <button type="button" className="btn primary" disabled={!role}
                            onClick={() => setStep(1)} style={{ padding: "12px 28px" }}>
                            Weiter →
                        </button>
                    </div>
                </div>
            )}

            {step === 1 && (
                <div style={{ animation: "fadeIn .3s ease" }}>
                    <CreateUser role={role} onBack={() => setStep(0)} onSuccess={setDone} />
                </div>
            )}
        </div>
    );
};

export default AccountErstellen;
