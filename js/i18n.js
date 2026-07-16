// Language handling: UI label strings, the active language, persistence, and
// the fallback rule used everywhere content might be missing a translation.
//
// IMPORTANT for reviewers/translators:
//   * `story`, `rituals`, `importance`, `shloka`, `quiz`, `scorePrefix`,
//     `scoreSuffix`, `tryAgain`, `correct`, `wrong` are the ORIGINAL prototype
//     strings and were human-authored — do not change without a review.
//   * The remaining keys are NEW interface labels added during the refactor.
//     They are marked in docs/REVIEW_CHECKLIST.md and should be confirmed by a
//     native speaker. Edit the wording here.

import { readPref, writePref } from './utils.js';

export const SUPPORTED_LANGS = ['en', 'te', 'ta', 'hi'];
export const DEFAULT_LANG = 'en';

// Human-readable names shown on the language toggle (each in its own script).
export const LANG_NAMES = {
  en: 'English',
  hi: 'हिंदी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
};

export const UI_STRINGS = {
  en: {
    // Section headings (original)
    story: 'The Story',
    rituals: 'At the Temple',
    importance: 'Why We Do This',
    shloka: 'A Sloka to Learn',
    quiz: "Let's Play, Quick Quiz",
    // Quiz feedback (original)
    scorePrefix: 'You got',
    scoreSuffix: 'right!',
    tryAgain: 'Try Again',
    correct: "That's right! 🎉",
    wrong: 'Not quite, try the next one!',
    // NEW interface labels — confirm wording (see REVIEW_CHECKLIST.md)
    chooseLanguage: 'Choose language',
    chooseFestival: 'Choose a festival',
    calendarLabel: 'Festival Calendar',
    correctTag: 'Correct answer',
    yourAnswerTag: 'Your answer',
    questionWord: 'Question',
    playAudio: 'Play shloka audio',
    pauseAudio: 'Pause',
    restartAudio: 'Restart from the beginning',
    readAloud: 'Read aloud',
    readResume: 'Resume',
    readStop: 'Stop',
    viewCalendar: 'View the Temple Calendar',
    backToTemple: 'Back to Temple Website',
    activitySheet: 'Printable activity page',
  },
  hi: {
    story: 'कहानी',
    rituals: 'मंदिर में',
    importance: 'हम यह क्यों करते हैं',
    shloka: 'सीखने के लिए एक श्लोक',
    quiz: 'चलो खेलें, छोटी क्विज़',
    scorePrefix: 'आपने',
    scoreSuffix: 'सही किए!',
    tryAgain: 'फिर कोशिश करें',
    correct: 'बिल्कुल सही! 🎉',
    wrong: 'थोड़ा गलत, अगला प्रयास करें!',
    chooseLanguage: 'भाषा चुनें',
    chooseFestival: 'एक त्योहार चुनें',
    calendarLabel: 'त्योहार कैलेंडर',
    correctTag: 'सही उत्तर',
    yourAnswerTag: 'आपका उत्तर',
    questionWord: 'प्रश्न',
    playAudio: 'श्लोक ऑडियो चलाएं',
    pauseAudio: 'रोकें',
    restartAudio: 'शुरू से चलाएं',
    readAloud: 'सुनें',
    readResume: 'जारी रखें',
    readStop: 'बंद करें',
    viewCalendar: 'मंदिर कैलेंडर देखें',
    backToTemple: 'मंदिर की वेबसाइट पर वापस जाएं',
    activitySheet: 'प्रिंट करने योग्य गतिविधि पृष्ठ',
  },
  te: {
    story: 'కథ',
    rituals: 'దేవాలయంలో',
    importance: 'మనం ఎందుకు చేస్తాము',
    shloka: 'నేర్చుకోవలసిన శ్లోకం',
    quiz: 'ఆడదాం, చిన్న క్విజ్',
    scorePrefix: 'మీరు',
    scoreSuffix: 'సరైనవి చేశారు!',
    tryAgain: 'మళ్ళీ ప్రయత్నించండి',
    correct: 'సరైనది! 🎉',
    wrong: 'సరిపోలేదు, తర్వాతది ప్రయత్నించండి!',
    chooseLanguage: 'భాషను ఎంచుకోండి',
    chooseFestival: 'ఒక పండుగను ఎంచుకోండి',
    calendarLabel: 'పండుగల క్యాలెండర్',
    correctTag: 'సరైన సమాధానం',
    yourAnswerTag: 'మీ సమాధానం',
    questionWord: 'ప్రశ్న',
    playAudio: 'శ్లోకం ఆడియో ప్లే చేయండి',
    pauseAudio: 'ఆపండి',
    restartAudio: 'మొదటి నుండి ప్లే చేయండి',
    readAloud: 'వినండి',
    readResume: 'కొనసాగించండి',
    readStop: 'నిలిపివేయండి',
    viewCalendar: 'దేవాలయ క్యాలెండర్ చూడండి',
    backToTemple: 'దేవాలయ వెబ్‌సైట్‌కు తిరిగి వెళ్లండి',
    activitySheet: 'ముద్రించదగిన కార్యకలాప పేజీ',
  },
  ta: {
    story: 'கதை',
    rituals: 'கோயிலில்',
    importance: 'நாம் ஏன் இதைச் செய்கிறோம்',
    shloka: 'கற்றுக்கொள்ள ஒரு ஸ்லோகம்',
    quiz: 'விளையாடலாம், சிறு வினாடி வினா',
    scorePrefix: 'நீங்கள்',
    scoreSuffix: 'சரியாக பதிலளித்தீர்கள்!',
    tryAgain: 'மீண்டும் முயற்சி',
    correct: 'சரி! 🎉',
    wrong: 'தவறு, அடுத்ததை முயற்சி செய்யுங்கள்!',
    chooseLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    chooseFestival: 'ஒரு திருவிழாவைத் தேர்ந்தெடுக்கவும்',
    calendarLabel: 'திருவிழா நாட்காட்டி',
    correctTag: 'சரியான பதில்',
    yourAnswerTag: 'உங்கள் பதில்',
    questionWord: 'கேள்வி',
    playAudio: 'ஸ்லோக ஒலிப்பதிவை இயக்கு',
    pauseAudio: 'இடைநிறுத்து',
    restartAudio: 'தொடக்கத்திலிருந்து இயக்கு',
    readAloud: 'படித்துக் காட்டு',
    readResume: 'தொடர',
    readStop: 'நிறுத்து',
    viewCalendar: 'கோயில் நாட்காட்டியைப் பார்க்கவும்',
    backToTemple: 'கோயில் இணையதளத்திற்குத் திரும்பு',
    activitySheet: 'அச்சிடக்கூடிய செயல்பாட்டுப் பக்கம்',
  },
};

const LANG_PREF_KEY = 'festivalCompanion.lang';

let currentLang = DEFAULT_LANG;

/** Load the saved language preference, if valid. Call once at startup. */
export function initLanguage() {
  const saved = readPref(LANG_PREF_KEY);
  if (saved && SUPPORTED_LANGS.includes(saved)) currentLang = saved;
  return currentLang;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return currentLang;
  currentLang = lang;
  writePref(LANG_PREF_KEY, lang);
  return currentLang;
}

/** UI strings for the active language (English is guaranteed complete). */
export function ui(lang = currentLang) {
  return UI_STRINGS[lang] || UI_STRINGS[DEFAULT_LANG];
}

/**
 * Given a festival and the desired language, return the language actually used
 * (falls back to English when the requested translation is missing).
 */
export function resolveLang(festival, lang = currentLang) {
  return festival.languages && festival.languages[lang] ? lang : DEFAULT_LANG;
}
