import { useState } from 'react';
import backendURL from '../../backendURL';

// Login-Screen im GrowDent-Design (siehe design-reference / index.css).
const Login = ({ onLoginSuccess, onRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        fetch(backendURL() + '/users/login', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        }).then(async (response) => {
            if (!response.ok) {
                const message = await response.text();
                setError(message || 'Login fehlgeschlagen.');
                return;
            }
            const user = await response.json();
            onLoginSuccess(user);
        }).catch(() => {
            setError('Verbindung zum Server fehlgeschlagen.');
        }).finally(() => {
            setIsSubmitting(false);
        });
    }

    return (
        <div className="screen-enter" style={{ maxWidth: 420, margin: "0 auto" }}>
            <div className="brand" style={{ justifyContent: "center", marginBottom: 20 }}>
                <div className="brand-mark">G</div>
                <div className="brand-name">Grow<span>Dent</span></div>
            </div>

            <div className="card" style={{ padding: 32 }}>
                <div className="h2" style={{ marginBottom: 6, textAlign: "center" }}>
                    Willkommen zurück 👋
                </div>
                <div className="muted" style={{ fontSize: 14, textAlign: "center", marginBottom: 24 }}>
                    Melde dich an, um weiterzumachen.
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                        <label className="field-label" htmlFor="email">Email</label>
                        <input className="input" type="email" id="email" value={email}
                            onChange={(e) => setEmail(e.target.value)} required
                            placeholder="z. B. jonas@tu-dortmund.de" />
                    </div>
                    <div>
                        <label className="field-label" htmlFor="password">Passwort</label>
                        <input className="input" type="password" id="password" value={password}
                            onChange={(e) => setPassword(e.target.value)} required
                            placeholder="••••••••" />
                    </div>

                    {error && (
                        <div className="chip pink" style={{ justifyContent: "center", padding: "8px 12px" }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn primary" disabled={isSubmitting}
                        style={{ justifyContent: "center", padding: "14px 18px" }}>
                        {isSubmitting ? "Wird eingeloggt…" : "Einloggen"}
                    </button>
                </form>
            </div>

            {onRegister && (
                <div className="muted" style={{ textAlign: "center", fontSize: 14, marginTop: 20 }}>
                    Noch keinen Account?{" "}
                    <button type="button" onClick={onRegister}
                        style={{
                            color: "var(--accent-deep)", fontWeight: 700, textDecoration: "underline",
                            background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit",
                        }}>
                        Registrieren
                    </button>
                </div>
            )}
        </div>
    );
};

export default Login;
