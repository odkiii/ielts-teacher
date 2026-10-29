/* IELTS Teacher — интерфейс. Без сборки и зависимостей. Данные: localStorage. */
(function () {
  'use strict';
  const E = window.Engine;
  const KEY = 'ielts_lab_v1';
  const TAGS = ['L-SPELL', 'L-PLURAL', 'L-NUM', 'L-DISTR', 'L-MAP', 'L-LIMIT', 'R-TFNG', 'R-MH', 'R-MI', 'R-COMP', 'R-MCQ', 'R-TIME', 'W-TR', 'W-CC', 'W-LR', 'W-GRA', 'W-ART', 'W-WF', 'W-SVA', 'W-PUNCT', 'W-COLL', 'W-REP', 'S-FC', 'S-LR', 'S-GRA', 'S-P'];
  let CONTENT, RES, DB, session = null;

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const p2 = (n) => String(n).padStart(2, '0');
  const localDate = (d) => { d = d || new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  const today = () => localDate();
  const uid = () => 'p' + Math.random().toString(36).slice(2, 9);
  const num = (v, d) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? d : n; };

  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.profiles) return d; } catch (e) { /* ignore */ }
    return { profiles: {}, active: null };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { alert('Не удалось сохранить данные: ' + e.message); } }
  const P = () => DB.profiles[DB.active];

  function mondayOf(dateStr) {
    const d = E.pd(dateStr); const dow = d.getUTCDay(); const back = dow === 0 ? 6 : dow - 1;
    return E.addDays(dateStr, -back);
  }

  function nextMonday(dateStr) { return E.pd(dateStr).getUTCDay() === 1 ? dateStr : E.addDays(mondayOf(dateStr), 7); }

  function newProfile(f) {
    const p = {
      id: uid(), name: f.name || 'Я', module: f.module, target: { overall: f.overall, min: f.min },
      test_date: f.test_date || '', hours: f.hours, start: f.start,
      skills: { L: f.L, R: f.R, W: f.W, S: f.S },
      cards: CONTENT.cards.map((c, i) => E.newCard(c.f, c.b, 's' + i)),
      errors: [], days: {}, done: {}, mocks: [], subs: [], newPerDay: f.newPerDay || 10, newToday: { date: '', n: 0 },
    };
    DB.profiles[p.id] = p; DB.active = p.id; save();
  }

  // ---------- общие виды ----------
  function profileForm(p, submitLabel) {
    const v = p || { name: '', module: 'academic', target: { overall: 7.5, min: 7 }, hours: 13, start: nextMonday(today()), skills: { L: 4.5, R: 4.5, W: 4.5, S: 4.5 }, newPerDay: 10, test_date: '' };
    const band = (id, val) => '<input id="' + id + '" type="number" step="0.5" min="1" max="9" value="' + val + '" style="width:80px">';
    return '<form id="pf">' +
      '<label>Имя</label><input id="f_name" value="' + esc(v.name) + '">' +
      '<label>Модуль</label><select id="f_module"><option value="academic"' + (v.module === 'academic' ? ' selected' : '') + '>Academic</option><option value="general"' + (v.module === 'general' ? ' selected' : '') + '>General Training</option></select>' +
      '<div class="row"><div><label>Цель overall</label>' + band('f_overall', v.target.overall) + '</div><div><label>Минимум по навыку</label>' + band('f_min', v.target.min) + '</div></div>' +
      '<label>Текущий уровень (band) — по диагностике или оценке</label><div class="row">' +
      ['L', 'R', 'W', 'S'].map((s) => '<div>' + s + ' ' + band('f_' + s, v.skills[s]) + '</div>').join('') + '</div>' +
      '<div class="row"><div><label>Часов в неделю</label><input id="f_hours" type="number" min="3" max="40" value="' + v.hours + '" style="width:80px"></div>' +
      '<div><label>Новых карточек в день</label><input id="f_new" type="number" min="0" max="40" value="' + v.newPerDay + '" style="width:80px"></div></div>' +
      '<div class="row"><div><label>Старт плана (понедельник)</label><input id="f_start" type="date" value="' + v.start + '"></div>' +
      '<div><label>Дата теста (если есть)</label><input id="f_test" type="date" value="' + (v.test_date || '') + '"></div></div>' +
      '<p><button class="p" type="submit">' + submitLabel + '</button></p></form>';
  }
  function readProfileForm() {
    return {
      name: $('#f_name').value.trim(), module: $('#f_module').value, overall: num($('#f_overall').value, 7.5), min: num($('#f_min').value, 7),
      L: num($('#f_L').value, 4.5), R: num($('#f_R').value, 4.5), W: num($('#f_W').value, 4.5), S: num($('#f_S').value, 4.5),
      hours: num($('#f_hours').value, 13), newPerDay: num($('#f_new').value, 10), start: $('#f_start').value || mondayOf(today()), test_date: $('#f_test').value,
    };
  }

  // ---------- вкладки ----------
  const TABS = [['today', 'Сегодня'], ['plan', 'План'], ['cards', 'Карточки'], ['errors', 'Ошибки'], ['check', 'Проверка'], ['progress', 'Прогресс'], ['res', 'Ресурсы'], ['set', 'Настройки']];
  let viewDate = null;

  function dayFor(date) {
    const p = P();
    if (!p.days[date]) p.days[date] = E.dayTasks(p, date, CONTENT, RES, p.errors);
    return p.days[date];
  }

  function resHtml(r) {
    if (!r) return '';
    const badge = r.status === 'user_provided' || r.status === 'to_verify' ? ' <span class="badge warn">не проверено</span>' : '';
    if (r.url) return '<div class="mut">↗ <a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.name) + '</a>' + badge + '</div>';
    return '<div class="mut">↗ ' + esc(r.name) + (r.search ? ' — поиск: «' + esc(r.search) + '»' : '') + badge + '</div>';
  }

  function viewToday() {
    const p = P(); const date = viewDate || today();
    const d = dayFor(date); const done = p.done[date] || {};
    const left = d.tasks.filter((t) => !done[t.id]).reduce((a, t) => a + t.minutes, 0);
    let h = '<h2>' + esc(date) + ' · неделя ' + d.week + ' · ' + esc(d.phaseName) + '</h2>';
    h += '<div class="row"><input id="vd" type="date" value="' + date + '"><button id="vdt">Сегодня</button><button id="regen">Пересоздать</button>' +
      '<span class="mut">всего ' + d.total + ' мин, осталось ' + left + ' мин</span></div>';
    h += d.tasks.map((t) => '<div class="card task' + (done[t.id] ? ' done' : '') + '"><input type="checkbox" data-t="' + esc(t.id) + '"' + (done[t.id] ? ' checked' : '') + '>' +
      '<div><div class="t"><span class="badge">' + esc(t.skill) + '</span>' + esc(t.title) + ' <span class="mut">· ' + t.minutes + ' мин</span></div>' +
      (t.desc ? '<div class="mut">' + esc(t.desc) + '</div>' : '') + resHtml(t.resource) + '</div></div>').join('');
    h += '<h3>Таймер</h3><div class="row"><input id="tm" type="number" value="25" min="1" style="width:70px"> мин <button id="tmgo">Старт</button><span id="tmout" class="big" style="padding:0 10px"></span></div>';
    h += '<p class="mut">Результаты тестов — во вкладке «Прогресс», ошибки — «Ошибки», эссе на проверку — «Проверка».</p>';
    $('#view').innerHTML = h;
    $('#vd').onchange = (e) => { viewDate = e.target.value || null; route(); };
    $('#vdt').onclick = () => { viewDate = null; route(); };
    $('#regen').onclick = () => { delete p.days[date]; save(); route(); };
    document.querySelectorAll('input[data-t]').forEach((c) => { c.onchange = () => { p.done[date] = p.done[date] || {}; if (c.checked) p.done[date][c.dataset.t] = true; else delete p.done[date][c.dataset.t]; save(); route(); }; });
    let iv = null;
    $('#tmgo').onclick = () => {
      clearInterval(iv); let s = Math.round(num($('#tm').value, 25) * 60);
      const tick = () => { $('#tmout').textContent = p2(Math.floor(s / 60)) + ':' + p2(s % 60); if (s-- <= 0) { clearInterval(iv); $('#tmout').textContent = 'Время!'; try { navigator.vibrate && navigator.vibrate(300); } catch (e) { /* ignore */ } } };
      tick(); iv = setInterval(tick, 1000);
    };
  }

  function viewPlan() {
    const p = P(); const t0 = today(); const week = E.weekNo(p.start, t0);
    const sev = E.errorSeverity(p.errors, t0); const w = E.weights(p, sev);
    let h = '<h2>План</h2><div class="card">Неделя <b>' + week + '</b> из 52 (+ буфер до 78). Фаза: <b>' + esc(E.phaseFor(week).name) + '</b>.';
    if (p.test_date) h += ' До теста: <b>' + Math.max(0, E.daysBetween(t0, p.test_date)) + '</b> дн.';
    h += '</div><h3>Распределение времени (' + p.hours + ' ч/нед)</h3>';
    h += E.SK.map((s) => '<div class="row"><span style="width:28px">' + s + '</span><div class="bar" style="flex:1;min-width:140px"><i style="width:' + Math.round(w[s] * 100) + '%"></i></div><span class="mut">' + Math.round(w[s] * 100) + '% · ' + (w[s] * p.hours).toFixed(1) + ' ч · ' + p.skills[s] + ' → ' + p.target.overall + '</span></div>').join('');
    h += '<h3>Фазы</h3><table><tr><th>Фаза</th><th>Недели</th><th>Даты</th><th>Цель</th></tr>' + E.PHASES.map((f) => '<tr><td>' + esc(f.name) + '</td><td>' + f.from + '–' + f.to + '</td><td>' + E.addDays(p.start, (f.from - 1) * 7) + ' — ' + E.addDays(p.start, f.to * 7 - 1) + '</td><td>' + esc(f.goal) + '</td></tr>').join('') + '</table>';
    h += '<h3>Ближайшие 7 дней</h3>';
    for (let i = 0; i < 7; i++) { const dd = E.addDays(t0, i); const d = dayFor(dd); h += '<div class="card"><b>' + dd + '</b> <span class="mut">(' + d.total + ' мин)</span><br>' + d.tasks.map((t) => esc(t.title)).join('<br>') + '</div>'; }
    $('#view').innerHTML = h;
  }

  function viewCards() {
    const p = P(); const t0 = today();
    if (p.newToday.date !== t0) p.newToday = { date: t0, n: 0 };
    if (!session || session.date !== t0) {
      const q = E.dueCards(p.cards, t0, p.newPerDay, p.newToday.n);
      session = { date: t0, queue: q.due.concat(q.fresh).map((c) => c.id), shown: false };
    }
    const total = p.cards.length; const seen = p.cards.filter((c) => c.seen).length;
    let h = '<h2>Карточки</h2><div class="mut">Всего ' + total + ', изучено ' + seen + ', в очереди ' + session.queue.length + '</div>';
    if (session.queue.length) {
      const c = p.cards.find((x) => x.id === session.queue[0]);
      h += '<div class="card big">' + esc(c.f) + '</div>';
      if (session.shown) {
        h += '<div class="card big">' + esc(c.b) + '</div><div class="row"><button data-q="0">Снова</button><button data-q="1">Трудно</button><button class="p" data-q="2">Хорошо</button><button data-q="3">Легко</button></div>';
        h += '<p class="mut">Правило: слово не выучено, пока ты не использовал его в Writing/Speaking.</p>';
      } else h += '<p><button class="p" id="show">Показать ответ</button></p>';
    } else h += '<div class="card ok">На сегодня всё. Новые карточки: ' + p.newToday.n + '/' + p.newPerDay + '.</div>';
    h += '<h3>Добавить карточку</h3><div class="row"><input id="cf" placeholder="Вопрос/контекст" style="flex:1"><input id="cb" placeholder="Ответ: chunk + пример" style="flex:2"><button id="cadd">Добавить</button></div>';
    h += '<h3>Импорт CSV</h3><textarea id="csv" placeholder="front;back — по одной на строку (из Oxford/NAWL/AWL, с примером)"></textarea><p><button id="cimp">Импортировать</button></p>';
    $('#view').innerHTML = h;
    const next = () => { session.shown = false; save(); route(); };
    if ($('#show')) $('#show').onclick = () => { session.shown = true; route(); };
    document.querySelectorAll('button[data-q]').forEach((b) => b.onclick = () => {
      const c = p.cards.find((x) => x.id === session.queue[0]); const q = +b.dataset.q;
      if (!c.seen) p.newToday.n += 1;
      E.review(c, q, t0); session.queue.shift(); if (q === 0) session.queue.push(c.id); next();
    });
    $('#cadd').onclick = () => { const f = $('#cf').value.trim(), b = $('#cb').value.trim(); if (!f || !b) return; p.cards.push(E.newCard(f, b)); session = null; save(); route(); };
    $('#cimp').onclick = () => {
      const lines = $('#csv').value.split('\n').map((l) => l.trim()).filter(Boolean); let n = 0;
      lines.forEach((l) => { const i = l.indexOf(';'); if (i > 0) { p.cards.push(E.newCard(l.slice(0, i).trim(), l.slice(i + 1).trim())); n++; } });
      session = null; save(); alert('Добавлено: ' + n); route();
    };
  }

  function viewErrors() {
    const p = P(); const t0 = today(); const sev = E.errorSeverity(p.errors, t0);
    let h = '<h2>Журнал ошибок</h2><div class="card"><div class="row"><select id="etag">' + TAGS.map((t) => '<option>' + t + '</option>').join('') + '</select>' +
      '<input id="esn" placeholder="Фрагмент с ошибкой" style="flex:1;min-width:160px"><input id="efx" placeholder="Правильно" style="flex:1;min-width:160px"><button class="p" id="eadd">Добавить</button></div></div>';
    const top = Object.keys(sev).sort((a, b) => sev[b] - sev[a]).slice(0, 5);
    h += '<h3>Топ тегов (30 дней)</h3>' + (top.length ? top.map((t) => '<span class="badge">' + esc(t) + ' ' + p.errors.filter((e) => e.tag === t && e.date >= E.addDays(t0, -30)).length + '</span>').join('') : '<span class="mut">Пока пусто</span>');
    h += '<h3>Записи</h3>' + p.errors.slice().reverse().slice(0, 100).map((e) => '<div class="card"><span class="badge">' + esc(e.tag) + '</span><span class="mut">' + esc(e.date) + '</span> ' + esc(e.snippet) + ' → <b>' + esc(e.fix) + '</b> <button data-d="' + esc(e.id) + '">×</button></div>').join('');
    $('#view').innerHTML = h;
    $('#eadd').onclick = () => { const s = $('#esn').value.trim(); if (!s) return; p.errors.push({ id: uid(), date: t0, tag: $('#etag').value, snippet: s, fix: $('#efx').value.trim() }); delete p.days[t0]; save(); route(); };
    document.querySelectorAll('button[data-d]').forEach((b) => b.onclick = () => { p.errors = p.errors.filter((e) => e.id !== b.dataset.d); save(); route(); });
  }

  const RUBRIC = {
    t2: 'Task 2 (Writing). Criteria: Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy. Penalise: unanswered parts of the question, over-generalisation, unclear position, weak paragraphing, over-used linkers, memorised phrases/clichés, imprecise collocations, word-form errors, spelling, errors in simple and complex sentences, punctuation.',
    t1: 'Task 1 Academic (Writing). Criteria: Task Achievement, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy. Check: clear overview, accurate key features, no opinions, correct data language, 150+ words.',
    gt: 'Task 1 General Training letter (Writing). Criteria: Task Achievement, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy. Check: all bullet points covered, purpose clear, tone consistent and appropriate, 150+ words.',
    sp: 'Speaking (judging from a transcript only — say that Pronunciation cannot be judged from text). Criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation.',
  };
  function buildPrompt(kind, q, text) {
    return 'You are a strict, experienced IELTS examiner. Use the public IELTS band descriptors for this task type. Be conservative: if unsure, choose the LOWER band. Do not inflate scores.\n\n' + RUBRIC[kind] +
      '\n\nQUESTION:\n' + q + '\n\nCANDIDATE ' + (kind === 'sp' ? 'TRANSCRIPT' : 'RESPONSE') + ' (' + text.trim().split(/\s+/).filter(Boolean).length + ' words):\n' + text +
      '\n\nReturn:\n1) A band RANGE for each of the 4 criteria (e.g. 6.0–6.5), each with 1–2 short quotes from the text as evidence.\n2) An overall range.\n3) The 3 highest-impact fixes.\n4) One rewritten paragraph one band higher.\n5) 3 collocations to learn.\n6) A list of errors with codes (W-ART, W-WF, W-SVA, W-PUNCT, W-COLL, W-REP, W-TR, W-CC; for speaking S-FC, S-LR, S-GRA).\nFinish with one JSON line: {"c1":x,"c2":x,"c3":x,"c4":x} using the LOWER end of each range.';
  }
  function viewCheck() {
    const p = P();
    let h = '<h2>Проверка Writing/Speaking через ИИ</h2><p class="mut">Собери промпт → вставь в любой чат-ИИ (лучше в двух разных) → внеси результат ниже. ИИ-оценка — приблизительная: бери нижнюю границу; при расхождении >0.5 считай оценку спорной.</p>';
    h += '<div class="row"><select id="ck"><option value="t2">Task 2</option><option value="t1">Task 1 Academic</option><option value="gt">Task 1 GT (письмо)</option><option value="sp">Speaking (транскрипт)</option></select></div>';
    h += '<label>Вопрос/задание</label><textarea id="cq" style="min-height:60px"></textarea><label>Твой текст <span id="wc" class="mut">0 слов</span></label><textarea id="ct" style="min-height:200px" spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>';
    h += '<p class="row"><button class="p" id="cbuild">Собрать промпт</button><button id="ccopy">Копировать</button></p><textarea id="cout" style="min-height:120px" readonly></textarea>';
    h += '<h3>Результат</h3><div class="row"><span>Критерии 1–4:</span>' + [1, 2, 3, 4].map((i) => '<input id="sc' + i + '" type="number" step="0.5" min="1" max="9" style="width:70px">').join('') + '<input id="snote" placeholder="Заметка" style="flex:1;min-width:140px"><button id="ssave">Сохранить</button></div>';
    h += '<h3>История</h3><table><tr><th>Дата</th><th>Тип</th><th>Оценка</th><th></th></tr>' + p.subs.slice().reverse().slice(0, 40).map((s) => '<tr><td>' + esc(s.date) + '</td><td>' + esc(s.kind) + '</td><td>' + esc(s.avg) + ' (' + s.sc.join('/') + ')</td><td class="mut">' + esc(s.note) + '</td></tr>').join('') + '</table>';
    $('#view').innerHTML = h;
    $('#ct').oninput = () => { $('#wc').textContent = $('#ct').value.trim().split(/\s+/).filter(Boolean).length + ' слов'; };
    $('#cbuild').onclick = () => { $('#cout').value = buildPrompt($('#ck').value, $('#cq').value, $('#ct').value); };
    $('#ccopy').onclick = () => { $('#cout').select(); try { navigator.clipboard.writeText($('#cout').value); } catch (e) { document.execCommand('copy'); } };
    $('#ssave').onclick = () => {
      const sc = [1, 2, 3, 4].map((i) => num($('#sc' + i).value, NaN)); if (sc.some(isNaN)) { alert('Заполни 4 оценки'); return; }
      const avg = E.overall(sc[0], sc[1], sc[2], sc[3]);
      p.subs.push({ id: uid(), date: today(), kind: $('#ck').value, sc, avg, note: $('#snote').value.trim() }); save(); route();
    };
  }

  function viewProgress() {
    const p = P(); const t0 = today();
    let h = '<h2>Прогресс</h2><h3>Новый мок / диагностика</h3><div class="card"><div class="row">' + E.SK.map((s) => '<div>' + s + '<br><input id="m_' + s + '" type="number" step="0.5" min="1" max="9" style="width:70px"></div>').join('') + '<label style="margin:0"><input type="checkbox" id="m_up" checked> обновить профиль</label><button class="p" id="msave">Сохранить</button></div>';
    h += '<div class="row mut" style="margin-top:8px">Raw → band (примерно): <select id="rk"><option value="listening">Listening</option><option value="reading_' + p.module + '">Reading (' + p.module + ')</option></select><input id="rr" type="number" min="0" max="40" style="width:70px"><button id="rgo">Пересчитать</button><span id="rout"></span></div></div>';
    h += '<h3>Моки</h3><table><tr><th>Дата</th><th>L</th><th>R</th><th>W</th><th>S</th><th>Overall</th></tr>' + p.mocks.slice().reverse().map((m) => '<tr><td>' + esc(m.date) + '</td><td>' + m.L + '</td><td>' + m.R + '</td><td>' + m.W + '</td><td>' + m.S + '</td><td><b>' + m.overall + '</b></td></tr>').join('') + '</table>';
    const wk = {}; Object.keys(p.days).forEach((d) => { const dd = p.days[d]; const dn = p.done[d] || {}; const k = dd.week; wk[k] = wk[k] || { plan: 0, done: 0 }; dd.tasks.forEach((t) => { wk[k].plan += t.minutes; if (dn[t.id]) wk[k].done += t.minutes; }); });
    const ks = Object.keys(wk).map(Number).sort((a, b) => b - a).slice(0, 8);
    h += '<h3>Выполнение по неделям</h3><table><tr><th>Неделя</th><th>План, мин</th><th>Сделано, мин</th><th>%</th></tr>' + ks.map((k) => '<tr><td>' + k + '</td><td>' + wk[k].plan + '</td><td>' + wk[k].done + '</td><td>' + Math.round(100 * wk[k].done / Math.max(1, wk[k].plan)) + '</td></tr>').join('') + '</table>';
    h += '<h3>Текущие уровни</h3>' + E.SK.map((s) => '<span class="badge">' + s + ' ' + p.skills[s] + ' → ' + p.target.overall + '</span>').join('');
    $('#view').innerHTML = h;
    $('#rgo').onclick = () => { $('#rout').textContent = '≈ band ' + E.rawToBand($('#rk').value, num($('#rr').value, 0)) + ' (проверь по таблице конкретного теста)'; };
    $('#msave').onclick = () => {
      const v = {}; for (const s of E.SK) { v[s] = num($('#m_' + s).value, NaN); if (isNaN(v[s])) { alert('Заполни все 4 навыка'); return; } }
      p.mocks.push({ id: uid(), date: t0, L: v.L, R: v.R, W: v.W, S: v.S, overall: E.overall(v.L, v.R, v.W, v.S) });
      if ($('#m_up').checked) { E.SK.forEach((s) => { p.skills[s] = v[s]; }); Object.keys(p.days).forEach((d) => { if (d >= t0) delete p.days[d]; }); }
      save(); route();
    };
  }

  function viewRes() {
    const sk = ['ALL', 'L', 'R', 'W', 'S', 'V', 'G'];
    let h = '<h2>Ресурсы</h2><div class="row"><select id="rs">' + sk.map((s) => '<option>' + s + '</option>').join('') + '</select><input id="rq" placeholder="поиск"><label style="margin:0"><input type="checkbox" id="rrisk"> показать рискованные</label></div><div id="rl"></div>' +
      '<p class="mut">Статусы: seen — встречался в поиске 29.10.2026; user_provided — от пользователя, не проверено; to_verify — проверить. ru_risk true = ресурс British Council (в РФ «нежелательная организация»), access = может быть заблокирован.</p>';
    $('#view').innerHTML = h;
    const draw = () => {
      const s = $('#rs').value, q = $('#rq').value.toLowerCase(), risk = $('#rrisk').checked;
      const list = RES.filter((r) => (s === 'ALL' || (r.skills || []).includes(s) || (r.skills || []).includes('ALL')) && (risk || (r.ru_risk !== true)) && (!q || (r.name + ' ' + (r.tags || []).join(' ')).toLowerCase().includes(q)));
      $('#rl').innerHTML = list.map((r) => '<div class="card"><b>' + esc(r.name) + '</b> <span class="badge">' + esc(r.type) + '</span><span class="badge">' + esc(r.cost) + '</span><span class="badge">' + esc(r.status) + '</span>' + (r.ru_risk ? '<span class="badge warn">ru_risk: ' + esc(r.ru_risk) + '</span>' : '') +
        '<div class="mut">' + esc((r.skills || []).join(' ')) + ' · ' + esc(r.level) + '</div>' + (r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.url) + '</a>' : '<span class="mut">поиск: «' + esc(r.search_query || '') + '»</span>') + (r.notes ? '<div class="mut">' + esc(r.notes) + '</div>' : '') + '</div>').join('');
    };
    ['rs', 'rq', 'rrisk'].forEach((id) => { $('#' + id).oninput = draw; $('#' + id).onchange = draw; });
    draw();
  }

  function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  function viewSet() {
    const p = P();
    let h = '<h2>Настройки</h2><h3>Профиль</h3>' + profileForm(p, 'Сохранить');
    h += '<h3>Профили</h3><div class="row"><select id="sw">' + Object.values(DB.profiles).map((x) => '<option value="' + x.id + '"' + (x.id === DB.active ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select><button id="swgo">Переключить</button><button id="addp">Новый профиль</button><button id="delp">Удалить текущий</button></div>';
    h += '<h3>Резервная копия</h3><div class="row"><button id="exp">Экспорт JSON</button><input type="file" id="imp" accept="application/json"></div><p class="mut">Профили хранятся только в этом браузере: у тебя и у девушки — каждый на своём устройстве или в своём профиле.</p>';
    $('#view').innerHTML = h;
    $('#pf').onsubmit = (e) => {
      e.preventDefault(); const f = readProfileForm();
      Object.assign(p, { name: f.name || p.name, module: f.module, target: { overall: f.overall, min: f.min }, hours: f.hours, newPerDay: f.newPerDay, start: f.start, test_date: f.test_date, skills: { L: f.L, R: f.R, W: f.W, S: f.S } });
      p.days = {}; save(); route();
    };
    $('#swgo').onclick = () => { DB.active = $('#sw').value; session = null; save(); route(); };
    $('#addp').onclick = () => { DB.active = null; save(); route(); };
    $('#delp').onclick = () => { if (confirm('Удалить профиль «' + p.name + '» без возможности восстановления?')) { delete DB.profiles[DB.active]; DB.active = Object.keys(DB.profiles)[0] || null; save(); route(); } };
    $('#exp').onclick = () => download('ielts-teacher-' + today() + '.json', JSON.stringify(DB));
    $('#imp').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => { try { const d = JSON.parse(r.result); if (!d.profiles) throw new Error('не тот формат'); if (confirm('Заменить все текущие данные импортом?')) { DB = d; save(); route(); } } catch (err) { alert('Ошибка импорта: ' + err.message); } };
      r.readAsText(f);
    };
  }

  function viewOnboarding() {
    $('#view').innerHTML = '<h2>Создай профиль</h2><p class="mut">Анкета займёт минуту. Уровни по навыкам — по первой диагностике (неделя 1); пока можно ввести примерные и обновить после. У каждого человека — свой профиль.</p>' + profileForm(null, 'Создать план');
    $('#pf').onsubmit = (e) => { e.preventDefault(); newProfile(readProfileForm()); session = null; location.hash = '#today'; route(); };
  }

  function route() {
    const tab = (location.hash || '#today').slice(1);
    if (!DB.active || !P()) { $('#nav').innerHTML = ''; $('#who').textContent = ''; return viewOnboarding(); }
    $('#who').textContent = P().name + ' · ' + P().module;
    $('#nav').innerHTML = TABS.map(([k, n]) => '<a href="#' + k + '" class="' + (k === tab ? 'on' : '') + '">' + n + '</a>').join('');
    ({ today: viewToday, plan: viewPlan, cards: viewCards, errors: viewErrors, check: viewCheck, progress: viewProgress, res: viewRes, set: viewSet }[tab] || viewToday)();
  }

  async function init() {
    try {
      const [c, r] = await Promise.all([fetch('data/content.json').then((x) => x.json()), fetch('data/resources.json').then((x) => x.json())]);
      CONTENT = c; RES = r;
    } catch (e) { $('#view').textContent = 'Не удалось загрузить данные: ' + e.message + '. Открывай через http-сервер (npm start), а не file://.'; return; }
    DB = load(); window.addEventListener('hashchange', route); route();
  }
  init();
})();
