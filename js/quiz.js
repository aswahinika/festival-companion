// Quiz behavior, kept separate from general app orchestration.
//
// Split into:
//   * pure state helpers (newQuizState / recordAnswer / isComplete / scoreOf) —
//     no DOM, unit-tested directly.
//   * renderQuiz() — builds accessible DOM and wires interaction.

import { el, clear } from './utils.js';

// ---------------------------------------------------------------------------
// Pure state
// ---------------------------------------------------------------------------

export function newQuizState(length) {
  return {
    answered: new Array(length).fill(false),
    selected: new Array(length).fill(-1),
    correctCount: 0,
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
 * @param {Array}  opts.quiz       - array of {question, options, answer, explanation}
 * @param {Object} opts.strings    - UI strings for the active language
 * @param {Object} opts.state      - quiz state (mutated in place)
 * @param {(msg:string)=>void} opts.announce - screen-reader announcer
 */
export function renderQuiz({ container, quiz, strings, state, announce }) {
  clear(container);

  quiz.forEach((item, i) => {
    const block = el('div', { class: 'quiz-q' });

    block.append(
      el('p', {
        class: 'qtext',
        text: `${i + 1}. ${item.question}`,
        id: `q-${i}-label`,
      })
    );

    // Radio-style group semantics for assistive tech.
    const opts = el('div', {
      class: 'opts',
      role: 'group',
      'aria-labelledby': `q-${i}-label`,
    });

    item.options.forEach((optText, j) => {
      const button = el('button', {
        type: 'button',
        class: 'opt',
        text: optText,
      });

      if (state.answered[i]) {
        button.disabled = true;
        if (j === item.answer) {
          button.classList.add('correct');
          // Non-color cue: symbol + visually-hidden label.
          button.prepend(
            el('span', { class: 'opt-mark', 'aria-hidden': 'true', text: '✓ ' })
          );
          button.append(
            el('span', { class: 'sr-only', text: ` — ${strings.correctTag}` })
          );
        } else if (state.selected[i] === j) {
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
            i,
            j,
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

    // Explanation / correct-answer reveal after answering (when provided).
    if (state.answered[i] && item.explanation) {
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
      const fresh = newQuizState(quiz.length);
      Object.assign(state, fresh);
      renderQuiz({ container, quiz, strings, state, announce });
      // Move focus to the first question so keyboard users aren't stranded.
      const firstOpt = container.querySelector('.opt');
      if (firstOpt) firstOpt.focus();
    });
    container.append(retry);
  }
}
