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

That writes `dist/wordbreaker.html` — one file, no imports, no server, ~410 KB.
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
Progress is stored per-device; **Teacher → Save a copy now** writes a JSON save
you can drop in Dropbox and import on the other device from the player screen.

**This is the most fragile thing in the project.** There is no server, so the
whole record — every probe, every PAST level, the entire longitudinal
measurement — is one browser's local storage on one device. A cleared browser
does not set the study back, it ends it. Safari drops script-writable data
after about seven days without a visit and ignores the persistence request
outright, so on the iPad the exported copy is the only real backstop. The
Teacher screen shows when the last copy was saved and says so loudly once it
is stale — five sessions or a fortnight, whichever comes first, because
counting sessions alone would never notice a profile that simply sat untouched
for two months.

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

This runs the content checks, the voice invariants, and `tools/test.mjs`.

Validates that all 342 hand-authored decompositions concatenate back to their
headword, that every headword is a real English word (checked against
`/usr/share/dict/words`), that every morpheme id resolves, that every Word
Detective note attaches to a real headword, and that the voice invariants below
still hold. Run it after any edit to `js/content/`.

### The tests, and what they are for

`tools/test.mjs` — no framework, no dependencies, run by `check.mjs` and
therefore by the deploy gate.

The content checks validate the *content*. Nothing validated the code that
reads it and decides things: what counts as mastered, what gets retired, what a
probe may serve, when a word is finished, when a backup is overdue. Those
decisions **are** the study, and a regression in them produces no error, no
visible symptom and no wrong pixel — it quietly writes the wrong thing into a
record meant to answer a question about a child eight weeks later.

So the tests assert the pedagogy rather than the plumbing, and each one is
named as the rule it protects:

- accurate but still slow does **not** retire a word
- cramming cannot reach BORING, however many right answers it contains
- two clean days by sound alone does not finish a word — both routes or neither
- meaning-mode recall is never scheduled before the definition was taught
- the two probe pools are disjoint, fixed in composition, and never reused
- practice never touches a held-out measurement item
- a silent `e` after a vowel team lengthens nothing, and `s` is not `/z/`
  before a consonant

They were checked by breaking the code on purpose: reverting the both-routes
rule and the speed gate makes exactly two tests fail, by name. A suite that
cannot fail is decoration.

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
js/content/notes-derived.js  GENERATED — literal meanings composed from base notes
js/core/analyze.js    best-effort matcher for words outside the corpus
js/activities/        autopsy.js, equation.js, detective.js, invent.js
js/ui/radar.js        scan a real passage for words worth pre-teaching
js/ui/boring.js       the fluency shelf
js/core/fluency.js    per-item latency across days; retirement rules
js/content/math.js    Show the Middle problem generation
js/content/story.js   The Expedition — ten chapters
js/content/missions.js  Spelling Slaughter — curriculum word lists
js/core/mission.js    per-word slaughter status and drill ordering
js/core/speech.js     browser voices — spelling strand only
js/ui/story.js        chapter unlock flow and library
js/ui/codex.js        the collection he is building
js/core/probe.js      held-out measurement items; practice may never touch these
js/core/past.js       PAST administrations, recorded by an adult
js/activities/ladder.js  nonsense words read aloud, scored 1/2/3 by an adult
js/ui/teacher.js      the teacher area and the evidence view
js/content/manipulation.js  GENERATED — phoneme manipulation items
js/core/manipdrills.js      which Sound Swap item comes next
js/activities/manipulate.js the Sound Swap drill
js/core/userlists.js  spelling lists typed in by an adult
tools/                serve.py, bundle.mjs, check.mjs, check-content.mjs,
                      gen-pseudo.mjs, gen-notes.mjs
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

### Make it Boring

The fluency layer. Accuracy is not the goal here; effortlessness is — a word
answered correctly after visible work is not finished, and no other part of the
app notices the difference. `js/core/fluency.js` watches how long each item
takes across days and retires it once it has stopped costing anything.

Retirement is measured against the learner's **own baseline for that item**,
never an absolute number of seconds. An absolute threshold would punish a
careful reader for being careful and would say nothing about whether anything
had changed. Three gates, all of which must pass:

- seen at least 4 times across at least 3 **separate days** — cramming cannot
  retire a word
- the last 3 attempts all correct
- the median of the last 3 times down to 65% of the median of the first 3, or
  simply under 3.5 seconds

Being accurate but still slow does not retire a word. That is the entire point.
The timer is never shown; the only visible goal is that words become dull and
go away.

### Sound Swap — the only drill with no print in it

Kilpatrick's One Minute Activities, in the form that survives having no adult
in the room. The voice says a word, the screen says which sound to drop or
swap, and he types what is left. `cat` without /k/ is `at`; `cat` with the /a/
changed to /i/ is `kit`.

**The word is never shown, and that is the whole design.** Shown, the task
collapses: "feet without /f/" becomes crossing out a letter you can see, which
is a cheaper path than the intended one, and cheaper paths get found within
minutes. Unseen, the word has to be held in his head and taken apart there,
which is the skill this strand exists to build — it is the one thing in the
daily mix that works on sounds with no print in front of him.

It is scored **phonetically**, like nonsense dictation: `eet` for `eat` counts,
because the manipulation was right and the spelling is defensible. Marking only
the dictionary spelling would turn a phonology item into a spelling item and
fail him for the wrong thing.

**It is training and never evidence.** Typing takes seconds, so the time
recorded here is his hands, not his phonology, and must never be compared with
the PAST's two-second spoken window. It also adds a spelling step, so a child
who can manipulate a sound but not spell the result loses the item — phonetic
scoring softens that and does not remove it. And it is phoneme manipulation
*through print*, which is a hybrid of a deliberately oral task. The real PAST,
administered by an adult, stays the measure of the underlying skill.

Items are **arithmetic over pronunciations, never guessed**
(`tools/gen-manipulation.mjs`). An item exists only when the phoneme sequence
of the prompt word, minus or with one phoneme swapped, is exactly the sequence
of another word on a curated list — so both ends are known-real and
known-regular, which keeps `phonics.js` inside the range where it is right. Two
classes of wrong item came out of indexing answers by every possible reading:
`chip` can be read /kip/, and `be` can be read with a short e, so "change the
/sh/ in ship to /k/" and "bed without the /d/" both produced answers that do
not say what the word says. Answers are now matched on their primary reading
only, and `tools/check.mjs` re-derives all 1,109 items on every build.

The ladder is Kilpatrick's order — whole syllables, then first sounds, last
sounds, first-sound swaps, vowel swaps — and adaptive, so like the nonsense
drills, **growth shows here as the rung reached, never as the score.**

Regenerate with:

```bash
node tools/gen-manipulation.mjs
```

### Show the Middle — the maths strand

Breaking `47` into `40` and `7` is the same move as breaking `transportation`
into trans + port + ation, so it uses the same chips and the same colours on
purpose. It is a separate session rather than mixed into the word sessions —
different domain, different data — and the connection is made in the voice.

The total field is **disabled** until every partial is correct. That is the
whole activity. Merely *asking* someone to show their working is ignored by
anyone who has spent four years not showing it; the answer has to be
structurally unreachable until the middle is done.

### Spelling Slaughter — the school list

School's spelling words, run through the slicer. Curriculum words live in
`js/content/missions.js`, apart from `words.js`, so whatever the school is
teaching this week cannot quietly steer the morphology scheduler. Everything
else is shared: they parse identically, they credit the same mastery store, and
the pieces they teach land in the same Codex.

Each word runs through three stages, each giving away less than the last:

1. **Autopsy** — structure first, always, so what gets memorised has a shape
   instead of being ten loose letters.
2. **Look, cover, write, check** — studied as coloured morphemes, covered, then
   typed. Peeks are counted and never punished. This is *practice*.
3. **Cold recall** — the word is never shown. This is the *test*, and the only
   stage that certifies anything. There is also a **Spelling test** button that
   runs cold recall over the whole list in one sitting — every word once,
   dictated, no hints, no second go, and a mark at the end with the
   misspellings listed. It writes to the same log, so a word passed cleanly in
   the test counts toward slaughtering it: a test is the best evidence there
   is, so scoring it and then discarding it would be perverse. It runs in two
   prompt modes:
   - **from the meaning** — the definition plus the shape (how many pieces, how
     many letters)
   - **from the sound** — the word read aloud, which is what a real spelling
     test actually is

**The definition is taught before it is tested.** Cold recall's meaning mode
prompts with the definition and asks him to produce the word, and for a long
time that definition appeared on no other screen in the app — so the "spelling
test" was partly a guess at a sentence nobody had shown him. The definition now
appears on the autopsy reveal and throughout look-cover-write, with the word
still on screen, and `mission.js` will not schedule meaning-mode recall for a
word until that has actually happened. Until it has, only sound mode is offered.

The third stage exists because neither of the others can test spelling, however
they are dressed up. Look-cover-write hides the word for about three seconds,
so passing it demonstrates working memory. Word Equation lays out
`un + trust + worth + y`, which is every letter in the right order. Both are
useful practice; neither is evidence.

### Where the audio goes, and where it deliberately does not

Speech is used in the spelling strand only, via the browser's own voices — no
files, no network. Rates are in `RATE` in `js/core/speech.js`: real words at
0.75 and nonsense words at 0.6, both below the old flat 0.85, because there is
no word knowledge to fall back on when the word does not exist and every
phoneme has to land. Dictation prompts are read **twice** with a gap, the way a
teacher running a spelling test does, and carry a **Slower** toggle. Voice
selection prefers macOS's Enhanced/Premium/Siri voices over the compact
defaults; the teacher area says which voice is in use and how to install a
better one, because the compact voices are robotic and no amount of app code
fixes that. It is safe here because every curriculum word is a **real
English word**; a speech engine is language-model driven and would mangle the
invented words in the transfer test, so nothing outside Spelling Slaughter
touches it.

Hearing the word is the authentic prompt for a spelling test, not a shortcut —
but only in the right place. Audio appears, always as a **replayable button**
rather than a single reading that cannot be repeated:

- as the **dictation prompt** for cold recall, where replaying is free because
  it *is* the prompt
- on the **autopsy reveal**, where the word is already on screen, so hearing it
  costs nothing and links spelling to sound
- throughout look-cover-write, **including after the cover**, while he is
  writing from memory
- on the **cold recall reveal**, in both modes, once the answer is locked in

It appears after the cover because look-cover-write is *practice* and certifies
nothing — only cold recall gates mission progress — so audio there costs no
evidence, and being unable to re-hear a word you are trying to write is an
obstacle with no teaching in it. It appears on the recall reveal because by then
it cannot help him produce anything, and hearing the word beside the spelling he
just committed to is the moment sound and letters are most worth connecting.

There is exactly one place it is still refused: **as a prompt inside
meaning-mode cold recall.** A word counts as slaughtered only when produced by
both routes, and a "say it" button there would turn meaning mode into sound
mode and collapse the two-route requirement into one. It would also flatten the
hint ladder — "say the word" gives away far more than either existing rung, so
it would become the only hint ever used.

Instead each mode's first hint is **the other mode's prompt**: dictation offers
the definition, meaning offers the piece meanings. Then a skeleton showing only
each piece's first letter (`u· + t···· + w···· + y`), then a refusal. Every rung
is counted and none is scolded — what matters is not whether he needed one
today, but that he needs fewer over time.

A word is **slaughtered** only when recalled cold — correct, first attempt, no
hints — on two SEPARATE days, **and by both routes**. A speller who can only go
from sound has memorised a noise; one who can only go from meaning may never
have connected the word to how it is said. Where the browser has no speech the
sound half is dropped rather than making words unfinishable.

Every curriculum word requires a `def`; `tools/check.mjs` fails the build
without one, or if a definition contains the word it is defining.

**Most lists are typed in, not coded.** Teacher → **Spelling lists** takes this
week's list one word per line, proposes how each word comes apart, and lets you
correct it before saving. Lists live in the profile, travel with a profile
export, and are parsed exactly like the compiled-in ones — same specs, same
activities, same mastery store, same Codex.

A definition can ride along on the same line after `=`, because that is how a
school sheet is usually already written and retyping twenty definitions is the
part that stops this being used. A word without one can still be practised and
tested by sound, but it cannot be *finished*, since a word has to survive both
routes — so the word board marks it "needs a meaning".

The proposal comes from `js/core/analyze.js`, and it is conservative on
purpose. It reuses the exact decomposition when the word is already on any list,
falls back to matching a known root, and otherwise keeps the word **whole**
rather than cutting it somewhere plausible — hand-authored decompositions are
exact, this is a guess, and a wrong seam teaches something untrue. `mission.js`
never sends a whole word to the autopsy, so he is not asked to find a seam that
is not there.

The build-time check cannot see a typed list, so `js/core/userlists.js` applies
the same rules at the moment of saving: the pieces must concatenate back to the
word exactly, every morpheme id must resolve, and a definition may not contain
the word it defines. A list with one bad word is refused whole — half a list
would be worse than none.

To add a mission in code instead, append to `MISSIONS` in
`js/content/missions.js` using the same `surface:morphemeId` notation as the
corpus. `tools/check.mjs` verifies
every curriculum word decomposes exactly, resolves to real morphemes, is a real
word, and that any `display` capitalisation matches the spelling.

### The Expedition — the narrative hook

Twenty chapters, one per completed session, each locked behind a long word.
Breaking the word is how the chapter opens, so the story and the mechanic are
the same action rather than a reward bolted onto one another. Opening is not
conditional on getting the word right first time — the chapter is the reward
for the attempt, not a prize for accuracy.

Gate words are validated by `tools/check.mjs`: each must exist in the corpus,
have at least three pieces, and be unique across chapters.

Chapters 1-10 are the first expedition, which is about taking a word apart.
Chapters 11-20 are the second, which is about where the pieces come from —
the Latin and Greek quarries, what English has borrowed and never given back,
words that do not come apart at all, and the ones nobody uses any more. That
is the other half of what the Codex teaches, and the last chapter lands on why
it matters: knowing the pieces is what lets him read a word he has never seen,
which is exactly what the transfer test asks of him.

A paragraph whose lines are all indented is treated as **signage** — a notice,
a sign on a desk — and keeps its line breaks. Ordinary prose is hard-wrapped
in the source, so its breaks are joined back up.

### The home screen

One daily action and two doors. `Start` is large; **Spelling Slaughter** and
**Your collection** (the Codex, the Expedition and Make it Boring) are
secondary; the manner setting and **Teacher** sit in a footer. **Show the
Middle** is deliberately not offered to the learner — the maths strand competes
for attention with the reading work, so it starts from Teacher instead.
Nothing else is on it — no counters, no stats row — because seven equal buttons
meant nothing signalled which one was for today, and the running totals were
both most of the page's text and a score he had not earned in the session.

Inside a mission, the actions come **before** the word board: `Take the
spelling test`, `Practise`, `Fix the misses`. And when there is only one
mission, tapping Spelling Slaughter goes **straight into it** rather than
showing a list containing a single card — that intermediate screen was the
reason the test could not be found, because the card it held read as a
progress bar rather than a button. The path is now two taps: home → Spelling
Slaughter → the test is the first thing on the screen. With more than one
mission the list comes back, **newest first** — the list at the top is the one
school is testing now — and every card carries its own `Take the test` button,
so the test is still two taps and never hidden behind a card. The home tile says *a test is
ready* once a word has been practised but never produced cold.

Pop-ups are for decisions, never destinations — currently just the manner
setting, which used to be a button that cycled blind through four states, so
seeing the options meant pressing it four times. A modal with a keyboard up on
an iPad is miserable, so everything else stays a real screen.

### Session shape

Sessions used to end on their two hardest words, which is backwards for
finishing on a high note, so a cooldown item now follows the stretch block.
The plan also adapts as it runs:

- a morpheme missed twice fires the "we have found your nemesis" message **and
  injects easier words built on that morpheme.** Saying the plan has changed
  while carrying on with the original plan would make the line a lie.
- three misses in the last four winds the session down early onto a recovery
  item. Stopping early costs a few items; making it aversive costs the project.
- a session never finishes on a miss.
- a run going well is *offered* four more, never given them.

### The Teacher area, and why measurement is kept apart from practice

Behind **Teacher** on the home screen: the activities that need an adult's ear,
and the evidence view. It is visually distinct and never mixed into a solo
session — a screen full of his own scores, wearing the same clothes as the
game, would put a running total in front of him, which the rest of the design
exists to avoid.

The organising idea is **Gate 0**. `docs/predictions.md` pre-registers two rival
readings of the same child and fixes the thresholds that separate them, and
every one of those thresholds is a *change from baseline*. Until a baseline
exists, none of the branch logic means anything — it is a decision procedure
with no input. So the first thing the Teacher screen does is say which of the
three baselines have been taken and which have not.

**Practice cannot measure itself.** The nonsense drills climb a ladder that
adapts to how he is doing — up a rung at 80% accuracy, down one below 50%. That
is good teaching and a useless instrument, because it holds accuracy inside a
band whichever way he is actually moving; an accuracy trend out of it would be
roughly flat under both hypotheses. Growth shows up there as the *rung reached*,
never as the score. So measurement gets its own pool and its own rules, in
`js/core/probe.js`:

- **Fixed composition.** Two items from each of the six patterns, easiest
  first, every single time. Difficulty never adapts, so a change in the number
  is a change in him.
- **Reserved items.** 40% of the 1,963 nonsense words are held out by index —
  20% for reading, 20% for spelling, with no overlap. Practice can never serve
  one, and the two probe kinds can never serve each other's. Reading a word
  aloud in week 2 and being asked to spell it in week 5 would make the week 5
  number a memory test.
- **Never reused**, which `predictions.md` requires.
- **Its own runner.** Probes deliberately do not go through `runSession`, which
  injects easier items after a repeated miss, winds down early on a bad run and
  appends a recovery item so nothing ends on a failure. All of that is right for
  practice and fatal to a measurement: a probe that quietly got easier when he
  struggled would report a flat line whatever happened.
- **All or nothing.** An abandoned probe is discarded rather than half-saved. A
  partial probe is not comparable to a whole one, and storing it would poison
  the series it is compared against.

The **primary outcome is nonsense-word decoding** — reading them aloud, scored
by an adult as 3 instant / 2 sounded-then-blended / 1 letter-by-letter. The
3-versus-2 distinction *is* the measurement: Branch A predicts taught patterns
come to be read as whole units and Branch B predicts he is still assembling
them, and plain accuracy cannot separate those, because a child who laboriously
decodes every word correctly scores 100% under both. Nonsense-word *spelling*
(the dictation probe) is a secondary outcome and the only one that runs solo.

Do not be tempted to score the reading probe with speech recognition. Every
engine available is language-model driven, so it will hear `splonter` and write
down `splinter`, turning the most diagnostic item in the battery into a false
pass. The reason nonsense words measure anything is that they cannot be
recognised, and an ASR is a recogniser.

The **PAST** is administered by an adult, with the app driving the items and
the two-second window. Both *correct* and *automatic* are recorded, because the
gap between them is Kilpatrick's whole argument: correct-but-slow is a skill
that is not yet automatic, which is a different finding, a different prediction
and a different next test from not having the skill.

**The PAST items are not in this repo, and must not be added.** The test is
Kilpatrick's and he gives it away free at <https://thepasttest.com> — four
alternate forms (A/B/C/D), the same test with different words, meant for
exactly the repeated administration this project needs. Free to download is not
free to republish, and this app is deployed to a public address. So the app
ships the machinery and you paste a form in once, from your own copy; it is
stored per-device and travels in the profile export. Format and parser live in
`js/core/pastform.js`.

Inventing PAST-like items would be worse than shipping none. A made-up test
producing a made-up automaticity profile would still *look* like evidence, and
`docs/predictions.md` hangs the entire falsification of Branch B on "PAST all
automatic at baseline". There is also a paper fallback: a quick recorder for a
PAST run away from the computer.

The evidence view prints compliance next to the outcome rather than on another
screen, because `predictions.md` names it as a confound: a flat result at three
sessions a week means something and at three a fortnight means nothing.

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
- **The rest of the oral block.** The Nonsense Ladder is built and adult-scored;
  what is still missing is the solo variant that records clips against item ids
  for later review, and the Reading Aloud miscue log. Do not use ASR to score
  pseudowords — Whisper and browser speech recognition are language-model driven
  and will "correct" `splonter` to `splinter`, failing hardest on the most
  diagnostic task.
- **One Minute Activities.** The presenter is designed but the item bank does
  not exist in the repo yet. It is intervention rather than measurement, and
  its own sequencing rule — start at D1 whatever the PAST says — means it does
  not depend on the Gate 0 result, so it was not on the critical path.
- **Pseudoword generation** from onset/nucleus/coda inventories, with a
  real-word exclusion and a profanity blocklist.
- **Drawing and annotation**, saved into the Codex cards.
- **The serialized story** — the actual retention mechanic.
- **More maths types** — order of operations and distributive shortcuts
  (99 × 7 as 100 × 7 − 7). Only partial products are built.
- **More chapters** — twenty is about twenty sessions of runway. The second
  arc ends the way the first one did, with another notice going up, so a third
  is set up but not written.
- **More Detective notes.** 272 of 519 words now have one (212 hand-written,
  60 derived). The remaining gap is mostly `-able`/`-ible` adjectives, which
  need a past participle ("able to be seen") that cannot be composed
  mechanically from "to see" without an irregular-verb table. The gap is mostly
  `-tion` derivatives, which the scheduler favours, so it currently substitutes
  an annotated word into detective slots rather than degrading them.
