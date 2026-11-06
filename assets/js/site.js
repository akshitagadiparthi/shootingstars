/* Shooting Stars Media — shared layout, live content and the shooting-star effects. */
(function () {
  const C = window.SS_CONFIG || {};
  const D = window.SS_DATA;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  const SS = (window.SS = window.SS || {});
  SS.reduce = reduce;

  /* ---------- helpers ---------- */
  SS.esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  SS.param = (k) => new URLSearchParams(location.search).get(k);
  SS.$ = (s, r = document) => r.querySelector(s);
  SS.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  SS.star = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z"/></svg>';
  SS.whatsapp = (text) => (C.WHATSAPP ? 'https://wa.me/' + C.WHATSAPP + '?text=' + encodeURIComponent(text || 'Hi Shooting Stars, I would like to talk about a project.') : '');

  // Remember where a visitor came from (UTM tags / referrer) for the enquiry Sheet.
  try {
    const q = new URLSearchParams(location.search);
    if (!sessionStorage.getItem('ss_src')) {
      const src = {
        utm_source: q.get('utm_source') || '', utm_medium: q.get('utm_medium') || '', utm_campaign: q.get('utm_campaign') || '',
        referrer: document.referrer && !document.referrer.includes(location.host) ? document.referrer : '', landing: location.pathname
      };
      sessionStorage.setItem('ss_src', JSON.stringify(src));
    }
  } catch (e) { /* storage blocked: fine */ }
  SS.source = () => { try { return JSON.parse(sessionStorage.getItem('ss_src') || '{}'); } catch (e) { return {}; } };

  /* ---------- header & footer ---------- */
  const page = document.body.dataset.page || '';
  const nav = [
    ['index.html', 'Home', 'home'], ['labs.html', 'Marketing Labs', 'labs'], ['films.html', 'Films', 'films'],
    ['work.html', 'Our Work', 'work'], ['industries.html', 'Industries', 'industries'], ['careers.html', 'Careers', 'careers']
  ];
  const minor = [['about.html', 'About'], ['contact.html', 'Contact'], ['faq.html', 'FAQ'], ['network.html', 'Freelance network'], ['privacy.html', 'Privacy']];

  let intro = false;
  try { intro = !reduce && !sessionStorage.getItem('ss_intro'); sessionStorage.setItem('ss_intro', '1'); } catch (e) { /* ignore */ }

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="wrap">
      <a class="brand${intro ? ' intro' : ''}" href="index.html" aria-label="Shooting Stars Media, home">
        <img src="assets/brand/logo-horizontal-white.svg" alt="" width="220" height="30">
        <span class="brand-media">MEDIA</span>
      </a>
      <nav class="nav" aria-label="Main">
        ${nav.map(([h, t, k]) => `<a href="${h}"${k === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
      </nav>
      <div class="row">
        <a class="btn btn-primary btn-sm header-cta" href="start.html">Start a project ↗</a>
        <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="ss-menu"><span></span></button>
      </div>
    </div>`;
  document.body.prepend(header);

  const menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.id = 'ss-menu';
  menu.hidden = true;
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-label', 'Menu');
  menu.innerHTML = `
    <div class="top">
      <img src="assets/brand/logo-horizontal-white.svg" alt="Shooting Stars" style="height:26px;width:auto">
      <button class="menu-btn" type="button" aria-label="Close menu" style="display:inline-flex">✕</button>
    </div>
    ${nav.map(([h, t]) => `<a class="big" href="${h}">${t}</a>`).join('')}
    <a class="btn btn-primary mt-m" href="start.html">Start a project ↗</a>
    <div class="minor">${minor.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</div>`;
  document.body.append(menu);
  const openBtn = header.querySelector('.menu-btn');
  const closeBtn = menu.querySelector('.menu-btn');
  const toggleMenu = (open) => {
    menu.hidden = !open; openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    (open ? closeBtn : openBtn).focus();
  };
  openBtn.addEventListener('click', () => toggleMenu(true));
  closeBtn.addEventListener('click', () => toggleMenu(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) toggleMenu(false); });

  const year = new Date().getFullYear();
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="wrap">
      <div class="cols">
        <div class="stack">
          <img src="assets/brand/logo-stacked-media-white.svg" alt="Shooting Stars Media" style="width:190px">
          <p class="muted small">Strategy + production, under one roof.</p>
          <div class="row">
            <a class="btn btn-ghost btn-sm" href="${C.INSTAGRAM_FILMS}" target="_blank" rel="noopener">Instagram · Films</a>
            <a class="btn btn-ghost btn-sm" href="${C.INSTAGRAM_LABS}" target="_blank" rel="noopener">Instagram · Branding</a>
          </div>
        </div>
        <div><h4>Divisions</h4><a href="labs.html">Marketing Labs</a><a href="films.html">Shooting Stars Films</a><a href="work.html">Our Work</a><a href="industries.html">Industries</a></div>
        <div><h4>Company</h4><a href="about.html">About</a><a href="careers.html">Careers &amp; Freelance</a><a href="contact.html">Contact</a><a href="faq.html">FAQ</a></div>
        <div><h4>Start</h4><a href="proposal.html">Request Proposal</a><a href="enquiry.html">Request a Shoot</a>${C.WHATSAPP ? `<a href="${SS.whatsapp()}" target="_blank" rel="noopener">WhatsApp us</a>` : ''}${C.EMAIL ? `<a href="mailto:${C.EMAIL}">${SS.esc(C.EMAIL)}</a>` : ''}</div>
      </div>
      <div class="legal"><span>© ${year} ${SS.esc(C.COMPANY || 'Shooting Stars Media')}</span><span><a href="privacy.html">Privacy</a></span></div>
    </div>`;
  document.body.append(footer);

  if (!['enquiry', 'proposal', 'apply', 'network'].includes(page)) {
    const dock = document.createElement('div');
    dock.className = 'dock';
    dock.innerHTML = `<a class="btn btn-primary" href="start.html">Start a project ↗</a>${C.WHATSAPP ? `<a class="btn btn-ghost" href="${SS.whatsapp()}" target="_blank" rel="noopener">WhatsApp</a>` : `<a class="btn btn-ghost" href="work.html">Our work</a>`}`;
    document.body.append(dock);
  }

  /* ---------- live content (Google Sheet), with built-in defaults ---------- */
  function packagesFromRows(rows) {
    const out = { instant: {}, professional: {} };
    rows.filter((r) => r.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((r) => {
      const mode = String(r.mode || 'instant').toLowerCase().startsWith('pro') ? 'professional' : 'instant';
      const cat = r.category || 'Packages';
      (out[mode][cat] = out[mode][cat] || []).push({
        tag: r.tag || '', title: r.title || '', price: r.price || 'Custom quote', suffix: r.suffix || '', desc: r.desc || '',
        features: Array.isArray(r.features) ? r.features : String(r.features || '').split(/\n|;/).map((s) => s.trim()).filter(Boolean),
        popular: !!r.popular
      });
    });
    return Object.keys(out.instant).length || Object.keys(out.professional).length ? out : null;
  }

  let contentPromise = null;
  SS.content = function () {
    if (contentPromise) return contentPromise;
    const fallback = { reels: D.reels, jobs: D.jobs, packages: D.packages, settings: D.settings, instagram: [], live: false };
    if (!C.API_URL) return (contentPromise = Promise.resolve(fallback));
    const key = 'ss_content_v1';
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (cached && Date.now() - cached.t < (C.CONTENT_CACHE_MINUTES || 5) * 60000) return (contentPromise = Promise.resolve(cached.v));
    } catch (e) { /* ignore */ }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    contentPromise = fetch(C.API_URL + '?action=content', { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        clearTimeout(timer);
        if (!j || !j.ok) return fallback;
        let reels = Array.isArray(j.reels) && j.reels.length ? j.reels : D.reels;
        // Newest Instagram posts (if Instagram is connected in the Sheet) appear first, automatically.
        if (Array.isArray(j.instagram) && j.instagram.length) {
          const known = new Set(reels.map((r) => r.id));
          const fresh = j.instagram.filter((m) => m.id && !known.has(m.id)).slice(0, 6)
            .map((m, i) => ({ id: m.id, kind: m.kind, category: 'latest', title: 'New on Instagram', featured: true, visible: true, order: -100 + i }));
          reels = fresh.concat(reels);
        }
        const v = {
          reels,
          jobs: Array.isArray(j.jobs) ? j.jobs : D.jobs,
          packages: (Array.isArray(j.packages) && packagesFromRows(j.packages)) || D.packages,
          settings: Object.assign({}, D.settings, j.settings || {}),
          instagram: Array.isArray(j.instagram) ? j.instagram : [],
          live: true
        };
        try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch (e) { /* ignore */ }
        return v;
      })
      .catch(() => fallback);
    return contentPromise;
  };

  /* ---------- reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  SS.reveal = (root = document) => SS.$$('.reveal:not(.in)', root).forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

  /* ---------- the night sky ---------- */
  const sky = document.createElement('canvas');
  sky.id = 'ss-sky'; sky.setAttribute('aria-hidden', 'true');
  const fx = document.createElement('canvas');
  fx.id = 'ss-fx'; fx.setAttribute('aria-hidden', 'true');
  document.body.prepend(sky);
  document.body.append(fx);
  const sctx = sky.getContext('2d');
  const fctx = fx.getContext('2d');
  let W = 0, H = 0, DPR = 1, stars = [], meteors = [], particles = [], nextMeteor = 0, running = false;

  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = document.documentElement.clientWidth; H = window.innerHeight;
    [sky, fx].forEach((c) => { c.width = W * DPR; c.height = H * DPR; c.style.width = '100%'; c.style.height = '100%'; });
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0); fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round((W * H) / 7000);
    stars = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + 0.25, p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2 }));
    if (reduce) drawSky(0);
  }

  function spawnMeteor(fast) {
    const startX = W * (0.35 + Math.random() * 0.75);
    const startY = -20 + Math.random() * H * 0.35;
    const speed = fast ? 14 + Math.random() * 8 : 7 + Math.random() * 5;
    const ang = Math.PI * (0.78 + Math.random() * 0.06); // down-left
    meteors.push({ x: startX, y: startY, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, len: 120 + Math.random() * 160, life: 0, max: 70 + Math.random() * 40 });
  }

  function drawSky(t) {
    sctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = reduce ? 0.6 : 0.35 + 0.65 * Math.abs(Math.sin(s.p + t * 0.0006 * s.s));
      sctx.globalAlpha = a * 0.85;
      sctx.fillStyle = '#e9ecf1';
      sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); sctx.fill();
    }
    sctx.globalAlpha = 1;
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life++;
      const fade = Math.min(1, m.life / 10) * Math.max(0, 1 - m.life / m.max);
      const tx = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.len;
      const ty = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.len;
      const g = sctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`);
      g.addColorStop(0.2, `rgba(221,225,231,${0.55 * fade})`);
      g.addColorStop(1, 'rgba(221,225,231,0)');
      sctx.strokeStyle = g; sctx.lineWidth = 1.6; sctx.lineCap = 'round';
      sctx.beginPath(); sctx.moveTo(m.x, m.y); sctx.lineTo(tx, ty); sctx.stroke();
      sctx.fillStyle = `rgba(255,255,255,${fade})`;
      sctx.beginPath(); sctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2); sctx.fill();
      if (m.life > m.max || m.x < -300 || m.y > H + 300) meteors.splice(i, 1);
    }
  }

  function drawFx() {
    fctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.life++;
      const a = Math.max(0, 1 - p.life / p.max);
      if (p.line) {
        fctx.strokeStyle = `rgba(235,238,243,${a})`; fctx.lineWidth = p.r; fctx.lineCap = 'round';
        fctx.beginPath(); fctx.moveTo(p.x, p.y); fctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4); fctx.stroke();
      } else {
        fctx.fillStyle = `rgba(240,242,246,${a})`;
        fctx.beginPath(); fctx.arc(p.x, p.y, p.r * a + 0.2, 0, Math.PI * 2); fctx.fill();
      }
      if (p.life >= p.max) particles.splice(i, 1);
    }
  }

  function loop(t) {
    if (document.hidden) { running = false; return; }
    if (t > nextMeteor) { spawnMeteor(false); nextMeteor = t + 2600 + Math.random() * 4200; }
    drawSky(t);
    drawFx();
    requestAnimationFrame(loop);
  }
  function start() { if (!running && !reduce) { running = true; requestAnimationFrame(loop); } }
  size();
  window.addEventListener('resize', () => { clearTimeout(size.t); size.t = setTimeout(size, 150); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  start();

  // A burst of stars from a point: used when a form is sent.
  SS.burst = function (x, y, n = 60) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 9;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.94, g: 0.06, r: 1.4 + Math.random() * 1.4, life: 0, max: 50 + Math.random() * 40, line: Math.random() < 0.5 });
    }
    start();
  };
  SS.burstFrom = (el) => { const r = el.getBoundingClientRect(); SS.burst(r.left + r.width / 2, r.top + r.height / 2); };

  // A meteor shower across the whole screen.
  SS.shower = function () {
    if (reduce) return;
    let k = 0;
    const iv = setInterval(() => { spawnMeteor(true); if (++k > 26) clearInterval(iv); }, 90);
    start();
  };

  // Stardust that follows the pointer on desktop.
  if (fine && !reduce) {
    let last = 0;
    window.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - last < 28) return;
      last = now;
      particles.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 0.6, vy: 0.2 + Math.random() * 0.6, drag: 0.98, g: 0.01, r: 1 + Math.random() * 1.3, life: 0, max: 34 + Math.random() * 20 });
      if (particles.length > 220) particles.splice(0, particles.length - 220);
    }, { passive: true });
  }

  // Easter egg: type "wish" anywhere (outside a form) for a meteor shower.
  let typed = '';
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    typed = (typed + (e.key || '')).slice(-4).toLowerCase();
    if (typed === 'wish') { SS.shower(); typed = ''; }
  });

  // Scroll meteor: one star travels down the edge of the page as you read.
  const sm = document.createElement('div');
  sm.className = 'scroll-meteor';
  sm.setAttribute('aria-hidden', 'true');
  sm.innerHTML = '<b></b><i></i>';
  document.body.append(sm);
  const smStar = sm.querySelector('i'), smTail = sm.querySelector('b');
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    smStar.style.top = p * 100 + '%';
    smTail.style.top = Math.max(0, p * 100 - 18) + '%';
    smTail.style.height = Math.min(p * 100, 18) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reel lightbox ---------- */
  SS.openReel = function (reelOrList) {
    const list = Array.isArray(reelOrList) ? reelOrList : [reelOrList];
    const reel = list[0];
    const opener = document.activeElement;
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', reel.title || 'Reel');
    box.innerHTML = `<div class="box"><header><div><div class="eyebrow">${SS.esc((D.reelCategories[reel.category] || '').toUpperCase())}${list.length > 1 ? ' · ' + list.length + ' REELS' : ''}</div><strong style="display:block;margin-top:4px;font-size:24px;font-style:italic">${SS.esc(reel.chapter || reel.title || '')}</strong></div><button class="close" type="button" aria-label="Close">✕</button></header>${list.map(() => '<div class="reel-frame" style="margin-bottom:12px"></div>').join('')}</div>`;
    document.body.append(box);
    document.body.style.overflow = 'hidden';
    const close = () => { box.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); if (opener && opener.focus) opener.focus(); };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') setTimeout(() => { if (!box.contains(document.activeElement)) box.querySelector('.close').focus(); }, 0); // keep focus inside
    };
    document.addEventListener('keydown', onKey);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    box.querySelector('.close').addEventListener('click', close);
    box.querySelector('.close').focus();
    if (SS.embed) SS.$$('.reel-frame', box).forEach((f, i) => SS.embed(f, list[i]));
  };

  document.addEventListener('DOMContentLoaded', () => SS.reveal());
  if (document.readyState !== 'loading') SS.reveal();
})();
