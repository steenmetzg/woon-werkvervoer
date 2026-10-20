# Specificatie: Woon-werkvervoer registreren

Status: **goedgekeurd door Greco op 20 oktober 2026**
Versie: 1.0 (20 oktober 2026): installeerbare progressive web app die ook offline werkt, op verzoek van Greco

## 1. Doel

Een eenvoudige webapp waarmee je per doordeweekse dag (maandag t/m vrijdag)
met één tik vastlegt hoe je naar je werk bent gegaan. Werktijden spelen geen rol.
Greco gaat de app echt gebruiken, vooral op zijn telefoon.

## 2. Gebruiker

Eén persoon (Greco) die de app op zijn telefoon gebruikt, via een snelkoppeling op het beginscherm. Geen accounts of inlog.

## 3. Begrippen

- **Keuze**: precies één van deze vijf keuzes per dag, altijd in deze volgorde:
  Thuis, Trein, Fiets, Auto, Vrij. Elk heeft een eigen strak lijnicoon (huis, trein, fiets, auto, palmboom).
  "Vrij" gebruik je voor een vrije dag, zoals vakantie of een feestdag.
- **Werkdag**: maandag t/m vrijdag. Zaterdag en zondag worden niet getoond.

## 4. Functies

| Nr | Functie | Omschrijving |
|----|---------|--------------|
| F1 | Weekoverzicht | Het scherm toont één week: vijf regels, maandag t/m vrijdag, elk met datum (bijv. "ma 20 okt"). Bij openen is dat de huidige week. |
| F2 | Vervoer kiezen | Elke dag heeft vijf knoppen (Thuis, Trein, Fiets, Auto, Vrij). Eén klik legt de keuze vast; de gekozen knop is duidelijk gemarkeerd. |
| F3 | Keuze wijzigen of wissen | Klik op een andere knop om de keuze te veranderen. Klik op de al gekozen knop om de keuze te wissen. |
| F4 | Bladeren | Knoppen "◀ Vorige week" en "Volgende week ▶" en een knop "Deze week" om terug te springen. Op een aanraakscherm kan het ook met swipen: naar links swipen gaat naar de volgende week, naar rechts swipen naar de vorige week. |
| F5 | Vandaag herkennen | De regel van vandaag is visueel gemarkeerd, zodat je in één oogopslag ziet waar je moet klikken. |
| F6 | ~~Weektotalen~~ | Vervallen in versie 0.9: Greco vond ze niet nuttig. |
| F7 | Onthouden | Alle keuzes blijven bewaard na verversen of het sluiten van de browser (opslag op de telefoon zelf). |
| F9 | Instellingen | Een tandwielknop rechtsboven opent het scherm "Instellingen en backup". Een knop "Terug" brengt je weer naar de week. |
| F10 | Backupmap kiezen | In de instellingen kies je met de mappenkiezer van je telefoon een map waar backups worden opgeslagen en waaruit ze worden ingelezen. De app onthoudt die map en toont de naam. |
| F11 | Backup maken | De knop "Backup maken" slaat alle ingevulde dagen op als één bestand in de backupmap, met de datum in de naam, bijvoorbeeld `woon-werkvervoer-backup-2026-10-20.json`. Is er geen map gekozen of kan de telefoon geen map onthouden, dan komt het bestand in de map Downloads. |
| F12 | Backup inlezen | De knop "Backup inlezen" opent de bestandskiezer in de backupmap, zodat je een specifieke backup kiest. Na een bevestiging vervangt de inhoud van de backup alle huidige keuzes. Een bestand dat geen geldige backup is, wordt geweigerd met een duidelijke melding en verandert niets. |
| F8 | Installeren | De app is een progressive web app (PWA): Chrome biedt "App installeren" aan, waarna de app als gewone app tussen je apps staat en schermvullend opent, zonder adresbalk. |
| F13 | Offline gebruiken | Na de eerste keer openen werkt de app ook zonder internetverbinding: openen, kiezen, bladeren, instellingen en backups. |
| F14 | Updates | Staat er een nieuwe versie online, dan haalt de app die op de achtergrond op zodra er internet is. De nieuwe versie is actief de volgende keer dat je de app opent. |

## 5. Acceptatiecriteria

Deze criteria worden ook als automatische tests in de code opgenomen.

- **AC1 (F1)** Bij openen zie ik vijf dagen, maandag t/m vrijdag van de huidige week, met de juiste datums. Zaterdag en zondag staan er niet bij.
- **AC2 (F2)** Als ik bij dinsdag op "Fiets" klik, is "Fiets" bij dinsdag gemarkeerd en de andere drie knoppen van dinsdag niet.
- **AC2b (F2)** Elke dag toont de knoppen in de volgorde Thuis, Trein, Fiets, Auto, Vrij.
- **AC3 (F2)** Een keuze bij de ene dag verandert niets aan de andere dagen.
- **AC4 (F3)** Als dinsdag "Fiets" heeft en ik klik op "Trein", heeft dinsdag "Trein".
- **AC5 (F3)** Als dinsdag "Fiets" heeft en ik klik nogmaals op "Fiets", heeft dinsdag geen keuze meer.
- **AC6 (F4)** Na "Volgende week" zie ik de maandag t/m vrijdag van de week erna; na "Deze week" zie ik weer de huidige week. Keuzes in een andere week blijven bewaard als ik terugblader.
- **AC6b (F4)** Als ik over het scherm minstens 50 pixels naar links swipe, zie ik de volgende week; naar rechts swipen toont de vorige week. Een korte of vooral verticale beweging (zoals scrollen) wisselt niet van week, en een gewone tik op een knop blijft gewoon een keuze.
- **AC7 (F5)** Op een werkdag is de regel van vandaag gemarkeerd; in een andere week is geen regel gemarkeerd.
- **AC8 (F6)** Onder de week staan geen weektotalen meer.
- **AC9 (F7)** Na het verversen van de pagina staan alle keuzes er nog.
- **AC10 (F8)** De app heeft een naam, een eigen icoon en een app-manifest, zodat "Zet op beginscherm" een schermvullende app oplevert.
- **AC11 (ontwerp)** Op een telefoonscherm van 360 pixels breed past alles zonder zijwaarts scrollen, en elke knop is minstens 44 pixels hoog, zodat hij makkelijk met een duim te raken is.
- **AC13 (F9)** Met de tandwielknop open ik de instellingen; met "Terug" zie ik weer dezelfde week.
- **AC14 (F10)** Na het kiezen van een map toont de instelling de naam van die map, ook nadat de app opnieuw is geopend.
- **AC15 (F11)** "Backup maken" schrijft een bestand `woon-werkvervoer-backup-JJJJ-MM-DD.json` met alle ingevulde dagen in de gekozen map, en meldt waar het staat. Zonder gekozen map wordt hetzelfde bestand gedownload.
- **AC16 (F12)** Na het inlezen van een backup toont de app precies de keuzes uit dat bestand; keuzes die niet in de backup staan zijn weg. Bij een ongeldig bestand verschijnt een melding en blijven de huidige keuzes ongewijzigd. Als ik de bevestiging annuleer, verandert er niets.
- **AC17 (F13)** Als de app één keer met internet is geopend, opent hij daarna ook zonder internetverbinding volledig, en kun je keuzes maken die bewaard blijven.
- **AC18 (F8)** De app heeft een geldig app-manifest en een service worker, zodat Chrome hem als installeerbare app herkent.
- **AC12 (ontwerp)** Op een scherm van 360 bij 640 pixels (een Samsung S25 is 360 pixels breed; 640 pixels hoog laat ruimte voor adresbalk en systeembalken) zijn de titel, de weeknavigatie en alle vijf dagen met hun knoppen volledig te zien zonder te scrollen.

## 6. Ontwerp

Strak, modern en minimalistisch. Geen toeters en bellen.

- **Rustig**: witte achtergrond, donkergrijze tekst, één accentkleur (diep blauw) voor de gekozen knop en de markering van vandaag. Geen verlopen, schaduwen of animaties, alleen een subtiele overgang bij klikken.
- **Typografie**: het standaard systeemlettertype van het apparaat (zoals San Francisco of Segoe UI), in twee groottes: een titel en normale tekst.
- **Knoppen**: een strak lijnicoon met de naam eronder, zodat elk vervoermiddel direct herkenbaar is. Dunne rand en afgeronde hoeken. De gekozen knop is gevuld met de accentkleur en witte tekst.
- **Indeling**: smalle kolom gecentreerd op het scherm, compact in de hoogte zodat de hele week in één scherm past, dunne lijnen als scheiding tussen de dagen. Bovenaan staan de titel met rechts de tandwielknop, en daaronder de weeknavigatie met "Deze week". De week staat er kort, bijv. "19 – 23 okt"; het jaartal verschijnt alleen bij een week in een ander jaar.
- **Mobiel eerst**: ontworpen voor een telefoonscherm, met grote knoppen voor je duim; de vijf knoppen passen naast elkaar. Op een groter scherm blijft het een smalle kolom.
- **Geen extra's**: geen logo, geen afbeeldingen, geen pop-ups. Uitzonderingen: de bevestigingsvraag voor het inlezen van een backup (die vervangt immers alles), en de mappen- en bestandskiezer van de telefoon zelf. Meldingen over backups verschijnen als korte regel tekst in het instellingenscherm.

## 7. Buiten scope (versie 1)

Werktijden, kilometers of kosten, maand- of jaaroverzichten, exporteren naar
Excel, automatisch herkennen van feestdagen of vakantie, weekenddagen, accounts, synchroniseren tussen
apparaten.

## 8. Techniek

- **React** (gebruikersinterface) en **Vite** (ontwikkel- en bouwtool)
- **Vitest** en **React Testing Library** (automatische tests van de acceptatiecriteria)
- **Lucide** (`lucide-react`) voor de iconen: een veelgebruikte open source iconenset met strakke lijniconen en miljoenen downloads per week.
- Geen andere bibliotheken (ook geen CSS-framework, de vormgeving is gewone CSS); datums worden met standaard JavaScript berekend.
- Opslag via `localStorage` van de browser, dus geen server of database. Let op: de gegevens staan alleen op die ene telefoon; als je de browsergegevens wist, zijn ze weg.
- Backupmap: via de File System Access API van de browser (Chrome op Android vanaf versie 132). De gekozen map wordt onthouden in IndexedDB van de browser. Chrome kan bij het eerste gebruik na het openen van de app opnieuw om toestemming voor de map vragen; dat is een beveiliging van de browser zelf. Android staat niet toe dat de hoofdmap van Downloads of de hele telefoon wordt gekozen, dus kies een eigen map, bijvoorbeeld `Documents/Woon-werkvervoer`.
- Backupbestand: JSON met de velden `app` (`"woon-werkvervoer"`), `versie` (1), `gemaakt` (datum en tijd) en `registraties` (per datum de keuze, bijv. `"2026-10-20": "fiets"`).
- Offline en installeren: **vite-plugin-pwa** (met Workbox van Google, beide veelgebruikt en open source) maakt een service worker die alle bestanden van de app op de telefoon bewaart.
- Online zetten als statische website, zodat de telefoon de app kan openen (de manier van hosten wordt apart gekozen).

## 9. Oplevering

- Broncode in deze map (`/mnt/project-files/eerste-webapp/`), zonder `node_modules`.
- Een `README.md` met uitleg hoe je de app start.
- Alle acceptatiecriteria hebben een geslaagde automatische test.
