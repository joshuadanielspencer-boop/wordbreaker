# Handoff

Paste the block below to continue this project in a fresh session. Everything
else it needs is in the repo — this file exists so the next session does not
have to rediscover the constraints by breaking them.

---

## The prompt

> I'm continuing work on Wordbreaker, a reading/spelling app I've been building
> with you for my 10-year-old son. The project is at
> `/Users/joshuaspencer/Dropbox/Wordbreaker` and deploys to
> https://joshuadanielspencer-boop.github.io/wordbreaker/
>
> Before doing anything, read these in order:
> 1. `README.md` — what the app is, how to run it, and the design rules that
>    are load-bearing rather than decorative
> 2. `docs/kilpatrick-build-plan.md` — the current build plan, with Phases 1
>    and 2 marked done
> 3. `docs/predictions.md` — predictions pre-registered before any baseline
> 4. `NOTES.private.md` — who the learner is and why the app is shaped this
>    way. **Gitignored. Never commit its contents or paste them into anything
>    that leaves this machine.**
>
> Then run `node tools/check.mjs` to confirm the content invariants still pass,
> and `python3 tools/serve.py` when you need to see it.
>
> The teacher area is built and **Gate 0 has still not been run** — the app can
> now take all three baselines, but nobody has sat down and taken them. That is
> the next thing, and it is not a coding task. Tell me what you would do first.

---

## What the next session should know before it starts changing things

**The app is finished enough to be used.** He has played it. Do not restructure
what works; add to it.

**Verify in the browser, not by reasoning.** Almost every real bug in this
project was found by driving the app and looking — a prompt that printed the
answer it was hiding, a stacked word 650px tall, a progress bar that marked
misses as hits, a "clean" flag that certified a word he had got wrong. None of
them were visible in the source. There is a no-cache dev server for this
reason; use it.

**Run `node tools/check.mjs` before every commit.** It gates content integrity
*and* two behavioural invariants: no voice bank may be unreachable, and no
sardonic line may be reachable after a mistake. Both were added after those
exact failures happened.

**The learner is an optimiser.** Any task with a cheaper path than the intended
one will be solved the cheap way within minutes. This is the single most
important design constraint and it has already bitten twice.

**Do not add home-screen buttons.** New drills join sessions as blocks. The
home screen is full; the plan has a restructure sketched if it must grow.

**Speech is for the spelling strand only.** Browser voices handle real words
and Appendix H nonsense words fine — that was tested by ear. They are not
trusted for the invented morphological words in the transfer test.

**`js/core/phonics.js` is not a general English converter.** It works only
because Appendix H words are phonically regular by construction.

**Never let practice touch a probe item.** `js/core/probe.js` holds out 40% of
the nonsense pool by index for measurement, and `nonsensedrills.js` subtracts
that set. Anything new that draws nonsense words must subtract it too. The two
probe kinds are disjoint from each other as well — a word read aloud in week 2
and spelled in week 5 turns the week 5 number into a memory test.

**Probes must not run through `runSession`.** That function injects easier items
after a repeated miss, winds the session down early on a bad run, appends a
recovery item so nothing ends on a failure, and offers four more when things go
well. Every one of those changes the item set in response to how he is doing,
which is the exact confound a fixed-composition probe exists to remove. There is
a separate `runProbe` for this reason. A probe that quietly got easier when he
struggled would report a flat line whatever was true.

**The definition must be taught before it is tested.** Meaning-mode cold recall
prompts with the definition; `mission.js` will not schedule it until a stage
that displayed the definition has been logged (`detail.defShown`). Anything that
tests a word from its meaning has to check that first.

**Never add the PAST items to this repo.** The test is Kilpatrick's, free at
thepasttest.com, and this app deploys to a public address — free to download is
not free to republish. The app ships the machinery; the adult pastes a form in
once (`js/core/pastform.js`), stored per-device. Do not "helpfully" generate
PAST-like items either: a made-up test producing a made-up automaticity profile
would still look like evidence, and predictions.md hangs Branch B's whole
falsification on "PAST all automatic at baseline".

**Say numbers in sentences in the teacher area.** `tion · 45% · n=11` is
precise and tells a parent nothing they can act on. And below four attempts,
refuse to characterise him at all — one wrong answer is not a pattern, and a
screen that says it is invites exactly the over-reading of thin data this
project exists to avoid.

**An adaptive ladder cannot be an outcome measure.** `currentPattern()` holds
accuracy in a band by design. Growth shows there as the rung reached, never as
the score. If someone asks for "the accuracy trend from his dictation
practice", that number does not mean what it looks like.

## The shape of the thing

```
Solo, daily        Start (mixed session, ~17 items, a third of it Kilpatrick),
                   Spelling Slaughter, Show the Middle, Hard Word Radar,
                   Codex, The Expedition
Built, Phase 1     Impostor Row, Ransom Note, Spell It Out
Built, Phase 2     Nonsense Dictation, Sound Hunt
Built, Phase 3     Teacher area — PAST administration (form loaded by the
                   adult) plus a paper recorder, Nonsense Ladder, both probes,
                   evidence view, spelling report, review-the-misses drill,
                   whole-list spelling test
Not built          One Minute Activities (no item bank), Reading Aloud miscue
                   log, Phase 4 word-study enrichment
```

**Gate 0 is the blocker, and it is not a coding task.** All three baselines can
now be taken and none has been. Until they are, the evidence view has nothing to
compare against and the branch logic in the build plan has no input. Building
more features does not move this.

Content generators (`tools/gen-*.mjs`) write the `js/content/*.js` files marked
GENERATED. Edit the generator, never the output.
