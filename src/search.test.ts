import { describe, expect, it } from 'vitest';
import { searchLessons, searchTools, searchMethods } from './search';
import { lessons, paths, stages } from './content';
import { toolGuides } from './tools';
import { methods } from './methods';
import { computeXp } from './progress';

describe('searchLessons', () => {
  it('finds commands, Russian concepts and aliases', () => {
    expect(searchLessons('chmod')[0].id).toBe('chmod');
    expect(searchLessons('разрешения').some(item => item.id === 'chmod')).toBe(true);
    expect(searchLessons('питон').some(item => item.path === 'python')).toBe(true);
  });
  it('tolerates a typo and respects a path filter', () => {
    expect(searchLessons('chmdo').some(item => item.id === 'chmod')).toBe(true);
    expect(searchLessons('', 'network').every(item => item.path === 'network')).toBe(true);
  });
  it('keeps all lessons connected to a path with unique IDs and valid quiz answers', () => {
    expect(lessons.length).toBe(100);
    expect(new Set(lessons.map(item => item.id)).size).toBe(lessons.length);
    expect(lessons.every(item => paths.some(path => path.id === item.path) && item.flow.length === 3 && item.answers.length === 3 && item.correct >= 0 && item.correct < 3)).toBe(true);
    expect(stages.flatMap(stage => stage.ids)).toEqual(paths.map(path => path.id));
  });
  it('searches the tool catalog by name and task', () => {
    expect(toolGuides.length).toBe(42);
    expect(searchTools('Wireshark')[0].id).toBe('wireshark');
    expect(searchTools('журнал').some(tool => tool.id === 'journalctl')).toBe(true);
  });
  it('connects methods to real lessons and tool guides', () => {
    expect(methods.length).toBe(21);
    expect(methods.every(method => lessons.some(lesson => lesson.id === method.lessonId) && method.toolIds.every(id => toolGuides.some(tool => tool.id === id)))).toBe(true);
    expect(searchMethods('фаззинг')[0].id).toBe('fuzz');
  });
  it('awards each lesson once and a path completion bonus', () => {
    const firstPathIds = lessons.filter(lesson => lesson.path === paths[0].id).map(lesson => lesson.id);
    expect(computeXp([...firstPathIds, firstPathIds[0]]).xp).toBe(firstPathIds.length * 20 + 100);
    expect(computeXp([firstPathIds[0]]).xp).toBe(20);
  });
});
