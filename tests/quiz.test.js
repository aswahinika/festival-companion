import { describe, it, expect, vi } from 'vitest';
import {
  newQuizState,
  recordAnswer,
  isComplete,
  scoreOf,
  renderQuiz,
} from '../js/quiz.js';
import { UI_STRINGS } from '../js/i18n.js';

const strings = UI_STRINGS.en;

const sampleQuiz = [
  {
    question: 'Q1',
    options: ['a', 'b', 'c'],
    answer: 1,
    explanation: 'because b',
  },
  { question: 'Q2', options: ['x', 'y'], answer: 0, explanation: null },
];

describe('quiz scoring (pure logic)', () => {
  it('starts empty', () => {
    const s = newQuizState(2);
    expect(s.answered).toEqual([false, false]);
    expect(scoreOf(s)).toBe(0);
    expect(isComplete(s)).toBe(false);
  });

  it('scores a correct answer once', () => {
    const s = newQuizState(2);
    const r = recordAnswer(s, 0, 1, 1);
    expect(r).toEqual({ changed: true, wasCorrect: true });
    expect(scoreOf(s)).toBe(1);
  });

  it('does not double-score the same question', () => {
    const s = newQuizState(2);
    recordAnswer(s, 0, 1, 1); // correct
    const again = recordAnswer(s, 0, 0, 1); // try to answer again
    expect(again.changed).toBe(false);
    expect(scoreOf(s)).toBe(1);
  });

  it('does not score a wrong answer', () => {
    const s = newQuizState(2);
    recordAnswer(s, 0, 0, 1);
    expect(scoreOf(s)).toBe(0);
    expect(s.selected[0]).toBe(0);
  });

  it('reports completion when all answered', () => {
    const s = newQuizState(2);
    recordAnswer(s, 0, 1, 1);
    recordAnswer(s, 1, 0, 0);
    expect(isComplete(s)).toBe(true);
    expect(scoreOf(s)).toBe(2);
  });
});

describe('quiz rendering (jsdom)', () => {
  function setup() {
    const container = document.createElement('div');
    const state = newQuizState(sampleQuiz.length);
    const announce = vi.fn();
    renderQuiz({ container, quiz: sampleQuiz, strings, state, announce });
    return { container, state, announce };
  }

  it('renders one button per option and is keyboard-focusable', () => {
    const { container } = setup();
    const buttons = container.querySelectorAll('.opt');
    expect(buttons.length).toBe(5); // 3 + 2
    buttons.forEach((b) => expect(b.tagName).toBe('BUTTON'));
  });

  it('marks correct/incorrect with a symbol and text, not color alone', () => {
    const { container, announce } = setup();
    const firstQuestionOptions = container
      .querySelectorAll('.opts')[0]
      .querySelectorAll('.opt');
    firstQuestionOptions[0].click(); // wrong (answer is index 1)

    const opts = container
      .querySelectorAll('.opts')[0]
      .querySelectorAll('.opt');
    const chosen = opts[0];
    const correct = opts[1];
    expect(chosen.classList.contains('wrong')).toBe(true);
    expect(chosen.querySelector('.opt-mark').textContent).toContain('✗');
    expect(chosen.querySelector('.sr-only').textContent).toContain(
      strings.yourAnswerTag
    );
    expect(correct.classList.contains('correct')).toBe(true);
    expect(correct.querySelector('.opt-mark').textContent).toContain('✓');
    expect(announce).toHaveBeenCalledWith(
      expect.stringContaining(strings.wrong)
    );
  });

  it('shows score and retry after all answered, and reset clears state', () => {
    const { container, state } = setup();
    // answer both correctly
    container.querySelectorAll('.opts')[0].querySelectorAll('.opt')[1].click();
    container.querySelectorAll('.opts')[1].querySelectorAll('.opt')[0].click();

    const score = container.querySelector('.quiz-score');
    expect(score.textContent).toContain('2/2');
    const retry = container.querySelector('.reset-btn');
    expect(retry).toBeTruthy();

    retry.click();
    expect(state.answered).toEqual([false, false]);
    expect(container.querySelector('.quiz-score')).toBeFalsy();
  });
});
