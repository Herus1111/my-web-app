import ScreenHeader from "../Wiederverwendbare Komponenten/ScreenHeader";
import DemoNote from "../Wiederverwendbare Komponenten/DemoNote";
import WipWrap from "../Wiederverwendbare Komponenten/WipWrap";
import InfoBlock from "../Wiederverwendbare Komponenten/InfoBlock";
import { MINI_EVENT } from "../../demoData";
import * as Icons from "../../icons";

const MiniEventAlsStudent = () => {
    const me = MINI_EVENT;
    const pct = Math.round((me.seats.taken / me.seats.total) * 100);
    return (
        <div className="screen-enter">
            <ScreenHeader
                title={me.title}
                subtitle="Mini-Events sind kleine Treffen, die Studierende selbst hosten."
                action={<span className="chip pink">🍳 Mini-Event</span>}
            />
            <DemoNote>Mini-Events sind noch nicht ans Backend angebunden – Beispieldaten zur Vorschau.</DemoNote>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 22 }}>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ height: 220, background: "linear-gradient(135deg, #FFE6F0, #FFD6E5)", display: "grid", placeItems: "center", fontSize: 72 }}>🍳</div>
                    <div style={{ padding: 28 }}>
                        <div style={{ fontSize: 16, marginBottom: 18, lineHeight: 1.5 }}>{me.desc}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <InfoBlock icon={<Icons.Pin size={16} />} label="Ort" value={me.location} />
                            <InfoBlock icon={<Icons.Clock size={16} />} label="Wann" value={me.when} />
                        </div>
                    </div>
                </div>

                <WipWrap label="bald verfügbar">
                    <div className="card popped" style={{ padding: 24 }}>
                        <div className="h3">Belegte Plätze</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 800, lineHeight: 1, marginTop: 8 }}>
                            {me.seats.taken}<span style={{ color: "var(--muted)" }}>/{me.seats.total}</span>
                        </div>
                        <div className="progress" style={{ marginTop: 14, height: 12 }}>
                            <span style={{ width: pct + "%", background: "var(--pop-pink)" }} />
                        </div>
                        <button className="btn primary" disabled style={{ width: "100%", marginTop: 18, justifyContent: "center", padding: 14 }}>
                            Teilnehmen
                        </button>
                    </div>
                </WipWrap>
            </div>
        </div>
    );
};

export default MiniEventAlsStudent;
