/* حديقة الساكورا: شجرة إجرائية ثلاثية الأبعاد تمثل تقدّم التعلم */
(function () {
  const G = { ok: false, onPick: null };
  window.Garden = G;
  if (!window.THREE) return;
  const T = THREE;
  const V3 = T.Vector3;

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- خامات مرسومة بالكود ---------- */
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  function barkTextures() {
    const w = 512, h = 1024, c = canvas(w, h), b = canvas(w, h);
    const x = c.getContext('2d'), y = b.getContext('2d'), R = rng(7);
    x.fillStyle = '#4b3a35'; x.fillRect(0, 0, w, h);
    y.fillStyle = '#808080'; y.fillRect(0, 0, w, h);
    // تموجات طولية
    for (let i = 0; i < 260; i++) {
      const px = R() * w, len = 60 + R() * 380, py = R() * h, lw = 1 + R() * 5;
      const v = R();
      x.strokeStyle = v > .5 ? 'rgba(96,74,66,.35)' : 'rgba(30,22,20,.35)';
      y.strokeStyle = v > .5 ? 'rgba(170,170,170,.4)' : 'rgba(40,40,40,.45)';
      for (const g of [x, y]) {
        g.lineWidth = lw; g.beginPath(); g.moveTo(px, py);
        g.bezierCurveTo(px + (R() - .5) * 14, py + len * .3, px + (R() - .5) * 14, py + len * .6, px + (R() - .5) * 10, py + len); g.stroke();
      }
    }
    // عدسات أفقية مميزة للحاء الكرز
    for (let i = 0; i < 520; i++) {
      const px = R() * w, py = R() * h, len = 10 + R() * 70, lw = 1.5 + R() * 4.5;
      x.strokeStyle = `rgba(${150 + R() * 40 | 0},${118 + R() * 30 | 0},${100 + R() * 26 | 0},${.35 + R() * .5})`;
      y.strokeStyle = `rgba(215,215,215,${.5 + R() * .4})`;
      for (const g of [x, y]) {
        g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py);
        g.quadraticCurveTo(px + len / 2, py + (R() - .5) * 5, px + len, py + (R() - .5) * 3); g.stroke();
        if (px + len > w) { g.beginPath(); g.moveTo(px - w, py); g.lineTo(px - w + len, py); g.stroke(); }
      }
    }
    // شقوق داكنة وبقع أشنة
    for (let i = 0; i < 60; i++) {
      const px = R() * w, py = R() * h;
      x.fillStyle = 'rgba(20,14,12,.5)'; y.fillStyle = 'rgba(10,10,10,.7)';
      for (const g of [x, y]) { g.beginPath(); g.ellipse(px, py, 2 + R() * 4, 14 + R() * 50, (R() - .5) * .3, 0, 7); g.fill(); }
    }
    for (let i = 0; i < 40; i++) {
      const px = R() * w, py = R() * h, r = 6 + R() * 26;
      const gr = x.createRadialGradient(px, py, 0, px, py, r);
      gr.addColorStop(0, 'rgba(132,140,104,.5)'); gr.addColorStop(1, 'rgba(132,140,104,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    }
    const img = x.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (R() - .5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(img, 0, 0);
    const map = new T.CanvasTexture(c), bump = new T.CanvasTexture(b);
    for (const t of [map, bump]) { t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; }
    map.encoding = T.sRGBEncoding;
    return { map, bump };
  }

  function groundTexture(islands) {
    const S = 2048, c = canvas(S, S), x = c.getContext('2d'), R = rng(21);
    const W = 60, k = S / W, cx = S / 2, cy = S / 2;
    x.fillStyle = '#cdc3ac'; x.fillRect(0, 0, S, S);
    // خطوط مشط الحصى المستقيمة
    x.lineWidth = 2.2;
    for (let i = 0; i < S; i += 7) {
      x.strokeStyle = 'rgba(96,84,64,.34)'; x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke();
      x.strokeStyle = 'rgba(255,250,238,.5)'; x.beginPath(); x.moveTo(0, i + 2.5); x.lineTo(S, i + 2.5); x.stroke();
    }
    // حلقات حول كل جزيرة
    for (const is of islands) {
      const px = cx + is.x * k, py = cy + is.z * k, r0 = is.r * k;
      x.fillStyle = '#cdc3ac'; x.beginPath(); x.arc(px, py, r0 + 12 * 7 + 3, 0, 7); x.fill();
      for (let n = 0; n < 12; n++) {
        const r = r0 + 6 + n * 7;
        x.strokeStyle = 'rgba(96,84,64,.38)'; x.beginPath(); x.arc(px, py, r, 0, 7); x.stroke();
        x.strokeStyle = 'rgba(255,250,238,.55)'; x.beginPath(); x.arc(px, py, r + 2.5, 0, 7); x.stroke();
      }
    }
    const img = x.getImageData(0, 0, S, S), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (R() - .5) * 34; d[i] += n; d[i + 1] += n; d[i + 2] += n * .9; }
    x.putImageData(img, 0, 0);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    return t;
  }

  function noiseTexture(base, vary, size, seed, speck) {
    const c = canvas(size, size), x = c.getContext('2d'), R = rng(seed);
    x.fillStyle = base; x.fillRect(0, 0, size, size);
    for (let i = 0; i < speck; i++) {
      const col = vary[(R() * vary.length) | 0];
      x.fillStyle = col; x.globalAlpha = .25 + R() * .5;
      x.beginPath(); x.arc(R() * size, R() * size, .6 + R() * 3.2, 0, 7); x.fill();
    }
    x.globalAlpha = 1;
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding;
    return t;
  }

  function mountainTexture(seed, tone, peaks) {
    const w = 2048, h = 512, c = canvas(w, h), x = c.getContext('2d'), R = rng(seed);
    const pts = []; let yv = h * .55;
    for (let i = 0; i <= 256; i++) {
      const u = i / 256;
      let v = 0;
      for (const p of peaks) v += p[2] * Math.exp(-Math.pow((u - p[0]) / p[1], 2));
      yv += (R() - .5) * 7; yv = yv * .9 + (h * .62) * .1;
      pts.push([u * w, h * .9 - v * h * .8 + (yv - h * .6) * .5]);
    }
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, tone[0]); g.addColorStop(.55, tone[1]); g.addColorStop(1, 'rgba(238,228,208,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(0, h);
    for (const p of pts) x.lineTo(p[0], p[1]);
    x.lineTo(w, h); x.closePath(); x.fill();
    // لمسات حبر جافة
    x.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 500; i++) {
      x.strokeStyle = `rgba(30,34,40,${R() * .1})`; x.lineWidth = 1 + R() * 3;
      const px = R() * w, py = R() * h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 20 + R() * 60, py + 30 + R() * 90); x.stroke();
    }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
    return t;
  }

  /* ---------- بناء هيكل الشجرة ---------- */
  function buildTree(seed, P) {
    const R = rng(seed), pos = [], nor = [], uv = [], idx = [], tips = [];
    const up = new V3(0, 1, 0);
    let phi = R() * 6.28;

    function perp(d) {
      const ref = Math.abs(d.y) < .9 ? up : new V3(1, 0, 0);
      return new V3().crossVectors(d, ref).normalize();
    }
    function tilt(d, ang, az) {
      const u = perp(d), w = new V3().crossVectors(d, u);
      const axis = u.multiplyScalar(Math.cos(az)).addScaledVector(w, Math.sin(az));
      return d.clone().applyAxisAngle(axis, ang).normalize();
    }

    function limb(p0, dir, r0, len, depth, vOff, kind) {
      const last = depth >= P.maxDepth;
      const segLen = Math.max(.1, Math.min(.34, r0 * 2.4));
      const n = Math.max(3, Math.round(len / segLen));
      const sides = r0 > .2 ? 14 : r0 > .08 ? 9 : r0 > .035 ? 6 : 5;
      const uRep = Math.max(1, Math.round(r0 * 7));
      const taper = kind === 'root' ? .8 : depth === 0 ? .4 : .52;
      const wig = kind === 'root' ? .1 : depth === 0 ? .1 : depth === 1 ? .18 : depth === 2 ? .2 : .15;
      const spawn = kind === 'root' || depth === 0 ? [] : depth === 1 ? [.34, .56, .78] : depth === 2 ? [.4, .7] : depth === 3 ? [.5] : [];
      let p = p0.clone(), d = dir.clone().normalize();
      let u = perp(d), w = new V3().crossVectors(d, u);
      const base = pos.length / 3, samples = [];
      let si = 0, dist = 0;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        let r = Math.max(.007, r0 * (1 - taper * t));
        if (depth === 0 && kind !== 'root') r *= 1 + .75 * Math.exp(-p.y * 3.2) + .12 * Math.exp(-Math.pow((t - 1) * 4, 2));
        for (let s = 0; s <= sides; s++) {
          const a = (s % sides) / sides * 6.2832;
          const nx = u.x * Math.cos(a) + w.x * Math.sin(a), ny = u.y * Math.cos(a) + w.y * Math.sin(a), nz = u.z * Math.cos(a) + w.z * Math.sin(a);
          const bump = r0 > .06 ? 1 + .09 * Math.sin(a * 3 + p.y * 2.3 + seed) + .05 * Math.sin(a * 7 + p.y * 5) : 1;
          pos.push(p.x + nx * r * bump, p.y + ny * r * bump, p.z + nz * r * bump);
          nor.push(nx, ny, nz);
          uv.push(s / sides * uRep, (vOff + dist) * .55);
        }
        if (last && t >= .25) samples.push({ p: p.clone(), d: d.clone() });
        if (i < n) {
          const trop = kind === 'root' ? -.1 : depth === 0 ? 0 : depth === 1 ? (.05 - .13 * t) : last ? (.02 - .07 * t) : (.03 + .02 * t);
          d.x += (R() - .5) * wig; d.y += (R() - .5) * wig * .7 + trop; d.z += (R() - .5) * wig;
          if (kind !== 'root') { if (depth > 0 && p.y < 1.9) d.y += .16; if (d.y < -.22) d.y = -.22; }
          d.normalize();
          w.crossVectors(d, u).normalize(); u.crossVectors(w, d).normalize();
          const step = len / n; p.addScaledVector(d, step); dist += step;
          while (si < spawn.length && (i + 1) / n >= spawn[si]) {
            si++; phi += 2.4 + (R() - .5) * .8;
            let cd = tilt(d, .7 + R() * .5, phi);
            cd.y += .1; cd.normalize();
            const rr = Math.max(.012, r0 * (1 - taper * (i + 1) / n) * .68);
            limb(p, cd, rr, len * (.52 + R() * .2), depth + 1, vOff + dist, 'side');
          }
        }
      }
      for (let i = 0; i < n; i++) for (let s = 0; s < sides; s++) {
        const a = base + i * (sides + 1) + s, b = a + sides + 1;
        idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
      // قبة تغطي نهاية الغصن
      const tipR = Math.max(.007, r0 * (1 - taper));
      if (kind === 'root') return;
      if (last) { tips.push({ pts: samples, end: p.clone() }); return; }
      if (depth === 0) {
        const N = P.limbs;
        const off = R() * 6.28;
        for (let k = 0; k < N; k++) {
          const az = off + k / N * 6.2832 + (R() - .5) * .5;
          const el = .22 + R() * .4;
          const cd = new V3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
          limb(p, cd, tipR * (.62 + R() * .1), P.len1 * (.85 + R() * .3), 1, vOff + dist, 'main');
        }
        limb(p, tilt(d, .12, R() * 6), tipR * .7, P.len1 * .8, 1, vOff + dist, 'main');
      } else {
        const az = R() * 6.28, sp = .34 + R() * .3;
        for (const sgn of [0, Math.PI]) {
          const cd = tilt(d, sp, az + sgn); cd.y += .05; cd.normalize();
          limb(p, cd, tipR * .82, len * (.6 + R() * .18), depth + 1, vOff + dist, 'fork');
        }
      }
    }

    const lean = new V3((R() - .5) * .3, 1, (R() - .5) * .3).normalize();
    limb(new V3(0, -.1, 0), lean, P.r0, P.trunk, 0, 0, 'trunk');
    for (let k = 0; k < P.roots; k++) {
      const a = k / P.roots * 6.2832 + R() * .6;
      limb(new V3(Math.cos(a) * P.r0 * .5, .34, Math.sin(a) * P.r0 * .5), new V3(Math.cos(a), -.18, Math.sin(a)), P.r0 * .42, 1.0 + R() * .7, 0, R() * 3, 'root');
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return { geometry: g, tips };
  }

  /* ---------- زهرة الكرز ---------- */
  function flowerGeometry() {
    const pos = [], col = [], idx = [];
    const cIn = new T.Color('#d2507a'), cMid = new T.Color('#f2a9bf'), cOut = new T.Color('#fbdbe4');
    const outline = [[0, .1], [-.3, .5], [-.34, .84], [-.14, 1.0], [0, .9], [.14, 1.0], [.34, .84], [.3, .5]];
    const put = (x, y, a, lift) => {
      const r = Math.hypot(x, y);
      const z = .32 * r * r + lift - .12 * Math.abs(x) * 1.2;
      const X = x * Math.cos(a) - y * Math.sin(a), Y = x * Math.sin(a) + y * Math.cos(a);
      pos.push(X, Y, z);
      const c = r < .5 ? cIn.clone().lerp(cMid, r / .5) : cMid.clone().lerp(cOut, (r - .5) / .5);
      col.push(c.r, c.g, c.b);
    };
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * 6.2832, b = pos.length / 3;
      put(0, .58, a, .015 * (k % 2));
      for (const o of outline) put(o[0], o[1], a, .015 * (k % 2));
      for (let i = 0; i < outline.length; i++) idx.push(b, b + 1 + i, b + 1 + (i + 1) % outline.length);
    }
    // الأسدية
    const cs = new T.Color('#f6d76a'), cb = new T.Color('#c8455f');
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * 6.2832 + .2, b = pos.length / 3, r = .3 + (k % 3) * .05, wd = .035;
      pos.push(Math.cos(a - .5) * wd, Math.sin(a - .5) * wd, .03, Math.cos(a + .5) * wd, Math.sin(a + .5) * wd, .03,
        Math.cos(a) * r - Math.sin(a) * wd, Math.sin(a) * r + Math.cos(a) * wd, .2, Math.cos(a) * r + Math.sin(a) * wd, Math.sin(a) * r - Math.cos(a) * wd, .2);
      col.push(cb.r, cb.g, cb.b, cb.r, cb.g, cb.b, cs.r, cs.g, cs.b, cs.r, cs.g, cs.b);
      idx.push(b, b + 1, b + 2, b, b + 3, b + 2);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function petalGeometry() {
    const o = [[0, 0], [-.2, .24], [-.37, .52], [-.33, .76], [-.14, .9], [0, .8], [.14, .9], [.33, .76], [.37, .52], [.2, .24]];
    const pos = [0, .48, .06], idx = [];
    for (const p of o) pos.push(p[0], p[1], .1 * p[0] * p[0] * 4);
    for (let i = 0; i < o.length; i++) idx.push(0, 1 + i, 1 + (i + 1) % o.length);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  /* ---------- الريح: إزاحة مشتركة للأغصان والأزهار ---------- */
  const uTime = { value: 0 }, uWind = { value: 1 };
  function windy(mat) {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime; sh.uniforms.uWind = uWind;
      sh.vertexShader = 'uniform float uTime;uniform float uWind;\n' + sh.vertexShader.replace('#include <project_vertex>', `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        float hh = max(mvPosition.y - 1.2, 0.0);
        float ph = uTime * 1.1 + mvPosition.x * .55 + mvPosition.z * .4;
        float amp = hh * hh * .0045 * uWind;
        mvPosition.x += (sin(ph) + .45 * sin(ph * 2.7 + 1.3)) * amp;
        mvPosition.z += (cos(ph * .8) + .4 * sin(ph * 3.1)) * amp * .7;
        mvPosition.y += sin(ph * 1.7) * amp * .25;
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`);
    };
    return mat;
  }

  /* ---------- شجرة كاملة مع أزهارها ---------- */
  function Tree(seed, P, ids, origin, scale) {
    const self = this, R = rng(seed * 31 + 5);
    this.group = new T.Group(); this.group.position.copy(origin); this.group.scale.setScalar(scale);
    const built = buildTree(seed, P);
    const bark = new T.Mesh(built.geometry, G.mats.bark);
    bark.castShadow = true; bark.receiveShadow = true; this.group.add(bark);
    const tips = built.tips, N = ids.length;
    this.slots = ids.map((id, i) => ({ id, cur: 0, tgt: 0, bud: 0, budT: 0, wilt: 0, wiltT: 0, f0: 0, f1: 0, b0: 0, b1: 0, c: new V3(), n: 0 }));
    this.byId = {}; this.slots.forEach(s => self.byId[s.id] = s);
    const FL = [], BD = [];
    const q = new T.Quaternion(), zAxis = new V3(0, 0, 1), out = new V3(), m = new T.Matrix4();
    tips.forEach((tip, ti) => {
      const si = Math.min(N - 1, Math.floor(ti * N / tips.length)), slot = self.slots[si];
      if (!slot.n) { slot.f0 = FL.length; slot.b0 = BD.length; }
      const per = P.perTip;
      for (let k = 0; k < per; k++) {
        const sm = tip.pts[Math.min(tip.pts.length - 1, (Math.pow(R(), .7) * tip.pts.length) | 0)];
        out.set(R() - .5, R() - .35, R() - .5).normalize();
        const off = .04 + R() * .12;
        const p = sm.p.clone().addScaledVector(out, off);
        const face = out.clone().multiplyScalar(.75).add(new V3((R() - .5) * .6, -.15 + R() * .5, (R() - .5) * .6)).normalize();
        q.setFromUnitVectors(zAxis, face);
        q.multiply(new T.Quaternion().setFromAxisAngle(zAxis, R() * 6.28));
        FL.push({ p, q: q.clone(), s: .085 + R() * .045, thr: R() * .72 });
      }
      for (let k = 0; k < 5; k++) {
        const sm = tip.pts[Math.min(tip.pts.length - 1, (R() * tip.pts.length) | 0)];
        out.set(R() - .5, R() - .3, R() - .5).normalize();
        q.setFromUnitVectors(up3, out);
        BD.push({ p: sm.p.clone().addScaledVector(out, .028), q: q.clone(), s: .03 + R() * .016 });
      }
      slot.c.add(tip.end); slot.n++; slot.f1 = FL.length; slot.b1 = BD.length;
    });
    this.slots.forEach(s => { if (s.n) s.c.multiplyScalar(1 / s.n); });
    this.FL = FL; this.BD = BD;
    this.flowers = new T.InstancedMesh(G.geo.flower, G.mats.flower, FL.length);
    this.buds = new T.InstancedMesh(G.geo.bud, G.mats.bud, BD.length);
    this.flowers.castShadow = true; this.flowers.frustumCulled = false; this.buds.frustumCulled = false;
    const zero = new T.Matrix4().makeScale(0, 0, 0), white = new T.Color(1, 1, 1);
    for (let i = 0; i < FL.length; i++) { this.flowers.setMatrixAt(i, zero); this.flowers.setColorAt(i, white); }
    for (let i = 0; i < BD.length; i++) this.buds.setMatrixAt(i, zero);
    this.group.add(this.flowers, this.buds);
    const sv = new V3(), wc = new T.Color();
    this.refresh = function (slot) {
      const f = slot.cur;
      for (let i = slot.f0; i < slot.f1; i++) {
        const o = FL[i], e = smooth(o.thr, o.thr + .28, f);
        const s = o.s * (e * (1 + .12 * Math.sin(e * 3.14)));
        m.compose(o.p, o.q, sv.set(s, s, s)); self.flowers.setMatrixAt(i, m);
        wc.setRGB(1 - .2 * slot.wilt, 1 - .26 * slot.wilt, 1 - .34 * slot.wilt); self.flowers.setColorAt(i, wc);
      }
      for (let i = slot.b0; i < slot.b1; i++) {
        const o = BD[i], s = o.s * slot.bud * (1 - .85 * f);
        m.compose(o.p, o.q, sv.set(s * .8, s * 1.5, s * .8)); self.buds.setMatrixAt(i, m);
      }
    };
    this.step = function (dt) {
      let ch = false;
      for (const s of self.slots) {
        if (Math.abs(s.cur - s.tgt) > .002 || Math.abs(s.bud - s.budT) > .002 || Math.abs(s.wilt - s.wiltT) > .002) {
          const k = Math.min(1, dt * 1.6);
          s.cur += (s.tgt - s.cur) * k; s.bud += (s.budT - s.bud) * Math.min(1, dt * 3); s.wilt += (s.wiltT - s.wilt) * k;
          self.refresh(s); ch = true;
        }
      }
      if (ch) { self.flowers.instanceMatrix.needsUpdate = true; self.buds.instanceMatrix.needsUpdate = true; if (self.flowers.instanceColor) self.flowers.instanceColor.needsUpdate = true; }
    };
    this.worldPos = function (slot, v) { return v.copy(slot.c).multiplyScalar(scale).add(origin); };
  }
  const up3 = new V3(0, 1, 0);

  /* ---------- المشهد ---------- */
  G.init = function (host, ids) {
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (e) { return false; }
    G.renderer = renderer;
    let pr = Math.min(window.devicePixelRatio || 1, 1.6);
    renderer.setPixelRatio(pr);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .92;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.fog = new T.Fog(0xeee5d2, 20, 78);
    // السماء
    const sc = canvas(8, 256), sx = sc.getContext('2d'), sg = sx.createLinearGradient(0, 0, 0, 256);
    sg.addColorStop(0, '#c9d6d8'); sg.addColorStop(.45, '#e6e3d4'); sg.addColorStop(.7, '#f3ead8'); sg.addColorStop(1, '#efe5d0');
    sx.fillStyle = sg; sx.fillRect(0, 0, 8, 256);
    const sky = new T.CanvasTexture(sc); sky.encoding = T.sRGBEncoding; scene.background = sky;

    const cam = new T.PerspectiveCamera(36, 1, .1, 300);
    const hemi = new T.HemisphereLight(0xfff5e6, 0x9a8a6c, .72); scene.add(hemi);
    const sun = new T.DirectionalLight(0xfff0d6, 1.35); sun.position.set(-7, 13, 8);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc2 = sun.shadow.camera; sc2.left = -15; sc2.right = 13; sc2.top = 12; sc2.bottom = -10; sc2.near = 1; sc2.far = 40;
    sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; sun.shadow.radius = 3;
    scene.add(sun); sun.target.position.set(-2, 2, -1); scene.add(sun.target);
    const fill = new T.DirectionalLight(0xdfe8ff, .28); fill.position.set(8, 6, -6); scene.add(fill);

    const bt = barkTextures();
    G.mats = {
      bark: windy(new T.MeshStandardMaterial({ map: bt.map, bumpMap: bt.bump, bumpScale: .035, roughness: .82, metalness: 0 })),
      flower: windy(new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: .6, emissive: 0xff9db8, emissiveIntensity: .1 })),
      bud: windy(new T.MeshStandardMaterial({ color: 0xd4476d, roughness: .6 }))
    };
    G.geo = { flower: flowerGeometry(), bud: new T.SphereGeometry(1, 6, 5), petal: petalGeometry() };

    const O1 = new V3(0, 0, 0), O2 = new V3(-6.2, 0, -5.4);
    const islands = [{ x: 0, z: 0, r: 2.9 }, { x: O2.x, z: O2.z, r: 2.0 }];
    // الأرض
    const ground = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({ map: groundTexture(islands), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const far = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ color: 0xcdc3ac, roughness: 1 }));
    far.rotation.x = -Math.PI / 2; far.position.y = -.02; scene.add(far);
    // جزر الطحلب
    const mossT = noiseTexture('#4a5a2e', ['#63733a', '#38461f', '#738248', '#2f3b1c', '#566431', '#7b7a44'], 512, 3, 14000); mossT.repeat.set(3, 3);
    const mossM = new T.MeshStandardMaterial({ map: mossT, roughness: 1 });
    const Rm = rng(99);
    for (const is of islands) {
      const g2 = new T.RingGeometry(.001, 1, 120, 20), p2 = g2.attributes.position, u2 = g2.attributes.uv;
      for (let i = 0; i < p2.count; i++) {
        const x0 = p2.getX(i), y0 = p2.getY(i), a = Math.atan2(y0, x0), t = Math.min(1, Math.hypot(x0, y0));
        const edge = is.r * (1 + .07 * Math.sin(a * 3 + is.x) + .05 * Math.sin(a * 7 + 1) + .025 * Math.sin(a * 13));
        const x = Math.cos(a) * t * edge, y = Math.sin(a) * t * edge;
        const h = .36 * Math.pow(1 - t * t, .75) + .035 * Math.sin(x * 4.1) * Math.cos(y * 3.7) * (1 - t) - .015;
        p2.setXYZ(i, x, y, h); u2.setXY(i, x / is.r, y / is.r);
      }
      g2.computeVertexNormals();
      const mm = new T.Mesh(g2, mossM); mm.rotation.x = -Math.PI / 2; mm.position.set(is.x, 0, is.z); mm.receiveShadow = true; scene.add(mm);
    }
    // صخور
    const stoneT = noiseTexture('#8b877e', ['#6f6b63', '#a7a399', '#5d5a54', '#96958b', '#7b8169'], 256, 5, 5000);
    const stoneM = new T.MeshStandardMaterial({ map: stoneT, roughness: .95, flatShading: false });
    function rock(x, z, s, sy, seed) {
      const g = new T.IcosahedronGeometry(1, 3), p = g.attributes.position, Rr = rng(seed), k = [];
      for (let i = 0; i < 6; i++) k.push([Rr() * 6, Rr() * 6, Rr() * 6, 1 + Rr() * 2]);
      for (let i = 0; i < p.count; i++) {
        const v = new V3(p.getX(i), p.getY(i), p.getZ(i)); let d = 1;
        for (const q of k) d += .11 * Math.sin(v.x * q[3] * 1.7 + q[0]) * Math.sin(v.y * q[3] * 1.3 + q[1]) * Math.sin(v.z * q[3] * 1.5 + q[2]);
        v.multiplyScalar(d); p.setXYZ(i, v.x, v.y * sy, v.z);
      }
      g.computeVertexNormals();
      const m = new T.Mesh(g, stoneM); m.position.set(x, s * sy * .35, z); m.scale.setScalar(s); m.rotation.y = Rr() * 6;
      m.castShadow = true; m.receiveShadow = true; scene.add(m);
    }
    rock(2.6, 1.6, .62, .7, 1); rock(3.3, 1.0, .34, .6, 2); rock(-2.2, 2.4, .42, .55, 3); rock(-4.6, 3.8, .8, .5, 4); rock(-5.5, 3.3, .36, .7, 5);
    rock(-7.7, -3.9, .5, .65, 6); rock(6.5, -4, 1.1, .6, 8);
    // فانوس حجري
    (function lantern(x, z) {
      const g = new T.Group(), M = stoneM;
      const add = (geo, y, mat) => { const m = new T.Mesh(geo, mat || M); m.position.y = y; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
      add(new T.CylinderGeometry(.42, .5, .16, 6), .08);
      add(new T.CylinderGeometry(.3, .38, .1, 6), .21);
      add(new T.CylinderGeometry(.13, .16, 1.0, 10), .76);
      add(new T.CylinderGeometry(.4, .2, .16, 6), 1.34);
      add(new T.CylinderGeometry(.27, .27, .36, 6, 1, true), 1.6);
      const glow = add(new T.CylinderGeometry(.2, .2, .28, 6), 1.6, new T.MeshStandardMaterial({ color: 0x40382c, emissive: 0xffb45a, emissiveIntensity: .9 }));
      glow.castShadow = false;
      for (let i = 0; i < 6; i++) { const b = add(new T.BoxGeometry(.06, .38, .06), 1.6); const a = i / 6 * 6.2832 + .52; b.position.x = Math.cos(a) * .27; b.position.z = Math.sin(a) * .27; }
      add(new T.ConeGeometry(.62, .34, 6), 1.95);
      add(new T.CylinderGeometry(.64, .66, .05, 6), 1.79);
      add(new T.SphereGeometry(.09, 10, 8), 2.17);
      g.position.set(x, 0, z); g.rotation.y = .4; scene.add(g);
      const pl = new T.PointLight(0xffb060, .5, 5, 2); pl.position.set(x, 1.6, z); scene.add(pl);
    })(4.1, 3.1);
    // سياج الخيزران
    (function fence() {
      const bam = new T.MeshStandardMaterial({ color: 0xa8935a, roughness: .7 });
      const nV = 64, vg = new T.CylinderGeometry(.035, .035, 1.25, 6), im = new T.InstancedMesh(vg, bam, nV), m = new T.Matrix4();
      for (let i = 0; i < nV; i++) { m.makeTranslation(-16 + i * .5, .62, -9.5 + Math.sin(i * .37) * .02); im.setMatrixAt(i, m); }
      im.castShadow = true; scene.add(im);
      for (const y of [.3, .68, 1.06]) { const h = new T.Mesh(new T.CylinderGeometry(.03, .03, 32, 6), bam); h.rotation.z = Math.PI / 2; h.position.set(0, y, -9.45); scene.add(h); }
      for (let i = 0; i < 9; i++) { const p = new T.Mesh(new T.CylinderGeometry(.075, .08, 1.55, 8), new T.MeshStandardMaterial({ color: 0x5b4a3a, roughness: .9 })); p.position.set(-16 + i * 4, .77, -9.5); p.castShadow = true; scene.add(p); }
    })();
    // جبال بالحبر وشمس
    const mk = (seed, tone, peaks, z, y, w, h, op) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: mountainTexture(seed, tone, peaks), transparent: true, fog: false, depthWrite: false, opacity: op }));
      m.position.set(0, y, z); m.renderOrder = -5; scene.add(m);
    };
    const sunDisc = new T.Mesh(new T.CircleGeometry(7.5, 48), new T.MeshBasicMaterial({ color: 0xd9644f, transparent: true, opacity: .5, fog: false, depthWrite: false }));
    sunDisc.position.set(25, 15, -100); sunDisc.renderOrder = -5; scene.add(sunDisc);
    mk(11, ['rgba(126,142,150,.75)', 'rgba(170,180,180,.55)'], [[.3, .12, .75], [.62, .2, .5], [.9, .1, .42]], -110, 16, 300, 60, .8);
    mk(12, ['rgba(84,100,108,.8)', 'rgba(140,152,150,.6)'], [[.12, .14, .5], [.5, .1, .38], [.78, .16, .62]], -85, 9, 240, 44, .85);
    mk(13, ['rgba(52,66,70,.85)', 'rgba(110,124,116,.6)'], [[.2, .2, .34], [.66, .22, .4]], -60, 4.5, 190, 26, .9);

    mk(14, ['rgba(58,74,60,.9)', 'rgba(96,110,92,.7)'], [[.1, .1, .3], [.3, .07, .22], [.47, .12, .34], [.7, .08, .24], [.9, .12, .32]], -34, 2.2, 150, 11, .92);
    // الأشجار
    const t1 = new Tree(1207, { r0: .42, trunk: 1.9, len1: 3.1, limbs: 4, maxDepth: 4, roots: 6, perTip: 11 }, ids.hira, O1, 1);
    const t2 = new Tree(3391, { r0: .3, trunk: 1.5, len1: 2.2, limbs: 3, maxDepth: 4, roots: 5, perTip: 11 }, ids.kata, O2, .78);
    scene.add(t1.group, t2.group);
    const trees = [t1, t2];
    G.trees = trees;

    // بتلات متساقطة
    const NP = 260, petMat = new T.MeshStandardMaterial({ color: 0xfbd3de, side: T.DoubleSide, roughness: .7, emissive: 0xffc4d6, emissiveIntensity: .2 });
    const petals = new T.InstancedMesh(G.geo.petal, petMat, NP); petals.frustumCulled = false; scene.add(petals);
    const PS = [], Rp = rng(555);
    for (let i = 0; i < NP; i++) PS.push({ p: new V3(0, -5, 0), v: new V3(), a: Rp() * 6, b: Rp() * 6, sa: 1 + Rp() * 3, sb: 1 + Rp() * 3, life: 0, s: .05 + Rp() * .03 });
    const NG = 700, gpet = new T.InstancedMesh(G.geo.petal, new T.MeshStandardMaterial({ color: 0xf6c6d3, side: T.DoubleSide, roughness: .9 }), NG);
    gpet.receiveShadow = true; gpet.count = 0; scene.add(gpet);
    (function () {
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), Rg = rng(77), sv = new V3();
      for (let i = 0; i < NG; i++) {
        const tr = Rg() < .68 ? 0 : 1, o = tr ? O2 : O1, rad = (tr ? 3.6 : 5.4) * Math.sqrt(Rg()), a = Rg() * 6.28;
        const x = o.x + Math.cos(a) * rad - 1.2 * Rg(), z = o.z + Math.sin(a) * rad;
        const isl = islands[tr], dr = Math.hypot(x - isl.x, z - isl.z);
        const y = dr < isl.r * .95 ? .36 * Math.pow(1 - Math.pow(dr / isl.r, 2), .75) + .02 : .012;
        e.set(-Math.PI / 2 + (Rg() - .5) * .3, 0, Rg() * 6.28); q.setFromEuler(e);
        const s = .05 + Rg() * .03; m.compose(new V3(x, y, z), q, sv.set(s, s, s)); gpet.setMatrixAt(i, m);
      }
    })();

    let bloom = 0, preview = false, saved = null;
    function sources() {
      const src = [];
      for (const t of trees) for (const s of t.slots) if (s.tgt > .3) src.push([t, s]);
      return src;
    }
    let srcCache = [];
    G.setLevels = function (levels, instant) {
      let tot = 0, cnt = 0;
      for (const t of trees) for (const s of t.slots) {
        const L = levels[s.id] || { lv: 0 };
        s.tgt = L.lv >= 3 ? 1 : L.lv === 2 ? .46 : 0; s.budT = L.lv >= 1 ? 1 : 0; s.wiltT = L.wilt ? 1 : 0;
        if (instant) { s.cur = s.tgt; s.bud = s.budT; s.wilt = s.wiltT; t.refresh(s); }
        tot += s.tgt; cnt++;
      }
      if (instant) for (const t of trees) { t.flowers.instanceMatrix.needsUpdate = true; t.buds.instanceMatrix.needsUpdate = true; if (t.flowers.instanceColor) t.flowers.instanceColor.needsUpdate = true; }
      bloom = tot / cnt; srcCache = sources();
      gpet.count = Math.round(NG * Math.min(1, bloom * 1.3));
      G.levels = levels; kick();
    };
    G.preview = function (on) {
      if (on && !preview) { saved = G.levels; preview = true; const all = {}; for (const t of trees) for (const s of t.slots) all[s.id] = { lv: 3 }; G.setLevels(all); G.levels = saved; }
      else if (!on && preview) { preview = false; G.setLevels(saved || {}); }
      return preview;
    };
    G.pulse = function (id) {
      for (const t of trees) { const s = t.byId[id]; if (!s) continue; const w = t.worldPos(s, new V3()); for (let i = 0; i < 40; i++) spawn(PS[(Math.random() * NP) | 0], w, true); }
      kick();
    };
    function spawn(o, at, burst) {
      if (at) o.p.copy(at).add(new V3((Math.random() - .5) * .8, (Math.random() - .5) * .6, (Math.random() - .5) * .8));
      else { const pr = srcCache[(Math.random() * srcCache.length) | 0]; pr[0].worldPos(pr[1], o.p); o.p.x += (Math.random() - .5) * .9; o.p.y += (Math.random() - .5) * .5; o.p.z += (Math.random() - .5) * .9; }
      o.v.set((Math.random() - .7) * .5, burst ? Math.random() * .6 : -.1, (Math.random() - .5) * .4); o.life = 1;
    }

    /* الكاميرا والتحكم */
    const tgt = new V3(-.2, 3.35, -.2);
    let az = -.22, pol = 1.36, dist = 18.5, azV = 0, autoT = 0, lastInput = -99, dragging = false;
    let W = 1, H = 1;
    let mode = 'window';
    function resize() {
      W = host.clientWidth || 1; H = host.clientHeight || 1;
      renderer.setSize(W, H, false);
      cam.aspect = W / H; cam.clearViewOffset();
      cam.fov = mode === 'window' ? 34 : W > H ? 38 : 46;
      cam.updateProjectionMatrix(); kick();
    }
    function frameFor(m) { return m === 'window' ? { tgt: new V3(-.2, 3.5, -.2), dist: 18.5, az: -.22, pol: 1.38 } : { tgt: new V3(-2.4, 3.1, -1.4), dist: 21, az: -.2, pol: 1.32 }; }
    G.setMode = function (m) { mode = m; const f = frameFor(m); tgt.copy(f.tgt); dist = f.dist; az = f.az; pol = f.pol; azV = 0; focusT = null; resize(); };
    function placeCam() {
      pol = Math.min(1.5, Math.max(.75, pol)); az = Math.min(1.25, Math.max(-1.25, az)); dist = Math.min(34, Math.max(4.5, dist));
      cam.position.set(tgt.x + dist * Math.sin(pol) * Math.sin(az), tgt.y + dist * Math.cos(pol), tgt.z + dist * Math.sin(pol) * Math.cos(az));
      cam.lookAt(tgt);
    }
    const el = renderer.domElement; el.style.touchAction = 'none';
    const ptrs = new Map(); let moved = 0, pinch0 = 0, dist0 = 0, downT = 0;
    el.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); try { el.setPointerCapture(e.pointerId); } catch (_) { } moved = 0; downT = performance.now(); dragging = true; if (ptrs.size === 2) { const a = [...ptrs.values()]; pinch0 = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); dist0 = dist; } kick(); });
    el.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p[0], dy = e.clientY - p[1]; p[0] = e.clientX; p[1] = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if (ptrs.size === 1) { az -= dx * .005; pol -= dy * .004; azV = -dx * .005; }
      else if (ptrs.size === 2) { const a = [...ptrs.values()]; const d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); if (pinch0 > 0) dist = dist0 * pinch0 / d; }
      lastInput = clock.elapsedTime; kick();
    });
    const upH = e => {
      if (ptrs.size === 1 && moved < 9 && performance.now() - downT < 500) pick(e.clientX, e.clientY);
      ptrs.delete(e.pointerId); if (!ptrs.size) dragging = false; lastInput = clock.elapsedTime;
    };
    el.addEventListener('pointerup', upH); el.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); dragging = false; });
    el.addEventListener('wheel', e => { e.preventDefault(); dist *= 1 + Math.sign(e.deltaY) * .08; lastInput = clock.elapsedTime; kick(); }, { passive: false });
    const pv = new V3();
    function pick(cx, cy) {
      const r = el.getBoundingClientRect(); let best = null, bd = 48;
      for (const t of trees) for (const s of t.slots) {
        t.worldPos(s, pv).project(cam); if (pv.z > 1) continue;
        const x = r.left + (pv.x * .5 + .5) * r.width, y = r.top + (-pv.y * .5 + .5) * r.height, d = Math.hypot(x - cx, y - cy);
        if (d < bd) { bd = d; best = { id: s.id, x, y }; }
      }
      if (G.onPick) G.onPick(best);
    }
    G.focus = function (which) { const o = which === 'kata' ? new V3(O2.x, 2.2, O2.z) : new V3(0, 3.0, 0); focusT = { tgt: o, dist: which === 'kata' ? 9.5 : 11.5, t: 0 }; kick(); };
    G.home = function () { const f = frameFor(mode); focusT = { tgt: f.tgt, dist: f.dist, t: 0 }; kick(); };
    let focusT = null;

    /* حلقة الرسم */
    const clock = new T.Clock(); let active = true, raf = 0, slow = 0, frames = 0, low = false;
    const pm = new T.Matrix4(), pq = new T.Quaternion(), pe = new T.Euler(), psv = new V3();
    function frame() {
      raf = 0; if (!active) return;
      const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
      uTime.value = t; uWind.value = .75 + .5 * Math.sin(t * .23) + .3 * Math.sin(t * .61);
      if (focusT) { focusT.t += dt; const k = Math.min(1, dt * 2.5); tgt.lerp(focusT.tgt, k); dist += (focusT.dist - dist) * k; if (focusT.t > 2.2) focusT = null; }
      if (!dragging) { az += azV; azV *= .92; if (t - lastInput > 6) { autoT += dt; az += Math.sin(autoT * .12) * .0006; } }
      placeCam();
      for (const tr of trees) tr.step(dt);
      // البتلات
      const want = srcCache.length ? Math.round(NP * Math.min(1, .12 + bloom * 1.6)) : 0;
      const wx = .5 + .5 * uWind.value;
      for (let i = 0; i < NP; i++) {
        const o = PS[i];
        if (o.life <= 0) { if (i < want && Math.random() < dt * .6) spawn(o); else { if (o.p.y > -4) { o.p.y = -5; pm.makeScale(0, 0, 0); petals.setMatrixAt(i, pm); } continue; } }
        o.v.x += (-wx * .55 - o.v.x) * dt * .8 + Math.sin(t * 1.3 + o.a) * dt * .5;
        o.v.y += (-.42 - o.v.y) * dt * 1.2; o.v.z += Math.cos(t * .9 + o.b) * dt * .4;
        o.p.addScaledVector(o.v, dt); o.a += o.sa * dt; o.b += o.sb * dt;
        if (o.p.y < .02) { o.life -= dt * .5; o.p.y = .02; o.v.set(0, 0, 0); }
        pe.set(o.a, o.b, o.a * .5); pq.setFromEuler(pe); const s = o.s * Math.min(1, o.life * 3);
        pm.compose(o.p, pq, psv.set(s, s, s)); petals.setMatrixAt(i, pm);
      }
      petals.instanceMatrix.needsUpdate = true;
      renderer.render(scene, cam);
      // تخفيف الجودة تلقائياً على الأجهزة الضعيفة
      frames++; if (dt > .045) slow++;
      if (!low && frames > 90) { if (slow > 45) { low = true; renderer.setPixelRatio(1); renderer.shadowMap.type = T.BasicShadowMap; sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } for (const tr of trees) tr.flowers.castShadow = false; resize(); } frames = 0; slow = 0; }
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (active && !raf) { clock.getDelta(); raf = requestAnimationFrame(frame); } }
    G.setActive = function (on) { active = on; if (on) kick(); };
    G.resize = resize;
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host); else window.addEventListener('resize', resize);
    resize(); placeCam();
    G.ok = true;
    return true;
  };
})();
