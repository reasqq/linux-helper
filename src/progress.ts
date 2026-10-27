import { lessonById, lessonsFor, paths } from './content';

export function computeXp(completed: string[]) {
  const ids = new Set(completed.filter(id => lessonById.has(id)));
  const completedCount = ids.size;
  const completedPaths = paths.filter(path => lessonsFor(path.id).every(lesson => ids.has(lesson.id))).length;
  const xp = completedCount * 20 + completedPaths * 100;
  const level = Math.floor(xp / 250) + 1;
  return { completedCount, completedPaths, xp, level };
}
