import { ArrowLeft } from 'lucide-react'
import { speechSupported } from './speech'

interface Props {
  onClose: () => void
}

/** Informatiepagina met een korte uitleg van wat je met de app kunt. */
export default function Info({ onClose }: Props) {
  return (
    <main className="app">
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1>Over WoonWerk</h1>
      </header>

      <section className="setting info">
        <h2>Wat doet WoonWerk?</h2>
        <p>
          Met WoonWerk houd je per werkdag bij hoe je naar je werk bent gegaan, en desgewenst hoeveel uur je hebt
          gewerkt. Zo heb je altijd een overzicht bij de hand voor je thuiswerkvergoeding, reiskosten, vrije dagen en
          urenregistratie.
        </p>
      </section>

      <section className="setting info">
        <h2>Vervoer of thuiswerken registreren</h2>
        <p>
          Kies per dag Thuis, Trein, Fiets, Auto of Vrij. Trein, Fiets en Auto kun je combineren; Thuis en Vrij staan
          altijd alleen. Op een reisdag kun je er een korte ritomschrijving bij zetten.
        </p>
      </section>

      <section className="setting info">
        <h2>Uren bijhouden</h2>
        <p>
          Per dag kun je je uren per rubriek vastleggen, met een korte omschrijving. Ga naar een werkdag en registreer
          een nieuwe regel in een rubriek. Je rubrieken beheer je zelf bij de instellingen.
        </p>
      </section>

      {speechSupported() && (
        <section className="setting info">
          <h2>Inspreken</h2>
          <p>
            Je kunt een dag ook inspreken, bijvoorbeeld "fiets op 1 oktober", "gisteren thuis" of "2 uur overleg". Met
            "ga naar 1 oktober" spring je naar die week. Ook een ritomschrijving kun je inspreken. Is er iets verkeerd vastgelegd, dan maak je het meteen
            ongedaan. Inspreken werkt alleen met internet.
          </p>
        </section>
      )}

      <section className="setting info">
        <h2>Bladeren</h2>
        <p>
          Je bladert door de weken door te swipen of met de pijltjes, en bent met één tik terug in deze week. Vandaag
          is blauw gemarkeerd.
        </p>
      </section>

      <section className="setting info">
        <h2>Overzichten</h2>
        <p>
          Je kan verschillende overzichten per maand zien. Bij thuiswerk, trein en auto (de vergoedingen) hou je in de
          app bij tot wanneer je hebt gedeclareerd en laat het overzicht zien wat daarna nog open staat. Je krijgt
          vanzelf een herinnering als het tijd is om weer te declareren. Bij trein, fiets en auto zie je ook je
          ritomschrijvingen. Het urenoverzicht toont je uren per maand
          en per rubriek, over de periode die je kiest.
        </p>
      </section>

      <section className="setting info">
        <h2>Instellingen</h2>
        <p>
          Stel hier je gebruikte vervoervormen in en of je ook uren wilt registreren. Wat je al had ingevuld blijft
          bewaard. Wil je niet inspreken, zet dit dan uit.
        </p>
      </section>

      <section className="setting info">
        <h2>Je gegevens en backups</h2>
        <p>
          Alles wat je invult staat <strong>alleen</strong> op deze telefoon. Maak daarom regelmatig een backup;
          daarmee zet je je gegevens later terug. Bijvoorbeeld als je een andere telefoon gaat gebruiken.
          De app telt anoniem hoe vaak hij wordt geopend en welke overzichten worden bekeken; wat je invult, wordt
          nooit verstuurd.
        </p>
      </section>

      <section className="setting info">
        <h2>Zonder internet</h2>
        <p>
          De app werkt ook zonder internet en houdt zichzelf vanzelf up-to-date.
        </p>
      </section>
    </main>
  )
}
