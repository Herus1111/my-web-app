import WipBadge from "./WipBadge";

// Umschließt einen Bereich, der im Design schon fertig aussieht, aber noch
// nicht funktional ist: graut den Inhalt aus und legt ein "bald verfügbar"-Chip
// oben rechts an. Der Inhalt ist nicht interaktiv (pointer-events:none via .wip).
const WipWrap = ({ label, children, style, badge = true }) => {
    return (
        <div className="wip-wrap" style={style}>
            {badge && <WipBadge floating label={label} />}
            <div className="wip">{children}</div>
        </div>
    );
};

export default WipWrap;
