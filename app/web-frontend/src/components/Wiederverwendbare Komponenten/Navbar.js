import { Link, useLocation } from "react-router-dom";
import * as Icons from "../../icons";

// Seitliche Hauptnavigation im GrowDent-Design. Rollenabhängig:
// Studierende erstellen Mini-Events und sehen kein Veranstalter-Dashboard,
// Veranstalter haben das Dashboard und erstellen offizielle Events.
// Aktiver Zustand wird über den aktuellen Pfad (useLocation) bestimmt.
const buildNavGroups = (isOrganizer) => {
    // Veranstalter haben eine bewusst reduzierte Navigation: nur Dashboard und Chats.
    if (isOrganizer) {
        return [
            { label: "Veranstalter", items: [{ to: "/organizerDashboard", label: "Dashboard", icon: Icons.Bell }] },
            { label: "Community", items: [{ to: "/chats", label: "Chats", icon: Icons.Chat }] },
        ];
    }
    // Studierende: volle Navigation.
    return [
        {
            label: "Entdecken",
            items: [
                { to: "/eventGraph", label: "Event-Graph", icon: Icons.Map },
                { to: "/eventOverview", label: "Events", icon: Icons.Calendar },
                { to: "/miniEventAsStudent", label: "Mini-Events", icon: Icons.Flame },
            ],
        },
        {
            label: "Community",
            items: [
                { to: "/chats", label: "Chats", icon: Icons.Chat },
                { to: "/friendsOverview", label: "Freunde", icon: Icons.Users },
            ],
        },
    ];
};

// Abbildung des User-Typs (vom Backend) auf ein lesbares Label für die Profil-Karte.
const ROLE_LABELS = {
    Student: "Studierende:r",
    Veranstalter: "Veranstalter:in",
};

const Navbar = ({ currentUser }) => {
    const { pathname } = useLocation();

    const isActive = (to) => {
        if (to === "/eventOverview") {
            return pathname === "/eventOverview" || pathname.startsWith("/eventOverview/");
        }
        return pathname === to;
    };

    const isOrganizer = currentUser?.type === "Veranstalter";
    const navGroups = buildNavGroups(isOrganizer);

    const displayName = currentUser?.username || currentUser?.firstName || "Mein Profil";
    const roleLabel = ROLE_LABELS[currentUser?.type] || "Profil ansehen";
    const avatarInitial = (displayName[0] || "?").toUpperCase();

    return (
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-mark">G</div>
                <div className="brand-name">Grow<span>Dent</span></div>
            </div>

            {navGroups.map((group) => (
                <div key={group.label}>
                    <div className="nav-group-label">{group.label}</div>
                    {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.to} to={item.to}
                                className={"nav-item" + (isActive(item.to) ? " active" : "")}>
                                <span className="nav-icon"><Icon size={18} /></span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            ))}

            <div className="sidebar-footer">
                {/* Profil des eingeloggten Nutzers mit Zahnrad zu den Einstellungen. */}
                <div className={"me-card" + (isActive("/studentProfile") ? " active" : "")}>
                    <Link to="/studentProfile" className="me-card-main">
                        <div className="me-avatar">{avatarInitial}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="me-name">{displayName}</div>
                            <div className="me-meta">{roleLabel}</div>
                        </div>
                    </Link>
                    <Link to="/settings" className="btn icon ghost" aria-label="Einstellungen"
                        style={{ padding: 8 }}>
                        <Icons.Settings size={16} />
                    </Link>
                </div>
            </div>
        </aside>
    );
};

export default Navbar;
