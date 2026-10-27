import { ArrowDown, ArrowRight, Layers3 } from 'lucide-react';
import type { StudyVisual } from './content';

export function LessonVisual({ visual }: { visual: StudyVisual }) {
  return <div className={`deep-visual visual-${visual.kind}`}>
    <div className="deep-visual-heading"><Layers3 size={17} /><strong>{visual.title}</strong><span>{visual.kind === 'layers' ? 'УРОВНИ' : visual.kind === 'compare' ? 'СРАВНЕНИЕ' : 'ПОСЛЕДОВАТЕЛЬНОСТЬ'}</span></div>
    <div className="deep-visual-items">{visual.items.map((item, index) => <div className="deep-visual-row" key={`${item.label}-${index}`}><div className="deep-visual-step"><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.label}</strong><p>{item.detail}</p></div>{index < visual.items.length - 1 && (visual.kind === 'layers' ? <ArrowDown size={18} /> : <ArrowRight size={18} />)}</div>)}</div>
  </div>;
}
