import { _electron as electron } from 'playwright-core';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const profile = path.resolve(process.env.TEMP || '.', `linux-helper-smoke-1.0.3-${Date.now()}`);
await mkdir(profile, { recursive: true });
const app = await electron.launch({ executablePath: path.resolve('release/win-unpacked/Linux Helper.exe'), args: [`--user-data-dir=${profile}`] });
try {
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('heading', { name: /Linux понятным/ }).waitFor();
  assert.ok(page.url().startsWith('file://'));
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('linux-helper-progress-v1', JSON.stringify({ completed: ['chmod', 'unknown', 3], saved: ['ls'], recent: [] }));
  });
  await page.reload();
  await page.getByText('20 XP', { exact: true }).first().waitFor();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('linux-helper-progress-v2')).progress.completed), ['chmod']);
  const cases = [
    ['chmod', 'Скрипт не запускается', 'chmod u+x backup.sh', 'chmod 777 backup.sh'],
    ['grep', 'Ошибка в журнале', 'Посмотреть соседние записи, время и состояние службы', 'Удалить журнал'],
    ['Письменное разрешение', 'Ссылка на соседний сервис', 'Зафиксировать зависимость и запросить расширение scope до активной проверки', 'Сканировать подрядчика по найденной ссылке'],
    ['TLS: цепочка доверия', 'Сертификат другого имени', 'Проверить адрес, имя и настройку сертификата до передачи секретов', 'Всегда отключать проверку сертификата'],
    ['Стратегия сканирования', 'Версия в баннере', 'Служба ответила; версию и применимость риска нужно подтвердить в scope', 'Сервер уже скомпрометирован'],
    ['Укрепление Linux-сервера', 'Новые правила firewall', 'Разрешение нужного SSH-потока, резервный доступ и план отката', 'Достаточно закрыть все порты'],
  ];
  for (const [query, title, correct, wrong] of cases) {
    console.log(`Exercise: ${title}`);
    await page.keyboard.press('Control+k');
    await page.getByRole('searchbox', { name: 'Поиск уроков' }).fill(query);
    await page.locator('.lesson-card').first().click();
    const exercise = page.locator('.exercise-section');
    await exercise.getByRole('heading', { name: title }).waitFor();
    await exercise.getByRole('button', { name: wrong, exact: false }).click();
    await exercise.getByRole('status').filter({ hasText: 'Неверно.' }).waitFor();
    await exercise.getByRole('button', { name: correct, exact: false }).click();
    await exercise.locator('.answer-feedback.success').waitFor();
  }
  await page.getByRole('button', { name: /О программе/ }).click();
  const upload = async content => page.locator('input[type=file]').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  const before = await page.evaluate(() => localStorage.getItem('linux-helper-progress-v2'));
  await upload('{broken');
  await page.getByRole('status').filter({ hasText: 'Файл повреждён' }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('linux-helper-progress-v2')), before);
  const imported = JSON.stringify({ app: 'linux-helper', version: 2, progress: { completed: ['ls'], saved: [], recent: [] } });
  await upload(imported);
  assert.equal(await page.evaluate(() => localStorage.getItem('linux-helper-progress-v2')), before);
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('linux-helper-progress-v2')), before);
  await upload(imported);
  await page.getByRole('button', { name: 'Заменить прогресс', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('linux-helper-progress-v2')).progress.completed[0] === 'ls');
  const exportedFile = path.join(profile, 'progress.json');
  await app.evaluate(({ session }, file) => {
    globalThis.exportState = 'waiting';
    session.defaultSession.once('will-download', (_event, item) => {
      item.setSavePath(file);
      item.once('done', (_event, state) => { globalThis.exportState = state; });
    });
  }, exportedFile);
  await page.getByRole('button', { name: 'Экспорт прогресса', exact: true }).click();
  for (let attempt = 0; attempt < 100; attempt++) {
    const state = await app.evaluate(() => globalThis.exportState);
    if (state === 'completed') break;
    assert.ok(state === 'waiting', `Export failed: ${state}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(await app.evaluate(() => globalThis.exportState), 'completed');
  assert.deepEqual(JSON.parse(await readFile(exportedFile, 'utf8')).progress.completed, ['ls']);
  const blocked = await page.evaluate(async () => {
    const event = new Promise(resolve => document.addEventListener('securitypolicyviolation', e => resolve(e.violatedDirective), { once: true }));
    try { await fetch('http://localhost:5173'); } catch {}
    return event;
  });
  assert.equal(blocked, 'connect-src');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); }; });
  await upload(imported);
  await page.getByRole('button', { name: 'Заменить прогресс', exact: true }).click();
  await page.locator('.storage-warning').filter({ hasText: 'Не удалось сохранить' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Packaged file:// smoke passed: migration, six exercises, invalid import, cancellation, import, export, CSP enforcement, quota warning; no renderer errors.');
} finally { await app.close(); }
