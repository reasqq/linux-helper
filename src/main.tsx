import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, Code2, Command, Compass, Copy, FileCode2, FolderOpen, GraduationCap, Layers3, LayoutGrid, Menu, Network, Play, Search, Server, ShieldCheck, Sparkles, Target, Terminal, Trophy, Wrench, X } from 'lucide-react';
import { lessonById, lessons, lessonsFor, paths, stages, type Lesson, type Path } from './content';
import { searchLessons, searchTools, searchMethods } from './search';
import { toolGuides } from './tools';
import { methods } from './methods';
import { LessonVisual } from './LessonVisual';
import { ToolPage, ToolsPage } from './ToolCatalog';
import { MethodPage, MethodsPage } from './MethodAtlas';
import { computeXp } from './progress';
import './style.css';

type Page = { type: 'home' | 'paths' | 'search' | 'saved' | 'path' | 'lesson' | 'tools' | 'tool' | 'methods' | 'method' | 'about'; id?: string };
type Progress = { completed: string[]; saved: string[]; recent: string[] };

const storageKey = 'linux-helper-progress-v1';
function readProgress(): Progress {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return { completed: Array.isArray(parsed.completed) ? parsed.completed : [], saved: Array.isArray(parsed.saved) ? parsed.saved : [], recent: Array.isArray(parsed.recent) ? parsed.recent : [] };
  } catch { return { completed: [], saved: [], recent: [] }; }
}

function PathIcon({ name, size = 22 }: { name: string; size?: number }) {
  const props = { size, strokeWidth: 1.9 };
  switch (name) {
    case 'terminal': return <Terminal {...props} />;
    case 'shield': return <ShieldCheck {...props} />;
    case 'code': return <Code2 {...props} />;
    case 'network': return <Network {...props} />;
    case 'server': return <Server {...props} />;
    case 'python': return <FileCode2 {...props} />;
    case 'target': return <Target {...props} />;
    default: return <Compass {...props} />;
  }
}

function App() {
  const [page, setPage] = useState<Page>({ type: 'home' });
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [search, setSearch] = useState('');
  const [searchPath, setSearchPath] = useState('all');
  const [toolQuery, setToolQuery] = useState('');
  const [toolFilter, setToolFilter] = useState('all');
  const [methodQuery, setMethodQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [xpToast, setXpToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(progress)); }, [progress]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        navigate({ type: 'search' });
        setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (event.key === 'Escape' && page.type === 'search') navigate({ type: 'home' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page.type]);

  function navigate(next: Page) {
    setPage(next);
    setSidebarOpen(false);
    setAnswer(null);
    setCopied(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    if (next.type === 'lesson' && next.id) {
      setProgress(previous => ({ ...previous, recent: [next.id!, ...previous.recent.filter(id => id !== next.id)].slice(0, 8) }));
    }
  }

  function toggleList(key: 'completed' | 'saved', id: string) {
    setProgress(previous => ({ ...previous, [key]: previous[key].includes(id) ? previous[key].filter(item => item !== id) : [...previous[key], id] }));
  }

  function toggleCompleted(id: string) {
    const wasComplete = progress.completed.includes(id);
    const item = lessonById.get(id);
    const pathItems = item ? lessonsFor(item.path) : [];
    const pathBonus = !wasComplete && pathItems.every(lesson => lesson.id === id || progress.completed.includes(lesson.id));
    setProgress(previous => ({ ...previous, completed: wasComplete ? previous.completed.filter(value => value !== id) : [...previous.completed, id] }));
    if (!wasComplete) {
      setXpToast(pathBonus ? '+20 XP за урок · +100 XP за путь!' : '+20 XP за урок!');
      window.setTimeout(() => setXpToast(''), 3200);
    }
  }

  const { completedCount, xp, level } = computeXp(progress.completed);
  const activeLesson = page.type === 'lesson' ? lessonById.get(page.id || '') : undefined;
  const activePath = page.type === 'path' ? paths.find(path => path.id === page.id) : undefined;
  const searchResults = useMemo(() => searchLessons(search, searchPath), [search, searchPath]);
  const toolResults = useMemo(() => search.trim() ? searchTools(search).filter(tool => searchPath === 'all' || lessonById.get(tool.lessonId)?.path === searchPath) : [], [search, searchPath]);
  const methodResults = useMemo(() => search.trim() ? searchMethods(search).filter(method => searchPath === 'all' || lessonById.get(method.lessonId)?.path === searchPath) : [], [search, searchPath]);
  const orderedLessons = paths.flatMap(path => lessonsFor(path.id));
  const nextLesson = orderedLessons.find(item => !progress.completed.includes(item.id)) || orderedLessons[0];

  async function copyCommand(command: string) {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function LessonCard({ lesson, index }: { lesson: Lesson; index?: number }) {
    const path = paths.find(item => item.id === lesson.path)!;
    const done = progress.completed.includes(lesson.id);
    return <button className="lesson-card" onClick={() => navigate({ type: 'lesson', id: lesson.id })}>
      <span className={`lesson-card-icon tint-${path.color}`}>{done ? <Check size={18} /> : <PathIcon name={path.icon} size={18} />}</span>
      <span className="lesson-card-content">
        <span className="lesson-card-meta">{index !== undefined ? `УРОК ${String(index + 1).padStart(2, '0')} · ` : ''}{path.title.toUpperCase()} · {lesson.minutes} МИН</span>
        <strong>{lesson.title}</strong>
        <span className="lesson-card-brief">{lesson.brief}</span>
      </span>
      <ChevronRight size={20} className="muted-icon" />
    </button>;
  }

  function PathCard({ path }: { path: Path }) {
    const items = lessonsFor(path.id);
    const count = items.filter(item => progress.completed.includes(item.id)).length;
    return <button className={`path-card path-${path.color}`} onClick={() => navigate({ type: 'path', id: path.id })}>
      <span className="path-card-top"><span className="path-icon"><PathIcon name={path.icon} size={25} /></span><span className="path-level">{path.level}</span></span>
      <span className="path-card-title">{path.title}</span>
      <span className="path-card-subtitle">{path.subtitle}</span>
      <span className="path-card-bottom"><span>{items.length} уроков</span><span>{count}/{items.length} пройдено <ArrowRight size={16} /></span></span>
      <span className="path-progress"><span style={{ width: `${count / items.length * 100}%` }} /></span>
    </button>;
  }

  return <div className="shell">
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <button className="brand" onClick={() => navigate({ type: 'home' })} aria-label="Главная">
        <span className="brand-mark"><Terminal size={23} strokeWidth={2.5} /></span>
        <span><strong>linux<span>helper</span></strong><small>STUDY EDITION</small></span>
      </button>
      <div className="sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav className="nav-main">
        <button className={page.type === 'home' ? 'active' : ''} onClick={() => navigate({ type: 'home' })}><LayoutGrid size={19} /> Обзор</button>
        <button className={page.type === 'paths' || page.type === 'path' ? 'active' : ''} onClick={() => navigate({ type: 'paths' })}><Layers3 size={19} /> План обучения</button>
        <button className={page.type === 'tools' || page.type === 'tool' ? 'active' : ''} onClick={() => navigate({ type: 'tools' })}><Wrench size={19} /> Инструменты <span className="nav-count">{toolGuides.length}</span></button>
        <button className={page.type === 'methods' || page.type === 'method' ? 'active' : ''} onClick={() => navigate({ type: 'methods' })}><Target size={19} /> Методы <span className="nav-count">{methods.length}</span></button>
        <button className={page.type === 'search' ? 'active' : ''} onClick={() => navigate({ type: 'search' })}><Search size={19} /> Поиск <kbd>⌘ K</kbd></button>
        <button className={page.type === 'saved' ? 'active' : ''} onClick={() => navigate({ type: 'saved' })}><Bookmark size={19} /> Избранное <span className="nav-count">{progress.saved.length}</span></button>
      </nav>
      <div className="sidebar-label sidebar-label-paths">УЧЕБНЫЕ ПУТИ</div>
      <nav className="nav-paths">{paths.map(path => <button key={path.id} className={page.id === path.id ? 'selected' : ''} onClick={() => navigate({ type: 'path', id: path.id })}><span className={`nav-dot dot-${path.color}`} />{path.title}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-progress"><div className="progress-head"><GraduationCap size={18} /><span>Мой прогресс</span><strong>{Math.round(completedCount / lessons.length * 100)}%</strong></div><div className="progress-track"><span style={{ width: `${completedCount / lessons.length * 100}%` }} /></div><small>{completedCount} из {lessons.length} уроков · {xp} XP · уровень {level}</small></div><button className="about-link" onClick={() => navigate({ type: 'about' })}><CircleHelp size={17} /> О программе <ArrowRight size={15} /></button></div>
    </aside>

    <main className="main" ref={mainRef}>
      <header className="topbar"><button className="menu-button" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Меню"><Menu size={22} /></button><div className="topbar-crumb"><span>LINUX HELPER</span><ChevronRight size={15} /><strong>{page.type === 'home' ? 'Обзор' : page.type === 'paths' ? 'План обучения' : page.type === 'search' ? 'Поиск' : page.type === 'saved' ? 'Избранное' : page.type === 'tools' ? 'Инструменты' : page.type === 'tool' ? 'Инструмент' : page.type === 'methods' ? 'Методы' : page.type === 'method' ? 'Метод' : page.type === 'about' ? 'О программе' : activeLesson?.title || activePath?.title}</strong></div><button className="topbar-search" onClick={() => navigate({ type: 'search' })}><Search size={18} /><span>Найти команду, тему, понятие...</span><kbd>Ctrl K</kbd></button><div className="xp-badge"><Trophy size={15} /> {xp} XP</div><div className="topbar-avatar">{level}</div></header>

      {page.type === 'home' && <div className="page home-page"><div className="eyebrow"><span className="pulse" /> ТВОЯ ЛАБОРАТОРИЯ ЗНАНИЙ</div><div className="home-hero"><div><div className="hero-kicker"><Sparkles size={15} /> УЧИСЬ ПОНИМАТЬ СИСТЕМУ</div><h1>Linux понятным<br /><em>языком.</em></h1><p>От первой команды до уверенного администрирования и основы пентеста. Теория, наглядные схемы и короткая практика — в одном офлайн приложении.</p><div className="hero-actions"><button className="primary-button" onClick={() => navigate({ type: 'lesson', id: nextLesson.id })}><Play size={17} fill="currentColor" /> {completedCount ? 'Продолжить обучение' : 'Начать обучение'} <ArrowRight size={17} /></button><button className="ghost-button" onClick={() => navigate({ type: 'paths' })}>Смотреть пути <ArrowRight size={17} /></button></div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-terminal"><div className="term-head"><span /><span /><span /><i>~/learning/linux</i></div><div className="term-line"><b>$</b> chmod 750 script.sh</div><div className="term-output">user <em>rwx</em>　group <em>r-x</em>　other <em>---</em></div><div className="term-line"><b>$</b> <span className="cursor" /></div></div><div className="floating-chip chip-top">✦ step by step</div><div className="floating-chip chip-bottom"><CheckCircle2 size={16} /> знания в систему</div></div></div>
        <div className="stats-row"><div><span className="stat-icon stat-purple"><BookOpen size={20} /></span><strong>{lessons.length}</strong><small>подробных уроков</small></div><div><span className="stat-icon stat-orange"><Compass size={20} /></span><strong>{paths.length}</strong><small>путей обучения</small></div><div><span className="stat-icon stat-green"><CheckCircle2 size={20} /></span><strong>{completedCount}</strong><small>уроков изучено</small></div><div><span className="stat-icon stat-blue"><Trophy size={20} /></span><strong>{xp}</strong><small>очков опыта · уровень {level}</small></div></div><button className="roadmap-teaser" onClick={() => navigate({ type: 'paths' })}><span><Layers3 size={19} /><strong>Не знаешь, что изучать дальше?</strong> Есть пошаговый план из пяти этапов — от Linux до практики.</span><span>Открыть план <ArrowRight size={17} /></span></button>
        <div className="section-heading"><div><span className="section-kicker">ТВОЯ КАРТА</span><h2>Выбери направление</h2><p>Двигайся по порядку или начни с нужной темы.</p></div><button className="text-link" onClick={() => navigate({ type: 'paths' })}>Все направления <ArrowRight size={17} /></button></div><div className="path-grid">{paths.slice(0, 4).map(path => <PathCard key={path.id} path={path} />)}</div>
        <div className="section-heading second-heading"><div><span className="section-kicker">СЛЕДУЮЩИЙ ШАГ</span><h2>Продолжить изучение</h2></div></div><div className="continue-grid"><div className="continue-feature"><div className="feature-icon"><Terminal size={24} /></div><div><span className="feature-kicker">РЕКОМЕНДУЕМЫЙ УРОК · {nextLesson.minutes} МИН</span><h3>{nextLesson.title}</h3><p>{nextLesson.brief}</p><button onClick={() => navigate({ type: 'lesson', id: nextLesson.id })}>Открыть урок <ArrowRight size={16} /></button></div></div><div className="tip-card"><div className="tip-icon"><Sparkles size={19} /></div><span>СОВЕТ ДЛЯ ПРАКТИКИ</span><p>Повторяй команды в собственной виртуальной машине. Понимание приходит, когда видишь результат своими глазами.</p></div></div>
      </div>}

      {page.type === 'paths' && <div className="page"><div className="page-intro"><span className="section-kicker">ТВОЯ ПОСЛЕДОВАТЕЛЬНОСТЬ</span><h1>План обучения</h1><p>Двигайся сверху вниз: каждый этап опирается на предыдущий. За каждый урок получаешь 20 XP, за завершённый путь — ещё 100 XP.</p></div><div className="roadmap">{stages.map((stage, index) => <section className="roadmap-stage" key={stage.title}><div className="roadmap-stage-head"><div className="stage-number">{String(index + 1).padStart(2, '0')}</div><div><span className="section-kicker">ЭТАП {index + 1} ИЗ {stages.length}</span><h2>{stage.title.split(' · ')[1]}</h2><p>{stage.subtitle}</p></div><div className="stage-outcome"><CheckCircle2 size={18} /><span>{stage.outcome}</span></div></div><div className="path-grid all-paths">{stage.ids.map(id => <PathCard key={id} path={paths.find(path => path.id === id)!} />)}</div></section>)}</div></div>}

      {page.type === 'path' && activePath && <div className="page"><button className="back-link" onClick={() => navigate({ type: 'paths' })}><ArrowLeft size={17} /> Все пути</button><div className={`path-detail-hero path-${activePath.color}`}><div className="path-detail-icon"><PathIcon name={activePath.icon} size={34} /></div><div><span className="section-kicker">УЧЕБНЫЙ ПУТЬ · {activePath.level.toUpperCase()}</span><h1>{activePath.title}</h1><p>{activePath.subtitle}</p><div className="detail-meta"><span><BookOpen size={16} /> {lessonsFor(activePath.id).length} уроков</span><span><Clock3 size={16} /> ≈ {lessonsFor(activePath.id).reduce((total, lesson) => total + lesson.minutes, 0)} мин</span><span><CheckCircle2 size={16} /> {lessonsFor(activePath.id).filter(lesson => progress.completed.includes(lesson.id)).length} пройдено</span></div></div></div><div className="lesson-list-head"><div><span className="section-kicker">ПРОГРАММА</span><h2>Уроки пути</h2></div><span>Выбирай любой урок</span></div><div className="lesson-list">{lessonsFor(activePath.id).map((lesson, index) => <LessonCard key={lesson.id} lesson={lesson} index={index} />)}</div></div>}

      {page.type === 'tools' && <ToolsPage query={toolQuery} setQuery={setToolQuery} filter={toolFilter} setFilter={setToolFilter} openTool={id => navigate({ type: 'tool', id })} />}
      {page.type === 'tool' && page.id && <ToolPage id={page.id} back={() => navigate({ type: 'tools' })} openLesson={id => navigate({ type: 'lesson', id })} />}

      {page.type === 'methods' && <MethodsPage query={methodQuery} setQuery={setMethodQuery} filter={methodFilter} setFilter={setMethodFilter} openMethod={id => navigate({ type: 'method', id })} />}
      {page.type === 'method' && page.id && <MethodPage id={page.id} back={() => navigate({ type: 'methods' })} openLesson={id => navigate({ type: 'lesson', id })} openTool={id => navigate({ type: 'tool', id })} />}

      {page.type === 'search' && <div className="page search-page"><div className="page-intro"><span className="section-kicker">КОМАНДЫ И ПОНЯТИЯ</span><h1>Поиск по знаниям</h1><p>Найди команду, тему или вопрос. Поиск понимает русский, английские команды и небольшие опечатки.</p></div><div className="search-input-wrap"><Search size={23} /><input ref={searchRef} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Например: chmod, DNS, права, журнал..." aria-label="Поиск уроков" /><kbd>ESC</kbd></div><div className="filter-row"><button className={searchPath === 'all' ? 'active' : ''} onClick={() => setSearchPath('all')}>Все темы</button>{paths.map(path => <button key={path.id} className={searchPath === path.id ? 'active' : ''} onClick={() => setSearchPath(path.id)}>{path.title}</button>)}</div><div className="search-results-head"><span>{search ? `Найдено: ${searchResults.length}` : `Все уроки: ${searchResults.length}`}</span><span>Нажми на карточку, чтобы открыть урок</span></div>{toolResults.length > 0 && <div className="global-tool-results"><div className="search-results-head"><span>Инструменты: {toolResults.length}</span><button onClick={() => { setToolQuery(search); navigate({ type: 'tools' }); }}>Все инструменты <ArrowRight size={15} /></button></div><div className="global-tool-grid">{toolResults.slice(0, 6).map(tool => <button key={tool.id} onClick={() => navigate({ type: 'tool', id: tool.id })}><Wrench size={17} /><strong>{tool.name}</strong><span>{tool.purpose}</span><ChevronRight size={16} /></button>)}</div></div>}{methodResults.length > 0 && <div className="global-tool-results"><div className="search-results-head"><span>Методы: {methodResults.length}</span><button onClick={() => { setMethodQuery(search); navigate({ type: 'methods' }); }}>Все методы <ArrowRight size={15} /></button></div><div className="global-tool-grid">{methodResults.slice(0, 4).map(method => <button key={method.id} onClick={() => navigate({ type: 'method', id: method.id })}><Target size={17} /><strong>{method.title}</strong><span>{method.goal}</span><ChevronRight size={16} /></button>)}</div></div>}<div className="lesson-list">{searchResults.length ? searchResults.map(lesson => <LessonCard key={lesson.id} lesson={lesson} />) : toolResults.length === 0 && methodResults.length === 0 && <div className="empty-state"><Search size={34} /><h3>Ничего не найдено</h3><p>Попробуй другое слово или выбери «Все темы».</p></div>}</div></div>}

      {page.type === 'saved' && <div className="page"><div className="page-intro"><span className="section-kicker">ТВОЯ БИБЛИОТЕКА</span><h1>Избранное</h1><p>Сохраняй уроки, к которым хочешь возвращаться.</p></div><div className="lesson-list">{progress.saved.map(id => lessonById.get(id)).filter((lesson): lesson is Lesson => Boolean(lesson)).map(lesson => <LessonCard key={lesson.id} lesson={lesson} />)}{progress.saved.length === 0 && <div className="empty-state"><Bookmark size={36} /><h3>Здесь пока пусто</h3><p>Нажми значок закладки в любом уроке, чтобы сохранить его.</p><button className="primary-button" onClick={() => navigate({ type: 'paths' })}>Открыть пути <ArrowRight size={17} /></button></div>}</div></div>}

      {page.type === 'lesson' && activeLesson && <div className="page lesson-page"><button className="back-link" onClick={() => navigate({ type: 'path', id: activeLesson.path })}><ArrowLeft size={17} /> {paths.find(path => path.id === activeLesson.path)?.title}</button><div className="lesson-layout"><article className="lesson-body"><div className="lesson-heading"><div className="lesson-eyebrow"><span className="eyebrow-line" /> {activeLesson.eyebrow.toUpperCase()} · {activeLesson.minutes} МИН</div><h1>{activeLesson.title}</h1><p>{activeLesson.brief}</p><div className="lesson-actions"><button className={progress.saved.includes(activeLesson.id) ? 'active' : ''} onClick={() => toggleList('saved', activeLesson.id)}><Bookmark size={17} fill={progress.saved.includes(activeLesson.id) ? 'currentColor' : 'none'} /> {progress.saved.includes(activeLesson.id) ? 'В избранном' : 'Сохранить'}</button><span><Clock3 size={16} /> {activeLesson.minutes} минут</span></div></div>
            <section className="study-section"><div className="section-number">01 / ТЕОРИЯ</div><h2>Разбираемся в сути</h2><p className="concept-text">{activeLesson.concept}</p>{activeLesson.details && <div className="theory-grid">{activeLesson.details.map((detail, index) => <div className="theory-card" key={detail.title}><span>0{index + 1}</span><strong>{detail.title}</strong><p>{detail.text}</p></div>)}</div>}<div className="takeaway"><Sparkles size={20} /><span><strong>Главная мысль</strong>{activeLesson.brief}</span></div></section>
            <section className="study-section"><div className="section-number">02 / СХЕМА</div><h2>Как это работает</h2><div className="flow-diagram">{activeLesson.flow.map((step, index) => <React.Fragment key={index}><div className="flow-node"><span>0{index + 1}</span><strong>{step}</strong></div>{index < 2 && <ArrowRight className="flow-arrow" size={22} />}</React.Fragment>)}</div><p className="flow-caption">Читай схему слева направо: от исходных данных к результату.</p>{activeLesson.visual && <LessonVisual visual={activeLesson.visual} />}</section>
            {activeLesson.id === 'chmod' && <ChmodLab />}
            <section className="study-section"><div className="section-number">03 / ПРИМЕР</div><h2>{activeLesson.path === 'legal' ? 'Пример решения' : 'Попробуй команду'}</h2><div className="terminal-block"><div className="terminal-toolbar"><span><i /><i /><i /></span><strong>{activeLesson.path === 'legal' ? 'СХЕМА' : 'TERMINAL'}</strong><button onClick={() => copyCommand(activeLesson.command)}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Скопировано' : 'Копировать'}</button></div><pre>{activeLesson.path !== 'legal' && <span className="terminal-dollar">$ </span>}{activeLesson.command}</pre></div><div className="command-explain"><Command size={19} /><p>{activeLesson.commandMeaning}</p></div><div className="expected-output"><span>ОЖИДАЕМЫЙ РЕЗУЛЬТАТ</span><pre>{activeLesson.output}</pre></div>{activeLesson.caution && <div className="caution-box"><ShieldCheck size={20} /><p>{activeLesson.caution}</p></div>}{activeLesson.sources && <div className="source-links"><span>ПРОВЕРЕННЫЕ ИСТОЧНИКИ · 27.10.2026</span>{activeLesson.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} <ArrowRight size={14} /></a>)}</div>}</section>
            <section className="study-section quiz-section"><div className="section-number">04 / ПРОВЕРКА</div><h2>Проверь себя</h2><p>{activeLesson.question}</p><div className="answers">{activeLesson.answers.map((option, index) => <button key={index} className={answer === index ? (index === activeLesson.correct ? 'correct' : 'incorrect') : ''} onClick={() => setAnswer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}{answer === index && (index === activeLesson.correct ? <Check size={17} /> : <X size={17} />)}</button>)}</div>{answer !== null && <div className={`answer-feedback ${answer === activeLesson.correct ? 'success' : ''}`}>{answer === activeLesson.correct ? 'Верно! Можно двигаться дальше.' : 'Почти. Перечитай объяснение и попробуй ещё раз.'}</div>}</section>
            <div className="lesson-finish"><div><strong>Урок пройден?</strong><p>Прогресс сохранится на этом устройстве. +20 XP за урок; +100 XP за завершённый путь.</p></div><button className={progress.completed.includes(activeLesson.id) ? 'completed-button' : 'primary-button'} onClick={() => toggleCompleted(activeLesson.id)}><CheckCircle2 size={18} /> {progress.completed.includes(activeLesson.id) ? 'Изучено' : 'Отметить как изученное'}</button></div>
          </article><aside className="lesson-rail"><div className="rail-card"><span>В ЭТОМ УРОКЕ</span><a href="#" onClick={event => { event.preventDefault(); document.querySelectorAll('.study-section')[0]?.scrollIntoView({ behavior: 'smooth' }); }}>01　Теория</a><a href="#" onClick={event => { event.preventDefault(); document.querySelectorAll('.study-section')[1]?.scrollIntoView({ behavior: 'smooth' }); }}>02　Схема</a><a href="#" onClick={event => { event.preventDefault(); document.querySelector('.terminal-block')?.scrollIntoView({ behavior: 'smooth' }); }}>03　Практика</a><a href="#" onClick={event => { event.preventDefault(); document.querySelector('.quiz-section')?.scrollIntoView({ behavior: 'smooth' }); }}>04　Проверка</a></div><div className="rail-note"><Sparkles size={20} /><strong>Учись на практике</strong><p>Команды в уроках — примеры для собственной лаборатории. Перед запуском проверь путь и цель.</p></div><div className="rail-tags"><span>ТЕГИ</span><div>{activeLesson.tags.map(tag => <button key={tag} onClick={() => { setSearch(tag); navigate({ type: 'search' }); }}>{tag}</button>)}</div></div></aside></div></div>}

      {page.type === 'about' && <div className="page about-page"><div className="page-intro"><span className="section-kicker">LINUX HELPER · 1.0.1</span><h1>Учись понимать, а не запоминать</h1><p>Офлайн настольное приложение для системного изучения Linux на русском языке.</p></div><div className="about-grid"><div><BookOpen size={28} /><h3>Материал по шагам</h3><p>{lessons.length} уроков, схемы, примеры команд и вопросы для самопроверки.</p></div><div><ShieldCheck size={28} /><h3>Практика в своём контуре</h3><p>Путь по администрированию и безопасности с акцентом на разрешённую лабораторную работу.</p></div><div><FolderOpen size={28} /><h3>Данные остаются у тебя</h3><p>Прогресс и закладки хранятся локально на этом устройстве. Интернет для обучения не нужен.</p></div></div><div className="about-note"><h2>Платформы</h2><p>Windows 10 и Linux. В Kali Linux используется пакет AppImage или deb. Для запуска AppImage может понадобиться сделать файл исполняемым: <code>chmod +x Linux-Helper-*.AppImage</code>.</p><a href="https://github.com/reasqq/linux-helper" target="_blank" rel="noreferrer">Исходный код и релизы <ArrowRight size={16} /></a></div></div>}
      {xpToast && <div className="xp-toast"><Trophy size={20} /> {xpToast}</div>}
    </main>
  </div>;
}

function ChmodLab() {
  const [bits, setBits] = useState([[true, true, true], [true, false, true], [false, false, false]]);
  const groups = ['Владелец', 'Группа', 'Остальные'];
  const labels = ['r · читать', 'w · писать', 'x · выполнять'];
  const digits = bits.map(row => row.reduce((sum, on, index) => sum + (on ? [4, 2, 1][index] : 0), 0));
  const symbolic = bits.map(row => row.map((on, index) => on ? 'rwx'[index] : '-').join('')).join('');
  return <section className="study-section chmod-section"><div className="section-number">ИНТЕРАКТИВ / CHMOD</div><h2>Собери права сам</h2><p>Нажимай на биты доступа и наблюдай, как меняются запись rwx и команда.</p><div className="chmod-lab"><div className="chmod-grid"><div className="chmod-grid-head"><span>ДЛЯ КОГО</span>{labels.map(label => <span key={label}>{label}</span>)}<span>ЧИСЛО</span></div>{bits.map((row, groupIndex) => <div className="chmod-grid-row" key={groupIndex}><strong>{groups[groupIndex]}</strong>{row.map((on, bitIndex) => <button key={bitIndex} className={on ? 'bit-on' : ''} onClick={() => setBits(previous => previous.map((item, index) => index === groupIndex ? item.map((value, i) => i === bitIndex ? !value : value) : item))} aria-label={`${groups[groupIndex]}: ${labels[bitIndex]}`} aria-pressed={on}>{on ? <Check size={16} /> : <span />}</button>)}<b>{digits[groupIndex]}</b></div>)}</div><div className="chmod-result"><span>ПОЛУЧИЛОСЬ</span><strong>{digits.join('')}</strong><code>-{symbolic}</code><div>chmod {digits.join('')} script.sh</div></div></div><p className="chmod-hint">r = 4　 w = 2　 x = 1 · значения складываются отдельно для каждой группы.</p></section>;
}

createRoot(document.getElementById('root')!).render(<App />);

