/**
 * De korte tekst bij de melding "Nieuwe versie geïnstalleerd" (F41), per versie.
 *
 * Bij elke nieuwe versie komt hier een regel bij met de tekst die Greco kiest.
 * Geen tekst voor een versie (een lege tekst ''), dan toont de melding alleen de titel.
 *
 * Een icoon in de tekst zet je tussen blokhaken:
 *   [klokplus]  het klokje met plusje (uren toevoegen)
 *   [micplus]   de microfoon met plusje (regel inspreken)
 *   [microfoon] de microfoon
 *   [potlood]   het potloodje (ritomschrijving)
 *   [klok]      het klokje
 */
export const RELEASE_TEKSTEN: Record<string, string> = {
  '1.26.0':
    'Je kan nu standaard regels per rubriek instellen. Die regel wordt toegevoegd als je uren via de knop [klokplus] invoert.',
}
