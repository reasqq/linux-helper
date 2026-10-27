import { lessons } from './content';
import { describe, expect, it } from 'vitest';
import { emptyProgress, exportProgress, importProgress, legacyKey, loadProgress, normalizeProgress, saveProgress, storageKey, type StorageAccess } from './progress';
const progress = { completed: ['chmod'], saved: ['ls'], recent: ['chmod'] };
function memory(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return { data, getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => { data[key] = value; } };
}
describe('progress storage', () => {
  it('migrates v1 without removing the original', () => {
    const storage = memory({ [legacyKey]: JSON.stringify(progress) });
    expect(loadProgress(() => storage)).toEqual({ progress, warning: '' });
    expect(importProgress(storage.data[storageKey])).toEqual(progress);
    expect(storage.data[legacyKey]).toBe(JSON.stringify(progress));
  });
  it('prefers v2 even when v1 exists', () => {
    const storage = memory({ [legacyKey]: JSON.stringify(progress), [storageKey]: exportProgress(emptyProgress()) });
    expect(loadProgress(() => storage).progress).toEqual(emptyProgress());
  });
  it('normalizes types, deduplicates, rejects unknown IDs and limits recent history', () => {
    expect(normalizeProgress({ completed: ['chmod', 'unknown', 2, null, 'chmod'], saved: 'ls', recent: ['ls', 'ls'] })).toEqual({ completed: ['chmod'], saved: [], recent: ['ls'] });
    expect(normalizeProgress(null)).toEqual(emptyProgress());
    expect(normalizeProgress({ recent: lessons.slice(0, 10).map(lesson => lesson.id) }).recent.length).toBe(8);
  });
  it.each(['{', 'null', '[]', '{"version":99}'])('preserves corrupt/unsupported stored data: %s', raw => {
    const storage = memory({ [storageKey]: raw });
    expect(loadProgress(() => storage).warning).not.toBe('');
    expect(storage.data[storageKey]).toBe(raw);
  });
  it('normalizes damaged fields in the supported schema', () => {
    const storage = memory({ [storageKey]: JSON.stringify({ app: 'linux-helper', version: 2, progress: { completed: false, saved: ['ls', {}] } }) });
    expect(loadProgress(() => storage).progress).toEqual({ completed: [], saved: ['ls'], recent: [] });
  });
  it('roundtrips exports/imports and drops unknown IDs', () => {
    expect(importProgress(exportProgress(progress))).toEqual(progress);
    expect(importProgress(JSON.stringify({ app: 'linux-helper', version: 2, progress: { ...progress, completed: ['unknown', 'chmod'] } }))).toEqual(progress);
  });
  it.each(['{', '{}', 'null', '{"app":"linux-helper","version":2,"progress":{"completed":[2],"saved":[],"recent":[]}}'])('rejects invalid imports without writing: %s', raw => {
    expect(() => importProgress(raw)).toThrow();
    expect(progress.completed).toEqual(['chmod']);
  });
  it('handles denied reads, denied storage access and quota errors', () => {
    const denied: StorageAccess = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } };
    expect(loadProgress(() => denied).warning).not.toBe('');
    expect(loadProgress(() => { throw new Error('security'); }).warning).not.toBe('');
    expect(saveProgress(progress, denied)).not.toBe('');
    const migration = memory({ [legacyKey]: JSON.stringify(progress) });
    expect(loadProgress(() => ({ ...migration, setItem: denied.setItem })).progress).toEqual(progress);
    expect(loadProgress(() => ({ ...migration, setItem: denied.setItem })).warning).not.toBe('');
  });
});
