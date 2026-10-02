import { useState } from "react";
import backendURL from "../../backendURL";
import { ACCENTS, getSavedAccentId, applyAccent } from "../../accentTheme";
import { getSavedTheme, applyTheme } from "../../theme";

// Einstellungsseite – portiert aus dem Design (design-reference/src/screens-settings.jsx).
// Umgesetzt: Dunkelmodus, Akzentfarbe, Konto-Infos, Abmelden und Account löschen.

const ROLE_LABELS = {
    Student: "Studierende:r",
    Veranstalter: "Veranstalter:in",
};

// Abschnitts-Überschrift (Kleinkapitälchen-Look wie im Design).
const SectionLabel = ({ children }) => (
    <div style={{
        fontSize: 11, fontWeight: 700, color: "var(--muted)",
        textTransform: "uppercase", letterSpacing: ".1em", padding: "24px 0 10px",
    }}>{children}</div>
);

// Eine Einstellungs-Zeile: Icon + Label/Sub + Steuerung rechts.
const Row = ({ icon, label, sub, children, danger, last }) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
        borderBottom: last ? "none" : "1px solid var(--line)",
    }}>
        {icon != null && (
            <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: danger ? "#FFF0EE" : "var(--bg)",
                display: "grid", placeItems: "center", fontSize: 16,
                color: danger ? "#D94F3D" : "var(--muted)",
                border: "1px solid " + (danger ? "#FCCEC9" : "var(--line)"),
            }}>{icon}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: danger ? "#D94F3D" : "var(--ink)" }}>{label}</div>
            {sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
);

// Interaktiver An/Aus-Schalter.
const Toggle = ({ value, onChange }) => (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
        style={{
            width: 48, height: 28, borderRadius: 999, position: "relative", padding: 0,
            cursor: "pointer", border: "none", transition: "background .2s",
            background: value ? "var(--accent)" : "var(--line)",
        }}>
        <span style={{
            position: "absolute", top: 3, left: value ? "calc(100% - 25px)" : 3,
            width: 22, height: 22, borderRadius: 999, background: "#fff",
            transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
        }} />
    </button>
);

const Einstellungen = ({ currentUser, onLogout }) => {
    const [accentId, setAccentId] = useState(getSavedAccentId);
    const [theme, setTheme] = useState(getSavedTheme);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const chooseAccent = (id) => {
        applyAccent(id);
        setAccentId(id);
    };

    const toggleDark = (on) => {
        applyTheme(on ? "dark" : "light");
        setTheme(on ? "dark" : "light");
    };

    const deleteAccount = () => {
        if (!currentUser?.id) return;
        setDeleting(true);
        setDeleteError("");
        fetch(backendURL() + "/users/" + currentUser.id, { method: "DELETE" })
            .then((res) => {
                if (!res.ok) throw new Error();
                onLogout();
            })
            .catch(() => setDeleteError("Löschen fehlgeschlagen. Bitte später erneut versuchen."))
            .finally(() => setDeleting(false));
    };

    const isDark = theme === "dark";
    const activeAccent = ACCENTS.find((a) => a.id === accentId) || ACCENTS[0];
    const fullName = [currentUser?.firstName, currentUser?.lastName]
        .filter(Boolean).join(" ") || currentUser?.username || "Mein Profil";
    const isStudent = currentUser?.type === "Student";
    const roleLabel = ROLE_LABELS[currentUser?.type] || "Konto";
    const avatarInitial = (fullName[0] || "?").toUpperCase();

    return (
        <div className="screen-enter" style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ marginBottom: 8 }}>
                <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                    Konto
                </div>
                <div className="h1">Einstellungen</div>
            </div>

            {/* ── ERSCHEINUNGSBILD ── */}
            <SectionLabel>Erscheinungsbild</SectionLabel>
            <div className="card" style={{ padding: "0 20px" }}>
                {/* Dunkelmodus – funktional */}
                <Row icon={isDark ? "🌙" : "☀️"} label="Dunkelmodus"
                    sub={isDark ? "Dunkles Layout aktiv" : "Helles Layout aktiv"}>
                    <Toggle value={isDark} onChange={toggleDark} />
                </Row>

                {/* Akzentfarbe – funktional */}
                <Row icon="🎨" label="Akzentfarbe" sub={activeAccent.label} last>
                    <div style={{ display: "flex", gap: 8 }}>
                        {ACCENTS.map((a) => {
                            const sel = a.id === accentId;
                            return (
                                <button key={a.id} type="button" onClick={() => chooseAccent(a.id)}
                                    title={a.label} aria-label={a.label} aria-pressed={sel}
                                    style={{
                                        width: 26, height: 26, borderRadius: 999, cursor: "pointer",
                                        background: a.accent, padding: 0, border: "2px solid var(--paper)",
                                        boxShadow: sel ? "0 0 0 2px var(--ink)" : "0 0 0 1px var(--line)",
                                        transition: "box-shadow .15s",
                                    }} />
                            );
                        })}
                    </div>
                </Row>
            </div>

            {/* ── KONTO ── */}
            <SectionLabel>Konto</SectionLabel>
            <div className="card" style={{ padding: "0 20px" }}>
                {/* Profil-Info – echt aus dem Login */}
                <Row
                    icon={<span style={{
                        width: 26, height: 26, borderRadius: 7, display: "grid", placeItems: "center",
                        background: "var(--accent)", color: "#fff", fontFamily: "var(--font-display)",
                        fontWeight: 700, fontSize: 13,
                    }}>{avatarInitial}</span>}
                    label={fullName}
                    sub={currentUser?.email || roleLabel}
                >
                    <span className="chip" style={{ fontSize: 11 }}>
                        {isStudent ? "🎓 Studierende:r" : "🎪 " + roleLabel}
                    </span>
                </Row>

                {/* Abmelden – echt */}
                <Row icon="🚪" label="Abmelden" sub="Von diesem Gerät ausloggen">
                    <button className="btn ghost" style={{ fontSize: 13, padding: "7px 14px" }}
                        onClick={onLogout}>
                        Abmelden
                    </button>
                </Row>

                {/* Account löschen – echt (Backend: DELETE /users/{id}) */}
                {!confirmDelete ? (
                    <Row icon="🗑️" label="Account löschen" sub="Alle Daten werden dauerhaft gelöscht" danger last>
                        <button onClick={() => setConfirmDelete(true)} style={{
                            padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                            border: "1px solid #FCCEC9", background: "#FFF0EE", color: "#D94F3D",
                            cursor: "pointer", fontFamily: "inherit",
                        }}>
                            Löschen
                        </button>
                    </Row>
                ) : (
                    <div style={{ padding: "18px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{
                            background: "#FFF0EE", border: "1px solid #FCCEC9", borderRadius: 14,
                            padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start",
                        }}>
                            <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#D94F3D", marginBottom: 4 }}>
                                    Bist du sicher?
                                </div>
                                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                                    Dein Account und alle zugehörigen Daten werden dauerhaft gelöscht.
                                    Du wirst danach abgemeldet. Das kann nicht rückgängig gemacht werden.
                                </div>
                                {deleteError && (
                                    <div style={{ fontSize: 13, color: "#D94F3D", fontWeight: 600, marginTop: 8 }}>
                                        {deleteError}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button className="btn ghost" style={{ fontSize: 13 }} disabled={deleting}
                                onClick={() => { setConfirmDelete(false); setDeleteError(""); }}>
                                Abbrechen
                            </button>
                            <button onClick={deleteAccount} disabled={deleting} style={{
                                padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                                border: "2px solid #D94F3D", background: "#D94F3D", color: "white",
                                cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit",
                                boxShadow: "0 3px 0 #8B2E20", opacity: deleting ? 0.6 : 1,
                            }}>
                                {deleting ? "Wird gelöscht…" : "🗑️ Ja, Account löschen"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ height: 40 }} />
        </div>
    );
};

export default Einstellungen;
