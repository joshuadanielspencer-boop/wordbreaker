# Kilpatrick build plan

How *Equipped for Reading Success* gets built into this app. Companion to the
source integration plan (kept with the book transcription, outside this repo);
this file is the engineering half — what gets built, in what order, what each
thing measures, and which pieces cannot run without an adult.

Learner-specific detail stays in `NOTES.private.md`, which is gitignored.

---

## The two constraints that shape everything

**1. Solo-first.** The learner uses this alone most days. Four of Kilpatrick's
six baseline measures and the whole of his phonemic-awareness core need a human
ear — they cannot be scored by software, and speech recognition is not an
option because it is language-model driven and will "correct" a nonsense word
into a real one. Those activities are built, but they are marked `teacher: true`
and live in their own area. They accumulate data at whatever rate an adult sits
down with him, which is a planning fact, not a detail: **anything that must run
weekly has to work solo.**

**2. Short enough that he opens it.** Kilpatrick's own remedial template is
blocks of 30 seconds to 3 minutes, nothing longer, under 20 minutes total. That
matches this app's existing shape, so new work arrives as *blocks that can join
a session* rather than as more buttons on the home screen. The home screen is
already close to full; a wall of twelve entries would be worse than any single
activity is good.

---

## What is already covered

Kilpatrick's Chapter 6 word-study techniques map onto things this app does:

| Technique | Where it already lives |
|---|---|
| #16 word structure analysis | Word Autopsy |
| #10 oral spelling (sequence under time) | Spelling Slaughter — look/cover/write |
| #12/14 nonsense-word work | The Word That Does Not Exist (morphological only) |
| #1/#4 introduce orally, then map to print | Spelling Slaughter drill order |
| every-error feedback | error comparison rows across all activities |

The gap is everything phonological: he has never been asked to manipulate a
sound, and the app has never measured whether he can do it quickly.

---

## Build order

Phased by *what accumulates evidence fastest*, not by what is most interesting.

### Phase 1 — anti-compensation (solo)

Kilpatrick's Chapter 6 §19–24 exist to make guessing impossible. They are the
best match in the book to the habit hypothesis, they are trivial to build, and
their strangeness reads as a puzzle rather than as remediation.

| Activity | Technique | What it defeats | Measures |
|---|---|---|---|
| **Impostor Row** ✅ | §5 look-alike words | first-letter cue, word shape, length | discrimination accuracy + time |
| **Ransom Note** ✅ | §20–24 distorted text | word shape, whole-word recognition | accuracy per distortion type |
| **Spell It Out** ✅ | #11 oral decoding | everything visual | orthographic memory |

Phase 1 is built. All three are scheduled into ordinary sessions rather than
placed behind buttons: two Impostor Row items plus one rotating
Ransom/Spell-It-Out item, three of about eighteen. Both drills draw only on
words already MET — an unfamiliar word would confound the measurement, since a
low score would no longer say anything about the habit.

Ransom Note rotates its six distortions least-recently-used first, because
adapting to one type is precisely the failure mode it exists to prevent, and it
logs accuracy per distortion rather than pooled so the diagnostic signal
survives.

Look-alike sets are **generated**, not transcribed: Appendix G's OCR is wrecked
by its two-column layout, and Kilpatrick says outright the printed sets are
"just samples, you can create your own." Generating from the corpus by edit
distance gives better control over difficulty and unlimited material.

Ransom Note is also diagnostic. Kilpatrick notes that a learner who *cannot*
adjust to distorted text probably lacks letter-sound or phoneme skills — so
failure here is itself a signal that pushes toward Phase 3.

### Phase 2 — nonsense words (solo, and the primary outcome) ✅ built

Nonsense words are the only material where recognition is structurally
unavailable, which makes them both the best practice and the best measure.

- **Nonsense Dictation** — the voice says it, he types it. Scored
  *phonetically*: any spelling that would be pronounced the same is correct
  (`fraib` for `frabe`), because the point is the sound-to-letter mapping, not
  the arbitrary spelling. This is Kilpatrick §2.3 and it is cheap, sensitive,
  and fully solo.
- **Sound Hunt** — phoneme-to-grapheme mapping (#2). A sound plays; he picks
  the grapheme from up to five tiles, including "none of these". Progresses
  letters → digraphs → vowel teams → blends → rime units → suffixes.

**The phonetic scorer** lives in `js/core/phonics.js`. It returns a SET of
possible pronunciations rather than one, because `ea` is /ee/ in bead and /e/
in bread; two spellings match if any pronunciation is shared, which errs toward
accepting a defensible answer. That is the right direction to err — the
alternative is telling a child their correct spelling is wrong.

It is tractable only because Appendix H words are phonically regular by
construction. **It is not a general English converter** and must not be used as
one; it would mangle `colonel` or `yacht` without hesitating.

Two rules were wrong on first pass and are worth remembering: a final silent
`e` after a vowel TEAM does not lengthen anything (`thaice` and `thace` say the
same thing), and `s` is only /z/ between vowels — allowing it everywhere
invented pronunciations that would have accepted wrong spellings.

**Source material** is generated by `tools/gen-nonsense.mjs`: 1,963 words from
Appendix H, grouped by pattern, every one checked not to be a real word and to
parse as a legal English syllable, which is what removes the OCR debris the
multi-column source leaves behind. Multisyllabic items are *built* from short
ones by adding endings rather than scraped, because the OCR is least reliable
on those pages and because building them is Kilpatrick's own advice.

### Phase 3 — the teacher area (adult required) — partly built

Its own section, visually distinct, never mixed into a solo session.

**Phase 3 was re-ordered before it was built, around one question: what does
Gate 0 actually need?** The phase as originally written was a four-activity
area plus a dashboard, and only about half of it turned out to be on the
critical path. Two of the three baselines live in here and cannot be taken
without it, which is the real reason this phase came next — not completeness.

| Activity | Why an adult | Status |
|---|---|---|
| **The PAST** | phoneme judgements need an ear | ✅ Built. The app drives the items and the two-second window; the adult listens and taps. The items are **not** in the repo — the test is free from thepasttest.com and the adult pastes a form in once, because free to download is not free to republish and this app is public. A paper recorder remains for runs done away from the computer. |
| **The Nonsense Ladder** | reading aloud must be heard | ✅ Built as the primary-outcome probe. Adult scores 1 (letter-by-letter) / 2 (sounded then blended) / 3 (instant). The solo audio-recording variant is not built. |
| **The evidence view** | — | ✅ Built, last rather than first. A dashboard at n=0 is worse than none: trend lines through three points invite exactly the after-the-fact reinterpretation `predictions.md` exists to prevent. |
| **One Minute Activities** | phoneme manipulation is oral | ⏳ Deferred. It is *intervention*, not measurement, and its own sequencing rule — start at D1 whatever the PAST says — means it does not depend on the Gate 0 result, so it blocks nothing. The `activities.json` item bank does not exist in the repo yet. |
| **Reading Aloud** | miscues must be heard | ⏳ Deferred. Secondary outcome. Every error logged with type; Kilpatrick's evidence is that correcting *every* error beats correcting only meaning-changing ones. |

Sequencing for One Minute Activities is Kilpatrick's, not invented: start at D1
whatever the PAST says and climb one activity per level until he struggles;
spend time only at F and above; advance after three or four consecutive
automatic days.

#### Two measurement defects found and fixed on the way in

Both were live, and both were corrupting data every session he played.

**1. The repo disagreed with itself about the primary outcome.**
`predictions.md` says nonsense-word *decoding* — read aloud — with spelling as a
secondary outcome. `nonsensedrills.js` said in a comment that dictation, which
is spelling, was "the primary outcome variable for the whole project". Whichever
had won by default, it would have been settled after the data arrived, which is
the failure the pre-registration exists to prevent. `predictions.md` wins
because it was written first; the comments now say so.

**2. The instrument regulated away the thing it was measuring.**
`currentPattern()` climbs a rung at 80% accuracy and drops one below 50% — an
adaptive staircase, which by construction holds accuracy inside a band. The
pre-registered threshold of a 20-point accuracy gain in nonsense spelling could
therefore never have been observed, whichever branch was true. Practice and
measurement are now separate: `js/core/probe.js` holds out 40% of the item pool
by index (20% reading, 20% spelling, disjoint), serves a fixed composition of
two items per pattern every time, and runs outside `runSession` so the
session's own adaptations — easier items after a miss, early wind-down, a
recovery item so nothing ends on a failure — cannot reach it.

A third, smaller one: `dictationItems()` fell back to the full pattern list when
a rung's unused pool ran short, silently re-serving spent words. It degraded
first and hardest on the patterns he had drilled most, which are exactly the
ones that matter. It now falls to a neighbouring rung instead, and samples
without replacement so one session cannot serve the same nonsense word twice.

### Phase 4 — word study enrichment (solo)

- **Backwards** — backward decoding (#8), revealing from the rime forward
  (`er → ter → enter → penter → arpenter → carpenter`). Also the tool offered
  when he is stuck on a word anywhere else in the app.
- **Rime highlighting** in Autopsy (#9) — onsets grey, rimes black, faded out
  as accuracy rises.
- **Making and Breaking** (#17) — the letters of a long word, scrambled; find
  as many words as possible, then the long one.

---

## Home screen restructure

Twelve entries would be worse than any of them is good. Target shape:

```
Start            the daily mix — now draws blocks from a wider pool
Spelling Slaughter   curriculum lists
Show the Middle      maths
Hard Word Radar      paste real text
The Codex            what he has collected
The Expedition       the story
Teacher              everything needing an adult, plus the evidence view
```

Make it Boring and the Phase 1/2/4 drills become **blocks inside a session**,
scheduled like any other activity, rather than separate destinations. This also
gets them practised regularly instead of only when chosen.

**Teacher** is built and cost no new home-screen entry: it replaced the old
Progress button, which now lives inside it.

---

## The evidence view

The point of all of this is to answer one question: does word-level skill move
under good instruction? A dedicated view in the teacher area tracks it:

- nonsense-word decoding accuracy and time, weekly, fresh items each time
- nonsense-word spelling accuracy
- PAST levels — highest correct, highest automatic
- oral-reading miscue rate and type mix
- look-alike discrimination time

**Predictions are written down before the data arrives** (`docs/predictions.md`),
so the result cannot be reinterpreted afterwards. Fast movement in weeks
supports the habit reading; flat nonsense-word decoding despite automatic PAST
levels points at rapid naming or working memory and argues for a CTOPP-2.

Built, with the pre-registered thresholds printed next to the numbers rather
than recalled from memory, and compliance printed next to the outcome rather
than on another screen — `predictions.md` names session frequency as a confound,
and a confound on a different screen is a confound that gets forgotten at the
moment of interpretation. Oral-reading miscues are the one listed measure not
yet collected, because Reading Aloud is deferred.

---

## Rules any new activity must follow

Inherited from the rest of the app, and they apply to everything above:

1. **Shortcut-proof by construction.** If there is a cheaper path through the
   task than the intended one, he will find it within minutes.
2. **Multiple choice only where reasoning is the target skill.** Distractors
   must be eliminable only by the skill being trained — Impostor Row qualifies
   because its distractors differ by one grapheme.
3. **A wrong answer shows why.** Comparison rows, not a warning colour.
4. **No timer on screen.** Latency is recorded, never displayed.
5. **Hints are counted, never punished**, and never collapse the ladder — a
   hint that gives away more than the rung below it becomes the only hint used.
6. **Content is validated by `tools/check.mjs`** or it does not ship.
