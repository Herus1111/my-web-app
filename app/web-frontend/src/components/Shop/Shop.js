import ScreenHeader from "../Wiederverwendbare Komponenten/ScreenHeader";
import DemoNote from "../Wiederverwendbare Komponenten/DemoNote";
import WipWrap from "../Wiederverwendbare Komponenten/WipWrap";
import { SHOP, ME } from "../../demoData";
import * as Icons from "../../icons";

const Shop = () => {
    return (
        <div className="screen-enter">
            <ScreenHeader
                title="Punkte-Shop"
                action={
                    <div className="card" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                        <Icons.Coin size={18} style={{ color: "var(--pop-yellow)" }} />
                        <div>
                            <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Deine Punkte</div>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>{ME.points}</div>
                        </div>
                    </div>
                }
            />
            <DemoNote>Der Shop ist noch nicht ans Backend angebunden – Artikel und Punkte sind Beispieldaten.</DemoNote>

            <WipWrap label="Demo">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                    {SHOP.map((s) => (
                        <div key={s.id} className="card" style={{ padding: 22 }}>
                            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--bg)", display: "grid", placeItems: "center", fontSize: 32 }}>{s.icon}</div>
                                <div className="chip yellow">{s.cost} PKT</div>
                            </div>
                            <div className="h3" style={{ fontSize: 17, marginBottom: 14 }}>{s.name}</div>
                            <button className="btn primary" disabled style={{ width: "100%", justifyContent: "center" }}>
                                <Icons.Plus size={14} /> Einlösen
                            </button>
                        </div>
                    ))}
                </div>
            </WipWrap>
        </div>
    );
};

export default Shop;
