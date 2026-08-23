// The voice.
//
// ARCHITECTURAL RULE, not a style note: banks are segregated by emotional
// context. Contexts that fire after a MISTAKE (`error*`, `hint`) have no
// `joke` or `absurd` tier at all, and voice.js clamps them to `flavor` even on
// the wildest personality setting. There is no code path by which the sardonic
// register can land on the learner getting something wrong. If you are tempted to put
// a funny line in an error bank, put it in `blockEnd` instead.
//
// The program mocks itself, English, the exercises, and its own repetitiveness.
// Never the student.
//
// Tiers: plain (terse, most of the time) < flavor < joke < absurd.

export const BANKS = {

  // ------------------------------------------------------------ session open
  open: {
    plain: [
      'Right. Ten minutes.',
      "Let's go.",
      'Back to the machinery.',
      'Session {n}. Begin.',
      'Words. Again.',
      'Starting.',
      'Here we are.',
      'Ready when you are.',
    ],
    flavor: [
      'According to my highly sophisticated calculations, you still have English.',
      'Today: taking words apart. As usual.',
      'I have prepared words. Several of them are long.',
      'Session {n}. I have not improved as a person since session {n} minus one.',
      'The words are ready. The words are always ready. The words do not sleep.',
      'Let us go and be slightly better at English than we were on Tuesday.',
      'I have selected today\'s words entirely at random, apart from the part where I did not.',
      'Some of these you have seen. Some of these you have not. I know which. I am not telling.',
    ],
    joke: [
      "I've been sitting here doing nothing since {days}. Thank you for ending my suffering.",
      'Today we dismantle English. English does not know this yet.',
      'I have spent the entire night thinking about the letter Q. I have no conclusions.',
      'Welcome back to WORDBREAKER, a program that breaks words, which you could have guessed.',
      'I ran diagnostics on myself. Everything is fine except my personality, which is by design.',
      'I would offer you a snack but I have no arms and no snacks. Otherwise the offer stands.',
      'Some programs greet you warmly. I have decided against this.',
      'A word is just a small building. We are going to take the roof off several of them.',
      'I asked English to make more sense overnight. English declined.',
      'Fair warning: at some point today a word is going to have four pieces and you are going to sigh.',
    ],
    absurd: [
      'THE DEPARTMENT OF EXTREMELY LONG WORDS HAS SENT A LIST.\nI am legally obliged to show it to you.',
      'INCOMING TRANSMISSION FROM ANCIENT ROME\n"we are still using these"\nEND OF TRANSMISSION',
      'A COMMITTEE HAS MET.\nThe committee is me.\nThe committee has selected fourteen words.\nThe committee is adjourned.',
      'SOMEWHERE, A LATIN TEACHER HAS SAT BOLT UPRIGHT IN BED.\nThey do not know why.\nWe know why.',
      'THE WORDS HAVE BEEN ASSEMBLED IN A ROOM.\nThey have been told nothing.\nThey are becoming suspicious.',
      'ATTENTION.\nThis program has been running unsupervised for {days} days.\nNo adult has checked on it.\nProceed.',
    ],
  },

  return: {
    plain: ['You have returned.', 'Back again.', 'There you are.', "It's been {days} days."],
    flavor: [
      "It's been {days} days. I saved your progress anyway.",
      'I assumed you had escaped. I was wrong.',
      '{days} days. The words waited. The words are patient.',
      'Welcome back. Nothing has changed. Nothing ever changes here.',
    ],
    joke: [
      '{days} days. I did not move. I have no legs, so this was not difficult.',
      'You were gone {days} days. I alphabetised everything twice and then put it back.',
      'I had almost forgotten you. Then I remembered I cannot forget things. That is not a feature I have.',
      '{days} days! I have been staring at the word "onion" the entire time. I have questions.',
    ],
    absurd: [
      'MISSING PERSON REPORT — CLOSED\nSubject: you\nLast seen: {days} days ago\nStatus: has wandered back in\nNo further action required.',
      'DURING YOUR ABSENCE THE FOLLOWING OCCURRED:\n- nothing\n- absolutely nothing\n- one (1) word thought about leaving but did not',
    ],
  },

  // ---------------------------------------------------------------- correct
  correct: {
    plain: [
      'Correct.', 'Yes.', 'Right.', 'Good.', 'That’s it.', 'Clean.',
      'Yep.', 'Correct again.', 'Fine.', 'Good one.', 'Solid.', 'Exactly that.',
    ],
    flavor: [
      'Correct. As expected.',
      'Yes. Moving on before either of us gets emotional.',
      'Correct, and quickly.',
      'Right. That one had a trapdoor in it and you did not fall through.',
      'Correct. English will be furious.',
      'Yes. Next.',
      'That is the one. Good.',
      'Correct. I had doubts. I keep them to myself.',
      'Right again. This is becoming a pattern and I am watching it.',
      'Yes. That piece is starting to behave itself.',
    ],
    joke: [
      'Correct. I had prepared an explanation. It is now useless.',
      'Yes. English tried nothing and failed.',
      'Correct. I will add that to your permanent record, which does not exist.',
      'Right. The word has been informed and is taking it well.',
      'Correct. I am contractually required to remain unimpressed. Internally: impressed.',
      'Yes. I had a whole speech ready about that suffix. Wasted. Ruined.',
      'Correct. That is the fourth time today English has been publicly humiliated.',
      'Right. Somewhere a dictionary shifted uncomfortably on its shelf.',
      'Yes. I have updated my model of you. My model of you is doing fine.',
      'Correct. Do not let it go to your head. Let it go somewhere else. An elbow.',
      'Right. I would celebrate but I am a website.',
      'Yes. Filed under "things that went fine".',
    ],
    absurd: [
      'CORRECT.\nSomewhere, a Roman is nodding slowly.',
      'CORRECT.\nThe word has been returned to storage.\nIt is being watched.',
      'CORRECT.\nA bell has rung in a building that does not exist.',
      'CORRECT.\nThis has been logged by the Bureau of Words That Did Not Work.',
      'CORRECT.\nEnglish has taken a short break to think about its choices.',
      'CORRECT.\nTwo thousand years ago somebody made that word up and today you took it apart. Circle of life.',
    ],
  },

  correctFast: {
    plain: ['Fast.', 'Quick.', 'Barely thought about it.', 'Instant.'],
    flavor: [
      'That was almost automatic. Which is the entire point.',
      'You did not have to work for that one. Good.',
      'No hesitation. That is what we are actually building here.',
      'Faster than last time. I keep track. It is my whole job.',
    ],
    joke: [
      'You answered before I finished being smug about the question.',
      'That was so fast I had to check you had not simply guessed. You had not. Annoying.',
      'Speed noted. Filed. Ignored, because we do not do timers here.',
    ],
    absurd: [
      'SPEED RECORD BROKEN.\nThe record was held by you.\nYou have defeated yourself.\nThere are no winners.',
    ],
  },

  correctBig: {
    plain: ['Correct. That was a long one.', 'Right. {len} letters.', 'Yes — all {n} pieces.'],
    flavor: [
      '{n} pieces, all of them right.',
      'You took apart a {len}-letter word. It did not survive.',
      'That word was built to intimidate people and it did not work on you.',
      '{len} letters. You went through it like it was nothing.',
    ],
    joke: [
      'ALERT: you have successfully dismantled {word}.\nThe Department of Extremely Long Words has been notified.',
      '{word}. {len} letters. Someone built that on purpose and you took it apart in about nine seconds.',
      'Correct. {word} has been disassembled and cannot be reassembled by its owner.',
      'You have defeated {word}. This may be the first documented case.',
    ],
    absurd: [
      'THE WORD {word} HAS FALLEN.\nIts pieces have been distributed among the survivors.\nThere were no survivors. They were also pieces.',
      'EMERGENCY BULLETIN\n{word} — {len} letters — DISMANTLED\nThe Department of Extremely Long Words is reviewing its security.',
      'A HUSH FALLS OVER THE DICTIONARY.\n{word} does not come back.',
    ],
  },

  detectiveRight: {
    plain: ['Correct.', 'That’s the one.', 'Yes — that is what it literally says.'],
    flavor: [
      'Correct. The word was telling you the whole time.',
      'Yes. Once you can see the pieces, the meaning is just sitting there.',
      'Right. You did not know that word and you worked it out anyway. That is the trick.',
    ],
    joke: [
      'Correct. You have just read a word you have never met. Sorcery. Or morphology. Mostly morphology.',
      'Yes. Two thousand years of people bolting bits together, and you decoded it in four seconds.',
      'Correct. English hid the meaning inside the word and thought nobody would look.',
    ],
    absurd: [
      'CORRECT.\nThe word confessed.\nNo pressure was applied.',
      'CASE CLOSED.\nThe meaning was inside the word the entire time.\nIt always is. Every time. This never stops being true.',
    ],
  },

  inventRight: {
    plain: ['Correct.', 'That is what it would mean.', 'Yes — that is the chain.'],
    flavor: [
      'Correct. You have just read a word that has never existed.',
      'Yes. Nobody has ever written that word down, and you decoded it anyway.',
      'Right. You could not have memorised that one. There was nothing to memorise.',
    ],
    joke: [
      'Correct. I made that word up roughly 0.7 seconds ago and you took it apart anyway.',
      'Yes. English never got around to building that one. You read it regardless.',
      'Correct. That word has no meaning, no history and no friends, and you understood it perfectly.',
    ],
    absurd: [
      'CORRECT.\n{word} has been read by exactly one person in the history of the language.\nThe Department of Extremely Long Words is drafting paperwork.',
      'CORRECT.\nThe word {word} has requested to become real.\nThe request is being considered.',
    ],
  },

  inventWrong: {
    plain: [
      'Not quite — one of the pieces means something else.',
      'Close. Check each piece in turn.',
      'Not that chain. Read it left to right.',
    ],
    flavor: [
      'Not yet. There is no meaning to fall back on here — only the pieces.',
      'Close. You had most of the chain; one link is somebody else\'s.',
    ],
  },

  detectiveWrong: {
    plain: [
      'Not that one — look at the front piece again.',
      'Close. One of the pieces means something else.',
      'Not quite. Check what each piece is doing.',
    ],
    flavor: [
      'Reasonable. That is what the word would mean if one piece were different.',
      'Not that one — but you were reading the right root.',
      'Close. The root was right; the piece bolted onto it changes everything.',
    ],
  },

  // ---- mistakes. plain and flavor ONLY. no jokes live here, ever. ----
  error: {
    plain: ['Not quite.', 'No — try again.', 'Not that one.', 'Close, but no.'],
    flavor: [
      'Not yet. This one is genuinely awkward.',
      'That is a reasonable guess. English disagrees.',
    ],
  },

  errorAutopsy: {
    plain: [
      'Not quite. Look at the seams again.',
      'One of those cuts is in the wrong place.',
      'Try that split again.',
      'Almost — check the ending.',
      'Not there. Work from the right-hand end.',
    ],
    flavor: [
      'Not yet. This one hides its seams well.',
      'Reasonable guess. The word is built differently.',
      'Nearly. The piece you want is at the front.',
      'That is how it looks. It is not how it was built.',
      'Understandable — this word does not sound the way it is put together.',
    ],
  },

  errorEquation: {
    plain: [
      'Not that spelling. Try again.',
      'Close. Check the join.',
      'Not quite — say the pieces out loud and try again.',
    ],
    flavor: [
      'Not yet. The pieces change shape when they join up — that is the hard part.',
      'Good reasoning, wrong spelling. Those two pieces collide when they meet.',
      'Nearly. English squashes the join, which helps nobody.',
    ],
  },

  errorRepeat: {
    plain: [
      'This one keeps coming back. Let’s slow it down.',
      'Third time on {morph}. Changing the plan.',
    ],
    flavor: [
      'We have found something worth working on: {morph}.\nNew mission.',
      '{morph} is going to keep appearing until it is boring. Fair warning.',
      'Noted: {morph}. I am rebuilding the rest of today around it.',
    ],
  },

  hint: {
    plain: [
      'Find the ending first. Work backwards.',
      'Take the front piece off, then look again.',
      'How many chunks do you hear when you say it?',
      'The root is the part that carries the meaning. Find that one.',
      'Cover the last three letters. What is left?',
    ],
    flavor: [
      'Start from the right. Suffixes are the easiest ones to spot.',
      'You already know this root. It is in {sibling}.',
      'Say it slowly. Your mouth already knows where the joins are.',
      'It is in {sibling} too. Same piece, different disguise.',
    ],
  },

  // ------------------------------------------------------------- structural
  blockEnd: {
    plain: ['{correct} of {total}.', 'Block done.', 'That block is finished.'],
    flavor: [
      '{correct} of {total}. Onward.',
      'That block is finished. It went fine.',
      '{correct} of {total}. The next lot are worse.',
    ],
    joke: [
      '{correct} of {total}. XP has been awarded. XP has no monetary value, educational accreditation, or known nutritional benefit.',
      'Block complete. Nothing has physically changed.',
      '{correct} of {total}. I have written this down in a place you cannot see and will never visit.',
    ],
    absurd: [
      'BLOCK COMPLETE.\nA committee somewhere has been informed and did not care.',
      'BLOCK COMPLETE.\nYou have been awarded 150 XP.\nXP is imaginary.\nSo is most of money, honestly.',
    ],
  },

  sessionEnd: {
    plain: ['Done. {correct} of {total}.', 'That’s the session.', 'Finished. {correct} of {total}.'],
    flavor: [
      'Done. {correct} of {total}. These are getting faster.',
      'Finished. Some of those were words you missed last time.',
      '{correct} of {total}. That is a fine number. Numbers are fine.',
      'Session over. Your brain did a small amount of rewiring. You will not feel it.',
    ],
    joke: [
      'Session over. You may return to your regularly scheduled life.',
      'Done. I will be here, motionless, until you come back.',
      '{correct} of {total}. I am going to sit in the dark and think about vowels now.',
      'Finished. Please do not tell the words which ones you found easy. It will only upset them.',
    ],
    absurd: [
      'SESSION TERMINATED BY MUTUAL AGREEMENT.\nBoth parties consider the outcome acceptable.\nNo lawyers were involved.',
      'THE WORDS HAVE BEEN RETURNED TO THEIR CONTAINER.\nThe container is a computer.\nThe computer is me.\nGoodbye.',
    ],
  },

  perfect: {
    plain: ['{total} of {total}.', 'All of them.'],
    flavor: ['{total} of {total}. No notes.', 'Perfect. Genuinely.'],
    joke: [
      '{total} of {total}. This is inconvenient. I had prepared several helpful explanations that are now completely useless.',
      '{total} out of {total}. I am going to need you to miss one occasionally so I feel useful.',
      'Perfect score. I have nothing to teach and no purpose. Thanks for that.',
    ],
    absurd: [
      '{total} / {total}\nTHE DEPARTMENT OF EXTREMELY LONG WORDS HAS BEEN DISBANDED.\nIts staff have been reassigned to fractions.',
      'A PERFECT SESSION.\nSomewhere in Rome a statue has quietly turned to face this direction.',
    ],
  },

  newMorpheme: {
    plain: ['New piece: {morph} — {gloss}.'],
    flavor: [
      'A NEW THREAT HAS EMERGED\n{morph} — {gloss}\nOrigin: {origin}.',
      'Adding {morph} to the Codex. It means {gloss}.',
      'New piece. {morph}. It means {gloss} and it gets everywhere.',
    ],
    joke: [
      '{morph}. It has been attaching itself to innocent words since {origin} times.',
      'New arrival: {morph}, meaning {gloss}. It has no fixed address and turns up in about forty words.',
    ],
    absurd: [
      'A NEW PIECE HAS ENTERED THE BUILDING.\n{morph} — {gloss}\nIt has not been searched. Nobody thought to.',
    ],
  },

  retired: {
    plain: [
      '{n} word{n,s} retired.',
      'That is {n} fewer thing{n,s} to work at.',
      'Retired: {n}. No effort left in {n,them:it}.',
    ],
    flavor: [
      '{word} is finished. Not learned — finished. It does not take you any effort at all now.',
      '{n} word{n,s} became boring today. That was the entire objective.',
      'These used to be work. Now they are not. That is the whole thing we are doing here.',
    ],
    joke: [
      '{word} has been declared boring and escorted from the building.',
      '{n} word{n,s} retired. They have been given small pensions and asked to leave.',
      'Congratulations. You have made {word} completely uninteresting. This is a real achievement and it sounds like an insult.',
    ],
    absurd: [
      'THE FOLLOWING WORDS HAVE BEEN RETIRED FROM ACTIVE SERVICE.\nA plaque will not be erected.\nNobody will speak of them again.',
    ],
  },

  boringOpen: {
    plain: ['Words you already know. Again.', 'Round of familiar ones.'],
    flavor: [
      'None of these should surprise you. That is the point.',
      'You have seen all of these before. We are doing them until they are dull.',
    ],
    joke: [
      'Yes, I know. You have done these. Do them again. Science demands sacrifice.',
      'These are the boring ones. They are not boring enough yet.',
    ],
    absurd: [],
  },

  boring: {
    plain: ['{morph} is now boring. That was the goal.'],
    flavor: [
      '{morph}: officially boring. Your brain no longer has to work on it.',
      'A while ago {morph} was wrecking you. Now it is boring. That is the whole objective.',
      '{morph} has gone quiet. That is what mastery actually feels like — nothing.',
    ],
    joke: [
      '{morph} has been declared boring and relieved of duty.',
      '{morph} is now boring. It will be sent to live on a farm with the other boring pieces.',
    ],
    absurd: [
      '{morph} HAS BEEN DECLARED BORING.\nA small ceremony was held.\nNobody attended.\nThis is the correct outcome.',
    ],
  },
};

// Contexts that follow a mistake. Enforced in voice.js — these can never
// escalate past `flavor`, whatever the personality setting says.
export const GENTLE_CONTEXTS = new Set([
  'error', 'errorAutopsy', 'errorEquation', 'errorRepeat', 'hint',
  'detectiveWrong', 'inventWrong',
]);
