import { ArrowLeft } from 'lucide-react'

interface Props {
  onClose: () => void
}

/** Informatiepagina met uitleg over de werking van de app. */
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
          Met WoonWerk houd je per werkdag bij hoe je naar je werk bent gegaan. Zo heb je altijd een overzicht bij de
          hand voor je thuiswerkvergoeding, je reiskosten en je vrije dagen.
        </p>
      </section>

      <section className="setting info">
        <h2>Een dag invullen</h2>
        <p>
          Tik bij een dag op Thuis, Trein, Fiets, Auto of Vrij. Trein, Fiets en Auto kun je combineren, bijvoorbeeld
          met de fiets naar het station en dan de trein. Thuis en Vrij gaan niet samen met iets anders. Tik nog eens op
          een gekozen knop om hem te wissen.
        </p>
      </section>

      <section className="setting info">
        <h2>Bladeren</h2>
        <p>
          Swipe naar links of rechts, of gebruik de pijltjes, om naar een andere week te gaan. Met "Deze week" ben je
          meteen terug. De dag van vandaag is blauw gemarkeerd.
        </p>
      </section>

      <section className="setting info">
        <h2>Overzichten</h2>
        <p>
          Met de blauwe knoppen onderaan open je per keuze een overzicht, met elke maand in een eigen kolom. Een
          euroteken betekent dat het om een vergoeding gaat (thuiswerk, trein en auto), een vinkje is een gewoon
          overzicht (fietsdagen en vrije dagen). Bij de vergoedingen vul je de datum van je laatste declaratie in; het
          overzicht begint dan op de werkdag erna en loopt maximaal 3 maanden door. Zonder declaratiedatum, en bij
          fietsdagen en vrije dagen, zie je de laatste 3 maanden. Met het kalendertje kun je de vanaf- en tot-datum
          altijd zelf aanpassen. Is je laatste declaratie bijna 3 maanden geleden (een week ervoor), dan
          staat onderaan het weekscherm een herinnering om tijdig te declareren. Tik erop om het overzicht te openen; de
          herinnering verdwijnt als je de datum van je laatste declaratie aanpast of leegmaakt.
        </p>
      </section>

      <section className="setting info">
        <h2>Instellingen</h2>
        <p>
          Via het tandwiel zet je vervoervormen die je niet gebruikt uit. Ze verdwijnen dan uit de app, maar dagen die
          je al hebt ingevuld blijven bewaard.
        </p>
      </section>

      <section className="setting info">
        <h2>Je gegevens en backups</h2>
        <p>
          Alles wat je invult staat alleen op deze telefoon, niet op internet. Wis je de gegevens van Chrome of van de
          app, dan ben je alles kwijt. Maak daarom regelmatig een backup via het tandwiel en bewaar die in een eigen map.
          Met "Backup inlezen" zet je een backup terug; die vervangt dan alles wat er nu staat.
        </p>
      </section>

      <section className="setting info">
        <h2>Zonder internet</h2>
        <p>
          Na de eerste keer openen werkt de app ook zonder internet. Een nieuwe versie wordt vanzelf op de achtergrond
          opgehaald en is actief de volgende keer dat je de app opent.
        </p>
      </section>
    </main>
  )
}
