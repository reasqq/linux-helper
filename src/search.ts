import { lessons, paths, type Lesson } from './content';
import { toolGuides, type ToolGuide } from './tools';
import { methods, type MethodGuide } from './methods';

const aliases: Record<string, string[]> = {
  права: ['chmod', 'rwx', 'permissions', 'доступ'],
  разрешения: ['chmod', 'rwx', 'права'],
  пользователь: ['id', 'uid', 'учётные', 'аккаунт'],
  сеть: ['ip', 'dns', 'tcp', 'маршрут', 'порт'],
  интернет: ['сеть', 'dns', 'http', 'curl'],
  поиск: ['find', 'grep'],
  файлы: ['ls', 'find', 'cat', 'pathlib'],
  процессы: ['ps', 'top', 'kill', 'systemd'],
  сервис: ['systemd', 'systemctl', 'служба', 'порт'],
  ошибки: ['journalctl', 'logging', 'диагностика'],
  логи: ['journalctl', 'grep', 'tail', 'журнал'],
  питон: ['python'],
  скрипт: ['bash', 'python', 'автоматизация'],
  бэкап: ['backup', 'tar', 'rsync'],
  безопастность: ['security', 'пентест', 'права'],
};

export const normalize = (value: string) => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();

function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + Number(a[i - 1] !== b[j - 1]));
      previous = next;
    }
  }
  return row[b.length];
}

function scoreToken(token: string, title: string, tags: string, body: string): number {
  if (title === token) return 80;
  if (title.includes(token)) return 50;
  if (tags.includes(token)) return 35;
  if (body.includes(token)) return 12;
  const words = `${title} ${tags}`.split(/[^\p{L}\p{N}+#-]+/u).filter(Boolean);
  if (token.length >= 3 && words.some(word => word.startsWith(token))) return 25;
  if (token.length >= 4 && words.some(word => distance(token, word) <= (token.length >= 5 ? 2 : 1))) return 14;
  return 0;
}

export function searchLessons(query: string, pathFilter = 'all'): Lesson[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const expanded = tokens.map(token => [token, ...(aliases[token] || [])]);
  return lessons
    .filter(lesson => pathFilter === 'all' || lesson.path === pathFilter)
    .map(lesson => {
      const title = normalize(lesson.title);
      const tags = normalize(lesson.tags.join(' ') + ' ' + lesson.eyebrow + ' ' + (paths.find(path => path.id === lesson.path)?.title || ''));
      const body = normalize(`${lesson.brief} ${lesson.concept} ${lesson.command} ${lesson.commandMeaning} ${lesson.output} ${(lesson.details || []).map(item => `${item.title} ${item.text}`).join(' ')} ${(lesson.sources || []).map(item => item.label).join(' ')}`);
      const scores = expanded.map(group => Math.max(...group.map(token => scoreToken(token, title, tags, body))));
      return { lesson, score: scores.reduce((sum, score) => sum + score, 0), matched: scores.every(score => score > 0) };
    })
    .filter(item => tokens.length === 0 || item.matched)
    .sort((a, b) => b.score - a.score || lessons.indexOf(a.lesson) - lessons.indexOf(b.lesson))
    .map(item => item.lesson);
}

export function searchTools(query: string, category = 'all'): ToolGuide[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const expanded = tokens.map(token => [token, ...(aliases[token] || [])]);
  return toolGuides
    .filter(tool => category === 'all' || tool.category === category)
    .map(tool => {
      const title = normalize(tool.name);
      const tags = normalize(`${tool.category} ${tool.platform} ${tool.id}`);
      const body = normalize(`${tool.purpose} ${tool.when} ${tool.input} ${tool.example} ${tool.reading} ${tool.limit}`);
      const scores = expanded.map(group => Math.max(...group.map(token => scoreToken(token, title, tags, body))));
      return { tool, score: scores.reduce((sum, score) => sum + score, 0), matched: scores.every(score => score > 0) };
    })
    .filter(item => !tokens.length || item.matched)
    .sort((a, b) => b.score - a.score || toolGuides.indexOf(a.tool) - toolGuides.indexOf(b.tool))
    .map(item => item.tool);
}

export function searchMethods(query: string, phase = 'all'): MethodGuide[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const expanded = tokens.map(token => [token, ...(aliases[token] || [])]);
  return methods
    .filter(method => phase === 'all' || method.phase === phase)
    .map(method => {
      const title = normalize(method.title);
      const tags = normalize(`${method.phase} ${method.id}`);
      const body = normalize(`${method.goal} ${method.preparation} ${method.observation} ${method.interpretation} ${method.defense}`);
      const scores = expanded.map(group => Math.max(...group.map(token => scoreToken(token, title, tags, body))));
      return { method, score: scores.reduce((sum, score) => sum + score, 0), matched: scores.every(score => score > 0) };
    })
    .filter(item => !tokens.length || item.matched)
    .sort((a, b) => b.score - a.score || methods.indexOf(a.method) - methods.indexOf(b.method))
    .map(item => item.method);
}
