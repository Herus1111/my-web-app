// Platzhalterdaten für die Gamification-Screens, die im Design schon vorhanden,
// aber noch nicht ans Backend angebunden sind. Portiert aus
// design-reference/src/data.jsx. NICHT für echte Logik verwenden – dient nur der
// visuellen Demonstration (klar als "bald verfügbar" markiert).

export const ME = {
    name: "Maximilian Weber",
    short: "Maxi W.",
    level: 5,
    exp: 373,
    expMax: 500,
    points: 12,
    streak: 4,
    status: "Oh! Komm tau mich auf 🍳 — Spotify: zartmann",
};

export const FRIENDS = [
    { name: "Max Becker", initial: "M", color: "#5B8DEF", level: 7, mutual: 12, status: "online" },
    { name: "Sofie Klein", initial: "S", color: "#FF7AB6", level: 4, mutual: 8, status: "online" },
    { name: "Olya Petrenko", initial: "O", color: "#9B7BFF", level: 6, mutual: 11, status: "away" },
    { name: "Dima Kuznetsov", initial: "D", color: "#19B36A", level: 9, mutual: 14, status: "offline" },
    { name: "Roman Fischer", initial: "R", color: "#FFD23F", level: 3, mutual: 5, status: "online" },
    { name: "Lina Müller", initial: "L", color: "#5B8DEF", level: 8, mutual: 13, status: "online" },
    { name: "Marc Salz", initial: "M", color: "#FF7AB6", level: 2, mutual: 3, status: "offline" },
    { name: "Kevin Parker", initial: "K", color: "#19B36A", level: 6, mutual: 10, status: "online" },
];

export const ACHIEVEMENTS = [
    { id: "eventjaeger", name: "Eventjäger Lvl 1", icon: "🏆", earned: true, points: 2, desc: "Besuche dein erstes Event" },
    { id: "social", name: "Social Butterfly", icon: "🦋", earned: true, points: 3, desc: "Connecte dich mit 5 Personen" },
    { id: "chef", name: "Mini-Chef", icon: "🍳", earned: true, points: 5, desc: "Hoste ein Mini-Event" },
    { id: "streak7", name: "Wochen-Streak", icon: "🔥", earned: false, progress: 4, total: 7, points: 4, desc: "7 Tage in Folge aktiv" },
    { id: "explorer", name: "Stadtentdecker", icon: "🗺️", earned: false, progress: 3, total: 10, points: 6, desc: "10 verschiedene Locations" },
    { id: "host", name: "Host Pro", icon: "🎤", earned: false, progress: 1, total: 5, points: 8, desc: "5 erfolgreiche Events veranstalten" },
    { id: "night", name: "Nachtschwärmer", icon: "🌙", earned: false, progress: 2, total: 5, points: 3, desc: "5 Nightlife-Events" },
    { id: "early", name: "Frühaufsteher", icon: "☀️", earned: true, points: 2, desc: "Anmeldung in den ersten 10 Min" },
];

export const SHOP = [
    { id: "pick", icon: "🎯", name: "Ein Event aussuchen", cost: 2 },
    { id: "status", icon: "✨", name: "Status hinzufügen", cost: 1 },
    { id: "streak", icon: "🔥", name: "Streak wiederherstellen", cost: 3 },
    { id: "host", icon: "🎤", name: "Mini-Event hosten", cost: 5 },
    { id: "skin", icon: "🎨", name: "Profil-Skin freischalten", cost: 4 },
    { id: "boost", icon: "⚡", name: "EXP-Boost (24h)", cost: 6 },
];

export const CHATS = [
    { id: "max", name: "Max", initial: "M", color: "#5B8DEF", last: "Auf welches Event gehen wir nächstes Mal?", time: "19:56", unread: 1 },
    { id: "kochen", name: "Mini-Event: Wohnheim Kochen", initial: "🍳", color: "#FF7AB6", last: "Arnold: Let them cook! 🍳", time: "16:04", unread: 0 },
    { id: "sofie", name: "Sofie", initial: "S", color: "#9B7BFF", last: "Kommst du heute?", time: "12:30", unread: 0 },
    { id: "dima", name: "Dima", initial: "D", color: "#19B36A", last: "Bro, wanna grab some beer?", time: "14:58", unread: 5 },
    { id: "roman", name: "Roman", initial: "R", color: "#FFD23F", last: "OK 👍", time: "14:48", unread: 1 },
];

export const MINI_EVENT = {
    title: "Mini-Event: Wohnheim Kochen",
    host: "Maximilian Weber",
    location: "Sonnenstraße 96-100, 44139 Dortmund",
    when: "Heute, 19:00 Uhr · Küche 4. Stock",
    seats: { taken: 3, total: 8 },
    desc: "Wir kochen gemeinsam und am Ende gibt's einen kleinen Wettbewerb: jede*r probiert die Gerichte der anderen und wir wählen das beste aus.",
};
