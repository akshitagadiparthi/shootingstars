/* Forms: Labs proposal, Films shoot enquiry, job application and freelance network.
 * Every form posts to the Google Apps Script in config.js, which writes a row to the
 * Google Sheet, works out the Films priority and callback deadline, and emails the team.
 */
(function () {
  const SS = window.SS;
  const C = window.SS_CONFIG || {};
  const esc = SS.esc;
  const opened = Date.now();

  const SHOOT_FROM_CATEGORY = {
    weddings: 'Wedding / Function', sports: 'Sports League — Other', store: 'Store / Product Launch', brand: 'Brand & Product Shoot',
    automotive: 'Brand & Product Shoot', movies: 'Other / Not Sure', photography: 'Other / Not Sure', celebrations: 'Birthday / House Party',
    realestate: 'Real Estate', corporate: 'Corporate / Concert', 'store-launch': 'Store / Product Launch', 'brand-and-product': 'Brand & Product Shoot',
    'weddings-and-functions': 'Wedding / Function', 'sports-leagues': 'Sports League — Other', 'real-estate': 'Real Estate',
    'corporate-events': 'Corporate / Concert', 'movie-promotions': 'Other / Not Sure', 'birthday-and-parties': 'Birthday / House Party'
  };
  const LABELS = { labs: 'Marketing Labs proposal', films: 'Films shoot enquiry', job: 'Job application', freelance: 'Freelance network registration' };

  function collect(form) {
    const out = {};
    new FormData(form).forEach((v, k) => {
      if (k === 'company_website') return;
      v = typeof v === 'string' ? v.trim() : v;
      if (out[k] === undefined) out[k] = v;
      else out[k] = [].concat(out[k], v);
    });
    SS.$$('input[type="checkbox"][data-group]', form).forEach((c) => { if (out[c.name] === undefined) out[c.name] = []; });
    return out;
  }

  function summaryText(type, data) {
    const lines = Object.entries(data).filter(([, v]) => v && (!Array.isArray(v) || v.length)).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(', ') : v}`);
    return `${LABELS[type]}\n\n${lines.join('\n')}`;
  }

  function showError(form, msg, data, type) {
    let st = form.querySelector('.status');
    if (!st) { st = document.createElement('div'); st.className = 'status err'; st.setAttribute('role', 'alert'); form.append(st); }
    st.className = 'status err';
    const text = summaryText(type, data);
    const wa = SS.whatsapp(text);
    const mail = C.EMAIL ? `mailto:${C.EMAIL}?subject=${encodeURIComponent(LABELS[type])}&body=${encodeURIComponent(text)}` : '';
    st.innerHTML = `${esc(msg)}${wa || mail ? '<div class="row mt-s">' + (wa ? `<a class="btn btn-primary btn-sm" href="${wa}" target="_blank" rel="noopener">Send on WhatsApp</a>` : '') + (mail ? `<a class="btn btn-ghost btn-sm" href="${mail}">Send by email</a>` : '') + '</div>' : ''}`;
  }

  function success(form, res, type, btn) {
    SS.burstFrom(btn || form);
    const wrap = document.createElement('div');
    wrap.className = 'card success';
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('tabindex', '-1');
    const next = type === 'films'
      ? 'Our Films team will review the date, location, crew and pricing, then send you a quote. Nothing is booked until you approve it.'
      : type === 'labs'
        ? 'Our team will review the business problem, arrange a discussion and define the scope before sending a tailored proposal.'
        : type === 'job'
          ? 'Thank you. The hiring team reviews every application and will contact you if there is a fit.'
          : 'Thank you for registering. Project offers are shared as opportunities arise; registration does not guarantee assignments.';
    wrap.innerHTML = `<span class="eyebrow">${SS.star} Received</span><div class="ref chrome">${esc(res.ref || 'Thank you')}</div>
      <p class="lead">${esc(next)}</p>
      ${res.respondBy ? `<p class="muted">We aim to contact you ${esc(res.respondBy)}.</p>` : ''}
      <div class="row"><a class="btn btn-ghost" href="work.html">See our work</a><a class="btn btn-ghost" href="index.html">Back to home</a></div>`;
    form.replaceWith(wrap);
    wrap.focus();
    window.scrollTo({ top: wrap.getBoundingClientRect().top + window.scrollY - 110, behavior: SS.reduce ? 'auto' : 'smooth' });
  }

  async function submit(form, type, btn) {
    const data = collect(form);
    const hp = form.querySelector('[name="company_website"]');
    if (hp && hp.value) return success(form, { ref: 'Thank you' }, type, btn); // bots: pretend it worked
    if (!C.API_URL) return showError(form, 'Online enquiries are not connected yet. You can send the same details directly:', data, type);
    btn.disabled = true;
    const label = btn.innerHTML;
    btn.innerHTML = 'Sending…';
    try {
      const res = await fetch(C.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // a "simple" request: no CORS preflight
        body: JSON.stringify({ action: 'submit', type, data, meta: Object.assign({ page: location.pathname, from: SS.param('from') || '', seconds: Math.round((Date.now() - opened) / 1000) }, SS.source()) })
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'Something went wrong');
      success(form, j, type, btn);
    } catch (err) {
      btn.disabled = false; btn.innerHTML = label;
      showError(form, (err && err.message && err.message.length < 140 ? err.message + '. ' : '') + 'Your details were not sent. Please try again, or send them directly:', data, type);
    }
  }

  function bind(form, type, before) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (before && before() === false) return;
      submit(form, type, form.querySelector('[type="submit"]'));
    });
  }

  function honeypot(form) {
    const d = document.createElement('div');
    d.className = 'hp'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<label>Leave this empty<input type="text" name="company_website" tabindex="-1" autocomplete="off"></label>';
    form.append(d);
  }

  function setSelect(sel, val) {
    if (!sel || !val) return;
    if (![...sel.options].some((o) => o.value === val)) sel.add(new Option(val, val));
    sel.value = val;
  }

  /* ---------- Marketing Labs proposal ---------- */
  const labs = document.getElementById('form-labs');
  if (labs) {
    honeypot(labs);
    const q = new URLSearchParams(location.search);
    q.getAll('service').forEach((s) => SS.$$('input[name="services"]', labs).forEach((c) => { if (c.value === s) c.checked = true; }));
    setSelect(labs.querySelector('[name="industry"]'), q.get('industry'));
    bind(labs, 'labs');
  }

  /* ---------- Films shoot enquiry (two steps) ---------- */
  const films = document.getElementById('form-films');
  if (films) {
    honeypot(films);
    const q = new URLSearchParams(location.search);
    const date = films.querySelector('[name="shoot_date"]');
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    date.min = today();
    setSelect(films.querySelector('[name="shoot_type"]'), SHOOT_FROM_CATEGORY[q.get('shoot')] || q.get('type'));
    setSelect(films.querySelector('[name="package"]'), q.get('package'));
    const mode = q.get('mode');
    if (mode) SS.$$('input[name="production"]', films).forEach((r) => { if (r.value.toLowerCase().startsWith(mode.toLowerCase())) r.checked = true; });

    let settings = window.SS_DATA.settings;
    SS.content().then((c) => { settings = c.settings || settings; updatePriority(); });
    const box = films.querySelector('.priority');
    function days(ymd) {
      if (!ymd) return null;
      const [y, m, d] = ymd.split('-').map(Number);
      const n = new Date();
      return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())) / 86400000);
    }
    function priority() {
      const d = days(date.value);
      if (d === null) return null;
      if (d < 0) return { kind: 'invalid', label: 'Please choose today or a future date', d };
      if (d <= settings.superUrgentMaxDays) return { kind: 'super', label: 'Super Urgent', d };
      if (d <= settings.priorityMaxDays) return { kind: 'urgent', label: 'Priority', d };
      return { kind: 'regular', label: 'Regular', d };
    }
    function updatePriority() {
      const p = priority();
      box.className = 'priority' + (p ? ' ' + p.kind : '');
      box.innerHTML = !p ? 'Choose a date to see how quickly we will prioritise your request.'
        : p.kind === 'invalid' ? 'Past dates are not accepted.'
          : `<b>${p.label}</b> · ${p.d === 0 ? 'today' : p.d + ' day' + (p.d === 1 ? '' : 's') + ' away'}. Priority is set by your shoot date; it does not confirm crew availability.`;
    }
    date.addEventListener('input', updatePriority);
    updatePriority();

    const s1 = films.querySelector('[data-step="1"]'), s2 = films.querySelector('[data-step="2"]');
    const bar = films.querySelector('.progress i'), count = films.querySelector('[data-count]'), title = films.querySelector('[data-steptitle]');
    function stage(n) {
      s1.hidden = n !== 1; s2.hidden = n !== 2;
      bar.style.width = n === 1 ? '50%' : '100%';
      count.textContent = n + ' of 2';
      title.textContent = n === 1 ? 'Step 1 · Plan your shoot' : 'Step 2 · Your contact details';
      (n === 1 ? s1 : s2).querySelector('input, select, textarea').focus({ preventScroll: true });
      films.scrollIntoView({ behavior: SS.reduce ? 'auto' : 'smooth', block: 'start' });
    }
    films.querySelector('[data-next]').addEventListener('click', () => {
      for (const el of SS.$$('input, select, textarea', s1)) { if (!el.reportValidity()) return; }
      const p = priority();
      if (p && p.kind === 'invalid') { date.setCustomValidity('Please choose today or a future date.'); date.reportValidity(); date.setCustomValidity(''); return; }
      const v = (n) => esc((films.querySelector(`[name="${n}"]:checked`) || films.querySelector(`[name="${n}"]`) || {}).value || '—');
      films.querySelector('[data-summary]').innerHTML = `<div><small>Production</small>${v('production')}</div><div><small>Shoot</small>${v('shoot_type')}</div><div><small>Package preference</small>${v('package')}</div><div><small>Preferred date</small>${v('shoot_date')}${p ? ' · ' + esc(p.label) : ''}</div><div><small>Location</small>${v('location')}</div>`;
      stage(2);
    });
    films.querySelector('[data-back]').addEventListener('click', () => stage(1));
    bind(films, 'films');
  }

  /* ---------- job application ---------- */
  const job = document.getElementById('form-job');
  if (job) {
    honeypot(job);
    const sel = job.querySelector('[name="role"]');
    SS.content().then((c) => {
      const live = (c.jobs || []).filter((j) => j.active === true || String(j.active).toUpperCase() === 'TRUE');
      live.forEach((j) => setSelect(sel, j.title));
      setSelect(sel, SS.param('role'));
    });
    bind(job, 'job');
  }

  /* ---------- freelance network ---------- */
  const fl = document.getElementById('form-freelance');
  if (fl) {
    honeypot(fl);
    const rows = fl.querySelector('[data-links]');
    fl.querySelector('[data-addlink]').addEventListener('click', () => {
      const r = document.createElement('div');
      r.className = 'row';
      r.innerHTML = '<input class="input" type="url" name="portfolio" placeholder="https://… additional portfolio link" style="flex:1"><button class="btn btn-ghost btn-sm" type="button" aria-label="Remove portfolio link">Remove</button>';
      r.querySelector('button').addEventListener('click', () => r.remove());
      rows.append(r);
      r.querySelector('input').focus();
    });
    bind(fl, 'freelance', () => {
      if (!fl.querySelector('input[name="skills"]:checked')) {
        const first = fl.querySelector('input[name="skills"]');
        first.setCustomValidity('Please select at least one area of expertise.'); first.reportValidity();
        SS.$$('input[name="skills"]', fl).forEach((c) => c.addEventListener('change', () => first.setCustomValidity(''), { once: true }));
        return false;
      }
      return true;
    });
  }
})();
