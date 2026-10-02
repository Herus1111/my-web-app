import { useState, useEffect, useRef, useCallback } from "react";
import { useHistory } from "react-router-dom";
import ScreenHeader from "../Wiederverwendbare Komponenten/ScreenHeader";
import * as Icons from "../../icons";
import backendURL from "../../backendURL";

// Kartengröße und Abstände. Der Baum wächst nach UNTEN: Tiefe = y, Geschwister = x.
const NODE_W = 200, NODE_H = 104;
const GAP_X = 44, GAP_Y = 86;
const SLOT = NODE_W + GAP_X;
const CANVAS_H = 640;
const ZOOM_MIN = 0.4, ZOOM_MAX = 1.6, ZOOM_DEFAULT = 0.85;

function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

// Ist der Event-Termin schon vorbei?
function isPast(ev) {
    if (!ev || !ev.eventdate) return false;
    const d = new Date(ev.eventdate);
    return !isNaN(d.getTime()) && d.getTime() < Date.now();
}

// Zustand eines Knotens. Die aktuelle Anmeldung wird an der live gepflegten
// Teilnehmerliste (participantIDs) festgemacht – so verschwindet "angemeldet" auch
// wieder, wenn man ein Event vor Ablauf verlässt (das Backend-Flag "wurdeBesucht"
// wird dabei nicht zurückgesetzt und taugt daher nicht als Quelle).
//   visited     = angemeldet + Termin vorbei
//   registered  = angemeldet + Termin in der Zukunft
//   invited     = offene Einladung (nicht angemeldet)
//   suggestion  = Vorschlag
function nodeState(node, ev, myId, invitedIds) {
    const registered = myId != null && ev && Array.isArray(ev.participantIDs) && ev.participantIDs.includes(myId);
    if (registered) return isPast(ev) ? "visited" : "registered";
    // "invited" wird über die offenen Einladungen bestimmt (nicht über die Verbindungsart),
    // damit auch bereits im Baum vorhandene Vorschläge als Einladung markiert werden.
    if (invitedIds && node.eventId != null && invitedIds.has(node.eventId)) return "invited";
    return "suggestion";
}

function nodeBg(state) {
    switch (state) {
        case "visited": return "var(--accent-soft)";  // besucht (grün)
        case "registered": return "#E6EEFD";           // angemeldet (blau)
        case "invited": return "#FFE6F0";              // Einladung (pink)
        default: return "var(--paper)";                // Vorschlag
    }
}

// Label im Knoten-Badge: offene Einladung > Mini-Event > Event.
function kindLabel(ev, state) {
    if (state === "invited") return "EINLADUNG";
    if (ev && ev.type === "MiniEvent") return "MINI-EVENT";
    return "EVENT";
}

// Tidy-Tree-Layout: Blätter bekommen fortlaufende x-Slots, Eltern werden mittig
// über ihre Kinder zentriert. y ergibt sich aus der Tiefe -> der Baum wächst nach unten.
function layoutTree(nodes) {
    const byId = new Map(nodes.map((n) => [n.nodeId, n]));
    const children = new Map();
    let root = null;
    for (const n of nodes) {
        const hasParent = n.parentId != null && byId.has(n.parentId);
        if (!hasParent && (root == null || n.isRoot)) root = n;
        if (hasParent) {
            if (!children.has(n.parentId)) children.set(n.parentId, []);
            children.get(n.parentId).push(n);
        }
    }

    const pos = new Map();
    let nextLeaf = 0;
    const assign = (node, depth) => {
        const kids = children.get(node.nodeId) || [];
        let x;
        if (kids.length === 0) {
            x = nextLeaf * SLOT;
            nextLeaf += 1;
        } else {
            const kxs = kids.map((k) => assign(k, depth + 1));
            x = (kxs[0] + kxs[kxs.length - 1]) / 2;
        }
        pos.set(node.nodeId, { x, y: depth * (NODE_H + GAP_Y) });
        return x;
    };
    if (root) assign(root, 0);
    // Sicherheitsnetz für nicht erreichte Knoten (sollte nicht vorkommen).
    for (const n of nodes) {
        if (!pos.has(n.nodeId)) { pos.set(n.nodeId, { x: nextLeaf * SLOT, y: 0 }); nextLeaf += 1; }
    }

    const positioned = nodes.map((n) => ({ ...n, ...pos.get(n.nodeId) }));
    const xs = positioned.map((n) => n.x);
    const ys = positioned.map((n) => n.y);
    const minX = Math.min(0, ...xs), maxX = Math.max(0, ...xs);
    const maxY = Math.max(0, ...ys);
    return {
        positioned,
        rootId: root ? root.nodeId : null,
        width: maxX - minX + NODE_W,
        height: maxY + NODE_H,
    };
}

const ROOT_DOT = 26;
const ARROW_GAP = 4; // kleiner Abstand vor der Kindoberkante für den Pfeilkopf

// Konsistente Kante: vertikale Bézier-Kurve von der Unterkante des Eltern- zur
// Oberkante des Kindknotens. Alle Kanten haben dieselbe Form; der Pfeil zeigt
// immer senkrecht nach unten -> ruhiges, gleichmäßiges Baum-Bild.
function edgeGeom(from, to) {
    const x1 = from.x + NODE_W / 2;
    const y1 = from.isRoot ? from.y + ROOT_DOT : from.y + NODE_H;
    const x2 = to.x + NODE_W / 2;
    const y2 = to.y - ARROW_GAP;
    const cy = (y1 + y2) / 2;
    return { path: `M ${x1},${y1} C ${x1},${cy} ${x2},${cy} ${x2},${y2}`, ex: x2, ey: y2 };
}

const EventGraph = ({ currentUser }) => {
    const history = useHistory();
    const [nodes, setNodes] = useState([]);
    const [eventsById, setEventsById] = useState({});
    const [invitedIds, setInvitedIds] = useState(() => new Set()); // Events mit offener Einladung
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [zoom, setZoom] = useState(ZOOM_DEFAULT);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [filter, setFilter] = useState("all");
    const [hover, setHover] = useState(null);
    const canvasRef = useRef(null);
    const dragRef = useRef(null);

    const isStudent = currentUser?.type === "Student";
    const userId = currentUser?.id;

    useEffect(() => {
        if (!isStudent || userId == null) { setLoading(false); return; }
        let alive = true;
        const load = (first) => {
            if (first) setLoading(true);
            Promise.all([
                fetch(backendURL() + "/EventGraph/" + userId).then(async (r) => {
                    if (!r.ok) throw new Error((await r.text()) || "Der Graph konnte nicht geladen werden.");
                    return r.json();
                }),
                fetch(backendURL() + "/events").then((r) => r.json()).catch(() => []),
                // Offene Einladungen des Nutzers – daran wird "invited" festgemacht (nicht an
                // der Baum-Verbindungsart), damit auch schon im Baum liegende Events markiert werden.
                fetch(backendURL() + "/events/invitations/received/" + userId).then((r) => r.json()).catch(() => []),
            ])
                .then(([tree, events, invitations]) => {
                    if (!alive) return;
                    setNodes(Array.isArray(tree) ? tree : []);
                    const map = {};
                    (Array.isArray(events) ? events : []).forEach((e) => { map[e.id] = e; });
                    setEventsById(map);
                    setInvitedIds(new Set((Array.isArray(invitations) ? invitations : [])
                        .filter((i) => i.status === "PENDING").map((i) => i.eventId)));
                    setError("");
                })
                .catch((err) => { if (first && alive) setError(err.message); })
                .finally(() => { if (first && alive) setLoading(false); });
        };
        load(true);
        // Live-Update: neue Einladungen/besuchte Events erscheinen ohne manuellen Reload.
        const iv = setInterval(() => load(false), 4000);
        return () => { alive = false; clearInterval(iv); };
    }, [isStudent, userId]);

    const { positioned, rootId, width, height } = layoutTree(nodes);

    // Root horizontal zentrieren und oben andocken.
    const centerOnRoot = useCallback((z = ZOOM_DEFAULT) => {
        const root = positioned.find((n) => n.nodeId === rootId);
        const cw = canvasRef.current ? canvasRef.current.clientWidth : 900;
        const rootCx = root ? root.x + NODE_W / 2 : width / 2;
        setZoom(z);
        setPan({ x: cw / 2 - rootCx * z, y: 48 });
    }, [positioned, rootId, width]);

    // Einmal zentrieren, sobald Daten da sind.
    const centeredRef = useRef(false);
    useEffect(() => {
        if (!centeredRef.current && positioned.length > 0) {
            centeredRef.current = true;
            centerOnRoot(ZOOM_DEFAULT);
        }
    }, [positioned.length, centerOnRoot]);

    // Panning per Maus-Drag auf leerem Canvas (nicht auf Knoten/Buttons).
    const onMouseDown = (e) => {
        if (e.target.closest(".graph-node") || e.target.closest("button")) return;
        dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    };
    const onMouseMove = (e) => {
        if (!dragRef.current) return;
        setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
    };
    const endDrag = () => { dragRef.current = null; if (canvasRef.current) canvasRef.current.style.cursor = "grab"; };
    const onWheel = (e) => {
        e.preventDefault();
        setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z - e.deltaY * 0.0015)));
    };

    // Beim Öffnen die Herkunft mitgeben, damit "Zurück" wieder zum Graphen führt.
    const openEvent = (n) => { if (n.eventId != null && eventsById[n.eventId]) history.push("/eventOverview/" + n.eventId, { from: "/eventGraph" }); };

    const visitedCount = positioned.filter((n) => !n.isRoot && nodeState(n, eventsById[n.eventId], userId, invitedIds) === "visited").length;
    const registeredCount = positioned.filter((n) => !n.isRoot && nodeState(n, eventsById[n.eventId], userId, invitedIds) === "registered").length;
    const isVisible = (n) => filter === "all" || (filter === "visited" ? n.wurdeBesucht : !n.wurdeBesucht) || n.isRoot;
    const posById = new Map(positioned.map((n) => [n.nodeId, n]));
    const edges = positioned
        .filter((n) => n.parentId != null && posById.has(n.parentId) && isVisible(n) && isVisible(posById.get(n.parentId)))
        .map((n) => ({ from: posById.get(n.parentId), to: n, invited: n.verbindungsart === "EINGELADEN" }));

    return (
        <div className="screen-enter">
            <ScreenHeader
                title="Event-Graph"
                subtitle="Dein Pfad durch die Events – ein Knoten führt zum nächsten."
                action={nodes.length > 0 ? (
                    <span className="row" style={{ gap: 8 }}>
                        <span className="chip green">● {visitedCount} besucht</span>
                        {registeredCount > 0 && <span className="chip blue">● {registeredCount} angemeldet</span>}
                    </span>
                ) : null}
            />

            {!isStudent ? (
                <div className="card" style={{ padding: 32, textAlign: "center" }}>
                    <div className="muted">Der Event-Graph steht nur Studierenden zur Verfügung.</div>
                </div>
            ) : loading ? (
                <div className="muted" style={{ padding: 12 }}>Lädt deinen Event-Graphen…</div>
            ) : error ? (
                <div className="card" style={{ padding: 24, borderColor: "var(--pop-pink)" }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Graph konnte nicht geladen werden</div>
                    <div className="muted" style={{ fontSize: 13 }}>{error}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                        Für den Start deines Pfades müssen mindestens zwei Events existieren, an denen du noch nicht teilnimmst.
                    </div>
                </div>
            ) : positioned.length === 0 ? (
                <div className="card" style={{ padding: 32, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🌱</div>
                    <div className="muted">Dein Pfad ist noch leer. Tritt einem Event bei, um deinen Graphen wachsen zu lassen.</div>
                </div>
            ) : (
                <div
                    ref={canvasRef}
                    className="card"
                    style={{ padding: 0, overflow: "hidden", position: "relative", height: CANVAS_H, cursor: "grab", background: "var(--paper)" }}
                    onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag}
                    onWheel={onWheel}
                >
                    {/* Punkt-Grid */}
                    <div className="dot-bg" style={{ position: "absolute", inset: 0, backgroundSize: "22px 22px" }} />

                    {/* Filter oben links */}
                    <div style={{ position: "absolute", top: 16, left: 16, zIndex: 4 }}>
                        <div className="row" style={{ padding: 3, background: "var(--paper)", borderRadius: 999, border: "1px solid var(--line)", boxShadow: "var(--shadow-card)" }}>
                            {[{ id: "all", label: "Alle" }, { id: "visited", label: "Besucht" }, { id: "open", label: "Offen" }].map((f) => (
                                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                                    padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
                                    background: filter === f.id ? "var(--ink)" : "transparent",
                                    color: filter === f.id ? "white" : "var(--muted)", border: "none",
                                }}>{f.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Zoom-Controls oben rechts */}
                    <div className="row" style={{ position: "absolute", top: 16, right: 16, gap: 8, zIndex: 4 }}>
                        <button className="btn ghost icon" style={{ padding: 8 }} onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 0.1))}>−</button>
                        <div style={{ padding: "8px 12px", background: "var(--paper)", borderRadius: 12, border: "1px solid var(--line)", fontSize: 12, fontWeight: 700 }}>{Math.round(zoom * 100)}%</div>
                        <button className="btn ghost icon" style={{ padding: 8 }} onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 0.1))}>+</button>
                        <button className="btn ghost" onClick={() => centerOnRoot(ZOOM_DEFAULT)} style={{ padding: "8px 12px", fontSize: 12 }}>Zentrieren</button>
                    </div>

                    {/* Legende unten rechts */}
                    <div className="card" style={{ position: "absolute", bottom: 16, right: 16, zIndex: 4, padding: "12px 14px", display: "grid", gap: 6, fontSize: 12 }}>
                        <div className="row" style={{ gap: 8 }}><span style={{ width: 14, height: 14, borderRadius: 6, background: "var(--accent-soft)", border: "2px solid var(--ink)" }} /> Besucht</div>
                        <div className="row" style={{ gap: 8 }}><span style={{ width: 14, height: 14, borderRadius: 6, background: "#E6EEFD", border: "2px solid var(--ink)" }} /> Angemeldet</div>
                        <div className="row" style={{ gap: 8 }}><span style={{ width: 14, height: 14, borderRadius: 6, background: "var(--paper)", border: "2px solid var(--ink)" }} /> Vorschlag</div>
                        <div className="row" style={{ gap: 8 }}><span style={{ width: 14, height: 14, borderRadius: 6, background: "#FFE6F0", border: "2px solid var(--ink)" }} /> Einladung</div>
                    </div>

                    {/* Welt (verschiebbar + zoombar) */}
                    <div style={{ position: "absolute", left: pan.x, top: pan.y, transformOrigin: "0 0", transform: `scale(${zoom})`, willChange: "transform" }}>
                        <div style={{ position: "relative", width, height: height + 40 }}>
                            <svg width={width} height={height + 40} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
                                {edges.map((e, i) => {
                                    // Kantenfarbe folgt dem Ziel-Zustand: besucht = grün, angemeldet = blau,
                                    // offene Einladung = pink (gestrichelt), sonst neutral.
                                    const toState = nodeState(e.to, eventsById[e.to.eventId], userId, invitedIds);
                                    const isHov = hover === e.from.nodeId || hover === e.to.nodeId;
                                    const highlight = toState === "visited" || toState === "registered" || toState === "invited";
                                    const color = toState === "invited" ? "var(--pop-pink)"
                                        : toState === "visited" ? "var(--accent)"
                                        : toState === "registered" ? "var(--pop-blue)"
                                        : "var(--ink)";
                                    const { path, ex, ey } = edgeGeom(e.from, e.to);
                                    return (
                                        <g key={i} opacity={isHov ? 1 : highlight ? 0.95 : 0.4}>
                                            <path d={path} fill="none" stroke={color}
                                                strokeWidth={highlight ? 3.5 : 2}
                                                strokeDasharray={toState === "invited" ? "9 7" : "0"} strokeLinecap="round" />
                                            {/* Pfeilkopf zeigt immer nach unten (Baum wächst nach unten). */}
                                            <polygon points={`${ex - 5},${ey - 8} ${ex + 5},${ey - 8} ${ex},${ey + 2}`} fill={color} />
                                        </g>
                                    );
                                })}
                            </svg>

                            {positioned.filter(isVisible).map((n) => {
                                // Root ist nur ein Punkt, kein Kärtchen.
                                if (n.isRoot) {
                                    return (
                                        <div key={n.nodeId} style={{ position: "absolute", left: n.x + NODE_W / 2 - 13, top: n.y, textAlign: "center" }}>
                                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", border: "3px solid var(--ink)", boxShadow: "0 3px 0 var(--ink)" }} />
                                            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap", transform: "translateX(-50%)", marginLeft: 13 }}>START</div>
                                        </div>
                                    );
                                }
                                const ev = n.eventId != null ? eventsById[n.eventId] : null;
                                const title = ev ? ev.name : "Event #" + n.eventId;
                                const sub = ev ? [formatDate(ev.eventdate), ev.venue].filter(Boolean).join(" · ") : "";
                                const state = nodeState(n, ev, userId, invitedIds);
                                return (
                                    <button key={n.nodeId} className="graph-node"
                                        onMouseEnter={() => setHover(n.nodeId)} onMouseLeave={() => setHover(null)}
                                        onClick={() => openEvent(n)}
                                        style={{
                                            position: "absolute", left: n.x, top: n.y, width: NODE_W, height: NODE_H,
                                            textAlign: "left", padding: 14, borderRadius: 18, background: nodeBg(state),
                                            border: "2px solid var(--ink)",
                                            boxShadow: hover === n.nodeId ? "0 8px 0 var(--ink)" : "0 4px 0 var(--ink)",
                                            transform: hover === n.nodeId ? "translateY(-2px)" : "none",
                                            transition: "transform .15s, box-shadow .15s",
                                            cursor: ev ? "pointer" : "default", display: "flex", flexDirection: "column", gap: 6,
                                            fontFamily: "inherit", boxSizing: "border-box",
                                        }}>
                                        <div className="row" style={{ justifyContent: "space-between" }}>
                                            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".08em", padding: "3px 8px", borderRadius: 999, background: "var(--ink)", color: "white" }}>
                                                {kindLabel(ev, state)}
                                            </span>
                                            {ev && ev.genre && <span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>{ev.genre}</span>}
                                        </div>
                                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, lineHeight: 1.15, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
                                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
                                        {/* besucht = grüner Haken, angemeldet = blaue Uhr. */}
                                        {state === "visited" && (
                                            <div style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--ink)", display: "grid", placeItems: "center" }} title="Besucht">
                                                <Icons.Check size={12} style={{ color: "var(--ink)" }} />
                                            </div>
                                        )}
                                        {state === "registered" && (
                                            <div style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: "var(--pop-blue)", border: "2px solid var(--ink)", display: "grid", placeItems: "center" }} title="Angemeldet">
                                                <Icons.Clock size={12} style={{ color: "white" }} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventGraph;
