// Rundes Avatar: entweder Bild oder farbiger Kreis mit Initiale.
// Portiert aus design-reference/src/screens-1.jsx.
const SIZES = { sm: 36, lg: 56, xl: 88 };

const Avatar = ({ name, initial, color, avatar, size }) => {
    const px = SIZES[size] || SIZES.sm;
    const cls = "av" + (size === "lg" ? " lg" : size === "xl" ? " xl" : "");
    if (avatar) {
        return <img className={cls} src={avatar} alt=""
            style={{ objectFit: "cover", borderRadius: "50%", width: px, height: px }} />;
    }
    return <div className={cls} style={{ background: color || "#5B8DEF" }}>{(initial || (name || "?")[0]).toUpperCase()}</div>;
};

export default Avatar;
