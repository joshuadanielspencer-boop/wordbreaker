# Wordbreaker

Morphology and decoding practice. Ten minutes a day, on a Mac or an
iPad, no account and no network.

## Run it

```bash
python3 tools/serve.py
```

Then open http://localhost:4321. The dev server sends no-cache headers so an
edit always shows up on reload.

For the iPad, build the single-file version and put it wherever you like
(Files, iCloud, a static host):

```bash
node tools/bundle.mjs
```

That writes `dist/wordbreaker.html` — one file, no imports, no server, ~127 KB.
`--artifact` writes `dist/wordbreaker.body.html` instead, for hosts that supply
their own document skeleton.

The bundler transforms ES modules into a plain function registry rather than
stitching them with `blob:` or `data:` URLs. Both of those alternatives were
tried: data URLs make every importer carry its own copy of the dependency tree
(a 150 KB app became 1.2 MB), and blob URLs fix the size but die under any
`script-src` policy that omits `blob:` — which is most static hosts and every
embedded viewer. The registry output has no dynamic script URLs at all.

Saving a profile export adapts to where it is running: a plain `<a download>`
locally or on an ordinary host, and the host's own save channel where one
exists, because embedded viewers block download links silently.
Progress is stored per-device; **Progress → Export** writes a JSON save you can
drop in Dropbox and import on the other device from the player screen.

## Players

Everyone who plays gets their own profile — own mastery data, own Codex, own
personality setting, own record. Siblings cannot contaminate each other's error
fingerprint, which would otherwise make the whole measurement worthless.
Profiles export one at a time, so syncing one save never drags anyone
else's along.

## Check it

```bash
node tools/check.mjs
```

Validates that all 342 hand-authored decompositions concatenate back to their
headword, that every headword is a real English word (checked against
`/usr/share/dict/words`), that every morpheme id resolves, that every Word
Detective note attaches to a real headword, and that the voice invariants below
still hold. Run it after any edit to `js/content/`.

## What it is trying to do

The learner this was built for reads fluently by recognition and skips the
effortful middle step — the same habit that has him doing arithmetic in his
head and refusing to write the working. It worked for years and then ran out
of road as the words got longer. The target is therefore not "reading". It is
**tolerance for showing the middle.** Word Autopsy is showing your work.

Design consequences, all of them load-bearing:

- **Shortcut-proof by construction.** A learner who optimises will find the
  cheapest path through any task within minutes. Autopsy requires committing to
  where the seams are; Equation requires typing the whole word. Neither can be
  answered by recognising a shape.
- **Multiple choice appears in exactly two places, on purpose.** Word Detective
  and The Word That Does Not Exist are the only activities where reasoning *is*
  the target skill rather than the thing being bypassed, so choosing is
  legitimate there. Their wrong answers are built by swapping exactly one
  morpheme, so they can only be eliminated by reading the piece that differs,
  never by plausibility. Nowhere else gets a multiple choice — a strong
  reasoner can eliminate ordinary distractors by logic and score full marks
  having practised nothing.
- **A wrong answer must show why.** Tinting the feedback a warning colour
  explains nothing. Autopsy renders the learner's cuts against the real seams
  with the spurious cut and the missed seam individually marked; Equation diffs
  the spelling letter by letter; Detective names the word the chosen answer
  actually belongs to, so the mistake teaches a second thing.
- **Never a timer on screen.** Latency is recorded, never displayed. The
  visible goal is "make this boring", which is also the honest description of
  what automaticity is.
- **It never mentions dyslexia and never shows a score not earned in the
  session.** It is word-machinery training, not a diagnosis.
- **Latin and Greek roots, not Latin and Greek.** The Codex teaches morphology
  in English, which is the high-yield thing. Learning Latin as a language is a
  separate and much larger project.

## Layout

```
index.html            shell
css/app.css           the fixed visual language
js/content/           morphemes.js, words.js (hand-authored) -> lexicon.js (derived)
js/core/              store, mastery, scheduler, log
js/voice/             banks.js (the writing), rewards.js, voice.js (selection)
js/content/notes.js   what 212 words literally say, and the stories behind them
js/content/pseudo.js  GENERATED — legal words that do not exist
js/core/analyze.js    best-effort matcher for words outside the corpus
js/activities/        autopsy.js, equation.js, detective.js, invent.js
js/ui/radar.js        scan a real passage for words worth pre-teaching
js/ui/codex.js        the collection he is building
tools/                serve.py, bundle.mjs, check.mjs, check-content.mjs, gen-pseudo.mjs
```

### The visual language is fixed

`violet = prefix`, `amber = root`, `teal = suffix`. These must never change
between sessions — the whole point is that colour carries structure. Bold
carries attention, underline carries the current target, and everything else
stays quiet so the word is always the dominant object on screen.

### The voice, and the one rule that is enforced in code

The program is a sardonic accomplice against English. It mocks itself, English,
the exercises and its own repetitiveness. It never mocks the learner.

That is not a style note, it is architecture. Message banks are segregated by
emotional context in `js/voice/banks.js`. Contexts that fire after a mistake
(`error`, `errorAutopsy`, `errorEquation`, `errorRepeat`, `hint`) have no
`joke` or `absurd` tier at all, and `say()` clamps them to `flavor` even when
the personality is set to "unsupervised". There is no code path by which the
sardonic register can land on him getting something wrong. `tools/check.mjs`
fails the build if anyone adds one.

Frequency budget by setting — `normal` / `funny` / `ridiculous` /
`unsupervised`, cycled from the home screen:

| setting | terse | flavour | joke | absurd | reward |
|---|---|---|---|---|---|
| normal | 88% | 12% | — | — | 2% |
| funny | 70% | 20% | 8% | 2% | 7% |
| ridiculous | 40% | 30% | 22% | 8% | 15% |
| unsupervised | 10% | 24% | 40% | 26% | 30% |

Rarity is what makes the jokes land at the lower settings; a computer that is
funny after every single answer is unbearable by session three. `unsupervised`
deliberately abandons that restraint, which is the joke.

### Rewards

`js/voice/rewards.js` holds 54 fart jokes, potato facts and bureaucratic
non-sequiturs. They fire only after a **correct** answer — a reward attached to
a mistake reads as mockery, which is the one thing this program does not do —
and each is shown at most once until the list is exhausted, tracked per
profile, so session ten is not session three again. Delivery is deadpan on
purpose: a fart joke told flatly by a bureaucratic computer is considerably
funnier than one told enthusiastically. Several of the potato facts are true.

### Content

`js/content/morphemes.js` and `js/content/words.js` are hand-authored and are
the only files that should be edited by hand. Everything else about the content
— allomorph lists, morpheme families, cut positions, difficulty levels — is
derived in `lexicon.js` so it cannot drift. A morpheme's `canonical` form is
what the Codex displays; its `forms` list is the observed allomorphs, sorted
longest-first for matching, which is the wrong order for display. Do not
conflate the two (`pos` would show up as "pound").

### The word that does not exist

`tools/gen-pseudo.mjs` builds legal English words English never happened to
make — `preflectable`, `trimortless`, `ungraphment` — from real morphemes, and
verifies against the system dictionary that each one is genuinely not a word.
Regenerate with:

```bash
node tools/gen-pseudo.mjs
```

This is the transfer test, and nothing else in the app answers the question it
asks: has the learner learned the *morpheme*, or memorised 519 *words*? An
invented word cannot be recognised, guessed from context, or remembered, so the
only route through is to take it apart and read the pieces.

Generation is deliberately constrained. Only productive affixes are used — `ad-`
and `ob-` are excluded because real English attaches them only in assimilated
form, so "adactal" is not a word English would ever have built. Suffixes are
matched to root type using the glosses, which already encode the distinction: a
verb root reads "to carry" and takes `-able`/`-er`/`-ive`/`-ment`, while a noun
root reads "life" and takes `-less`/`-ful`/`-ic`. Without that, the generator
happily produced "mispeltion" and "debioly". There is also a substring
blocklist; the cost of getting that wrong in front of a ten-year-old is high.

### Hard Word Radar

Paste a page of whatever they are actually reading and the app finds the words
worth taking apart first. `js/core/analyze.js` is the opposite of `words.js`:
hand-authored decompositions are exact, this is best-effort matching against
arbitrary text. It is deliberately conservative and claims a decomposition only
when the middle exactly matches a known root, because a wrong decomposition
teaches something untrue, which is worse than teaching nothing. Words it cannot
parse are reported as such rather than silently dropped — otherwise the scan
would look like it had covered the passage.

## Deploying

Pushing to `main` runs `.github/workflows/pages.yml`, which gates on
`tools/check.mjs` before deploying. Content integrity is a build gate on
purpose: a broken decomposition would teach the learner something untrue, so it
must never reach the deployed site.

## Not built yet

- **Audio.** Dictation spelling and audio↔print matching are the purest
  keyboard-scorable decoding tasks and both need spoken pseudowords. Browser
  TTS mangles nonsense words, so this needs pre-generated audio files shipped
  with the app, not runtime synthesis.
- **The oral block.** Record-don't-score: he reads a short list aloud, the app
  stores clips against item ids, he self-rates against a model pronunciation
  and you skim the clips later. Do not use ASR to score pseudowords — Whisper
  and browser speech recognition are language-model driven and will "correct"
  `splonter` to `splinter`, failing hardest on the most diagnostic task.
- **Pseudoword generation** from onset/nucleus/coda inventories, with a
  real-word exclusion and a profanity blocklist.
- **Drawing and annotation**, saved into the Codex cards.
- **The serialized story** — the actual retention mechanic.
- **The math strand** — same "show the middle" mechanic on problems too big to
  hold in his head, so he can see it as one habit rather than two subjects.
- **More Detective notes.** 212 of 519 words have one. The gap is mostly
  `-tion` derivatives, which the scheduler favours, so it currently substitutes
  an annotated word into detective slots rather than degrading them.
