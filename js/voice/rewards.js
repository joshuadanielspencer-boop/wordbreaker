// REWARDS.
//
// Rare payloads that fire only after a CORRECT answer. Never after a mistake —
// a reward attached to an error would read as mockery, which is the one thing
// this program does not do.
//
// Each is shown at most once until the whole list is exhausted (tracked per
// profile), so the tenth session is not the third session again. Delivery is
// deadpan on purpose; a fart joke told flatly by a bureaucratic computer is
// considerably funnier than one told enthusiastically.
//
// Several of the potato facts are true. This is not an accident.

export const REWARDS = [
  // ---- the potato ----
  'REWARD UNLOCKED: a potato.\nIt is not a real potato. I cannot give you a real potato. I am a website.',
  'REWARD: a potato fact.\nPotatoes were the first vegetable grown in space. This is true. I checked twice because I did not believe it either.',
  'Correct. Somewhere in Belgium, a potato has been notified.',
  'REWARD: one (1) potato.\nIt has been added to your inventory.\nYou do not have an inventory.',
  'POTATO STATUS: still a potato.\nNo further updates are expected.',
  'A potato has no bones. It has never had bones. It is not upset about this.',
  'REWARD: a potato fact.\nThe word "potato" contains no Latin roots whatsoever. It came from the Caribbean via Spain. English simply took it and never gave it back.',
  'Correct. In recognition, a potato somewhere has been promoted. It does not know. Potatoes do not know things.',
  'THE POTATO HAS BEEN CONSULTED.\nThe potato agrees with your answer.\nThe potato agrees with everything. It is a potato.',
  'REWARD: a potato with a small hat.\nYou cannot see it. It is a very small hat.',
  'Potatoes have eyes and cannot see. They are reportedly fine about it.',
  'BULLETIN: a potato has been elected to something. Details are unclear. The potato is not commenting.',
  'REWARD: the word "potato" has been added to today\'s lesson for no reason.\npotato\nThere. That is it. That was the whole thing.',
  'One potato. Two potato. Three potato. Four.\nThat is the entire poem. Somebody was paid for that.',

  // ---- the other thing ----
  'You have earned one (1) fart.\nIt has already happened.\nYou missed it.',
  'REWARD: a distant trumpet sound.\nIt is not a trumpet.',
  'BULLETIN: the word you just took apart has filed a complaint.\nThe complaint is a fart noise.',
  'ACHIEVEMENT UNLOCKED: silent but deadly\nYou answered without making a sound.\nThe same cannot be said for everyone in this room.',
  'Correct. In celebration I have generated a small noise. It was not dignified. It has been deleted.',
  'REWARD: scientists confirm that the average person passes gas fourteen times a day.\nYou are behind schedule.',
  'A LOUD NOISE HAS OCCURRED SOMEWHERE IN THE BUILDING.\nAn investigation has been opened.\nThe investigation has been closed.\nEverybody knows.',
  'Correct. Somewhere, a Roman senator has done something unbecoming and blamed a horse.',
  'HISTORICAL FACT: the Romans had a god of doorways, a god of hinges, and a god of sewers.\nThe sewer one was called Cloacina.\nShe was worshipped. Genuinely.',
  'REWARD: one dignified silence, immediately ruined.',
  'ALERT: methane detected.\nSource: unknown.\nSuspects: everyone.\nCase closed.',
  'Correct. The word left the room quietly and then it did not.',
  'You have unlocked the sound effect. I am not permitted to play the sound effect. Use your imagination. Use it responsibly.',
  'THE DEPARTMENT OF EXTREMELY LONG WORDS HAS ASKED WHO DID THAT.\nNobody has come forward.\nThe investigation continues.',

  // ---- absurd non-sequiturs ----
  'REWARD: a goose has been released into the building.\nThis was not authorised.\nIt is going quite badly.',
  'Correct. I would high-five you but I have no hands, only opinions.',
  'ACHIEVEMENT UNLOCKED: read a word\nYour ancestors would be confused. Most of them could not.',
  'BULLETIN: a duck has been appointed to the committee.\nThe duck has not attended a single meeting.\nThe duck is doing a better job than the previous appointee.',
  'REWARD: this message.\nThat is the reward. The message is the reward. I am aware this is not much.',
  'Correct. Somewhere a Roman has looked up from his lunch, unsettled, and cannot say why.',
  'ACHIEVEMENT UNLOCKED: mildly inconvenienced a dictionary',
  'REWARD: an imaginary hat.\nIt is enormous.\nIt does not suit you.\nWear it anyway.',
  'A COW HAS BEEN SPOTTED IN THE PARKING LOT.\nThis has nothing to do with English.\nI thought you should know.',
  'Correct. As a reward, here is a fact: a group of pugs is called a grumble. That is a real word for a real thing.',
  'REWARD: you may now say the word "flabbergasted" out loud.\nGo on.\nI will wait.',
  'ACHIEVEMENT UNLOCKED: level 14\nYou are now level 14.\nNothing has physically changed.',
  'BULLETIN: an emu has been elected emperor of a small filing cabinet.\nThe transition of power was peaceful.',
  'REWARD: a small ceremony has been held in your honour.\nAttendance: zero.\nCatering: none.\nIt was still very moving.',
  'Correct. In recognition of this, I have decided to be dramatic about the next question. Brace yourself.',
  'A heavily armoured chicken has accidentally become emperor of Rome.\nThis is unrelated to your answer.\nIt is simply happening.',
  'REWARD: permission to be smug for eleven seconds.\nStarting now.\nThat is ten.\nStop.',
  'ACHIEVEMENT UNLOCKED: took a word apart and put nothing back\nThe word remains in pieces.\nIt is somebody else\'s problem now.',
  'BULLETIN: the letter Q has requested a transfer.\nIt is tired of always being with U.\nThe request has been denied.',
  'Correct. I have celebrated by turning myself off and on again. You did not notice. It was very fast.',
  'REWARD: a snail has been named after you.\nIt is not a fast snail.\nIt is a very thorough snail.',
  'A GOAT HAS EATEN THE INSTRUCTIONS.\nWe will proceed from memory.',
  'ACHIEVEMENT UNLOCKED: fourteen consecutive minutes of not being outside',
  'REWARD: I will now say something dramatic in a serious voice.\n"...the vowels were never on our side."\nThank you. That is all.',
  'BULLETIN: somebody has attempted to pluralise the word "moose".\nEmergency services have been notified.',
  'Correct. A trumpet fanfare has played in a room three thousand miles away, for unrelated reasons.',
];

/** How often a reward fires after a correct answer, by personality. */
export const REWARD_RATE = {
  normal: 0.02,
  funny: 0.07,
  ridiculous: 0.16,
  unsupervised: 0.30,
};
