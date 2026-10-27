import { _electron as electron } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const executablePath = path.resolve('release/win-unpacked/Linux Helper.exe');
const app = await electron.launch({ executablePath });
try {
  const page = await app.firstWindow();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('heading', { name: /Linux понятным/ }).waitFor();
  await page.evaluate(() => ['linux-helper-progress-v1', 'linux-helper-progress-v2'].forEach(key => localStorage.removeItem(key)));
  await page.reload();
  await mkdir('docs', { recursive: true });
  await page.screenshot({ path: 'docs/screenshot.png', fullPage: true });

  await page.getByRole('button', { name: 'План обучения' }).click();
  if (await page.locator('.roadmap-stage').count() !== 5) throw new Error('roadmap must have five stages');
  await page.screenshot({ path: 'docs/roadmap.png', fullPage: true });
  await page.getByRole('button', { name: /Инструменты 42/ }).click();
  if (await page.locator('.tool-card').count() !== 42) throw new Error('tool catalog must have 42 entries');
  await page.screenshot({ path: 'docs/tools.png', fullPage: true });
  await page.getByRole('searchbox', { name: 'Поиск инструментов' }).fill('Wireshark');
  await page.getByRole('button', { name: /Wireshark/ }).last().click();
  await page.getByRole('heading', { name: 'Wireshark' }).waitFor();
  await page.getByRole('button', { name: /Методы 21/ }).click();
  if (await page.locator('.method-card').count() !== 21) throw new Error('method atlas must have 21 entries');
  await page.screenshot({ path: 'docs/methods.png', fullPage: true });
  await page.getByRole('searchbox', { name: 'Поиск методов' }).fill('фаззинг');
  await page.getByRole('button', { name: /Фаззинг формата/ }).click();
  await page.getByRole('heading', { name: 'Фаззинг формата' }).waitFor();

  await page.getByRole('button', { name: /Права и пользователи/ }).first().click();
  await page.getByRole('button', { name: /chmod: права без магии/ }).click();
  await page.getByRole('heading', { name: 'chmod: права без магии' }).waitFor();
  await page.getByRole('button', { name: 'Остальные: r · читать' }).click();
  if (!(await page.getByText('chmod 754 script.sh').count())) throw new Error('chmod trainer did not update');
  await page.screenshot({ path: 'docs/chmod.png', fullPage: true });
  await page.getByRole('button', { name: 'Отметить как изученное' }).click();
  if (!(await page.getByText('20 XP').count())) throw new Error('lesson XP not awarded');
  await page.reload();
  if (!(await page.getByText('20 XP').count())) throw new Error('XP did not persist');

  await page.getByRole('button', { name: /Право и стандарты/ }).first().click();
  await page.getByRole('button', { name: /Письменное разрешение и scope/ }).click();
  if (!(await page.locator('.source-links a').count())) throw new Error('legal sources missing');

  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox', { name: 'Поиск уроков' }).fill('chmdo');
  await page.getByRole('button', { name: /chmod: права без магии/ }).waitFor();
  await page.evaluate(() => ['linux-helper-progress-v1', 'linux-helper-progress-v2'].forEach(key => localStorage.removeItem(key)));
  console.log('Packaged Electron smoke test passed');
} finally {
  await app.close();
}
