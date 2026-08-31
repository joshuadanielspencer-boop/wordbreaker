// SPELLING SLAUGHTER — the school spelling list, run through the slicer.
//
// These words come from a curriculum, not from the morphology sequence, so
// they live apart from words.js and are not scheduled by the ordinary word
// sessions. Everything else is shared: they parse the same way, they credit
// the same mastery store, and the pieces they teach land in the same Codex.
//
// Notation is words.js's — surface, or surface:morphemeId for an allomorph.
// An entry may be a bare spec string, or an object carrying `display` for a
// word that needs a capital letter, and `note` for a story worth telling.

export const MISSIONS = [
  {
    id: 'm1',
    name: 'Mission 1',
    subtitle: 'un-, -ible, omni-, terr-',
    source: 'Grade 5 spelling — prefix, suffix and root list',
    groups: [
      {
        label: 'un- means "not"',
        words: [
          'un|co:con|ordin|ated:ate',
          'un|graci:grac|ous',
          'un|reli:rely|able',
          'un|re|solv|ed',
          'un|season|able',
          'un|trust|worth|y',
        ],
      },
      {
        label: '-ible means "can be done"',
        words: [
          'col:con|lect|ible:able',
          'cor:con|rupt|ible:able',
          'flex:flect|ible:able',
          { spec: 'intel:inter|lig:lect|ible:able',
            note: 'Intelligible, intelligent and collect all hide the same root: to gather or pick out. Being intelligent is being good at picking things out.' },
          'ir:in_not|re|spons:spond|ible:able',
          'sub|mers:merg|ible:able',
        ],
      },
      {
        label: 'omni- means "all", terr means "earth"',
        words: [
          { spec: 'omni|pot|ent:ant', note: 'All-powerful. The same "pot" is in potential and potent — it is the power to do a thing.' },
          'omni|present',
          { spec: 'omni|sci|ent:ant', note: 'All-knowing. The same "sci" is in science, which is just the knowing of things.' },
          { spec: 'omni|vore:vor', note: 'Eats all. A carnivore eats meat, a herbivore eats plants, an omnivore is not fussy.' },
          { spec: 'medi|terr|anean:an', display: 'Mediterranean',
            note: 'The sea in the middle of the earth. The Romans named it from where they were standing, which tells you something about the Romans.' },
          'terr|ain:an',
          { spec: 'terr|arium:ary', note: 'A place for earth. Same ending as aquarium — a place for water.' },
          { spec: 'terr|ier:er', note: 'An earth dog. Terriers were bred to go down holes after things, which explains a great deal about their personalities.' },
        ],
      },
    ],
  },
];

/** Flatten a mission's groups into plain {spec, display, note, group} records. */
export function missionEntries(mission) {
  const out = [];
  mission.groups.forEach((g, gi) => {
    for (const w of g.words) {
      const rec = typeof w === 'string' ? { spec: w } : w;
      out.push({ ...rec, group: gi, groupLabel: g.label });
    }
  });
  return out;
}
