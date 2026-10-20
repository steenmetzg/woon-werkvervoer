# WoonWerk

Leg per werkdag met één tik vast hoe je naar je werk bent gegaan: thuis, trein, fiets, auto of vrij.
De specificatie staat in [SPEC.md](SPEC.md).

De app staat online op https://steenmetzg.github.io/woon-werkvervoer/

<img src="docs/screenshot-telefoon.png" alt="De app op een telefoon" width="300">

## Starten op je computer

Je hebt [Node.js](https://nodejs.org) nodig (versie 20 of nieuwer). Open een terminal in deze map en typ:

```
npm install
npm run dev
```

Open daarna het adres dat verschijnt (meestal http://localhost:5173).

## Handige opdrachten

| Opdracht | Wat het doet |
|----------|--------------|
| `npm run dev` | Start de app om te bekijken en aan te werken. |
| `npm test` | Draait de automatische tests van alle acceptatiecriteria. |
| `npm run build` | Maakt de versie om online te zetten, in de map `dist`. |

## Op je telefoon

De app is een progressive web app. Open https://steenmetzg.github.io/woon-werkvervoer/ in Chrome en kies in het menu
(drie puntjes) **App installeren**, of tik op **Installeren** in de balk onderaan die de app zelf toont zolang hij nog niet geïnstalleerd is. De app staat daarna tussen je andere apps en werkt ook zonder internet.

Elke wijziging op de branch `main` wordt automatisch getest en online gezet via GitHub Pages. De app haalt een nieuwe
versie op de achtergrond op; die is actief de volgende keer dat je de app opent.

Je keuzes worden alleen op die telefoon bewaard. Maak daarom af en toe een backup via het tandwiel rechtsboven.

## Opbouw

- `src/App.tsx`: het scherm met de week, de knoppen en het swipen tussen weken
- `src/Settings.tsx`: het scherm Instellingen en backup
- `src/Overview.tsx`: de overzichten thuiswerkvergoeding en auto
- `src/installPrompt.ts`: de vraag om de app te installeren (alleen als hij nog niet geïnstalleerd is), en die vraag weer tonen na "Niet nu"
- `src/backup.ts`: het backupbestand maken en controleren
- `src/files.ts` en `src/folderStore.ts`: de backupmap kiezen, onthouden en bestanden schrijven
- `src/dates.ts`: rekenen met datums (maandag van de week, Nederlandse namen)
- `src/storage.ts`: bewaren en ophalen van keuzes in de browser
- `src/index.css`: de vormgeving
- `src/*.test.tsx`: de tests, één groep per acceptatiecriterium
- `public/`: app-icoon en manifest voor het installeren
- `vite.config.ts`: bouwinstellingen, inclusief de service worker voor offline gebruik
