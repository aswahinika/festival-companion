// Quiz behavior, kept separate from general app orchestration.
//
// Split into:
//   * pure state helpers (newQuizState / recordAnswer / isComplete / scoreOf /
//     shuffledIndices) — no DOM, unit-tested directly.
//   * renderQuiz() — builds accessible DOM and wires interaction.
//
// Options AND question order are shuffled on every attempt so the correct answer
// isn't always in the same position (the source data leans heavily on option 1),
// and "Try Again" re-shuffles for a fresh run. Question CONTENT is unchanged.

import { el, clear } from './utils.js';

// ---------------------------------------------------------------------------
// Pure state
// ---------------------------------------------------------------------------

/** Fisher–Yates shuffle of [0..n-1]. rng is injectable for deterministic tests. */
export function shuffledIndices(n, rng = Math.random) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Create fresh quiz state for a quiz (array of {question, options, answer}).
 * `answered`/`selected` are indexed by ORIGINAL question index; `questionOrder`
 * and `optionOrders` hold the shuffled display order.
 */
export function newQuizState(quiz, rng = Math.random) {
  const length = quiz.length;
  return {
    answered: new Array(length).fill(false),
    selected: new Array(length).fill(-1),
    correctCount: 0,
    questionOrder: shuffledIndices(length, rng),
    optionOrders: quiz.map((q) => shuffledIndices(q.options.length, rng)),
  };
}

/**
 * Record an answer. Scoring happens at most once per question (prevents
 * multiple scoring of the same question).
 * @returns {{changed: boolean, wasCorrect: boolean}}
 */
export function recordAnswer(state, qIndex, optIndex, correctIndex) {
  if (state.answered[qIndex]) return { changed: false, wasCorrect: false };
  state.answered[qIndex] = true;
  state.selected[qIndex] = optIndex;
  const wasCorrect = optIndex === correctIndex;
  if (wasCorrect) state.correctCount += 1;
  return { changed: true, wasCorrect };
}

export function isComplete(state) {
  return state.answered.every(Boolean);
}

export function scoreOf(state) {
  return state.correctCount;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Render an accessible quiz into `container`.
 *
 * @param {Object} opts
 * @param {HTMLElement} opts.container
 * @param {Array}  opts.quiz    - array of {question, options, answer, explanation}
 * @param {Object} opts.strings - UI strings for the active language
 * @param {Object} opts.state   - quiz state (mutated in place)
 * @param {(msg:string)=>void} opts.announce - screen-reader announcer
 */
export function renderQuiz({ container, quiz, strings, state, announce }) {
  clear(container);

  state.questionOrder.forEach((qi, displayPos) => {
    const item = quiz[qi];
    const block = el('div', { class: 'quiz-q' });

    block.append(
      el('p', {
        class: 'qtext',
        text: `${displayPos + 1}. ${item.question}`,
        id: `q-${qi}-label`,
      })
    );

    const opts = el('div', {
      class: 'opts',
      role: 'group',
      'aria-labelledby': `q-${qi}-label`,
    });

    state.optionOrders[qi].forEach((oj) => {
      const button = el('button', {
        type: 'button',
        class: 'opt',
        text: item.options[oj],
      });

      if (state.answered[qi]) {
        button.disabled = true;
        if (oj === item.answer) {
          button.classList.add('correct');
          button.prepend(
            el('span', { class: 'opt-mark', 'aria-hidden': 'true', text: '✓ ' })
          );
          button.append(
            el('span', { class: 'sr-only', text: ` — ${strings.correctTag}` })
          );
        } else if (state.selected[qi] === oj) {
          button.classList.add('wrong');
          button.prepend(
            el('span', { class: 'opt-mark', 'aria-hidden': 'true', text: '✗ ' })
          );
          button.append(
            el('span', {
              class: 'sr-only',
              text: ` — ${strings.yourAnswerTag}`,
            })
          );
        }
      } else {
        button.addEventListener('click', () => {
          const { changed, wasCorrect } = recordAnswer(
            state,
            qi,
            oj,
            item.answer
          );
          if (!changed) return;
          announce(
            (wasCorrect ? strings.correct : strings.wrong) +
              (item.explanation ? ` ${item.explanation}` : '')
          );
          renderQuiz({ container, quiz, strings, state, announce });
        });
      }

      opts.append(button);
    });

    block.append(opts);

    if (state.answered[qi] && item.explanation) {
      block.append(el('p', { class: 'quiz-explain', text: item.explanation }));
    }

    container.append(block);
  });

  // Score + retry, shown once every question is answered.
  if (isComplete(state)) {
    container.append(
      el('div', {
        class: 'quiz-score show',
        text: `${strings.scorePrefix} ${state.correctCount}/${quiz.length} ${strings.scoreSuffix}`,
      })
    );
    const retry = el('button', {
      type: 'button',
      class: 'reset-btn',
      text: strings.tryAgain,
    });
    retry.addEventListener('click', () => {
      // Re-shuffle for a fresh attempt.
      Object.assign(state, newQuizState(quiz));
      renderQuiz({ container, quiz, strings, state, announce });
      const firstOpt = container.querySelector('.opt');
      if (firstOpt) firstOpt.focus();
    });
    container.append(retry);
  }
}
