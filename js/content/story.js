// THE EXPEDITION — a serialised story, one chapter per completed session.
//
// Each chapter is locked behind a long word. Breaking the word IS opening the
// chapter, so the narrative and the mechanic are the same action rather than a
// reward bolted onto one another.
//
// Gate words are real corpus words. tools/check.mjs verifies every one exists
// in the corpus, is at least three morphemes, and is not reused by another
// chapter.
//
// Chapters 11-20 are the second expedition, set up by the last line of the
// first. Where the first arc was about taking a word apart, this one is about
// where the pieces come from — which is the other half of the Codex, and the
// reason a word he has never seen can still be read.

export const CHAPTERS = [
  {
    gate: 'transportation',
    title: 'An Expedition Is Announced',
    text: `An expedition has been announced.

Nobody announced it. It simply appeared on a noticeboard one Tuesday, written
in handwriting that nobody recognised, and by Wednesday four people had signed
up.

The noticeboard did not say where the expedition was going. It did not say
what the expedition was for. It said, in very small letters at the bottom:

BRING A COAT. BRING A PENCIL. DO NOT BRING A GOOSE.

This last instruction would turn out to be extremely important.`,
  },
  {
    gate: 'incomprehensible',
    title: 'Gerald',
    text: `Gerald is a goose.

Gerald was not invited. Gerald was specifically, in writing, on a noticeboard,
uninvited. Gerald came anyway, and by the time anyone noticed he was three
miles into the forest and carrying somebody's sandwich.

Attempts were made to send Gerald home. Gerald did not go home. Gerald has no
home. Gerald has a general area he prefers.

It was agreed, without any discussion at all, that Gerald was now part of the
expedition. Nobody was pleased about this. Gerald was delighted, in the way
that geese are: silently, and while looking directly at you.`,
  },
  {
    gate: 'reconstruction',
    title: 'The Door',
    text: `On the ninth day they found a door.

It was standing on its own in the middle of a field. No walls. No building.
Just a door, in a frame, with a small brass handle and a sign.

The sign was a word. One word. It was forty-one letters long and it went round
a corner.

"Is that a real word?" somebody asked.

"Everything is a real word," said the expedition's oldest member, who had said
several unhelpful things already. "The question is whether anyone has ever
needed it."

Gerald bit the door. Nothing happened. Gerald bit the door again.`,
  },
  {
    gate: 'misinformation',
    title: 'What the Door Said',
    text: `They spent two hours on the word.

They took the front off it. They took the back off it. They found four pieces
in the middle that they recognised from other, shorter words, which was the
first genuinely encouraging thing that had happened all week.

When they had finished, the word said — and this is a direct translation —

  THE PLACE WHERE THEY MAKE THEM

"Make what?" said somebody.

The door opened on its own.

It should be recorded that Gerald went in first. Not bravely. Gerald has no
concept of bravery. Gerald simply has no concept of doors either.`,
  },
  {
    gate: 'indestructible',
    title: 'The Department',
    text: `Behind the door was an office.

It was enormous. It went back further than the field it was standing in, which
nobody wanted to think about too hard, and it was full of desks, and at every
desk somebody was building a word.

A small sign on the nearest desk read:

  THE DEPARTMENT OF EXTREMELY LONG WORDS
  est. a very long time ago
  "we are not sorry"

None of them looked up. They had been at this for centuries. One of them had a
word so long it had needed a second desk.`,
  },
  {
    gate: 'photosynthesis',
    title: 'They Cannot Stop',
    text: `The problem, they explained, is that they cannot stop.

Somebody needs a word for a thing. The Department makes one. Then somebody
needs a word for a slightly different thing, so the Department takes the first
word and bolts a piece onto the front of it. Then a piece onto the back. Then
another piece.

"Couldn't you just make a new short word?"

The entire Department stopped writing at the same time and looked up.

"We could," said the nearest clerk, in a voice like a filing cabinet closing,
"but we have all this."

He gestured at everything. There was a great deal of everything.`,
  },
  {
    gate: 'irresistible',
    title: 'Gerald Eats a Word',
    text: `Gerald ate a word.

It was on a desk. It was, according to the clerk who had spent four months on
it, going to be the longest word ever built, and it was eleven letters from
finished.

Gerald ate it in one movement, the way geese do, with no expression whatsoever.

The Department did not shout. The Department is not the shouting kind. The
Department went very quiet, and then somebody at the back said, in a small
voice, "well, we'll have to make it again," and everybody picked up their pens.

The oldest member of the expedition began, very quietly, to laugh.`,
  },
  {
    gate: 'independent',
    title: 'The Machine',
    text: `At the far end of the Department there is a machine.

It is the size of a house and it is made almost entirely of drawers. Every
drawer has a label. The labels are not words. They are pieces of words —
fronts, middles, ends — and there are thousands of them, and they are all,
without exception, ones you have already met.

The machine has no engine. It has no buttons. It is just drawers.

"That's it?" said somebody. "That's the whole thing?"

"That is the whole thing," said the clerk.

Gerald opened a drawer. Inside was: -tion. Nothing else. Just -tion.`,
  },
  {
    gate: 'unpredictable',
    title: 'What the Clerk Said',
    text: `"People think the words are the hard part," said the clerk.

"They are not. The words are just what happens when you put the pieces
together and walk away. There is no long word. There has never been a long
word. There are only short pieces, standing very close together, hoping nobody
looks."

He shut the drawer.

"Once you can see the pieces, we are not frightening at all. We are a filing
system. We are a large, badly organised, four-thousand-year-old filing
system."

Outside, in the field, the door was still standing on its own, waiting for
somebody else to spend two hours on it.`,
  },
  {
    gate: 'autobiography',
    title: 'The Return',
    text: `The expedition came home on a Thursday.

They had found no treasure. They had drawn no map. Between them they had one
sandwich, badly damaged, and a goose that nobody could get rid of.

But every one of them could now look at a word forty-one letters long and see,
instead of a wall, a row of small familiar things standing shoulder to
shoulder and pretending to be enormous.

The noticeboard was blank when they got back. By Friday there was a new
expedition on it, in the same unrecognisable handwriting.

Gerald has already signed up. Gerald cannot write. This has not stopped him.`,
  },
  {
    gate: 'information',
    title: 'The Second Expedition',
    text: `The second expedition was announced the way the first one was: by
appearing.

Same noticeboard. Same handwriting. Nobody has ever seen anybody write on it
and at this point nobody is trying very hard to find out.

This time there were instructions.

  TO THE QUARRY
  BRING A COAT. BRING A PENCIL.
  DO NOT BRING THE GOOSE.

Somebody pointed out that this was progress. The first notice had said a
goose. This one said the goose. Somewhere, somebody was keeping records.

Gerald was waiting at the edge of the forest before anyone had finished
packing. He had a sandwich. Nobody had given him a sandwich.`,
  },
  {
    gate: 'manufacture',
    title: 'The Quarry',
    text: `The quarry is not a factory. Everybody had assumed it would be a
factory.

It is a hole in the ground, a very large one, and at the bottom of it people
are digging pieces out of the rock.

Not words. Pieces. A woman went past with a piece on her shoulder like a
plank, and the plank said PORT on the side of it, and she was carrying it
towards a shed where somebody else was waiting with ATION.

"Where do they come from?" somebody asked.

"Down," said the woman.

"Yes, but who made them?"

She looked at him the way you look at somebody who has asked who made a
mountain, and went back to work.`,
  },
  {
    gate: 'intersection',
    title: 'Two Quarries',
    text: `It was not one quarry. It was two, side by side, with a fence down
the middle.

On one side they dig in Latin. On the other side they dig in Greek. They have
been neighbours for about four thousand years and they do not speak.

The fence is not high. Anybody could step over it. Nobody does.

Both sides were perfectly friendly to the expedition, in the careful way
people are friendly when they want you to notice how friendly they are being
compared to somebody else.

Gerald walked through a gap in the fence, ate something on the other side, and
walked back. Both quarries watched him do it. Neither said anything.`,
  },
  {
    gate: 'disagreement',
    title: 'The Argument',
    text: `The trouble is that they dig up the same things.

Latin has AQUA. Greek has HYDR. Both of them mean water, and both quarries
will tell you at length that the other one is technically correct but not, in
the end, the right choice for serious work.

Latin has TERR. Greek has GEO. Both mean earth.

Latin has LUC. Greek has PHOTO. Both mean light, and there is a shed on each
side of the fence with a light on the roof, and neither shed will admit that
the other shed has a light on the roof.

English buys from both. English has never once chosen. This is why you can
have an aquarium and a hydrant on the same street and nobody thinks anything
of it at all.

"Does that not get confusing?"

"Enormously," said both quarries, at exactly the same time, and then spent the
rest of the afternoon not looking at each other.`,
  },
  {
    gate: 'application',
    title: 'The Borrowing Office',
    text: `Between the two quarries there is a hut, and in the hut there is a
desk, and at the desk there is a clerk with a very large book.

The book is a list of everything English has borrowed.

It is not a short book. English has borrowed from Latin and from Greek, which
everybody expects, and also from French and Norse and Arabic and Dutch and
Hindi and a language nobody at the desk can now identify, in about the year
900, for a word meaning a kind of small boat.

There is a column at the edge of every page headed RETURNED.

It is the only clean part of the book.

"When do you want them back?" somebody asked.

The clerk turned a page. "That is not really how it works," he said. "They are
happier here. Nobody comes to collect."`,
  },
  {
    gate: 'obstruction',
    title: 'Gerald Is Employed',
    text: `Gerald has a job.

Nobody gave it to him. Nobody applied on his behalf. He stood in a doorway for
two days, entirely in the way, until somebody official came past with a label
and stuck it on him, because it was easier than the alternative.

The label said QUALITY CONTROL.

The job works like this. A new piece is brought out of the rock and put in
front of Gerald. If Gerald eats it, the piece is no good. If Gerald ignores
it, the piece may go into words.

Nobody can explain why this works. Everybody agrees that it works.

It should be recorded that this is the only appointment the Latin quarry and
the Greek quarry have ever agreed on.`,
  },
  {
    gate: 'destruction',
    title: 'The Word That Would Not Come Apart',
    text: `On the fifth day they brought out a word that would not come apart.

The expedition was quite good at this by now. They tried the front. They tried
the back. They went through the middle twice, looking for anything they had
met before, and found nothing at all.

"It is not hiding anything," said the clerk, who had wandered over to watch.
"There is nothing in there. It came into English whole, from somewhere else, a
long time ago, and it has never once been anything but itself."

"So what do we do with it?"

"You learn it," said the clerk. "Some words you take apart. Some words you
simply have to know. Telling which is which is most of the skill, and almost
nobody bothers, so they end up treating every word like the second kind."

Gerald did not eat it. Gerald has a great deal of respect for a thing that
will not come apart.`,
  },
  {
    gate: 'replacement',
    title: 'The Home for Retired Words',
    text: `On the hill above the quarries there is a long low building with a
great many windows.

It is full of words nobody uses any more.

They are not broken. Most of them work perfectly well. They were replaced by
something shorter, or something newer, or something that turned up in a
popular song and would not leave.

The warden took the expedition round. This one meant the day before yesterday,
all by itself. This one meant the particular smell of rain coming. This one
was a perfectly good word for hope, which lost its job to hope.

"Do any of them come back?"

"Sometimes," said the warden. "Not often. And when they do they are
insufferable about it for years."`,
  },
  {
    gate: 'prescription',
    title: 'The Inspector',
    text: `The inspector arrived on a Tuesday with a clipboard and a proposal.

The proposal was short and, written down, entirely sensible. One piece per
meaning. No duplicates. AQUA or HYDR, not both. One word for a thing, and the
thing would have one word, and everybody would know where they stood.

Both quarries read it.

Both quarries went very quiet.

And then, for the first time in four thousand years, the Latin quarry and the
Greek quarry came and stood on the same side of the fence.

"On what grounds do you object?" said the inspector.

"All of them," said the quarries.

Gerald ate the clipboard. Nobody stopped him. Several people helped.`,
  },
  {
    gate: 'transcontinental',
    title: 'The Long Way Home',
    text: `They went home the long way, across the whole continent, because
somebody had lost the short way and nobody wanted to say so.

On the last morning somebody asked the woman with the plank what the point of
a quarry is, if the words are already made.

She put the plank down.

"The words are not already made," she said. "That is the bit everybody gets
wrong. We are still digging. Next year somebody will need a word that has
never been said by anybody, and it will be built out of these, and you will be
able to read it the first time you ever see it. Without being told. Because
you will already know the pieces."

She picked the plank back up.

"That is the whole trick," she said. "There is no other trick."

The noticeboard was blank when they got back. It did not stay blank.

Gerald cannot read. It has never once slowed him down.`,
  },
];
