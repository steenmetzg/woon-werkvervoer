# Specificatie: Woon-werkvervoer registreren

Status: **concept, nog niet live** (Greco wil eerst meer functionaliteit toevoegen)
Versie: 1.13 (21 oktober 2026): scherm "Declaraties" om per vorm (Thuis, Trein, Auto) bij te houden tot en met welke dag je hebt gedeclareerd, bereikbaar via een euroknop rechtsboven (app-versie WoonWerk 1.8)
Vorige versie: 1.12.1 (21 oktober 2026): kortere naam voor het backupbestand, met de datum vooraan (`2026-10-21-woonwerk.json`), op verzoek van Greco (app-versie WoonWerk 1.7.1)

## 1. Doel

Een eenvoudige webapp waarmee je per doordeweekse dag (maandag t/m vrijdag)
met één of een paar tikken vastlegt hoe je naar je werk bent gegaan. Werktijden spelen geen rol.
Greco gaat de app echt gebruiken, vooral op zijn telefoon.

## 2. Gebruiker

Eén persoon (Greco) die de app op zijn telefoon gebruikt, via een snelkoppeling op het beginscherm. Geen accounts of inlog.

## 3. Begrippen

- **Keuze**: een van deze vijf keuzes, altijd in deze volgorde:
  Thuis, Trein, Fiets, Auto, Vrij. Elk heeft een eigen strak lijnicoon (huis, trein, fiets, auto, palmboom).
  "Vrij" gebruik je voor een vrije dag, zoals vakantie of een feestdag.
- **Keuzes per dag** (vanaf versie 1.11): een dag heeft Thuis, of Vrij, of een combinatie van Trein, Fiets en Auto
  (één, twee of alle drie, bijvoorbeeld met de fiets naar het station en dan de trein). Thuis en Vrij gaan dus nooit samen met iets anders.
- **Vervoervorm aan of uit**: in de instellingen bepaal je welke keuzes je gebruikt. Thuis staat altijd aan.
  Een keuze die uit staat, zie je nergens in de app (zie F17).
- **Werkdag**: maandag t/m vrijdag. Zaterdag en zondag worden niet getoond.

## 4. Functies

| Nr | Functie | Omschrijving |
|----|---------|--------------|
| F1 | Weekoverzicht | Het scherm toont één week: vijf regels, maandag t/m vrijdag, elk met datum (bijv. "ma 20 okt"). Bij openen is dat de huidige week. |
| F2 | Vervoer kiezen | Elke dag heeft een knop voor elke keuze die aan staat (standaard alle vijf: Thuis, Trein, Fiets, Auto, Vrij), in de vaste volgorde. De knoppen die er zijn, verdelen samen de hele breedte. Eén klik legt een keuze vast; gekozen knoppen zijn duidelijk gemarkeerd. Trein, Fiets en Auto kun je tegelijk kiezen. Kies je Thuis of Vrij, dan gaan alle andere keuzes van die dag uit. Kies je Trein, Fiets of Auto terwijl Thuis of Vrij gekozen is, dan gaat Thuis of Vrij uit. |
| F3 | Keuze wijzigen of wissen | Klik op een andere knop om een keuze toe te voegen of te veranderen (volgens de regels van F2). Klik op een al gekozen knop om alleen die keuze te wissen; de andere gekozen knoppen van die dag blijven staan. |
| F4 | Bladeren | Knoppen "◀ Vorige week" en "Volgende week ▶" en een knop "Deze week" om terug te springen. Op een aanraakscherm kan het ook met swipen: naar links swipen gaat naar de volgende week, naar rechts swipen naar de vorige week. |
| F5 | Vandaag herkennen | De regel van vandaag is visueel gemarkeerd, zodat je in één oogopslag ziet waar je moet klikken. |
| F6 | ~~Weektotalen~~ | Vervallen in versie 0.9: Greco vond ze niet nuttig. |
| F7 | Onthouden | Alle keuzes blijven bewaard na verversen of het sluiten van de browser (opslag op de telefoon zelf). |
| F9 | Instellingen | Een tandwielknop rechtsboven opent het scherm "Instellingen en backup". Een knop "Terug" brengt je weer naar de week. |
| F10 | Backupmap kiezen | In de instellingen kies je met de mappenkiezer van je telefoon een map waar backups worden opgeslagen en waaruit ze worden ingelezen. De app onthoudt die map en toont de naam. |
| F11 | Backup maken | De knop "Backup maken" slaat alle ingevulde dagen op als één bestand in de backupmap, met de datum vooraan in de naam, bijvoorbeeld `2026-10-20-woonwerk.json`. Is er geen map gekozen of kan de telefoon geen map onthouden, dan komt het bestand in de map Downloads. |
| F12 | Backup inlezen | De knop "Backup inlezen" opent de bestandskiezer in de backupmap, zodat je een specifieke backup kiest. Na een bevestiging vervangt de inhoud van de backup alle huidige keuzes. Een bestand dat geen geldige backup is, wordt geweigerd met een duidelijke melding en verandert niets. |
| F15 | Overzicht thuiswerkvergoeding | Een knop met het thuis-icoon in de balk onderaan het weekscherm (F21) opent het scherm "Overzicht thuiswerkvergoeding". Het toont standaard alle dagen waarop Thuis is gekozen, van precies 3 maanden geleden tot en met vandaag (op 20 oktober dus vanaf 20 juli; bestaat die dag niet, zoals 31 februari, dan de laatste dag van die maand). Bovenaan staan het thuis-icoon, de vanaf-datum en de tot-datum. Daaronder staan heel compact de datums in kolommen: elke kalendermaand een eigen kolom (meestal 4, omdat de periode in een maand halverwege begint; Greco koos hiervoor boven precies 3 kolommen), de oudste maand links, met de maandnaam erboven. Een maand zonder thuisdagen toont een streepje. Opmaak: de vanaf- en tot-datum in kleinere tekst, met de labels uitgelijnd met de titel van het overzicht; het pijltje van de terugknop en het thuis-icoon staan links precies gelijk met de eerste kolom (de terugknop is daarom een los pijltje zonder rand, ook in de instellingen); de maandnamen met een hoofdletter (bijv. "Augustus") en iets groter dan de datums; alle kolommen even breed. "Terug" brengt je weer naar de week. |
| F16 | Overzicht kilometervergoeding | Precies hetzelfde overzicht als F15, maar voor de dagen waarop Auto is gekozen. Het overzicht telt elke dag waarop Auto is gekozen, ook als daarnaast Trein of Fiets is gekozen. Een knop met het auto-icoon in de balk onderaan (F21), naast de knop voor het overzicht thuiswerkvergoeding, opent het scherm "Overzicht kilometervergoeding" (eerder "Overzicht auto"). Zelfde periode, indeling en opmaak, met het auto-icoon bovenaan. |
| F20 | Overzicht vrije dagen | Precies hetzelfde overzicht als F15, maar voor de dagen waarop Vrij is gekozen. Een knop in de balk onderaan (F21), rechts van de knop met het auto-icoon, opent het scherm "Overzicht vrije dagen". Het icoon is de palmboom van Vrij met rechtsonder een wit rondje met een dunne donkerblauwe rand en een donkerblauw vinkje (geen euroteken). Staat Vrij uit (F17), dan is de knop er niet. |
| F22 | Overzicht treinvergoeding | Precies hetzelfde overzicht als F15, maar voor de dagen waarop Trein is gekozen (ook als daarnaast Fiets of Auto is gekozen). Een knop in de balk onderaan (F21) opent het scherm "Overzicht treinvergoeding". Het icoon is de trein met rechtsonder een wit rondje met een donkerblauw euroteken, net als bij thuis en auto. Staat Trein uit (F17), dan is de knop er niet. |
| F23 | Overzicht fietsdagen | Precies hetzelfde overzicht als F15, maar voor de dagen waarop Fiets is gekozen (ook als daarnaast Trein of Auto is gekozen). Een knop in de balk onderaan (F21) opent het scherm "Overzicht fietsdagen". Het icoon is de fiets met rechtsonder een wit rondje met een donkerblauw vinkje, net als bij Vrij. Staat Fiets uit (F17), dan is de knop er niet. |
| F24 | Informatie | Een knop met een i-icoon (lijnicoon in dezelfde stijl, met grijze rand) staat rechtsboven links naast de tandwielknop. Die opent het scherm "Over WoonWerk" met korte uitleg over de werking van de app, in deze onderdelen: Wat doet WoonWerk?, Een dag invullen, Bladeren, Overzichten, Declaraties (vanaf versie 1.13), Instellingen, Je gegevens en backups, Zonder internet. Een knop "Terug" (het pijltje) brengt je weer naar dezelfde week. De balk met overzichtsknoppen staat niet op dit scherm. |
| F25 | Declaraties | Een knop met alleen een euroteken (lijnicoon in dezelfde stijl, met grijze rand) staat rechtsboven links naast de informatieknop (F24). Die opent het scherm "Declaraties". Daarin staat voor Thuis, Trein en Auto, in die volgorde, een onderdeel met het icoon van die vorm (met euroteken, zoals bij de overzichten), de naam, het label "Gedeclareerd tot en met:" en een datumveld. Een vorm die uit staat (F17) staat er niet; Thuis staat er altijd. Tik je op het datumveld, dan opent het kalendertje van de telefoon zelf om een datum te kiezen. Zolang je voor een vorm nog geen datum hebt gekozen, staat het veld op vandaag (en schuift het dus elke dag mee); een gekozen datum wordt onthouden, net als de registraties. Wis je de datum in het kalendertje, dan staat het veld weer op vandaag. Een knop "Terug" (het pijltje) brengt je weer naar dezelfde week. De balk met overzichtsknoppen staat niet op dit scherm. Wat de app verder met deze datums doet, specificeert Greco later. |
| F17 | Vervoervormen aan/uit | In de instellingen staat bovenaan het onderdeel "Vervoervormen" met dezelfde vijf knoppen (icoon met naam) als bij een dag. Een knop die aan staat is gevuld met de accentkleur; tik erop om hem uit te zetten (dan is hij wit met een rand), en nog eens tikken zet hem weer aan. Thuis staat altijd aan en is een inactieve knop: er gebeurt niets als je erop tikt. Standaard staat alles aan. Een vervoervorm die uit staat, wordt nergens meer getoond: niet als knop bij de dagen, en ook niet de knop voor het overzicht van die vorm onderaan. De keuze wordt onthouden, net als de registraties. Al vastgelegde dagen met een vervoervorm die uit staat blijven bewaard (ook in backups), maar zijn onzichtbaar; zet je de vorm weer aan, dan zie je ze weer. De aan/uit-instelling zelf zit niet in de backup. |
| F8 | Installeren | De app is een progressive web app (PWA): Chrome biedt "App installeren" aan, waarna de app als gewone app tussen je apps staat en schermvullend opent, zonder adresbalk. |
| F18 | Vraag om te installeren | Open je de app in de browser terwijl hij nog niet op de telefoon is geïnstalleerd, dan staat onderaan het scherm, net boven de overzichtsknoppen (F21), een rustige balk "WoonWerk als app installeren?" met de knoppen **Niet nu** en **Installeren** (gevuld met de accentkleur). De rand van de balk heeft dezelfde accentkleur (diep blauw) als de knop Installeren. De balk blijft onderaan in beeld en ligt over de onderkant van de week; vrijdag zie je helemaal door een stukje te scrollen. "Installeren" opent het installatievenster van Chrome zelf. De balk verschijnt alleen als Chrome meldt dat de app installeerbaar is en nog niet is geïnstalleerd; in de geïnstalleerde app zelf (schermvullend) verschijnt hij nooit. Na installeren verdwijnt de balk. Kies je "Niet nu" of sluit je het venster van Chrome zonder te installeren, dan komt de vraag 30 dagen niet terug (dat wordt onthouden op de telefoon). De balk staat alleen op het weekscherm, niet in de instellingen of overzichten. |
| F19 | Installatievraag weer tonen | Heb je "Niet nu" gekozen, dan staat onderaan de instellingen het onderdeel "App installeren" met de datum waarop de vraag vanzelf terugkomt en de knop **Vraag weer tonen**. Die knop vergeet "Niet nu", zodat de balk weer op het weekscherm staat zodra Chrome de app installeerbaar vindt. Daarna staat er de melding "De vraag om de app op je telefoon te installeren staat onderaan in het startscherm als de app geïnstalleerd kan worden." In de geïnstalleerde app, of als je geen "Niet nu" koos, staat dit onderdeel er niet. Je registraties blijven gewoon bewaard. |
| F21 | Overzichtsknoppen onderaan | Onderaan het weekscherm staat een balk met de knoppen naar de overzichten, naast elkaar, in dezelfde volgorde als de knoppen bij de dagen: thuiswerkvergoeding, treinvergoeding (alleen als Trein aan staat), fietsdagen (alleen als Fiets aan staat), kilometervergoeding (alleen als Auto aan staat) en vrije dagen (alleen als Vrij aan staat). Het zijn dezelfde knoppen als eerst rechtsboven: alleen het icoon met rondje (zie Ontwerp), zonder tekst, met een vaste grootte gelijk aan de tandwielknop, rechts uitgelijnd zodat de rechterknop precies onder het tandwiel staat. Zo zijn ze goed te onderscheiden van de knoppen bij de dagen. De balk blijft onderaan in beeld. De tandwielknop voor de instellingen blijft rechtsboven naast de titel, met links ervan de informatieknop (F24) en daar weer links van de euroknop voor de declaraties (F25). In de instellingen en overzichten staat de balk niet. |
| F13 | Offline gebruiken | Na de eerste keer openen werkt de app ook zonder internetverbinding: openen, kiezen, bladeren, instellingen en backups. |
| F14 | Updates | Staat er een nieuwe versie online, dan haalt de app die op de achtergrond op zodra er internet is. De nieuwe versie is actief de volgende keer dat je de app opent. |

## 5. Acceptatiecriteria

Deze criteria worden ook als automatische tests in de code opgenomen.

- **AC1 (F1)** Bij openen zie ik vijf dagen, maandag t/m vrijdag van de huidige week, met de juiste datums. Zaterdag en zondag staan er niet bij.
- **AC2 (F2)** Als ik bij dinsdag op "Fiets" klik, is "Fiets" bij dinsdag gemarkeerd en de andere knoppen van dinsdag niet.
- **AC30 (F2)** Heeft dinsdag "Fiets" en klik ik op "Trein" en daarna op "Auto", dan zijn Trein, Fiets en Auto alle drie gemarkeerd.
- **AC31 (F2)** Heeft dinsdag Trein en Fiets en klik ik op "Thuis", dan is alleen Thuis gemarkeerd. Klik ik daarna op "Vrij", dan is alleen Vrij gemarkeerd. Klik ik daarna op "Fiets", dan is alleen Fiets gemarkeerd.
- **AC2b (F2)** Elke dag toont de knoppen in de volgorde Thuis, Trein, Fiets, Auto, Vrij.
- **AC3 (F2)** Een keuze bij de ene dag verandert niets aan de andere dagen.
- **AC4 (F3)** Als dinsdag "Thuis" heeft en ik klik op "Vrij", heeft dinsdag alleen "Vrij".
- **AC5 (F3)** Als dinsdag "Fiets" heeft en ik klik nogmaals op "Fiets", heeft dinsdag geen keuze meer. Als dinsdag "Trein" en "Fiets" heeft en ik klik op "Trein", heeft dinsdag alleen nog "Fiets".
- **AC6 (F4)** Na "Volgende week" zie ik de maandag t/m vrijdag van de week erna; na "Deze week" zie ik weer de huidige week. Keuzes in een andere week blijven bewaard als ik terugblader.
- **AC6b (F4)** Als ik over het scherm minstens 50 pixels naar links swipe, zie ik de volgende week; naar rechts swipen toont de vorige week. Een korte of vooral verticale beweging (zoals scrollen) wisselt niet van week, en een gewone tik op een knop blijft gewoon een keuze.
- **AC7 (F5)** Op een werkdag is de regel van vandaag gemarkeerd; in een andere week is geen regel gemarkeerd.
- **AC8 (F6)** Onder de week staan geen weektotalen meer.
- **AC9 (F7)** Na het verversen van de pagina staan alle keuzes er nog.
- **AC10 (F8)** De app heet **WoonWerk** (die naam staat onder het icoon en in het installatievenster), heeft een eigen icoon en een app-manifest, zodat "Zet op beginscherm" een schermvullende app oplevert.
- **AC11 (ontwerp)** Op een telefoonscherm van 360 pixels breed past alles zonder zijwaarts scrollen, en elke knop is minstens 44 pixels hoog, zodat hij makkelijk met een duim te raken is.
- **AC13 (F9)** Met de tandwielknop open ik de instellingen; met "Terug" zie ik weer dezelfde week.
- **AC14 (F10)** Na het kiezen van een map toont de instelling de naam van die map, ook nadat de app opnieuw is geopend.
- **AC15 (F11)** "Backup maken" schrijft een bestand `JJJJ-MM-DD-woonwerk.json` met alle ingevulde dagen in de gekozen map, en meldt waar het staat. Zonder gekozen map wordt hetzelfde bestand gedownload. Backups met de oude naam (`woon-werkvervoer-backup-JJJJ-MM-DD.json`, tot en met WoonWerk 1.7) kunnen gewoon worden ingelezen: de app kijkt naar de inhoud, niet naar de naam.
- **AC16 (F12)** Na het inlezen van een backup toont de app precies de keuzes uit dat bestand; keuzes die niet in de backup staan zijn weg. Bij een ongeldig bestand verschijnt een melding en blijven de huidige keuzes ongewijzigd. Als ik de bevestiging annuleer, verandert er niets.
- **AC20 (F15)** Op dinsdag 20 oktober 2026 toont het overzicht de periode van 20 juli 2026 tot en met 20 oktober 2026, met de kolommen juli, augustus, september en oktober. Alleen dagen met Thuis staan erin, in de kolom van hun eigen maand en op volgorde; dagen met een andere keuze, dagen vóór 20 juli en dagen na vandaag staan er niet in. Op 31 mei begint de periode op 28 februari (of 29 in een schrikkeljaar).
- **AC21 (F16)** Het overzicht kilometervergoeding toont dezelfde periode en kolommen als AC20, met alleen de dagen waarop Auto is gekozen (ook samen met Trein of Fiets), en het auto-icoon bovenaan. "Terug" brengt je naar dezelfde week.
- **AC22 (F17)** Standaard toont elke dag alle vijf knoppen. Zet ik in de instellingen Trein en Auto uit, dan toont elke dag alleen Thuis, Fiets en Vrij, in die volgorde, en is de knop voor het overzicht kilometervergoeding onderaan verdwenen. Na opnieuw openen van de app is dat nog zo.
- **AC23 (F17)** De knop Thuis in de instellingen staat aan en kan niet worden uitgezet.
- **AC24 (F17)** Staat er op dinsdag Auto en zet ik Auto uit, dan is bij dinsdag niets gemarkeerd. Zet ik Auto weer aan, dan staat dinsdag weer op Auto en is de overzichtsknop terug.
- **AC17 (F13)** Als de app één keer met internet is geopend, opent hij daarna ook zonder internetverbinding volledig, en kun je keuzes maken die bewaard blijven.
- **AC18 (F8)** De app heeft een geldig app-manifest en een service worker, zodat Chrome hem als installeerbare app herkent.
- **AC25 (F18)** Meldt Chrome dat de app installeerbaar is, dan staat onderaan het scherm de vraag met "Installeren" en "Niet nu". Zonder die melding van Chrome, of als de app al schermvullend als geïnstalleerde app draait, staat er geen vraag.
- **AC26 (F18)** "Installeren" opent het installatievenster van Chrome. Na installeren is de vraag weg.
- **AC27 (F18)** Na "Niet nu", of na het sluiten van het installatievenster zonder te installeren, is de vraag weg en komt hij ook na opnieuw openen niet terug. Na 30 dagen verschijnt hij weer als de app dan nog steeds niet is geïnstalleerd.
- **AC28 (F19)** Na "Niet nu" op 20 oktober staat in de instellingen dat de vraag terugkomt op 19 november. Na "Vraag weer tonen" verdwijnt dat onderdeel, en terug op het weekscherm staat de vraag er weer. Zonder "Niet nu", of in de geïnstalleerde app, staat het onderdeel niet in de instellingen.
- **AC29 (F20)** Het overzicht vrije dagen toont dezelfde periode en kolommen als AC20, met alleen de dagen waarop Vrij is gekozen, en het palmboom-icoon bovenaan. "Terug" brengt je naar dezelfde week. Zet ik Vrij uit, dan is de knop voor dit overzicht weg.
- **AC32 (F21)** Onderaan het weekscherm staan rechts vijf iconknoppen zonder tekst naar de vijf overzichten, in de volgorde thuiswerkvergoeding, treinvergoeding, fietsdagen, kilometervergoeding, vrije dagen; rechtsboven staan alleen de declaratieknop, de informatieknop en de tandwielknop. In de instellingen staat de balk niet.
- **AC34 (F22, F23)** Het overzicht treinvergoeding en het overzicht fietsdagen tonen dezelfde periode en kolommen als AC20, met alleen de dagen waarop Trein respectievelijk Fiets is gekozen (ook in combinatie met een andere vorm), en het trein- respectievelijk fietsicoon bovenaan. "Terug" brengt je naar dezelfde week. Staan Trein en Fiets uit, dan zijn beide knoppen weg en blijven thuiswerkvergoeding, kilometervergoeding en vrije dagen over, in die volgorde.
- **AC35 (F24)** Rechtsboven staan de knoppen Declaraties, Informatie en Instellingen, in die volgorde. Informatie opent "Over WoonWerk" met de acht onderdelen uit F24; "Terug" brengt je naar dezelfde week.
- **AC36 (F25)** De euroknop opent "Declaraties" met Thuis, Trein en Auto, elk met "Gedeclareerd tot en met:" en een datumveld dat op dinsdag 20 oktober 2026 op 20 oktober 2026 staat. Kies ik bij Trein 30 september, dan staat Trein op 30 september en Thuis en Auto nog op vandaag; na opnieuw openen van de app is dat nog zo. Wis ik de datum, dan staat Trein weer op vandaag. Staat Trein uit, dan staan alleen Thuis en Auto er; staan Trein en Auto uit, alleen Thuis. "Terug" brengt je naar dezelfde week.
- **AC37 (F25, F11, F12)** Een backup bevat de gekozen declaratiedatums. Lees ik een backup in, dan staan de datums daarna zoals in de backup. Een backup van een eerdere versie (zonder datums) laat de huidige datums staan.
- **AC33 (F7, F12)** Dagen die met een eerdere versie van de app zijn vastgelegd (één keuze per dag) staan er na de update nog precies zo. Een backup van een eerdere versie (versie 1) kan nog steeds worden ingelezen.
- **AC33 (ontwerp)** Het appscherm stopt boven de knoppenbalk van Android (terug, start, recente apps, of de veegbalk) en loopt er niet onder door. Die systeemknoppen staan op hun eigen achtergrond en zijn altijd goed te zien, ook in de geïnstalleerde app; de balk met overzichtsknoppen staat er direct boven.
- **AC12 (ontwerp)** Op een scherm van 360 bij 640 pixels (een Samsung S25 is 360 pixels breed; 640 pixels hoog laat ruimte voor adresbalk en systeembalken) zijn de titel, de weeknavigatie, alle vijf dagen met hun knoppen en de balk met overzichtsknoppen volledig te zien zonder te scrollen.

## 6. Ontwerp

Strak, modern en minimalistisch. Geen toeters en bellen.

- **Rustig**: witte achtergrond, donkergrijze tekst, één accentkleur (diep blauw) voor de gekozen knop en de markering van vandaag. Geen verlopen, schaduwen of animaties, alleen een subtiele overgang bij klikken.
- **Typografie**: het standaard systeemlettertype van het apparaat (zoals San Francisco of Segoe UI), in twee groottes: een titel en normale tekst.
- **Knoppen naar de overzichten**: de knoppen onderaan voor de overzichten thuiswerkvergoeding, treinvergoeding en kilometervergoeding tonen het huis-, trein- en auto-icoon iets kleiner, met rechtsonder een wit rondje met een dunne donkerblauwe rand (de accentkleur) en een donkerblauw euroteken. Zo zie je dat het om vergoedingen gaat. De overzichten fietsdagen en vrije dagen hebben in dat rondje een donkerblauw vinkje. De rand om deze knoppen is donkerblauw (de accentkleur), zodat ze meer opvallen dan de tandwielknop met zijn grijze rand. Bovenaan de overzichten zelf staat hetzelfde icoon met euroteken (daar in de accentkleur, zoals voorheen). De iconen bij de dagen blijven gewoon.
- **Knoppen**: een strak lijnicoon met de naam eronder (de knoppen bij de dagen zijn minstens 44 pixels hoog, iets lager dan voorheen zodat de balk onderaan ook in beeld past), zodat elk vervoermiddel direct herkenbaar is. Dunne rand en afgeronde hoeken. De gekozen knop is gevuld met de accentkleur en witte tekst.
- **Indeling**: smalle kolom gecentreerd op het scherm, compact in de hoogte zodat de hele week in één scherm past, dunne lijnen als scheiding tussen de dagen. Bovenaan staan de titel met rechts de informatieknop en de tandwielknop voor de instellingen, en daaronder de weeknavigatie met "Deze week". Bovenaan rechts staan dus de euroknop, de informatieknop en de tandwielknop. Onderaan staat de balk met de knoppen naar de overzichten (F21), met daarboven eventueel de installatievraag (F18). De week staat er kort, bijv. "19 – 23 okt"; het jaartal verschijnt alleen bij een week in een ander jaar.
- **Mobiel eerst**: ontworpen voor een telefoonscherm, met grote knoppen voor je duim; de vijf knoppen passen naast elkaar; staan er minder aan, dan worden ze breder. Op een groter scherm blijft het een smalle kolom.
- **Geen extra's**: geen logo, geen afbeeldingen, geen pop-ups. Uitzonderingen: de bevestigingsvraag voor het inlezen van een backup (die vervangt immers alles), de mappen- en bestandskiezer en het installatievenster van de telefoon zelf. De vraag om te installeren (F18) is geen pop-up maar een smalle balk onderaan het weekscherm; zolang die er staat, geldt AC12 niet helemaal (vrijdag zie je door te scrollen). Meldingen over backups verschijnen als korte regel tekst in het instellingenscherm.

## 7. Buiten scope (versie 1)

Werktijden, kilometers of kosten, maand- of jaaroverzichten, exporteren naar
Excel, automatisch herkennen van feestdagen of vakantie, weekenddagen, accounts, synchroniseren tussen
apparaten.

## 8. Techniek

- **React** (gebruikersinterface) en **Vite** (ontwikkel- en bouwtool)
- **Vitest** en **React Testing Library** (automatische tests van de acceptatiecriteria)
- Datumveld (F25): het standaard datumveld van de browser (`<input type="date">`), dat op de telefoon het eigen kalendertje opent; geen extra bibliotheek.
- **Lucide** (`lucide-react`) voor de iconen: een veelgebruikte open source iconenset met strakke lijniconen en miljoenen downloads per week.
- Geen andere bibliotheken (ook geen CSS-framework, de vormgeving is gewone CSS); datums worden met standaard JavaScript berekend.
- Opslag via `localStorage` van de browser (de registraties, apart welke vervoervormen aan staan, de declaratiedatums, en wanneer je "Niet nu" koos bij de installatievraag), dus geen server of database. Let op: de gegevens staan alleen op die ene telefoon; als je de browsergegevens wist, zijn ze weg.
- Backupmap: via de File System Access API van de browser (Chrome op Android vanaf versie 132). De gekozen map wordt onthouden in IndexedDB van de browser. Chrome kan bij het eerste gebruik na het openen van de app opnieuw om toestemming voor de map vragen; dat is een beveiliging van de browser zelf. Android staat niet toe dat de hoofdmap van Downloads of de hele telefoon wordt gekozen, dus kies een eigen map, bijvoorbeeld `Documents/Woon-werkvervoer`.
- Backupbestand: JSON met de velden `app` (`"woon-werkvervoer"`), `versie` (2), `gemaakt` (datum en tijd), `registraties` (per datum de lijst met keuzes, bijv. `"2026-10-20": ["trein", "fiets"]`) en vanaf versie 1.13 `gedeclareerd` (per vorm de gekozen datum, bijv. `"trein": "2026-09-30"`; een vorm zonder gekozen datum ontbreekt). Omdat `gedeclareerd` een extra veld is, blijft `versie` 2 en kan WoonWerk 1.6 en 1.7 zo'n backup nog lezen (zij negeren de datums). Een backup met `versie` 1 (per datum één keuze, bijv. `"fiets"`) wordt nog steeds gelezen. Ook de opslag op de telefoon gebruikt de lijsten; dagen die nog in de oude vorm staan, worden bij het openen omgezet. Let op: een backup van versie 2 kan door WoonWerk 1.5 of ouder niet worden gelezen.
- Offline en installeren: **vite-plugin-pwa** (met Workbox van Google, beide veelgebruikt en open source) maakt een service worker die alle bestanden van de app op de telefoon bewaart.
- Installatievraag: Chrome stuurt het standaard browsersignaal `beforeinstallprompt` alleen als de app installeerbaar is en nog niet geïnstalleerd. De app vangt dat op, toont zijn eigen balk in plaats van de standaardmelding van Chrome, en roept bij "Installeren" het installatievenster van Chrome aan. Draait de app al als geïnstalleerde app (`display-mode: standalone`), dan wordt er nooit gevraagd.
- Schermrand: de app vraagt de browser niet om tot onder de systeembalken van de telefoon te tekenen (geen `viewport-fit=cover`). Chrome op Android laat het scherm van de app dan ophouden boven de knoppenbalk van Android, zodat die nooit over de app heen ligt (bugfix in WoonWerk 1.6.1).
- Online zetten als statische website, zodat de telefoon de app kan openen (de manier van hosten wordt apart gekozen).

## 9. Oplevering

- Broncode in deze map (`/mnt/project-files/eerste-webapp/`), zonder `node_modules`.
- Een `README.md` met uitleg hoe je de app start.
- Alle acceptatiecriteria hebben een geslaagde automatische test.
