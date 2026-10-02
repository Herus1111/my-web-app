# GrowDent

GrowDent ist eine moderne Plattform zur Entdeckung, Organisation und Vernetzung rund um Events im universitären und städtischen Umfeld. Das System verbindet Teilnehmende und Veranstalter über interaktive Event-Graphen, ein intelligentes Empfehlungssystem und integrierte Community-Funktionen.

---

## Kernfunktionen & Features

### 1. Benutzerverwaltung & Authentifizierung
* **Registrierung & Login:** Getrennte Rollen und Workflows für Teilnehmende (Studierende) und Veranstalter mit rollenbasiertem Zugriffsschutz.
* **Profilverwaltung:** Individuelle Profileinstellungen, Historie besuchter Events, Level-Fortschritt und Definition persönlicher Interessen sowie Lieblingsgenres.
* **Veranstalter-Dashboard:** Zentrale Management-Oberfläche für Veranstalter zur Erstellung und Bearbeitung von Events, Einblick in Teilnehmerlisten, Echtzeit-Statistiken, Feedback und Budgetübersichten.

### 2. Intelligentes Empfehlungssystem (Event-Graph)
* **Dynamischer Empfehlungsbaum:** Statt unübersichtlicher statischer Listen visualisiert ein interaktiver Graph persönliche Event-Pfade basierend auf bisherigen Besuchen und Vorlieben.
* **Wachsender Graph:** Mit jeder Event-Teilnahme generiert der Empfehlungsalgorithmus neue maßgeschneiderte Vorschläge und erweitert den Graph in Echtzeit.
* **Events entdecken & beitreten:** Vollständige Detailansichten zu Events inklusive Mindestalter, Ticketpreisen, Location, Wetterinformationen und Restkapazitäten mit direkter Beitrittsfunktion.

### 3. Community & Interaktiver Chat
* **Echtzeit-Kommunikation:** Integrierter Chat für Teilnehmer und Veranstalter zum direkten Austausch vor, während und nach Veranstaltungen.
* **Vernetzung:** Finden von Gleichgesinnten mit ähnlichen Interessen für gemeinsame Event-Besuche.

### 4. Feedback & Bewertungssystem
* **Transparente Reviews:** Teilnehmende können nach Abschluss besuchter Events Bewertungen und detailliertes Feedback abgeben.
* **Live-Auswertung:** Veranstalter sehen neue Rezensionen fortlaufend in ihrem Dashboard zur kontinuierlichen Qualitätsverbesserung.

---

## Projekt starten

### Voraussetzungen
* Java 21
* Docker & Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
* Node.js ([Download](https://nodejs.org/en/download))

### 1. Gesamtsystem via Docker starten
Im Root-Verzeichnis des Repositories ausführen:

docker compose up --build
2. Frontend separat im Entwicklungsmodus starten
Falls Anpassungen am Frontend vorgenommen werden:

cd app/web-frontend
npm install
npm start
Test-Daten anlegen
Das Backend muss bereits laufen. Das Skript generiert realistische Testdatensätze für Veranstalter, Teilnehmende sowie gewachsene Event-Bäume:

node scripts/create-testuser.mjs
Am Ende des Skripts werden alle generierten E-Mails und Passwörter direkt in der Konsole ausgegeben.

Enthaltene Testdaten
2 Veranstalter: 50 Events insgesamt (vergangene Events für das Archiv und kommende Events für Live-Tests).

5 Teilnehmer-Accounts: Accounts mit vorkonfigurierten Event-Graphen, besuchten Events und Einladungen sowie Accounts mit unverzweigten Startvorschlägen für Neuanmeldungen.

Dynamische Graphen: Offene Events sind eng gestaffelt, sodass wiederholte Beitragsaktionen das adaptive Wachstum des Empfehlungsbaums demonstrieren.

Bewertungen & Feedback: Vorkonfigurierte Bewertungen für Feedback-Tests im Veranstalter-Dashboard.

Optionale Parameter:

# Eigenes Standard-Passwort für Testaccounts vergeben
GROWDENT_TEST_PASSWORD=meinPasswort node scripts/create-testuser.mjs

# Anderen Bezugstag festlegen
GROWDENT_PRAESENTATION=2026-10-15 node scripts/create-testuser.mjs
Hinweis: Für eine saubere Generierung des Empfehlungsbaums empfiehlt sich eine leere Datenbank:

docker compose down -v
docker compose up --build
Entwickler-Workflow
Um Änderungen im Backend schnell zu kompilieren, ohne das gesamte Stack neu zu bauen:

docker compose up --build backend-main
Änderungen am Frontend werden dank Hot-Reloading direkt bei geöffnetem Browserfenster wirksam.

Nützliche Befehle
PostgreSQL-Datenbankterminal direkt im Container öffnen:

docker exec -it growdent-database-postgresql psql -U growdent -d growdent
