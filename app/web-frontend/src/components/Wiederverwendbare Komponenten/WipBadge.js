// Kleines Chip, das kennzeichnet, dass ein Feature im Design bereits vorhanden,
// aber noch nicht funktional angebunden ist.
const WipBadge = ({ label = "bald verfügbar", floating = false, style }) => {
    return (
        <span className={"wip-badge" + (floating ? " floating" : "")} style={style}>
            🚧 {label}
        </span>
    );
};

export default WipBadge;
