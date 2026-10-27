import { useRef, useState } from 'react';
import { exportProgress, importProgress, type Progress } from './progress';

export function ProgressTransfer({ progress, onImport }: { progress: Progress; onImport: (value: Progress) => void }) {
  const [pending, setPending] = useState<Progress | null>(null);
  const [message, setMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  function download() {
    const url = URL.createObjectURL(new Blob([exportProgress(progress)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'linux-helper-progress.json'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="about-note"><h2>Резервная копия прогресса</h2><p>JSON содержит изученные уроки, избранное и последние уроки. Файл остаётся на вашем устройстве.</p>
    <div className="transfer-actions"><button className="primary-button" onClick={download}>Экспорт прогресса</button><button className="ghost-button" onClick={() => input.current?.click()}>Импорт прогресса</button></div>
    <input ref={input} type="file" accept=".json,application/json" aria-label="Файл прогресса" hidden onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; setPending(null); setMessage('');
      if (!file) return;
      try {
        if (file.size > 1_000_000) throw new Error('Файл слишком большой (максимум 1 МБ).');
        setPending(importProgress(await file.text()));
      } catch { setMessage('Файл повреждён или имеет неподдерживаемый формат. Прогресс не изменён.'); }
    }} />
    {pending && <div className="takeaway" role="group" aria-label="Подтверждение импорта"><div><p>Заменить текущий прогресс? В файле: {pending.completed.length} изученных, {pending.saved.length} избранных. Неизвестные уроки пропущены.</p><div className="transfer-actions"><button className="primary-button" onClick={() => { onImport(pending); setPending(null); setMessage('Прогресс импортирован в текущую сессию.'); }}>Заменить прогресс</button><button className="ghost-button" onClick={() => setPending(null)}>Отмена</button></div></div></div>}
    {message && <p role="status">{message}</p>}
  </section>;
}
