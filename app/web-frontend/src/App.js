import { useState } from "react";
import { BrowserRouter as Router, Route, Switch, useLocation } from 'react-router-dom';

import Navbar from "./components/Wiederverwendbare Komponenten/Navbar";
import Login from "./components/Login/Login";

import NichtGefunden from "./components/NichtGefunden/NichtGefunden";
import ProfilStudent from "./components/Profil Student/ProfilStudent";
import Einstellungen from "./components/Einstellungen/Einstellungen";
import AccountErstellen from "./components/Account Erstellen/AccountErstellen";
import Chats from "./components/Chats/Chats";
import EventGraph from "./components/Event Graph/EventGraph";
import EventUebersicht from "./components/Event Übersicht/EventUebersicht";
import EventDetail from "./components/Event Übersicht/Child-Components/EventDetail";
import FreundeUbersicht from "./components/Freunde Übersicht/FreundeUebersicht";
import MeineMiniEvents from "./components/Mini-Event als Student/MeineMiniEvents";
import VeranstalterDashboard from "./components/Veranstalter Dashboard/VeranstalterDashboard";
import EventBewertungen from "./components/Veranstalter Dashboard/EventBewertungen";
import FeedbackFenster from "./components/Feedback Fenster/FeedbackFenster";
import CreateEvent from "./components/Create Event/CreateEvent";

import { applyAccent, getSavedAccentId } from "./accentTheme";
import { applyTheme, getSavedTheme } from "./theme";

// Gespeicherte Akzentfarbe und Hell-/Dunkelmodus direkt beim Laden anwenden,
// bevor die App rendert (verhindert ein Aufblitzen der falschen Farben).
applyAccent(getSavedAccentId());
applyTheme(getSavedTheme());

// Zuordnung Pfad -> Anzeigename für die Breadcrumb in der Topbar.
const CRUMB_LABELS = {
  "/": "Events",
  "/eventOverview": "Events",
  "/eventGraph": "Event-Graph",
  "/miniEventAsStudent": "Mini-Events",
  "/studentProfile": "Profil",
  "/settings": "Einstellungen",
  "/organizerDashboard": "Veranstalter Dashboard",
  "/createEvent": "Event erstellen",
  "/chats": "Chats",
  "/friendsOverview": "Freunde",
  "/feedbackWindow": "Feedback",
  "/accountErstellen": "Registrieren",
};

function crumbFor(pathname) {
  if (pathname.startsWith("/eventOverview/")) return "Event-Details";
  if (pathname.startsWith("/eventRatings/")) return "Bewertungen";
  return CRUMB_LABELS[pathname] || "GrowDent";
}

function Topbar() {
  const { pathname } = useLocation();
  return (
    <header className="topbar">
      <div className="crumb">
        GrowDent <span style={{ margin: "0 8px", color: "var(--line)" }}>/</span>
        <b>{crumbFor(pathname)}</b>
      </div>
      <div className="topbar-spacer" />
    </header>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("currentUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [showRegister, setShowRegister] = useState(false);

  function handleLoginSuccess(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    setCurrentUser(user);
  }

  function handleLogout() {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  }

  if (!currentUser) {
    return (
      <div className="auth-shell">
        <div className="dot-bg" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />
        <div className="auth-inner">
          {showRegister ? (
            <>
              <AccountErstellen onFinish={() => setShowRegister(false)} />
              <div className="row" style={{ justifyContent: "center", marginTop: 24 }}>
                <button className="btn ghost" onClick={() => setShowRegister(false)}>
                  ← Zurück zum Login
                </button>
              </div>
            </>
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} onRegister={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Navbar currentUser={currentUser} />
        <main className="main">
          <Topbar />
          <div className="content">
            <Switch>
              <Route exact path="/">
                <EventUebersicht currentUser={currentUser} />
              </Route>
              <Route exact path="/chats">
                <Chats currentUser={currentUser} />
              </Route>
              <Route exact path="/eventGraph">
                <EventGraph currentUser={currentUser} />
              </Route>
              <Route exact path="/eventOverview">
                <EventUebersicht currentUser={currentUser} />
              </Route>
              <Route exact path="/eventOverview/:id">
                <EventDetail currentUser={currentUser} />
              </Route>
              <Route exact path="/feedbackWindow">
                <FeedbackFenster currentUser={currentUser} />
              </Route>
              <Route exact path="/friendsOverview">
                <FreundeUbersicht currentUser={currentUser} />
              </Route>
              <Route exact path="/miniEventAsStudent">
                <MeineMiniEvents currentUser={currentUser} />
              </Route>
              <Route exact path="/studentProfile">
                <ProfilStudent currentUser={currentUser} />
              </Route>
              <Route exact path="/settings">
                <Einstellungen currentUser={currentUser} onLogout={handleLogout} />
              </Route>
              <Route exact path="/organizerDashboard">
                <VeranstalterDashboard currentUser={currentUser} />
              </Route>
              <Route exact path="/eventRatings/:id">
                <EventBewertungen />
              </Route>
              <Route exact path="/createEvent">
                <CreateEvent currentUser={currentUser} />
              </Route>
              <Route exact path="/accountErstellen">
                <AccountErstellen />
              </Route>
              <Route path="*">
                <NichtGefunden />
              </Route>
            </Switch>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
