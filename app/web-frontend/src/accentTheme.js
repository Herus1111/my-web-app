// Wählbare Akzentfarben. Jede Option liefert die drei Abstufungen, die im
// Design als CSS-Variablen genutzt werden (--accent / --accent-soft / --accent-deep),
// damit die ganze App bei einem Wechsel konsistent bleibt.
export const ACCENTS = [
    { id: "green", label: "Mint", accent: "#19B36A", soft: "#E6F7EE", deep: "#0F7A47" },
    { id: "blue", label: "Indigo", accent: "#5B5BFF", soft: "#E8E8FF", deep: "#3A3AD1" },
    { id: "orange", label: "Coral", accent: "#FF5A36", soft: "#FFE7E0", deep: "#C43A1C" },
    { id: "yellow", label: "Gelb", accent: "#FFD23F", soft: "#FFF4D6", deep: "#A87A00" },
    { id: "pink", label: "Pink", accent: "#FF4DA6", soft: "#FFE3F0", deep: "#C1246F" },
    { id: "purple", label: "Violet", accent: "#9B7BFF", soft: "#EFEAFF", deep: "#6A4BD6" },
];

const STORAGE_KEY = "accentColor";
const DEFAULT_ID = "green";

// Gespeicherte Auswahl lesen; fällt auf den Standard zurück, wenn nichts/Ungültiges gespeichert ist.
export function getSavedAccentId() {
    try {
        const id = localStorage.getItem(STORAGE_KEY);
        return ACCENTS.some((a) => a.id === id) ? id : DEFAULT_ID;
    } catch {
        return DEFAULT_ID;
    }
}

// Akzentfarbe anwenden (CSS-Variablen setzen) und Auswahl speichern.
export function applyAccent(id) {
    const a = ACCENTS.find((x) => x.id === id) || ACCENTS[0];
    const root = document.documentElement;
    root.style.setProperty("--accent", a.accent);
    root.style.setProperty("--accent-soft", a.soft);
    root.style.setProperty("--accent-deep", a.deep);
    try {
        localStorage.setItem(STORAGE_KEY, a.id);
    } catch {
        /* localStorage nicht verfügbar – Auswahl gilt dann nur für diese Sitzung */
    }
    return a.id;
}
