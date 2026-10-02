import { useState } from 'react';
import backendURL from '../../../backendURL';
import * as Icons from '../../../icons';

// Registrierungsformular für einen konkreten Account-Typ (Student/Veranstalter).
// Die Rolle wird von der übergeordneten Onboarding-Komponente per Prop gesetzt.
const CreateUser = ({ role = 'STUDENT', onBack, onSuccess }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isStudent = role === 'STUDENT';

    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        const user = { firstName, lastName, email, password, username };
        const endpoint = isStudent ? '/users/student' : '/users/veranstalter';
        fetch(backendURL() + endpoint, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        }).then(async (response) => {
            if (!response.ok) {
                const message = await response.text();
                setError(message || 'Anlegen des Accounts fehlgeschlagen.');
                return;
            }
            onSuccess && onSuccess({ firstName, username, role });
        }).catch(() => {
            setError('Verbindung zum Server fehlgeschlagen.');
        }).finally(() => {
            setIsSubmitting(false);
        });
    }

    return (
        <div className="card" style={{ padding: 32 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
                <div className="h3">{isStudent ? "Dein Studenten-Profil 🎓" : "Dein Veranstalter-Profil 🎪"}</div>
                <span className={"chip " + (isStudent ? "green" : "yellow")}>
                    {isStudent ? "Student" : "Veranstalter"}
                </span>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                        <label className="field-label" htmlFor="firstName">Vorname</label>
                        <input className="input" id="firstName" type="text" value={firstName}
                            onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="field-label" htmlFor="lastName">Nachname</label>
                        <input className="input" id="lastName" type="text" value={lastName}
                            onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                </div>

                <label className="field-label" htmlFor="email">Email</label>
                <input className="input" id="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: 16 }} />

                <label className="field-label" htmlFor="username">Anzeigename</label>
                <input className="input" id="username" type="text" value={username}
                    onChange={(e) => setUsername(e.target.value)} required style={{ marginBottom: 16 }} />

                <label className="field-label" htmlFor="password">Passwort</label>
                <input className="input" id="password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required style={{ marginBottom: 16 }} />

                {error && <p style={{ color: "var(--pop-pink)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

                <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
                    <button type="button" className="btn ghost" onClick={onBack}>← Rolle ändern</button>
                    <button type="submit" className="btn primary" disabled={isSubmitting}>
                        {isSubmitting ? "Wird erstellt…" : <>Account erstellen <Icons.ArrowRight size={14} /></>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;
