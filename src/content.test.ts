import { describe, expect, it } from 'vitest';
import { lessons, paths, stages } from './content';
import { toolGuides } from './tools';
import { methods } from './methods';

function records(name: string, rows: { id: string }[]) {
  const seen = new Set<string>();
  for (const row of rows) {
    expect(row.id.trim(), `${name}: empty ID`).not.toBe('');
    expect(seen.has(row.id), `${name}: duplicate ${row.id}`).toBe(false);
    seen.add(row.id);
  }
}
function text(id: string, fields: Record<string, unknown>) {
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string') expect(value.trim(), `${id}: empty ${key}`).not.toBe('');
    if (Array.isArray(value)) value.forEach((entry, i) => {
      if (typeof entry === 'string') expect(entry.trim(), `${id}: empty ${key}[${i}]`).not.toBe('');
    });
  }
}
describe('content integrity (record IDs in failures)', () => {
  it('validates IDs and required text throughout all catalogs', () => {
    records('paths', paths); records('lessons', lessons); records('tools', toolGuides); records('methods', methods);
    [...paths, ...lessons, ...toolGuides, ...methods].forEach(row => text(row.id, row));
  });
  for (const lesson of lessons) it(`lesson ${lesson.id}: path, quiz, details and sources`, () => {
    expect(paths.some(path => path.id === lesson.path), `${lesson.id}: missing path ${lesson.path}`).toBe(true);
    expect(lesson.answers.length, lesson.id).toBeGreaterThan(1);
    expect(Number.isInteger(lesson.correct) && lesson.correct >= 0 && lesson.correct < lesson.answers.length, `${lesson.id}: invalid correct answer`).toBe(true);
    expect(lesson.flow.length, lesson.id).toBe(3);
    lesson.details?.forEach(detail => text(lesson.id, detail));
    if (lesson.visual) { text(lesson.id, lesson.visual); lesson.visual.items.forEach(item => text(lesson.id, item)); }
    lesson.sources?.forEach(source => {
      text(lesson.id, source);
      expect(() => new URL(source.url), `${lesson.id}: malformed source ${source.url}`).not.toThrow();
      expect(['http:', 'https:'], `${lesson.id}: unsafe source`).toContain(new URL(source.url).protocol);
    });
  });
  for (const tool of toolGuides) it(`tool ${tool.id}: lesson link`, () => {
    expect(lessons.some(lesson => lesson.id === tool.lessonId), `${tool.id}: missing lesson ${tool.lessonId}`).toBe(true);
  });
  for (const method of methods) it(`method ${method.id}: lesson and tool links`, () => {
    expect(lessons.some(lesson => lesson.id === method.lessonId), method.id).toBe(true);
    method.toolIds.forEach(id => expect(toolGuides.some(tool => tool.id === id), `${method.id}: missing tool ${id}`).toBe(true));
  });
  it('keeps every path in the roadmap exactly once', () => {
    expect(stages.flatMap(stage => stage.ids)).toEqual(paths.map(path => path.id));
    stages.forEach(stage => text(stage.title, stage));
  });
});
