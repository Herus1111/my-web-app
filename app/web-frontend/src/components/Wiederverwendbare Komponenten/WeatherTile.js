// Wetter-Kachel für Event-Karten: Emoji-Icon + Temperatur + Status + Niederschlag.
// Nutzt das GrowDent-Design (Karten-Tokens) und funktioniert in Hell-/Dunkelmodus,
// da nur der kleine Icon-Kreis eine feste Tönung hat.

// Zuordnung der Backend-Status (siehe EventWeather.weatherCodeToStatus) zu Icon + Tönung.
const WEATHER = {
    "Sonnig": { icon: "☀️", tint: "#FFF6D6" },
    "Bewölkt": { icon: "⛅", tint: "#E6EEFD" },
    "Nebel": { icon: "🌫️", tint: "#ECEAE2" },
    "Regen": { icon: "🌧️", tint: "#E6EEFD" },
    "Schnee": { icon: "❄️", tint: "#E6F4FF" },
    "Gewitter": { icon: "⛈️", tint: "#EEE6FF" },
};
const FALLBACK = { icon: "🌡️", tint: "#ECEAE2" };

const tileStyle = {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px", borderRadius: 12,
    background: "var(--bg)", border: "1px solid var(--line)",
};

const IconBubble = ({ icon, tint }) => (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: tint, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>
        {icon}
    </div>
);

const WeatherTile = ({ weather }) => {
    // Noch keine Wetterdaten am Event (werden per MQTT nachgeliefert).
    if (!weather) {
        return (
            <div style={tileStyle}>
                <IconBubble icon={FALLBACK.icon} tint={FALLBACK.tint} />
                <div className="muted" style={{ fontSize: 13 }}>Wetter wird geladen…</div>
            </div>
        );
    }

    const isUnavailable = weather.weatherStatus === "Nicht verfügbar";
    const info = WEATHER[weather.weatherStatus] || FALLBACK;
    const hasTemp = weather.celsius != null && !isUnavailable;

    if (isUnavailable) {
        return (
            <div style={tileStyle}>
                <IconBubble icon={FALLBACK.icon} tint={FALLBACK.tint} />
                <div className="muted" style={{ fontSize: 13 }}>Wetter nicht verfügbar</div>
            </div>
        );
    }

    return (
        <div style={tileStyle}>
            <IconBubble icon={info.icon} tint={info.tint} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {hasTemp ? Math.round(weather.celsius) + "°C" : (weather.weatherStatus || "Wetterdaten nicht verfügbar.")}
                    {hasTemp && weather.weatherStatus && (
                        <span className="muted" style={{ fontWeight: 500, fontSize: 13, marginLeft: 6 }}>{weather.weatherStatus}</span>
                    )}
                </div>
                {weather.precipitation != null && (
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>💧 {weather.precipitation} mm Niederschlag</div>
                )}
            </div>
        </div>
    );
};

export default WeatherTile;
