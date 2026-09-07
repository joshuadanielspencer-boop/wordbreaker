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
> **Next up is Phase 3, the Teacher area** — the parts of Kilpatrick that need
> an adult's ear, plus the evidence view. But before building it, tell me
> whether you agree that's the right next move, given that nothing in the
> branch logic means anything until Gate 0 has actually been run.

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

## The shape of the thing

```
Solo, daily        Start (mixed session, ~17 items, a third of it Kilpatrick),
                   Spelling Slaughter, Show the Middle, Hard Word Radar,
                   Codex, The Expedition
Built, Phase 1     Impostor Row, Ransom Note, Spell It Out
Built, Phase 2     Nonsense Dictation, Sound Hunt
Not built          Phase 3 teacher area, Phase 4 word-study enrichment
```

Content generators (`tools/gen-*.mjs`) write the `js/content/*.js` files marked
GENERATED. Edit the generator, never the output.
