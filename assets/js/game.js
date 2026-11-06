/* Mini game: "Catch a shooting star".
 * 20 seconds. Tap the stars before they fall. Every star is a moment we film
 * (Haldi, Matchday, Store launch…). A rare silver Supernova is worth 5.
 * Quick catches build a combo. Works with mouse, touch and keyboard (Space).
 */
(function () {
  const SS = window.SS;
  const root = document.getElementById('catch-game');
  if (!root) return;

  const ROUND = 20; // seconds
  const MOMENTS = ['Haldi', 'Mehendi', 'Sangeeth', 'Pellikoduku', 'Engagement', 'Pasupu', 'Reception', 'Store launch', 'Matchday', 'Product shoot', 'Birthday', 'Car reveal', 'Movie promo', 'Grand opening', 'Model shoot', 'Brand film'];
  const COLOURS = ['255,255,255', '169,150,255', '124,203,255', '255,148,184', '130,230,198'];
  const RANKS = [[8, 'Stargazer'], [18, 'Rising star'], [32, 'Shooting star'], [Infinity, 'Supernova']];
  const reduce = SS.reduce;

  root.innerHTML = `
    <div class="game" aria-label="Catch a shooting star mini game">
      <canvas aria-hidden="true"></canvas>
      <div class="timebar"><i></i></div>
      <div class="hud">
        <span class="pill" data-time>0:${ROUND}</span>
        <span class="row" style="gap:8px">
          <button class="pill" type="button" data-sound aria-pressed="false" aria-label="Sound">Sound off</button>
          <span class="pill score" aria-live="polite">${SS.star}<b data-score>0</b></span>
        </span>
      </div>
      <div class="combo" data-combo></div>
      <div class="screen" data-start>
        <span class="eyebrow accent-fun">${SS.star} Mini game · 20 seconds</span>
        <h3>Catch a <span class="chrome">shooting star.</span></h3>
        <p>Tap the stars before they fall. Each one is a moment worth filming. Spot the big silver <strong>Supernova</strong>: it’s worth 5.</p>
        <button class="btn btn-primary" type="button" data-play>${SS.star} Play</button>
        <p class="note" data-best></p>
      </div>
      <div class="screen" data-end hidden>
        <span class="eyebrow accent-fun">Time! You are a</span>
        <div class="rank chrome" data-rank></div>
        <p data-summary></p>
        <div class="caught" data-caught></div>
        <div class="row" style="justify-content:center">
          <button class="btn btn-primary" type="button" data-again>Play again</button>
          <button class="btn btn-ghost" type="button" data-share>Share my score</button>
          <a class="btn btn-ghost" href="enquiry.html?from=catch-game">Book your moment ↗</a>
        </div>
        <p class="note">Real moments are harder to catch. That’s our job.</p>
      </div>
    </div>`;

  const box = root.querySelector('.game');
  const cv = root.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const $ = (s) => root.querySelector(s);
  let W = 0, H = 0, DPR = 1;
  let stars = [], sparks = [], floats = [], bg = [];
  let playing = false, t0 = 0, last = 0, score = 0, caughtCount = 0, combo = 0, lastCatch = 0, nextSpawn = 0, raf = 0;
  let tally = {};
  let sound = false, audio = null;
  let best = 0;
  try { best = Number(localStorage.getItem('ss_best') || 0); } catch (e) { /* ignore */ }
  const showBest = () => { $('[data-best]').textContent = best ? `Your best: ${best}` : ''; };
  showBest();

  function size() {
    const r = box.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bg = Array.from({ length: Math.round((W * H) / 3500) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.2, p: Math.random() * 6 }));
    if (!playing) drawIdle(performance.now());
  }

  /* ---------- sound (off until switched on) ---------- */
  function ping(n, big) {
    if (!sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine';
      o.frequency.value = (big ? 523 : 660) * Math.pow(1.06, Math.min(n, 12));
      g.gain.setValueAtTime(0.0001, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + (big ? 0.6 : 0.25));
      o.connect(g).connect(audio.destination);
      o.start(); o.stop(audio.currentTime + (big ? 0.62 : 0.27));
    } catch (e) { /* no audio: fine */ }
  }
  $('[data-sound]').addEventListener('click', (e) => {
    sound = !sound;
    e.currentTarget.textContent = sound ? 'Sound on' : 'Sound off';
    e.currentTarget.setAttribute('aria-pressed', String(sound));
    if (sound) ping(0);
  });

  /* ---------- stars ---------- */
  function spawn(elapsed) {
    const prog = Math.min(1, elapsed / ROUND);
    const supernova = Math.random() < 0.06;
    const fromTop = Math.random() < 0.65;
    const x = fromTop ? W * (0.15 + Math.random() * 0.95) : W + 20;
    const y = fromTop ? -20 : H * Math.random() * 0.5;
    const ang = Math.PI * (0.62 + Math.random() * 0.2); // down and to the left
    const speed = (reduce ? 0.6 : 1) * (supernova ? 2.4 : 2.6 + prog * 3 + Math.random() * 1.6) * Math.max(0.8, Math.min(1.4, H / 520));
    stars.push({
      x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, born: performance.now(),
      r: supernova ? 13 : 6 + Math.random() * 3, len: supernova ? 140 : 70 + Math.random() * 60,
      tint: supernova ? '255,255,255' : COLOURS[Math.floor(Math.random() * COLOURS.length)],
      label: supernova ? 'Supernova' : MOMENTS[Math.floor(Math.random() * MOMENTS.length)], supernova
    });
  }

  function burst(x, y, tint, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 6;
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 30 + Math.random() * 30, tint, r: 1 + Math.random() * 2 });
    }
  }

  function drawStar(s, t) {
    const sp = Math.hypot(s.vx, s.vy);
    const tx = s.x - (s.vx / sp) * s.len, ty = s.y - (s.vy / sp) * s.len;
    const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
    g.addColorStop(0, `rgba(${s.tint},0.95)`); g.addColorStop(1, `rgba(${s.tint},0)`);
    ctx.strokeStyle = g; ctx.lineWidth = s.r * 0.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
    const pulse = s.supernova ? 1 + Math.sin(t / 120) * 0.15 : 1;
    const rg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.6 * pulse);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.35, `rgba(${s.tint},0.9)`); rg.addColorStop(1, `rgba(${s.tint},0)`);
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 2.6 * pulse, 0, Math.PI * 2); ctx.fill();
    if (s.supernova) { // four-point sparkle
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      const r = s.r * 2.4 * pulse;
      ctx.beginPath(); ctx.moveTo(s.x, s.y - r); ctx.quadraticCurveTo(s.x, s.y, s.x + r, s.y); ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + r); ctx.quadraticCurveTo(s.x, s.y, s.x - r, s.y); ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - r); ctx.fill();
    }
  }

  function drawBg(t) {
    ctx.clearRect(0, 0, W, H);
    for (const b of bg) { ctx.fillStyle = `rgba(233,236,241,${0.25 + 0.5 * Math.abs(Math.sin(b.p + t / 900))})`; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); }
  }

  // Before you press Play: a few lazy stars drift by.
  let idleRaf = 0;
  function drawIdle(t) {
    drawBg(t);
    if (Math.random() < 0.02 && stars.length < 4) spawn(0);
    step(t, true);
    if (!playing && onScreen) idleRaf = requestAnimationFrame(drawIdle);
  }
  // Only animate the idle sky while the game is on screen.
  let onScreen = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      onScreen = es[0].isIntersecting;
      cancelAnimationFrame(idleRaf);
      if (onScreen && !playing) idleRaf = requestAnimationFrame(drawIdle);
    }).observe(box);
  }

  function step(t, idle) {
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x += s.vx * (idle ? 0.6 : 1); s.y += s.vy * (idle ? 0.6 : 1);
      drawStar(s, t);
      if (s.y > H + 160 || s.x < -200) stars.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy = p.vy * 0.94 + 0.05; p.life++;
      const a = 1 - p.life / p.max;
      ctx.fillStyle = `rgba(${p.tint},${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a + 0.3, 0, Math.PI * 2); ctx.fill();
      if (p.life >= p.max) sparks.splice(i, 1);
    }
    ctx.textAlign = 'center';
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.y -= 0.9; f.life++;
      const a = 1 - f.life / 60;
      ctx.fillStyle = `rgba(${f.tint},${a})`;
      ctx.font = `${f.big ? 800 : 700} ${f.big ? 22 : 16}px Inter, system-ui, sans-serif`;
      ctx.fillText(f.text, f.x, f.y);
      if (f.life >= 60) floats.splice(i, 1);
    }
  }

  function frame(t) {
    const elapsed = (t - t0) / 1000;
    const left = Math.max(0, ROUND - elapsed);
    drawBg(t);
    if (t > nextSpawn) {
      spawn(elapsed);
      const gap = 720 - Math.min(1, elapsed / ROUND) * 420; // gets busier
      nextSpawn = t + gap * (0.6 + Math.random() * 0.7);
    }
    step(t, false);
    $('.timebar i').style.transform = `scaleX(${left / ROUND})`;
    $('[data-time]').textContent = '0:' + String(Math.ceil(left)).padStart(2, '0');
    if (combo >= 3 && t - lastCatch < 900) { $('[data-combo]').textContent = `Combo ×${combo >= 6 ? 3 : 2}`; $('[data-combo]').classList.add('on'); }
    else $('[data-combo]').classList.remove('on');
    if (left <= 0) return end();
    raf = requestAnimationFrame(frame);
  }

  function catchAt(x, y) {
    let hit = -1, bestD = 1e9;
    stars.forEach((s, i) => {
      const d = Math.hypot(s.x - x, s.y - y) - s.r * (s.supernova ? 2.2 : 1.6);
      if (d < bestD) { bestD = d; hit = i; }
    });
    const reach = W < 600 ? 34 : 26;
    if (hit < 0 || bestD > reach) return false;
    take(hit);
    return true;
  }

  function take(i) {
    const s = stars.splice(i, 1)[0];
    const now = performance.now();
    combo = now - lastCatch < 900 ? combo + 1 : 1;
    lastCatch = now;
    const mult = combo >= 6 ? 3 : combo >= 3 ? 2 : 1;
    const pts = (s.supernova ? 5 : 1) * mult;
    score += pts; caughtCount++;
    tally[s.label] = (tally[s.label] || 0) + 1;
    $('[data-score]').textContent = score;
    burst(s.x, s.y, s.tint, s.supernova ? 60 : 22);
    floats.push({ x: s.x, y: s.y - 14, text: `+${pts} ${s.label}`, tint: s.tint, life: 0, big: s.supernova || mult > 1 });
    ping(combo, s.supernova);
    if (navigator.vibrate) navigator.vibrate(s.supernova ? 30 : 8);
    if (s.supernova && SS.shower) SS.shower();
  }

  function start() {
    cancelAnimationFrame(idleRaf);
    stars = []; sparks = []; floats = []; tally = {};
    score = 0; caughtCount = 0; combo = 0; lastCatch = 0;
    $('[data-score]').textContent = '0';
    $('[data-start]').hidden = true; $('[data-end]').hidden = true;
    playing = true;
    t0 = performance.now(); nextSpawn = t0 + 200;
    box.focus({ preventScroll: true });
    raf = requestAnimationFrame(frame);
  }

  function end() {
    playing = false;
    cancelAnimationFrame(raf);
    $('[data-combo]').classList.remove('on');
    const rank = RANKS.find(([lim]) => score < lim)[1];
    const newBest = score > best;
    if (newBest) { best = score; try { localStorage.setItem('ss_best', String(best)); } catch (e) { /* ignore */ } }
    showBest();
    $('[data-rank]').textContent = rank;
    $('[data-summary]').textContent = `${score} points · ${caughtCount} moment${caughtCount === 1 ? '' : 's'} caught${newBest && score ? ' · new personal best!' : best ? ` · your best is ${best}` : ''}`;
    $('[data-caught]').innerHTML = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `<span>${SS.esc(k)}${v > 1 ? ' ×' + v : ''}</span>`).join('');
    $('[data-end]').hidden = false;
    $('[data-again]').focus({ preventScroll: true });
    if (score >= 18 && SS.shower) SS.shower();
    root.dataset.lastScore = score; root.dataset.lastRank = rank;
    idleRaf = requestAnimationFrame(drawIdle);
  }

  // Taps and clicks on the sky
  box.tabIndex = 0;
  box.addEventListener('pointerdown', (e) => {
    if (!playing || e.target.closest('button, a')) return;
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (!catchAt(x, y)) { combo = 0; burst(x, y, '140,146,160', 5); }
  });
  // Keyboard: Space catches the star closest to falling out of the sky
  box.addEventListener('keydown', (e) => {
    if (!playing || (e.key !== ' ' && e.key !== 'Enter')) return;
    e.preventDefault();
    if (!stars.length) return;
    let i = 0; stars.forEach((s, k) => { if (s.y > stars[i].y) i = k; });
    take(i);
  });
  $('[data-play]').addEventListener('click', start);
  $('[data-again]').addEventListener('click', start);

  /* ---------- share: a 1080×1920 story image ---------- */
  $('[data-share]').addEventListener('click', async () => {
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1920;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(800, 300, 50, 800, 300, 1300);
    g.addColorStop(0, '#1d1640'); g.addColorStop(1, '#000');
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
    for (let i = 0; i < 320; i++) { x.globalAlpha = Math.random() * 0.8 + 0.1; x.fillStyle = ['#ffffff', '#a996ff', '#7ccbff', '#ff94b8'][i % 4]; x.beginPath(); x.arc(Math.random() * 1080, Math.random() * 1920, Math.random() * 2.2 + 0.4, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    [[1000, 220, 560, 480, '#ffffff'], [900, 520, 620, 690, '#a996ff'], [1040, 860, 760, 1030, '#7ccbff']].forEach(([a, b, c2, d, col]) => {
      const lg = x.createLinearGradient(a, b, c2, d); lg.addColorStop(0, col); lg.addColorStop(1, 'rgba(0,0,0,0)');
      x.strokeStyle = lg; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d); x.stroke();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(a, b, 8, 0, 7); x.fill();
    });
    await document.fonts.ready;
    x.textAlign = 'center';
    x.fillStyle = '#c3c9d3'; x.font = '700 36px Inter, sans-serif'; x.fillText('I CAUGHT ' + (root.dataset.lastScore || 0) + ' POINTS OF STARS', 540, 820);
    x.fillStyle = '#fff'; x.font = 'italic 900 150px "Bodoni Moda", serif'; x.fillText(root.dataset.lastRank || 'Stargazer', 540, 990);
    x.fillStyle = '#c3c9d3'; x.font = '600 34px Inter, sans-serif'; x.fillText('Can you catch more?', 540, 1080);
    const logo = new Image();
    logo.src = 'assets/brand/logo-stacked-white.svg';
    try { await logo.decode(); const w = 520, h = w * (logo.naturalHeight / logo.naturalWidth || 0.3); x.drawImage(logo, 540 - w / 2, 1460, w, h); } catch (e) { /* skip */ }
    c.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'my-shooting-stars-score.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'Catch a shooting star', text: `I'm a ${root.dataset.lastRank}! Can you catch more?` }); return; } catch (e) { /* cancelled */ }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'my-shooting-stars-score.png';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  });

  size();
  window.addEventListener('resize', () => { clearTimeout(size.t); size.t = setTimeout(size, 150); });
  idleRaf = requestAnimationFrame(drawIdle);

  // test hook: lets automated checks drop a star in a known place
  SS._game = { spawnAt: (x, y) => stars.push({ x, y, vx: 0, vy: 0.01, r: 8, len: 60, tint: '255,255,255', label: 'Haldi', supernova: false }), state: () => ({ playing, score }) };
})();
