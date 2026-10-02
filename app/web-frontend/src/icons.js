// Leichtgewichtige Inline-SVG-Icons (stroke-basiert).
// Portiert aus design-reference/src/icons.jsx als echtes ES-Modul.

const Ic = (path, opts = {}) => {
    const Icon = ({ size = 18, className, style }) => (
        <svg viewBox="0 0 24 24" width={size} height={size}
            fill={opts.fill || "none"} stroke="currentColor" strokeWidth={opts.sw || 1.75}
            strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
            {path}
        </svg>
    );
    return Icon;
};

export const Calendar = Ic(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>);
export const Sparkles = Ic(<><path d="M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5z" /><path d="M19 15l.8 1.7L21.5 17.5l-1.7.8L19 20l-.8-1.7L16.5 17.5l1.7-.8z" /></>);
export const Trophy = Ic(<><path d="M8 21h8M12 17v4M6 4h12v4a6 6 0 1 1-12 0V4zM6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3" /></>);
export const Users = Ic(<><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M15 14c2.8 0 6 1.7 6 5" /></>);
export const Chat = Ic(<><path d="M21 12a8 8 0 0 1-12 7l-5 1 1-4A8 8 0 1 1 21 12z" /></>);
export const Star = Ic(<path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 16.7l-5.4 2.9 1-6L3.3 9.4l6-.9z" />);
export const Search = Ic(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>);
export const Bell = Ic(<><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></>);
export const Plus = Ic(<><path d="M12 5v14M5 12h14" /></>);
export const Map = Ic(<><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>);
export const Bolt = Ic(<path d="M13 3L4 14h7l-1 7 9-11h-7z" />);
export const Heart = Ic(<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" />);
export const Send = Ic(<><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></>);
export const Settings = Ic(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8L4.2 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3L17 4.2a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>);
export const Coin = Ic(<><circle cx="12" cy="12" r="9" /><path d="M12 6v12M9 9h4.5a2 2 0 1 1 0 4H10a2 2 0 1 0 0 4h5" /></>);
export const Pin = Ic(<><path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z" /><circle cx="12" cy="9" r="3" /></>);
export const Clock = Ic(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const ArrowRight = Ic(<><path d="M5 12h14M13 6l6 6-6 6" /></>);
export const Check = Ic(<path d="M5 12l5 5 9-11" />);
export const X = Ic(<><path d="M6 6l12 12M18 6L6 18" /></>);
export const Flame = Ic(<path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-1 5 3 5 4-3 4-5c0-3-4-5-4-5z" />);
export const QR = Ic(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3M21 14v3M14 21h3M21 21h-3" /></>);
export const Mic = Ic(<><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>);
