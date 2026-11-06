/* Reels: cards that play on the page, a full-screen swipeable viewer, rails and
 * the wedding constellation.
 *
 * Each reel plays in one of two ways:
 *  1. A video file (MP4) you host: plays silently as you scroll, tap for sound and
 *     full screen. Always works, looks the cleanest. Set "video" (and ideally "poster").
 *  2. Instagram's own player: plays inline for most reels. Instagram blocks some
 *     reels from playing outside its app (usually because of licensed music); mark
 *     those embed: false and they stay hidden until you add a video file.
 */
(function () {
  const SS = window.SS;
  const D = window.SS_DATA;
  const esc = SS.esc;

  const CAT_COLOUR = {
    weddings: 'var(--rose)', celebrations: 'var(--rose)', sports: 'var(--sky)', automotive: 'var(--sky)', corporate: 'var(--sky)',
    store: 'var(--mint)', photography: 'var(--mint)', realestate: 'var(--mint)', brand: 'var(--violet)', movies: 'var(--violet)',
    latest: 'var(--violet)', featured: 'var(--silver)'
  };
  const colour = (r) => CAT_COLOUR[r.category] || 'var(--silver)';
  const yes = (v) => v === true || String(v).toUpperCase() === 'TRUE';
  const no = (v) => v === false || String(v).toUpperCase() === 'FALSE';

  const ICON_SOUND = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const ICON_MUTE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  const permalink = (r) => `https://www.instagram.com/${r.kind === 'p' ? 'p' : 'reel'}/${encodeURIComponent(r.id)}/`;
  const embedUrl = (r) => permalink(r) + 'embed/';
  SS.permalink = permalink;

  /** Can this reel play on our site? */
  SS.playable = (r) => !!(r && r.visible !== false && !no(r.visible) && (r.video || (r.id && !no(r.embed))));
  const visible = (reels) => reels.filter(SS.playable).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  SS.visibleReels = visible;

  /* ---------- Instagram frames report their height; size them to fit ---------- */
  window.addEventListener('message', (e) => {
    if (!/^https:\/\/www\.instagram\.com$/.test(e.origin)) return;
    let d = e.data;
    try { if (typeof d === 'string') d = JSON.parse(d); } catch (x) { return; }
    if (!d || d.type !== 'MEASURE' || !d.details || !d.details.height) return;
    SS.$$('iframe[data-ig]').forEach((f) => { if (f.contentWindow === e.source) { f.style.height = d.details.height + 'px'; f.style.minHeight = '0'; f.parentElement.style.minHeight = '0'; } });
  });

  function igFrame(r) {
    const f = document.createElement('iframe');
    f.src = embedUrl(r);
    f.dataset.ig = r.id;
    f.title = (r.title || 'Reel') + ' — Shooting Stars on Instagram';
    f.loading = 'lazy';
    f.setAttribute('scrolling', 'no');
    f.setAttribute('allowtransparency', 'true');
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write';
    f.setAttribute('allowfullscreen', '');
    return f;
  }

  /* ---------- muted previews play only while on screen ---------- */
  const autoplay = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && e.intersectionRatio > 0.45 && !SS.reduce) v.play().catch(() => {});
    else v.pause();
  }), { threshold: [0, 0.45, 0.8] }) : null;

  /** Fill a frame with the right player for this reel. */
  SS.embed = function (frame, r, opts = {}) {
    if (!r || frame.dataset.embedded) return;
    frame.dataset.embedded = '1';
    frame.style.setProperty('--c', colour(r));
    if (r.video) {
      frame.classList.add('video');
      frame.innerHTML = `<video muted loop playsinline preload="metadata" ${r.poster ? `poster="${esc(r.poster)}"` : ''} aria-label="${esc(r.title || 'Reel')}"><source src="${esc(r.video)}" type="video/mp4"></video>${opts.inline ? '' : '<span class="badge-play">▶ Tap for sound</span>'}`;
      const v = frame.querySelector('video');
      if (autoplay) autoplay.observe(v); else v.play().catch(() => {});
      if (!opts.inline) frame.addEventListener('click', () => { if (opts.onOpen) opts.onOpen(); });
      return;
    }
    frame.classList.add('embed');
    const label = r.chapter || r.title || D.reelCategories[r.category] || 'Reel';
    frame.innerHTML = `<div class="reel-poster" aria-hidden="true"><span class="eyebrow">${SS.star} SHOOTING STARS FILMS</span><span class="t">${esc(label)}</span><span class="loading">Loading the reel…</span></div>`;
    const f = igFrame(r);
    const p = frame.querySelector('.reel-poster');
    f.addEventListener('load', () => { setTimeout(() => { p.style.opacity = '0'; setTimeout(() => p.remove(), 400); }, 250); }, { once: true });
    frame.append(f);
  };

  // Only build players when the card comes near the screen.
  const lazy = 'IntersectionObserver' in window
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { lazy.unobserve(e.target); SS.embed(e.target, e.target._reel, e.target._opts); } }), { rootMargin: '500px 0px' })
    : null;
  function lazyEmbed(frame, r, opts) { frame._reel = r; frame._opts = opts; if (lazy) lazy.observe(frame); else SS.embed(frame, r, opts); }

  function card(r, list) {
    const el = document.createElement('article');
    el.className = 'reel-card reveal';
    el.style.setProperty('--c', colour(r));
    const open = () => SS.openStory(list, list.indexOf(r));
    el.innerHTML = `<header><strong>${esc(r.chapter || r.title || 'Reel')}</strong><span><i></i>${esc(D.reelCategories[r.category] || '')}</span></header><div class="reel-frame"></div><footer><button type="button" data-full>⤢ Full screen</button><a href="enquiry.html?shoot=${encodeURIComponent(r.category)}">Shoot like this ↗</a></footer>`;
    el.querySelector('[data-full]').addEventListener('click', open);
    lazyEmbed(el.querySelector('.reel-frame'), r, { onOpen: open });
    return el;
  }

  /* ---------- the reels wall, with filters ---------- */
  SS.renderReelWall = function (root, reels, opts = {}) {
    const all = visible(reels).filter((r) => !opts.category || r.category === opts.category);
    const pageSize = opts.pageSize || 6;
    const cats = Array.from(new Set(all.map((r) => r.category)));
    let current = 'all', shown = pageSize;
    root.innerHTML = `${opts.filters !== false && cats.length > 1 ? `<div class="filters" role="group" aria-label="Filter reels"><button class="chip" type="button" aria-pressed="true" data-c="all">All</button>${cats.map((c) => `<button class="chip" type="button" aria-pressed="false" data-c="${esc(c)}" style="--c:${CAT_COLOUR[c] || 'var(--silver)'}"><span class="dot"></span>${esc(D.reelCategories[c] || c)}</button>`).join('')}</div>` : ''}<div class="reel-grid"></div><div class="row mt-m" style="justify-content:center"><button class="btn btn-ghost more" type="button">Show more reels</button><button class="btn btn-primary watch" type="button">▶ Watch them all</button></div>`;
    const grid = root.querySelector('.reel-grid'), more = root.querySelector('.more');
    const list = () => (current === 'all' ? all : all.filter((r) => r.category === current));
    function draw() {
      const l = list();
      grid.innerHTML = '';
      l.slice(0, shown).forEach((r) => grid.append(card(r, l)));
      more.hidden = l.length <= shown;
      root.querySelector('.watch').hidden = !l.length;
      if (!l.length) grid.innerHTML = '<p class="muted">New reels are on the way.</p>';
      SS.reveal(grid);
    }
    SS.$$('.filters .chip', root).forEach((b) => b.addEventListener('click', () => {
      current = b.dataset.c; shown = pageSize;
      SS.$$('.filters .chip', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw();
    }));
    more.addEventListener('click', () => { shown += pageSize; draw(); });
    root.querySelector('.watch').addEventListener('click', () => SS.openStory(list(), 0));
    draw();
  };

  /* ---------- a horizontal rail of featured reels ---------- */
  SS.renderReelRail = function (root, reels, limit = 8) {
    let list = visible(reels).filter((r) => yes(r.featured));
    if (!list.length) list = visible(reels);
    list = list.slice(0, limit);
    root.innerHTML = '<div class="rail" tabindex="0" aria-label="Featured reels, scroll sideways"></div>';
    const rail = root.querySelector('.rail');
    list.forEach((r) => rail.append(card(r, list)));
    SS.reveal(rail);
    return list;
  };

  /** Hero: one reel playing inside the phone. */
  SS.renderHeroReel = function (frame, reels) {
    const list = visible(reels);
    const r = list.find((x) => x.video && yes(x.featured)) || list.find((x) => yes(x.featured)) || list[0];
    if (r) SS.embed(frame, r, { inline: !r.video, onOpen: () => SS.openStory(list, list.indexOf(r)) });
  };

  /* ---------- full-screen viewer: swipe through reels like stories ---------- */
  SS.openStory = function (list, start = 0) {
    list = (list || []).filter(SS.playable);
    if (!list.length) return;
    let i = Math.max(0, Math.min(start, list.length - 1));
    let muted = false;
    const opener = document.activeElement;
    const el = document.createElement('div');
    el.className = 'story';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Reels viewer');
    el.innerHTML = `<div class="bars">${list.map(() => '<i><b></b></i>').join('')}</div>
      <div class="top"><strong></strong><div class="row" style="gap:8px"><button class="ctrl" type="button" data-mute aria-label="Sound on or off">${ICON_SOUND}</button><button class="ctrl" type="button" data-close aria-label="Close">✕</button></div></div>
      <div class="stage"></div>
      <button class="nav-zone prev" type="button" aria-label="Previous reel"></button><button class="nav-zone next" type="button" aria-label="Next reel"></button>
      <button class="ctrl side l" type="button" data-prev aria-label="Previous reel">‹</button><button class="ctrl side r" type="button" data-next aria-label="Next reel">›</button>
      <div class="bottom"><a class="btn btn-primary btn-sm" data-shoot href="enquiry.html">Shoot like this ↗</a><a class="btn btn-ghost btn-sm" data-ig target="_blank" rel="noopener">Instagram ↗</a></div>`;
    document.body.append(el);
    document.body.style.overflow = 'hidden';
    const stage = el.querySelector('.stage'), bars = SS.$$('.bars i', el), title = el.querySelector('.top strong'), muteBtn = el.querySelector('[data-mute]');
    let raf = 0;

    function show(n) {
      cancelAnimationFrame(raf);
      i = (n + list.length) % list.length;
      const r = list[i];
      bars.forEach((b, k) => { b.classList.toggle('done', k < i); b.querySelector('b').style.width = k < i ? '100%' : '0'; });
      title.textContent = r.chapter || r.title || '';
      el.querySelector('[data-shoot]').href = 'enquiry.html?shoot=' + encodeURIComponent(r.category);
      const ig = el.querySelector('[data-ig]');
      ig.hidden = !r.id || String(r.id).startsWith('video-');
      ig.href = permalink(r);
      stage.innerHTML = '';
      el.classList.toggle('embed-mode', !r.video);
      muteBtn.hidden = !r.video;
      if (r.video) {
        const v = document.createElement('video');
        v.src = r.video; v.playsInline = true; v.autoplay = true; v.muted = muted; if (r.poster) v.poster = r.poster;
        v.setAttribute('aria-label', r.title || 'Reel');
        stage.append(v);
        v.play().catch(() => { v.muted = true; muted = true; muteBtn.innerHTML = ICON_MUTE; v.play().catch(() => {}); });
        v.addEventListener('ended', () => show(i + 1));
        const bar = bars[i].querySelector('b');
        const tick = () => { if (v.duration) bar.style.width = (v.currentTime / v.duration) * 100 + '%'; raf = requestAnimationFrame(tick); };
        tick();
      } else {
        bars[i].querySelector('b').style.width = '100%';
        stage.append(igFrame(r));
      }
    }
    function close() {
      cancelAnimationFrame(raf);
      el.remove(); document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (opener && opener.focus) opener.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(i + 1);
      else if (e.key === 'ArrowLeft') show(i - 1);
      else if (e.key === 'Tab') setTimeout(() => { if (!el.contains(document.activeElement)) el.querySelector('[data-close]').focus(); }, 0);
    }
    document.addEventListener('keydown', onKey);
    el.querySelector('[data-close]').addEventListener('click', close);
    el.querySelector('.nav-zone.prev').addEventListener('click', () => show(i - 1));
    el.querySelector('.nav-zone.next').addEventListener('click', () => show(i + 1));
    el.querySelector('[data-prev]').addEventListener('click', () => show(i - 1));
    el.querySelector('[data-next]').addEventListener('click', () => show(i + 1));
    muteBtn.addEventListener('click', () => { muted = !muted; const v = stage.querySelector('video'); if (v) v.muted = muted; muteBtn.innerHTML = muted ? ICON_MUTE : ICON_SOUND; });
    let sx = null;
    el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); sx = null; });
    show(i);
    el.querySelector('[data-close]').focus();
  };
  SS.openReel = (reelOrList) => SS.openStory(Array.isArray(reelOrList) ? reelOrList : [reelOrList], 0);

  /* ---------- a wedding, star by star ---------- */
  SS.renderConstellation = function (root, reels) {
    const wed = visible(reels).filter((r) => r.category === 'weddings' && r.chapter);
    const order = D.weddingChapters.filter((c) => wed.some((r) => r.chapter === c));
    wed.forEach((r) => { if (!order.includes(r.chapter)) order.push(r.chapter); });
    if (!order.length) { const s = root.closest('section'); if (s) s.hidden = true; return; }
    root.innerHTML = '<svg class="lines" aria-hidden="true"><path class="base"/><path class="draw"/></svg>' +
      order.map((c, i) => { const n = wed.filter((r) => r.chapter === c).length; return `<button class="cstar" type="button" data-c="${esc(c)}" aria-label="Play ${esc(c)}"><i></i><span>${esc(c)}</span><small>${String(i + 1).padStart(2, '0')}${n > 1 ? ' · ' + n + ' reels' : ''}</small></button>`; }).join('');
    const btns = SS.$$('.cstar', root);
    const base = root.querySelector('path.base'), draw = root.querySelector('path.draw');
    function place() {
      const w = root.clientWidth, h = root.clientHeight, narrow = w < 640, n = btns.length;
      const pts = btns.map((b, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        let x, y;
        if (narrow) { x = (i % 2 ? 0.7 : 0.3) * w; y = (0.1 + t * 0.8) * h; }
        else { x = (0.08 + t * 0.84) * w; y = (0.5 + Math.sin(t * Math.PI * 2.2 + 0.6) * 0.26) * h; }
        b.style.left = x + 'px'; b.style.top = y + 'px';
        return [x, y];
      });
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      base.setAttribute('d', d); draw.setAttribute('d', d);
      const len = draw.getTotalLength ? draw.getTotalLength() : 0;
      draw.style.strokeDasharray = len; draw.style.strokeDashoffset = root.classList.contains('lit') ? 0 : len;
    }
    place();
    window.addEventListener('resize', () => { clearTimeout(place.t); place.t = setTimeout(place, 120); });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
      if (es[0].isIntersecting) { root.classList.add('lit'); draw.style.transition = SS.reduce ? 'none' : 'stroke-dashoffset 2.4s cubic-bezier(.2,.8,.2,1)'; draw.style.strokeDashoffset = 0; io.disconnect(); }
    }, { threshold: 0.35 }) : null;
    if (io) io.observe(root); else draw.style.strokeDashoffset = 0;
    // Tapping a star plays that ceremony, then carries on through the rest of the wedding.
    btns.forEach((b) => b.addEventListener('click', () => {
      SS.burstFrom(b.querySelector('i'));
      const ordered = order.flatMap((c) => wed.filter((r) => r.chapter === c));
      SS.openStory(ordered, ordered.findIndex((r) => r.chapter === b.dataset.c));
    }));
  };
})();
