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


  // ---------- Заучивание (как в Quizlet): карточка не закрывается, пока её не отметят «Выучил» ----------
  const GAPS = [2, 5, 10, 20]; // через сколько показов вернётся карточка при оценке again/hard/good/easy
  const isWord = (c) => !!(c && c.t && c.ex);
  const MARK = /\[\[([^\[\]]+)\]\]/;
  const plain = (ex) => String(ex).replace(/\[\[([^\[\]]+)\]\]/g, '$1');
  /** Режим показа: flip → mcq → write по мере роста уровня; выученные повторяются обычной карточкой. */
  function lrMode(c) {
    if (!isWord(c) || c.mastered || (c.lv || 0) <= 0) return 'flip';
    return c.lv <= 2 ? 'mcq' : 'write';
  }
  /** Оценка во время заучивания. Возвращает, через сколько показов вернуть карточку. */
  function lrRate(c, q) {
    c.seen = true; c.lv = c.lv || 0;
    if (q === 0) c.lv = 0; else if (q === 2) c.lv = Math.min(5, c.lv + 1); else if (q === 3) c.lv = Math.min(5, c.lv + 2);
    return GAPS[q];
  }
  /** Пользователь сам отметил «Выучил»: дальше — повторение через 3 дня, потом по SM-2. */
  function master(c, today) { c.seen = true; c.mastered = true; c.lv = 5; c.reps = 1; c.interval = 3; c.ease = c.ease || 2.5; c.due = addDays(today, 3); return c; }
  function unmaster(c) { c.mastered = false; c.lv = 0; c.reps = 0; c.interval = 0; c.due = null; return c; }
  /** Повторение выученной карточки. again возвращает её в заучивание. */
  function reviewMastered(c, q, today) {
    if (q === 0) { unmaster(c); c.seen = true; return 'relearn'; }
    review(c, q, today); return 'scheduled';
  }
  /** Набор сессии: невыученные карточки в работе (сначала самые слабые) + новые до лимита, и выученные к повторению. */
  function buildSession(cards, today, cap, newLeft) {
    const prog = cards.filter((c) => c.seen && !c.mastered).sort((a, b) => (a.lv || 0) - (b.lv || 0)).slice(0, cap);
    const fresh = cards.filter((c) => !c.seen).slice(0, Math.max(0, Math.min(cap - prog.length, newLeft)));
    const mdue = cards.filter((c) => c.mastered && c.due && c.due <= today);
    return { active: prog.concat(fresh).map((c) => c.id), mdue: mdue.map((c) => c.id), due: {}, last: null, counter: 0, doneM: {} };
  }
  /** Следующая карточка сессии или null. Сначала повторение выученных, затем самая «ранняя» из заучиваемых. */
  function pickNext(cards, sess) {
    const byId = (id) => cards.find((c) => c.id === id);
    const m = sess.mdue.find((id) => !sess.doneM[id] && id !== sess.last);
    if (m) return m;
    const act = sess.active.filter((id) => { const c = byId(id); return c && !c.mastered; });
    if (!act.length) { const m2 = sess.mdue.find((id) => !sess.doneM[id]); return m2 || null; }
    const pool = act.length > 1 ? act.filter((id) => id !== sess.last) : act;
    pool.sort((x, y) => ((sess.due[x] || 0) - (sess.due[y] || 0)) || ((byId(x).lv || 0) - (byId(y).lv || 0)));
    return pool[0];
  }
  /** Тест с пропуском: 4 варианта-леммы. Дистракторы — того же типа (pos) и по возможности из другой темы. */
  function mcq(c, cards, rnd) {
    rnd = rnd || Math.random;
    const same = cards.filter((x) => isWord(x) && x.id !== c.id && x.pos === c.pos && x.t.toLowerCase() !== c.t.toLowerCase());
    const other = same.filter((x) => x.dom !== c.dom);
    const pool = (other.length >= 3 ? other : same).slice();
    const opts = [];
    while (opts.length < 3 && pool.length) { const i = Math.floor(rnd() * pool.length); const t = pool.splice(i, 1)[0].t; if (!opts.includes(t)) opts.push(t); }
    opts.push(c.t);
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    return { text: String(c.ex).replace(MARK, '_____'), form: (String(c.ex).match(MARK) || [0, ''])[1], opts, answer: opts.indexOf(c.t) };
  }
  const STOP = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'at', 'be', 'is', 'as', 'or', 'and', 'from', 'up', 'out']);
  const stem = (w) => (w.length > 6 ? w.slice(0, w.length - 3) : w.length > 4 ? w.slice(0, w.length - 2) : w.length > 3 ? w.slice(0, w.length - 1) : w);
  /** Грубая самопроверка своего предложения: есть ли слово/фраза, длина, заглавная буква и точка. */
  function checkSentence(c, s) {
    const txt = String(s || '').trim(); const low = txt.toLowerCase();
    const words = txt.split(/\s+/).filter(Boolean);
    const toks = c.t.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z-]/g, '')).filter((w) => w && !STOP.has(w));
    const key = toks.length ? toks : [c.t.toLowerCase()];
    const hit = key.filter((w) => new RegExp('\\b' + stem(w).replace(/[-]/g, '\\-') + '[a-z]*').test(low)).length;
    const used = hit / key.length >= 0.7;
    const tips = [];
    if (!used) tips.push('используй «' + c.t + '» в предложении');
    if (words.length < 7) tips.push('сделай предложение подробнее (7+ слов)');
    if (txt && !/^[A-Z]/.test(txt)) tips.push('начни с заглавной буквы');
    if (txt && !/[.!?]$/.test(txt)) tips.push('поставь точку в конце');
    return { used, words: words.length, ok: used && tips.length === 0, tips };
  }


  // ---------- Анализ текста Writing (простые эвристики, не оценка) ----------
  const LINKERS = ['however', 'moreover', 'furthermore', 'in addition', 'for example', 'for instance', 'as a result', 'consequently', 'therefore', 'nevertheless', 'on the other hand', 'by contrast', 'whereas', 'while', 'although', 'despite', 'in conclusion', 'to sum up', 'overall', 'admittedly', 'in contrast', 'similarly', 'firstly', 'secondly', 'finally', 'in particular', 'as well as', 'because of', 'due to', 'thus'];
  const COMMON = new Set('the a an and or but of to in on for with by at from is are was were be been being it this that these those they their there as not have has had will would can could should may might also more most than such which who whom what when where while people very much many some any all one two three'.split(' '));
  function analyseText(text, kind) {
    const t = String(text || '').trim();
    const words = t ? t.split(/\s+/).filter(Boolean) : [];
    const paras = t ? t.split(/\n\s*\n|\n/).map((x) => x.trim()).filter(Boolean).length : 0;
    const sentences = (t.match(/[^.!?]+[.!?]+/g) || (t ? [t] : [])).length;
    const low = t.toLowerCase();
    const freq = {};
    (low.match(/[a-z][a-z'-]{3,}/g) || []).forEach((w) => { if (!COMMON.has(w)) freq[w] = (freq[w] || 0) + 1; });
    const repeats = Object.keys(freq).filter((w) => freq[w] >= 4).sort((a, b) => freq[b] - freq[a]).slice(0, 5).map((w) => [w, freq[w]]);
    const linkers = LINKERS.filter((l) => new RegExp('\\b' + l + '\\b').test(low));
    const minWords = kind === 't2' ? 250 : 150;
    return {
      words: words.length, minWords, short: words.length < minWords, paras, sentences, avgLen: sentences ? Math.round(10 * words.length / sentences) / 10 : 0,
      repeats, linkers, hasConclusion: /\b(in conclusion|to sum up|to conclude|in summary|overall)\b/.test(low),
      hasOverview: /\b(overall|in general|it is clear|the most striking|generally)\b/.test(low),
    };
  }
  /** Проверка ответа типа «короткий ответ»: регистр, пробелы, дефис/пробел не важны. */
  const normAns = (s) => String(s || '').toLowerCase().replace(/[‐–—-]/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  function checkAnswer(item, given) {
    const g = String(given || '').trim();
    if (!g) return false;
    if (Array.isArray(item.a)) return item.a.some((x) => normAns(x) === normAns(g));
    return String(item.a).toLowerCase() === g.toLowerCase();
  }


  // ---------- Разбор ответа ИИ-экзаменатора ----------
  const CRIT = [['c1', /(task response|task achievement|fluency and coherence)/i], ['c2', /(coherence and cohesion|lexical resource)/i], ['c3', /(lexical resource|grammatical range)/i], ['c4', /(grammatical range and accuracy|pronunciation)/i]];
  const unq = (x) => String(x || '').replace(/^[\s"'“”‘’«»]+|[\s"'“”‘’«»]+$/g, '').trim();
  /** Из свободного текста ответа ИИ достаёт оценки, ошибки с кодами, коллокации, советы и переписанный абзац. */
  function parseFeedback(text) {
    const t = String(text || '').replace(/\r/g, '');
    const out = { scores: null, kind: null, errors: [], collocations: [], fixes: [], rewrite: '', overallRange: '' };
    const j = t.match(/\{[^{}]*["']?c1["']?\s*:\s*[\d.]+[^{}]*\}/i);
    if (j) {
      const g = (k) => { const m = j[0].match(new RegExp('["\']?' + k + '["\']?\\s*:\\s*([\\d.]+)', 'i')); return m ? parseFloat(m[1]) : NaN; };
      const sc = [g('c1'), g('c2'), g('c3'), g('c4')];
      if (sc.every((v) => v >= 1 && v <= 9)) out.scores = sc;
    }
    if (!out.scores) { // запасной путь: нижние границы диапазонов по названиям критериев
      const names = [/task response|task achievement|fluency and coherence/i, /coherence and cohesion|lexical resource/i, /lexical resource|grammatical range/i, /grammatical range and accuracy|pronunciation/i];
      const found = [];
      t.split('\n').forEach((ln) => { const m = ln.match(/(task response|task achievement|coherence and cohesion|lexical resource|grammatical range and accuracy|fluency and coherence|pronunciation)[^\d\n]{0,30}(\d(?:\.\d)?)\s*(?:[–—-]\s*(\d(?:\.\d)?))?/i); if (m && found.length < 4) found.push(parseFloat(m[2])); });
      if (found.length === 4) out.scores = found;
    }
    out.kind = /task achievement/i.test(t) ? 't1' : /fluency and coherence/i.test(t) ? 'sp' : /task response/i.test(t) ? 't2' : null;
    const om = t.match(/overall range[\s\S]{0,40}?(\d(?:\.\d)?\s*[–—-]\s*\d(?:\.\d)?)/i); if (om) out.overallRange = om[1].replace(/\s/g, '');
    const seen = new Set(); const re = /^[\s·•*\-–>]*\**\s*((?:W|S|L|R)-[A-Z]{2,6})\s*\**\s*[:：]\s*(.+)$/gm; let m;
    while ((m = re.exec(t))) {
      const body = m[2].trim(); const parts = body.split(/\s*(?:→|->|⇒|=>)\s*/);
      const snippet = unq(parts[0]); const fix = parts.length > 1 ? unq(parts.slice(1).join(' → ')) : '';
      if (!snippet) continue; const key = m[1] + '|' + snippet.toLowerCase(); if (seen.has(key)) continue; seen.add(key);
      out.errors.push({ tag: m[1], snippet: snippet.slice(0, 160), fix: fix.slice(0, 160) });
    }
    const sec = (head, stop) => { const i = t.search(head); if (i < 0) return ''; const rest = t.slice(i); const k = rest.slice(5).search(stop); return k < 0 ? rest : rest.slice(0, k + 5); };
    const colBlock = sec(/collocations? to learn/i, /\n\s*(?:6\)|6\.|list of errors|errors? with codes)/i);
    colBlock.split('\n').slice(1).forEach((ln) => { const b = ln.match(/^\s*(?:[·•*\-–]|\d+[.)])\s*(.+)$/); if (b && unq(b[1])) out.collocations.push(unq(b[1])); });
    const fixBlock = sec(/highest[- ]impact fixes/i, /\n\s*(?:4\)|4\.|rewritten paragraph)/i);
    fixBlock.split('\n').slice(1).forEach((ln) => { const b = ln.match(/^\s*(?:\d+[.)]|[·•*\-–])\s*(.+)$/); if (b) out.fixes.push(b[1].trim().slice(0, 300)); });
    const rwBlock = sec(/rewritten paragraph/i, /\n\s*(?:5\)|5\.|three collocations|collocations? to learn)/i);
    out.rewrite = rwBlock.split('\n').slice(1).join('\n').replace(/^\s*\(.*?\)\s*$/m, '').trim().slice(0, 1200);
    return out;
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

  const api = { SK, PHASES, pd, fmt, addDays, daysBetween, weekNo, phaseFor, errorSeverity, weights, dayTasks, newCard, dueCards, review, overall, rawToBand, isWord, plain, lrMode, lrRate, master, unmaster, reviewMastered, buildSession, pickNext, mcq, checkSentence, GAPS, analyseText, checkAnswer, parseFeedback };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
