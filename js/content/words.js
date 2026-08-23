// The word corpus. Every entry is a real English word broken into the
// morphemes a learner can actually collect.
//
// Notation: parts are separated by "|". A part is either
//     surface                 (surface spelling == morpheme id)
//     surface:morphemeId      (allomorph — e.g. "miss:mit", "im:in_not")
//
// tools/check-content.mjs asserts that every part list concatenates back to
// the headword exactly and that every morpheme id exists. Trust nothing here
// that the checker has not confirmed.

export const WORD_SPECS = [
  // ---- spect: to look ----
  'in:in_into|spect', 'in:in_into|spect|or:er', 'in:in_into|spect|ion:tion',
  're|spect', 'spect|ator:er', 'pro|spect', 'per|spect|ive', 'circum|spect',
  'su:sub|spect', 'spec:spect|ial:al',

  // ---- port: to carry ----
  'im:in_into|port', 'ex|port', 'trans|port', 'trans|port|ation:tion',
  'port|able', 'im:in_into|port|ant', 'im:in_into|port|ance', 're|port|er',
  'de|port', 'sup:sub|port', 'sup:sub|port|er', 'port|al',

  // ---- dict: to say ----
  'pre|dict', 'pre|dict|ion:tion', 'un|pre|dict|able', 'dict|ate',
  'dict|ator:er', 'contra|dict', 'dict|ion:tion|ary',

  // ---- script: to write ----
  'de|scribe:script', 'de|scrip:script|tion:tion', 'pre|scrip:script|tion:tion',
  'in:in_into|scrip:script|tion:tion', 'manu:man|script', 'tran:trans|scribe:script',
  'sub|scrip:script|tion:tion', 'script|ure',

  // ---- rupt: to break ----
  'e:ex|rupt', 'e:ex|rupt|ion:tion', 'inter|rupt', 'inter|rupt|ion:tion',
  'dis|rupt', 'dis|rupt|ive', 'cor:con|rupt',

  // ---- struct: to build ----
  'con|struct', 'con|struct|ion:tion', 're|con|struct|ion:tion',
  'de|struct|ion:tion', 'in:in_into|struct|or:er', 'in:in_into|struct|ion:tion',
  'struct|ure', 'in:in_not|de|struct|ible:able',

  // ---- tract: to pull ----
  'at:ad|tract', 'at:ad|tract|ion:tion', 'sub|tract', 'sub|tract|ion:tion',
  'ex|tract', 'dis|tract', 'dis|tract|ion:tion', 'con|tract', 'tract|or:er', 're|tract',

  // ---- ject: to throw ----
  'in:in_into|ject', 'in:in_into|ject|ion:tion', 're|ject', 're|ject|ion:tion',
  'e:ex|ject', 'pro|ject', 'pro|ject|or:er', 'ob|ject|ion:tion', 'inter|ject',

  // ---- duct: to lead ----
  'con|duct', 'con|duct|or:er', 'pro|duce:duct', 'pro|duct|ion:tion',
  're|duce:duct', 're|duct|ion:tion', 'aque:aqua|duct', 'de|duct|ion:tion',

  // ---- mit: to send ----
  'sub|mit', 'trans|mit', 'trans|miss:mit|ion:tion', 'per|mit', 'ad|mit',
  'miss:mit|ion:tion', 'dis|miss:mit', 'e:ex|mit',

  // ---- pos: to place ----
  'com:con|pose:pos', 'com:con|pos|ition:tion', 'ex|pose:pos', 'ex|pos|ition:tion',
  'pro|pos|al', 'trans|pose:pos', 'post|pone:pos', 'com:con|pon:pos|ent:ant',

  // ---- vert: to turn ----
  'con|vert', 'con|vers:vert|ion:tion', 're|verse:vert', 'in:in_into|vert',
  'di:dis|vert', 'vert|ical:ic', 'uni|verse:vert', 'uni|vers:vert|al',

  // ---- voc / aud / vis: call, hear, see ----
  'voc|al', 'voc|al|ist', 'pro|voke:voc', 're|voke:voc', 'ad|voc|ate',
  'aud|ible:able', 'in:in_not|aud|ible:able', 'audi:aud|ence:ance',
  'aud|ition:tion', 'audi:aud|ology:logy',
  'vis|ible:able', 'in:in_not|vis|ible:able', 'vis|ion:tion', 'tele|vis|ion:tion',
  're|vise:vis', 'super|vis|or:er', 'e:ex|vid:vis|ence:ance', 'pro|vide:vis',

  // ---- cred / form ----
  'cred|ible:able', 'in:in_not|cred|ible:able',
  'trans|form', 'trans|form|ation:tion', 're|form', 'uni|form', 'form|al',
  'in:in_into|form|ation:tion', 'de|form', 'con|form',

  // ---- gress / fact ----
  'pro|gress', 'pro|gress|ion:tion', 'con|gress', 're|gress', 'ag:ad|gress|ive',
  'fact|ory:ary', 'manu:man|fact|ure', 'per|fect:fact', 'per|fect:fact|ion:tion',
  'im:in_not|per|fect:fact', 'magn|ify',

  // ---- tain: to hold ----
  'con|tain', 'con|tain|er', 're|tain', 'de|tain', 'ob|tain', 'con|tent:tain',
  'ten:tain|ant', 'trans|con|tin:tain|ent:ant|al',

  // ---- cede: to go ----
  'pro|ceed:cede', 'pro|cess:cede', 'pro|cess:cede|ion:tion', 're|cede',
  'pre|cede', 'suc:sub|ceed:cede', 'ex|cess:cede', 'ac:ad|cess:cede',
  'ac:ad|cess:cede|ible:able',

  // ---- flect / pel / sist / scend ----
  're|flect', 're|flect|ion:tion', 'de|flect', 'flex:flect|ible:able',
  'in:in_not|flex:flect|ible:able', 're|flex:flect',
  're|pel', 'ex|pel', 'pro|pel', 'im:in_into|pulse:pel', 're|puls:pel|ive', 'com:con|pel',
  're|sist', 're|sist|ance', 'in:in_into|sist', 'per|sist', 'con|sist',
  'as:ad|sist|ant', 'ir:in_not|re|sist|ible:able',
  'a:ad|scend', 'de|scend', 'de|scend|ant', 'tran:trans|scend',

  // ---- sect: to cut ----
  'in:in_into|sect', 'dis|sect', 'sect|ion:tion', 'inter|sect|ion:tion',
  'bi|sect', 'tri|sect',

  // ---- man / ped / aqua / luc ----
  'manu:man|al', 'ped|al', 'tri|pod:ped', 'ex|ped|ition:tion',
  'aqua|tic:ic', 'trans|luc|ent:ant',

  // ---- mort / viv / sens ----
  'im:in_not|mort|al', 'mort|al', 'sur:super|vive:viv', 'sur:super|viv|or:er',
  're|vive:viv', 'vit:viv|al',
  'sens|ible:able', 'sens|itive:ive', 'in:in_not|sens|itive:ive', 'sens|ation:tion',
  'con|sent:sens', 're|sent:sens',

  // ---- nov / fer / cap ----
  'in:in_into|nov|ation:tion', 're|nov|ate',
  'trans|fer', 're|fer', 'pre|fer', 'con|fer|ence:ance', 'dif:dis|fer|ent:ant',
  'of:ob|fer', 'circum|fer|ence:ance',
  'capt:cap|ure', 'ac:ad|cept:cap', 'ex|cept:cap|ion:tion', 're|ceive:cap',
  'de|ceive:cap', 're|cept:cap|ion:tion',

  // ---- fort / hend ----
  'com:con|fort', 'un|com:con|fort|able', 'fort|ify', 'ef:ex|fort',
  'com:con|pre|hend', 'in:in_not|com:con|pre|hens:hend|ible:able',
  'ap:ad|pre|hens:hend|ive',

  // ---- graph: to write ----
  'auto|graph', 'photo|graph', 'photo|graph|er', 'para|graph', 'tele|graph',
  'geo|graph|y', 'bio|graph|y', 'auto|bio|graph|y', 'graph|ic',
  'dia|gram:graph', 'tele|gram:graph', 'poly|graph',

  // ---- phon / scope / meter ----
  'tele|phone:phon', 'micro|phone:phon', 'sym:syn|phon|y', 'homo|phone:phon',
  'mega|phone:phon',
  'tele|scope', 'micro|scope', 'peri|scope', 'micro|scop:scope|ic',
  'thermo:therm|meter', 'dia|meter', 'peri|meter', 'sym:syn|metr:meter|y',
  'geo|metr:meter|y', 'centi|meter',

  // ---- bio / geo / chron / therm / photo / hydr / astro ----
  'bio|logy', 'geo|logy', 'chrono:chron|logy', 'syn|chron|ize', 'chron|ic',
  'therm|al', 'thermo:therm|stat:sist', 'photo|syn|thesis:thes',
  'hydr|ant', 'hydro:hydr|electr|ic', 'de|hydr|ate',
  'astro|naut', 'astro|nom|y', 'aster:astro|oid', 'dis|aster:astro',

  // ---- psych / path / cycl / dem / crat / arch ----
  'psych|ology:logy', 'psych|ic', 'sym:syn|path|y', 'em:in_into|path|y',
  'a:a_not|path|y', 'tele|path|y',
  'bi|cycle:cycl', 'tri|cycle:cycl', 're|cycle:cycl',
  'demo:dem|cracy:crat', 'demo:dem|crat|ic', 'epi|dem|ic', 'auto|crat',
  'mon:mono|arch', 'mon:mono|arch|y', 'an:a_not|arch|y',

  // ---- assorted ----
  'anti|bio|tic:ic', 'anti|soci|al', 'soci|al', 'mono|logue:logy', 'dia|logue:logy',
  'poly|gon', 'semi|circle:circum', 'hyper|act|ive',
  'syn|onym:nym', 'ant:anti|onym:nym', 'hom:homo|onym:nym', 'pseudo|nym',
  'an:a_not|onym:nym|ous', 'mis|in:in_into|form|ation:tion',
  // ---- everyday bases: warm-up items and the common English suffixes ----
  'help|ful', 'help|less', 'help|er', 'un|help|ful',
  'care|ful', 'care|less', 'care|ful|ly:ly',
  'harm|ful', 'harm|less', 'use|ful', 'use|less',
  'thought|ful', 'thought|less', 'hope|ful', 'hope|less', 'hope|less|ly:ly',
  'fear|ful', 'fear|less', 'power|ful', 'power|less',
  'kind|ness', 'un|kind', 'kind|ly:ly', 'dark|ness', 'sad|ness', 'sad|ly:ly',
  'friend|ly:ly', 'un|friend|ly:ly', 'rest|less', 'end|less',

  // ---- -ment / -ity / -ly on Latin stems ----
  'con|tain|ment', 'at:ad|tain|ment', 'de|port|ment',
  'act|iv:ive|ity', 'sens|itiv:ive|ity', 'vis|ibil:able|ity',
  'in:in_not|vis|ibil:able|ity', 'mort|al|ity', 'im:in_not|mort|al|ity',
  'per|fect:fact|ly:ly', 'vert|ical:ic|ly:ly',
  'hydro:hydr|phobia',
  // ==== DEPTH PASS ====
  // Added to give thin morphemes enough words to actually drill. A piece with
  // two words behind it can be collected but not learned — you need five or
  // more to show it behaving consistently across different contexts.

  // ---- mis: wrongly ----
  'mis|place', 'mis|judge', 'mis|count', 'mis|spell', 'mis|trust', 'mis|read',
  'mis|treat', 'mis|print', 'mis|use',

  // ---- vent: to come ----
  'e:ex|vent', 'in:in_into|vent', 'in:in_into|vent|ion:tion', 'in:in_into|vent|or:er',
  'pre|vent', 'pre|vent|ion:tion', 'con|vent|ion:tion', 'ad|vent|ure', 'circum|vent',

  // ---- mot: to move ----
  'mot|ion:tion', 'mot|or:er', 'mot|ive', 'e:ex|mot|ion:tion', 'pro|mote:mot',
  'pro|mot|ion:tion', 're|mote:mot', 'com:con|mot|ion:tion', 'auto|mob:mot|ile:able',

  // ---- lect: to choose, to gather ----
  'col:con|lect', 'col:con|lect|ion:tion', 'col:con|lect|or:er', 'e:ex|lect',
  'e:ex|lect|ion:tion', 'se|lect', 'se|lect|ion:tion', 'dia|lect', 'lect|ure',

  // ---- fin: end ----
  'fin|al', 'fin|al|ly:ly', 'de|fin|ition:tion', 'in:in_not|fin|ity', 'con|fine:fin',
  'semi|fin|al',

  // ---- son / sci / the / nav / dent ----
  'son|ic', 'uni|son', 'super|son|ic', 'con|son|ant',
  'sci|ence:ance', 'sci|ent:ant|ist', 'con|sci|ous', 'con|sci|ence:ance',
  'the|ology:logy', 'a:a_not|the|ism', 'mono|the|ism',
  'nav|y', 'nav|al', 'nav|ig:act|ate', 'nav|ig:act|ator:er', 'circum|nav|ig:act|ate',
  'dent|ist', 'dent|al', 'tri|dent',

  // ---- spir: to breathe ----
  'in:in_into|spire:spir', 'in:in_into|spir|ation:tion', 'ex|pire:spir',
  're|spir|ation:tion', 'con|spire:spir', 'per|spire:spir',

  // ---- pend: to hang ----
  'sus:sub|pend', 'sus:sub|pens:pend|ion:tion', 'de|pend', 'de|pend|ent:ant',
  'in:in_not|de|pend|ent:ant', 'ex|pens:pend|ive', 'pend|ant',

  // ---- sign / cur ----
  'sign|al', 'sign|ature:ure', 'de|sign', 'de|sign|er', 'as:ad|sign', 're|sign',
  'curr:cur|ent:ant', 'oc:ob|cur', 're|cur', 'ex|curs:cur|ion:tion', 'curs:cur|ive',
  'con|curr:cur|ent:ant',

  // ---- plic: to fold ----
  'tri|ple:plic', 'multi|ple:plic', 'multi|ply:plic', 'ap:ad|ply:plic',
  'ap:ad|plic|ation:tion', 're|ply:plic', 'com:con|plic|ate',

  // ---- press ----
  'ex|press', 'ex|press|ion:tion', 'im:in_into|press', 'im:in_into|press|ion:tion',
  'de|press', 'com:con|press', 'press|ure', 'sup:sub|press',

  // ---- more for existing thin prefixes ----
  'inter|act', 'inter|view', 'inter|cept:cap', 'inter|fere:fer',
  'ob|ject', 'ob|struct', 'ob|struct|ion:tion',
  'anti|thes:thes|is:ism', 'anti|path|y',
  'auto|nom|y', 'micro|meter', 'micro|bio|logy',
  'mono|gram:graph', 'mono|graph',
  'tri|logy', 'uni|cycle:cycl', 'uni|ty:ity', 'uni|fy:ify',
  'dia|gon|al', 'a:a_not|sym:syn|metr:meter|ic',
  'semi|con|duct|or:er', 'non|sense:sens', 'non|fict:fact|ion:tion',
  'over|re|act', 'over|work', 'over|play',
  'super|struct|ure', 'poly|the|ism',

  // ---- everyday bases: the high-frequency English suffixes ----
  're|place', 're|place|ment', 'place|ment', 'pre|judge',
  'count|less', 'dis|trust', 'trust|ful', 'un|read', 'read|able', 'read|er',
  'treat|ment', 're|treat', 're|print', 'print|er', 'print|able',
  'pre|view', 're|view', 'view|er',
  'real|ism', 'real|ity:ity', 'un|real', 'real|ly:ly',
  'work|er', 'work|able', 're|work',
  'play|ful', 'play|er', 're|play',
  'agree|ment', 'dis|agree', 'dis|agree|ment', 'agree|able',
  'name|less', 're|name',
  'joy|ful', 'en:in_into|joy', 'en:in_into|joy|ment',
  'wonder|ful', 'doubt|ful', 'doubt|less',
  'un|cover', 'dis|cover', 'dis|cover|y', 're|cover',
  'part|ly:ly', 'de|part', 'de|part|ment', 'part|ial:al',
];

// Parse "im:in_not|port|ant" into a structured item.
export function parseSpec(spec) {
  const parts = spec.split('|').map(tok => {
    const [surface, id] = tok.split(':');
    return { surface, m: id || surface };
  });
  return {
    text: parts.map(p => p.surface).join(''),
    parts,
    // Cut positions are derived, never hand-written — they cannot drift.
    cuts: parts.slice(0, -1).reduce((acc, p) => {
      acc.push((acc[acc.length - 1] || 0) + p.surface.length);
      return acc;
    }, []),
  };
}

export const WORDS = WORD_SPECS.map(parseSpec);
