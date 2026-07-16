// Application entry point: loads data, wires controls, renders a festival.
// No framework — plain ES modules and DOM APIs.

import { CONFIG } from './config.js';
import {
  el,
  clear,
  fetchJson,
  svgFromString,
  makeExternalLink,
  readPref,
  writePref,
  prefersReducedMotion,
  detectScriptLang,
} from './utils.js';
import {
  SUPPORTED_LANGS,
  LANG_NAMES,
  initLanguage,
  getLang,
  setLang,
  ui,
  resolveLang,
} from './i18n.js';
import { validateFestivalData } from './validate.js';
import { newQuizState, renderQuiz } from './quiz.js';
import { ICONS } from './icons.js';

const FEST_PREF_KEY = 'festivalCompanion.festival';

const state = {
  data: null,
  yearDates: {},
  yearLabel: '',
  orderedIds: [],
  currentFest: null,
  quizStates: {}, // keyed by `${festId}:${lang}` — session-only, resets on switch
};

const dom = {};

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

init();

async function init() {
  cacheDom();
  applyBranding();
  applyDisclaimer();
  initLanguage();
  respectReducedMotion();

  try {
    const data = await fetchJson('data/festivals.json');
    const { ok, errors } = validateFestivalData(data);
    if (!ok) {
      console.error('festivals.json failed validation:\n' + errors.join('\n'));
      showFatal(
        'Some festival content is not formatted correctly and could not be shown. A volunteer can run "npm run validate" to find the problem.'
      );
      return;
    }
    state.data = data;
  } catch (err) {
    console.error(err);
    showFatal(
      'Sorry, the festival content could not be loaded. Please try again.'
    );
    return;
  }

  computeYear();
  buildLanguageToggle();
  buildFestivalSelect();
  restoreSelection();
  render();
  registerServiceWorker();
}

function cacheDom() {
  dom.templeName = document.getElementById('templeName');
  dom.templeLogo = document.getElementById('templeLogo');
  dom.langToggle = document.getElementById('langToggle');
  dom.festSelect = document.getElementById('festSelect');
  dom.calendarYearLabel = document.getElementById('calendarYearLabel');
  dom.card = document.getElementById('cardRoot');
  dom.live = document.getElementById('srLive');
  dom.disclaimer = document.getElementById('disclaimer');
  dom.linksRow = document.getElementById('linksRow');
  dom.footerMessage = document.getElementById('footerMessage');
  dom.footerLinks = document.getElementById('footerLinks');
  dom.reviewAttribution = document.getElementById('reviewAttribution');
}

// ---------------------------------------------------------------------------
// Branding, disclaimer, links (all driven by js/config.js)
// ---------------------------------------------------------------------------

function applyBranding() {
  if (CONFIG.templeName) dom.templeName.textContent = CONFIG.templeName;
  if (CONFIG.templeLogo) {
    dom.templeLogo.src = CONFIG.templeLogo;
    dom.templeLogo.alt = CONFIG.templeName
      ? `${CONFIG.templeName} logo`
      : 'Temple logo';
    dom.templeLogo.hidden = false;
  }
  if (CONFIG.footerMessage)
    dom.footerMessage.textContent = CONFIG.footerMessage;
  if (CONFIG.contentReviewAttribution) {
    dom.reviewAttribution.textContent = CONFIG.contentReviewAttribution;
  }
  buildExternalLinks();
}

function buildExternalLinks() {
  const t = ui();
  // Top row: calendar + activity (child/parent facing, near the content)
  clear(dom.linksRow);
  if (CONFIG.templeCalendarUrl) {
    dom.linksRow.append(
      makeExternalLink(
        el('a', { class: 'ext-link', text: t.viewCalendar }),
        CONFIG.templeCalendarUrl
      )
    );
  }
  if (CONFIG.activitySheetUrl) {
    dom.linksRow.append(
      makeExternalLink(
        el('a', { class: 'ext-link', text: t.activitySheet }),
        CONFIG.activitySheetUrl
      )
    );
  }
  dom.linksRow.hidden = dom.linksRow.childElementCount === 0;

  // Footer: back to temple website
  clear(dom.footerLinks);
  if (CONFIG.templeWebsiteUrl) {
    dom.footerLinks.append(
      makeExternalLink(
        el('a', { class: 'ext-link', text: t.backToTemple }),
        CONFIG.templeWebsiteUrl
      )
    );
  }
  dom.footerLinks.hidden = dom.footerLinks.childElementCount === 0;
}

function applyDisclaimer() {
  if (CONFIG.disclaimer) {
    dom.disclaimer.textContent = CONFIG.disclaimer;
  } else {
    dom.disclaimer.hidden = true;
  }
}

function respectReducedMotion() {
  if (prefersReducedMotion()) {
    // Stop the decorative SMIL flame animation in the header diya.
    document.querySelectorAll('.diya animate').forEach((node) => node.remove());
  }
}

// ---------------------------------------------------------------------------
// Year / dates
// ---------------------------------------------------------------------------

function computeYear() {
  const years = Object.keys(state.data.dates || {}).sort();
  const thisYear = String(new Date().getFullYear());
  const chosen = state.data.dates[thisYear]
    ? thisYear
    : years[years.length - 1];
  state.yearDates = (state.data.dates && state.data.dates[chosen]) || {};
  state.yearLabel = chosen || '';
}

function festivalDate(id) {
  return state.yearDates[id] || null;
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function buildLanguageToggle() {
  clear(dom.langToggle);
  dom.langToggle.setAttribute('aria-label', ui().chooseLanguage);
  SUPPORTED_LANGS.forEach((lang) => {
    const active = lang === getLang();
    const btn = el('button', {
      type: 'button',
      class: 'lang-btn' + (active ? ' active' : ''),
      text: LANG_NAMES[lang],
      lang,
      'aria-pressed': String(active),
      dataset: { lang },
    });
    btn.addEventListener('click', () => onLanguageChange(lang));
    dom.langToggle.append(btn);
  });
}

function buildFestivalSelect() {
  dom.festSelect.setAttribute('aria-label', ui().chooseFestival);

  const ids = state.data.festivals.map((f) => f.id);
  state.orderedIds = ids.slice().sort((a, b) => {
    const da = festivalDate(a);
    const db = festivalDate(b);
    const sa = (da && da.sort) || '99-99';
    const sb = (db && db.sort) || '99-99';
    return sa.localeCompare(sb);
  });

  renderFestivalOptions();

  dom.festSelect.addEventListener('change', (e) => {
    state.currentFest = e.target.value;
    writePref(FEST_PREF_KEY, state.currentFest);
    render();
    dom.card.focus();
  });

  if (state.yearLabel) {
    dom.calendarYearLabel.textContent = `${ui().calendarLabel}, ${state.yearLabel}`;
  }
}

function renderFestivalOptions() {
  const lang = getLang();
  clear(dom.festSelect);
  state.orderedIds.forEach((id) => {
    const festival = getFestival(id);
    const usedLang = resolveLang(festival, lang);
    const title = festival.languages[usedLang].title;
    const date = festivalDate(id);
    const label = date ? `${date.display}: ${title}` : title;
    dom.festSelect.append(
      el('option', {
        value: id,
        text: label,
        selected: id === state.currentFest,
      })
    );
  });
}

function restoreSelection() {
  const saved = readPref(FEST_PREF_KEY);
  if (saved && getFestival(saved)) state.currentFest = saved;
  else state.currentFest = state.orderedIds[0];
  dom.festSelect.value = state.currentFest;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function onLanguageChange(lang) {
  if (lang === getLang()) return;
  setLang(lang);
  // Update toggle state
  dom.langToggle.querySelectorAll('.lang-btn').forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  // Rebuild anything language-dependent
  buildExternalLinks();
  if (state.yearLabel) {
    dom.calendarYearLabel.textContent = `${ui().calendarLabel}, ${state.yearLabel}`;
  }
  renderFestivalOptions();
  render(); // resets quiz state for the newly-shown language (different key)
}

// ---------------------------------------------------------------------------
// Rendering the festival card
// ---------------------------------------------------------------------------

function getFestival(id) {
  return state.data.festivals.find((f) => f.id === id);
}

function render() {
  const festival = getFestival(state.currentFest);
  if (!festival) {
    showFatal('That festival could not be found.');
    return;
  }
  const lang = resolveLang(festival, getLang());
  const content = festival.languages[lang];
  const t = ui(lang);

  // Set language on the card so screen readers switch pronunciation, and on the
  // document so the change is announced/detected.
  dom.card.setAttribute('lang', lang);
  document.documentElement.setAttribute('lang', lang);

  clear(dom.card);

  // Icon (trusted internal SVG constant)
  const svg = svgFromString(ICONS[festival.icon]);
  if (svg) dom.card.append(el('div', { class: 'icon-wrap' }, [svg]));

  // Optional festival image (lazy-loaded, only when present)
  if (festival.image) {
    dom.card.append(
      el('img', {
        class: 'festival-image',
        src: festival.image,
        alt: `${content.title} illustration`,
        loading: 'lazy',
        decoding: 'async',
      })
    );
  }

  dom.card.append(el('h2', { class: 'festival-title', text: content.title }));
  dom.card.append(el('p', { class: 'festival-sub', text: content.subtitle }));

  dom.card.append(section(t.story, content.story));
  dom.card.append(section(t.rituals, content.rituals));
  dom.card.append(section(t.importance, content.importance));
  dom.card.append(shlokaSection(t, content.shloka, lang));
  dom.card.append(quizSection(t, festival, content, lang));
}

function section(labelText, bodyText) {
  const wrap = el('div', { class: 'section' });
  wrap.append(sectionLabel(labelText));
  wrap.append(el('p', { text: bodyText }));
  return wrap;
}

function sectionLabel(text) {
  return el('h3', { class: 'section-label' }, [
    document.createTextNode(text),
    el('span', { class: 'rule', 'aria-hidden': 'true' }),
  ]);
}

function shlokaSection(t, shloka, lang) {
  const wrap = el('div', { class: 'section' });
  wrap.append(sectionLabel(t.shloka));

  const box = el('div', { class: 'shloka-box' });
  // Most shlokas are Sanskrit (Devanagari), but some are in Tamil/Telugu (e.g.
  // Andal's Tiruppavai). Detect the actual script so the correct font applies
  // regardless of the interface language, instead of assuming Sanskrit.
  // `pre-line` renders newlines without any innerHTML.
  box.append(
    el('p', {
      class: 'shloka-sanskrit',
      lang: detectScriptLang(shloka.original) || 'sa',
      text: shloka.original,
    })
  );
  if (shloka.transliteration) {
    box.append(
      el('p', {
        class: 'shloka-translit',
        lang: lang === 'en' ? 'en' : lang,
        text: shloka.transliteration,
      })
    );
  }
  box.append(el('p', { class: 'shloka-meaning', text: shloka.meaning }));

  if (shloka.audio) box.append(audioPlayer(t, shloka.audio));

  wrap.append(box);
  return wrap;
}

function audioPlayer(t, audioSrc) {
  const wrap = el('div', { class: 'audio-player' });
  const audio = el('audio', {
    controls: '',
    preload: 'none', // do not autoplay, do not preload
    src: audioSrc,
    'aria-label': t.playAudio,
  });
  audio.addEventListener('error', () => {
    // Broken/missing audio should fail gracefully, not break the page.
    wrap.hidden = true;
  });
  const restart = el('button', {
    type: 'button',
    class: 'audio-restart',
    text: '⟲',
    'aria-label': t.restartAudio,
    title: t.restartAudio,
  });
  restart.addEventListener('click', () => {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  });
  wrap.append(audio, restart);
  return wrap;
}

function quizSection(t, festival, content, lang) {
  const wrap = el('div', { class: 'section' });
  wrap.append(sectionLabel(t.quiz));

  const key = `${festival.id}:${lang}`;
  if (!state.quizStates[key]) {
    state.quizStates[key] = newQuizState(content.quiz.length);
  }

  const container = el('div', { class: 'quiz' });
  wrap.append(container);

  renderQuiz({
    container,
    quiz: content.quiz,
    strings: t,
    state: state.quizStates[key],
    announce,
  });
  return wrap;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function announce(message) {
  if (!dom.live) return;
  dom.live.textContent = '';
  // Next tick so repeated identical messages are still announced.
  window.requestAnimationFrame(() => {
    dom.live.textContent = message;
  });
}

function showFatal(message) {
  clear(dom.card);
  dom.card.append(
    el('p', { class: 'load-error', role: 'alert', text: message })
  );
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
