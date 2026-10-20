# Specificatie: Woon-werkvervoer registreren

Status: **goedgekeurd door Greco op 20 oktober 2026**
Versie: 0.5 (20 oktober 2026)

## 1. Doel

Een eenvoudige webapp waarmee je per doordeweekse dag (maandag t/m vrijdag)
met één tik vastlegt hoe je naar je werk bent gegaan. Werktijden spelen geen rol.
Greco gaat de app echt gebruiken, vooral op zijn telefoon.

## 2. Gebruiker

Eén persoon (Greco) die de app op zijn telefoon gebruikt, via een snelkoppeling op het beginscherm. Geen accounts of inlog.

## 3. Begrippen

- **Vervoermiddel**: precies één van deze vier keuzes per dag:
  Trein, Fiets, Auto, Thuis. Elk heeft een eigen strak lijnicoon (trein, fiets, auto, huis).
- **Werkdag**: maandag t/m vrijdag. Zaterdag en zondag worden niet getoond.

## 4. Functies

| Nr | Functie | Omschrijving |
|----|---------|--------------|
| F1 | Weekoverzicht | Het scherm toont één week: vijf regels, maandag t/m vrijdag, elk met datum (bijv. "ma 20 okt"). Bij openen is dat de huidige week. |
| F2 | Vervoer kiezen | Elke dag heeft vier knoppen (Trein, Fiets, Auto, Thuis). Eén klik legt de keuze vast; de gekozen knop is duidelijk gemarkeerd. |
| F3 | Keuze wijzigen of wissen | Klik op een andere knop om de keuze te veranderen. Klik op de al gekozen knop om de keuze te wissen. |
| F4 | Bladeren | Knoppen "◀ Vorige week" en "Volgende week ▶" en een knop "Deze week" om terug te springen. |
| F5 | Vandaag herkennen | De regel van vandaag is visueel gemarkeerd, zodat je in één oogopslag ziet waar je moet klikken. |
| F6 | Weektotalen | Onder de week staat per vervoermiddel hoeveel dagen het gekozen is, bijvoorbeeld "Trein 2 · Fiets 1 · Auto 0 · Thuis 2". |
| F7 | Onthouden | Alle keuzes blijven bewaard na verversen of het sluiten van de browser (opslag op de telefoon zelf). |
| F8 | Op beginscherm | De app kan via "Zet op beginscherm" als icoon op de telefoon worden gezet en opent dan schermvullend, zonder adresbalk, net als een gewone app. |

## 5. Acceptatiecriteria

Deze criteria worden ook als automatische tests in de code opgenomen.

- **AC1 (F1)** Bij openen zie ik vijf dagen, maandag t/m vrijdag van de huidige week, met de juiste datums. Zaterdag en zondag staan er niet bij.
- **AC2 (F2)** Als ik bij dinsdag op "Fiets" klik, is "Fiets" bij dinsdag gemarkeerd en de andere drie knoppen van dinsdag niet.
- **AC3 (F2)** Een keuze bij de ene dag verandert niets aan de andere dagen.
- **AC4 (F3)** Als dinsdag "Fiets" heeft en ik klik op "Trein", heeft dinsdag "Trein".
- **AC5 (F3)** Als dinsdag "Fiets" heeft en ik klik nogmaals op "Fiets", heeft dinsdag geen keuze meer.
- **AC6 (F4)** Na "Volgende week" zie ik de maandag t/m vrijdag van de week erna; na "Deze week" zie ik weer de huidige week. Keuzes in een andere week blijven bewaard als ik terugblader.
- **AC7 (F5)** Op een werkdag is de regel van vandaag gemarkeerd; in een andere week is geen regel gemarkeerd.
- **AC8 (F6)** Met de keuzes Trein, Trein, Fiets, Thuis en een lege dag toont de week "Trein 2 · Fiets 1 · Auto 0 · Thuis 1".
- **AC9 (F7)** Na het verversen van de pagina staan alle keuzes er nog.
- **AC10 (F8)** De app heeft een naam, een eigen icoon en een app-manifest, zodat "Zet op beginscherm" een schermvullende app oplevert.
- **AC11 (ontwerp)** Op een telefoonscherm van 360 pixels breed past alles zonder zijwaarts scrollen, en elke knop is minstens 44 pixels hoog, zodat hij makkelijk met een duim te raken is.

## 6. Ontwerp

Strak, modern en minimalistisch. Geen toeters en bellen.

- **Rustig**: witte achtergrond, donkergrijze tekst, één accentkleur (diep blauw) voor de gekozen knop en de markering van vandaag. Geen verlopen, schaduwen of animaties, alleen een subtiele overgang bij klikken.
- **Typografie**: het standaard systeemlettertype van het apparaat (zoals San Francisco of Segoe UI), in twee groottes: een titel en normale tekst.
- **Knoppen**: een strak lijnicoon met de naam eronder, zodat elk vervoermiddel direct herkenbaar is. Dunne rand en afgeronde hoeken. De gekozen knop is gevuld met de accentkleur en witte tekst.
- **Indeling**: smalle kolom gecentreerd op het scherm, ruime witruimte tussen de dagen, dunne lijnen als scheiding.
- **Mobiel eerst**: ontworpen voor een telefoonscherm, met grote knoppen voor je duim; de vier knoppen passen naast elkaar. Op een groter scherm blijft het een smalle kolom.
- **Geen extra's**: geen logo, geen afbeeldingen, geen meldingen of pop-ups.

## 7. Buiten scope (versie 1)

Werktijden, kilometers of kosten, maand- of jaaroverzichten, exporteren naar
Excel, feestdagen of vakantie, weekenddagen, accounts, synchroniseren tussen
apparaten, werken zonder internetverbinding.

## 8. Techniek

- **React** (gebruikersinterface) en **Vite** (ontwikkel- en bouwtool)
- **Vitest** en **React Testing Library** (automatische tests van de acceptatiecriteria)
- **Lucide** (`lucide-react`) voor de iconen: een veelgebruikte open source iconenset met strakke lijniconen en miljoenen downloads per week.
- Geen andere bibliotheken (ook geen CSS-framework, de vormgeving is gewone CSS); datums worden met standaard JavaScript berekend.
- Opslag via `localStorage` van de browser, dus geen server of database. Let op: de gegevens staan alleen op die ene telefoon; als je de browsergegevens wist, zijn ze weg.
- Online zetten als statische website, zodat de telefoon de app kan openen (de manier van hosten wordt apart gekozen).

## 9. Oplevering

- Broncode in deze map (`/mnt/project-files/eerste-webapp/`), zonder `node_modules`.
- Een `README.md` met uitleg hoe je de app start.
- Alle acceptatiecriteria hebben een geslaagde automatische test.
