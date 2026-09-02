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
          { spec: 'un|co:con|ordin|ated:ate',
            def: 'Moving clumsily, with the parts not working together' },
          { spec: 'un|graci:grac|ous',
            def: 'Rude — not polite or thankful when you should be' },
          { spec: 'un|reli:rely|able',
            def: 'Cannot be counted on to work, or to turn up when it said it would' },
          { spec: 'un|re|solv|ed',
            def: 'Still not settled or decided' },
          { spec: 'un|season|able',
            def: 'Weather that is wrong for the time of year' },
          { spec: 'un|trust|worth|y',
            def: 'Cannot be trusted to be honest' },
        ],
      },
      {
        label: '-ible means "can be done"',
        words: [
          { spec: 'col:con|lect|ible:able',
            def: 'Worth collecting — the sort of thing people gather and keep' },
          { spec: 'cor:con|rupt|ible:able',
            def: 'Able to be turned dishonest' },
          { spec: 'flex:flect|ible:able',
            def: 'Able to bend without breaking' },
          { spec: 'intel:inter|lig:lect|ible:able',
            def: 'Clear enough to be understood',
            note: 'Intelligible, intelligent and collect all hide the same root: to gather or pick out. Being intelligent is being good at picking things out.' },
          { spec: 'ir:in_not|re|spons:spond|ible:able',
            def: 'Reckless — not careful about the things you are supposed to do' },
          { spec: 'sub|mers:merg|ible:able',
            def: 'Able to go underwater' },
        ],
      },
      {
        label: 'omni- means "all", terr means "earth"',
        words: [
          { spec: 'omni|pot|ent:ant', def: 'Having unlimited power',
            note: 'All-powerful. The same "pot" is in potential and potent — it is the power to do a thing.' },
          { spec: 'omni|present',
            def: 'Present everywhere at once' },
          { spec: 'omni|sci|ent:ant', def: 'Knowing absolutely everything',
            note: 'All-knowing. The same "sci" is in science, which is just the knowing of things.' },
          { spec: 'omni|vore:vor', def: 'An animal that eats both plants and meat',
            note: 'Eats all. A carnivore eats meat, a herbivore eats plants, an omnivore is not fussy.' },
          { spec: 'medi|terr|anean:an', display: 'Mediterranean',
            def: 'The sea between Europe and Africa (it is a name, so it takes a capital)',
            note: 'The sea in the middle of the earth. The Romans named it from where they were standing, which tells you something about the Romans.' },
          { spec: 'terr|ain:an',
            def: 'The shape and surface of a stretch of land' },
          { spec: 'terr|arium:ary', def: 'A glass container for growing small plants',
            note: 'A place for earth. Same ending as aquarium — a place for water.' },
          { spec: 'terr|ier:er', def: 'A small breed of dog, bred to dig down after animals',
            note: 'An earth dog. Terriers were bred to go down holes after things, which explains a great deal about their personalities.' },
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
