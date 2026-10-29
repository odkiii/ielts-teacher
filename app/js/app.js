/* IELTS Teacher — интерфейс. Без сборки. Данные: Supabase (аккаунт) + локальный кэш. */
(function () {
  'use strict';
  const E = window.Engine;
  const LEGACY = 'ielts_lab_v1';
  const TAGS = ['L-SPELL', 'L-PLURAL', 'L-NUM', 'L-DISTR', 'L-MAP', 'L-LIMIT', 'R-TFNG', 'R-MH', 'R-MI', 'R-COMP', 'R-MCQ', 'R-TIME', 'W-TR', 'W-CC', 'W-LR', 'W-GRA', 'W-ART', 'W-WF', 'W-SVA', 'W-PUNCT', 'W-COLL', 'W-REP', 'S-FC', 'S-LR', 'S-GRA', 'S-P'];
  const SKN = { L: 'Listening', R: 'Reading', W: 'Writing', S: 'Speaking', V: 'Лексика', G: 'Грамматика', M: 'Мок', ALL: 'Разное' };
  let CONTENT, RES, DB = { profiles: {}, active: null }, user = null, session = null;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const p2 = (n) => String(n).padStart(2, '0');
  const localDate = (d) => { d = d || new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  const today = () => localDate();
  const uid = () => 'p' + Math.random().toString(36).slice(2, 9);
  const num = (v, d) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? d : n; };
  const fmtD = (s, o) => E.pd(s).toLocaleDateString('ru-RU', Object.assign({ timeZone: 'UTC' }, o || { day: 'numeric', month: 'short' }));
  const P = () => DB.profiles[DB.active];

  // ---------- иконки ----------
  const IC = {
    today: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',
    plan: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    cards: '<rect x="3.5" y="7" width="14" height="13" rx="3"/><path d="M7 4h12a1.5 1.5 0 0 1 1.5 1.5V16"/>',
    errors: '<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>',
    more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  };
  const ico = (n, cls) => '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + '</svg>';

  // ---------- хранение и синхронизация ----------
  let ver = 0, pushTimer = null, lastErr = 0, syncState = 'ok';
  const lkey = () => 'ielts_v2_' + (user ? user.id : 'anon');
  function writeLocal(dirty) { try { localStorage.setItem(lkey(), JSON.stringify({ db: DB, dirty: !!dirty })); } catch (e) { /* ignore */ } }
  function readLocal() { try { return JSON.parse(localStorage.getItem(lkey())); } catch (e) { return null; } }
  function save() {
    if (!user) return;
    ver++; syncState = 'pending'; writeLocal(true);
    clearTimeout(pushTimer); pushTimer = setTimeout(push, 700);
  }
  async function push() {
    clearTimeout(pushTimer);
    if (!user || !window.Cloud) return;
    const v = ver;
    try {
      await Cloud.push(user.id, DB);
      if (v === ver) { writeLocal(false); syncState = 'ok'; } else pushTimer = setTimeout(push, 300);
    } catch (e) {
      syncState = 'error';
      if (Date.now() - lastErr > 15000) { lastErr = Date.now(); toast('Нет связи — сохранено на устройстве'); }
      pushTimer = setTimeout(push, 20000);
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && syncState !== 'ok') push(); });

  // ---------- UI-примитивы ----------
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 2300);
  }
  function closeSheet(instant) {
    const r = $('#sheets'); r.classList.remove('open'); document.body.classList.remove('lock');
    const sh = r.querySelector('.sheet'); if (sh) sh.style.transform = '';
    if (instant) r.innerHTML = ''; else setTimeout(() => { if (!r.classList.contains('open')) r.innerHTML = ''; }, 360);
  }
  function openSheet(html, mount) {
    closeSheet(true);
    const r = $('#sheets');
    r.innerHTML = '<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div><div class="sbody">' + html + '</div></div>';
    document.body.classList.add('lock');
    requestAnimationFrame(() => requestAnimationFrame(() => r.classList.add('open')));
    r.querySelector('.scrim').onclick = () => closeSheet();
    const sh = r.querySelector('.sheet'), g = r.querySelector('.grab'); let y0 = null, dy = 0;
    g.onpointerdown = (e) => { y0 = e.clientY; dy = 0; g.setPointerCapture(e.pointerId); sh.style.transition = 'none'; };
    g.onpointermove = (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = 'translateY(' + dy + 'px)'; };
    const end = () => { if (y0 == null) return; y0 = null; sh.style.transition = ''; if (dy > 110) closeSheet(); else sh.style.transform = ''; };
    g.onpointerup = end; g.onpointercancel = end;
    if (mount) mount(r.querySelector('.sbody'));
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  function confirmSheet(text, okLabel, fn) {
    openSheet('<h2>' + esc(text) + '</h2><div class="stack"><button class="btn danger" id="cfok">' + esc(okLabel) + '</button><button class="btn" id="cfno">Отмена</button></div>', () => {
      $('#cfok').onclick = () => { closeSheet(); fn(); }; $('#cfno').onclick = () => closeSheet();
    });
  }
  const seg = (id, opts, val) => '<div class="seg" id="' + id + '" data-v="' + esc(val) + '">' + opts.map(([v, n]) => '<button type="button" data-v="' + esc(v) + '" class="' + (v === val ? 'on' : '') + '">' + esc(n) + '</button>').join('') + '</div>';
  function bindSeg(id, fn) {
    const s = $('#' + id); if (!s) return;
    s.querySelectorAll('button').forEach((b) => { b.onclick = () => { s.dataset.v = b.dataset.v; s.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); if (fn) fn(b.dataset.v); }; });
  }
  const segVal = (id) => $('#' + id).dataset.v;
  const head = (title, sub, acts) => '<div class="head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div><div class="acts">' + (acts || '') + '</div></div>';
  const plusBtn = (id, label) => '<button class="ib" id="' + id + '" aria-label="' + esc(label) + '">' + ico('plus') + '</button>';
  function paint(html, animate) {
    const v = $('#view'); v.innerHTML = html; v.classList.remove('enter');
    if (animate !== false) { void v.offsetWidth; v.classList.add('enter'); }
  }

  // ---------- профиль ----------
  function mondayOf(dateStr) { const d = E.pd(dateStr); const dow = d.getUTCDay(); return E.addDays(dateStr, -(dow === 0 ? 6 : dow - 1)); }
  function nextMonday(dateStr) { return E.pd(dateStr).getUTCDay() === 1 ? dateStr : E.addDays(mondayOf(dateStr), 7); }
  function newProfile(f) {
    const p = {
      id: uid(), name: f.name || 'Я', module: f.module, target: { overall: f.overall, min: f.min }, test_date: f.test_date || '', hours: f.hours, start: f.start,
      skills: { L: f.L, R: f.R, W: f.W, S: f.S }, cards: CONTENT.cards.map((c, i) => E.newCard(c.f, c.b, 's' + i)),
      errors: [], days: {}, done: {}, mocks: [], subs: [], newPerDay: f.newPerDay || 10, newToday: { date: '', n: 0 },
    };
    DB.profiles[p.id] = p; DB.active = p.id; save();
  }
  function profileForm(p, label) {
    const v = p || { name: '', module: 'academic', target: { overall: 7.5, min: 7 }, hours: 13, start: nextMonday(today()), skills: { L: 4.5, R: 4.5, W: 4.5, S: 4.5 }, newPerDay: 10, test_date: '' };
    const band = (id, val) => '<input id="' + id + '" type="number" inputmode="decimal" step="0.5" min="1" max="9" value="' + val + '">';
    return '<form id="pf"><label>Имя</label><input id="f_name" value="' + esc(v.name) + '" autocomplete="off">' +
      '<label>Экзамен</label>' + seg('f_module', [['academic', 'Academic'], ['general', 'General']], v.module) +
      '<div class="grid2"><div><label>Цель overall</label>' + band('f_overall', v.target.overall) + '</div><div><label>Минимум по навыку</label>' + band('f_min', v.target.min) + '</div></div>' +
      '<label>Текущий уровень</label><div class="grid4">' + ['L', 'R', 'W', 'S'].map((s) => '<div>' + band('f_' + s, v.skills[s]) + '<div class="mut" style="text-align:center;margin-top:4px">' + s + '</div></div>').join('') + '</div>' +
      '<div class="grid2"><div><label>Часов в неделю</label><input id="f_hours" type="number" inputmode="numeric" min="3" max="40" value="' + v.hours + '"></div>' +
      '<div><label>Новых карточек/день</label><input id="f_new" type="number" inputmode="numeric" min="0" max="40" value="' + v.newPerDay + '"></div></div>' +
      '<div class="grid2"><div><label>Старт плана</label><input id="f_start" type="date" value="' + v.start + '"></div>' +
      '<div><label>Дата теста</label><input id="f_test" type="date" value="' + (v.test_date || '') + '"></div></div>' +
      '<div style="margin-top:20px"><button class="btn p" type="submit">' + label + '</button></div></form>';
  }
  function readProfileForm() {
    return {
      name: $('#f_name').value.trim(), module: segVal('f_module'), overall: num($('#f_overall').value, 7.5), min: num($('#f_min').value, 7),
      L: num($('#f_L').value, 4.5), R: num($('#f_R').value, 4.5), W: num($('#f_W').value, 4.5), S: num($('#f_S').value, 4.5),
      hours: num($('#f_hours').value, 13), newPerDay: num($('#f_new').value, 10), start: $('#f_start').value || nextMonday(today()), test_date: $('#f_test').value,
    };
  }

  // ---------- Сегодня ----------
  let viewDate = null, session_ = null;
  function dayFor(date) { const p = P(); if (!p.days[date]) p.days[date] = E.dayTasks(p, date, CONTENT, RES, p.errors); return p.days[date]; }
  function resLine(r) {
    if (!r) return '';
    const warn = r.status === 'user_provided' || r.status === 'to_verify' ? ' <span class="mut">· не проверено</span>' : '';
    if (r.url) return '<a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.name) + ' ↗</a>' + warn;
    return '<span class="mut">' + esc(r.name) + (r.search ? ' — поиск: «' + esc(r.search) + '»' : '') + '</span>';
  }
  // таймер (глобальный, переживает смену экранов)
  const timer = { end: 0 };
  setInterval(() => {
    const el = $('#tmt'); if (!timer.end) return;
    const s = Math.max(0, Math.round((timer.end - Date.now()) / 1000));
    if (el) el.textContent = p2(Math.floor(s / 60)) + ':' + p2(s % 60);
    if (s <= 0) { timer.end = 0; toast('Время вышло'); try { navigator.vibrate && navigator.vibrate(300); } catch (e) { /* ignore */ } if (el) el.textContent = '25 мин'; }
  }, 500);

  function viewToday() {
    const p = P(); const date = viewDate || today(); const isToday = date === today();
    const d = dayFor(date); const done = (p.done[date] = p.done[date] || {});
    const sum = () => { const tot = d.total || 1; const dn = d.tasks.filter((t) => done[t.id]).reduce((a, t) => a + t.minutes, 0); return { dn, tot, pct: Math.round(100 * dn / tot) }; };
    const s0 = sum();
    const sub = esc(fmtD(date, { weekday: 'long', day: 'numeric', month: 'long' })) + ' · неделя ' + d.week + ' · ' + esc(d.phaseName);
    const nav = '<button class="ib" id="dprev" aria-label="Вчера">' + ico('left') + '</button><button class="ib" id="dnext" aria-label="Завтра">' + ico('right') + '</button>';
    let h = head(isToday ? 'Сегодня' : fmtD(date), sub, nav);
    h += '<div class="sum"><span id="sdn">' + s0.dn + ' из ' + d.total + ' мин</span><span id="spc">' + s0.pct + '%</span></div><div class="bar" style="margin-bottom:16px"><i id="sbar" style="width:' + s0.pct + '%"></i></div>';
    h += '<div class="list">' + d.tasks.map((t) => {
      const more = (t.desc ? '<p>' + esc(t.desc) + '</p>' : '') + (t.resource ? '<div>' + resLine(t.resource) + '</div>' : '');
      return '<div class="task' + (done[t.id] ? ' done' : '') + '" data-id="' + esc(t.id) + '"><button class="cb" aria-label="Готово" aria-pressed="' + !!done[t.id] + '"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>' +
        '<div><button class="tbody"><div class="ttl">' + esc(t.title) + '</div><div class="tmeta">' + t.minutes + ' мин · ' + esc(SKN[t.skill] || t.skill) + '</div></button>' + (more ? '<div class="more"><div>' + more + '</div></div>' : '') + '</div></div>';
    }).join('') + '</div>';
    h += '<div class="list" style="margin-top:14px"><button class="rowi" id="tm"><span class="grow">Таймер фокуса</span><b id="tmt">' + (timer.end ? '…' : '25 мин') + '</b></button></div>';
    paint(h);
    $('#dprev').onclick = () => { viewDate = E.addDays(date, -1); route(); };
    $('#dnext').onclick = () => { const n = E.addDays(date, 1); viewDate = n === today() ? null : n; route(); };
    $$('.task').forEach((row) => {
      const id = row.dataset.id;
      row.querySelector('.cb').onclick = () => {
        if (done[id]) delete done[id]; else done[id] = true;
        row.classList.toggle('done', !!done[id]); row.querySelector('.cb').setAttribute('aria-pressed', !!done[id]);
        const s = sum(); $('#sdn').textContent = s.dn + ' из ' + d.total + ' мин'; $('#spc').textContent = s.pct + '%'; $('#sbar').style.width = s.pct + '%';
        if (done[id] && s.dn >= d.total) toast('День закрыт');
        save();
      };
      row.querySelector('.tbody').onclick = () => { if (row.querySelector('.more')) row.classList.toggle('open'); };
    });
    $('#tm').onclick = () => { if (timer.end) { timer.end = 0; $('#tmt').textContent = '25 мин'; } else { timer.end = Date.now() + 25 * 60000; $('#tmt').textContent = '25:00'; } };
  }

  // ---------- План ----------
  function viewPlan() {
    const p = P(); const t0 = today(); const week = E.weekNo(p.start, t0);
    const sev = E.errorSeverity(p.errors, t0); const w = E.weights(p, sev); const ph = E.phaseFor(week);
    let h = head('План', 'Неделя ' + week + ' из 52 · ' + esc(ph.name) + (p.test_date ? ' · до теста ' + Math.max(0, E.daysBetween(t0, p.test_date)) + ' дн.' : ''));
    h += '<h3>Время по навыкам · ' + p.hours + ' ч/нед</h3><div class="card stack">' + E.SK.map((s) =>
      '<div><div class="sum" style="margin-bottom:6px"><span><b style="color:var(--fg)">' + esc(SKN[s]) + '</b> · ' + p.skills[s] + ' → ' + p.target.overall + '</span><span>' + (w[s] * p.hours).toFixed(1) + ' ч · ' + Math.round(w[s] * 100) + '%</span></div><div class="bar"><i style="width:' + Math.round(w[s] * 100) + '%"></i></div></div>').join('') + '</div>';
    h += '<h3>Ближайшие дни</h3><div class="list">';
    for (let i = 0; i < 7; i++) {
      const dd = E.addDays(t0, i); const d = dayFor(dd);
      h += '<a class="rowi" href="#today" data-go="' + dd + '"><div class="grow"><b>' + esc(i === 0 ? 'Сегодня' : fmtD(dd, { weekday: 'short', day: 'numeric', month: 'short' })) + '</b><div class="mut" style="margin-top:2px">' + d.tasks.map((t) => esc(t.title.split(':')[0])).join(' · ') + '</div></div><span class="mut">' + d.total + ' мин</span>' + ico('chev', 'chev') + '</a>';
    }
    h += '</div><h3>Этапы</h3><div class="list">' + E.PHASES.map((f) =>
      '<div class="rowi"><div class="grow"><b' + (f.name === ph.name ? ' style="color:var(--acc)"' : '') + '>' + esc(f.name) + '</b><div class="mut" style="margin-top:2px">' + esc(f.goal) + '</div></div><span class="mut" style="text-align:right">' + fmtD(E.addDays(p.start, (f.from - 1) * 7)) + ' – ' + fmtD(E.addDays(p.start, f.to * 7 - 1)) + '</span></div>').join('') + '</div>';
    paint(h);
    $$('[data-go]').forEach((a) => { a.onclick = () => { viewDate = a.dataset.go === today() ? null : a.dataset.go; }; });
  }

  // ---------- Карточки ----------
  function viewCards() {
    const p = P(); const t0 = today();
    if (p.newToday.date !== t0) p.newToday = { date: t0, n: 0 };
    if (!session_ || session_.date !== t0) {
      const q = E.dueCards(p.cards, t0, p.newPerDay, p.newToday.n);
      session_ = { date: t0, queue: q.due.concat(q.fresh).map((c) => c.id), shown: false };
    }
    const seen = p.cards.filter((c) => c.seen).length;
    let h = head('Карточки', 'В очереди ' + session_.queue.length + ' · изучено ' + seen + ' из ' + p.cards.length, plusBtn('cplus', 'Добавить'));
    if (session_.queue.length) {
      const c = p.cards.find((x) => x.id === session_.queue[0]);
      h += '<div class="flash">' + esc(c.f) + '</div>';
      if (session_.shown) {
        h += '<div class="flash back">' + esc(c.b) + '</div><div class="grid4" style="margin-top:14px">' +
          [['0', 'Снова'], ['1', 'Трудно'], ['2', 'Хорошо'], ['3', 'Легко']].map(([q, n]) => '<button class="btn' + (q === '2' ? ' p' : '') + '" style="padding:0" data-q="' + q + '">' + n + '</button>').join('') + '</div>' +
          '<p class="mut" style="text-align:center;margin-top:14px">Слово выучено, когда ты применил его в Writing или Speaking.</p>';
      } else h += '<div style="margin-top:14px"><button class="btn p" id="show">Показать ответ</button></div>';
    } else h += '<div class="card" style="text-align:center;padding:36px 16px"><div class="big">✓</div><div class="mut" style="margin-top:6px">На сегодня всё · новых ' + p.newToday.n + '/' + p.newPerDay + '</div></div>';
    paint(h, !session_.shown);
    if ($('#show')) $('#show').onclick = () => { session_.shown = true; route(false); };
    $$('button[data-q]').forEach((b) => b.onclick = () => {
      const c = p.cards.find((x) => x.id === session_.queue[0]); const q = +b.dataset.q;
      if (!c.seen) p.newToday.n += 1;
      E.review(c, q, t0); session_.queue.shift(); if (q === 0) session_.queue.push(c.id);
      session_.shown = false; save(); route(true);
    });
    $('#cplus').onclick = () => openSheet('<h2>Новая карточка</h2><div class="stack"><input id="cf" placeholder="Вопрос / контекст" autocomplete="off"><input id="cb" placeholder="Ответ: chunk + пример" autocomplete="off"><button class="btn p" id="cadd">Добавить</button></div>' +
      '<h3>Импорт</h3><textarea id="csv" placeholder="front;back — по одной на строку"></textarea><div style="margin-top:10px"><button class="btn" id="cimp">Импортировать</button></div>', () => {
      $('#cadd').onclick = () => { const f = $('#cf').value.trim(), b = $('#cb').value.trim(); if (!f || !b) { toast('Заполни оба поля'); return; } p.cards.push(E.newCard(f, b)); session_ = null; save(); closeSheet(); toast('Добавлено'); route(); };
      $('#cimp').onclick = () => {
        let n = 0; $('#csv').value.split('\n').map((l) => l.trim()).filter(Boolean).forEach((l) => { const i = l.indexOf(';'); if (i > 0) { p.cards.push(E.newCard(l.slice(0, i).trim(), l.slice(i + 1).trim())); n++; } });
        session_ = null; save(); closeSheet(); toast('Добавлено: ' + n); route();
      };
    });
  }

  // ---------- Ошибки ----------
  function viewErrors() {
    const p = P(); const t0 = today(); const sev = E.errorSeverity(p.errors, t0);
    const top = Object.keys(sev).sort((a, b) => sev[b] - sev[a]).slice(0, 5);
    let h = head('Ошибки', p.errors.length ? 'Записей: ' + p.errors.length : 'Пока пусто', plusBtn('eplus', 'Добавить'));
    if (top.length) h += '<div class="chips" style="margin-bottom:14px">' + top.map((t) => '<span class="chip on" style="flex:none">' + esc(t) + ' · ' + p.errors.filter((e) => e.tag === t && e.date >= E.addDays(t0, -30)).length + '</span>').join('') + '</div>';
    if (p.errors.length) h += '<div class="list">' + p.errors.slice().reverse().slice(0, 100).map((e) => '<button class="rowi" data-e="' + esc(e.id) + '"><div class="grow"><div><span class="chip">' + esc(e.tag) + '</span> <span class="mut">' + esc(fmtD(e.date)) + '</span></div><div style="margin-top:6px">' + esc(e.snippet) + (e.fix ? ' <span class="mut">→</span> <b>' + esc(e.fix) + '</b>' : '') + '</div></div></button>').join('') + '</div>';
    else h += '<div class="card mut" style="text-align:center;padding:28px">Записывай ошибки из тестов и проверок: самые частые попадут в задания.</div>';
    paint(h);
    $('#eplus').onclick = () => openSheet('<h2>Новая ошибка</h2><div class="stack"><select id="etag">' + TAGS.map((t) => '<option>' + t + '</option>').join('') + '</select><input id="esn" placeholder="Фрагмент с ошибкой" autocomplete="off"><input id="efx" placeholder="Правильно" autocomplete="off"><button class="btn p" id="eadd">Добавить</button></div>', () => {
      $('#eadd').onclick = () => { const s = $('#esn').value.trim(); if (!s) { toast('Укажи фрагмент'); return; } p.errors.push({ id: uid(), date: t0, tag: $('#etag').value, snippet: s, fix: $('#efx').value.trim() }); delete p.days[t0]; save(); closeSheet(); toast('Записано'); route(); };
    });
    $$('[data-e]').forEach((b) => b.onclick = () => {
      const e = p.errors.find((x) => x.id === b.dataset.e);
      confirmSheet('Удалить запись «' + e.snippet.slice(0, 40) + '»?', 'Удалить', () => { p.errors = p.errors.filter((x) => x.id !== e.id); save(); toast('Удалено'); route(); });
    });
  }

  // ---------- Проверка ----------
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
  const KINDS = [['t2', 'Task 2'], ['t1', 'Task 1'], ['gt', 'Письмо'], ['sp', 'Speaking']];
  let ckKind = 't2';
  function viewCheck() {
    const p = P();
    let h = head('Проверка', 'Промпт для ИИ-экзаменатора', plusBtn('cscore', 'Записать оценку'));
    h += seg('ck', KINDS, ckKind) + '<label>Задание</label><textarea id="cq" style="min-height:64px" placeholder="Вопрос Task 2 или тема Speaking"></textarea>' +
      '<label>Твой текст <span id="wc">· 0 слов</span></label><textarea id="ct" style="min-height:180px" spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>' +
      '<div style="margin-top:14px"><button class="btn p" id="cbuild">Скопировать промпт</button></div><p class="mut">Вставь его в любой ИИ (лучше в два). Бери нижнюю границу; если оценки расходятся больше чем на 0.5 — результат спорный.</p>';
    if (p.subs.length) h += '<h3>История оценок</h3><div class="list">' + p.subs.slice().reverse().slice(0, 30).map((s) => '<div class="rowi"><div class="grow"><b>' + esc((KINDS.find((k) => k[0] === s.kind) || [0, s.kind])[1]) + '</b> <span class="mut">· ' + esc(fmtD(s.date)) + (s.note ? ' · ' + esc(s.note) : '') + '</span></div><b>' + esc(s.avg) + '</b></div>').join('') + '</div>';
    paint(h);
    bindSeg('ck', (v) => { ckKind = v; });
    $('#ct').oninput = () => { $('#wc').textContent = '· ' + $('#ct').value.trim().split(/\s+/).filter(Boolean).length + ' слов'; };
    $('#cbuild').onclick = () => {
      if (!$('#ct').value.trim()) { toast('Вставь свой текст'); return; }
      const t = buildPrompt(segVal('ck'), $('#cq').value, $('#ct').value);
      const done = () => toast('Промпт скопирован');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => toast('Не удалось скопировать'));
      else { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Не удалось скопировать'); } ta.remove(); }
    };
    $('#cscore').onclick = () => openSheet('<h2>Оценка</h2>' + seg('sk', KINDS, ckKind) + '<label>Четыре критерия</label><div class="grid4">' + [1, 2, 3, 4].map((i) => '<input id="sc' + i + '" type="number" inputmode="decimal" step="0.5" min="1" max="9">').join('') + '</div><label>Заметка</label><input id="snote" autocomplete="off"><div style="margin-top:16px"><button class="btn p" id="ssave">Сохранить</button></div>', () => {
      bindSeg('sk');
      $('#ssave').onclick = () => {
        const sc = [1, 2, 3, 4].map((i) => num($('#sc' + i).value, NaN)); if (sc.some(isNaN)) { toast('Заполни 4 оценки'); return; }
        p.subs.push({ id: uid(), date: today(), kind: segVal('sk'), sc, avg: E.overall(sc[0], sc[1], sc[2], sc[3]), note: $('#snote').value.trim() }); save(); closeSheet(); toast('Сохранено'); route();
      };
    });
  }

  // ---------- Прогресс ----------
  function viewProgress() {
    const p = P(); const t0 = today();
    let h = head('Прогресс', p.mocks.length ? 'Последний мок: ' + p.mocks[p.mocks.length - 1].overall : 'Моков пока нет', plusBtn('mplus', 'Новый мок'));
    h += '<div class="grid4">' + E.SK.map((s) => '<div class="card tile"><div class="mut">' + s + '</div><b>' + p.skills[s] + '</b><div class="mut">→ ' + p.target.overall + '</div></div>').join('') + '</div>';
    if (p.mocks.length) h += '<h3>Моки</h3><div class="list">' + p.mocks.slice().reverse().map((m) => '<div class="rowi"><div class="grow"><b>' + esc(fmtD(m.date, { day: 'numeric', month: 'long' })) + '</b><div class="mut" style="margin-top:2px">L ' + m.L + ' · R ' + m.R + ' · W ' + m.W + ' · S ' + m.S + '</div></div><span class="big" style="font-size:22px">' + m.overall + '</span></div>').join('') + '</div>';
    const wk = {}; Object.keys(p.days).forEach((d) => { const dd = p.days[d]; const dn = p.done[d] || {}; const k = dd.week; wk[k] = wk[k] || { plan: 0, done: 0 }; dd.tasks.forEach((t) => { wk[k].plan += t.minutes; if (dn[t.id]) wk[k].done += t.minutes; }); });
    const ks = Object.keys(wk).map(Number).sort((a, b) => b - a).slice(0, 8);
    if (ks.length) h += '<h3>Выполнение по неделям</h3><div class="card stack">' + ks.map((k) => { const pc = Math.round(100 * wk[k].done / Math.max(1, wk[k].plan)); return '<div><div class="sum" style="margin-bottom:6px"><span>Неделя ' + k + '</span><span>' + wk[k].done + ' / ' + wk[k].plan + ' мин</span></div><div class="bar"><i style="width:' + pc + '%"></i></div></div>'; }).join('') + '</div>';
    paint(h);
    $('#mplus').onclick = () => openSheet('<h2>Новый мок</h2><div class="grid4">' + E.SK.map((s) => '<div><input id="m_' + s + '" type="number" inputmode="decimal" step="0.5" min="1" max="9"><div class="mut" style="text-align:center;margin-top:4px">' + s + '</div></div>').join('') + '</div>' +
      '<label style="display:flex;gap:10px;align-items:center;margin:16px 0"><input type="checkbox" id="m_up" checked style="width:20px;height:20px"> Обновить уровни в профиле</label><button class="btn p" id="msave">Сохранить</button>' +
      '<h3>Raw → band</h3><div class="grid2"><select id="rk"><option value="listening">Listening</option><option value="reading_' + p.module + '">Reading</option></select><input id="rr" type="number" inputmode="numeric" min="0" max="40" placeholder="Верных /40"></div><p class="mut" id="rout"></p>', () => {
      const calc = () => { const v = num($('#rr').value, NaN); $('#rout').textContent = isNaN(v) ? '' : '≈ band ' + E.rawToBand($('#rk').value, v) + ' (по таблице конкретного теста может отличаться)'; };
      $('#rr').oninput = calc; $('#rk').onchange = calc;
      $('#msave').onclick = () => {
        const v = {}; for (const s of E.SK) { v[s] = num($('#m_' + s).value, NaN); if (isNaN(v[s])) { toast('Заполни все 4 навыка'); return; } }
        p.mocks.push({ id: uid(), date: t0, L: v.L, R: v.R, W: v.W, S: v.S, overall: E.overall(v.L, v.R, v.W, v.S) });
        if ($('#m_up').checked) { E.SK.forEach((s) => { p.skills[s] = v[s]; }); Object.keys(p.days).forEach((d) => { if (d >= t0) delete p.days[d]; }); }
        save(); closeSheet(); toast('Мок сохранён'); route();
      };
    });
  }

  // ---------- Ресурсы ----------
  let resSkill = 'ALL', resQ = '', resRisk = false;
  function viewRes() {
    let h = head('Ресурсы', 'Бесплатные материалы') + '<input id="rq" type="search" placeholder="Поиск" value="' + esc(resQ) + '" autocomplete="off"><div class="chips" id="rs" style="margin:12px -18px 14px">' +
      ['ALL', 'L', 'R', 'W', 'S', 'V', 'G'].map((s) => '<button data-s="' + s + '" class="' + (s === resSkill ? 'on' : '') + '">' + (s === 'ALL' ? 'Все' : esc(SKN[s])) + '</button>').join('') + '</div><div id="rl"></div><div style="text-align:center"><button class="link" id="rrisk"></button></div>';
    paint(h);
    const draw = () => {
      const q = resQ.toLowerCase();
      const list = RES.filter((r) => (resSkill === 'ALL' || (r.skills || []).includes(resSkill) || (r.skills || []).includes('ALL')) && (resRisk || r.ru_risk !== true) && (!q || (r.name + ' ' + (r.tags || []).join(' ')).toLowerCase().includes(q)));
      $('#rl').innerHTML = '<div class="list">' + list.map((r) => {
        const inner = '<div class="grow"><b>' + esc(r.name) + '</b><div class="mut" style="margin-top:2px">' + esc((r.skills || []).join(' ')) + ' · ' + esc(r.level) + ' · ' + esc(r.cost) + (r.status === 'user_provided' || r.status === 'to_verify' ? ' · не проверено' : '') + (r.ru_risk ? ' · ограничен в РФ' : '') + '</div>' + (r.notes ? '<div class="mut" style="margin-top:4px">' + esc(String(r.notes).slice(0, 140)) + '</div>' : '') + '</div>';
        return r.url ? '<a class="rowi" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>' : '<div class="rowi">' + inner + '</div>';
      }).join('') + '</div>';
      $('#rrisk').textContent = resRisk ? 'Скрыть недоступные в РФ' : 'Показать недоступные в РФ';
    };
    $('#rq').oninput = (e) => { resQ = e.target.value; draw(); };
    $$('#rs button').forEach((b) => b.onclick = () => { resSkill = b.dataset.s; $$('#rs button').forEach((x) => x.classList.toggle('on', x === b)); draw(); });
    $('#rrisk').onclick = () => { resRisk = !resRisk; draw(); };
    draw();
  }

  // ---------- Настройки ----------
  function viewSet() {
    const p = P();
    let h = head('Настройки', esc(user ? user.email : '')) + '<div class="list"><div class="rowi"><span class="grow">Синхронизация</span><span class="mut" id="sst">' + ({ ok: 'всё сохранено', pending: 'сохраняю…', error: 'нет связи' }[syncState]) + '</span></div><button class="rowi" id="regen"><span class="grow">Пересоздать план на сегодня</span></button><button class="rowi" id="exp"><span class="grow">Скачать копию данных</span></button><button class="rowi" id="out"><span class="grow" style="color:#dc2626">Выйти</span></button></div>';
    h += '<h3>Профиль</h3>' + profileForm(p, 'Сохранить');
    paint(h);
    bindSeg('f_module');
    $('#pf').onsubmit = (e) => {
      e.preventDefault(); const f = readProfileForm();
      Object.assign(p, { name: f.name || p.name, module: f.module, target: { overall: f.overall, min: f.min }, hours: f.hours, newPerDay: f.newPerDay, start: f.start, test_date: f.test_date, skills: { L: f.L, R: f.R, W: f.W, S: f.S } });
      p.days = {}; session_ = null; save(); toast('Профиль сохранён');
    };
    $('#regen').onclick = () => { delete p.days[today()]; save(); toast('План обновлён'); };
    $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(DB)], { type: 'application/json' })); a.download = 'ielts-teacher-' + today() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
    $('#out').onclick = () => confirmSheet('Выйти из аккаунта?', 'Выйти', async () => { await push(); await Cloud.signOut(); });
  }

  function viewOnboarding() {
    paint(head('Привет', 'Заполни анкету — план соберётся сам') + profileForm(null, 'Создать план'));
    bindSeg('f_module');
    $('#pf').onsubmit = (e) => { e.preventDefault(); newProfile(readProfileForm()); session_ = null; location.hash = '#today'; route(); };
  }

  // ---------- вход ----------
  function viewAuth() {
    $('#tabs').hidden = true;
    let signup = false;
    paint('<div class="auth"><h1>IELTS Teacher</h1><p class="sub">Войди — данные будут на всех твоих устройствах</p><form id="af"><input id="ae" type="email" inputmode="email" autocomplete="email" autocapitalize="none" autocorrect="off" placeholder="Email" required><input id="ap" type="password" autocomplete="current-password" placeholder="Пароль" minlength="6" required><div class="err" id="aerr"></div><button class="btn p" id="asub" type="submit">Войти</button></form><div style="text-align:center;margin-top:8px"><button class="link" id="atog" type="button">Нет аккаунта? Создать</button></div></div>');
    $('#atog').onclick = () => { signup = !signup; $('#asub').textContent = signup ? 'Создать аккаунт' : 'Войти'; $('#atog').textContent = signup ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'; $('#ap').autocomplete = signup ? 'new-password' : 'current-password'; $('#aerr').textContent = ''; };
    $('#af').onsubmit = async (e) => {
      e.preventDefault(); const b = $('#asub'); b.disabled = true; $('#aerr').textContent = '';
      try {
        const em = $('#ae').value.trim(), pw = $('#ap').value;
        const r = signup ? await Cloud.signUp(em, pw) : await Cloud.signIn(em, pw);
        if (r.error) throw r.error;
        if (!r.data.session) { $('#aerr').style.color = 'var(--mut)'; $('#aerr').textContent = 'Проверь почту и подтверди email, затем войди.'; b.disabled = false; return; }
        await start(r.data.session.user);
      } catch (err) {
        const m = String(err.message || err);
        $('#aerr').style.color = ''; $('#aerr').textContent = /Invalid login/i.test(m) ? 'Неверный email или пароль' : /not confirmed/i.test(m) ? 'Сначала подтверди email по ссылке из письма' : /already registered/i.test(m) ? 'Такой аккаунт уже есть — войди' : /fetch|network/i.test(m) ? 'Нет связи с сервером' : m;
        b.disabled = false;
      }
    };
  }

  // ---------- маршрутизация ----------
  const TABS = [['today', 'Сегодня'], ['plan', 'План'], ['cards', 'Карточки'], ['errors', 'Ошибки']];
  const MORE = [['progress', 'Прогресс'], ['check', 'Проверка'], ['res', 'Ресурсы'], ['set', 'Настройки']];
  function renderTabs(tab) {
    const t = $('#tabs'); t.hidden = false;
    const inMore = MORE.some((m) => m[0] === tab);
    t.innerHTML = TABS.map(([k, n]) => '<a href="#' + k + '" class="' + (k === tab ? 'on' : '') + '">' + ico(k) + n + '</a>').join('') + '<button id="tmore" class="' + (inMore ? 'on' : '') + '">' + ico('more') + (inMore ? MORE.find((m) => m[0] === tab)[1] : 'Ещё') + '</button>';
    $('#tmore').onclick = () => openSheet('<div class="list">' + MORE.map(([k, n]) => '<a class="rowi" href="#' + k + '"><span class="grow">' + n + '</span>' + ico('chev', 'chev') + '</a>').join('') + '</div>', (el) => { el.querySelectorAll('a').forEach((a) => { a.onclick = () => closeSheet(); }); });
  }
  function route(animate) {
    if (!user) return viewAuth();
    closeSheet(true);
    const tab = (location.hash || '#today').slice(1);
    if (!DB.active || !P()) { $('#tabs').hidden = true; return viewOnboarding(); }
    renderTabs(tab);
    ({ today: viewToday, plan: viewPlan, cards: viewCards, errors: viewErrors, check: viewCheck, progress: viewProgress, res: viewRes, set: viewSet }[tab] || viewToday)();
    if (animate === false) $('#view').classList.remove('enter');
    window.scrollTo(0, 0);
  }

  async function start(u) {
    user = u; session_ = null;
    const local = readLocal(); let remote = null, offline = false;
    try { remote = await Cloud.pull(u.id); } catch (e) { offline = true; }
    let legacy = null; try { legacy = JSON.parse(localStorage.getItem(LEGACY)); } catch (e) { /* ignore */ }
    const has = (d) => d && d.profiles && Object.keys(d.profiles).length;
    let upload = false;
    if (local && local.dirty && has(local.db)) { DB = local.db; upload = true; }
    else if (!offline && remote && has(remote.data)) DB = remote.data;
    else if (local && has(local.db)) { DB = local.db; upload = !offline && !(remote && has(remote.data)); }
    else if (has(legacy)) { DB = legacy; upload = true; }
    else DB = { profiles: {}, active: null };
    if (!DB.active || !DB.profiles[DB.active]) DB.active = Object.keys(DB.profiles)[0] || null;
    writeLocal(upload || offline); syncState = upload ? 'pending' : 'ok';
    if (upload) push();
    if (offline) toast('Нет связи — работаю с кэшем');
    route();
  }

  async function init() {
    try {
      const [c, r] = await Promise.all([fetch('data/content.json').then((x) => x.json()), fetch('data/resources.json').then((x) => x.json())]);
      CONTENT = c; RES = r;
    } catch (e) { $('#view').textContent = 'Не удалось загрузить данные: ' + e.message; return; }
    window.addEventListener('hashchange', () => route());
    if (!Cloud.available()) { $('#view').textContent = 'Не загрузилась библиотека входа. Обнови страницу.'; return; }
    Cloud.onAuth((ev) => { if (ev === 'SIGNED_OUT') { user = null; DB = { profiles: {}, active: null }; route(); } });
    try { session = await Cloud.session(); } catch (e) { session = null; }
    if (session) await start(session.user); else route();
  }
  init();
})();
