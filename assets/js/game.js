/* The Reach Game: "Launch your star".
 * A playful, illustrative model of how far a moment travels when Shooting Stars
 * films it and Marketing Labs distributes it. The multipliers below are example
 * values, not client results. Replace them with verified benchmarks when you have them.
 */
(function () {
  const SS = window.SS;
  const root = document.getElementById('reach-game');
  if (!root) return;

  const MOMENTS = [
    { id: 'store', label: 'Store launch', base: 800, shoot: 'store' },
    { id: 'wedding', label: 'Wedding', base: 1200, shoot: 'weddings' },
    { id: 'sports', label: 'Sports league', base: 1500, shoot: 'sports' },
    { id: 'clinic', label: 'Clinic', base: 500, shoot: 'corporate' },
    { id: 'startup', label: 'Startup launch', base: 600, shoot: 'brand' }
  ];
  const BOOSTS = [
    { id: 'crew', group: 'films', label: 'Shot by our Films crew', sub: 'Sharper hooks, better frames', reach: 1.6, service: '' },
    { id: 'sameday', group: 'films', label: 'Same-day reel', sub: 'Post while the moment is hot', reach: 1.4, service: '' },
    { id: 'formats', group: 'films', label: 'Cut for every format', sub: 'Reel, story, square, long-form', reach: 1.3, service: '' },
    { id: 'calendar', group: 'labs', label: 'Social content calendar', sub: 'Consistent, not random', reach: 1.5, service: 'Social Media' },
    { id: 'ads', group: 'labs', label: 'Performance campaign', sub: 'Spend behind what works', reach: 2.5, service: 'Performance Marketing' },
    { id: 'leads', group: 'labs', label: 'Lead follow-up and calling', sub: 'Don’t miss the lead', reach: 1, conv: 2, service: 'Lead Generation & Calling' }
  ];
  const MAX = BOOSTS.reduce((m, b) => m * b.reach, 1);
  const LEVELS = [[1.5, 'Spark'], [3, 'Rising star'], [6, 'Shooting star'], [Infinity, 'Supernova']];
  const fmt = (n) => Math.round(n).toLocaleString('en-IN');

  const state = { moment: 'store', on: new Set() };

  root.innerHTML = `
    <div class="game">
      <div class="game-controls">
        <div><div class="label">1 · Your big moment</div><div class="row" data-moments role="group" aria-label="Your big moment"></div></div>
        <div><div class="label">2 · Add Shooting Stars Films</div><div class="boosts" data-group="films"></div></div>
        <div><div class="label">3 · Add Marketing Labs</div><div class="boosts" data-group="labs"></div></div>
        <div class="row">
          <button class="btn btn-primary" type="button" data-launch>${SS.star} Launch my star</button>
          <button class="btn btn-ghost" type="button" data-share>Share my result</button>
        </div>
      </div>
      <div class="sky" aria-live="polite">
        <div class="band" style="top:24%"><span>Supernova</span></div>
        <div class="band" style="top:46%"><span>Shooting star</span></div>
        <div class="band" style="top:68%"><span>Rising star</span></div>
        <div class="band" style="top:88%"><span>Spark</span></div>
        <div class="trail" aria-hidden="true"></div>
        <div class="you" role="img" aria-label="Your star"></div>
        <div class="score">
          <div class="eyebrow">Your star reached</div>
          <div class="level chrome" data-level>Spark</div>
          <div class="nums"><div><b data-reach>800</b><small>People reached</small></div><div><b data-leads>3</b><small>Enquiries</small></div></div>
          <div class="stack" style="gap:6px">
            <div class="bar-row"><span>On your own</span><span data-own>800</span></div>
            <div class="bar"><i data-own-bar style="background:#5a6272"></i></div>
            <div class="bar-row" style="color:#fff"><span>With Shooting Stars</span><span data-times>Add a boost</span></div>
            <div class="bar"><i data-with-bar style="background:#dde1e7"></i></div>
          </div>
          <a class="btn btn-ghost btn-sm" data-real href="start.html">Make it real · Start a project ↗</a>
        </div>
      </div>
    </div>
    <p class="note mt-s">Illustrative simulation with example multipliers. Not a guarantee or a client result.</p>`;

  const momentsEl = root.querySelector('[data-moments]');
  momentsEl.innerHTML = MOMENTS.map((m) => `<button class="chip" type="button" data-m="${m.id}" aria-pressed="${m.id === state.moment}">${m.label}</button>`).join('');
  ['films', 'labs'].forEach((g) => {
    root.querySelector(`[data-group="${g}"]`).innerHTML = BOOSTS.filter((b) => b.group === g).map((b) =>
      `<button class="boost" type="button" data-b="${b.id}" aria-pressed="false"><span><strong>${b.label}</strong><small>${b.sub}</small></span><em>${b.conv ? 'x' + b.conv + ' enquiries' : 'x' + b.reach + ' reach'}</em></button>`).join('');
  });

  const you = root.querySelector('.you'), trail = root.querySelector('.trail');

  function compute() {
    const m = MOMENTS.find((x) => x.id === state.moment);
    let mult = 1, conv = 1;
    BOOSTS.forEach((b) => { if (state.on.has(b.id)) { mult *= b.reach; conv *= b.conv || 1; } });
    const reach = m.base * mult;
    const leads = Math.max(1, reach * 0.004 * conv);
    const level = LEVELS.find(([lim]) => mult < lim)[1];
    return { m, mult, reach, leads, level };
  }

  function render(animate) {
    const r = compute();
    const frac = Math.log(r.mult) / Math.log(MAX);
    const top = 88 - frac * 70;
    you.style.top = top + '%';
    trail.style.top = top + '%';
    root.querySelector('[data-level]').textContent = r.level;
    root.querySelector('[data-reach]').textContent = fmt(r.reach);
    root.querySelector('[data-leads]').textContent = fmt(r.leads);
    root.querySelector('[data-own]').textContent = fmt(r.m.base);
    root.querySelector('[data-times]').textContent = r.mult > 1 ? r.mult.toFixed(1) + 'x further' : 'Add a boost';
    root.querySelector('[data-own-bar]').style.width = (100 / MAX) + '%';
    root.querySelector('[data-with-bar]').style.width = Math.max(100 / MAX, (r.mult / MAX) * 100) + '%';
    // Carry the visitor's picks into the enquiry, so they never start from a blank form.
    const films = BOOSTS.some((b) => b.group === 'films' && state.on.has(b.id));
    const labs = BOOSTS.filter((b) => b.group === 'labs' && state.on.has(b.id)).map((b) => b.service);
    const q = new URLSearchParams({ from: 'reach-game', moment: r.m.label, level: r.level });
    let href = 'start.html?' + q;
    if (labs.length && !films) { labs.forEach((s) => q.append('service', s)); href = 'proposal.html?' + q; }
    else if (films && !labs.length) { q.set('shoot', r.m.shoot); href = 'enquiry.html?' + q; }
    root.querySelector('[data-real]').href = href;
    if (animate) SS.burstFrom(you);
  }

  momentsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    state.moment = b.dataset.m;
    SS.$$('[data-m]', momentsEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render(false);
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-b]'); if (!b) return;
    const id = b.dataset.b;
    if (state.on.has(id)) state.on.delete(id); else state.on.add(id);
    b.setAttribute('aria-pressed', String(state.on.has(id)));
    render(false);
  });
  root.querySelector('[data-launch]').addEventListener('click', () => {
    you.style.transition = 'none'; trail.style.transition = 'none';
    you.style.top = '96%'; trail.style.top = '96%';
    void you.offsetHeight;
    you.style.transition = ''; trail.style.transition = '';
    requestAnimationFrame(() => render(true));
  });

  /* ---------- share: a 1080×1920 story card ---------- */
  root.querySelector('[data-share]').addEventListener('click', async () => {
    const r = compute();
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1920;
    const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 1080, 1920);
    for (let i = 0; i < 260; i++) { x.globalAlpha = Math.random() * 0.8 + 0.1; x.fillStyle = '#e9ecf1'; x.beginPath(); x.arc(Math.random() * 1080, Math.random() * 1920, Math.random() * 2 + 0.4, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    const g = x.createLinearGradient(980, 260, 520, 520); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(221,225,231,0)');
    x.strokeStyle = g; x.lineWidth = 5; x.beginPath(); x.moveTo(980, 260); x.lineTo(520, 520); x.stroke();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(980, 260, 9, 0, 7); x.fill();
    await document.fonts.ready;
    x.textAlign = 'center';
    x.fillStyle = '#a8acb5'; x.font = '600 34px "Bodoni Moda", serif'; x.fillText('MY ' + r.m.label.toUpperCase() + ' REACHED', 540, 760);
    x.fillStyle = '#fff'; x.font = 'italic 900 150px "Bodoni Moda", serif'; x.fillText(r.level, 540, 930);
    x.font = 'italic 700 96px "Bodoni Moda", serif'; x.fillText(fmt(r.reach), 540, 1110);
    x.fillStyle = '#a8acb5'; x.font = '600 32px "Bodoni Moda", serif'; x.fillText('PEOPLE REACHED · ' + (r.mult > 1 ? r.mult.toFixed(1) + 'X FURTHER' : 'ON MY OWN'), 540, 1170);
    const logo = new Image();
    logo.src = 'assets/brand/logo-stacked-white.svg';
    try { await logo.decode(); const w = 520, h = w * (logo.naturalHeight / logo.naturalWidth || 0.3); x.drawImage(logo, 540 - w / 2, 1480, w, h); } catch (e) { /* skip logo */ }
    x.fillStyle = '#7d818b'; x.font = '600 26px "Bodoni Moda", serif'; x.fillText('Play “Launch your star” on our website · illustrative', 540, 1800);
    c.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'my-shooting-star.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'My Shooting Star', text: 'My ' + r.m.label + ' reached ' + r.level + '.' }); return; } catch (e) { /* cancelled: fall through to download */ }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'my-shooting-star.png';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  });

  render(false);
})();
