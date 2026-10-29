/* IELTS Teacher — движок плана. Чистые функции, работает в браузере и в Node (тесты). */
(function (root) {
  'use strict';
  const SK = ['L', 'R', 'W', 'S'];
  const PHASES = [
    { id: 'P0', name: 'Диагностика', from: 1, to: 2, goal: 'стартовый профиль' },
    { id: 'P1', name: 'Фундамент', from: 3, to: 18, goal: '~5.5–6.0' },
    { id: 'P2', name: 'Навыки', from: 19, to: 34, goal: '~6.5' },
    { id: 'P3', name: 'Точность 7+', from: 35, to: 48, goal: '~7.0–7.5' },
    { id: 'P4', name: 'Финиш/тест', from: 49, to: 52, goal: 'тест' },
    { id: 'BUF', name: 'Буфер/пересдача', from: 53, to: 78, goal: '7.5–8.0' },
  ];

  const pd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fmt = (d) => d.toISOString().slice(0, 10);
  const addDays = (s, n) => fmt(new Date(pd(s).getTime() + n * 86400000));
  const daysBetween = (a, b) => Math.floor((pd(b) - pd(a)) / 86400000);
  const weekNo = (start, date) => Math.max(1, Math.floor(daysBetween(start, date) / 7) + 1);
  const phaseFor = (w) => PHASES.find((p) => w >= p.from && w <= p.to) || PHASES[PHASES.length - 1];
  const r5 = (n) => Math.max(5, Math.round(n / 5) * 5);

  /** Оценка тяжести ошибок по журналу (последние 30 дней): тег -> 0..1 */
  function errorSeverity(errors, today) {
    const cut = addDays(today, -30);
    const c = {};
    (errors || []).forEach((e) => { if (e.date >= cut) c[e.tag] = (c[e.tag] || 0) + 1; });
    const max = Math.max(1, ...Object.values(c));
    const out = {};
    Object.keys(c).forEach((k) => { out[k] = c[k] / max; });
    return out;
  }

  /** Веса навыков (сумма = 1). Правила из docs/01 §4. */
  function weights(profile, sev) {
    sev = sev || {};
    const tgt = profile.target.overall;
    const gaps = SK.map((s) => Math.max(0, tgt - profile.skills[s]));
    const sum = gaps.reduce((a, b) => a + b, 0);
    let w = gaps.map((g) => (sum === 0 ? 0.25 : 0.10 + 0.60 * g / sum));
    SK.forEach((s, i) => {
      const heavy = Object.keys(sev).filter((t) => t.startsWith(s + '-') && sev[t] > 0.6).length;
      if (heavy >= 2) w[i] += 0.05;
      if (s === 'W' || s === 'S') w[i] += 0.05;
    });
    const tot = w.reduce((a, b) => a + b, 0);
    const res = {};
    SK.forEach((s, i) => { res[s] = w[i] / tot; });
    return res;
  }

  const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

  function resFor(key, content, resources, i) {
    const ids = (content.resourceMap[key] || []).filter((id) => {
      const r = resources.find((x) => x.id === id);
      return r && r.ru_risk !== true && r.status !== 'dead';
    });
    if (!ids.length) return null;
    const r = resources.find((x) => x.id === pick(ids, i));
    return { id: r.id, name: r.name, url: r.url, search: r.search_query || null, status: r.status };
  }

  function weakTag(sev, skill) {
    const t = Object.keys(sev).filter((k) => k.startsWith(skill + '-') && sev[k] > 0.5).sort((a, b) => sev[b] - sev[a]);
    return t[0] || null;
  }

  const L_TAG = {
    'L-SPELL': 'Диктант на орфографию и числа (имена, даты, телефоны)',
    'L-PLURAL': 'Диктант: окончания -s/-ed, единственное/множественное число',
    'L-NUM': 'Диктант на числа, даты, цены',
    'L-DISTR': 'Тренировка «ловушек»: исправления и отрицания по ходу записи',
    'L-MAP': 'Map/plan labelling: направления и предлоги места',
    'L-LIMIT': 'Практика лимита слов: считать слова в ответе',
  };
  const R_TAG = {
    'R-TFNG': 'Только True/False/Not Given: 3 коротких отрывка, обоснуй каждый ответ цитатой',
    'R-MH': 'Matching Headings: сначала главная мысль абзаца, потом заголовок',
    'R-MI': 'Matching Information: поиск по перефразам, не по словам',
    'R-COMP': 'Completion: слова из текста, лимит слов, форма слова',
    'R-MCQ': 'MCQ: исключай неверные варианты с доказательством',
    'R-TIME': 'Тайминг: 20 минут на текст, жёсткий таймер',
  };

  function skillTask(skill, ctx) {
    const { phase, idx, minutes, profile, content, resources, sev } = ctx;
    const p = phase.id;
    const early = p === 'P0' || p === 'P1';
    const mid = p === 'P2';
    const t = { skill, minutes, resource: null };
    const tag = weakTag(sev, skill);
    if (skill === 'L') {
      if (tag && L_TAG[tag] && idx % 2 === 0) {
        t.title = 'Listening: ' + L_TAG[tag];
        t.resource = resFor('L:basic', content, resources, idx);
      } else if (early) {
        t.title = 'Listening: диктант 5 предложений + слушание со скриптом';
        t.desc = 'Послушай отрывок 2–3 раза без текста, запиши, сверь со скриптом, выпиши 5 непонятных chunks в карточки.';
        t.resource = resFor('L:basic', content, resources, idx);
      } else if (mid) {
        t.title = 'Listening: лекция/монолог + конспект';
        t.desc = 'Слушай один раз, делай заметки по ключевым словам; затем сверка со скриптом/субтитрами. Раз в 3 дня — одна секция официального теста.';
        t.resource = resFor(idx % 3 === 0 ? 'L:test' : 'L:academic', content, resources, idx);
      } else {
        t.title = 'Listening: секция по таймеру (Section ' + (3 + (idx % 2)) + ') + разбор ошибок';
        t.desc = 'Один проход, как на экзамене. Каждая ошибка → журнал с тегом.';
        t.resource = resFor('L:test', content, resources, idx);
      }
    } else if (skill === 'R') {
      if (tag && R_TAG[tag] && idx % 2 === 0) {
        t.title = 'Reading: ' + R_TAG[tag];
        t.resource = resFor('R:test', content, resources, idx);
      } else if (early) {
        t.title = 'Reading: статья B1–B2, поиск перефразов';
        t.desc = 'Читай 15–20 минут. Подчеркни 8 перефразов и 8 новых chunks; перескажи абзац своими словами.';
        t.resource = resFor('R:basic', content, resources, idx);
      } else if (mid) {
        const qt = pick(content.questionTypes, idx);
        t.title = 'Reading: тип вопросов — ' + qt;
        t.desc = '2–3 задания именно этого типа, затем разбор логики ошибок.';
        t.resource = resFor('R:test', content, resources, idx);
      } else {
        t.title = 'Reading: один текст за 20 минут (строго) + разбор';
        t.resource = resFor('R:test', content, resources, idx);
      }
    } else if (skill === 'W') {
      const isT1day = idx % 2 === 1;
      if (early) {
        const q = pick(content.writingPrompts, idx);
        t.title = 'Writing: два связных абзаца (80–120 слов)';
        t.desc = 'Тема: «' + q.text + '». Один абзац — одна идея + пример. Проверь по чек-листу, исправь, отправь на проверку (вкладка «Проверка»).';
      } else if (isT1day) {
        if (profile.module === 'general') {
          const l = pick(content.letterPrompts, idx);
          t.title = 'Writing Task 1 (General): письмо — ' + l.tone;
          t.desc = l.text + ' 20 минут, 150+ слов.';
        } else {
          t.title = 'Writing Task 1 (Academic): ' + pick(content.task1Types, idx);
          t.desc = 'Возьми задание Task 1 нужного типа из официальных/открытых тестов. Сначала Overview, затем 2 абзаца деталей. 20 минут, 150+ слов.';
        }
      } else {
        const q = pick(content.writingPrompts, idx);
        t.title = 'Writing Task 2 (' + q.type + ')' + (early || mid ? '' : ' — по таймеру 40 мин');
        t.desc = 'Вопрос: «' + q.text + '». План 5 мин → текст 250+ слов → самопроверка по чек-листу → проверка → перепиши слабый абзац.';
      }
      t.resource = resFor('W', content, resources, idx);
    } else if (skill === 'S') {
      if (early) {
        const tp = pick(content.speakingTopics, idx);
        t.title = 'Speaking Part 1: тема «' + tp + '» — 6 вопросов, запись';
        t.desc = 'Отвечай 2–3 предложениями: ответ + причина + пример. Прослушай запись, отметь паузы и ошибки.';
      } else if (mid) {
        const c = pick(content.cueCards, idx);
        t.title = 'Speaking Part 2: «' + c + '»';
        t.desc = '1 минута на заметки (ключевые слова), 2 минуты речи, запись. Повтори тему на следующий день, улучшив концовку.';
      } else {
        const c = pick(content.cueCards, idx + 3);
        t.title = 'Speaking: полный прогон Part 1–3 (11–14 мин) — «' + c + '»';
        t.desc = 'В паре: один экзаменатор, один кандидат, затем обмен. Оценка по 4 критериям, ошибки в журнал.';
      }
      t.resource = resFor('S', content, resources, idx);
    }
    t.id = '';
    return t;
  }

  function fixedTask(skill, title, minutes, desc, resKey, ctx) {
    return { skill, title, minutes, desc: desc || '', resource: resKey ? resFor(resKey, ctx.content, ctx.resources, ctx.idx) : null, id: '' };
  }

  /** Задания на конкретную дату. Детерминированно (одинаковый вход → одинаковый выход). */
  function dayTasks(profile, date, content, resources, errors) {
    const week = weekNo(profile.start, date);
    const phase = phaseFor(week);
    const dow = pd(date).getUTCDay(); // 0 вс .. 6 сб
    const idx = Math.max(0, daysBetween(profile.start, date));
    const sev = errorSeverity(errors, date);
    const w = weights(profile, sev);
    const H = profile.hours;
    const lighten = week % 4 === 0 ? 0.7 : 1;
    const ctx = { phase, idx, profile, content, resources, sev, content_: content };
    const tasks = [];
    const srs = () => ({ skill: 'V', title: 'Карточки (SRS): повторения + новые chunks', minutes: 15, desc: 'Вкладка «Карточки». Новое слово — только с примером и коллокацией.', resource: null, id: '' });
    const recap = () => ({ skill: 'ALL', title: 'Недельный обзор: прогресс, топ-3 ошибки, план на неделю', minutes: 20, desc: 'Вкладка «Прогресс». Один вывод и одно изменение на следующую неделю.', resource: null, id: '' });

    if (phase.id === 'P0') {
      const round = week;
      const m = { 1: ['L', 'Диагностика Listening: полный официальный тест нужного модуля, без пауз', 'L:test'], 2: ['R', 'Диагностика Reading: полный официальный тест (60 мин)', 'R:test'], 3: ['W', 'Диагностика Writing: Task 1 (20 мин) + Task 2 (40 мин), набор на клавиатуре', 'W'], 4: ['S', 'Диагностика Speaking: запись Part 1–3 по открытым вопросам', 'S'] };
      if (m[dow]) {
        const [s, title, key] = m[dow];
        tasks.push(fixedTask(s, title + ' (раунд ' + round + '/2)', 70, 'Результат внеси на вкладке «Прогресс → Новый мок»; ошибки — в журнал.', key, ctx));
        tasks.push(srs());
      } else if (dow === 5) {
        tasks.push(srs());
        tasks.push(fixedTask('ALL', 'Разбор диагностики: журнал ошибок и обновление профиля', 45, 'Для L/R пересчитай raw → band (вкладка «Прогресс»). Writing/Speaking — оценка по протоколу двух ИИ (вкладка «Проверка»).', null, ctx));
      } else if (dow === 6) {
        tasks.push(fixedTask('L', 'Экстенсивное слушание (подкаст/6 Minute English)', 45, 'Без напряжения: понимать общий смысл.', 'L:basic', ctx));
        tasks.push(fixedTask('R', 'Экстенсивное чтение: статья по интересной теме', 45, '', 'R:basic', ctx));
      } else {
        tasks.push(fixedTask('L', 'Лёгкий день: слушание на интересную тему', 30, '', 'L:basic', ctx));
        tasks.push(recap());
      }
    } else {
      const dayMin = (dow === 6 ? 0.25 : dow === 0 ? 0.15 : 0.12) * H * 60 * lighten;
      if (dow >= 1 && dow <= 5) {
        const rest = dayMin - 15;
        const primaryMap = { 1: 'L', 2: 'R', 3: 'W', 4: 'S', 5: 'W' };
        const primary = primaryMap[dow];
        const pm = r5(rest * 0.6);
        const sm = r5(rest * 0.4);
        tasks.push(srs());
        const pt = skillTask(primary, Object.assign({}, ctx, { minutes: pm, idx: dow === 5 ? idx + 1 : idx }));
        tasks.push(pt);
        if (dow === 1) tasks.push(fixedTask('G', 'Грамматика: одна тема из журнала ошибок + 10 упражнений', sm, 'Справочник/учебник: Cambridge Dictionary Grammar или Murphy / Grammar for IELTS. Затем 3 своих предложения.', 'G', ctx));
        else if (dow === 2) tasks.push(fixedTask('V', 'Активация лексики: 8 новых chunks → 8 своих предложений', sm, 'Сегодняшние chunks используй в Writing/Speaking в течение 3 дней.', 'V', ctx));
        else {
          const others = SK.filter((s) => s !== primary).sort((a, b) => w[b] - w[a]);
          const sec = dow === 4 && w.L < 0.3 ? 'L' : others[0];
          tasks.push(skillTask(sec, Object.assign({}, ctx, { minutes: sm, idx: idx + 2 })));
          if (dow === 4) tasks.push(fixedTask('S', 'Shadowing: 3 прогона одного отрывка, запись себя', 10, '', 'S', ctx));
        }
        if (primary === 'W' || primary === 'S') tasks.push({ skill: 'ALL', title: 'Разбор ошибок → журнал (вкладка «Ошибки»)', minutes: 10, desc: 'Каждая ошибка: фрагмент → исправление → тег.', resource: null, id: '' });
      } else if (dow === 6) {
        const k = week % 4;
        if (k === 0) {
          tasks.push(fixedTask('ALL', 'ПОЛНЫЙ МОК (часть 1): Listening + Reading подряд, как на экзамене', 100, 'Официальный тест нужного модуля. Результат — вкладка «Прогресс → Новый мок».', 'L:test', ctx));
          tasks.push(fixedTask('W', 'ПОЛНЫЙ МОК (часть 2): Writing Task 1 + Task 2, 60 мин', 60, '', 'W', ctx));
          tasks.push({ skill: 'ALL', title: 'Разбор мока: все ошибки в журнал, 3 вывода', minutes: 45, desc: '', resource: null, id: '' });
        } else {
          const sec = { 1: ['L', 'Listening: полный тест по таймеру', 'L:test'], 2: ['R', 'Reading: полный тест, 60 мин', 'R:test'], 3: ['W', 'Writing: Task 1 + Task 2 по таймеру', 'W'] }[k];
          tasks.push(fixedTask(sec[0], 'Мок-секция — ' + sec[1], r5(dayMin * 0.65), '', sec[2], ctx));
          tasks.push({ skill: 'ALL', title: 'Разбор: ошибки в журнал, повтор слабых типов', minutes: r5(dayMin * 0.35), desc: '', resource: null, id: '' });
        }
      } else {
        tasks.push(srs());
        tasks.push(fixedTask('L', 'Экстенсивное слушание/чтение по интересам (лёгкий день)', r5(dayMin - 35), 'Подкаст или лекция; 5 минут shadowing.', 'L:academic', ctx));
        tasks.push(fixedTask('S', 'Speaking в паре (если есть партнёр): 10 мин Part 2–3 с обратной связью', 10, '', 'S', ctx));
        tasks.push(recap());
      }
    }
    tasks.forEach((t, i) => { t.id = date + '#' + i; });
    return { date, week, phase: phase.id, phaseName: phase.name, weights: w, tasks, total: tasks.reduce((a, t) => a + t.minutes, 0) };
  }

  // ---------- SRS (упрощённый SM-2) ----------
  function newCard(f, b, id) { return { id: id || ('c' + Math.random().toString(36).slice(2, 9)), f, b, ease: 2.5, interval: 0, reps: 0, due: null, seen: false }; }
  function dueCards(cards, today, newLimit, newShownToday) {
    const due = cards.filter((c) => c.seen && c.due <= today);
    const fresh = cards.filter((c) => !c.seen).slice(0, Math.max(0, newLimit - (newShownToday || 0)));
    return { due, fresh };
  }
  /** q: 0 again, 1 hard, 2 good, 3 easy. Меняет карту и возвращает её. */
  function review(c, q, today) {
    c.seen = true;
    if (q === 0) { c.reps = 0; c.interval = 0; c.ease = Math.max(1.3, c.ease - 0.2); c.due = today; return c; }
    if (q === 1) { c.interval = Math.max(1, Math.round(Math.max(c.interval, 1) * 1.2)); c.ease = Math.max(1.3, c.ease - 0.15); }
    else if (q === 2) { c.interval = c.reps === 0 ? 1 : c.reps === 1 ? 4 : Math.round(c.interval * c.ease); }
    else { c.interval = c.reps === 0 ? 3 : Math.round(Math.max(c.interval, 1) * c.ease * 1.3); c.ease += 0.15; }
    c.reps += 1;
    c.due = addDays(today, c.interval);
    return c;
  }

  // ---------- Баллы ----------
  function overall(L, R, W, S) {
    const a = (L + R + W + S) / 4;
    return Math.round(a * 2) / 2; // .25→.5, .75→1.0
  }
  // Приближённые таблицы raw→band (у конкретного теста могут отличаться на ±1 вопрос)
  const TABLES = {
    listening: [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4]],
    reading_academic: [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4]],
    reading_general: [[40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4]],
  };
  function rawToBand(kind, raw) {
    const t = TABLES[kind];
    for (const [min, band] of t) if (raw >= min) return band;
    return 3.5;
  }

  const api = { SK, PHASES, pd, fmt, addDays, daysBetween, weekNo, phaseFor, errorSeverity, weights, dayTasks, newCard, dueCards, review, overall, rawToBand };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
