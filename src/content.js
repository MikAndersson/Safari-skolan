/* Djurkompisarna – innehåll: ord, rim, meningar, berättelser, belöningar. */
(function (App) {
  'use strict';
  const A = App.art;
  const C = (App.content = {});

  C.SETS = { 1: 'AMSOT', 2: 'BLKHF', 3: 'EPRNDGV', 4: 'IJUYÄÖÅ' };

  /* Första bokstaven: bokstav -> [ord, bild]. Första posten används som ledtråd ("S som i sol"). */
  C.FIRST = {
    A: [['apa', '🐒'], ['anka', '🦆'], ['ananas', '🍍']],
    M: [['mus', '🐭'], ['måne', '🌙'], ['morot', '🥕']],
    S: [['sol', '☀️'], ['sko', '👟'], ['sax', '✂️'], ['sked', '🥄']],
    O: [['orm', '🐍'], ['ost', '🧀']],
    T: [['tåg', '🚆'], ['tomat', '🍅'], ['tiger', '🐯'], ['tand', '🦷']],
    B: [['bil', '🚗'], ['boll', '⚽'], ['banan', '🍌'], ['björn', '🐻']],
    L: [['lejon', '🦁'], ['lök', '🧅'], ['lampa', '💡']],
    K: [['katt', '🐱'], ['ko', '🐄'], ['kanin', '🐰'], ['krona', '👑']],
    H: [['hus', '🏠'], ['hund', '🐶'], ['häst', '🐴'], ['hatt', '🎩']],
    F: [['fisk', '🐟'], ['fjäril', '🦋'], ['fot', '🦶'], ['fågel', '🐦']],
    E: [['elefant', '🐘'], ['enhörning', '🦄']],
    P: [['pizza', '🍕'], ['päron', '🍐'], ['panda', '🐼'], ['penna', '✏️']],
    R: [['ros', '🌹'], ['räv', '🦊'], ['raket', '🚀'], ['robot', '🤖']],
    N: [['nyckel', '🔑'], ['nos', '👃'], ['nalle', '🧸']],
    D: [['delfin', '🐬'], ['dörr', '🚪'], ['dinosaurie', '🦖']],
    G: [['giraff', '🦒'], ['groda', '🐸'], ['gris', '🐷'], ['gurka', '🥒']],
    V: [['val', '🐋'], ['vante', '🧤'], ['vulkan', '🌋']],
    I: [['igelkott', '🦔']],
    J: [['jordgubbe', '🍓']],
    U: [['uggla', '🦉']],
    Y: [['yxa', '🪓']],
    Å: [['åska', '⛈️']],
    Ä: [['äpple', '🍎'], ['ägg', '🥚']],
    Ö: [['örn', '🦅'], ['öra', '👂'], ['ödla', '🦎']],
  };

  /* Ord att bygga och läsa. Bokstäverna måste ingå i bokstavsmängderna ovan. */
  C.WORDS = [
    ['sol', '☀️'], ['ost', '🧀'], ['ko', '🐄'], ['sko', '👟'], ['bok', '📖'], ['fot', '🦶'], ['katt', '🐱'],
    ['hatt', '🎩'], ['boll', '⚽'], ['tomat', '🍅'], ['kaka', '🍪'],
    ['ros', '🌹'], ['nos', '👃'], ['get', '🐐'], ['val', '🐋'], ['ben', '🦴'], ['bro', '🌉'], ['nalle', '🧸'],
    ['regn', '🌧️'], ['vante', '🧤'], ['pannkaka', '🥞'],
    ['bil', '🚗'], ['mus', '🐭'], ['hus', '🏠'], ['bi', '🐝'], ['hund', '🐶'], ['fisk', '🐟'], ['gris', '🐷'],
    ['ägg', '🥚'], ['äpple', '🍎'], ['öra', '👂'], ['örn', '🦅'], ['häst', '🐴'], ['uggla', '🦉'], ['gurka', '🥒'],
    ['björn', '🐻'], ['mjölk', '🥛'], ['fjäril', '🦋'], ['igelkott', '🦔'], ['tåg', '🚆'], ['måne', '🌙'],
    ['hjärta', '❤️'], ['jordgubbe', '🍓'], ['båt', '⛵'], ['får', '🐑'], ['lök', '🧅'], ['tält', '⛺'], ['päron', '🍐'],
  ];

  C.RHYMES = [
    [['hus', '🏠'], ['mus', '🐭']], [['ko', '🐄'], ['sko', '👟']], [['katt', '🐱'], ['hatt', '🎩']],
    [['hund', '🐶'], ['mun', '👄']], [['nos', '👃'], ['ros', '🌹']], [['sol', '☀️'], ['stol', '🪑']],
    [['tåg', '🚆'], ['våg', '🌊']],
  ];

  C.SENT = [
    { s: 'Hunden jagar bollen.', a: '🐶', d: ['🐱', '🐟'] },
    { s: 'Katten dricker mjölk.', a: '🐱', d: ['🐶', '🐴'] },
    { s: 'Fågeln sitter i trädet.', a: '🐦', d: ['🐟', '🐄'] },
    { s: 'Fisken simmar i vattnet.', a: '🐟', d: ['🐦', '🐰'] },
    { s: 'Solen skiner på himlen.', a: '☀️', d: ['🌙', '🌧️'] },
    { s: 'Det regnar ute.', a: '🌧️', d: ['☀️', '❄️'] },
    { s: 'Jag äter ett rött äpple.', a: '🍎', d: ['🍌', '🥕'] },
    { s: 'Bilen kör på vägen.', a: '🚗', d: ['🚆', '🚲'] },
    { s: 'Tåget åker på rälsen.', a: '🚆', d: ['🚗', '✈️'] },
    { s: 'Kaninen äter en morot.', a: '🐰', d: ['🐶', '🐘'] },
    { s: 'Månen lyser på natten.', a: '🌙', d: ['☀️', '🌈'] },
    { s: 'Bävern bygger en damm.', a: '🦫', d: ['🐘', '🦁'] },
    { s: 'Zebran har ränder.', a: '🦓', d: ['🦁', '🐘'] },
    { s: 'Elefanten har en lång snabel.', a: '🐘', d: ['🦓', '🦫'] },
    { s: 'Lejonet ryter högt.', a: '🦁', d: ['🦫', '🐘'] },
  ];

  C.TF = [
    ['Solen är varm.', true], ['Fiskar bor i vatten.', true], ['Katter säger kvack.', false],
    ['En ko ger mjölk.', true], ['Snö är varm.', false], ['Elefanten är större än musen.', true],
    ['Hundar kan skälla.', true], ['En bil har fyra hjul.', true], ['Bananer är blå.', false],
    ['Det är mörkt på natten.', true], ['Is är kall.', true], ['En hund har sex ben.', false],
    ['Bävern bygger dammar.', true], ['Zebran har prickar.', false], ['Lejonet är en fisk.', false],
  ];

  C.STORY1 = [
    { t: 'Lisa har en röd boll. Hon kastar bollen till Omar. Omar fångar den.', q: 'Vem fångar bollen?', a: 'Omar', d: ['Lisa', 'Hunden'] },
    { t: 'Det är kallt ute. Nils tar på sig mössan och vantarna. Sedan går han ut och åker pulka.', q: 'Vad gör Nils sist?', a: 'Åker pulka', d: ['Badar', 'Sover'] },
    { t: 'Mia ser en liten kattunge i trädgården. Den är hungrig. Mia hämtar lite mjölk.', q: 'Vad får kattungen?', a: 'Mjölk', d: ['Fisk', 'Ett ägg'] },
    { t: 'Pappa bakar en kaka. Han behöver ägg, mjöl och socker. Kakan doftar gott.', q: 'Vad bakar pappa?', a: 'En kaka', d: ['Ett bröd', 'En pizza'] },
    { t: 'Bävern gnager på en stock. Sedan simmar han till dammen. Där lägger han stocken överst.', q: 'Vart simmar bävern?', a: 'Till dammen', d: ['Till skogen', 'Till staden'] },
  ];

  C.STORY2 = [
    { t: 'Ali vaknade tidigt. Det hade snöat hela natten och marken var vit. Han tog på sig varma kläder och sprang ut. Snart hade han byggt en stor snögubbe.', q: 'Vilken årstid är det troligen?', a: 'Vinter', d: ['Sommar', 'Höst'] },
    { t: 'Sara har sparat pengar i en burk i flera veckor. I dag räknade hon dem och hade 45 kronor. Hon vill köpa en bok som kostar 60 kronor.', q: 'Hur många kronor saknar Sara?', a: '15 kronor', d: ['10 kronor', '25 kronor'] },
    { t: 'Elefanter går långa sträckor för att hitta vatten. På vägen hjälper de varandra. De små kalvarna går nära mamman så att de inte tappar bort sig.', q: 'Varför går kalvarna nära mamman?', a: 'För att inte tappa bort sig', d: ['För att de är hungriga', 'För att det regnar'] },
    { t: 'Zebrorna står tätt ihop när lejonet kommer. Ränderna blandas ihop, och det är svårt att se var en zebra slutar och nästa börjar. Lejonet blir förvirrat.', q: 'Varför blir lejonet förvirrat?', a: 'Ränderna blandas ihop', d: ['Zebrorna springer iväg', 'Det är mörkt'] },
    { t: 'Lina och Måns delar lika på 12 kakor. Varje barn ska få lika många.', q: 'Hur många kakor får var och en?', a: '6 kakor', d: ['4 kakor', '8 kakor'] },
  ];

  /* Föremål att räkna. h = bildens html, g = en/ett. */
  C.OBJECTS = [
    { h: A.log(), sg: 'stock', pl: 'stockar', g: 'en', log: true },
    { h: A.emo('🍎'), sg: 'äpple', pl: 'äpplen', g: 'ett' },
    { h: A.emo('🌼'), sg: 'blomma', pl: 'blommor', g: 'en' },
    { h: A.emo('🐟'), sg: 'fisk', pl: 'fiskar', g: 'en' },
    { h: A.emo('⭐'), sg: 'stjärna', pl: 'stjärnor', g: 'en' },
    { h: A.emo('🍌'), sg: 'banan', pl: 'bananer', g: 'en' },
    { h: A.emo('⚽'), sg: 'boll', pl: 'bollar', g: 'en' },
    { h: A.emo('🦋'), sg: 'fjäril', pl: 'fjärilar', g: 'en' },
    { h: A.emo('🍐'), sg: 'päron', pl: 'päron', g: 'ett' },
    { h: A.emo('🐝'), sg: 'bi', pl: 'bin', g: 'ett' },
  ];

  /* ---------- safarit: djuren, vem som kan vad, och det man bygger ---------- */
  /* tier = årskursen då djuret brukar dyka upp (0 = F-klass). can = vad djuret är bra på. */
  const PL = (id, name, who, tier, pitch, rate, can, hello) => ({ id, animal: id, name, who, tier, pitch, rate, can, hello, blurb: can });
  C.PLACES = {
    beaver: PL('beaver', 'Bäverdammen', 'Bävern', 0, 1.05, 0.9, 'räkna och bygga', 'Hej! Jag är Bävern. Jag älskar att räkna och bygga.'),
    zebra: PL('zebra', 'Zebrahagen', 'Zebran', 0, 1.35, 0.92, 'former och mönster', 'Hej! Jag är Zebran. Jag älskar ränder, former och mönster.'),
    lion: PL('lion', 'Lejonklippan', 'Lejonet', 0, 0.55, 0.85, 'bokstäver och rim', 'Rooar! Jag är Lejonet. Jag ryter bokstäver och rim.'),
    elephant: PL('elephant', 'Elefantens vattenhål', 'Elefanten', 0, 0.75, 0.85, 'siffror', 'Hej! Jag är Elefanten. Jag minns alla siffror.'),
    monkey: PL('monkey', 'Apträdet', 'Apan', 1, 1.5, 1.0, 'plus och minus', 'Uh uh ah ah! Jag är Apan. Jag hoppar mellan tal och är bra på plus och minus.'),
    giraffe: PL('giraffe', 'Giraffsavannen', 'Giraffen', 1, 1.2, 0.88, 'alla bokstäver', 'Hej där uppifrån! Jag är Giraffen. Jag ser alla bokstäver, även de högsta.'),
    hippo: PL('hippo', 'Flodhästens flod', 'Flodhästen', 1, 0.65, 0.82, 'bygga och läsa ord', 'Hej! Jag är Flodhästen. Jag älskar att bygga och läsa ord.'),
    turtle: PL('turtle', 'Sköldpaddsstranden', 'Sköldpaddan', 1, 0.8, 0.78, 'tal till tjugo, klockan och mönster', 'Hej! Jag är Sköldpaddan. Jag tar det lugnt och kan siffror, klockan och mönster.'),
    rhino: PL('rhino', 'Noshörningsslätten', 'Noshörningen', 2, 0.5, 0.85, 'stora tal med tiotal och ental', 'Hej! Jag är Noshörningen. Jag är stark och kan stora tal.'),
    flamingo: PL('flamingo', 'Flamingosjön', 'Flamingon', 2, 1.45, 0.95, 'jämna och udda tal, dubbelt och hoppräkning', 'Hej! Jag är Flamingon. Jag står på ett ben och kan jämna tal, udda tal och dubbelt.'),
    cheetah: PL('cheetah', 'Gepardkullen', 'Geparden', 2, 1.25, 1.05, 'klockan och pengar', 'Hej! Jag är Geparden. Jag är snabb på klockan och på pengar.'),
    parrot: PL('parrot', 'Papegojträdet', 'Papegojan', 2, 1.6, 1.0, 'meningar och berättelser', 'Hej hej! Jag är Papegojan. Jag älskar att prata och läsa meningar.'),
    gorilla: PL('gorilla', 'Gorillaberget', 'Gorillan', 3, 0.45, 0.82, 'gånger och stora tal med växling', 'Hej! Jag är Gorillan. Jag är superstark och kan gånger och växling.'),
    owl: PL('owl', 'Uggleträdet', 'Ugglan', 3, 0.9, 0.82, 'långa berättelser', 'Hoo hoo! Jag är Ugglan. Jag är klok och läser långa berättelser.'),
  };
  C.PLACE_ORDER = Object.keys(C.PLACES);
  C.STARTERS = C.PLACE_ORDER.filter((id) => C.PLACES[id].tier === 0);

  /* Vem som är värd för vilken färdighet. Svårare saker ligger hos djur som kommer senare. */
  C.HOST = {
    z_shapes: 'zebra', z_match: 'zebra', z_more: 'zebra', z_pat1: 'zebra',
    m_count5: 'beaver', m_count10: 'beaver', m_add5: 'beaver', m_sub5: 'beaver',
    m_num5: 'elephant', m_num10: 'elephant', m_next: 'elephant',
    l_let1: 'lion', l_let2: 'lion', l_rhyme: 'lion', l_first1: 'lion',
    m_count20: 'monkey', m_add10: 'monkey', m_sub10: 'monkey', m_ten: 'monkey', m_add20: 'monkey', m_sub20: 'monkey',
    l_let3: 'giraffe', l_let4: 'giraffe', l_lower: 'giraffe', l_first2: 'giraffe',
    l_build1: 'hippo', l_build2: 'hippo', l_word1: 'hippo', l_word2: 'hippo',
    m_num20: 'turtle', m_clock1: 'turtle', z_pat2: 'turtle',
    m_add100a: 'rhino', m_sub100a: 'rhino', m_place: 'rhino',
    z_oddeven: 'flamingo', z_double: 'flamingo', m_skip: 'flamingo',
    m_clock2: 'cheetah', m_money: 'cheetah',
    l_sent: 'parrot', l_tf: 'parrot', l_story1: 'parrot',
    m_add100b: 'gorilla', m_sub100b: 'gorilla', z_arrays: 'gorilla', z_mult: 'gorilla',
    l_story2: 'owl',
  };

  /* Årskurserna och hur stort safarit är efter varje klarad årskurs (kolumner, rader). */
  C.LEVELS = ['F', '1', '2', '3'];
  C.LEVEL_NAMES = ['F-klass', 'Åk 1', 'Åk 2', 'Åk 3'];
  C.SIZES = [[5, 3], [7, 4], [8, 5], [10, 6], [11, 6]];
  C.SLACK = [2, 2, 1, 1]; // så många färdigheter får saknas när årskursen räknas som klar

  /* Det man bygger. Små saker (växter) får plats fem per ruta, stora saker och djur tar en hel ruta. */
  C.SMALL = [
    ['sprout', 'en liten planta'], ['flowerR', 'en röd blomma'], ['bush', 'en buske'], ['tulip', 'en tulpan'], ['treeS', 'ett litet träd'],
    ['mushroom', 'en svamp'], ['flowerY', 'en gul blomma'], ['rock', 'en sten'], ['sunflower', 'en solros'], ['grass', 'en grästuva'],
    ['palmS', 'en liten palm'], ['daisy', 'en tusensköna'],
  ].map((x) => ({ id: x[0], n: x[1] }));
  C.BIG = [
    ['pond', 'en damm'], ['hut', 'en koja'], ['tent', 'ett tält'], ['jeep', 'en safaribil'], ['tower', 'ett utkikstorn'],
    ['baobab', 'ett stort baobabträd'], ['fountain', 'en fontän'], ['balloon', 'en luftballong'], ['sign', 'en vägskylt'],
  ].map((x) => ({ id: x[0], n: x[1] }));
  C.DECOR = {};
  C.SMALL.forEach((d) => { C.DECOR[d.id] = Object.assign({ k: 'small' }, d); });
  C.BIG.forEach((d) => { C.DECOR[d.id] = Object.assign({ k: 'big' }, d); });
  C.DECOR.can = { k: 'small', id: 'can', n: 'en vattenkanna', up: true }; // belöning när trädgårdarna är fulla: en planta får växa
  C.SLOTS = 5; // småsaker per ruta
})(globalThis.App || (globalThis.App = {}));
