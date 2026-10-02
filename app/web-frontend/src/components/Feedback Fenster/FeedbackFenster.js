import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import backendURL from "../../backendURL";
import ScreenHeader from "../Wiederverwendbare Komponenten/ScreenHeader";
import * as Icons from "../../icons";

// Sterne-Auswahl (1-5).
const StarRating = ({ value, onChange }) => (
    <div className="row" style={{ gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => onChange(n)}
                style={{ padding: 4, fontSize: 36, lineHeight: 1, color: n <= value ? "var(--pop-yellow)" : "var(--line)" }}>
                ★
            </button>
        ))}
    </div>
);

const FeedbackFenster = ({ currentUser }) => {
    // Das Feedback bezieht sich immer auf ein konkretes Event – die Id kommt als
    // Query-Parameter aus der Event-Detail-Seite (…/feedbackWindow?eventId=1).
    const query = new URLSearchParams(useLocation().search);
    const eventId = query.get("eventId") ? Number(query.get("eventId")) : null;

    const [eventrating, setEventrating] = useState(0);
    const [socializingRating, setSocializingRating] = useState(0);
    const [recommendation, setRecommendation] = useState(5);
    const [userLiked, setUserLiked] = useState("");
    const [userDisliked, setUserDisliked] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);
        const feedback = {
            userLiked,
            userDisliked,
            recommendation,
            socializingRating,
            eventrating,
            eventId,
            username: currentUser?.username || null,
        };
        fetch(backendURL() + "/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(feedback)
        }).then(async (response) => {
            if (!response.ok) {
                setError((await response.text()) || "Feedback konnte nicht gespeichert werden.");
                return;
            }
            setSubmitted(true);
        }).catch(() => {
            setError("Verbindung zum Server fehlgeschlagen.");
        }).finally(() => {
            setIsSubmitting(false);
        });
    }

    if (submitted) {
        return (
            <div className="screen-enter" style={{ display: "grid", placeItems: "center", minHeight: 480 }}>
                <div className="card popped" style={{ padding: 40, textAlign: "center", maxWidth: 440 }}>
                    <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
                    <div className="h2" style={{ marginBottom: 10 }}>Danke für dein Feedback!</div>
                    <div className="muted" style={{ fontSize: 15, marginBottom: 24 }}>
                        Deine Bewertung hilft, Events besser zu machen.
                    </div>
                    <Link className="btn primary" to="/eventOverview">Zu den Events →</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="screen-enter">
            <ScreenHeader
                title="Feedback"
                subtitle="Dein Feedback hilft anderen, das richtige Event zu finden."
            />
            <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
                <div className="card" style={{ padding: 28 }}>
                    <div className="h3" style={{ marginBottom: 12 }}>Gesamtbewertung des Events *</div>
                    <StarRating value={eventrating} onChange={setEventrating} />

                    <div className="h3" style={{ marginTop: 24, marginBottom: 12, fontSize: 16 }}>Wie gut konntest du neue Leute kennenlernen?</div>
                    <StarRating value={socializingRating} onChange={setSocializingRating} />

                    <div className="row" style={{ justifyContent: "space-between", marginTop: 24, marginBottom: 8 }}>
                        <label className="field-label" htmlFor="recommendation" style={{ marginBottom: 0 }}>
                            Weiterempfehlung
                        </label>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>
                            {recommendation}/10
                        </span>
                    </div>
                    <input id="recommendation" type="range" min="1" max="10" step="1" value={recommendation}
                        onChange={(e) => setRecommendation(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--accent)" }} />

                    <label className="field-label" htmlFor="liked" style={{ marginTop: 24 }}>Was hat dir gefallen?</label>
                    <textarea id="liked" className="input" value={userLiked}
                        placeholder="Stimmung war top, viele neue Leute…"
                        onChange={(e) => setUserLiked(e.target.value)}
                        style={{ minHeight: 80, resize: "vertical", marginBottom: 16 }} />

                    <label className="field-label" htmlFor="disliked">Was hat dir nicht gefallen?</label>
                    <textarea id="disliked" className="input" value={userDisliked}
                        placeholder="Location war etwas laut…"
                        onChange={(e) => setUserDisliked(e.target.value)}
                        style={{ minHeight: 80, resize: "vertical" }} />

                    {error && <p style={{ color: "var(--pop-pink)", fontSize: 13, marginTop: 14 }}>{error}</p>}

                    <button type="submit" className="btn primary" disabled={eventrating === 0 || isSubmitting}
                        style={{ marginTop: 22, padding: "14px 22px" }}>
                        {isSubmitting ? "Wird gesendet…" : <>Feedback abschicken <Icons.ArrowRight size={14} /></>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FeedbackFenster;
