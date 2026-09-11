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
  {
    id: 'm2',
    name: 'Mission 2',
    subtitle: 'non-, -able, ab-, hab/hib',
    source: 'Grade 5 spelling — Spelling List 2, words 1–20',
    groups: [
      {
        label: 'non- means "not" or "without"',
        words: [
          // The hyphen is part of the spelling, so it is part of the first piece
          // and has to be typed. The capital only matters for display.
          { spec: 'non-:non|christ|ian:an', display: 'non-Christian',
            def: 'Not belonging to the religion that follows Jesus' },
          { spec: 'non|de|script',
            def: 'So plain and ordinary there is nothing much to say about it',
            note: 'It started as a naturalists’ word for a species nobody had described yet. Now it means something so dull nobody would bother.' },
          { spec: 'non|ess|ent:ant|ial:al',
            def: 'Not needed — you could manage perfectly well without it' },
          { spec: 'non|ex|ist:sist|ent:ant',
            def: 'Not real; not there at all',
            note: 'Exist is really ex + sist, "to stand out". The s of sist got swallowed by the x.' },
          { spec: 'non|flamm|able',
            def: 'Will not catch fire',
            note: 'Inflammable means exactly the same as flammable — it burns. People kept reading the in- as "not", which is a very bad mistake to make about a fuel tank, so nonflammable is the way to say "will NOT burn" with no doubt at all.' },
          { spec: 'non|phys|ic|al',
            def: 'Not made of anything you can touch — like a thought or a feeling' },
        ],
      },
      {
        label: '-able means "fit for" or "can be done"',
        words: [
          { spec: 'ad|apt|able',
            def: 'Able to change to fit a new situation' },
          { spec: 'con|sider|able',
            def: 'Large enough to matter — quite a lot' },
          { spec: 'hospit|able',
            def: 'Friendly and welcoming to guests',
            note: 'Same root as hospital and host. A hospital began as a place that took in guests and travellers.' },
          { spec: 'in:in_not|se|par|able',
            def: 'Impossible to pull apart — always together' },
          { spec: 'pro|gramm:graph|able',
            def: 'Can be given a set of instructions to follow, like a computer',
            note: 'The m doubles before -able. The root is the Greek for writing — a program was first a notice written up in advance.' },
          { spec: 'un|alien|able',
            def: 'Cannot be taken away from you, and cannot be given away',
            note: 'It is in the Declaration of Independence: people have "certain unalienable Rights". Nobody can take them from you, and you cannot hand them over.' },
        ],
      },
      {
        label: 'ab means "away from"; hab and hib mean "to have, to hold"',
        words: [
          { spec: 'ab|dic:dict|ate',
            def: 'To give up a throne or an important job',
            note: 'Kings and queens abdicate. It is saying yourself away from the job.' },
          { spec: 'ab|hor',
            def: 'To hate something so much it makes you shudder',
            note: 'The same shudder as horror and horrible. To abhor something is to shudder away from it.' },
          { spec: 'ab|olish',
            def: 'To end something officially and for good, like a law or a rule' },
          { spec: 'ab|ras|ive',
            def: 'Rough enough to scrape things; or harsh in the way you speak to people',
            note: 'The same scrape as erase and razor.' },
          { spec: 'abs:ab|tain',
            def: 'To choose not to do something, especially something you would like to do' },
          { spec: 'abs:ab|tract',
            def: 'About ideas rather than things you can see or touch',
            note: 'Pulled away from real things. An abstract painting is pulled away from what its subject actually looks like.' },
          { spec: 'ex|hibit:hab',
            def: 'To put something on show for people to look at, like a painting in a museum',
            note: 'To hold out. You hold a thing out so people can see it.' },
          { spec: 'habit:hab|ual:al',
            def: 'Done so often that it happens without thinking',
            note: 'A habit is something you have — the same root. Do it often enough and it has you.' },
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
