# Specificatie: Woon-werkvervoer registreren

Status: **goedgekeurd door Greco op 20 oktober 2026**
Versie: 1.7 (20 oktober 2026): vraag om de app te installeren, op verzoek van Greco (app-versie WoonWerk 1.2)

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
- **Vervoervorm aan of uit**: in de instellingen bepaal je welke keuzes je gebruikt. Thuis staat altijd aan.
  Een keuze die uit staat, zie je nergens in de app (zie F17).
- **Werkdag**: maandag t/m vrijdag. Zaterdag en zondag worden niet getoond.

## 4. Functies

| Nr | Functie | Omschrijving |
|----|---------|--------------|
| F1 | Weekoverzicht | Het scherm toont één week: vijf regels, maandag t/m vrijdag, elk met datum (bijv. "ma 20 okt"). Bij openen is dat de huidige week. |
| F2 | Vervoer kiezen | Elke dag heeft een knop voor elke keuze die aan staat (standaard alle vijf: Thuis, Trein, Fiets, Auto, Vrij), in de vaste volgorde. De knoppen die er zijn, verdelen samen de hele breedte. Eén klik legt de keuze vast; de gekozen knop is duidelijk gemarkeerd. |
| F3 | Keuze wijzigen of wissen | Klik op een andere knop om de keuze te veranderen. Klik op de al gekozen knop om de keuze te wissen. |
| F4 | Bladeren | Knoppen "◀ Vorige week" en "Volgende week ▶" en een knop "Deze week" om terug te springen. Op een aanraakscherm kan het ook met swipen: naar links swipen gaat naar de volgende week, naar rechts swipen naar de vorige week. |
| F5 | Vandaag herkennen | De regel van vandaag is visueel gemarkeerd, zodat je in één oogopslag ziet waar je moet klikken. |
| F6 | ~~Weektotalen~~ | Vervallen in versie 0.9: Greco vond ze niet nuttig. |
| F7 | Onthouden | Alle keuzes blijven bewaard na verversen of het sluiten van de browser (opslag op de telefoon zelf). |
| F9 | Instellingen | Een tandwielknop rechtsboven opent het scherm "Instellingen en backup". Een knop "Terug" brengt je weer naar de week. |
| F10 | Backupmap kiezen | In de instellingen kies je met de mappenkiezer van je telefoon een map waar backups worden opgeslagen en waaruit ze worden ingelezen. De app onthoudt die map en toont de naam. |
| F11 | Backup maken | De knop "Backup maken" slaat alle ingevulde dagen op als één bestand in de backupmap, met de datum in de naam, bijvoorbeeld `woon-werkvervoer-backup-2026-10-20.json`. Is er geen map gekozen of kan de telefoon geen map onthouden, dan komt het bestand in de map Downloads. |
| F12 | Backup inlezen | De knop "Backup inlezen" opent de bestandskiezer in de backupmap, zodat je een specifieke backup kiest. Na een bevestiging vervangt de inhoud van de backup alle huidige keuzes. Een bestand dat geen geldige backup is, wordt geweigerd met een duidelijke melding en verandert niets. |
| F15 | Overzicht thuiswerkvergoeding | Een knop met het thuis-icoon rechtsboven, naast het tandwiel, opent het scherm "Overzicht thuiswerkvergoeding". Het toont standaard alle dagen waarop Thuis is gekozen, van precies 3 maanden geleden tot en met vandaag (op 20 oktober dus vanaf 20 juli; bestaat die dag niet, zoals 31 februari, dan de laatste dag van die maand). Bovenaan staan het thuis-icoon, de vanaf-datum en de tot-datum. Daaronder staan heel compact de datums in kolommen: elke kalendermaand een eigen kolom (meestal 4, omdat de periode in een maand halverwege begint; Greco koos hiervoor boven precies 3 kolommen), de oudste maand links, met de maandnaam erboven. Een maand zonder thuisdagen toont een streepje. Opmaak: de vanaf- en tot-datum in kleinere tekst, met de labels uitgelijnd met de titel van het overzicht; het pijltje van de terugknop en het thuis-icoon staan links precies gelijk met de eerste kolom (de terugknop is daarom een los pijltje zonder rand, ook in de instellingen); de maandnamen met een hoofdletter (bijv. "Augustus") en iets groter dan de datums; alle kolommen even breed. "Terug" brengt je weer naar de week. |
| F16 | Overzicht auto | Precies hetzelfde overzicht als F15, maar voor de dagen waarop Auto is gekozen. Een knop met het auto-icoon rechtsboven, tussen het thuis-icoon en het tandwiel, opent het scherm "Overzicht auto". Zelfde periode, indeling en opmaak, met het auto-icoon bovenaan. |
| F17 | Vervoervormen aan/uit | In de instellingen staat bovenaan het onderdeel "Vervoervormen" met dezelfde vijf knoppen (icoon met naam) als bij een dag. Een knop die aan staat is gevuld met de accentkleur; tik erop om hem uit te zetten (dan is hij wit met een rand), en nog eens tikken zet hem weer aan. Thuis staat altijd aan en is een inactieve knop: er gebeurt niets als je erop tikt. Standaard staat alles aan. Een vervoervorm die uit staat, wordt nergens meer getoond: niet als knop bij de dagen, en bij Auto ook niet de knop voor het overzicht auto rechtsboven. De keuze wordt onthouden, net als de registraties. Al vastgelegde dagen met een vervoervorm die uit staat blijven bewaard (ook in backups), maar zijn onzichtbaar; zet je de vorm weer aan, dan zie je ze weer. De aan/uit-instelling zelf zit niet in de backup. |
| F8 | Installeren | De app is een progressive web app (PWA): Chrome biedt "App installeren" aan, waarna de app als gewone app tussen je apps staat en schermvullend opent, zonder adresbalk. |
| F18 | Vraag om te installeren | Open je de app in de browser terwijl hij nog niet op de telefoon is geïnstalleerd, dan staat onderaan het scherm een rustige balk "WoonWerk als app installeren?" met de knoppen **Niet nu** en **Installeren** (gevuld met de accentkleur). De balk blijft onderaan in beeld en ligt over de onderkant van de week; vrijdag zie je helemaal door een stukje te scrollen. "Installeren" opent het installatievenster van Chrome zelf. De balk verschijnt alleen als Chrome meldt dat de app installeerbaar is en nog niet is geïnstalleerd; in de geïnstalleerde app zelf (schermvullend) verschijnt hij nooit. Na installeren verdwijnt de balk. Kies je "Niet nu" of sluit je het venster van Chrome zonder te installeren, dan komt de vraag 30 dagen niet terug (dat wordt onthouden op de telefoon). De balk staat alleen op het weekscherm, niet in de instellingen of overzichten. |
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
- **AC10 (F8)** De app heet **WoonWerk** (die naam staat onder het icoon en in het installatievenster), heeft een eigen icoon en een app-manifest, zodat "Zet op beginscherm" een schermvullende app oplevert.
- **AC11 (ontwerp)** Op een telefoonscherm van 360 pixels breed past alles zonder zijwaarts scrollen, en elke knop is minstens 44 pixels hoog, zodat hij makkelijk met een duim te raken is.
- **AC13 (F9)** Met de tandwielknop open ik de instellingen; met "Terug" zie ik weer dezelfde week.
- **AC14 (F10)** Na het kiezen van een map toont de instelling de naam van die map, ook nadat de app opnieuw is geopend.
- **AC15 (F11)** "Backup maken" schrijft een bestand `woon-werkvervoer-backup-JJJJ-MM-DD.json` met alle ingevulde dagen in de gekozen map, en meldt waar het staat. Zonder gekozen map wordt hetzelfde bestand gedownload.
- **AC16 (F12)** Na het inlezen van een backup toont de app precies de keuzes uit dat bestand; keuzes die niet in de backup staan zijn weg. Bij een ongeldig bestand verschijnt een melding en blijven de huidige keuzes ongewijzigd. Als ik de bevestiging annuleer, verandert er niets.
- **AC20 (F15)** Op dinsdag 20 oktober 2026 toont het overzicht de periode van 20 juli 2026 tot en met 20 oktober 2026, met de kolommen juli, augustus, september en oktober. Alleen dagen met Thuis staan erin, in de kolom van hun eigen maand en op volgorde; dagen met een andere keuze, dagen vóór 20 juli en dagen na vandaag staan er niet in. Op 31 mei begint de periode op 28 februari (of 29 in een schrikkeljaar).
- **AC21 (F16)** Het overzicht auto toont dezelfde periode en kolommen als AC20, met alleen de dagen waarop Auto is gekozen, en het auto-icoon bovenaan. "Terug" brengt je naar dezelfde week.
- **AC22 (F17)** Standaard toont elke dag alle vijf knoppen. Zet ik in de instellingen Trein en Auto uit, dan toont elke dag alleen Thuis, Fiets en Vrij, in die volgorde, en is de knop voor het overzicht auto rechtsboven verdwenen. Na opnieuw openen van de app is dat nog zo.
- **AC23 (F17)** De knop Thuis in de instellingen staat aan en kan niet worden uitgezet.
- **AC24 (F17)** Staat er op dinsdag Auto en zet ik Auto uit, dan is bij dinsdag niets gemarkeerd. Zet ik Auto weer aan, dan staat dinsdag weer op Auto en is de overzichtsknop terug.
- **AC17 (F13)** Als de app één keer met internet is geopend, opent hij daarna ook zonder internetverbinding volledig, en kun je keuzes maken die bewaard blijven.
- **AC18 (F8)** De app heeft een geldig app-manifest en een service worker, zodat Chrome hem als installeerbare app herkent.
- **AC25 (F18)** Meldt Chrome dat de app installeerbaar is, dan staat onderaan het scherm de vraag met "Installeren" en "Niet nu". Zonder die melding van Chrome, of als de app al schermvullend als geïnstalleerde app draait, staat er geen vraag.
- **AC26 (F18)** "Installeren" opent het installatievenster van Chrome. Na installeren is de vraag weg.
- **AC27 (F18)** Na "Niet nu", of na het sluiten van het installatievenster zonder te installeren, is de vraag weg en komt hij ook na opnieuw openen niet terug. Na 30 dagen verschijnt hij weer als de app dan nog steeds niet is geïnstalleerd.
- **AC12 (ontwerp)** Op een scherm van 360 bij 640 pixels (een Samsung S25 is 360 pixels breed; 640 pixels hoog laat ruimte voor adresbalk en systeembalken) zijn de titel, de weeknavigatie en alle vijf dagen met hun knoppen volledig te zien zonder te scrollen.

## 6. Ontwerp

Strak, modern en minimalistisch. Geen toeters en bellen.

- **Rustig**: witte achtergrond, donkergrijze tekst, één accentkleur (diep blauw) voor de gekozen knop en de markering van vandaag. Geen verlopen, schaduwen of animaties, alleen een subtiele overgang bij klikken.
- **Typografie**: het standaard systeemlettertype van het apparaat (zoals San Francisco of Segoe UI), in twee groottes: een titel en normale tekst.
- **Knoppen**: een strak lijnicoon met de naam eronder, zodat elk vervoermiddel direct herkenbaar is. Dunne rand en afgeronde hoeken. De gekozen knop is gevuld met de accentkleur en witte tekst.
- **Indeling**: smalle kolom gecentreerd op het scherm, compact in de hoogte zodat de hele week in één scherm past, dunne lijnen als scheiding tussen de dagen. Bovenaan staan de titel met rechts de knoppen voor het thuiswerkoverzicht, het auto-overzicht (alleen als Auto aan staat) en de instellingen, en daaronder de weeknavigatie met "Deze week". De week staat er kort, bijv. "19 – 23 okt"; het jaartal verschijnt alleen bij een week in een ander jaar.
- **Mobiel eerst**: ontworpen voor een telefoonscherm, met grote knoppen voor je duim; de vijf knoppen passen naast elkaar; staan er minder aan, dan worden ze breder. Op een groter scherm blijft het een smalle kolom.
- **Geen extra's**: geen logo, geen afbeeldingen, geen pop-ups. Uitzonderingen: de bevestigingsvraag voor het inlezen van een backup (die vervangt immers alles), de mappen- en bestandskiezer en het installatievenster van de telefoon zelf. De vraag om te installeren (F18) is geen pop-up maar een smalle balk onderaan het weekscherm; zolang die er staat, geldt AC12 niet helemaal (vrijdag zie je door te scrollen). Meldingen over backups verschijnen als korte regel tekst in het instellingenscherm.

## 7. Buiten scope (versie 1)

Werktijden, kilometers of kosten, maand- of jaaroverzichten, exporteren naar
Excel, automatisch herkennen van feestdagen of vakantie, weekenddagen, accounts, synchroniseren tussen
apparaten.

## 8. Techniek

- **React** (gebruikersinterface) en **Vite** (ontwikkel- en bouwtool)
- **Vitest** en **React Testing Library** (automatische tests van de acceptatiecriteria)
- **Lucide** (`lucide-react`) voor de iconen: een veelgebruikte open source iconenset met strakke lijniconen en miljoenen downloads per week.
- Geen andere bibliotheken (ook geen CSS-framework, de vormgeving is gewone CSS); datums worden met standaard JavaScript berekend.
- Opslag via `localStorage` van de browser (de registraties, apart welke vervoervormen aan staan, en wanneer je "Niet nu" koos bij de installatievraag), dus geen server of database. Let op: de gegevens staan alleen op die ene telefoon; als je de browsergegevens wist, zijn ze weg.
- Backupmap: via de File System Access API van de browser (Chrome op Android vanaf versie 132). De gekozen map wordt onthouden in IndexedDB van de browser. Chrome kan bij het eerste gebruik na het openen van de app opnieuw om toestemming voor de map vragen; dat is een beveiliging van de browser zelf. Android staat niet toe dat de hoofdmap van Downloads of de hele telefoon wordt gekozen, dus kies een eigen map, bijvoorbeeld `Documents/Woon-werkvervoer`.
- Backupbestand: JSON met de velden `app` (`"woon-werkvervoer"`), `versie` (1), `gemaakt` (datum en tijd) en `registraties` (per datum de keuze, bijv. `"2026-10-20": "fiets"`).
- Offline en installeren: **vite-plugin-pwa** (met Workbox van Google, beide veelgebruikt en open source) maakt een service worker die alle bestanden van de app op de telefoon bewaart.
- Installatievraag: Chrome stuurt het standaard browsersignaal `beforeinstallprompt` alleen als de app installeerbaar is en nog niet geïnstalleerd. De app vangt dat op, toont zijn eigen balk in plaats van de standaardmelding van Chrome, en roept bij "Installeren" het installatievenster van Chrome aan. Draait de app al als geïnstalleerde app (`display-mode: standalone`), dan wordt er nooit gevraagd.
- Online zetten als statische website, zodat de telefoon de app kan openen (de manier van hosten wordt apart gekozen).

## 9. Oplevering

- Broncode in deze map (`/mnt/project-files/eerste-webapp/`), zonder `node_modules`.
- Een `README.md` met uitleg hoe je de app start.
- Alle acceptatiecriteria hebben een geslaagde automatische test.
