// One-off content patch: deepen every English "Why We Do This" and trim the
// story's moralizing tail where it duplicated the Why. English only — other
// languages are intentionally left until the English is approved.
//
// ALL rewritten text is UNVERIFIED and must be reviewed by a priest/elder
// (see docs/REVIEW_CHECKLIST.md) before being treated as final.
//
// Run: node scripts/patch-why.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'data', 'festivals.json');
const data = JSON.parse(await readFile(file, 'utf8'));

// Story trims: [exactSubstringToRemove, replacement]. Applied to en.story.
const STORY_TRIMS = {
  shivaratri: [
    " That's why on Maha Shivaratri, devotees stay awake through the night too, remembering the night Shiva protected the whole world by taking on its poison himself.",
    '',
  ],
  mahalakshmijayanthi: [
    ', reminding us that true abundance rises when we churn through effort and patience, not just luck.',
    '.',
  ],
  yugadi: [
    ', and that we should accept the whole mixture with grace, not just the sweet parts.',
    '.',
  ],
  ramanavami: [
    " Rama Navami is the day we celebrate his birth: a reminder that even a king's son chose truth and duty over comfort and power.",
    '',
  ],
  janmashtami: [
    " Janmashtami is the day we celebrate Krishna's birthday: the day love, courage, and protection came into the world.",
    '',
  ],
  ganeshchaturthi: [
    " That's why we always pray to Ganesha before starting something important, a new school year, a new house, even a new festival.",
    '',
  ],
  diwali: [
    " Both stories share the very same idea: light winning over darkness, and good winning over evil. That's really what every diya we light is saying.",
    '',
  ],
};

// Deeper "Why We Do This" for every festival (English).
const WHY = {
  godakalyanam: `We celebrate Goda Kalyanam to honour the day Andal, a girl who loved the Lord with her whole heart, was united with him in marriage. The temple lovingly re-enacts their wedding, with decorations, a sacred thread, and her own Tiruppavai verses, because her story is held up as one of the highest examples of loving God sincerely. It reminds us that devotion offered with a pure and determined heart can become something eternal, no matter who we are.`,
  makarasankranti: `We celebrate Makara Sankranti to thank the sun as it turns northward and begins a warmer, brighter half of the year, and to give thanks for the harvest it ripened. Boiling the Pongal until it joyfully overflows, drawing kolams, and flying kites are all ways of celebrating that abundance together. It reminds us to be grateful not only to God, but to the sun, the rain, the earth, the animals, and the many people whose quiet work fills our plate each day.`,
  shivaratri: `We keep Maha Shivaratri, 'the great night of Shiva,' to honour the night Lord Shiva saved all of creation by holding the world's poison in his throat. Families stay awake right through the night, just as the gods and Goddess Parvati kept watch over him, because staying awake is our way of keeping God company and saying thank you. Through the night the Shiva lingam is bathed with simple bilva leaves, milk, and water, a reminder that a sincere heart pleases God far more than any expensive gift.`,
  mahalakshmijayanthi: `We celebrate Mahalakshmi Jayanthi to honour the day Goddess Lakshmi rose from the churning ocean and became the giver of prosperity and well-being. In the temple she is bathed and worshipped with lotus flowers, her favourite, as families pray for their homes. Her appearance reminds us that real wealth is far more than money, it includes health, knowledge, courage, and a happy home, and that such abundance usually rises through patient effort, not luck alone.`,
  yugadi: `We celebrate Yugadi as the start of a new year and a new age, traditionally the day Lord Brahma began creating the universe and set time itself in motion. Families begin the year at the temple and hear the Panchangam, the almanac for the year ahead. Tasting the six flavours of Ugadi Pachadi together teaches us, right at the threshold of the year, that a good life isn't only sweet, it is about meeting every taste life brings with grace and balance.`,
  ramanavami: `We celebrate Rama Navami as the birthday of Lord Rama, the prince of Ayodhya and an avatar of Vishnu, born to defeat Ravana and show the world how to live with truth and honour. At midday, the hour of his birth, the temple bathes Rama along with Sita, Lakshmana, and Hanuman, and devotees sing the Ramayana; some temples re-enact his coronation. His life reminds us that keeping our promises, being fair, and staying patient matter more than power or comfort, for Rama, though a prince, always chose the right thing over the easy thing.`,
  hanumanjayanthi: `We celebrate Hanuman Jayanti as the birthday of Lord Hanuman, the mighty and devoted helper of Lord Rama. In the temple he is bathed and offered sindoor and butter, which devotees believe he especially loves. His life reminds us that the greatest strength is the kind used in service of others rather than for ourselves, and that loyalty and whole-hearted devotion can make even the impossible possible.`,
  sivalayavarshikotsavam: `We hold the Varshikotsavam each year to honour the temple's own Shiva shrine with several days of abhishekams, processions of the festival deity around the grounds, and music and dance in Shiva's honour. Setting aside a whole yearly festival, not only the single night of Maha Shivaratri, reminds us that devotion is something a community can celebrate together, joyfully and often, year after year.`,
  tamilnewyearvishu: `We celebrate Puthandu and Vishu to welcome the solar new year as the sun enters a new zodiac sign. Families begin the day at the temple, and in Kerala open their eyes first to the Vishukkani, an arrangement of auspicious things prepared the night before. Beginning the year by first seeing something beautiful and blessed, or by visiting the Lord before anything else, reminds us to start new chapters with gratitude and good intention, instead of rushing straight into the busyness of daily life.`,
  akshayatritiya: `We honour Akshaya Tritiya as one of the most auspicious days of the year, for 'Akshaya' means that which never decreases; so people begin good ventures, give in charity, and make offerings, trusting that what is started or shared today will last and grow. Remembering the Akshaya Patra that never emptied while it fed others, the day teaches us that true abundance grows the more it is shared, not the more it is hoarded.`,
  brahmotsavam: `Brahmotsavam is the temple's grandest festival of the year, said to have first been performed by Lord Brahma himself for Lord Venkateswara. For nine days the Lord is carried through the streets each evening on a different vahana, Garuda, Hanumantha, the lion, the elephant, the great chariot, so that the whole community, not only those who can enter the sanctum, may receive his blessing. It reminds us that celebration is richest when it is shared widely, bringing the Lord out to everyone.`,
  gurupurnima: `We keep Guru Purnima on the full-moon day to honour Sage Vyasa, who gave the world the Vedas and the Mahabharata, and through him every guru who lights the way for others. The temple offers prayers to Vyasa and the tradition's teachers and saints, and students take the day to thank their own teachers, in school, in music, or in spiritual learning. It reminds us that no one learns entirely alone: everything we know was once passed to us by someone, and today is the day to say thank you.`,
  pavithrotsavam: `Pavithrotsavam is held once a year to gently correct and purify any small mistakes made in the temple's countless rituals over the year. Priests perform elaborate Vedic rites and a homam, and offer the deity the Pavitram, a specially blessed sacred thread, as a way of making the whole year's worship complete again. It reminds us that even in our most careful and important work, small mistakes are alright, as long as we care enough to notice them and set things right.`,
  janmashtami: `We celebrate Janmashtami as the midnight birth of Lord Krishna, a form of Vishnu who came into the world to protect the good and stand against cruelty. At the exact hour of his birth the temple bathes him in milk, honey, and curd, devotees gently rock baby Krishna's cradle and sing of his childhood, and many fast and stay awake until midnight. Offering him our very best in the abhishekam, and waiting eagerly through the night, is how we welcome someone truly beloved, like staying up for a dear one arriving home late.`,
  ganeshchaturthi: `We celebrate Ganesha Chaturthi as the birthday of Lord Ganesha, the beloved elephant-headed god who clears away obstacles. That is why we pray to him first before anything new, a school year, a journey, even another festival, so we begin with a calm, hopeful mind instead of worry. During these days families welcome his image into their homes like an honoured guest and offer his favourite modakam, a sweet way of showing love; and where it is the custom, they carry him to water for a joyful farewell at the end.`,
  dussehra: `Dussehra, or Vijayadashami, is the tenth day of victory, celebrating Goddess Durga's defeat of the demon Mahishasura after nine nights of battle, and, in many homes, Lord Rama's victory over Ravana. Through the nine nights the temple honours the Goddess in her many forms, and on the tenth day Ayudha Puja blesses the tools, books, and instruments that help us do good work. Durga's story reminds us that real strength often comes from many good things joining together, not one person alone; and Ayudha Puja reminds us to be grateful for the everyday things, books, tools, even a bicycle or cricket bat, that help us learn and do good.`,
  srivarujayanti: `Srivaru Jayanti celebrates the day Lord Venkateswara chose to appear at the Tirumala hills, taking a form close to his devotees rather than remaining in the distant heavens. The temple honours him with a grand abhishekam, a special alankaram, and day-long chanting of his thousand names. It reminds us that the divine chose to come near to ordinary people, and that anyone, however important or humble, can reach out with a sincere heart and be heard.`,
  diwali: `We celebrate Diwali, the festival of lights, to welcome Lord Rama home to Ayodhya after fourteen years away, when the people lit rows of little lamps so he would never walk in darkness. Both of Diwali's stories carry the same idea: light winning over darkness, and good over evil. So every diya we light means welcoming goodness home; and many families also pray to Goddess Lakshmi for a bright new beginning, share sweets, and wear new clothes as a way of starting fresh and being generous with the people around them.`,
  skandashashti: `Skanda Sashti celebrates Lord Subrahmanya's six-day battle and final victory over the demon Surapadman, for he was born as a warrior to do what even the gods could not. Over six days the temple offers special prayers, ending with the Soorasamharam, a re-enactment of that great victory. It reminds us that even the hardest problems can be overcome when we face them with courage, preparation, and a willingness to stand up for what is right, guided by purpose rather than anger.`,
  ayyappamandala: `This day marks the start of the 41-day Mandala Vratham for devotees preparing to make the pilgrimage to Sabarimala, where Lord Ayyappa blesses all who come with sincere devotion, whoever they are. Those taking the vow receive a blessed mala and live simply, waking early to pray, wearing plain clothes, and giving up luxuries. It reminds us that reaching something truly meaningful, a pilgrimage, a goal, or a change in ourselves, usually takes steady discipline and patience, not a single burst of effort.`,
  vaikunthaekadasi: `Vaikuntha Ekadasi is the year's most sacred day for devotees of Vishnu, when the gates of his heavenly home, Vaikuntha, are believed to open. Temples raise a special gateway, the Vaikuntha Dwaram, and devotees wait, sometimes for hours, to pass through it with a sincere heart, followed by a grand abhishekam. It reminds us that some days carry a special sense of possibility, and that walking through such a doorway can be a small but real step toward a better version of ourselves.`,
};

let storyTrims = 0;
let whyUpdates = 0;
const problems = [];

for (const f of data.festivals) {
  const en = f.languages.en;
  if (!en) continue;

  if (STORY_TRIMS[f.id]) {
    const [find, replace] = STORY_TRIMS[f.id];
    if (!en.story.includes(find)) {
      problems.push(`${f.id}: story trim text not found (already trimmed?)`);
    } else {
      en.story = en.story.replace(find, replace);
      storyTrims++;
    }
  }

  if (WHY[f.id]) {
    en.importance = WHY[f.id];
    whyUpdates++;
  } else {
    problems.push(`${f.id}: no WHY provided`);
  }
}

if (problems.length) {
  console.error('Problems:\n  ' + problems.join('\n  '));
  process.exit(1);
}

await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Story tails trimmed: ${storyTrims}`);
console.log(`Why sections deepened: ${whyUpdates}`);
console.log('Done. English-only; te/ta/hi unchanged. All UNVERIFIED — review needed.');
