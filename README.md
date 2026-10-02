## Team
Team Leader: Kjell Bartinger
Members: Marc Seilz, Alexander Krun, Linus Brinkmann, Max Hannuschka, Dmytro Herus, Rostyslav Miroshnichenko

## Projekt starten

1. Installiere Docker Desktop Anwendung (https://www.docker.com/products/docker-desktop)
2. Installiere Node.js (https://nodejs.org/en/download)
3. In der Konsole im Root-Verzeichnis des Projektes folgendes ausführen

```bash
docker compose up --build
```
4. Front End starten

```bash
cd app/web-frontend
npm install
npm start
```

## Test-Daten anlegen

Backend muss laufen. Am Ende stehen alle E-Mails und Passwörter in der Konsole.

```bash
node scripts/create-testuser.mjs
```

Das Script legt an:

- **2 Veranstalter** (Clara Berg, Jonas Reuter) mit je 25 Events, also 50 insgesamt –
  3 pro Veranstalter liegen in der Vergangenheit und tauchen im Dashboard unter
  „beendet" auf, 22 sind kommend
- **5 Studierende**: Zeppenfeld, Sachweh, Hirsch (Accounts für unsere Professoren) und
  zwei Platzhalter (Max/Erika Mustermann) für uns
- für die drei Professoren-Accounts einen **gewachsenen Event-Graph**: 3 besuchte Events
  in der Vergangenheit als Pfad, dazu eine Anmeldung für ein kommendes Event
- **Bewertungen** zu den drei vergangenen Events von Clara Berg – Jonas Reuter bleibt
  bewusst ohne, damit der Unterschied im Dashboard sichtbar ist

Feedback geben alle Studierenden **außer Zeppenfeld** (Liste `OHNE_FEEDBACK` im Script).
Sein Account bleibt frei, damit sich das Abgeben einer Bewertung live vorführen lässt:
einloggen → ein besuchtes Event öffnen → „Feedback geben". Die Bewertung taucht sofort
bei Clara Berg unter „Zu den Bewertungen" auf (die Seite lädt alle 3 Sekunden neu).

Die beiden Platzhalter-Accounts bekommen einen **frischen, aber wachsenden Baum**: ihre
Startvorschläge sind zwei kommende Events. Tritt man einem bei, hängt der Graph zwei neue
Vorschläge an. (Vorher standen dort nur vergangene Termine, denen man nicht mehr beitreten
kann – Details im Kommentar bei Schritt 7 im Script.)

Die 44 kommenden Events sind bewusst dicht gestaffelt (+1 bis +80 Tage): jeder
Professoren-Account kann in der Präsentation **37–39 mal hintereinander** einem Event
beitreten, und der Graph wächst dabei mit neuen Vorschlägen weiter. Am Ende der Ausgabe
steht pro Account, welche Events gerade offen sind.

Die sechs vergangenen Events steuern den Event-Graph (siehe Kommentar im Script) – ihre
Anzahl und Termine bitte nicht ändern. Weitere Events kommen in die Tabelle
`weitereEvents`, dort gehören ausschließlich kommende Termine hinein.

Alle Termine liegen relativ zum Präsentationstag (Standard: 29.07.2026). Mehrfaches
Ausführen ist ungefährlich – vorhandene Accounts, Events und Anmeldungen werden erkannt.

```bash
GROWDENT_TEST_PASSWORD=meinPasswort node scripts/create-testuser.mjs   # anderes Passwort
GROWDENT_PRAESENTATION=2026-08-05 node scripts/create-testuser.mjs     # anderer Bezugstag
```

Am besten auf einer frischen Datenbank laufen lassen (`docker compose down -v`, dann
`docker compose up --build`). Liegen schon Events aus `testdaten.http` in der DB, lässt
sich der Event-Graph nicht mehr exakt steuern – das Script weicht dann auf Einladungen
aus und sagt das in der Ausgabe.

## Workflow
Wenn ihr jetzt Code ändert, dann macht es Sinn nur das zu kompilieren was ihr auch geändert habt (Wesentlich schneller)
Beispiel: Ihr ändert was am backend-main dann müsst ihr in der Konsole schreiben:
```bash
docker compose up --build backend-main
```
(Habt dabei immer die Logs im Docker Desktop auf, falls was nicht läuft)

Beim Front-End sollten eure Änderung Live geschaltet werden durch einen Seiten Reload.

## Vorraussetzungen

- Java 21
- Docker
- Node

## Befehle
PostgreSQL Terminal öffnen:
```bash
docker exec -it growdent-database-postgresql psql -U growdent -d growdent
```
