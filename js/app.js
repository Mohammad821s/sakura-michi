/* درب الساكورا — منطق البرنامج */
(function () {
  'use strict';
  const D = window.DATA, STROKES = window.STROKES || {}, Garden = window.Garden || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';

  function h(tag, attrs) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
      else if (k === 'on') for (const ev in v) e.addEventListener(ev, v[ev]); else e.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) { const c = arguments[i]; if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(c)); }
    return e;
  }
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickN = (a, n) => shuffle(a).slice(0, n);
  const today = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5); };
  const ICON_SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>';
  const ICON_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/></svg>';

  /* ================= الحروف ================= */
  const ITEMS = {}, ORDER = { h: [], k: [] };
  const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
  const toHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const CONS = { k: 'ك', s: 'س', t: 'ت', n: 'ن', h: 'ه', m: 'م', y: 'ي', r: 'ر', w: 'و', g: 'گ', z: 'ز', d: 'د', b: 'ب', p: 'پ' };
  const VOW = ['ا', 'ي', 'ُ', 'يه', 'و'], VOW0 = ['آ', 'إي', 'أُ', 'إيه', 'أو'];
  const HX = { 'し': 'شي', 'ち': 'تشي', 'つ': 'تسُ', 'ふ': 'فُ', 'じ': 'جي', 'ぢ': 'جي', 'づ': 'زُ', 'を': 'أو', 'ん': 'نْ', 'っ': 'وقفة قصيرة' };
  const YC = { 'き': 'كْي', 'し': 'ش', 'ち': 'تش', 'に': 'نْي', 'ひ': 'هْي', 'み': 'مْي', 'り': 'رْي', 'ぎ': 'گْي', 'じ': 'ج', 'び': 'بْي', 'ぴ': 'پْي' };
  const YV = { 'ゃ': 'ا', 'ゅ': 'ُو', 'ょ': 'و' };
  const STAGES = [
    { key: 'h1', script: 'h', title: 'الهيراغانا', items: [] }, { key: 'h2', script: 'h', title: 'الأصوات المصوّتة', items: [] },
    { key: 'h3', script: 'h', title: 'الحروف المركّبة', items: [] }, { key: 'k1', script: 'k', title: 'الكاتاكانا', items: [] },
    { key: 'k2', script: 'k', title: 'الكاتاكانا المصوّتة', items: [] }
  ];
  function add(id, script, st, hint) { ITEMS[id] = { id, script, stage: st, hint }; STAGES[st].items.push(id); ORDER[script].push(id); }
  (function build() {
    const rows = (R, sh, sk) => R.forEach(r => [...r[1]].forEach((ch, i) => {
      if (ch === ' ') return;
      const hint = HX[ch] || (r[0] === '' ? VOW0[i] : r[0] === 'N' ? 'نْ' : CONS[r[0]] + VOW[i]);
      add(ch, 'h', sh, hint); add(toKata(ch), 'k', sk, hint);
    }));
    rows(D.ROWS, 0, 3); rows(D.VROWS, 1, 4);
    add('っ', 'h', 2, HX['っ']); add('ッ', 'k', 4, HX['っ']);
    D.YOON.forEach(y => add(y, 'h', 2, YC[y[0]] + YV[y[1]]));
  })();

  const SMALLY = 'ゃゅょャュョ', SMALLV = 'ァィゥェォ';
  function segs(text) {
    const out = [];
    for (const ch of text) {
      const last = out[out.length - 1];
      if (SMALLY.includes(ch) && last && last.id) { last.s += ch; if (ITEMS[last.s]) last.id = last.s; continue; }
      if (SMALLV.includes(ch)) { const big = String.fromCharCode(ch.charCodeAt(0) + 1); out.push({ s: ch, id: ITEMS[big] ? big : null }); continue; }
      out.push({ s: ch, id: ITEMS[ch] ? ch : null });
    }
    return out;
  }
  const ALLW = D.WORDS.concat(D.KWORDS);
  const BYK = {};
  ALLW.forEach(w => { w.t = [...new Set(segs(w.k).filter(s => s.id).map(s => s.id))]; BYK[w.k] = w; });
  D.SENT.forEach(w => { w.t = [...new Set(segs(w.k).filter(s => s.id).map(s => s.id))]; });
  D.CHUNKS.forEach(c => { c.ex = c.ex.map(a => ({ k: a[0], m: a[1], j: a[2], s: 1 })); });

  /* ================= الحالة والحفظ ================= */
  const LSKEY = 'sakura-michi-v1';
  const defaults = () => ({ v: 1, ts: 0, items: {}, w: {}, days: {}, streak: 0, last: 0, lessons: 0, lessonDay: 0, shadow: 0, chunk: 0, set: { engine: 'auto', rate: 1, sfx: true, per: 5 } });
  let st = defaults();
  function adopt(o) { const d = defaults(); if (!o || typeof o !== 'object') return d; Object.assign(d, o); d.set = Object.assign(defaults().set, o.set || {}); return d; }
  try { const raw = localStorage.getItem(LSKEY); if (raw) st = adopt(JSON.parse(raw)); } catch (e) { }
  let cloud = null, cloudBusy = false, cloudDirty = false, cloudTimer = 0;
  function touch() {
    st.ts = Date.now();
    try { localStorage.setItem(LSKEY, JSON.stringify(st)); } catch (e) { }
    if (cloud) { cloudDirty = true; clearTimeout(cloudTimer); cloudTimer = setTimeout(push, 2500); }
  }
  async function push() {
    if (!cloud || cloudBusy || !cloudDirty) return;
    cloudBusy = true; cloudDirty = false;
    try { await cloud.set({ ts: st.ts, json: JSON.stringify(st) }); } catch (e) { }
    cloudBusy = false; if (cloudDirty) cloudTimer = setTimeout(push, 2500);
  }
  async function initCloud() {
    try {
      if (!window.claude || !window.claude.use) return;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const id = await user.id(); if (!id) return;
      const doc = db.doc('data/users/' + id + '/progress');
      const snap = await doc.get(); cloud = doc;
      if (snap.exists) {
        const d = snap.data();
        if (d && d.ts > st.ts && d.json) { st = adopt(JSON.parse(d.json)); try { localStorage.setItem(LSKEY, JSON.stringify(st)); } catch (e) { } if (!run && tab === 'home') renderHome(true); else syncTree(true); }
        else if (st.ts > ((d && d.ts) || 0)) { cloudDirty = true; push(); }
      } else if (st.ts) { cloudDirty = true; push(); }
    } catch (e) { }
  }

  /* ================= المراجعة المتباعدة ================= */
  const IV = [0, 1, 2, 4, 8, 16, 32, 64];
  function grade(map, id, ok) {
    const o = map[id] || (map[id] = { b: 0, d: today(), n: 0 });
    o.n++; o.b = ok ? Math.min(7, o.b + 1) : Math.max(0, o.b - 2); o.d = today() + IV[o.b]; touch();
    if (map === st.items) syncTree();
  }
  const learned = id => !!st.items[id];
  const levelOf = id => { const o = st.items[id]; if (!o) return { lv: 0 }; return { lv: o.b >= 1 ? 3 : 1, wilt: o.b >= 1 && o.d < today() - 2 }; };
  const readable = w => w.t.every(learned);
  function syncTree(instant) { if (!Garden.ok) return; const L = {}; for (const id in ITEMS) L[id] = levelOf(id); Garden.setLevels(L, instant); }

  function nextLesson() {
    const stage = STAGES.find(s => s.items.some(id => !learned(id)));
    if (!stage) return null;
    let rem = stage.items.filter(id => !learned(id));
    const first = rem.length === stage.items.length;
    const per = stage.key === 'h3' ? 7 : stage.key === 'k2' ? st.set.per + 1 : st.set.per;
    const have = new Set(Object.keys(st.items)), lesson = [];
    const before = ALLW.filter(w => w.t.every(id => have.has(id)));
    while (lesson.length < per && rem.length) {
      const room = per - lesson.length;
      const cands = ALLW.map(w => ({ w, miss: w.t.filter(id => !have.has(id)) }))
        .filter(c => c.miss.length > 0 && c.miss.length <= room && c.miss.every(id => rem.includes(id)))
        .sort((a, b) => (b.w.e - a.w.e) || (a.miss.length - b.miss.length) || (a.w.k.length - b.w.k.length));
      const take = cands.length ? cands[0].miss : [rem[0]];
      take.forEach(id => { lesson.push(id); have.add(id); }); rem = rem.filter(id => !have.has(id));
    }
    const unlocked = ALLW.filter(w => w.t.every(id => have.has(id)) && !before.includes(w)).sort((a, b) => b.e - a.e);
    return { stage, items: lesson, first, unlocked };
  }

  /* ================= الصوت ================= */
  const Voice = {
    ja: [], tts: null, n: 0, warned: false,
    init() {
      if ('speechSynthesis' in window) {
        const load = () => { try { Voice.all = speechSynthesis.getVoices(); Voice.ja = Voice.all.filter(v => /^ja/i.test(v.lang)); } catch (e) { } };
        load(); try { speechSynthesis.onvoiceschanged = load; } catch (e) { }
      }
      if (window.claude && window.claude.use) window.claude.use('tts').then(t => { Voice.tts = t; }).catch(() => { });
    },
    engine() {
      const synth = 'speechSynthesis' in window, p = st.set.engine;
      if (p === 'claude' && Voice.tts) return 'claude';
      if (p === 'browser' && synth) return 'browser';
      if (synth && (Voice.ja.length || !(Voice.all && Voice.all.length))) return 'browser';
      if (Voice.tts) return 'claude';
      return synth ? 'browser' : null;
    },
    speak(text, slow) {
      const eng = Voice.engine(); Voice.n++;
      if (!eng) { if (!Voice.warned) { Voice.warned = true; toast('الصوت غير متاح هنا. افتح الصفحة في متصفح Chrome.'); } return Promise.resolve(false); }
      if (eng === 'claude') {
        return Voice.tts.speak(text, { language: 'ja', voice: Voice.n % 2 ? 'buttery' : 'glassy', rate: Math.max(.7, Math.min(1.5, (slow ? .72 : 1) * st.set.rate)) }).then(() => true).catch(() => false);
      }
      return new Promise(res => {
        try {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP';
          if (Voice.ja.length > 1) u.voice = Voice.ja[Voice.n % Voice.ja.length];
          else { if (Voice.ja.length) u.voice = Voice.ja[0]; u.pitch = Voice.n % 2 ? 1.05 : .7; }
          u.rate = (slow ? .55 : .85) * st.set.rate;
          let fin = false; const end = ok => { if (!fin) { fin = true; res(ok); } };
          u.onend = () => end(true); u.onerror = () => end(false);
          setTimeout(() => end(true), 9000);
          speechSynthesis.speak(u);
        } catch (e) { res(false); }
      });
    }
  };
  const sayItem = id => Voice.speak(id === 'っ' ? 'きって' : id === 'ッ' ? 'ベッド' : id);
  const sayWord = (w, slow) => Voice.speak(w.s && w.j ? w.j : w.k, slow);
  function spkBtn(fn, big) {
    const b = h('button', { class: 'spk' + (big ? ' big' : ''), type: 'button', html: ICON_SPK, 'aria-label': 'استمع' });
    b.addEventListener('click', () => { b.classList.add('playing'); Promise.resolve(fn()).then(() => b.classList.remove('playing')); });
    return b;
  }

  const Sfx = {
    ctx: null,
    get() { if (!st.set.sfx) return null; try { if (!Sfx.ctx) Sfx.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (Sfx.ctx.state === 'suspended') Sfx.ctx.resume(); return Sfx.ctx; } catch (e) { return null; } },
    pluck(f, vol, dur, when) {
      const c = Sfx.get(); if (!c) return; const t = c.currentTime + (when || 0);
      [[1, 'triangle', 1], [2, 'sine', .35], [3.01, 'sine', .12]].forEach(p => {
        const o = c.createOscillator(), g = c.createGain(); o.type = p[1]; o.frequency.setValueAtTime(f * p[0] * 1.012, t); o.frequency.exponentialRampToValueAtTime(f * p[0], t + .06);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * p[2], t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dur / p[0] ** .5);
        o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .1);
      });
    },
    k: 0,
    koto() { const sc = [293.66, 311.13, 392, 440, 466.16, 587.33, 622.25, 784]; Sfx.pluck(sc[Sfx.k++ % sc.length], .22, 1.3); },
    bell() { const c = Sfx.get(); if (!c) return;[[1318.5, .16, 2.6], [1975.5, .07, 1.8], [2637, .04, 1.2]].forEach(p => { const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.frequency.value = p[0]; g.gain.setValueAtTime(p[1], t); g.gain.exponentialRampToValueAtTime(.0001, t + p[2]); o.connect(g).connect(c.destination); o.start(t); o.stop(t + p[2] + .1); }); },
    low() { const c = Sfx.get(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(120, t + .22); g.gain.setValueAtTime(.2, t); g.gain.exponentialRampToValueAtTime(.0001, t + .3); o.connect(g).connect(c.destination); o.start(t); o.stop(t + .35); },
    wood() { const c = Sfx.get(); if (!c) return; const t = c.currentTime, n = c.createBuffer(1, 2400, c.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 300); const s = c.createBufferSource(); s.buffer = n; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 3; const g = c.createGain(); g.gain.value = .7; s.connect(f).connect(g).connect(c.destination); s.start(t); },
    chord() { [293.66, 440, 587.33, 784].forEach((f, i) => Sfx.pluck(f, .18, 2, i * .11)); }
  };

  /* ================= التعرف على الكلام ================= */
  const Mic = {
    d: null, off: false, text: '', onText: null, onState: null,
    init() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR && !navigator.brave && !(window.claude && window.claude.use)) { Mic.d = webSR(SR); return; }
      if (!window.claude || !window.claude.use) return;
      window.claude.use('dictation').then(d => {
        if (!d) return; Mic.d = d;
        d.onFinal(e => { Mic.text += e.text; if (Mic.onText) Mic.onText(Mic.text, true); });
        d.onPartial(e => { if (Mic.onText) Mic.onText(Mic.text + e.text, false); });
        d.onState(e => { if (Mic.onState) Mic.onState(e); });
      }).catch(() => { });
    },
    ready() { return !!Mic.d && !Mic.off; }
  };
  function webSR(SR) {
    let r = null, fin = null, par = null, stt = null, ended = null;
    const set = (state, reason) => { if (stt) stt({ state, reason }); };
    return {
      onFinal(f) { fin = f; }, onPartial(f) { par = f; }, onState(f) { stt = f; },
      start() {
        return new Promise((res, rej) => {
          try {
            r = new SR(); r.lang = 'ja-JP'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 3;
            r.onstart = () => { set('listening'); res(); };
            r.onresult = e => {
              let interim = '';
              for (let i = e.resultIndex; i < e.results.length; i++) {
                const x = e.results[i];
                if (x.isFinal) { if (fin) fin({ text: x[0].transcript }); } else interim += x[0].transcript;
              }
              if (par) par({ text: interim });
            };
            r.onerror = e => { const c = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'not_granted' : e.error === 'network' ? 'unavailable' : e.error === 'no-speech' ? 'stopped' : 'upstream_error'; rej({ code: c }); };
            r.onend = () => { set('idle', 'stopped'); if (ended) { ended(); ended = null; } r = null; };
            set('starting'); r.start();
          } catch (e) { rej({ code: 'unavailable' }); }
        });
      },
      stop() { return new Promise(res => { if (!r) return res(); ended = res; try { r.stop(); } catch (e) { res(); } }); }
    };
  }
  /* تسجيل صوت المستخدم لمقارنته بالنطق الصحيح */
  const Rec = {
    ok: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder) && !(window.claude && window.claude.use),
    url: null
  };
  function recBtn(w) {
    const wrap = h('div', { class: 'recbox' });
    const b = btn('سجّل صوتك', null, 'btn-ink'), play = btn('اسمع نفسك ثم الصحيح', null, 'btn-ink'); play.hidden = true;
    let mr = null, chunks = [], stream = null, tm = 0;
    const stopRec = () => { clearTimeout(tm); if (mr && mr.state !== 'inactive') mr.stop(); };
    b.addEventListener('click', async () => {
      if (mr && mr.state === 'recording') return stopRec();
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        chunks = []; mr = new MediaRecorder(stream);
        mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        mr.onstop = () => {
          stream.getTracks().forEach(t => t.stop()); b.textContent = 'سجّل مرة أخرى'; b.classList.remove('on');
          if (Rec.url) URL.revokeObjectURL(Rec.url); Rec.url = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
          play.hidden = false; play.click();
        };
        mr.start(); b.textContent = 'أوقف التسجيل'; b.classList.add('on'); tm = setTimeout(stopRec, 8000);
      } catch (e) { toast('لم أستطع فتح الميكروفون. اسمح للمتصفح باستخدامه.'); }
    });
    play.addEventListener('click', () => {
      if (!Rec.url) return; const a = new Audio(Rec.url);
      a.onended = () => setTimeout(() => sayWord(w), 350); a.play().catch(() => sayWord(w));
    });
    wrap.append(b, play); return wrap;
  }
  const norm = s => toHira(s || '').replace(/[\s。、．，,.!?！？「」・〜~ー]/g, '');
  function lev(a, b) { const m = []; for (let i = 0; i <= a.length; i++) { m[i] = [i]; for (let j = 1; j <= b.length; j++) m[i][j] = i ? Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) : j; } return m[a.length][b.length]; }
  function heardMatch(heard, w) {
    const x = norm(heard); if (!x) return false;
    return [w.k].concat((w.j || '').split('|')).filter(Boolean).map(norm).some(f => x === f || x.includes(f) || (f.length > 3 && lev(x, f) / f.length <= .25));
  }
  function micBtn(onResult) {
    const b = h('button', { class: 'mic', type: 'button', html: ICON_MIC, 'aria-label': 'تكلم' });
    const heard = h('div', { class: 'heard' });
    let live = false, timer = 0;
    const finish = () => { clearTimeout(timer); if (!live) return; live = false; b.classList.remove('live'); Mic.onText = null; Mic.d.stop().catch(() => { }).then(() => onResult(Mic.text)); };
    b.addEventListener('click', () => {
      if (live) return finish();
      Mic.text = ''; heard.textContent = 'أسمعك…';
      Mic.onText = (t, fin) => { heard.innerHTML = 'سمعت: <b lang="ja"></b>'; heard.firstElementChild.textContent = t; if (fin) { clearTimeout(timer); timer = setTimeout(finish, 900); } };
      Mic.onState = e => { if (e.state === 'idle' && live) { live = false; b.classList.remove('live'); Mic.onText = null; onResult(Mic.text); } };
      live = true; b.classList.add('live');
      Mic.d.start({ language: 'ja' }).catch(err => {
        live = false; b.classList.remove('live'); Mic.onText = null;
        const c = err && err.code;
        if (c === 'unavailable' || c === 'not_granted') { Mic.off = true; heard.textContent = 'الميكروفون غير متاح هنا. قيّم نطقك بنفسك.'; onResult(null); }
        else if (c !== 'stopped') heard.textContent = 'لم يبدأ الاستماع. حاول مرة أخرى.';
      });
    });
    return { b, heard };
  }

  /* ================= رسم الحروف ================= */
  function strokeSVG(ch, cls, nums) {
    const ds = STROKES[ch]; if (!ds) return null;
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 109 109');
    ds.forEach((d, i) => {
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'stroke ' + (cls || '')); svg.appendChild(p);
      if (nums) { const m = /M\s*([\d.]+)[ ,]([\d.]+)/.exec(d); if (m) { const t = document.createElementNS(NS, 'text'); t.setAttribute('x', +m[1] - 7); t.setAttribute('y', +m[2] - 1); t.setAttribute('class', 'snum'); t.textContent = i + 1; svg.appendChild(t); } }
    });
    return svg;
  }
  function animate(svg, only) {
    let delay = 150;
    svg.querySelectorAll('path.stroke').forEach((p, i) => {
      if (only != null && i !== only) return;
      const len = p.getTotalLength(), dur = Math.max(260, len * 9);
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      const a = p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: dur, delay, fill: 'forwards', easing: 'ease-in-out' });
      a.onfinish = () => { p.style.strokeDashoffset = 0; };
      delay += dur + 200;
    });
    return delay;
  }
  const single = id => [...id].length === 1 && !!STROKES[id];
  function glyphBox(id, big, anim) {
    const box = h('div', { class: 'glyphbox' + (big ? ' big' : '') });
    const svg = single(id) && anim !== 'text' ? strokeSVG(id) : null;
    if (svg) { box.appendChild(svg); if (anim) requestAnimationFrame(() => animate(svg)); }
    else box.appendChild(h('div', { class: 'txt', lang: 'ja', text: id }));
    box.replay = () => { if (svg) animate(svg); };
    return box;
  }
  let meas = null; const PTS = {};
  function strokePts(ch) {
    if (PTS[ch]) return PTS[ch];
    if (!meas) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden'); meas = document.createElementNS(NS, 'path'); s.appendChild(meas); document.body.appendChild(s); }
    return PTS[ch] = STROKES[ch].map(d => { meas.setAttribute('d', d); const L = meas.getTotalLength(), a = []; for (let i = 0; i <= 20; i++) { const p = meas.getPointAtLength(L * i / 20); a.push({ x: p.x, y: p.y }); } return a; });
  }
  const plen = a => { let L = 0; for (let i = 1; i < a.length; i++) L += Math.hypot(a[i].x - a[i - 1].x, a[i].y - a[i - 1].y); return L; };
  function resample(a, n) {
    const L = plen(a), out = [a[0]]; if (L === 0) { while (out.length < n) out.push(a[0]); return out; }
    let acc = 0, k = 1;
    for (let i = 1; i < a.length && k < n; i++) {
      const seg = Math.hypot(a[i].x - a[i - 1].x, a[i].y - a[i - 1].y);
      while (k < n && acc + seg >= L * k / (n - 1) - 1e-6) { const t = seg ? (L * k / (n - 1) - acc) / seg : 0; out.push({ x: a[i - 1].x + (a[i].x - a[i - 1].x) * t, y: a[i - 1].y + (a[i].y - a[i - 1].y) * t }); k++; }
      acc += seg;
    }
    while (out.length < n) out.push(a[a.length - 1]);
    return out;
  }
  function judge(user, exp, S, loose) {
    const k = S / 109, E = exp.map(p => ({ x: p.x * k, y: p.y * k })), le = plen(E), lu = plen(user);
    const U = resample(user, 16), EE = resample(E, 16);
    let d = 0; for (let i = 0; i < 16; i++) d += Math.hypot(U[i].x - EE[i].x, U[i].y - EE[i].y); d /= 16 * S;
    if (le < .13 * S) return d < (loose ? .2 : .15) && lu < .4 * S;
    return d < (loose ? .17 : .12) && lu > le * .35 && lu < le * 2.8;
  }

  /* ================= واجهة عامة ================= */
  let toastT = 0;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200); }
  function kanaHTML(text, hi) {
    const span = h('span', { class: 'k', lang: 'ja' });
    segs(text).forEach(s => { span.appendChild(h(s.id && s.id === hi ? 'b' : (s.id && !learned(s.id) && s.id !== hi) ? 'u' : 'span', { text: s.s })); });
    return span;
  }
  function wordLine(w, hi) {
    return h('div', { class: 'wordline' }, spkBtn(() => sayWord(w)), kanaHTML(w.k, hi), h('span', { class: 'm', text: w.m }), w.e ? h('span', { class: 'tag', text: 'تعرفها' }) : null);
  }
  function bigWord(w) { const b = h('div', { class: 'bigword' + (w.s ? ' sent' : ''), lang: 'ja' }); segs(w.k).forEach(s => b.appendChild(h(s.id && !learned(s.id) ? 'u' : 'span', { text: s.s }))); return b; }
  const stage = () => $('#stage');
  function card() { const s = stage(); s.innerHTML = ''; s.scrollTop = 0; const c = h('div', { class: 'card' }); s.appendChild(c); for (let i = 0; i < arguments.length; i++) if (arguments[i]) c.append(arguments[i]); return c; }
  const btn = (label, fn, cls) => h('button', { class: cls || 'btn-ink', type: 'button', text: label, on: fn ? { click: fn } : null });
  const row = function () { const r = h('div', { class: 'btn-row' }); for (let i = 0; i < arguments.length; i++) if (arguments[i]) r.append(arguments[i]); return r; };

  /* ================= البطاقات ================= */
  const R = {};

  R.note = (c) => card(h('div', { class: 'note', html: '<h3>' + c.title + '</h3>' + c.html }), btn('التالي', () => done(), 'btn-shu'));

  R.intro = (c) => {
    const it = ITEMS[c.id]; let isNew = false;
    if (!c.peek && !st.items[c.id]) { st.items[c.id] = { b: 0, d: today(), n: 0 }; isNew = true; touch(); syncTree(); }
    const box = glyphBox(c.id, true, true);
    const words = ALLW.filter(w => w.t.includes(c.id)).sort((a, b) => (b.e - a.e) || (a.t.filter(x => !learned(x)).length - b.t.filter(x => !learned(x)).length) || a.k.length - b.k.length).slice(0, 3);
    const info = h('div', { class: 'info' },
      h('div', { class: 'kicker', text: c.peek ? STAGES[it.stage].title : 'حرف جديد' }),
      h('div', { class: 'sound' }, it.hint, h('small', { text: c.id === 'っ' || c.id === 'ッ' ? 'تضاعف الحرف الذي بعدها' : 'تقريب الصوت بالعربية' })),
      ...words.map(w => wordLine(w, c.id)));
    if (!words.length) info.appendChild(h('p', { class: 'sub', text: it.id === 'を' || it.id === 'ヲ' ? 'أداة تأتي بعد المفعول به، مثل: ほんを よむ' : 'تدرّب عليه بالصوت والكتابة.' }));
    card(h('div', { class: 'two' }, box, info),
      row(spkBtn(() => sayItem(c.id)), btn('أعد الرسم', () => box.replay()), c.peek && single(c.id) ? btn('تدرّب على كتابته', () => openCards([{ t: 'write', id: c.id, phases: ['trace', 'memory'] }], 'الكتابة')) : null,
        btn(c.peek ? 'رجوع' : 'التالي', () => c.peek ? openView(c.peek) : done(), 'btn-shu')));
    sayItem(c.id);
  };

  R.write = (c) => {
    const id = c.id, pts = strokePts(id), phases = c.phases.slice(); let pi = 0, assisted = false;
    const names = { watch: 'شاهد', trace: 'تتبّع', memory: 'من الذاكرة' };
    const ph = h('div', { class: 'phases' }); phases.forEach(p => ph.appendChild(h('span', { text: names[p] })));
    const ask = h('p', { class: 'ask' }), fb = h('div', { class: 'fb' });
    const box = h('div', { class: 'glyphbox big', 'data-ch': id }), ctrl = row();
    card(ph, ask, box, fb, ctrl);
    function phase() {
      const mode = phases[pi]; box.innerHTML = ''; ctrl.innerHTML = ''; fb.textContent = ''; fb.className = 'fb';
      [...ph.children].forEach((s, i) => s.classList.toggle('on', i === pi));
      if (mode === 'watch') {
        ask.textContent = 'شاهد ترتيب الضربات';
        const svg = strokeSVG(id, '', true); box.appendChild(svg); requestAnimationFrame(() => animate(svg));
        ctrl.append(spkBtn(() => sayItem(id)), btn('أعد', () => animate(svg)), btn('دوري الآن', nextPhase, 'btn-shu'));
        return;
      }
      const trace = mode === 'trace';
      ask.textContent = trace ? 'اكتب فوق الحرف الباهت بالترتيب' : 'اكتب الحرف الذي تسمعه';
      if (trace) box.appendChild(strokeSVG(id, 'ghost', true));
      const hintSvg = strokeSVG(id, 'hint'); hintSvg.querySelectorAll('path').forEach(p => { p.style.opacity = 0; }); box.appendChild(hintSvg);
      const cv = h('canvas'); box.appendChild(cv);
      const S = box.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = cv.height = Math.round(S * dpr);
      const x = cv.getContext('2d'); x.scale(dpr, dpr); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#1c1917';
      const base = S * .058, kept = []; let cur = null, si = 0, fails = 0, lastT = 0;
      const seg = (a, b) => { x.lineWidth = b.w; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); };
      const redraw = () => { x.clearRect(0, 0, S, S); kept.forEach(s => { for (let i = 1; i < s.length; i++) seg(s[i - 1], s[i]); }); };
      const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      function width(e, p, prev) {
        if (e.pointerType === 'pen' && e.pressure > 0) return base * (.35 + 1.5 * e.pressure);
        const dt = Math.max(1, e.timeStamp - lastT), v = Math.hypot(p.x - prev.x, p.y - prev.y) / dt;
        return prev.w * .7 + base * Math.max(.45, Math.min(1.25, 1.3 - v * .55)) * .3;
      }
      function showHint(i) { const p = hintSvg.querySelectorAll('path')[i]; if (!p) return; p.style.opacity = 1; animate(hintSvg, i); setTimeout(() => { p.style.opacity = 0; }, 1500); }
      cv.addEventListener('pointerdown', e => { if (si >= pts.length) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { } const p = pos(e); p.w = base * .8; cur = [p]; lastT = e.timeStamp; });
      cv.addEventListener('pointermove', e => {
        if (!cur) return; e.preventDefault();
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        (evs.length ? evs : [e]).forEach(ev => { const p = pos(ev), prev = cur[cur.length - 1]; if (Math.hypot(p.x - prev.x, p.y - prev.y) < 1.2) return; p.w = width(ev, p, prev); seg(prev, p); cur.push(p); lastT = ev.timeStamp; });
      });
      const up = e => {
        if (!cur) return; const s = cur; cur = null;
        if (s.length < 2) s.push({ x: s[0].x + .5, y: s[0].y + .5, w: s[0].w });
        if (judge(s, pts[si], S, !trace)) {
          kept.push(s); si++; fails = 0; Sfx.wood();
          if (si >= pts.length) { fb.textContent = 'أحسنت'; fb.className = 'fb good'; Sfx.koto(); setTimeout(nextPhase, 800); }
        } else {
          fails++; redraw(); Sfx.low();
          fb.textContent = trace ? 'اتبع الضربة رقم ' + (si + 1) : 'ليست هذه الضربة. حاول مرة أخرى.'; fb.className = 'fb bad';
          if (trace || fails >= 2) { showHint(si); if (!trace) assisted = true; }
        }
      };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      ctrl.append(spkBtn(() => sayItem(id)), btn('امسح', () => { kept.length = 0; si = 0; redraw(); fb.textContent = ''; }));
      if (!trace) ctrl.append(btn('أرني الضربة', () => { assisted = true; showHint(si); }));
      ctrl.append(btn('تخطَّ', () => done()));
      if (!trace) sayItem(id);
    }
    function nextPhase() { pi++; if (pi < phases.length) phase(); else { if (c.grade) grade(st.items, id, !assisted); done(c.grade ? !assisted : undefined); } }
    phase();
  };

  function distract(id, n) {
    const it = ITEMS[id];
    let pool = ORDER[it.script].filter(x => x !== id && learned(x) && ([...x].length > 1) === ([...id].length > 1));
    if (pool.length < n) pool = pool.concat(STAGES[it.stage].items.filter(x => x !== id && !pool.includes(x)));
    return pickN(pool, n);
  }
  R.pick = (c) => {
    const opts = shuffle([c.id].concat(distract(c.id, 3))); let locked = false;
    const tiles = h('div', { class: 'tiles' });
    opts.forEach(o => tiles.appendChild(h('button', { class: 'tile', type: 'button', lang: 'ja', text: o, on: { click: e => choose(o, e.currentTarget) } })));
    const hintEl = h('p', { class: 'sub', text: Voice.engine() ? 'اضغط السماعة لإعادة الصوت' : 'الصوت: ' + ITEMS[c.id].hint });
    card(h('p', { class: 'ask', text: 'أي حرف سمعت؟' }), spkBtn(() => sayItem(c.id), true), hintEl, tiles);
    sayItem(c.id);
    function choose(o, el) {
      if (locked) return; locked = true; const ok = o === c.id;
      el.classList.add(ok ? 'ok' : 'no');
      if (!ok) { [...tiles.children].find(t => t.textContent === c.id).classList.add('ok'); Sfx.low(); sayItem(c.id); } else Sfx.koto();
      grade(st.items, c.id, ok); setTimeout(() => done(ok), ok ? 650 : 1500);
    }
  };

  R.recall = (c) => {
    const rev = h('div', { class: 'reveal' });
    const show = btn('اكشف', () => {
      sayItem(c.id); rev.innerHTML = '';
      rev.append(h('div', { class: 'sound', text: ITEMS[c.id].hint }),
        row(spkBtn(() => sayItem(c.id)), btn('لم أعرفه', () => { grade(st.items, c.id, false); Sfx.low(); done(false); }), btn('عرفته', () => { grade(st.items, c.id, true); Sfx.koto(); done(true); }, 'btn-shu')));
    }, 'btn-shu');
    rev.appendChild(show);
    card(h('p', { class: 'ask', text: 'انطق هذا الحرف بصوت عالٍ' }), glyphBox(c.id, false, 'text'), rev);
  };

  R.readWord = (c) => {
    const w = c.w, rev = h('div', { class: 'reveal' });
    rev.appendChild(btn('اكشف', () => {
      sayWord(w); rev.innerHTML = '';
      rev.append(h('div', { class: 'meaning', text: w.m }), w.e ? h('p', { class: 'kicker', text: 'هذه كلمة تعرفها بالسمع، والآن تقرؤها' }) : null,
        row(spkBtn(() => sayWord(w)), btn('أخطأت', () => { grade(st.w, w.k, false); Sfx.low(); done(false); }), btn('قرأتها صحيحة', () => { grade(st.w, w.k, true); Sfx.koto(); done(true); }, 'btn-shu')));
    }, 'btn-shu'));
    card(h('p', { class: 'ask', text: w.s ? 'اقرأ الجملة بصوت عالٍ' : 'اقرأ الكلمة بصوت عالٍ' }), bigWord(w), rev);
  };

  R.meaning = (c) => {
    const w = c.w, pool = (w.s ? D.SENT : ALLW).filter(x => x !== w && x.m !== w.m);
    const opts = shuffle([w].concat(pickN(pool, 3))); let locked = false;
    const box = h('div', { class: 'opts' });
    opts.forEach(o => box.appendChild(h('button', { class: 'opt', type: 'button', text: o.m, on: { click: e => choose(o, e.currentTarget) } })));
    card(h('p', { class: 'ask', text: c.hear ? 'ما معنى ما سمعت؟' : 'ما معنى هذه؟' }), c.hear ? spkBtn(() => sayWord(w), true) : bigWord(w), box);
    if (c.hear) sayWord(w);
    function choose(o, el) {
      if (locked) return; locked = true; const ok = o === w; el.classList.add(ok ? 'ok' : 'no');
      if (!ok) { [...box.children].find(t => t.textContent === w.m).classList.add('ok'); Sfx.low(); } else Sfx.koto();
      if (!c.hear) sayWord(w);
      grade(st.w, w.k, ok); setTimeout(() => done(ok), ok ? 900 : 1900);
    }
  };

  R.vocab = (c) => {
    const w = c.w; if (!st.w[w.k]) { st.w[w.k] = { b: 0, d: today(), n: 0 }; touch(); }
    card(h('div', { class: 'kicker', text: 'كلمة جديدة' }), spkBtn(() => sayWord(w), true), bigWord(w), h('div', { class: 'meaning', text: w.m }),
      readable(w) ? null : h('p', { class: 'sub', text: 'الحروف الباهتة لم تتعلمها بعد. احفظ الكلمة بصوتها الآن.' }),
      row(btn('ببطء', () => sayWord(w, true)), btn('التالي', () => done(), 'btn-shu')));
    sayWord(w);
  };

  R.say = (c) => {
    const w = c.w, rev = h('div', { class: 'reveal' }); let shown = false;
    function reveal(heard) {
      if (shown) return; shown = true; rev.innerHTML = '';
      const ok = heard ? heardMatch(heard, w) : null;
      sayWord(w);
      rev.append(bigWord(w), heard ? h('div', { class: 'heard', html: 'سمعت منك: <b lang="ja"></b>' }) : null);
      if (heard) rev.querySelector('.heard b').textContent = heard;
      if (Rec.ok) rev.append(recBtn(w));
      if (ok) { Sfx.koto(); rev.append(h('div', { class: 'fb good', text: 'نطقك مطابق' }), row(spkBtn(() => sayWord(w)), btn('التالي', () => done(true), 'btn-shu'))); }
      else rev.append(row(spkBtn(() => sayWord(w)), btn('لم أقلها صحيحة', () => { Sfx.low(); done(false); }), btn('قلتها صحيحة', () => { Sfx.koto(); done(true); }, 'btn-shu')));
    }
    if (Mic.ready()) { const m = micBtn(t => reveal(t || '')); rev.append(m.b, m.heard, btn('أكشف بدون ميكروفون', () => reveal(''))); }
    else rev.append(btn('قلتها، اكشف', () => reveal(''), 'btn-shu'));
    card(h('div', { class: 'kicker', text: 'قلها قبل أن تسمعها' }), h('p', { class: 'ask', text: w.m }), h('p', { class: 'sub', text: 'قلها باليابانية بصوت عالٍ' }), rev);
  };

  R.shadow = (c) => {
    const w = c.w; let n = 0;
    const cnt = h('p', { class: 'sub', text: 'استمع ثم ردّد فوراً بنفس الإيقاع، ثلاث مرات' });
    const nextB = btn('التالي', () => done(), 'btn-shu');
    const play = slow => sayWord(w, slow).then(() => { n++; cnt.textContent = 'ردّدت ' + n + ' من 3'; });
    const extra = h('div', { class: 'reveal' });
    if (Mic.ready()) { const m = micBtn(t => { if (t == null) return; const ok = heardMatch(t, w); m.heard.innerHTML = (ok ? 'مطابق. ' : '') + 'سمعت منك: <b lang="ja"></b>'; m.heard.querySelector('b').textContent = t; if (ok) Sfx.koto(); }); extra.append(m.b, m.heard); }
    if (Rec.ok) extra.append(recBtn(w));
    card(h('div', { class: 'kicker', text: 'ترديد' }), bigWord(w), h('div', { class: 'meaning', text: w.m }), cnt,
      row(spkBtn(() => play(false)), btn('ببطء', () => play(true)), nextB), extra);
    play(false);
  };

  R.chunk = (c) => {
    const k = c.c, list = h('div', { class: 'wlist' }); k.ex.forEach(e => list.appendChild(wordLine(e)));
    card(h('div', { class: 'kicker', text: 'عبارة جاهزة' }), h('div', { class: 'pattern', lang: 'ja', text: k.p }), h('div', { class: 'meaning', text: k.m }),
      h('p', { class: 'sub', text: 'استمع للأمثلة، ثم ستقولها أنت.' }), list, btn('التالي', () => done(), 'btn-shu'));
  };

  R.finish = (c) => {
    Sfx.wood(); setTimeout(() => Sfx.chord(), 350);
    const nL = Object.keys(st.items).length;
    card(h('div', { class: 'hanko', lang: 'ja', text: '済' }), h('p', { class: 'ask', text: c.daily ? 'أتممت جلسة اليوم' : 'انتهى التمرين' }),
      h('p', { class: 'sub', text: 'تعلمت ' + nL + ' حرفاً حتى الآن' + (c.daily ? '، وأيامك المتتالية: ' + st.streak : '') + '.' }),
      c.daily ? btn('شاهد أزهارك في الحديقة', () => showScreen('garden'), 'btn-shu') : btn('تم', goHome, 'btn-shu'), c.daily ? btn('الرئيسية', () => showScreen('home')) : null);
  };

  /* ================= تشغيل الجلسات ================= */
  let run = null;
  let tab = 'home';
  function setTab(t) { tab = t; document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); }
  function gardenTo(where) {
    if (!Garden.ok) return;
    if (!where) return Garden.setActive(false);
    const host = $('#garden'), slot = where === 'full' ? $('#garden-full') : $('#window');
    if (host.parentElement !== slot) slot.appendChild(host);
    Garden.setMode(where); Garden.setActive(true);
  }
  function hideScreens() { document.querySelectorAll('.screen').forEach(e => { e.hidden = true; }); $('#sheet').hidden = true; $('#pickcard').hidden = true; try { speechSynthesis.cancel(); } catch (e) { } }
  function showScreen(name) {
    run = null; hideScreens(); $('#nav').hidden = false;
    if (name === 'garden') { setTab('garden'); $('#scr-garden').hidden = false; renderStats(); gardenTo('full'); syncTree(); celebrate(); return; }
    if (name === 'practice') { setTab('practice'); $('#scr-practice').hidden = false; renderModes(); gardenTo(null); return; }
    setTab('home'); $('#home').hidden = false; gardenTo('window'); renderHome();
  }
  function openSheet(title, session) {
    hideScreens(); gardenTo(null);
    const sh = $('#sheet'); sh.hidden = false; sh.classList.toggle('full', !!session);
    $('#sheet-title').textContent = title; if (!session) { $('#inkbar').innerHTML = ''; $('#lab').textContent = ''; }
  }
  function goHome() { showScreen(tab === 'practice' ? 'practice' : 'home'); }
  function startRun(sections, title, daily) {
    run = { sections, si: 0, ci: 0, daily }; openSheet(title, true);
    const bar = $('#inkbar'); bar.innerHTML = '';
    sections.forEach(s => { s.seg = h('div', { class: 'seg', title: s.name }, h('b')); bar.appendChild(s.seg); });
    run.lab = $('#lab');
    step();
  }
  function openCards(cards, title) { startRun([{ name: title, cards }], title, false); }
  function step() {
    while (run.si < run.sections.length) {
      const s = run.sections[run.si];
      if (!s.cards) s.cards = s.build();
      if (run.ci < s.cards.length) break;
      if (s.onDone && s.cards.length) s.onDone();
      s.seg.firstChild.style.transform = 'scaleX(1)'; run.si++; run.ci = 0;
    }
    run.sections.forEach((s, i) => s.seg.classList.toggle('cur', i === run.si));
    if (run.si >= run.sections.length) {
      if (run.daily) { const t = today(); if (st.last !== t) { st.streak = st.last === t - 1 ? st.streak + 1 : 1; st.last = t; } st.days[t] = 1; touch(); }
      run.lab.textContent = ''; return R.finish({ daily: run.daily });
    }
    const s = run.sections[run.si], c = s.cards[run.ci];
    s.seg.firstChild.style.transform = 'scaleX(' + (run.ci / s.cards.length) + ')';
    run.lab.textContent = s.name + ' ' + (run.ci + 1) + '/' + s.cards.length;
    R[c.t](c);
  }
  function done(result) {
    if (!run) return goHome();
    const s = run.sections[run.si], c = s.cards[run.ci];
    if (result === false && !c.again && ['pick', 'recall', 'meaning', 'readWord'].includes(c.t)) s.cards.push(Object.assign({}, c, { again: true }));
    run.ci++; step();
  }

  const NOTES = {
    h1: ['الهيراغانا', '<p>الهيراغانا 46 حرفاً، وكل حرف مقطع صوتي كامل. أنت تعرف هذه الأصوات بأذنك، وما ستتعلمه الآن هو شكلها المكتوب.</p><p>لكل حرف ثلاث خطوات: تسمعه وتراه يُرسم، ثم تكتب فوقه بالقلم، ثم تكتبه من ذاكرتك. بعدها تقرأ به كلمة من كلماتك.</p>'],
    h2: ['النقطتان والدائرة', '<p>نقطتان صغيرتان أعلى الحرف تجعلان صوته مجهوراً: <span class="ex" lang="ja">か → が</span> (كا تصبح گا)، <span class="ex" lang="ja">さ → ざ</span>، <span class="ex" lang="ja">た → だ</span>، <span class="ex" lang="ja">は → ば</span>.</p><p>والدائرة الصغيرة تحوّل صف الهاء إلى پ: <span class="ex" lang="ja">は → ぱ</span>. الشكل نفسه الذي تعرفه، مع علامة فقط.</p>'],
    h3: ['الحروف الصغيرة', '<p><span class="ex" lang="ja">っ</span> الصغيرة لا تُنطق. هي وقفة قصيرة تضاعف الحرف الذي بعدها: <span class="ex" lang="ja">きって</span> كِتّيه.</p><p>و<span class="ex" lang="ja">ゃ ゅ ょ</span> الصغيرة تندمج مع الحرف قبلها في مقطع واحد: <span class="ex" lang="ja">し + ゃ = しゃ</span> شا، كما في <span class="ex" lang="ja">しゃしん</span>.</p><p>وحرف العلة المكرر يطيل الصوت: <span class="ex" lang="ja">どうが</span> دووغا.</p>'],
    k1: ['الكاتاكانا', '<p>الكاتاكانا تحمل الأصوات نفسها التي تعلمتها في الهيراغانا، لكن بأشكال زاوية حادة. تُكتب بها الكلمات المستعارة من اللغات الأخرى، ولهذا ستفهم أغلب ما تقرؤه فوراً.</p><p>الخط <span class="ex" lang="ja">ー</span> يطيل الحرف الذي قبله: <span class="ex" lang="ja">コーヒー</span> كووهيي.</p>'],
    k2: ['الكاتاكانا المصوّتة', '<p>القاعدة نفسها: نقطتان للصوت المجهور ودائرة لصوت پ. <span class="ex" lang="ja">カ → ガ</span>، <span class="ex" lang="ja">ハ → バ → パ</span>.</p>'],
    wo: ['أدوات الجملة', '<p>ثلاثة حروف يتغير نطقها حين تعمل كأدوات نحوية: <span class="ex" lang="ja">を</span> تُنطق «أو» وتأتي بعد المفعول به، <span class="ex" lang="ja">は</span> تُنطق «وا» بعد موضوع الجملة، و<span class="ex" lang="ja">へ</span> تُنطق «إيه» للاتجاه.</p><p>مثال: <span class="ex" lang="ja">ほんを よむ</span> أقرأ كتاباً.</p>']
  };
  function lessonCards(L) {
    const cs = [];
    if (L.first) { const n = NOTES[L.stage.key]; cs.push({ t: 'note', title: n[0], html: n[1] }); }
    if (L.items.includes('を')) cs.push({ t: 'note', title: NOTES.wo[0], html: NOTES.wo[1] });
    L.items.forEach(id => { cs.push({ t: 'intro', id }); if (single(id)) cs.push({ t: 'write', id, phases: ['watch', 'trace', 'memory'] }); });
    shuffle(L.items).forEach(id => cs.push({ t: 'pick', id }));
    shuffle(L.items).filter(single).forEach(id => cs.push({ t: 'write', id, phases: ['memory'] }));
    L.unlocked.slice(0, 6).forEach(w => cs.push({ t: 'readWord', w }));
    return cs;
  }
  function dueItems() { const t = today(); return Object.keys(st.items).filter(id => st.items[id].d <= t && st.items[id].n > 0 || (st.items[id].b === 0 && st.items[id].d < t)).sort((a, b) => st.items[a].d - st.items[b].d); }
  function reviewCards() {
    const t = today(), cs = [];
    dueItems().slice(0, 22).forEach((id, i) => cs.push(i % 4 === 3 && single(id) ? { t: 'write', id, phases: ['memory'], grade: true } : i % 2 ? { t: 'recall', id } : { t: 'pick', id }));
    Object.keys(st.w).filter(k => st.w[k].d <= t && st.w[k].n > 0 && BYK[k]).slice(0, 8).forEach((k, i) => cs.push(readable(BYK[k]) && i % 2 ? { t: 'meaning', w: BYK[k] } : { t: 'meaning', w: BYK[k], hear: true }));
    return shuffle(cs);
  }
  function readCards(n) {
    const ws = ALLW.filter(readable), ss = D.SENT.filter(readable);
    const fresh = ws.filter(w => !st.w[w.k]), cs = [];
    pickN(fresh, Math.min(fresh.length, Math.ceil(n / 2))).forEach(w => cs.push({ t: 'readWord', w }));
    pickN(ss, Math.min(ss.length, 2)).forEach(w => cs.push({ t: 'readWord', w }));
    pickN(ws, Math.max(0, n - cs.length)).forEach(w => cs.push({ t: 'meaning', w }));
    return cs;
  }
  function vocabCards(n) {
    const cand = D.WORDS.filter(w => !w.e && !st.w[w.k]);
    const ws = cand.filter(readable).concat(cand.filter(w => !readable(w))).slice(0, n);
    return ws.map(w => ({ t: 'vocab', w })).concat(shuffle(ws).map(w => ({ t: 'meaning', w, hear: true })));
  }
  function speakCards(full) {
    const pool = ALLW.filter(w => w.e || st.w[w.k]), cs = [];
    pickN(pool, full ? 5 : 3).forEach(w => cs.push({ t: 'say', w }));
    for (let i = 0; i < (full ? 3 : 2); i++) cs.push({ t: 'shadow', w: D.SENT[(st.shadow + i) % D.SENT.length] });
    const c = D.CHUNKS[st.chunk % D.CHUNKS.length];
    cs.push({ t: 'chunk', c }); c.ex.forEach(e => cs.push({ t: 'say', w: e }));
    return cs;
  }
  function daily(extraLesson) {
    const L = (st.lessonDay !== today() || extraLesson) ? nextLesson() : null, secs = [];
    if (!extraLesson) secs.push({ name: 'مراجعة', build: reviewCards });
    if (L) secs.push({ name: 'حروف جديدة', build: () => lessonCards(L), onDone: () => { st.lessons++; st.lessonDay = today(); touch(); } });
    if (!extraLesson) {
      secs.push({ name: 'قراءة', build: () => readCards(6) });
      secs.push({ name: 'كلمات', build: () => vocabCards(4) });
      secs.push({ name: 'كلام', build: () => speakCards(true), onDone: () => { st.shadow += 3; st.chunk++; touch(); } });
    }
    return secs;
  }

  /* ================= الصفحة الرئيسية ================= */
  function renderHome(instant) {
    const t = today(), L = st.lessonDay !== t ? nextLesson() : null, doneToday = !!st.days[t];
    const streak = st.last >= t - 1 ? st.streak : 0;
    $('#streak b').textContent = String(streak);
    $('#kk-date').textContent = new Date().toLocaleDateString('ar-IQ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
    const due = dueItems().length, plan = $('#plan'); plan.innerHTML = '';
    const li = (n, label, em, jp) => { const e = h('li', { class: doneToday ? 'done' : '' }, h('i', { lang: 'ja', text: n }), h('span', { text: label }), em ? h('em', jp ? { lang: 'ja', text: em } : { text: em }) : null); plan.appendChild(e); };
    li('一', 'مراجعة', due ? due + ' حرفاً' : 'لا شيء اليوم');
    if (L) li('二', 'حروف جديدة', L.items.join(' '), true); else li('二', 'حروف جديدة', nextLesson() ? 'أُنجز درس اليوم' : 'أتممت كل الحروف');
    li('三', 'قراءة', 'كلمات وجمل بحروفك');
    li('四', 'كلمات جديدة', '4 كلمات');
    li('五', 'كلام', 'ترديد وعبارات');
    $('#start').textContent = doneToday ? 'جلسة أخرى' : 'ابدأ الجلسة';
    $('#extra').hidden = !(st.lessonDay === t && nextLesson());
    const sg = $('#stamps'); sg.innerHTML = '';
    for (let i = 27; i >= 0; i--) { const d = t - i, on = !!st.days[d]; sg.appendChild(h('span', { class: (on ? 'on' : '') + (i === 0 ? ' today' : ''), lang: on ? 'ja' : null, text: on ? '済' : new Date(d * 864e5).getUTCDate() })); }
    $('#crest-sub').textContent = Object.keys(st.items).length ? 'كل حرف تجيب عنه صحيحاً يفتح زهرة. المس النافذة لتدخل الحديقة.' : 'شجرتك الآن في الشتاء. أول حرف تتقنه يوقظ أول زهرة.';
    renderStats();
    syncTree(instant); celebrate(instant);
  }
  function celebrate(quiet) {
    const now = Object.keys(st.items).filter(id => st.items[id].b >= 1);
    if (bloomed && Garden.ok && !quiet) now.filter(id => !bloomed.has(id)).slice(0, 8).forEach((id, i) => setTimeout(() => Garden.pulse(id), 900 + i * 350));
    bloomed = new Set(now);
  }
  let bloomed = null;
  function renderStats() {
    const nh = ORDER.h.filter(learned).length, nk = ORDER.k.filter(learned).length, bl = Object.keys(st.items).filter(id => st.items[id].b >= 1).length;
    document.querySelectorAll('.treestat').forEach(e => { e.innerHTML = '<span>الهيراغانا <b>' + nh + '</b> من ' + ORDER.h.length + '</span><span>الكاتاكانا <b>' + nk + '</b> من ' + ORDER.k.length + '</span><span>مزهر <b>' + bl + '</b></span>'; });
  }
  function renderModes() {
    const m = $('#modes'); m.innerHTML = '';
    const nL = Object.keys(st.items).filter(single).length, nR = ALLW.filter(readable).length, nW = ALLW.filter(w => w.e || st.w[w.k]).length;
    [['write', '筆', 'الكتابة', nL ? 'اكتب من الذاكرة ' + Math.min(8, nL) + ' حروف تعلمتها' : 'تُفتح بعد أول درس'],
     ['read', '読', 'القراءة', nR ? nR + ' كلمة تستطيع قراءتها الآن' : 'تُفتح بعد أول درس'],
     ['words', '語', 'الكلمات', nW + ' كلمة في رصيدك، وتعلّم كلمات جديدة'],
     ['speak', '話', 'الكلام', 'قلها قبل أن تسمعها، ترديد، وعبارات جاهزة']
    ].forEach(a => m.appendChild(h('button', { class: 'mode', type: 'button', on: { click: () => openView(a[0]) } }, h('i', { lang: 'ja', text: a[1] }), h('b', { text: a[2] }), h('span', { text: a[3] }))));
  }
  function statusText(id) { const o = st.items[id]; if (!o) return 'لم تتعلمه بعد'; if (o.b >= 1) return o.d < today() - 2 ? 'بدأ يذبل، راجعه' : 'مزهر'; return 'برعم، أجب عنه صحيحاً ليتفتح'; }
  let pickT = 0;
  function showPick(p) {
    const pc = $('#pickcard'); clearTimeout(pickT);
    if (!p) { pc.hidden = true; return; }
    const it = ITEMS[p.id], w = ALLW.find(x => x.t.includes(p.id) && x.e) || ALLW.find(x => x.t.includes(p.id));
    pc.innerHTML = ''; pc.append(h('div', { class: 'g', lang: 'ja', text: p.id }), h('div', { class: 's', text: it.hint + ' · ' + statusText(p.id) }), w ? h('div', { class: 'w' }, h('span', { lang: 'ja', text: w.k }), ' ' + w.m) : null);
    pc.style.left = Math.max(110, Math.min(window.innerWidth - 110, p.x)) + 'px'; pc.style.top = Math.max(170, p.y) + 'px'; pc.hidden = false;
    sayItem(p.id); pickT = setTimeout(() => { pc.hidden = true; }, 4200);
  }

  /* ================= الأقسام الحرة ================= */
  function openView(name) {
    const need = () => { if (!Object.keys(st.items).length) { toast('ابدأ جلسة اليوم أولاً لتتعلم حروفك الأولى.'); return true; } return false; };
    if (name === 'write') { if (need()) return; const ids = pickN(Object.keys(st.items).filter(single), 8); return openCards(ids.map(id => ({ t: 'write', id, phases: ['memory'], grade: true })), 'الكتابة'); }
    if (name === 'read') { const cs = readCards(10); if (!cs.length) return toast('لا توجد كلمات مقروءة بعد. ابدأ جلسة اليوم.'); return openCards(cs, 'القراءة'); }
    if (name === 'speak') return startRun([{ name: 'الكلام', cards: speakCards(false), onDone: () => { st.shadow += 2; st.chunk++; touch(); } }], 'الكلام', false);
    run = null;
    if (name === 'chart' || name === 'chart-k') setTab('chart'); else if (name === 'settings') setTab('settings'); else if (name === 'words') setTab('practice');
    if (name === 'chart' || name === 'chart-k') return viewChart(name === 'chart-k' ? 'k' : 'h');
    if (name === 'words') return viewWords('mine');
    if (name === 'settings') return viewSettings();
  }
  function viewChart(script) {
    openSheet('الحروف', false);
    const conv = script === 'k' ? toKata : (x => x);
    const grid = (rows, cols) => { const g = h('div', { class: 'chart', style: cols ? 'grid-template-columns:repeat(' + cols + ',minmax(0,1fr));width:min(100%,' + cols * 112 + 'px)' : null }); rows.forEach(id => { if (id === ' ') return g.appendChild(h('button', { class: 'gap', disabled: true })); const lv = levelOf(id); g.appendChild(h('button', { type: 'button', lang: 'ja', class: 'l' + lv.lv + (lv.wilt ? ' due' : ''), text: id, on: { click: () => R.intro({ id, peek: script === 'k' ? 'chart-k' : 'chart' }) } })); }); return g; };
    const flat = R2 => R2.map(r => [...r[1]].map(c => c === ' ' ? ' ' : conv(c))).reduce((a, b) => a.concat(b), []);
    card(h('div', { class: 'tabs' }, btn('الهيراغانا', () => viewChart('h'), 'btn-ink small' + (script === 'h' ? ' on' : '')), btn('الكاتاكانا', () => viewChart('k'), 'btn-ink small' + (script === 'k' ? ' on' : ''))),
      h('div', { class: 'legend' }, h('span', { text: 'باهت: لم تتعلمه' }), h('span', { text: 'بالحبر: تعلمته' }), h('span', { text: 'وردي: مزهر' }), h('span', { text: 'نقطة حمراء: يحتاج مراجعة' })),
      grid(flat(D.ROWS)), h('p', { class: 'kicker', text: 'الأصوات المصوّتة' }), grid(flat(D.VROWS)),
      script === 'h' ? h('p', { class: 'kicker', text: 'الحروف المركّبة' }) : null, script === 'h' ? grid(D.YOON, 3) : null,
      h('p', { class: 'sub', text: 'اضغط أي حرف لتسمعه وترى ترتيب ضرباته.' }));
  }
  function viewWords(tab) {
    openSheet('الكلمات', false);
    const mine = ALLW.filter(w => w.e || st.w[w.k]), list = h('div', { class: 'wlist' });
    (tab === 'mine' ? mine : ALLW).forEach(w => list.appendChild(wordLine(w)));
    card(h('div', { class: 'tabs' }, btn('كلماتي (' + mine.length + ')', () => viewWords('mine'), 'btn-ink small' + (tab === 'mine' ? ' on' : '')), btn('كل الكلمات (' + ALLW.length + ')', () => viewWords('all'), 'btn-ink small' + (tab === 'all' ? ' on' : '')),
      btn('اختبرني بالسماع', () => openCards(pickN(mine, 10).map(w => ({ t: 'meaning', w, hear: true })), 'الكلمات'), 'btn-ink small'),
      btn('علّمني كلمات جديدة', () => { const cs = vocabCards(5); cs.length ? openCards(cs, 'الكلمات') : toast('تعلمت كل الكلمات المتاحة.'); }, 'btn-ink small')), list);
  }
  function viewSettings() {
    openSheet('الإعدادات', false);
    const eng = Voice.engine();
    const seg = (opts, cur, fn) => { const r = h('div', { class: 'btn-row' }); opts.forEach(o => r.appendChild(btn(o[1], () => { fn(o[0]); touch(); viewSettings(); }, 'btn-ink small' + (o[0] === cur ? ' on' : '')))); return r; };
    const rate = h('input', { type: 'range', id: 'set-rate', min: '.6', max: '1.3', step: '.05', value: st.set.rate });
    rate.addEventListener('change', () => { st.set.rate = +rate.value; touch(); Voice.speak('こんにちは'); });
    const reset = h('div', { class: 'btn-row' }); const askReset = () => { reset.innerHTML = ''; reset.append(h('span', { text: 'سيُمحى كل تقدمك. متأكد؟' }), btn('نعم، امسح', () => { const s = st.set; st = defaults(); st.set = s; touch(); toast('مُسح التقدم.'); bloomed = null; showScreen('home'); }, 'btn-ink small'), btn('إلغاء', viewSettings, 'btn-ink small')); };
    reset.appendChild(btn('امسح التقدم وابدأ من جديد', askReset, 'btn-ink small'));
    card(
      h('div', { class: 'setrow' }, h('div', null, h('b', { text: 'صوت النطق' }), h('p', { text: eng === 'browser' ? 'يُستخدم الآن صوت الجهاز الياباني' + (Voice.ja.length ? ' (' + Voice.ja.length + ')' : '') : eng === 'claude' ? 'يُستخدم الآن صوت Claude' : 'لا يوجد صوت متاح في هذه الصفحة' })),
        seg(Voice.tts ? [['auto', 'تلقائي'], ['browser', 'الجهاز'], ['claude', 'Claude']] : [['auto', 'تلقائي'], ['browser', 'الجهاز']], st.set.engine, v => { st.set.engine = v; })),
      h('div', { class: 'setrow' }, h('div', null, h('b', { text: 'سرعة النطق' }), h('p', { text: 'أبطئها إن كانت الجمل سريعة عليك' })), rate),
      h('div', { class: 'setrow' }, h('div', null, h('b', { text: 'اختبار الصوت' }), h('p', { text: 'يجب أن تسمع: كونّيتشيوا' })), spkBtn(() => Voice.speak('こんにちは'))),
      h('div', { class: 'setrow' }, h('div', null, h('b', { text: 'عدد الحروف الجديدة يومياً' }), h('p', { text: 'خمسة حروف تناسب نصف ساعة' })), seg([[3, '3'], [5, '5'], [7, '7']], st.set.per, v => { st.set.per = v; })),
      h('div', { class: 'setrow' }, h('div', null, h('b', { text: 'أصوات الكوتو والجرس' })), seg([[true, 'تعمل'], [false, 'صامتة']], st.set.sfx, v => { st.set.sfx = v; })),
      h('div', { class: 'setrow' }, h('div', null, h('b', { text: 'الميكروفون' }), h('p', { text: Mic.ready() ? 'متاح: سيقارن البرنامج نطقك بالنص' : (navigator.brave ? 'متصفح Brave لا يدعم تمييز الكلام. تسجيل صوتك يعمل، ولتمييز النطق افتح الصفحة في Chrome.' : 'غير متاح هنا. افتح الصفحة في Chrome لتفعيله، وإلا قيّم نطقك بنفسك.') }))),
      h('div', { class: 'setrow' }, h('div', null, h('b', { text: 'الحفظ' }), h('p', { text: cloud ? 'تقدمك محفوظ في حسابك ويظهر على أي جهاز' : 'تقدمك محفوظ في هذا المتصفح على هذا الجهاز. لا تمسح بيانات Chrome.' }))),
      h('div', { class: 'setrow' }, reset),
      h('p', { class: 'sub', text: 'بيانات ترتيب الضربات من مشروع KanjiVG (Ulrich Apel)، رخصة CC BY-SA 3.0.' }));
  }

  /* ================= الإقلاع ================= */
  function washi() {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 320; const x = c.getContext('2d');
      x.fillStyle = '#f2ebda'; x.fillRect(0, 0, 320, 320);
      for (let i = 0; i < 170; i++) { const px = Math.random() * 320, py = Math.random() * 320, a = Math.random() * 6.28, l = 6 + Math.random() * 34; x.strokeStyle = Math.random() > .5 ? 'rgba(255,255,255,.38)' : 'rgba(150,128,90,.09)'; x.lineWidth = .5 + Math.random(); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + 4, py + Math.sin(a) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
      const im = x.getImageData(0, 0, 320, 320), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(im, 0, 0);
      document.documentElement.style.setProperty('--paper', 'url(' + c.toDataURL('image/jpeg', .82) + ')');
    } catch (e) { }
  }
  window.__sakura = { strokePts, state: () => st };
  function boot() {
    washi(); Voice.init(); Mic.init();
    try { if (Garden.init && Garden.init($('#garden'), { hira: ORDER.h, kata: ORDER.k })) { Garden.onPick = p => { if (tab === 'garden') showPick(p); }; } } catch (e) { console.error(e); }
    showScreen('home'); syncTree(true);
    $('#start').addEventListener('click', () => { Sfx.bell(); startRun(daily(false), 'جلسة اليوم', true); });
    $('#extra').addEventListener('click', () => { const s = daily(true); if (s.length) startRun(s, 'درس إضافي', false); });
    $('#close').addEventListener('click', goHome);
    $('#window').addEventListener('click', () => showScreen('garden'));
    $('#nav').addEventListener('click', e => {
      const b = e.target.closest('button[data-tab]'); if (!b) return; const t = b.dataset.tab;
      if (t === 'chart' || t === 'settings') openView(t); else showScreen(t);
    });
    $('#preview').addEventListener('click', e => {
      if (!Garden.ok) return toast('العرض ثلاثي الأبعاد غير مدعوم في هذا المتصفح.');
      const on = Garden.preview(!e.currentTarget.classList.contains('on')); e.currentTarget.classList.toggle('on', on);
      e.currentTarget.textContent = on ? 'أعد شجرتي كما هي' : 'أرني الشجرة مزهرة'; if (on) Sfx.chord();
    });
    initCloud();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
