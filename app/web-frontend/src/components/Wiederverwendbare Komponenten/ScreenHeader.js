// Kopfzeile eines Screens: Titel + optionaler Untertitel + optionale Aktion.
// Portiert aus design-reference/src/screens-1.jsx.
const ScreenHeader = ({ title, subtitle, action }) => {
    return (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
            <div>
                <div className="h1">{title}</div>
                {subtitle && <div className="muted" style={{ fontSize: 15, marginTop: 8, maxWidth: 600 }}>{subtitle}</div>}
            </div>
            {action}
        </div>
    );
};

export default ScreenHeader;
