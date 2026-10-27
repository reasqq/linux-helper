import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { lessons } from './content';
import { exercises, checkExerciseAnswer } from './exercises';
import { ExerciseCard } from './ExerciseCard';
describe('learning exercises', () => {
  it('has 5–10 unique exercises linked to distinct existing lessons', () => {
    expect(exercises.length).toBeGreaterThanOrEqual(5); expect(exercises.length).toBeLessThanOrEqual(10);
    expect(new Set(exercises.map(e => e.id)).size).toBe(exercises.length);
    expect(new Set(exercises.map(e => e.lessonId)).size).toBe(exercises.length);
  });
  for (const exercise of exercises) it(`${exercise.id}: content, answers and rendering`, () => {
    expect(lessons.some(l => l.id === exercise.lessonId), exercise.id).toBe(true);
    for (const key of ['id','goal','title','scenario','explanation'] as const) expect(exercise[key].trim(), `${exercise.id}: ${key}`).not.toBe('');
    exercise.answers.forEach((answer, index) => { expect(answer.trim()).not.toBe(''); expect(checkExerciseAnswer(exercise, index)).toBe(index === exercise.correct); });
    expect(exercise.correct).toBeGreaterThanOrEqual(0); expect(exercise.correct).toBeLessThan(exercise.answers.length);
    [-1, NaN, 0.5, exercise.answers.length].forEach(value => expect(checkExerciseAnswer(exercise, value)).toBe(false));
    const html = renderToStaticMarkup(createElement(ExerciseCard, { exercise }));
    expect(html).toContain('УЧЕБНАЯ СИМУЛЯЦИЯ'); expect(html).toContain('Команды не исполняются');
    expect(html).toContain(exercise.title); expect(html.match(/aria-pressed="false"/g)?.length).toBe(exercise.answers.length);
  });
});
