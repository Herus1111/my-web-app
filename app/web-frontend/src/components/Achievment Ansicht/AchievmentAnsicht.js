import ScreenHeader from "../Wiederverwendbare Komponenten/ScreenHeader";
import DemoNote from "../Wiederverwendbare Komponenten/DemoNote";
import WipWrap from "../Wiederverwendbare Komponenten/WipWrap";
import { ACHIEVEMENTS } from "../../demoData";
import * as Icons from "../../icons";

const AchievmentAnsicht = () => {
    const earned = ACHIEVEMENTS.filter((a) => a.earned);
    const pending = ACHIEVEMENTS.filter((a) => !a.earned);
    const earnedPoints = earned.reduce((s, a) => s + a.points, 0);

    return (
        <div className="screen-enter">
            <ScreenHeader
                title="Achievements"
                subtitle={earned.length + " / " + ACHIEVEMENTS.length + " freigeschaltet"}
                action={<span className="chip green">+{earnedPoints} PKT verdient</span>}
            />
            <DemoNote>Achievements sind noch nicht ans Backend angebunden – Beispieldaten zur Vorschau.</DemoNote>

            <WipWrap label="Demo">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
                    {earned.map((a) => (
                        <div key={a.id} className="card popped" style={{ padding: 18, background: "linear-gradient(135deg, var(--paper), #FFF6D6)" }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--paper)", border: "1px solid var(--line)", display: "grid", placeItems: "center", fontSize: 32 }}>{a.icon}</div>
                            <div className="h3" style={{ marginTop: 12, fontSize: 17 }}>{a.name}</div>
                            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{a.desc}</div>
                            <div className="row" style={{ justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px dashed var(--line)" }}>
                                <span className="chip green">+{a.points} PKT</span>
                                <Icons.Check size={18} style={{ color: "var(--accent)" }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="h3" style={{ marginBottom: 14 }}>⏳ Noch ausstehend · {pending.length}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                    {pending.map((a) => (
                        <div key={a.id} className="card" style={{ padding: 18 }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--bg)", display: "grid", placeItems: "center", fontSize: 32, filter: "grayscale(0.6)", opacity: 0.7 }}>{a.icon}</div>
                            <div className="h3" style={{ marginTop: 12, fontSize: 17 }}>{a.name}</div>
                            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{a.desc}</div>
                            <div style={{ marginTop: 14 }}>
                                <div className="row" style={{ justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                                    <span className="muted">Fortschritt</span>
                                    <span>{a.progress}/{a.total}</span>
                                </div>
                                <div className="progress" style={{ height: 8 }}><span style={{ width: (a.progress / a.total * 100) + "%" }} /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </WipWrap>
        </div>
    );
};

export default AchievmentAnsicht;
