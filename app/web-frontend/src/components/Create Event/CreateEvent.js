import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import backendURL from '../../backendURL';
import ScreenHeader from '../Wiederverwendbare Komponenten/ScreenHeader';

// Auswahl an Genres – deckt sich mit dem, was der RecommendationService fürs
// Matching nutzt (gleicher Genre-String bei Event und Interessen).
const GENRES = ["Party", "Sport", "Kultur", "Musik", "Essen", "Gaming", "Lernen", "Sonstiges"];

// Lokale Zeit im Format, das <input type="datetime-local"> erwartet (YYYY-MM-DDTHH:mm).
// Bewusst nicht über toISOString(), das würde auf UTC umrechnen und die Zeit verschieben.
function toLocalInputValue(date) {
    const p = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
        + `T${p(date.getHours())}:${p(date.getMinutes())}`;
}

const CreateEvent = ({ currentUser }) => {
    let history = useHistory();

    // Ein Student erstellt (laut Backend-Factory) immer ein MiniEvent, ein
    // Veranstalter ein offizielles VeranstalterEvent. Danach richten sich die
    // sichtbaren Felder und die Texte.
    const isOrganizer = currentUser?.type === "Veranstalter";

    const [name, setName] = useState('');
    const [venue, setVenue] = useState('');
    const [eventdate, setEventdate] = useState('');
    const [maxSlots, setMaxSlots] = useState(50);
    const [genre, setGenre] = useState(GENRES[0]);
    const [eventPicture, setEventPicture] = useState(null);

    // Nur VeranstalterEvent
    const [ticketPreis, setTicketPreis] = useState('');
    const [mindestalter, setMindestalter] = useState('');
    const [ticketLink, setTicketLink] = useState('');
    // Nur MiniEvent
    const [treffpunktHinweis, setTreffpunktHinweis] = useState('');
    const [mitbringliste, setMitbringliste] = useState('');

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Veranstaltername ist automatisch der Anzeigename des eingeloggten Nutzers.
    const organizer = currentUser?.username || currentUser?.firstName || "";

    // Frühestmöglicher Termin ist "jetzt". Wird bei jedem Render neu berechnet, damit
    // der Wert nicht veraltet, wenn das Formular länger offen liegt.
    const minEventdate = toLocalInputValue(new Date());

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!currentUser?.id) {
            setError("Kein eingeloggter Nutzer – Event kann nicht erstellt werden.");
            return;
        }

        // Ein Event in der Vergangenheit ergibt nirgends Sinn: beitreten ist dort gesperrt
        // und im Event-Graph dürfen Nachfolger nie vor ihrem Elternevent liegen.
        // Das min-Attribut unten fängt das schon im Browser ab – hier noch einmal, weil
        // sich das Feld auch per Tastatur oder Autofill mit einem alten Datum füllen lässt.
        const gewaehlterTermin = new Date(eventdate);
        if (!eventdate || isNaN(gewaehlterTermin.getTime())) {
            setError("Bitte gib ein gültiges Datum mit Uhrzeit an.");
            return;
        }
        if (gewaehlterTermin.getTime() <= Date.now()) {
            setError("Der Termin liegt in der Vergangenheit. Bitte wähle einen Zeitpunkt in der Zukunft.");
            return;
        }

        setIsSubmitting(true);

        // EventRequest fürs Backend. Die typspezifischen Felder bleiben null, wenn
        // sie für den jeweiligen Event-Typ nicht relevant sind.
        const eventData = {
            name,
            venue,
            eventdate,
            organizer,
            maxSlots,
            genre,
            ticketPreis: isOrganizer && ticketPreis !== '' ? Number(ticketPreis) : null,
            mindestalter: isOrganizer && mindestalter !== '' ? Number(mindestalter) : null,
            ticketLink: isOrganizer ? (ticketLink || null) : null,
            treffpunktHinweis: !isOrganizer ? (treffpunktHinweis || null) : null,
            mitbringliste: !isOrganizer ? (mitbringliste || null) : null,
        };

        try {
            // Schritt 1: Text-Daten als JSON an den Create-Endpunkt (Factory wählt Mini/Veranstalter).
            const eventResponse = await fetch(backendURL() + "/events/user/" + currentUser.id, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(eventData)
            });

            if (!eventResponse.ok) {
                throw new Error("Fehler bei Schritt 1: Konnte das Event nicht speichern.");
            }

            const savedEvent = await eventResponse.json();
            const newEventId = savedEvent.id;

            // Schritt 2: Bild separat als FormData senden (Content-Type NICHT selbst setzen!)
            if (eventPicture) {
                const formData = new FormData();
                formData.append("eventPicture", eventPicture);

                const imageResponse = await fetch(backendURL() + `/events/${newEventId}/picture`, {
                    method: 'POST',
                    body: formData
                });

                if (!imageResponse.ok) {
                    throw new Error("Fehler bei Schritt 2: Event wurde erstellt, aber Bild-Upload schlug fehl.");
                }
            }

            // Veranstalter landen im Dashboard; Studierende direkt auf der Detailseite
            // ihres neuen Mini-Events, wo sie gleich Freunde einladen können.
            history.push(isOrganizer ? "/organizerDashboard" : "/eventOverview/" + newEventId);
        } catch (err) {
            console.error("Gesamter Fehler:", err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="screen-enter">
            <ScreenHeader
                title={isOrganizer ? "Event erstellen" : "Mini-Event erstellen"}
                subtitle={isOrganizer
                    ? "Veröffentliche ein offizielles Event und erreiche Studierende."
                    : "Hoste ein kleines Treffen und lade andere Studierende ein."}
            />
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 22, alignItems: "start" }}>
                    <div className="card" style={{ padding: 28 }}>
                        <div className="h3" style={{ marginBottom: 18 }}>Grundinformationen</div>

                        <label className="field-label" htmlFor="name">{isOrganizer ? "Eventname *" : "Name des Mini-Events *"}</label>
                        <input className="input" id="name" type="text" value={name}
                            placeholder={isOrganizer ? "z. B. Semester-Opening 2026" : "z. B. Uni Spieleabend #12"}
                            onChange={(e) => setName(e.target.value)} required style={{ marginBottom: 16 }} />

                        <label className="field-label" htmlFor="venue">{isOrganizer ? "Veranstaltungsort *" : "Treffpunkt *"}</label>
                        <input className="input" id="venue" type="text" value={venue}
                            placeholder="z. B. Mensa Süd, TU Dortmund"
                            onChange={(e) => setVenue(e.target.value)} required style={{ marginBottom: 16 }} />

                        <label className="field-label" htmlFor="eventdate">Datum & Uhrzeit *</label>
                        <input className="input" id="eventdate" type="datetime-local" value={eventdate}
                            min={minEventdate}
                            onChange={(e) => setEventdate(e.target.value)} required style={{ marginBottom: 4 }} />
                        <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
                            Der Termin muss in der Zukunft liegen.
                        </div>

                        <label className="field-label" htmlFor="genre">Genre *</label>
                        <select className="input" id="genre" value={genre}
                            onChange={(e) => setGenre(e.target.value)} required style={{ marginBottom: 16 }}>
                            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>

                        <label className="field-label" htmlFor="picture">{isOrganizer ? "Event-Bild" : "Bild"}</label>
                        <input id="picture" type="file" accept="image/*"
                            onChange={(e) => setEventPicture(e.target.files[0])} />

                        <div className="muted" style={{ fontSize: 13, marginTop: 18 }}>
                            {isOrganizer ? "Veranstalter" : "Host"}: <strong style={{ color: "var(--ink)" }}>{organizer || "—"}</strong>
                        </div>
                    </div>

                    <div className="stack" style={{ gap: 22 }}>
                        <div className="card" style={{ padding: 28 }}>
                            <div className="h3" style={{ marginBottom: 18 }}>Kapazität</div>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 800, color: "var(--accent)", textAlign: "center", margin: "8px 0 16px" }}>
                                {maxSlots}
                            </div>
                            <input type="range" min="5" max="500" step="5" value={maxSlots}
                                onChange={(e) => setMaxSlots(Number(e.target.value))}
                                style={{ width: "100%", accentColor: "var(--accent)" }} />
                            <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
                                <span className="muted" style={{ fontSize: 12 }}>5</span>
                                <span className="muted" style={{ fontSize: 12 }}>500 Plätze</span>
                            </div>
                        </div>

                        {/* Typspezifische Angaben – Veranstalter: Ticket-Infos, Student: Treffpunkt/Mitbringliste. */}
                        {isOrganizer ? (
                            <div className="card" style={{ padding: 28 }}>
                                <div className="h3" style={{ marginBottom: 18 }}>Ticket & Zugang</div>

                                <label className="field-label" htmlFor="ticketPreis">Ticketpreis (€)</label>
                                <input className="input" id="ticketPreis" type="number" min="0" step="0.01" value={ticketPreis}
                                    placeholder="0 = kostenlos"
                                    onChange={(e) => setTicketPreis(e.target.value)} style={{ marginBottom: 16 }} />

                                <label className="field-label" htmlFor="mindestalter">Mindestalter</label>
                                <input className="input" id="mindestalter" type="number" min="0" max="99" value={mindestalter}
                                    placeholder="z. B. 18"
                                    onChange={(e) => setMindestalter(e.target.value)} style={{ marginBottom: 16 }} />

                                <label className="field-label" htmlFor="ticketLink">Ticket-Link</label>
                                <input className="input" id="ticketLink" type="url" value={ticketLink}
                                    placeholder="https://…"
                                    onChange={(e) => setTicketLink(e.target.value)} />
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 28 }}>
                                <div className="h3" style={{ marginBottom: 18 }}>Treffpunkt & Mitbringliste</div>

                                <label className="field-label" htmlFor="treffpunktHinweis">Treffpunkt-Hinweis</label>
                                <input className="input" id="treffpunktHinweis" type="text" value={treffpunktHinweis}
                                    placeholder="z. B. Vor dem Haupteingang"
                                    onChange={(e) => setTreffpunktHinweis(e.target.value)} style={{ marginBottom: 16 }} />

                                <label className="field-label" htmlFor="mitbringliste">Mitbringliste</label>
                                <textarea className="input" id="mitbringliste" rows={3} value={mitbringliste}
                                    placeholder="z. B. Snacks, Getränke, gute Laune"
                                    onChange={(e) => setMitbringliste(e.target.value)} style={{ resize: "vertical" }} />
                            </div>
                        )}

                        <div className="card" style={{ padding: 28 }}>
                            {error && <p style={{ color: "var(--pop-pink)", fontSize: 13, marginBottom: 16 }}>{error}</p>}
                            <button type="submit" className="btn primary" disabled={isSubmitting}
                                style={{ width: "100%", justifyContent: "center", padding: "14px" }}>
                                🚀 {isSubmitting ? "Wird veröffentlicht…" : "Jetzt veröffentlichen"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateEvent;
