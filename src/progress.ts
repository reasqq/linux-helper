import { lessonById, lessonsFor, paths } from './content';

export function computeXp(completed: string[]) {
  const ids = new Set(completed.filter(id => lessonById.has(id)));
  const completedCount = ids.size;
  const completedPaths = paths.filter(path => lessonsFor(path.id).every(lesson => ids.has(lesson.id))).length;
  const xp = completedCount * 20 + completedPaths * 100;
  const level = Math.floor(xp / 250) + 1;
  return { completedCount, completedPaths, xp, level };
}

export type Progress = { completed: string[]; saved: string[]; recent: string[] };
export const storageKey = 'linux-helper-progress-v2';
export const legacyKey = 'linux-helper-progress-v1';
export const emptyProgress = (): Progress => ({ completed: [], saved: [], recent: [] });
export type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export function normalizeProgress(value: unknown): Progress {
  const record = isRecord(value) ? value : {};
  const ids = (key: keyof Progress) => [...new Set((Array.isArray(record[key]) ? record[key] : []).filter((id: unknown): id is string => typeof id === 'string' && lessonById.has(id)))];
  return { completed: ids('completed'), saved: ids('saved'), recent: ids('recent').slice(0, 8) };
}
export function exportProgress(progress: Progress): string {
  return JSON.stringify({ app: 'linux-helper', version: 2, progress: normalizeProgress(progress) }, null, 2);
}
export function importProgress(json: string): Progress {
  const data: unknown = JSON.parse(json);
  if (!isRecord(data) || data.app !== 'linux-helper' || data.version !== 2 || !isRecord(data.progress)) throw new Error('Неверный формат или версия файла прогресса.');
  for (const key of ['completed', 'saved', 'recent']) {
    const field = data.progress[key];
    if (!Array.isArray(field) || !field.every(id => typeof id === 'string')) throw new Error(`Некорректное поле прогресса: ${key}.`);
  }
  return normalizeProgress(data.progress);
}
export function saveProgress(progress: Progress, storage?: StorageAccess): string {
  try { (storage ?? window.localStorage).setItem(storageKey, exportProgress(progress)); return ''; }
  catch { return 'Не удалось сохранить прогресс. Он доступен в этой сессии; экспортируйте резервную копию.'; }
}
export function loadProgress(getStorage: () => StorageAccess = () => window.localStorage): { progress: Progress; warning: string } {
  try {
    const storage = getStorage();
    const current = storage.getItem(storageKey);
    if (current !== null) {
      const data: unknown = JSON.parse(current);
      if (!isRecord(data) || data.version !== 2 || data.app !== 'linux-helper' || !isRecord(data.progress)) throw new Error('schema');
      return { progress: normalizeProgress(data.progress), warning: '' };
    }
    const legacy = storage.getItem(legacyKey);
    if (legacy === null) return { progress: emptyProgress(), warning: '' };
    const data: unknown = JSON.parse(legacy);
    if (!isRecord(data)) throw new Error('legacy');
    const progress = normalizeProgress(data);
    return { progress, warning: saveProgress(progress, storage) };
  } catch {
    return { progress: emptyProgress(), warning: 'Не удалось прочитать прогресс. Исходная запись сохранена; изменения доступны в этой сессии.' };
  }
}
