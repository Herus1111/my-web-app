// Hell-/Dunkelmodus. Der Modus wird als data-theme-Attribut am <html>-Element
// gesetzt; das CSS (index.css) definiert dazu die passenden Farb-Variablen.
const STORAGE_KEY = "theme";
const DEFAULT = "light";

export function getSavedTheme() {
    try {
        const t = localStorage.getItem(STORAGE_KEY);
        return t === "dark" || t === "light" ? t : DEFAULT;
    } catch {
        return DEFAULT;
    }
}

export function applyTheme(theme) {
    const t = theme === "dark" ? "dark" : "light";
    if (t === "dark") {
        document.documentElement.dataset.theme = "dark";
    } else {
        delete document.documentElement.dataset.theme;
    }
    try {
        localStorage.setItem(STORAGE_KEY, t);
    } catch {
        /* localStorage nicht verfügbar – Auswahl gilt dann nur für diese Sitzung */
    }
    return t;
}
