import { useState } from 'react';
import { checkExerciseAnswer, type Exercise } from './exercises';
export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [answer, setAnswer] = useState<number | null>(null);
  const correct = answer !== null && checkExerciseAnswer(exercise, answer);
  return <section className="study-section exercise-section"><div className="section-number">УЧЕБНАЯ СИМУЛЯЦИЯ</div><h2>{exercise.title}</h2><p>Цель: {exercise.goal}</p><p>Выбор ответа в учебном сценарии. Команды не исполняются, сетевые проверки не выполняются.</p><div className="expected-output"><pre>{exercise.scenario}</pre></div><div className="answers">{exercise.answers.map((option, index) => <button key={index} aria-pressed={answer === index} className={answer === index ? (correct ? 'correct' : 'incorrect') : ''} onClick={() => setAnswer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{answer !== null && <div role="status" className={`answer-feedback ${correct ? 'success' : ''}`}>{correct ? 'Верно. ' : 'Неверно. Попробуйте ещё раз. '}{exercise.explanation}</div>}</section>;
}
