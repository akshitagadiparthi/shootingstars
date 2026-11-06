/* Page-specific rendering. Each page sets <body data-page="…">. */
(function () {
  const SS = window.SS;
  const D = window.SS_DATA;
  const esc = SS.esc;
  const page = document.body.dataset.page;
  const $ = (id) => document.getElementById(id);

  const marqueeHTML = (items) => {
    const once = items.map((t) => `<span>${esc(t)} ${SS.star}</span>`).join('');
    return `<div class="track" aria-hidden="true">${once}${once}</div><span class="sr-only">${items.map(esc).join(', ')}</span>`;
  };
  const artCard = (theme, label, sub, href) => `<a class="card card-link reveal" href="${href}" style="padding:12px">${SS.ill(theme, label)}<div style="padding:8px 10px 10px"><h3 style="font-size:22px">${esc(label)}</h3><p class="small muted mt-s">${esc(sub)}</p></div></a>`;

  function setTitle(t) { document.title = t + ' · Shooting Stars Media'; }
  function notFound(el, what) { el.innerHTML = `<div class="wrap section"><h1 class="h1">That ${what} isn’t here.</h1><p class="lead mt-m">It may have moved.</p><div class="row mt-m"><a class="btn btn-primary" href="index.html">Back to home</a></div></div>`; }

  /* ---------- shared blocks ---------- */
  function servicesGrid(el, limit) {
    el.innerHTML = D.services.slice(0, limit || D.services.length).map((s, i) => `<a class="card card-link reveal" href="service.html?s=${s.slug}"><span class="eyebrow">Service / ${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.name)}</h3><p>${esc(s.intro)}</p><span class="arrow">Explore ↗</span></a>`).join('');
  }
  function industriesGrid(el) {
    el.innerHTML = D.industries.map((s, i) => `<a class="card card-link reveal" href="industry.html?i=${s.slug}"><span class="eyebrow">Industry / ${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.name)}</h3><p>${esc(s.intro)}</p><span class="arrow">Explore industry ↗</span></a>`).join('');
  }
  function occasionsGrid(el) {
    el.innerHTML = D.occasions.map((o) => artCard(SS.illFor.occasion[o.slug] || 'camera', o.name, o.work + '.', 'shoot.html?t=' + o.slug)).join('');
  }
  function projectsList(el, filtersEl, initial) {
    const labels = { all: 'All Work', labs: 'Marketing Labs', films: 'Films', both: 'Integrated' };
    filtersEl.innerHTML = Object.entries(labels).map(([k, v]) => `<button class="chip" type="button" data-f="${k}" aria-pressed="${k === (initial || 'all')}">${v}</button>`).join('');
    const draw = (f) => {
      el.innerHTML = D.projects.filter((p) => f === 'all' || p.type === f).map((p) => `<a class="card card-link reveal" href="project.html?p=${p.slug}">${SS.ill(SS.illFor.project[p.slug] || 'rocket', p.title)}<span class="eyebrow">${esc(p.industry)} · ${{ labs: 'Marketing Labs', films: 'Films', both: 'Labs + Films' }[p.type]}</span><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p><span class="arrow">Explore project ↗</span></a>`).join('');
      SS.reveal(el);
    };
    filtersEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      SS.$$('[data-f]', filtersEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw(b.dataset.f);
    });
    draw(initial || 'all');
  }
  function labWorkList(el, filtersEl) {
    const groups = { all: 'All', strategy: 'Strategy', content: 'Content', growth: 'Growth' };
    filtersEl.innerHTML = Object.entries(groups).map(([k, v]) => `<button class="chip" type="button" data-g="${k}" aria-pressed="${k === 'all'}">${v}</button>`).join('');
    const draw = (g) => {
      el.innerHTML = D.labWork.filter((w) => g === 'all' || w.group === g).map((w) => {
        const svc = D.services.find((s) => s.name === w.service);
        return `<a class="card card-link reveal" href="service.html?s=${svc ? svc.slug : ''}" style="padding:12px">${SS.ill(SS.illFor.service[w.service] || 'pen', w.service)}<div style="padding:8px 10px 10px"><span class="eyebrow">${esc(w.service)}</span><h3 style="font-size:22px;margin-top:8px">${esc(w.work)} ↗</h3><p class="small muted mt-s">${esc(w.client)} · Example case study</p></div></a>`;
      }).join('');
      SS.reveal(el);
    };
    filtersEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      SS.$$('[data-g]', filtersEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw(b.dataset.g);
    });
    draw('all');
  }

  /* ---------- Films packages ---------- */
  function packagesBlock(root, packages) {
    let mode = SS.param('mode') === 'professional' ? 'professional' : 'instant';
    let cat = null;
    const modes = root.querySelector('[data-modes]'), tabs = root.querySelector('[data-tabs]'), grid = root.querySelector('[data-grid]');
    const copy = {
      instant: ['INSTANT / SOCIAL-FIRST', 'Big moments. Fast content.', 'Instant coverage for events, weddings, business launches and sports leagues. Package prices start from the indicated amount; the final quote is customised.'],
      professional: ['PROFESSIONAL / HIGH-END CAMERAS', 'Every frame, considered.', 'Professional camera production for premium commercial work, events and wedding films. Camera, crew, post-production and pricing are quoted to your brief.']
    };
    function draw() {
      const cats = Object.keys(packages[mode] || {});
      if (!cat || !cats.includes(cat)) cat = cats[0];
      SS.$$('[data-mode]', modes).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
      root.querySelector('[data-mlabel]').textContent = copy[mode][0];
      root.querySelector('[data-mhead]').textContent = copy[mode][1];
      root.querySelector('[data-mintro]').textContent = copy[mode][2];
      tabs.innerHTML = cats.map((c) => `<button class="chip" role="tab" type="button" aria-selected="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
      grid.innerHTML = (packages[mode][cat] || []).map((p) => `
        <article class="card pkg${p.popular ? ' featured' : ''}">
          ${p.popular ? '<span class="badge">POPULAR OPTION</span>' : ''}
          <span class="eyebrow">${esc(p.tag)}</span>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.desc)}</p>
          <div class="price">${String(p.price).startsWith('₹') ? '<small>From</small>' : ''}<strong>${esc(p.price)}</strong><span>${esc(p.suffix)}</span></div>
          <span class="eyebrow">Typical scope · customisable</span>
          <ul>${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
          <a class="btn ${p.popular ? 'btn-primary' : 'btn-ghost'}" href="enquiry.html?package=${encodeURIComponent(p.title)}&mode=${mode}${/sport/i.test(cat) ? '&shoot=sports' : /wedding/i.test(cat) ? '&shoot=weddings' : /business|brand/i.test(cat) ? '&shoot=brand' : ''}">Request quote ↗</a>
        </article>`).join('');
    }
    modes.addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) { mode = b.dataset.mode; cat = null; draw(); } });
    tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (b) { cat = b.dataset.cat; draw(); } });
    draw();
  }

  /* ---------- pages ---------- */
  const pages = {
    home() {
      $('home-industries').innerHTML = marqueeHTML(D.industries.map((i) => i.name));
      $('home-labs-chips').innerHTML = D.services.slice(0, 6).map((s) => `<a class="chip" href="service.html?s=${s.slug}">${esc(s.name)}</a>`).join('');
      $('home-films-chips').innerHTML = D.occasions.slice(0, 6).map((o) => `<a class="chip" href="shoot.html?t=${o.slug}">${esc(o.name)}</a>`).join('');
      SS.content().then((c) => {
        const list = SS.renderReelRail($('home-rail'), c.reels);
        SS.renderHeroReel($('home-hero-reel'), c.reels);
        $('home-watch').addEventListener('click', () => SS.openStory(SS.visibleReels(c.reels), 0));
        $('home-watch').hidden = !list.length;
      });
    },
    labs() {
      servicesGrid($('labs-services'));
      labWorkList($('labs-work'), $('labs-work-filters'));
      $('labs-process').innerHTML = D.process.map(([k, t, b]) => `<div class="card reveal stack" style="gap:10px"><span class="num">${k.slice(0, 2)}</span><span class="eyebrow">${esc(k.slice(5))}</span><h3>${esc(t)}</h3><p>${esc(b)}</p></div>`).join('');
      $('labs-challenges').innerHTML = D.challenges.map((c) => `<div class="card reveal stack"><h3>${esc(c.title)}</h3><p class="lead" style="font-size:19px">${esc(c.lead)}</p><p>${esc(c.body)}</p><a class="btn btn-ghost" href="proposal.html?service=${encodeURIComponent(c.service)}">${esc(c.cta)}</a></div>`).join('');
    },
    films() {
      occasionsGrid($('films-occasions'));
      SS.content().then((c) => {
        packagesBlock($('films-packages'), c.packages);
        SS.renderReelWall($('films-reels'), c.reels);
      });
    },
    start() {
      // Carry anything passed in (e.g. Reach Game picks) on to the chosen form.
      const q = location.search.slice(1);
      if (q) SS.$$('[data-keepq]').forEach((a) => (a.href += (a.href.includes('?') ? '&' : '?') + q));
    },
    contact() {
      const C = window.SS_CONFIG || {};
      const items = [];
      if (C.WHATSAPP) items.push(`<a class="btn btn-ghost" href="${SS.whatsapp()}" target="_blank" rel="noopener">WhatsApp us</a>`);
      if (C.EMAIL) items.push(`<a class="btn btn-ghost" href="mailto:${esc(C.EMAIL)}">${esc(C.EMAIL)}</a>`);
      items.push(`<a class="btn btn-ghost" href="${esc(C.INSTAGRAM_FILMS)}" target="_blank" rel="noopener">@shootingstars_films</a>`);
      items.push(`<a class="btn btn-ghost" href="${esc(C.INSTAGRAM_LABS)}" target="_blank" rel="noopener">@shootingstars_marketinglabs</a>`);
      $('contact-direct').innerHTML = items.join('');
    },
    work() {
      const f = SS.param('f');
      projectsList($('work-projects'), $('work-filters'), ['labs', 'films', 'both'].includes(f) ? f : 'all');
      SS.content().then((c) => SS.renderReelWall($('work-reels'), c.reels, { pageSize: 9 }));
    },
    service() {
      const s = D.services.find((x) => x.slug === SS.param('s')) || D.services[0];
      setTitle(s.name);
      $('svc-crumb').textContent = s.name;
      $('svc-title').textContent = s.name;
      $('svc-intro').textContent = s.intro;
      $('svc-problem').textContent = s.problem;
      $('svc-output').textContent = s.output;
      SS.$$('[data-svc-link]').forEach((a) => (a.href = 'proposal.html?service=' + encodeURIComponent(s.name)));
      $('svc-related').href = 'labs.html#work';
      servicesGrid($('svc-more'), 9);
      SS.$$('#svc-more a').forEach((a) => { if (a.href.endsWith('s=' + s.slug)) a.remove(); });
    },
    industries() { industriesGrid($('ind-grid')); },
    industry() {
      const i = D.industries.find((x) => x.slug === SS.param('i')) || D.industries[6];
      setTitle(i.name);
      $('ind-crumb').textContent = i.name;
      $('ind-title').textContent = i.name;
      $('ind-intro').textContent = i.intro;
      SS.$$('[data-ind-link]').forEach((a) => (a.href = 'proposal.html?industry=' + encodeURIComponent(i.name)));
      const st = $('ind-stages');
      if (i.slug === 'startups-and-emerging-businesses') {
        st.innerHTML = `<h2 class="h2">What stage is your business at?</h2><div class="filters mt-m" role="group" aria-label="Business stage">${D.startupStages.map(([n], k) => `<button class="chip" type="button" data-k="${k}" aria-pressed="${k === 0}">${esc(n)}</button>`).join('')}</div><div class="card" id="ind-stage-text">${esc(D.startupStages[0][1])}</div>`;
        st.addEventListener('click', (e) => {
          const b = e.target.closest('[data-k]'); if (!b) return;
          SS.$$('[data-k]', st).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          $('ind-stage-text').textContent = D.startupStages[+b.dataset.k][1];
        });
      } else st.remove();
      servicesGrid($('ind-services'), 6);
    },
    project() {
      const p = D.projects.find((x) => x.slug === SS.param('p'));
      if (!p) return notFound($('main'), 'project');
      setTitle(p.title);
      $('prj-crumb').textContent = p.title;
      $('prj-type').textContent = p.type.toUpperCase() + ' / EXAMPLE PROJECT';
      $('prj-title').textContent = p.title;
      $('prj-lead').textContent = p.industry + ' · ' + p.desc;
      $('prj-art').outerHTML = SS.ill(SS.illFor.project[p.slug] || 'rocket', p.title).replace('class="ill"', 'class="ill wide"');
      $('prj-lab').textContent = p.type === 'films' ? 'Not included in this illustrative Films-only project.' : 'Creative strategy, messaging, channels and campaign planning as relevant to the brief.';
      $('prj-film').textContent = p.type === 'labs' ? 'Production only if included in the agreed scope.' : 'Shoot planning, capture and editing in the agreed Instant or Professional format.';
      $('prj-tags').innerHTML = p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join(' ');
      const more = D.projects.filter((x) => x !== p).slice(0, 3);
      $('prj-more').innerHTML = more.map((x) => `<a class="card card-link" href="project.html?p=${x.slug}"><span class="eyebrow">${esc(x.industry)}</span><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></a>`).join('');
    },
    shoot() {
      const o = D.occasions.find((x) => x.slug === SS.param('t')) || D.occasions.find((x) => x.slug === 'sports-leagues');
      setTitle(o.name);
      $('sh-crumb').textContent = o.name;
      $('sh-title').textContent = o.name;
      $('sh-intro').textContent = D.shootIntro[o.slug] || D.shootIntro._default;
      SS.$$('[data-sh-link]').forEach((a) => (a.href = 'enquiry.html?shoot=' + o.slug));
      const weddings = o.slug === 'weddings-and-functions';
      SS.content().then((c) => {
        const list = SS.visibleReels(c.reels).filter((r) => r.category === o.reelCategory || (o.reelCategory === 'brand' && r.category === 'automotive'));
        if (list.length) SS.renderReelWall($('sh-reels'), list, { filters: false });
        else $('sh-reels-section').hidden = true;
        // The wedding constellation lives on the wedding shoots page only.
        if (weddings) { $('sh-constellation-section').hidden = false; SS.renderConstellation($('sh-constellation'), c.reels); }
      });
    },
    careers() {
      SS.content().then((c) => {
        const live = (c.jobs || []).filter((j) => j.active === true || String(j.active).toUpperCase() === 'TRUE');
        const list = live.length ? live : D.jobs;
        $('jobs-note').textContent = live.length ? '' : 'Example roles — current openings are published here once approved by the hiring team.';
        $('jobs').innerHTML = list.map((j) => `<article class="card stack reveal" style="gap:12px"><span class="eyebrow">${live.length ? esc([j.location, j.type].filter(Boolean).join(' · ') || 'Open role') : 'Example role / not a live vacancy'}</span><h3>${esc(j.title)}</h3><p>${esc(j.description || '')}</p><a class="arrow link" href="apply.html?role=${encodeURIComponent(j.title)}" style="align-self:flex-start">Apply ↗</a></article>`).join('');
        SS.reveal($('jobs'));
      });
    },
    faq() {
      $('faq-list').innerHTML = D.faqs.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
    }
  };

  if (pages[page]) pages[page]();
  SS.reveal();
})();
