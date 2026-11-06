/* Reels: live Instagram embeds, the reels wall, the rail and the wedding constellation. */
(function () {
  const SS = window.SS;
  const D = window.SS_DATA;
  const esc = SS.esc;

  /* ---------- one embed ---------- */
  let scriptState = 'idle';
  const waiting = [];
  function withInstagram(cb) {
    if (window.instgrm && window.instgrm.Embeds) return cb();
    waiting.push(cb);
    if (scriptState !== 'idle') return;
    scriptState = 'loading';
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.instagram.com/embed.js';
    s.onload = () => { scriptState = 'ready'; waiting.splice(0).forEach((f) => f()); };
    s.onerror = () => { scriptState = 'failed'; };
    document.head.append(s);
  }

  const permalink = (r) => `https://www.instagram.com/${r.kind === 'p' ? 'p' : 'reel'}/${encodeURIComponent(r.id)}/`;
  SS.permalink = permalink;

  function poster(r) {
    const label = r.chapter || r.title || D.reelCategories[r.category] || 'Reel';
    return `<div class="reel-poster" aria-hidden="true"><span class="eyebrow">${SS.star} SHOOTING STARS FILMS</span><span class="t">${esc(label)}</span><span class="loading">Loading from Instagram…</span></div>`;
  }

  // Place a live Instagram embed inside `frame`. A designed poster shows until it loads.
  SS.embed = function (frame, r) {
    if (!r || !r.id || frame.dataset.embedded) return;
    frame.dataset.embedded = '1';
    const url = permalink(r);
    if (r.poster) {
      // A custom poster image (optional "poster" column in the Sheet): tap to play.
      frame.innerHTML = `<button type="button" class="reel-play" style="all:unset;display:block;cursor:pointer;position:relative"><img src="${esc(r.poster)}" alt="${esc(r.title || 'Reel')}" loading="lazy" style="width:100%;aspect-ratio:9/16;object-fit:cover"><span class="btn btn-primary btn-sm" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">▶ Play</span></button>`;
      frame.querySelector('button').addEventListener('click', () => { delete frame.dataset.embedded; const copy = Object.assign({}, r, { poster: '' }); SS.embed(frame, copy); }, { once: true });
      return;
    }
    frame.innerHTML = `${poster(r)}<blockquote class="instagram-media" data-instgrm-permalink="${url}?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style="background:#0f0f13;border:0;margin:0;padding:0;width:100%"><a href="${url}" target="_blank" rel="noopener" style="display:block;padding:16px;color:#ddd">View this on Instagram</a></blockquote>`;
    const p = frame.querySelector('.reel-poster');
    const done = () => { if (p) p.remove(); frame.style.minHeight = '0'; };
    const mo = new MutationObserver(() => {
      const ifr = frame.querySelector('iframe');
      if (ifr) { mo.disconnect(); ifr.setAttribute('title', (r.title || 'Reel') + ' on Instagram'); ifr.addEventListener('load', () => setTimeout(done, 300), { once: true }); setTimeout(done, 4000); }
    });
    mo.observe(frame, { childList: true, subtree: true });
    setTimeout(() => {
      if (frame.querySelector('iframe')) return;
      mo.disconnect();
      const l = p && p.querySelector('.loading');
      if (l) l.innerHTML = `<a class="btn btn-primary btn-sm" href="${url}" target="_blank" rel="noopener">Watch on Instagram ↗</a>`;
    }, 12000);
    withInstagram(() => window.instgrm.Embeds.process());
  };

  // Load embeds only when they come near the screen.
  const lazy = 'IntersectionObserver' in window
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { lazy.unobserve(e.target); SS.embed(e.target, e.target._reel); } }), { rootMargin: '400px 0px' })
    : null;
  function lazyEmbed(frame, r) { frame._reel = r; if (lazy) lazy.observe(frame); else SS.embed(frame, r); }

  function card(r) {
    const el = document.createElement('article');
    el.className = 'reel-card reveal';
    el.innerHTML = `<header><strong>${esc(r.chapter || r.title || 'Reel')}</strong><span>${esc(D.reelCategories[r.category] || '')}</span></header><div class="reel-frame"></div><footer><a href="${permalink(r)}" target="_blank" rel="noopener">Open on Instagram ↗</a><a href="enquiry.html?shoot=${encodeURIComponent(r.category)}">Shoot like this ↗</a></footer>`;
    lazyEmbed(el.querySelector('.reel-frame'), r);
    return el;
  }

  const visible = (reels) => reels.filter((r) => r && r.id && r.visible !== false && String(r.visible).toUpperCase() !== 'FALSE').sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  /* ---------- the reels wall, with filters ---------- */
  SS.renderReelWall = function (root, reels, opts = {}) {
    const all = visible(reels).filter((r) => !opts.category || r.category === opts.category);
    const pageSize = opts.pageSize || 6;
    const cats = Array.from(new Set(all.map((r) => r.category)));
    let current = 'all', shown = pageSize;
    root.innerHTML = `${opts.filters !== false && cats.length > 1 ? `<div class="filters" role="group" aria-label="Filter reels"><button class="chip" type="button" aria-pressed="true" data-c="all">All</button>${cats.map((c) => `<button class="chip" type="button" aria-pressed="false" data-c="${esc(c)}">${esc(D.reelCategories[c] || c)}</button>`).join('')}</div>` : ''}<div class="reel-grid"></div><div class="center mt-m"><button class="btn btn-ghost more" type="button">Show more reels</button></div>`;
    const grid = root.querySelector('.reel-grid');
    const more = root.querySelector('.more');
    function draw() {
      const list = current === 'all' ? all : all.filter((r) => r.category === current);
      grid.innerHTML = '';
      list.slice(0, shown).forEach((r) => grid.append(card(r)));
      more.hidden = list.length <= shown;
      if (!list.length) grid.innerHTML = '<p class="muted">New reels are on the way.</p>';
      SS.reveal(grid);
    }
    SS.$$('.filters .chip', root).forEach((b) => b.addEventListener('click', () => {
      current = b.dataset.c; shown = pageSize;
      SS.$$('.filters .chip', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw();
    }));
    more.addEventListener('click', () => { shown += pageSize; draw(); });
    draw();
  };

  /* ---------- a horizontal rail of featured reels ---------- */
  SS.renderReelRail = function (root, reels, limit = 8) {
    let list = visible(reels).filter((r) => r.featured === true || String(r.featured).toUpperCase() === 'TRUE');
    if (!list.length) list = visible(reels);
    root.innerHTML = '<div class="rail" tabindex="0" aria-label="Featured reels, scroll sideways"></div>';
    const rail = root.querySelector('.rail');
    list.slice(0, limit).forEach((r) => rail.append(card(r)));
    SS.reveal(rail);
  };

  /* ---------- a wedding, star by star ---------- */
  SS.renderConstellation = function (root, reels) {
    const wed = visible(reels).filter((r) => r.category === 'weddings' && r.chapter);
    const order = D.weddingChapters.filter((c) => wed.some((r) => r.chapter === c));
    wed.forEach((r) => { if (!order.includes(r.chapter)) order.push(r.chapter); });
    if (!order.length) { root.closest('section') && (root.closest('section').hidden = true); return; }
    root.innerHTML = '<svg class="lines" aria-hidden="true"><path class="base"/><path class="draw"/></svg>' +
      order.map((c, i) => { const n = wed.filter((r) => r.chapter === c).length; return `<button class="cstar" type="button" data-c="${esc(c)}" aria-label="Play ${esc(c)} reel"><i></i><span>${esc(c)}</span><small>${String(i + 1).padStart(2, '0')}${n > 1 ? ' · ' + n + ' reels' : ''}</small></button>`; }).join('');
    const btns = SS.$$('.cstar', root);
    const base = root.querySelector('path.base'), draw = root.querySelector('path.draw');
    function place() {
      const w = root.clientWidth, h = root.clientHeight, narrow = w < 640, n = btns.length;
      const pts = btns.map((b, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        let x, y;
        if (narrow) { x = (i % 2 ? 0.7 : 0.3) * w; y = (0.1 + t * 0.8) * h; }
        else { x = (0.08 + t * 0.84) * w; y = (0.52 + Math.sin(t * Math.PI * 2.2 + 0.6) * 0.26) * h; }
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
    // Draw the silver line when the section comes into view.
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
      if (es[0].isIntersecting) { root.classList.add('lit'); draw.style.transition = SS.reduce ? 'none' : 'stroke-dashoffset 2.4s cubic-bezier(.2,.8,.2,1)'; draw.style.strokeDashoffset = 0; io.disconnect(); }
    }, { threshold: 0.35 }) : null;
    if (io) io.observe(root); else draw.style.strokeDashoffset = 0;
    btns.forEach((b) => b.addEventListener('click', () => {
      SS.burstFrom(b.querySelector('i'));
      SS.openReel(wed.filter((r) => r.chapter === b.dataset.c));
    }));
  };
})();
