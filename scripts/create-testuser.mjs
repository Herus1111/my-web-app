#!/usr/bin/env node
// Legt die Test-Daten fuer die Abgabe an:
//   - 2 Veranstalter mit je 25 Events (50 insgesamt: 6 vergangene, 44 kommende)
//   - 5 Studierende: Zeppenfeld, Sachweh, Hirsch (unsere Professoren) + 2 Platzhalter
//   - fuer die Professoren-Accounts einen gewachsenen Event-Graph mit 3 besuchten
//     Events in der Vergangenheit und einer Anmeldung fuer ein kommendes Event
//   - Bewertungen zu den vergangenen Events EINES Veranstalters (Clara Berg), damit
//     ihr Dashboard nicht leer ist. Zeppenfeld gibt dabei bewusst kein Feedback ab -
//     das soll in der Praesentation live passieren (siehe OHNE_FEEDBACK).
//
// Aufruf (Backend muss laufen, siehe README):
//   node scripts/create-testuser.mjs
//
// Optionen:
//   GROWDENT_API=http://localhost:8080/growdent   Basis-URL des Backends
//   GROWDENT_TEST_PASSWORD=meinPasswort           Passwort fuer alle Test-Accounts
//   GROWDENT_PRAESENTATION=2026-07-29             Tag der Praesentation (Bezugspunkt aller Termine)
//
// Das Script ist wiederholbar: vorhandene Accounts (HTTP 409), Events (Name + organizer)
// und Anmeldungen werden erkannt und nicht doppelt angelegt.
//
// ---------------------------------------------------------------------------
// Warum die Reihenfolge im Script wichtig ist (Event-Graph):
// Der RecommendationService zieht Vorschlaege ausschliesslich aus den Events, die noch
// NICHT im Baum des Studierenden stehen (RecommendationService.eventsNotJoinedBy) - und
// zwar zufaellig. Wir koennen die Vorschlaege also nicht direkt auswaehlen, aber wir
// koennen steuern, welche Events zum jeweiligen Zeitpunkt ueberhaupt existieren.
// Deshalb legt das Script die Events in vier Phasen an und ruft dazwischen den Graph auf:
//
//   1. Phase "vergangen1" (2 Events) -> GET /EventGraph/{id} erzeugt die Wurzel mit
//      genau diesen 2 Events als Startvorschlaege (mehr gibt es noch nicht).
//   2. Professor nimmt an einem davon teil -> Phase "vergangen2" (2 Events) anlegen ->
//      GET /EventGraph markiert den Knoten als besucht und haengt die 2 neuen Events
//      als Nachfolger an.
//   3. Dasselbe nochmal mit Phase "vergangen3".
//   4. Zum Schluss die kommenden Events -> der letzte besuchte Knoten bekommt zwei
//      kommende Events als offene Vorschlaege.
//
// Wichtig dabei: pro Graph-Aufruf darf nur EIN Knoten neu auf "besucht" springen.
// baumAktuallisieren aktualisiert eventsInTree erst am Ende der Methode, zwei
// gleichzeitig besuchte Knoten wuerden sich daher dieselben Nachfolger ziehen.
// ---------------------------------------------------------------------------

const API = (process.env.GROWDENT_API || 'http://localhost:8080/growdent').replace(/\/$/, '');
const PASSWORD = process.env.GROWDENT_TEST_PASSWORD || 'growdent2026';
const PRAESENTATION = process.env.GROWDENT_PRAESENTATION || '2026-07-29';

// Die Vornamen unserer Professoren kennen wir nicht - statt zu raten benutzen wir "Prof."
// als Vornamen. In der App steht dann z.B. "Prof. Sachweh", was fuer die Anzeige passt.
// Sobald die echten Vornamen bekannt sind, hier einfach ersetzen.
const PROF_FIRST_NAME = 'Prof.';

// Alle Termine liegen relativ zum Praesentationstag, negative Werte in der Vergangenheit.
function praesentationsTag() {
    const [jahr, monat, tag] = PRAESENTATION.split('-').map(Number);
    return new Date(jahr, monat - 1, tag);
}

function terminAm(tage, stunde, minute = 0) {
    const d = praesentationsTag();
    d.setDate(d.getDate() + tage);
    d.setHours(stunde, minute, 0, 0);
    const p = (n) => String(n).padStart(2, '0');
    // LocalDateTime-Format ohne Zeitzone, so wie das Backend es erwartet.
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

// Genres exakt wie im Frontend (CreateEvent.js), damit Filter und Empfehlungen greifen.
// Phasen: vergangen1/2/3 werden nacheinander angelegt (siehe Kommentar oben),
// zukunft kommt zuletzt. Die "tage"-Werte der vergangenen Events liegen weit genug
// zurueck, dass sie auch heute schon vorbei sind - nicht nur am Praesentationstag.

const veranstalter = [
    {
        firstName: 'Clara',
        lastName: 'Berg',
        username: 'clara.berg',
        email: 'clara.berg@growdent.test',
        password: PASSWORD,
        statistics: ['25 Events geplant', '340 Teilnehmer erreicht'],
        budget: 7500,
        verifiziert: true,
        note: 'Veranstalter (verifiziert)',
        // Nur die drei Events, die die Graph-Choreografie steuern. Alles weitere
        // steht unten in weitereEvents.
        events: [
            { phase: 'vergangen1', name: 'Semester Opening Party', venue: 'Campus Halle Dortmund', tage: -38, stunde: 20, maxSlots: 120, genre: 'Party', ticketPreis: 12.5, mindestalter: 18, ticketLink: 'https://tickets.growdent.test/semester-opening' },
            { phase: 'vergangen2', name: 'Poetry Slam Night', venue: 'Kulturcafe Nord', tage: -24, stunde: 19, maxSlots: 60, genre: 'Kultur', ticketPreis: 8, mindestalter: 16, ticketLink: 'https://tickets.growdent.test/poetry-slam' },
            { phase: 'vergangen3', name: 'Street Food Festival', venue: 'Hafenpromenade', tage: -12, stunde: 17, maxSlots: 200, genre: 'Essen', ticketPreis: 5, mindestalter: 0, ticketLink: 'https://tickets.growdent.test/street-food' },
        ],
    },
    {
        firstName: 'Jonas',
        lastName: 'Reuter',
        username: 'jonas.reuter',
        email: 'jonas.reuter@growdent.test',
        password: PASSWORD,
        statistics: ['25 Events geplant', '150 Teilnehmer erreicht'],
        budget: 3000,
        verifiziert: false,
        note: 'Veranstalter (nicht verifiziert)',
        events: [
            { phase: 'vergangen1', name: 'Retro Gaming Turnier', venue: 'Game Corner', tage: -31, stunde: 18, maxSlots: 40, genre: 'Gaming', ticketPreis: 6, mindestalter: 12, ticketLink: 'https://tickets.growdent.test/retro-gaming' },
            { phase: 'vergangen2', name: 'Beachvolleyball Cup', venue: 'Sportpark Sued', tage: -17, stunde: 15, maxSlots: 48, genre: 'Sport', ticketPreis: 4, mindestalter: 0, ticketLink: 'https://tickets.growdent.test/beachvolleyball' },
            { phase: 'vergangen3', name: 'Grillabend am Campus', venue: 'Campus Wiese', tage: -8, stunde: 18, maxSlots: 55, genre: 'Essen', ticketPreis: 3, mindestalter: 0, ticketLink: null },
        ],
    },
];

// Die restlichen 44 Events kompakt, damit die Datei lesbar bleibt:
// [tage, stunde, Name, Ort, Genre, Plaetze, Ticketpreis, Mindestalter]
// tage bezieht sich auf den Praesentationstag.
//
// Hier stehen NUR kommende Events. Vergangene Events gehoeren nach oben in die
// events-Liste des Veranstalters: es sind genau die sechs, die den Event-Graph
// steuern, und mehr sollen es nicht werden. Ein negativer tage-Wert hier wuerde
// waehrend der Choreografie als Nachfolger-Kandidat mitgezogen und den Pfad der
// Professoren unvorhersagbar machen.
//
// Die Termine liegen dicht gestaffelt (+1 bis +80 Tage): nach jedem Beitritt
// braucht getSuccessors zwei Events, die NACH dem beigetretenen liegen.
const weitereEvents = {
    'clara.berg': [
        [2, 19, 'Indie Konzert im Sound Loft', 'Sound Loft', 'Musik', 80, 15, 16],
        [4, 18, 'Rooftop Sunset Session', 'Rooftop Bar 8', 'Party', 70, 11, 18],
        [6, 20, 'Salsa Abend', 'Tanzstudio Rhythmo', 'Musik', 60, 8, 18],
        [9, 22, 'Techno Session', 'Club Nova', 'Party', 150, 18, 18],
        [11, 18, 'Poetry Slam Sommeredition', 'Kulturcafe Nord', 'Kultur', 65, 8, 16],
        [12, 20, 'Kneipenquiz', 'Kulturcafe Nord', 'Sonstiges', 50, 3, 18],
        [14, 21, 'Silent Disco', 'Club Nova', 'Party', 140, 13, 18],
        [16, 18, 'Museumsnacht Spezial', 'Museum Ostwall', 'Kultur', 90, 10, 0],
        [19, 17, 'Foodtruck Sonntag', 'Westpark', 'Essen', 180, 4, 0],
        [21, 19, 'Kulturnacht Nordstadt', 'Nordstadt Galerien', 'Kultur', 110, 7, 0],
        [23, 18, 'Sommerkonzert im Park', 'Westpark Buehne', 'Musik', 160, 12, 0],
        [25, 19, 'Improtheater Nacht', 'Theater im Depot', 'Kultur', 95, 11, 12],
        [28, 22, 'House Session', 'Club Nova', 'Party', 150, 16, 18],
        [30, 21, 'Open Air Kino', 'Westpark Buehne', 'Sonstiges', 180, 9, 12],
        [34, 18, 'Brunch am Kanal', 'Kanalufer Cafe', 'Essen', 55, 14, 0],
        [36, 19, 'Tapas Abend', 'Weinkeller Nord', 'Essen', 45, 16, 18],
        [39, 20, 'Unplugged Konzert', 'Sound Loft', 'Musik', 85, 12, 16],
        [45, 16, 'Herbstfest im Park', 'Westpark', 'Essen', 160, 6, 0],
        [48, 19, 'Fotografie Ausstellung', 'Museum Ostwall', 'Kultur', 100, 6, 0],
        [56, 21, 'Semesterendparty', 'Campus Halle Dortmund', 'Party', 220, 14, 18],
        [60, 20, 'Herbst Clubnacht', 'Club Nova', 'Party', 160, 15, 18],
        [70, 18, 'Winterlichter Markt', 'Hafenpromenade', 'Sonstiges', 190, 0, 0],
    ],
    'jonas.reuter': [
        [1, 14, 'Sporttag am Campus', 'Sportpark Sued', 'Sport', 90, 0, 0],
        [3, 17, 'Volleyball Feierabendrunde', 'Sporthalle Nord', 'Sport', 36, 0, 0],
        [5, 16, 'LAN Party XL', 'Innovation Hub', 'Gaming', 64, 14, 16],
        [7, 18, 'Brettspielabend', 'Uni Lounge', 'Gaming', 36, 2, 0],
        [8, 19, 'Pokerabend', 'Uni Lounge', 'Gaming', 40, 5, 18],
        [10, 14, 'Bewerbungstraining', 'Career Center', 'Lernen', 25, 0, 0],
        [13, 10, 'Study Bootcamp Klausurphase', 'Bibliothek Raum 2', 'Lernen', 30, 0, 0],
        [15, 16, 'Lauftreff am Kanal', 'Kanalufer', 'Sport', 50, 0, 0],
        [18, 18, 'Mario Kart Turnier', 'Game Corner', 'Gaming', 32, 4, 0],
        [20, 17, 'Tischtennis Turnier', 'Sporthalle Nord', 'Sport', 32, 2, 0],
        [23, 20, 'Karaoke Abend', 'Bar Central', 'Musik', 70, 5, 18],
        [26, 10, 'Statistik Crashkurs', 'Hoersaal 4', 'Lernen', 60, 0, 0],
        [29, 18, 'Escape Room Challenge', 'Game Corner', 'Gaming', 24, 18, 12],
        [32, 15, 'Basketball Streetcup', 'Streetcourt Hoerde', 'Sport', 48, 0, 0],
        [37, 14, 'Lerngruppe Statistik', 'Bibliothek Raum 4', 'Lernen', 24, 0, 0],
        [41, 18, 'Retro LAN Reloaded', 'Innovation Hub', 'Gaming', 64, 12, 16],
        [44, 10, 'Java Workshop', 'Lab 3', 'Lernen', 40, 0, 0],
        [50, 11, 'Study Sunday', 'Bibliothek Raum 4', 'Lernen', 30, 0, 0],
        [52, 11, 'Hochschulmesse', 'Messehalle 2', 'Sonstiges', 250, 0, 0],
        [63, 19, 'Dart Liga Abend', 'Bar Central', 'Sonstiges', 44, 3, 18],
        [74, 15, 'Hallenfussball Cup', 'Sporthalle Nord', 'Sport', 60, 0, 0],
        [80, 14, 'Wintersport Infotag', 'Messehalle 2', 'Sport', 120, 0, 0],
    ],
};

// Kostenlose Events bekommen keinen Ticket-Link, alle anderen einen aus dem Namen.
function ticketLinkFuer(name, preis) {
    if (preis === 0) return null;
    const slug = name
        .toLowerCase()
        .replace(/ae/g, 'a')
        .replace(/oe/g, 'o')
        .replace(/ue/g, 'u')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `https://tickets.growdent.test/${slug}`;
}

// Tabelle in die events-Liste des jeweiligen Veranstalters einhaengen.
for (const v of veranstalter) {
    for (const [tage, stunde, name, venue, genre, maxSlots, ticketPreis, mindestalter] of weitereEvents[v.username]) {
        v.events.push({
            phase: 'zukunft',
            name,
            venue,
            tage,
            stunde,
            maxSlots,
            genre,
            ticketPreis,
            mindestalter,
            ticketLink: ticketLinkFuer(name, ticketPreis),
        });
    }
}

// eventsInTree: [] muss mitgeschickt werden, sonst bleibt das Feld null und der
// RecommendationService laeuft beim ersten Aufbau des Event-Graphen auf eine NPE.
const studentBasis = { level: 1, status: 'Aktiv', attendedEvents: [], eventsInTree: [] };

const studierende = [
    {
        ...studentBasis,
        firstName: PROF_FIRST_NAME,
        lastName: 'Zeppenfeld',
        username: 'zeppenfeld',
        email: 'zeppenfeld@growdent.test',
        password: PASSWORD,
        statistics: ['Test-Account fuer die Abgabe'],
        level: 3,
        mitVergangenheit: true,
        note: 'Professor Zeppenfeld',
    },
    {
        ...studentBasis,
        firstName: PROF_FIRST_NAME,
        lastName: 'Sachweh',
        username: 'sachweh',
        email: 'sachweh@growdent.test',
        password: PASSWORD,
        statistics: ['Test-Account fuer die Abgabe'],
        level: 3,
        mitVergangenheit: true,
        note: 'Professorin Sachweh',
    },
    {
        ...studentBasis,
        firstName: PROF_FIRST_NAME,
        lastName: 'Hirsch',
        username: 'hirsch',
        email: 'hirsch@growdent.test',
        password: PASSWORD,
        statistics: ['Test-Account fuer die Abgabe'],
        level: 3,
        mitVergangenheit: true,
        note: 'Professor Hirsch',
    },
    {
        ...studentBasis,
        firstName: 'Max',
        lastName: 'Mustermann',
        username: 'max.mustermann',
        email: 'max.mustermann@growdent.test',
        password: PASSWORD,
        statistics: ['Platzhalter-Account'],
        level: 2,
        mitVergangenheit: false,
        note: 'Platzhalter fuer uns (frischer Baum)',
    },
    {
        ...studentBasis,
        firstName: 'Erika',
        lastName: 'Mustermann',
        username: 'erika.mustermann',
        email: 'erika.mustermann@growdent.test',
        password: PASSWORD,
        statistics: ['Platzhalter-Account'],
        level: 1,
        mitVergangenheit: false,
        note: 'Platzhalter fuer uns (frischer Baum)',
    },
];

// ------------------------------------------------------------------- Bewertungen
//
// Bewertet wird nur EIN Veranstalter, damit im Vergleich sichtbar ist, wie das
// Dashboard mit und ohne Rueckmeldungen aussieht: Clara Berg hat Bewertungen,
// Jonas Reuter nicht.
const BEWERTETER_VERANSTALTER = 'clara.berg';

// Diese Accounts geben KEIN Test-Feedback ab. Zeppenfeld bleibt frei, damit er in der
// Praesentation selbst eine Bewertung abschicken kann - sie taucht dann sofort unter
// "Bewertungen" bei Clara Berg auf (EventBewertungen.js laedt alle 3 Sekunden neu).
// Seine drei besuchten Events aus der Graph-Choreografie reichen dafuer aus: das
// Feedback-Formular haengt im Frontend nur an "Teilnehmer + Termin vorbei".
const OHNE_FEEDBACK = ['zeppenfeld'];

// Pro vergangenem Event von BEWERTETER_VERANSTALTER eine Liste von Rueckmeldungen.
// Sie werden der Reihe nach auf die zugelassenen Studierenden verteilt (erste
// Rueckmeldung an den ersten Account usw.) - so steht die "ausser Zeppenfeld"-Regel
// nur an einer Stelle und die Texte haengen nicht an konkreten Namen.
// Achtung: recommendation > 6 traegt das Genre des Events als "likedGenre" beim
// Studierenden ein (FeedbackService.persistLikedGenreIfPositive) und beeinflusst damit
// die Vorschlaege im Event-Graph. Deshalb bewusst auch schwaechere Bewertungen dabei.
const bewertungen = {
    'Semester Opening Party': [
        { eventrating: 5, socializingRating: 5, recommendation: 10, userLiked: 'Riesige Halle, gutes Line-up und man kam sofort mit anderen ins Gespraech.', userDisliked: 'An der Garderobe hat es nach dem Einlass ewig gedauert.' },
        { eventrating: 4, socializingRating: 5, recommendation: 9, userLiked: 'Perfekter Semesterstart, ich habe den halben Kurs wiedergetroffen.', userDisliked: 'Ab 23 Uhr war es an der Bar zu voll.' },
        { eventrating: 4, socializingRating: 3, recommendation: 8, userLiked: 'Fairer Ticketpreis fuer das, was geboten wurde.', userDisliked: 'Die Musik war stellenweise so laut, dass Gespraeche kaum gingen.' },
        { eventrating: 5, socializingRating: 4, recommendation: 9, userLiked: 'Stimmung war von der ersten Minute an da, Einlass ging schnell.', userDisliked: '' },
    ],
    'Poetry Slam Night': [
        { eventrating: 5, socializingRating: 4, recommendation: 9, userLiked: 'Starke Texte und eine sehr warme Atmosphaere im Kulturcafe.', userDisliked: 'Zu wenig Sitzplaetze, hinten musste man stehen.' },
        { eventrating: 4, socializingRating: 4, recommendation: 8, userLiked: 'Gute Mischung aus bekannten Slammern und Newcomern.', userDisliked: 'Die Pause zwischen den Runden war unnoetig lang.' },
        { eventrating: 3, socializingRating: 3, recommendation: 6, userLiked: 'Nette Location, fusslaeufig von der Hochschule.', userDisliked: 'In den hinteren Reihen war der Ton schlecht zu verstehen.' },
        { eventrating: 5, socializingRating: 5, recommendation: 10, userLiked: 'Bester Abend seit langem, danach war die halbe Gruppe noch essen.', userDisliked: '' },
    ],
    'Street Food Festival': [
        { eventrating: 4, socializingRating: 5, recommendation: 9, userLiked: 'An den langen Tischen kommt man automatisch mit Fremden ins Gespraech.', userDisliked: 'Vor den beliebten Trucks standen wir 20 Minuten an.' },
        { eventrating: 5, socializingRating: 4, recommendation: 9, userLiked: 'Tolle Lage an der Hafenpromenade und guenstiger Eintritt.', userDisliked: 'Im Schatten gab es viel zu wenig Sitzgelegenheiten.' },
        { eventrating: 4, socializingRating: 4, recommendation: 8, userLiked: 'Das vegetarische Angebot war ueberraschend gross.', userDisliked: 'Kartenzahlung hat an zwei Staenden nicht funktioniert.' },
        { eventrating: 3, socializingRating: 4, recommendation: 7, userLiked: 'Entspannter Nachmittag mit guter Musik im Hintergrund.', userDisliked: 'Die Getraenkepreise waren fuer ein Campus-Publikum zu hoch.' },
    ],
};

// ---------------------------------------------------------------- HTTP-Helfer

const eventsById = new Map(); // id -> Event (fuer Datums-Checks und Ausgabe)

function jsonRequest(pfad, methode, body) {
    return fetch(`${API}${pfad}`, {
        method: methode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

async function backendErreichbar() {
    try {
        return (await fetch(`${API}/users`)).ok;
    } catch {
        return false;
    }
}

// Legt einen User an. Rueckgabe: 'angelegt' | 'existiert' | 'fehler'
async function userAnlegen(pfad, payload) {
    let response;
    try {
        response = await jsonRequest(`/users/${pfad}`, 'POST', payload);
    } catch (e) {
        return { status: 'fehler', meldung: e.message };
    }
    if (response.status === 201) return { status: 'angelegt' };
    if (response.status === 409) {
        // Email oder Benutzername schon vergeben -> Account gab es bereits.
        return { status: 'existiert', meldung: (await response.text()).trim() };
    }
    return { status: 'fehler', meldung: `HTTP ${response.status}: ${(await response.text()).trim()}` };
}

// Prueft den Login und liefert die User-ID, die wir fuer Events und Graph brauchen.
async function loginPruefen(email, password) {
    try {
        const response = await jsonRequest('/users/login', 'POST', { email, password });
        if (!response.ok) return { ok: false, meldung: (await response.text()).trim() };
        const user = await response.json();
        return { ok: true, id: user.id, typ: user.type };
    } catch (e) {
        return { ok: false, meldung: e.message };
    }
}

async function alleEvents() {
    try {
        const response = await fetch(`${API}/events`);
        return response.ok ? await response.json() : [];
    } catch {
        return [];
    }
}

// Legt ein Event an. organizer = username, weil das Veranstalter-Dashboard
// genau darauf filtert (VeranstalterDashboard.js).
async function eventAnlegen(creatorId, organizer, event) {
    const payload = {
        name: event.name,
        venue: event.venue,
        eventdate: terminAm(event.tage, event.stunde, event.minute),
        organizer,
        maxSlots: event.maxSlots,
        genre: event.genre,
        ticketPreis: event.ticketPreis ?? null,
        mindestalter: event.mindestalter ?? null,
        ticketLink: event.ticketLink ?? null,
        // nur fuer MiniEvents relevant
        treffpunktHinweis: null,
        mitbringliste: null,
    };
    try {
        const response = await jsonRequest(`/events/user/${creatorId}`, 'POST', payload);
        if (!response.ok) {
            return { ok: false, meldung: `HTTP ${response.status}: ${(await response.text()).trim()}` };
        }
        const gespeichert = await response.json();
        eventsById.set(gespeichert.id, gespeichert);
        return { ok: true, event: gespeichert };
    } catch (e) {
        return { ok: false, meldung: e.message };
    }
}

async function istTeilnehmer(eventId, userId) {
    try {
        const response = await fetch(`${API}/events/${eventId}/participantIds`);
        if (!response.ok) return false;
        return (await response.json()).includes(userId);
    } catch {
        return false;
    }
}

// Meldet den Studierenden zum Event an. Das Backend schreibt dabei auch
// attendedEvents fort - daraus erkennt der Baum spaeter den besuchten Knoten.
async function teilnehmen(eventId, userId) {
    if (await istTeilnehmer(eventId, userId)) return { status: 'bereits' };
    try {
        const response = await fetch(`${API}/events/${eventId}/addUser/${userId}`, { method: 'POST' });
        if (response.ok) return { status: 'neu' };
        return { status: 'fehler', meldung: `HTTP ${response.status}: ${(await response.text()).trim()}` };
    } catch (e) {
        return { status: 'fehler', meldung: e.message };
    }
}

async function alleFeedbacks() {
    try {
        const response = await fetch(`${API}/feedback`);
        return response.ok ? await response.json() : [];
    } catch {
        return [];
    }
}

// Legt eine Bewertung an. Das Backend prueft nicht, ob der Absender wirklich
// teilgenommen hat - wir melden vorher trotzdem an, damit die Daten zu dem passen,
// was das Frontend erlaubt (Feedback-Button nur fuer Teilnehmer vergangener Events).
async function feedbackAnlegen(feedback) {
    try {
        const response = await jsonRequest('/feedback', 'POST', feedback);
        if (!response.ok) {
            return { ok: false, meldung: `HTTP ${response.status}: ${(await response.text()).trim()}` };
        }
        return { ok: true };
    } catch (e) {
        return { ok: false, meldung: e.message };
    }
}

// Baut den Event-Graph auf bzw. aktualisiert ihn und gibt die NodeDTO-Liste zurueck.
async function graphHolen(studentId) {
    try {
        const response = await fetch(`${API}/EventGraph/${studentId}`);
        if (!response.ok) return { ok: false, meldung: `HTTP ${response.status}: ${(await response.text()).trim()}` };
        return { ok: true, knoten: await response.json() };
    } catch (e) {
        return { ok: false, meldung: e.message };
    }
}

// Notfall-Weg, falls sich der Baum nicht ueber die Reihenfolge steuern liess:
// haengt ein bestimmtes Event als Einladung an ein Blatt des Baums.
async function einladen(studentId, eventId) {
    try {
        const response = await fetch(`${API}/EventGraph/inviteUser/${studentId}/toEvent/${eventId}`, { method: 'POST' });
        if (!response.ok) return { ok: false, meldung: `HTTP ${response.status}: ${(await response.text()).trim()}` };
        return { ok: true };
    } catch (e) {
        return { ok: false, meldung: e.message };
    }
}

// ---------------------------------------------------------------- Graph-Helfer

// Feldnamen exakt wie im NodeDTO des Backends: nodeId, eventId, parentId, visited,
// connectionType, isRoot. Frueher standen hier "wurdeBesucht" und "verbindungsart" -
// beides gibt es im JSON nicht, die Abfragen waren also immer undefined.
const EINGELADEN = 'INVITED';

const wurzel = (knoten) => knoten.find((n) => n.isRoot) || knoten.find((n) => n.parentId == null);

// Naechster Knoten auf dem Pfad. Bereits besuchte Kinder werden bevorzugt, damit
// ein zweiter Lauf denselben Pfad nimmt und den Baum nicht weiter aufblaeht.
function naechsterKnoten(knoten, elternNodeId) {
    const kinder = knoten.filter((n) => n.parentId === elternNodeId && n.connectionType !== EINGELADEN);
    if (kinder.length === 0) return null;
    return kinder.find((k) => k.visited) || kinder[0];
}

const istVergangen = (event) => event != null && new Date(event.eventdate).getTime() < Date.now();
const eventName = (id) => eventsById.get(id)?.name ?? `Event ${id}`;

// Blaetter, an die eine Einladung angehaengt werden kann (BaumManagerService.addInvitation
// sortiert Knoten mit Kindern und eingeladene Knoten aus). Achtung: ist diese Liste leer,
// laeuft addInvitation im Backend in random.nextInt(0) und wirft - deshalb vorher pruefen.
const freieBlaetter = (knoten) =>
    knoten.filter(
        (n) => n.connectionType !== EINGELADEN && !knoten.some((k) => k.parentId === n.nodeId)
    );

// Knoten, denen man in der Praesentation wirklich beitreten kann: kommender Termin und
// keine Einladung. Nur solche Knoten lassen den Baum weiterwachsen - markVisitedNodes
// ueberspringt Knoten mit der Verbindungsart INVITED und haengt ihnen keine Nachfolger an.
const beitretbareKnoten = (knoten) =>
    (knoten || [])
        .filter((n) => n.eventId != null && n.eventId > 0 && n.connectionType !== EINGELADEN)
        .filter((n) => {
            const event = eventsById.get(n.eventId);
            return event != null && !istVergangen(event);
        });

// ---------------------------------------------------------------- Ausgabe

function tabelleAusgeben(kopf, zeilen) {
    if (zeilen.length === 0) return;
    const daten = [kopf, ...zeilen];
    const breiten = kopf.map((_, i) => Math.max(...daten.map((z) => String(z[i]).length)));
    const linie = '+' + breiten.map((b) => '-'.repeat(b + 2)).join('+') + '+';
    const zeile = (werte) => '| ' + werte.map((w, i) => String(w).padEnd(breiten[i])).join(' | ') + ' |';

    console.log(linie);
    console.log(zeile(kopf));
    console.log(linie);
    zeilen.forEach((z) => console.log(zeile(z)));
    console.log(linie);
}

// ---------------------------------------------------------------- Ablauf

async function main() {
    console.log(`\nGrowDent Test-Daten anlegen  (Backend: ${API})`);
    console.log(`Praesentationstag: ${PRAESENTATION} - alle Termine liegen relativ dazu\n`);

    if (!(await backendErreichbar())) {
        console.error(`Backend unter ${API} nicht erreichbar.`);
        console.error('Bitte zuerst "docker compose up --build" im Projekt-Root starten.');
        process.exit(1);
    }

    let fehler = 0;
    const zugangsdaten = [];

    // Bereits vorhandene Events einlesen (fuer Dedupe + Datums-Checks).
    const vorhandene = await alleEvents();
    vorhandene.forEach((e) => eventsById.set(e.id, e));
    const bekannteEvents = new Set(vorhandene.map((e) => `${e.organizer}::${e.name}`));

    const unsereOrganizer = new Set(veranstalter.map((v) => v.username));
    const fremdeEvents = vorhandene.filter((e) => !unsereOrganizer.has(e.organizer));
    if (fremdeEvents.length > 0) {
        console.log(`Hinweis: In der Datenbank liegen schon ${fremdeEvents.length} fremde Events`);
        console.log('(z.B. aus testdaten.http). Die Startvorschlaege im Graph sind dann nicht mehr');
        console.log('exakt steuerbar - das Script weicht in diesem Fall auf Einladungen aus.\n');
    }

    // Legt einen User an, prueft den Login, merkt sich die Zeile fuer die Tabelle.
    async function bereitstellen(user, pfad, rolle) {
        const { note, events, mitVergangenheit, ...payload } = user;
        const name = `${user.firstName} ${user.lastName}`;
        const ergebnis = await userAnlegen(pfad, payload);

        if (ergebnis.status === 'fehler') {
            fehler++;
            console.log(`  [FEHLER]     ${rolle.padEnd(12)} ${name} - ${ergebnis.meldung}`);
            zugangsdaten.push([rolle, name, user.email, user.password, 'FEHLER', note]);
            return null;
        }

        const marke = ergebnis.status === 'angelegt' ? '[NEU]       ' : '[VORHANDEN] ';
        console.log(`  ${marke} ${rolle.padEnd(12)} ${name}`);

        const login = await loginPruefen(user.email, user.password);
        if (!login.ok) {
            fehler++;
            const grund =
                ergebnis.status === 'existiert'
                    ? `Account existiert bereits mit anderem Passwort (${login.meldung})`
                    : login.meldung;
            console.log(`                -> Login fehlgeschlagen: ${grund}`);
        }
        zugangsdaten.push([
            rolle,
            name,
            user.email,
            user.password,
            login.ok ? `OK (ID ${login.id})` : 'FEHLGESCHLAGEN',
            note,
        ]);
        return login.ok ? login.id : null;
    }

    // 1. Veranstalter (brauchen wir zuerst, Events haengen an ihrer ID)
    console.log('Veranstalter:');
    for (const v of veranstalter) {
        v.id = await bereitstellen(v, 'veranstalter', 'Veranstalter');
    }

    // 2. Studierende - hier nur die Professoren-Accounts. Die Platzhalter kommen erst
    // in Schritt 7 dazu, wenn alle Events existieren: ihre Startvorschlaege haengen
    // davon ab, was zum Zeitpunkt des ersten Graph-Aufrufs in der Datenbank steht.
    console.log('\nStudierende (Professoren-Accounts):');
    for (const s of studierende.filter((x) => x.mitVergangenheit)) {
        s.id = await bereitstellen(s, 'student', 'Studierend');
    }

    // Legt alle Events einer Phase an (ueber beide Veranstalter hinweg).
    async function phaseAnlegen(phase) {
        let neu = 0;
        let vorhandenCount = 0;
        for (const v of veranstalter) {
            if (v.id == null) continue;
            for (const event of v.events.filter((e) => e.phase === phase)) {
                if (bekannteEvents.has(`${v.username}::${event.name}`)) {
                    vorhandenCount++;
                    v.angelegt = (v.angelegt || 0);
                    v.vorhanden = (v.vorhanden || 0) + 1;
                    continue;
                }
                const ergebnis = await eventAnlegen(v.id, v.username, event);
                if (ergebnis.ok) {
                    neu++;
                    v.angelegt = (v.angelegt || 0) + 1;
                    bekannteEvents.add(`${v.username}::${event.name}`);
                } else {
                    fehler++;
                    console.log(`  [FEHLER] Event "${event.name}" - ${ergebnis.meldung}`);
                }
            }
        }
        // Ids der bereits vorhandenen Events brauchen wir auch -> Liste neu einlesen.
        (await alleEvents()).forEach((e) => eventsById.set(e.id, e));
        console.log(`  Phase ${phase.padEnd(11)} ${neu} neu, ${vorhandenCount} bereits vorhanden`);
    }

    // 3. Erste Runde vergangener Events -> sie werden zu den Startvorschlaegen
    console.log('\nEvents anlegen:');
    await phaseAnlegen('vergangen1');

    // 4. Graph der Professoren-Accounts aufbauen und wachsen lassen
    const profis = studierende.filter((s) => s.mitVergangenheit && s.id != null);
    console.log('\nEvent-Graph der Professoren-Accounts aufbauen:');

    for (const p of profis) {
        p.besucht = [];
        p.angemeldet = [];
        const ergebnis = await graphHolen(p.id);
        if (!ergebnis.ok) {
            fehler++;
            console.log(`  [FEHLER] ${p.lastName}: Graph konnte nicht erzeugt werden - ${ergebnis.meldung}`);
            p.graph = null;
            continue;
        }
        p.graph = ergebnis.knoten;
        p.knotenId = wurzel(p.graph)?.nodeId ?? null;
        console.log(`  [OK]     ${p.lastName}: Wurzel + ${p.graph.length - 1} Vorschlaege`);
    }

    // Drei Runden: teilnehmen -> naechste Event-Phase anlegen -> Graph aktualisieren.
    // Der besuchte Knoten bekommt dabei genau die Events der neuen Phase als Nachfolger.
    const runden = [
        { nachher: 'vergangen2', nummer: 1 },
        { nachher: 'vergangen3', nummer: 2 },
        { nachher: 'zukunft', nummer: 3 },
    ];

    for (const runde of runden) {
        console.log(`\nRunde ${runde.nummer} - Teilnahme an vergangenem Event:`);

        for (const p of profis) {
            if (!p.graph || p.knotenId == null) continue;

            const ziel = naechsterKnoten(p.graph, p.knotenId);
            if (ziel == null) {
                console.log(`  [HINWEIS] ${p.lastName}: keine Nachfolger im Baum - Runde uebersprungen`);
                p.steuerungFehlgeschlagen = true;
                continue;
            }

            const event = eventsById.get(ziel.eventId);
            if (!istVergangen(event)) {
                // Passiert, wenn in der DB schon fremde (kommende) Events lagen.
                console.log(`  [HINWEIS] ${p.lastName}: Vorschlag "${eventName(ziel.eventId)}" liegt nicht in der Vergangenheit`);
                p.steuerungFehlgeschlagen = true;
                continue;
            }

            const ergebnis = await teilnehmen(ziel.eventId, p.id);
            if (ergebnis.status === 'fehler') {
                fehler++;
                console.log(`  [FEHLER]  ${p.lastName}: Anmeldung zu "${event.name}" - ${ergebnis.meldung}`);
                continue;
            }
            p.besucht.push(event.name);
            p.zielKnotenId = ziel.nodeId;
            console.log(`  [${ergebnis.status === 'neu' ? 'NEU' : 'OK '}]     ${p.lastName}: "${event.name}" (${event.eventdate.slice(0, 10)})`);
        }

        // Erst jetzt die naechste Phase anlegen - sie bildet den Nachfolger-Pool.
        await phaseAnlegen(runde.nachher);

        for (const p of profis) {
            if (!p.graph || p.zielKnotenId == null) continue;
            const ergebnis = await graphHolen(p.id);
            if (!ergebnis.ok) {
                fehler++;
                console.log(`  [FEHLER]  ${p.lastName}: Graph-Update - ${ergebnis.meldung}`);
                continue;
            }
            p.graph = ergebnis.knoten;
            p.knotenId = p.zielKnotenId; // ab hier weiter unten im Baum
            p.zielKnotenId = null;
        }
    }

    // 5. Notfall-Weg: falls die Steuerung ueber die Reihenfolge nicht geklappt hat,
    // die vergangenen Events per Einladung in den Baum haengen und teilnehmen.
    const vergangeneEigene = veranstalter
        .flatMap((v) => v.events.filter((e) => e.phase.startsWith('vergangen')).map((e) => ({ v, e })))
        .map(({ v, e }) => [...eventsById.values()].find((x) => x.organizer === v.username && x.name === e.name))
        .filter((e) => e != null && istVergangen(e));

    for (const p of profis.filter((x) => x.steuerungFehlgeschlagen && x.graph)) {
        console.log(`\nErsatzweg fuer ${p.lastName} (Einladung + Teilnahme):`);
        for (const event of vergangeneEigene.slice(0, 3)) {
            if (p.besucht.includes(event.name)) continue;
            if (!p.graph.some((n) => n.eventId === event.id)) {
                if (freieBlaetter(p.graph).length === 0) {
                    console.log(`  [HINWEIS] keine freien Blaetter mehr im Baum - "${event.name}" bleibt aussen vor`);
                    break;
                }
                const einladung = await einladen(p.id, event.id);
                if (!einladung.ok) {
                    console.log(`  [FEHLER] Einladung zu "${event.name}" - ${einladung.meldung}`);
                    fehler++;
                    continue;
                }
            }
            const ergebnis = await teilnehmen(event.id, p.id);
            if (ergebnis.status === 'fehler') {
                fehler++;
                console.log(`  [FEHLER] Anmeldung zu "${event.name}" - ${ergebnis.meldung}`);
                continue;
            }
            p.besucht.push(event.name);
            console.log(`  [OK]     "${event.name}" (${event.eventdate.slice(0, 10)})`);
            const aktualisiert = await graphHolen(p.id);
            if (aktualisiert.ok) p.graph = aktualisiert.knoten;
        }
    }

    // 6. Eine Anmeldung fuer ein kommendes Event, damit der Status "angemeldet"
    // (blau im Graph, Chip in der Uebersicht) auch im Test zu sehen ist.
    console.log('\nAnmeldung fuer ein kommendes Event:');
    for (const p of profis) {
        if (!p.graph) continue;

        // Kandidaten: kommende Events aus dem Baum, das fruehste zuerst.
        // Die Sortierung ist wichtig: getSuccessors schlaegt nur Events vor, die NACH
        // dem Elternevent liegen. Bei einem spaeten Event bleiben keine zwei Kandidaten
        // uebrig, der Knoten bliebe ein Blatt ohne Nachfolger.
        const kommendeImBaum = p.graph
            .filter((n) => n.eventId != null && n.eventId > 0)
            .map((n) => eventsById.get(n.eventId))
            .filter((e) => e != null && !istVergangen(e))
            .sort((a, b) => a.eventdate.localeCompare(b.eventdate));

        // Eine bestehende Anmeldung hat Vorrang. Ohne diesen Schritt wuerde ein zweiter
        // Lauf ein weiteres kommendes Event aus dem inzwischen gewachsenen Baum nehmen,
        // dafuer zusaetzlich anmelden und den Baum unnoetig weiter wachsen lassen.
        let ziel = null;
        for (const kandidat of kommendeImBaum) {
            if (await istTeilnehmer(kandidat.id, p.id)) {
                ziel = kandidat;
                break;
            }
        }
        if (ziel == null) ziel = kommendeImBaum[0] ?? null;

        // Nicht im Baum? Dann eins unserer kommenden Events einladen.
        if (ziel == null) {
            ziel = [...eventsById.values()].find(
                (e) => unsereOrganizer.has(e.organizer) && !istVergangen(e)
            );
            if (ziel != null) await einladen(p.id, ziel.id);
        }

        if (ziel == null) {
            console.log(`  [HINWEIS] ${p.lastName}: kein kommendes Event gefunden`);
            continue;
        }

        const ergebnis = await teilnehmen(ziel.id, p.id);
        if (ergebnis.status === 'fehler') {
            fehler++;
            console.log(`  [FEHLER]  ${p.lastName}: "${ziel.name}" - ${ergebnis.meldung}`);
            continue;
        }
        p.angemeldet.push(ziel.name);
        console.log(`  [${ergebnis.status === 'neu' ? 'NEU' : 'OK '}]     ${p.lastName}: "${ziel.name}" (${ziel.eventdate.slice(0, 10)})`);

        const aktualisiert = await graphHolen(p.id);
        if (aktualisiert.ok) p.graph = aktualisiert.knoten;
    }

    // 7. Platzhalter-Accounts: frischer Baum, aber einer, der auch waechst.
    //
    // Warum die Accounts erst jetzt angelegt werden:
    // getStartSuggestions nimmt die sechs FRUEHESTEN Events, die noch nicht im Baum des
    // Studierenden stehen. Bei einem frischen Account sind das genau unsere sechs
    // vergangenen Events - der Baum bestand also nur aus Terminen, denen man gar nicht
    // mehr beitreten kann. Die frueher zusaetzlich angehaengte Einladung hat das nicht
    // geheilt: markVisitedNodes ueberspringt Knoten mit der Verbindungsart INVITED, ein
    // Beitritt ueber die Einladung hat dem Baum also nie Nachfolger verschafft.
    //
    // Loesung: eventsInTree schon beim Anlegen mit allen vergangenen Events fuellen.
    // eventsNotJoinedBy filtert genau danach, damit bleiben nur kommende Events als
    // Startvorschlaege uebrig. createInitialTree setzt eventsInTree danach ohnehin auf
    // die beiden Vorschlaege zurueck, und getSuccessors filtert spaeter nach Datum -
    // die vergangenen Events koennen also nicht wieder hereinrutschen.
    const vergangeneEventIds = [...eventsById.values()].filter(istVergangen).map((e) => e.id);

    console.log('\nStudierende (Platzhalter-Accounts):');
    for (const s of studierende.filter((x) => !x.mitVergangenheit)) {
        s.eventsInTree = vergangeneEventIds;
        s.id = await bereitstellen(s, 'student', 'Studierend');
    }

    console.log('\nGraph der Platzhalter-Accounts:');
    for (const s of studierende.filter((x) => !x.mitVergangenheit && x.id != null)) {
        const ergebnis = await graphHolen(s.id);
        if (!ergebnis.ok) {
            fehler++;
            console.log(`  [FEHLER] ${s.firstName} ${s.lastName} - ${ergebnis.meldung}`);
            continue;
        }
        s.graph = ergebnis.knoten;
        const beitretbar = beitretbareKnoten(s.graph);
        console.log(`  [OK]     ${s.firstName} ${s.lastName}: ${s.graph.length} Knoten, ${beitretbar.length} davon beitretbar`);

        if (beitretbar.length === 0) {
            // Kommt nur noch vor, wenn der Account aus einem aelteren Lauf stammt: der
            // Baum liegt dann schon in der Datenbank und wird nicht neu aufgebaut.
            console.log('             -> Baum enthaelt kein kommendes Event. Der Account stammt vermutlich');
            console.log('                aus einem aelteren Lauf. Fuer saubere Daten die DB zuruecksetzen:');
            console.log('                docker compose down -v && docker compose up --build');
        }
    }

    // 8. Bewertungen zu den vergangenen Events von BEWERTETER_VERANSTALTER.
    // Feedback gibt es im Frontend nur fuer Teilnehmer eines vergangenen Events, also
    // melden wir die Studierenden vorher an. Nach jeder NEUEN Anmeldung wird der Baum
    // einmal nachgezogen: liegt das Event als offener Vorschlag im Baum, springt der
    // Knoten jetzt auf "besucht" und bekommt Nachfolger. Das muss einzeln passieren -
    // zwei gleichzeitig besuchte Knoten wuerden sich dieselben Nachfolger ziehen
    // (siehe Kommentar am Dateianfang).
    console.log(`\nBewertungen fuer die vergangenen Events von ${BEWERTETER_VERANSTALTER}:`);

    // Angemeldet werden ALLE Studierenden, auch die ohne Test-Feedback: nur Teilnehmer
    // eines vergangenen Events sehen im Frontend den Button "Feedback geben". Ohne diesen
    // Schritt haenge es vom Zufall der Graph-Choreografie ab, ob Zeppenfeld ueberhaupt bei
    // einem Event von BEWERTETER_VERANSTALTER war - seine Live-Bewertung soll aber
    // garantiert in dessen Dashboard landen.
    const teilnehmende = studierende.filter((s) => s.id != null);
    const vorhandeneFeedbacks = new Set((await alleFeedbacks()).map((f) => `${f.eventId}::${f.username}`));

    for (const [name, texte] of Object.entries(bewertungen)) {
        const event = [...eventsById.values()].find(
            (e) => e.organizer === BEWERTETER_VERANSTALTER && e.name === name
        );
        if (event == null) {
            console.log(`  [HINWEIS] Event "${name}" nicht gefunden - keine Bewertungen angelegt`);
            continue;
        }
        if (!istVergangen(event)) {
            console.log(`  [HINWEIS] "${name}" liegt nicht in der Vergangenheit - keine Bewertungen angelegt`);
            continue;
        }

        let neu = 0;
        let vorhanden = 0;
        let autorIndex = 0; // laeuft nur ueber die Accounts, die Feedback abgeben duerfen
        for (const student of teilnehmende) {
            const gibtFeedback = !OHNE_FEEDBACK.includes(student.username);
            const text = gibtFeedback ? texte[autorIndex++] : null;

            const teilnahme = await teilnehmen(event.id, student.id);
            if (teilnahme.status === 'fehler') {
                fehler++;
                console.log(`  [FEHLER] ${student.username}: Anmeldung zu "${name}" - ${teilnahme.meldung}`);
                continue;
            }
            if (teilnahme.status === 'neu') {
                student.besucht = student.besucht || [];
                student.besucht.push(event.name);
                const aktualisiert = await graphHolen(student.id);
                if (aktualisiert.ok) student.graph = aktualisiert.knoten;
            }

            if (text == null) continue; // OHNE_FEEDBACK oder keine Texte mehr uebrig
            if (vorhandeneFeedbacks.has(`${event.id}::${student.username}`)) {
                vorhanden++;
                continue;
            }

            const ergebnis = await feedbackAnlegen({ ...text, eventId: event.id, username: student.username });
            if (!ergebnis.ok) {
                fehler++;
                console.log(`  [FEHLER] ${student.username}: Bewertung zu "${name}" - ${ergebnis.meldung}`);
                continue;
            }
            vorhandeneFeedbacks.add(`${event.id}::${student.username}`);
            neu++;
        }
        console.log(`  ${name.padEnd(24)} ${neu} neu, ${vorhanden} bereits vorhanden`);
    }

    if (OHNE_FEEDBACK.length > 0) {
        console.log(`  Ohne Test-Feedback (bewusst, aber ueberall angemeldet): ${OHNE_FEEDBACK.join(', ')}`);
    }

    // ------------------------------------------------------------ Zusammenfassung

    // Aktuellen Stand der Teilnehmerlisten holen, damit die Uebersicht der offenen
    // Vorschlaege stimmt (Anmeldungen aus diesem Lauf sind sonst nicht enthalten).
    (await alleEvents()).forEach((e) => eventsById.set(e.id, e));

    // Bewertungen aus der DB lesen statt aus den Zaehlern dieses Laufs - sonst steht
    // beim zweiten Durchlauf ueberall 0, obwohl das Feedback laengst existiert.
    const feedbackStand = await alleFeedbacks();
    const mittelwert = (liste, feld) => {
        const werte = liste.map((f) => f[feld]).filter((v) => typeof v === 'number');
        return werte.length === 0 ? '-' : (werte.reduce((a, b) => a + b, 0) / werte.length).toFixed(1);
    };

    // Vorschlaege, denen der Studierende in der Praesentation noch beitreten kann und
    // bei denen der Baum danach auch weiterwaechst: im Baum, Termin in der Zukunft,
    // keine Einladung (INVITED-Knoten bekommen nie Nachfolger), noch nicht angemeldet.
    const offeneVorschlaege = (s) =>
        beitretbareKnoten(s.graph)
            .map((n) => eventsById.get(n.eventId))
            .filter((e) => !(e.participantIDs || []).includes(s.id));

    console.log('\n\n=== Zugangsdaten ===\n');
    tabelleAusgeben(['Rolle', 'Name', 'E-Mail', 'Passwort', 'Login', 'Hinweis'], zugangsdaten);

    console.log('\n=== Events pro Veranstalter ===\n');
    tabelleAusgeben(
        ['Veranstalter', 'organizer', 'Events', 'davon vorbei', 'kommend', 'neu angelegt'],
        veranstalter.map((v) => [
            `${v.firstName} ${v.lastName}`,
            v.username,
            v.events.length,
            v.events.filter((e) => e.tage < 0).length,
            v.events.filter((e) => e.tage > 0).length,
            v.angelegt || 0,
        ])
    );

    console.log('\n=== Event-Graph der Studierenden ===\n');
    tabelleAusgeben(
        ['Studierend', 'Knoten', 'besuchte Events (vorbei)', 'angemeldet (kommend)', 'beitretbar (Baum waechst)', 'Feedback'],
        studierende
            .filter((s) => s.id != null)
            .map((s) => [
                `${s.firstName} ${s.lastName}`,
                s.graph ? s.graph.length : '-',
                (s.besucht || []).join(', ') || '-',
                (s.angemeldet || []).join(', ') || '-',
                offeneVorschlaege(s)
                    .map((e) => `${e.name} (${e.eventdate.slice(5, 10)})`)
                    .join(', ') || '-',
                feedbackStand.filter((f) => f.username === s.username).length,
            ])
    );

    console.log(`\n=== Bewertungen (Veranstalter ${BEWERTETER_VERANSTALTER}) ===\n`);
    tabelleAusgeben(
        ['Event', 'Anzahl', 'Schnitt Event', 'Schnitt Networking', 'Schnitt Empfehlung'],
        Object.keys(bewertungen).map((name) => {
            const event = [...eventsById.values()].find(
                (e) => e.organizer === BEWERTETER_VERANSTALTER && e.name === name
            );
            const dazu = event == null ? [] : feedbackStand.filter((f) => f.eventId === event.id);
            return [
                name,
                dazu.length,
                `${mittelwert(dazu, 'eventrating')} / 5`,
                `${mittelwert(dazu, 'socializingRating')} / 5`,
                `${mittelwert(dazu, 'recommendation')} / 10`,
            ];
        })
    );
    console.log(`Als ${BEWERTETER_VERANSTALTER} einloggen -> Dashboard -> Event -> "Zu den Bewertungen".`);
    if (OHNE_FEEDBACK.length > 0) {
        console.log(`${OHNE_FEEDBACK.join(', ')} hat bewusst kein Feedback abgegeben - das laesst sich live vorfuehren.`);
    }

    const kommendeGesamt = [...eventsById.values()].filter((e) => !istVergangen(e)).length;
    console.log(`\n${kommendeGesamt} kommende Events insgesamt - beim Beitreten waechst der Baum`);
    console.log('mit zwei neuen Vorschlaegen weiter (solange spaetere Events uebrig sind).');
    console.log(`\nAlle Accounts nutzen dasselbe Passwort: ${PASSWORD}`);
    console.log('Login im Frontend: http://localhost:3000\n');

    if (fehler > 0) {
        console.error(`${fehler} Schritt(e) sind fehlgeschlagen - siehe Meldungen oben.`);
        process.exit(1);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
