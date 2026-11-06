/**
 * Shooting Stars Media — website backend (Google Apps Script + Google Sheets)
 *
 * What it does
 *  • Receives the four website forms and writes each one to the Sheet
 *    (Enquiries, Careers, Freelance), with a reference number, IST timestamp,
 *    Films priority and callback deadline.
 *  • Emails the right team (Labs, Films or Careers) and, optionally, the customer.
 *  • Serves live site content from the Sheet: Reels, Jobs and Packages.
 *    Edit a row and the website updates within a couple of minutes.
 *  • Optional: pulls your newest Instagram posts automatically (needs a token).
 *  • Powers the private admin dashboard at /admin (needs the admin key).
 *
 * Setup: see README.md › "Connect the Google Sheet". In short:
 *  1. Create a Google Sheet › Extensions › Apps Script › paste this file and appsscript.json.
 *  2. Reload the Sheet › menu "Shooting Stars" › "Set up the Sheet".
 *  3. Deploy › New deployment › Web app › Execute as: Me · Who has access: Anyone.
 *  4. Paste the /exec URL into assets/js/config.js (API_URL).
 */

var TZ = 'Asia/Kolkata';
var IST_OFFSET_MIN = 330; // India has no daylight saving

var TAB = {
  ENQ: 'Enquiries', CAREERS: 'Careers', FREELANCE: 'Freelance',
  REELS: 'Reels', JOBS: 'Jobs', PACKAGES: 'Packages', SETTINGS: 'Settings'
};

var HEADERS = {
  Enquiries: ['Ref', 'Received (IST)', 'Division', 'Status', 'Films priority', 'Respond by (IST)', 'Name', 'Phone', 'Email',
    'Business', 'Industry', 'Industry details', 'Services', 'Challenge',
    'Production', 'Shoot type', 'Package', 'Shoot date', 'Location', 'Date flexibility', 'Notes',
    'Source', 'UTM source', 'UTM medium', 'UTM campaign', 'Referrer', 'Landing page', 'Form page'],
  Careers: ['Ref', 'Received (IST)', 'Status', 'Name', 'Email', 'Role', 'City', 'CV link', 'Portfolio', 'Notes', 'Source', 'Form page'],
  Freelance: ['Ref', 'Received (IST)', 'Status', 'Name', 'Email', 'Phone', 'City', 'Work status', 'Availability', 'Work mode',
    'Experience (yrs)', 'Skills', 'Portfolio links', 'Role in projects', 'Rates', 'Equipment', 'Commitments accepted', 'Source', 'Form page'],
  Reels: ['Instagram link or code', 'Category', 'Title', 'Chapter (weddings)', 'Featured', 'Visible', 'Order', 'Poster image URL (optional)', 'Video file URL (MP4, optional)', 'Plays in Instagram player'],
  Jobs: ['Title', 'Location', 'Type', 'Description', 'Active', 'Order'],
  Packages: ['Mode', 'Category', 'Title', 'Tag', 'Price', 'Price note', 'Description', 'Features (one per line)', 'Popular', 'Visible', 'Order'],
  Settings: ['Setting', 'Value', 'What it does']
};

var REEL_CATEGORIES = ['featured', 'weddings', 'sports', 'store', 'brand', 'automotive', 'movies', 'photography', 'celebrations', 'realestate', 'corporate'];
var STATUSES = ['New', 'Contacted', 'Quoted', 'Won', 'Lost', 'Closed'];

var DEFAULT_SETTINGS = [
  ['SUPER_URGENT_MAX_DAYS', 2, 'Films shoots this many days away or fewer are “Super Urgent”.'],
  ['PRIORITY_MAX_DAYS', 5, 'Films shoots up to this many days away are “Priority”. Must be more than Super Urgent.'],
  ['CALLBACK_CUTOFF_HOUR', 16, 'Enquiries received before this hour (IST, 24-hour clock) get a same-day callback deadline.'],
  ['SAME_DAY_DEADLINE_HOUR', 20, 'Same-day callback deadline, hour of the day (IST).'],
  ['NEXT_DAY_DEADLINE_HOUR', 12, 'Callback deadline for later enquiries: this hour (IST) the next day.'],
  ['LABS_TEAM_EMAIL', '', 'Who is emailed about Marketing Labs proposals. Several addresses: separate with commas. Empty = the Sheet owner.'],
  ['FILMS_TEAM_EMAIL', '', 'Who is emailed about Films shoot enquiries.'],
  ['CAREERS_TEAM_EMAIL', '', 'Who is emailed about job applications and freelance registrations.'],
  ['SEND_CUSTOMER_CONFIRMATION', 'TRUE', 'TRUE = send the customer a short “we’ve received it” email with their reference.'],
  ['COMPANY_NAME', 'Shooting Stars Media', 'Used in emails.']
];

/* ======================= web entry points ======================= */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'content';
  try {
    if (action === 'content') return json_(getContent_());
    if (action === 'ping') return json_({ ok: true, time: new Date().toISOString() });
    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: 'Server error' });
  }
}

function doPost(e) {
  var body;
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, error: 'Invalid request' }); }
  try {
    if (body.action === 'submit') return json_(handleSubmit_(body));
    if (body.action === 'admin') return json_(handleAdmin_(body));
    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: err && err.userMessage ? err.userMessage : 'Server error' });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function userError_(msg) { var e = new Error(msg); e.userMessage = msg; return e; }

/* ======================= Sheet helpers ======================= */

function book_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  var sh = book_().getSheetByName(name);
  if (!sh) throw userError_('The “' + name + '” tab is missing. Run Shooting Stars › Set up the Sheet.');
  return sh;
}

function rows_(name) {
  var sh = sheet_(name);
  var values = sh.getDataRange().getValues();
  var head = values.shift() || [];
  return values.map(function (r, i) {
    var o = { _row: i + 2 };
    head.forEach(function (h, k) { o[h] = r[k]; });
    return o;
  }).filter(function (o) { return head.some(function (h) { return o[h] !== '' && o[h] !== null; }); });
}

function settings_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('settings_v1');
  if (hit) return JSON.parse(hit);
  var out = {};
  DEFAULT_SETTINGS.forEach(function (r) { out[r[0]] = r[1]; });
  try {
    rows_(TAB.SETTINGS).forEach(function (r) { if (r.Setting) out[String(r.Setting).trim()] = r.Value; });
  } catch (e) { /* no Settings tab yet */ }
  cache.put('settings_v1', JSON.stringify(out), 300);
  return out;
}

function bool_(v) { return v === true || String(v).trim().toUpperCase() === 'TRUE' || String(v).trim().toUpperCase() === 'YES'; }
function num_(v, d) { var n = Number(v); return isFinite(n) && String(v) !== '' ? n : d; }

/* ======================= pure helpers (unit-tested) ======================= */

/** Today's date in India as [y, m, d]. */
function istParts_(date) {
  var s = Utilities.formatDate(date || new Date(), TZ, 'yyyy-MM-dd-H-m');
  var p = s.split('-').map(Number);
  return { y: p[0], m: p[1], d: p[2], h: p[3], min: p[4] };
}

/** Whole days from today (IST) to a yyyy-mm-dd date. */
function daysUntil_(ymd, now) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ''));
  if (!m) return null;
  var t = istParts_(now);
  return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(t.y, t.m - 1, t.d)) / 86400000);
}

/** Films priority from days until the shoot. */
function priorityFor_(days, s) {
  if (days === null || days === undefined) return '';
  if (days < 0) return 'Past date';
  if (days <= num_(s.SUPER_URGENT_MAX_DAYS, 2)) return 'Super Urgent';
  if (days <= num_(s.PRIORITY_MAX_DAYS, 5)) return 'Priority';
  return 'Regular';
}

/** A Date at h:00 IST on the IST calendar day of `now` plus `addDays`. */
function istAt_(now, addDays, hour) {
  var t = istParts_(now);
  return new Date(Date.UTC(t.y, t.m - 1, t.d + addDays, hour, 0) - IST_OFFSET_MIN * 60000);
}

/** Callback deadline: same day if before the cut-off, otherwise the next day. */
function respondBy_(now, s) {
  var t = istParts_(now);
  var cutoff = num_(s.CALLBACK_CUTOFF_HOUR, 16);
  if (t.h < cutoff) {
    var h = num_(s.SAME_DAY_DEADLINE_HOUR, 20);
    return { date: istAt_(now, 0, h), text: 'today, by ' + hour12_(h) + ' IST' };
  }
  var nh = num_(s.NEXT_DAY_DEADLINE_HOUR, 12);
  return { date: istAt_(now, 1, nh), text: 'by ' + hour12_(nh) + ' IST tomorrow' };
}

function hour12_(h) { return (h % 12 || 12) + ':00 ' + (h < 12 ? 'AM' : 'PM'); }

/** Pull the post code and type out of any Instagram link (or accept a bare code). */
function parseInstagram_(v) {
  var s = String(v || '').trim();
  var m = /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i.exec(s);
  if (m) return { id: m[2], kind: m[1].toLowerCase() === 'p' ? 'p' : 'reel' };
  if (/^[A-Za-z0-9_-]{6,20}$/.test(s)) return { id: s, kind: 'reel' };
  return null;
}

/** Make a value safe to write into a cell: trimmed, length-limited, never a formula. */
function clean_(v, max) {
  if (Array.isArray(v)) v = v.map(function (x) { return String(x); }).join(', ');
  var s = String(v === undefined || v === null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (s.length > (max || 3000)) s = s.slice(0, max || 3000);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

function validEmail_(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '')); }
function validPhone_(s) { var d = String(s || '').replace(/\D/g, ''); return d.length >= 7 && d.length <= 15; }
function validUrl_(s) { return /^https?:\/\/[^\s]+\.[^\s]+/i.test(String(s || '')); }

/* ======================= form submissions ======================= */

var REQUIRED = {
  labs: ['name', 'business', 'industry', 'email', 'phone', 'challenge', 'consent'],
  films: ['production', 'shoot_type', 'package', 'shoot_date', 'location', 'name', 'phone', 'consent'],
  job: ['name', 'email', 'role', 'city', 'cv_link', 'consent'],
  freelance: ['name', 'email', 'phone', 'city', 'work_status', 'availability', 'work_mode', 'skills', 'portfolio', 'commitment_assignments', 'commitment_lawful', 'consent']
};
var PREFIX = { labs: 'LB', films: 'FI', job: 'JB', freelance: 'FN' };

function handleSubmit_(body) {
  var type = body.type;
  var d = body.data || {};
  var meta = body.meta || {};
  if (!REQUIRED[type]) throw userError_('Unknown form');

  // Quiet bot filters: a filled hidden field, or a form completed impossibly fast.
  if (d.company_website || (meta.seconds !== undefined && Number(meta.seconds) < 3)) return { ok: true, ref: 'Thank you' };

  REQUIRED[type].forEach(function (k) {
    var v = d[k];
    if (v === undefined || v === null || (Array.isArray(v) ? !v.length : String(v).trim() === '')) throw userError_('Please fill in all required fields');
  });
  if (d.email && !validEmail_(d.email)) throw userError_('Please check your email address');
  if (d.phone && !validPhone_(d.phone)) throw userError_('Please check your phone number');
  if (type === 'job' && !validUrl_(d.cv_link)) throw userError_('Please add a working CV link');
  if (type === 'films' && daysUntil_(d.shoot_date) !== null && daysUntil_(d.shoot_date) < 0) throw userError_('Please choose today or a future shoot date');

  // Gentle rate limit across the whole site.
  var cache = CacheService.getScriptCache();
  var minuteKey = 'rate_' + Math.floor(Date.now() / 60000);
  var count = Number(cache.get(minuteKey) || 0) + 1;
  cache.put(minuteKey, String(count), 120);
  if (count > 30) throw userError_('We are receiving a lot of requests right now. Please try again in a minute');

  // The same person sending the same form twice in 10 minutes gets the same reference back.
  var dupKey = 'dup_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, type + '|' + (d.phone || '') + '|' + (d.email || '').toLowerCase() + '|' + (d.shoot_date || '') + '|' + (d.role || ''))).slice(0, 40);
  var dup = cache.get(dupKey);
  if (dup) return JSON.parse(dup);

  var s = settings_();
  var now = new Date();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var result;
  try {
    var ref = nextRef_(PREFIX[type]);
    if (type === 'labs' || type === 'films') result = writeEnquiry_(type, ref, d, meta, now, s);
    else if (type === 'job') result = writeCareer_(ref, d, meta, now);
    else result = writeFreelance_(ref, d, meta, now);
  } finally {
    lock.releaseLock();
  }
  cache.put(dupKey, JSON.stringify(result), 600);

  try { notifyTeam_(type, result, d, s); } catch (e) { console.error('Team email failed', e); }
  try { if (bool_(s.SEND_CUSTOMER_CONFIRMATION) && validEmail_(d.email)) confirmCustomer_(type, result, d, s); } catch (e) { console.error('Customer email failed', e); }
  return result;
}

function nextRef_(prefix) {
  var props = PropertiesService.getScriptProperties();
  var key = 'COUNTER_' + prefix;
  var n = Number(props.getProperty(key) || 0) + 1;
  props.setProperty(key, String(n));
  return prefix + '-' + ('00000' + n).slice(-5);
}

function source_(meta) {
  if (meta.from === 'catch-game') return 'mini game';
  if (meta.from === 'wish') return 'caught-star wish';
  if (meta.utm_source) return meta.utm_source;
  if (meta.referrer) { var m = /^https?:\/\/([^/]+)/.exec(meta.referrer); return m ? m[1].replace(/^www\./, '') : 'referral'; }
  return 'direct';
}

function writeEnquiry_(type, ref, d, meta, now, s) {
  var films = type === 'films';
  var days = films ? daysUntil_(d.shoot_date, now) : null;
  var priority = films ? priorityFor_(days, s) : '';
  var rb = respondBy_(now, s);
  var src = source_(meta);
  var row = [
    ref, now, films ? 'Films' : 'Marketing Labs', 'New', priority, rb.date,
    clean_(d.name, 120), clean_(d.phone, 30), clean_(d.email, 160),
    clean_(d.business, 160), clean_(d.industry, 120), clean_(d.industry_details, 200), clean_(d.services, 600), clean_(d.challenge),
    clean_(d.production, 80), clean_(d.shoot_type, 80), clean_(d.package, 80), clean_(d.shoot_date, 10), clean_(d.location, 200), clean_(d.date_flexibility, 80), clean_(d.notes),
    clean_(src, 80), clean_(meta.utm_source, 80), clean_(meta.utm_medium, 80), clean_(meta.utm_campaign, 120), clean_(meta.referrer, 300), clean_(meta.landing, 200), clean_(meta.page, 200)
  ];
  sheet_(TAB.ENQ).appendRow(row);
  return { ok: true, ref: ref, priority: priority, respondBy: rb.text };
}

function writeCareer_(ref, d, meta, now) {
  sheet_(TAB.CAREERS).appendRow([ref, now, 'New', clean_(d.name, 120), clean_(d.email, 160), clean_(d.role, 80), clean_(d.city, 80),
    clean_(d.cv_link, 500), clean_(d.portfolio, 500), clean_(d.notes), clean_(source_(meta), 80), clean_(meta.page, 200)]);
  return { ok: true, ref: ref };
}

function writeFreelance_(ref, d, meta, now) {
  var links = [].concat(d.portfolio || []).filter(String).join('\n');
  sheet_(TAB.FREELANCE).appendRow([ref, now, 'New', clean_(d.name, 120), clean_(d.email, 160), clean_(d.phone, 30), clean_(d.city, 80),
    clean_(d.work_status, 80), clean_(d.availability, 80), clean_(d.work_mode, 80), clean_(d.experience, 5), clean_(d.skills, 400),
    clean_(links, 2000), clean_(d.role_in_projects, 300), clean_(d.rates, 200), clean_(d.equipment, 300), 'Yes', clean_(source_(meta), 80), clean_(meta.page, 200)]);
  return { ok: true, ref: ref };
}

/* ======================= email ======================= */

var LABELS = {
  name: 'Name', phone: 'Phone', email: 'Email', business: 'Business', industry: 'Industry', industry_details: 'Industry details',
  services: 'Services', challenge: 'Challenge', production: 'Production', shoot_type: 'Shoot', package: 'Package', shoot_date: 'Shoot date',
  location: 'Location', date_flexibility: 'If the date is unavailable', notes: 'Notes', role: 'Role', city: 'City', cv_link: 'CV',
  portfolio: 'Portfolio', work_status: 'Work status', availability: 'Availability', work_mode: 'Work mode', experience: 'Experience (yrs)',
  skills: 'Skills', role_in_projects: 'Role in projects', rates: 'Rates', equipment: 'Equipment'
};

function recipients_(type, s) {
  var v = type === 'labs' ? s.LABS_TEAM_EMAIL : type === 'films' ? s.FILMS_TEAM_EMAIL : s.CAREERS_TEAM_EMAIL;
  v = String(v || '').trim();
  return v || Session.getEffectiveUser().getEmail();
}

function notifyTeam_(type, res, d, s) {
  var to = recipients_(type, s);
  if (!to) return;
  var what = { labs: 'Marketing Labs proposal', films: 'Films shoot enquiry', job: 'Job application', freelance: 'Freelance registration' }[type];
  var subject = '[' + res.ref + '] ' + (res.priority ? res.priority + ' · ' : '') + what + ' — ' + String(d.name || '').slice(0, 60) +
    (type === 'films' ? ' · ' + (d.shoot_type || '') + ' · ' + (d.shoot_date || '') : type === 'labs' ? ' · ' + (d.business || '') : '');
  var lines = Object.keys(LABELS).filter(function (k) { return d[k] && String(d[k]).length; }).map(function (k) {
    return '<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top">' + esc_(LABELS[k]) + '</td><td style="padding:6px 0">' + esc_([].concat(d[k]).join(', ')).replace(/\n/g, '<br>') + '</td></tr>';
  }).join('');
  var html = '<div style="font-family:Georgia,serif;font-size:15px;color:#111">' +
    '<p style="font-size:20px;margin:0 0 6px"><b>' + esc_(what) + '</b> · ' + esc_(res.ref) + '</p>' +
    (res.priority ? '<p style="margin:0 0 6px"><b>Films priority:</b> ' + esc_(res.priority) + '</p>' : '') +
    (res.respondBy ? '<p style="margin:0 0 14px"><b>Call back:</b> ' + esc_(res.respondBy) + '</p>' : '') +
    '<table style="border-collapse:collapse">' + lines + '</table>' +
    '<p style="margin-top:18px"><a href="' + book_().getUrl() + '">Open the Sheet</a></p></div>';
  var mail = { to: to, subject: subject, htmlBody: html, name: 'Shooting Stars website' };
  if (validEmail_(d.email)) mail.replyTo = d.email;
  MailApp.sendEmail(mail);
}

function confirmCustomer_(type, res, d, s) {
  var company = s.COMPANY_NAME || 'Shooting Stars Media';
  var next = type === 'films' ? 'Our Films team will review the date, location, crew and pricing, then send you a quote. Nothing is booked until you approve it.'
    : type === 'labs' ? 'Our team will review the business problem, arrange a discussion and define the scope before sending a tailored proposal.'
      : type === 'job' ? 'The hiring team reviews every application and will contact you if there is a fit.'
        : 'Project offers are shared as opportunities arise; registration does not guarantee assignments.';
  var html = '<div style="font-family:Georgia,serif;font-size:16px;color:#111;max-width:560px">' +
    '<p>Hi ' + esc_(String(d.name || '').split(' ')[0]) + ',</p>' +
    '<p>Thank you — we have received your request. Your reference is <b>' + esc_(res.ref) + '</b>.</p>' +
    '<p>' + esc_(next) + '</p>' + (res.respondBy ? '<p>We aim to contact you ' + esc_(res.respondBy) + '.</p>' : '') +
    '<p>— ' + esc_(company) + '</p></div>';
  MailApp.sendEmail({ to: d.email, subject: 'We’ve received your request · ' + res.ref, htmlBody: html, name: company });
}

function esc_(v) { return String(v === undefined || v === null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

/* ======================= live content ======================= */

function getContent_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('content_v1');
  if (hit) return JSON.parse(hit);
  var s = settings_();
  var reels = [];
  try {
    reels = rows_(TAB.REELS).map(function (r) {
      var ig = parseInstagram_(r['Instagram link or code']);
      if (!ig && !r['Video file URL (MP4, optional)']) return null;
      ig = ig || { id: 'video-' + r._row, kind: 'reel' };
      return {
        id: ig.id, kind: ig.kind, category: String(r.Category || 'featured').trim().toLowerCase(), title: String(r.Title || ''),
        chapter: String(r['Chapter (weddings)'] || ''), featured: bool_(r.Featured), visible: r.Visible === '' ? true : bool_(r.Visible),
        order: num_(r.Order, r._row), poster: String(r['Poster image URL (optional)'] || ''),
        video: String(r['Video file URL (MP4, optional)'] || ''),
        embed: r['Plays in Instagram player'] === '' || r['Plays in Instagram player'] === undefined ? true : bool_(r['Plays in Instagram player'])
      };
    }).filter(function (r) { return r && r.visible && (r.video || r.embed); });
  } catch (e) { console.error(e); }
  var jobs = [];
  try {
    jobs = rows_(TAB.JOBS).filter(function (r) { return r.Title; }).map(function (r) {
      return { title: String(r.Title), location: String(r.Location || ''), type: String(r.Type || ''), description: String(r.Description || ''), active: bool_(r.Active), order: num_(r.Order, r._row) };
    }).sort(function (a, b) { return a.order - b.order; });
  } catch (e) { console.error(e); }
  var packages = [];
  try {
    packages = rows_(TAB.PACKAGES).filter(function (r) { return r.Title; }).map(function (r) {
      return {
        mode: String(r.Mode || 'instant').toLowerCase(), category: String(r.Category || ''), title: String(r.Title), tag: String(r.Tag || ''),
        price: String(r.Price || 'Custom quote'), suffix: String(r['Price note'] || ''), desc: String(r.Description || ''),
        features: String(r['Features (one per line)'] || '').split(/\n|;/).map(function (x) { return x.trim(); }).filter(String),
        popular: bool_(r.Popular), visible: r.Visible === '' ? true : bool_(r.Visible), order: num_(r.Order, r._row)
      };
    });
  } catch (e) { console.error(e); }
  var out = {
    ok: true,
    reels: reels, jobs: jobs, packages: packages,
    instagram: getInstagramLatest_(),
    settings: { superUrgentMaxDays: num_(s.SUPER_URGENT_MAX_DAYS, 2), priorityMaxDays: num_(s.PRIORITY_MAX_DAYS, 5) },
    updated: new Date().toISOString()
  };
  try { cache.put('content_v1', JSON.stringify(out), 120); } catch (e) { /* over 100 KB: skip cache */ }
  return out;
}

function clearContentCache_() {
  CacheService.getScriptCache().removeAll(['content_v1', 'settings_v1']);
}

/** Simple trigger: any edit to a content tab refreshes the website within seconds. */
function onEdit(e) {
  try {
    var name = e && e.range && e.range.getSheet().getName();
    if ([TAB.REELS, TAB.JOBS, TAB.PACKAGES, TAB.SETTINGS].indexOf(name) >= 0) clearContentCache_();
  } catch (err) { /* ignore */ }
}

/* ---------- optional: newest Instagram posts, automatically ----------
 * Needs an Instagram professional account and a long-lived access token from
 * Meta's "Instagram API with Instagram Login". Save it with the menu
 * Shooting Stars › Connect Instagram. Tokens are refreshed weekly by a trigger.
 */
function getInstagramLatest_() {
  var token = PropertiesService.getScriptProperties().getProperty('IG_TOKEN');
  if (!token) return [];
  var cache = CacheService.getScriptCache();
  var hit = cache.get('ig_v1');
  if (hit) return JSON.parse(hit);
  try {
    var res = UrlFetchApp.fetch('https://graph.instagram.com/me/media?fields=id,caption,media_type,permalink,timestamp&limit=12&access_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) { console.error('Instagram', res.getContentText()); return []; }
    var items = (JSON.parse(res.getContentText()).data || []).map(function (m) {
      var ig = parseInstagram_(m.permalink);
      return ig ? { id: ig.id, kind: ig.kind, caption: String(m.caption || '').slice(0, 160), type: m.media_type, timestamp: m.timestamp } : null;
    }).filter(function (x) { return x; });
    cache.put('ig_v1', JSON.stringify(items), 1800);
    return items;
  } catch (e) { console.error(e); return []; }
}

function refreshInstagramToken() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('IG_TOKEN');
  if (!token) return;
  var res = UrlFetchApp.fetch('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
  if (res.getResponseCode() === 200) {
    var j = JSON.parse(res.getContentText());
    if (j.access_token) props.setProperty('IG_TOKEN', j.access_token);
  } else console.error('Instagram token refresh failed', res.getContentText());
}

/* ======================= admin API ======================= */

var EDITABLE = [TAB.REELS, TAB.JOBS, TAB.PACKAGES];
var READABLE = [TAB.ENQ, TAB.CAREERS, TAB.FREELANCE, TAB.REELS, TAB.JOBS, TAB.PACKAGES];

function checkKey_(key) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('admin_fails') || 0);
  if (fails >= 10) throw userError_('Too many wrong keys. Try again in 15 minutes');
  var real = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY') || '';
  var given = String(key || '');
  var diff = real.length === given.length && real.length > 0 ? 0 : 1;
  for (var i = 0; i < real.length; i++) diff |= real.charCodeAt(i) ^ given.charCodeAt(i);
  if (diff !== 0) { cache.put('admin_fails', String(fails + 1), 900); throw userError_('Wrong admin key'); }
}

function serial_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm');
  return v;
}

function handleAdmin_(body) {
  checkKey_(body.key);
  var op = body.op;
  if (op === 'overview') return adminOverview_();
  if (op === 'list') {
    if (READABLE.indexOf(body.sheet) < 0) throw userError_('Unknown tab');
    var sh = sheet_(body.sheet);
    var values = sh.getDataRange().getValues();
    var head = values.shift() || [];
    var limit = Math.min(Number(body.limit) || 500, 2000);
    var data = values.map(function (r, i) { return { row: i + 2, cells: r.map(serial_) }; }).filter(function (r) { return r.cells.some(function (c) { return c !== ''; }); });
    if ([TAB.ENQ, TAB.CAREERS, TAB.FREELANCE].indexOf(body.sheet) >= 0) data.reverse();
    return { ok: true, headers: head, rows: data.slice(0, limit), total: data.length };
  }
  if (op === 'save') {
    if (EDITABLE.indexOf(body.sheet) < 0) throw userError_('That tab can only be edited in the Sheet');
    var sh2 = sheet_(body.sheet);
    var head2 = HEADERS[body.sheet];
    var vals = head2.map(function (h) { var v = (body.values || {})[h]; return typeof v === 'boolean' ? v : clean_(v, 3000); });
    if (body.sheet === TAB.REELS && !parseInstagram_(vals[0]) && !vals[8]) throw userError_('Add an Instagram link or a video file URL');
    if (body.row) {
      var r = Number(body.row);
      if (r < 2 || r > sh2.getLastRow()) throw userError_('Row not found');
      sh2.getRange(r, 1, 1, vals.length).setValues([vals]);
    } else sh2.getRange(firstEmptyRow_(sh2), 1, 1, vals.length).setValues([vals]);
    clearContentCache_();
    return { ok: true };
  }
  if (op === 'delete') {
    if (EDITABLE.indexOf(body.sheet) < 0) throw userError_('That tab can only be edited in the Sheet');
    var sh3 = sheet_(body.sheet), row = Number(body.row);
    if (row < 2 || row > sh3.getLastRow()) throw userError_('Row not found');
    sh3.deleteRow(row);
    clearContentCache_();
    return { ok: true };
  }
  if (op === 'settings') {
    return { ok: true, settings: rows_(TAB.SETTINGS).map(function (r) { return { key: r.Setting, value: serial_(r.Value), help: r['What it does'], row: r._row }; }) };
  }
  if (op === 'settings.save') {
    var sh4 = sheet_(TAB.SETTINGS);
    var allowed = DEFAULT_SETTINGS.map(function (r) { return r[0]; });
    var current = rows_(TAB.SETTINGS);
    var vals2 = body.values || {};
    if (num_(vals2.SUPER_URGENT_MAX_DAYS, 2) >= num_(vals2.PRIORITY_MAX_DAYS, 5)) throw userError_('Super Urgent must be fewer days than Priority');
    Object.keys(vals2).forEach(function (k) {
      if (allowed.indexOf(k) < 0) return;
      var hit = current.filter(function (r) { return r.Setting === k; })[0];
      var v = clean_(vals2[k], 500);
      if (hit) sh4.getRange(hit._row, 2).setValue(v);
      else sh4.appendRow([k, v, '']);
    });
    clearContentCache_();
    return { ok: true };
  }
  throw userError_('Unknown admin action');
}

function adminOverview_() {
  var now = new Date();
  var enq = rows_(TAB.ENQ);
  var open = enq.filter(function (r) { return String(r.Status || 'New') === 'New'; });
  var overdue = open.filter(function (r) { return r['Respond by (IST)'] instanceof Date && r['Respond by (IST)'] < now; });
  var superUrgent = open.filter(function (r) { return r['Films priority'] === 'Super Urgent'; });
  var today = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  var todayCount = enq.filter(function (r) { return r['Received (IST)'] instanceof Date && Utilities.formatDate(r['Received (IST)'], TZ, 'yyyy-MM-dd') === today; }).length;
  var careers = 0, freelance = 0;
  try { careers = rows_(TAB.CAREERS).length; freelance = rows_(TAB.FREELANCE).length; } catch (e) { /* ignore */ }
  var bySource = {};
  enq.forEach(function (r) { var k = String(r.Source || 'direct'); bySource[k] = (bySource[k] || 0) + 1; });
  return {
    ok: true,
    sheetUrl: book_().getUrl(),
    counts: {
      enquiries: enq.length, labs: enq.filter(function (r) { return r.Division === 'Marketing Labs'; }).length, films: enq.filter(function (r) { return r.Division === 'Films'; }).length,
      open: open.length, overdue: overdue.length, superUrgent: superUrgent.length, today: todayCount, careers: careers, freelance: freelance
    },
    bySource: bySource,
    attention: overdue.concat(superUrgent.filter(function (r) { return overdue.indexOf(r) < 0; })).slice(0, 12).map(function (r) {
      return { ref: r.Ref, division: r.Division, name: r.Name, phone: r.Phone, priority: r['Films priority'], respondBy: serial_(r['Respond by (IST)']), overdue: overdue.indexOf(r) >= 0, shoot: r['Shoot type'], date: r['Shoot date'] };
    }),
    instagramConnected: !!PropertiesService.getScriptProperties().getProperty('IG_TOKEN')
  };
}

/* ======================= setup & menu ======================= */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Shooting Stars')
    .addItem('Set up the Sheet', 'setupFromMenu')
    .addItem('Show admin key', 'showAdminKey')
    .addItem('Make a new admin key', 'rotateAdminKey')
    .addSeparator()
    .addItem('Connect Instagram (optional)', 'connectInstagram')
    .addItem('Refresh website content now', 'refreshNow')
    .addToUi();
}

function setupFromMenu() {
  var key = setup();
  SpreadsheetApp.getUi().alert('All set.\n\nYour admin key (keep it private):\n\n' + key + '\n\nNext: Deploy › New deployment › Web app (Execute as: Me, Who has access: Anyone) and paste the /exec URL into assets/js/config.js.');
}

function showAdminKey() {
  SpreadsheetApp.getUi().alert('Admin key:\n\n' + (PropertiesService.getScriptProperties().getProperty('ADMIN_KEY') || 'Not set yet. Run Set up the Sheet.'));
}

function rotateAdminKey() {
  var key = newKey_();
  PropertiesService.getScriptProperties().setProperty('ADMIN_KEY', key);
  SpreadsheetApp.getUi().alert('New admin key (the old one stops working now):\n\n' + key);
}

function connectInstagram() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Connect Instagram', 'Paste a long-lived Instagram access token (Instagram API with Instagram Login). Leave empty to disconnect.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var t = r.getResponseText().trim();
  var props = PropertiesService.getScriptProperties();
  if (t) props.setProperty('IG_TOKEN', t); else props.deleteProperty('IG_TOKEN');
  CacheService.getScriptCache().remove('ig_v1');
  clearContentCache_();
  ui.alert(t ? 'Instagram connected. Your newest posts will appear on the website within 30 minutes.' : 'Instagram disconnected.');
}

function refreshNow() {
  clearContentCache_();
  CacheService.getScriptCache().remove('ig_v1');
  SpreadsheetApp.getActiveSpreadsheet().toast('Website content refreshed.');
}

function newKey_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
}

/** Creates the tabs, headers, formatting, dropdowns and starter content. Safe to run again. */
// Checkbox columns fill every row with FALSE, so find the real end of the data from column A.
function firstEmptyRow_(sh) {
  var a = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues();
  for (var i = a.length - 1; i >= 0; i--) if (a[i][0] !== '' && a[i][0] !== null) return i + 2;
  return 2;
}
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TZ);
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SHEET_ID', ss.getId());
  if (!props.getProperty('ADMIN_KEY')) props.setProperty('ADMIN_KEY', newKey_());

  Object.keys(HEADERS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var head = HEADERS[name];
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#111111').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });
  var first = ss.getSheets()[0];
  if (first && /^(Sheet1|Sheet 1)$/.test(first.getName()) && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);

  // Enquiries: formats, status dropdown, colour for priority and overdue callbacks.
  var enq = ss.getSheetByName(TAB.ENQ);
  enq.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm');
  enq.getRange('F:F').setNumberFormat('ddd d mmm, h:mm am/pm');
  enq.getRange('R:R').setNumberFormat('@');
  ['D'].forEach(function (col) {
    enq.getRange(col + '2:' + col).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(true).build());
  });
  var rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Super Urgent').setBackground('#f4cccc').setRanges([enq.getRange('E2:E')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Priority').setBackground('#fff2cc').setRanges([enq.getRange('E2:E')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($D2="New",$F2<>"",$F2<NOW())').setFontColor('#cc0000').setBold(true).setRanges([enq.getRange('A2:F')]).build()
  ];
  enq.setConditionalFormatRules(rules);
  [ss.getSheetByName(TAB.CAREERS), ss.getSheetByName(TAB.FREELANCE)].forEach(function (sh) {
    sh.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm');
    sh.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(true).build());
  });

  // Content tabs: dropdowns and checkboxes.
  var reels = ss.getSheetByName(TAB.REELS);
  reels.getRange('B2:B').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(REEL_CATEGORIES, true).setAllowInvalid(true).build());
  reels.getRange('E2:F').insertCheckboxes();
  reels.getRange('J2:J').insertCheckboxes();
  reels.getRange('J1').setNote('Untick if the reel shows “Watch on Instagram” instead of playing (Instagram blocks some reels, usually because of licensed music). Those reels only appear on the site once a video file is added in column I.');
  var jobs = ss.getSheetByName(TAB.JOBS);
  jobs.getRange('E2:E').insertCheckboxes();
  var pk = ss.getSheetByName(TAB.PACKAGES);
  pk.getRange('A2:A').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['instant', 'professional'], true).build());
  pk.getRange('I2:J').insertCheckboxes();
  pk.getRange('H2:H').setWrap(true);

  if (firstEmptyRow_(reels) === 2) seedReels_(reels);
  if (firstEmptyRow_(jobs) === 2) seedJobs_(jobs);
  if (firstEmptyRow_(pk) === 2) seedPackages_(pk);
  var st = ss.getSheetByName(TAB.SETTINGS);
  if (st.getLastRow() < 2) st.getRange(2, 1, DEFAULT_SETTINGS.length, 3).setValues(DEFAULT_SETTINGS);
  st.setColumnWidth(3, 520);

  installTriggers_();
  clearContentCache_();
  var key = props.getProperty('ADMIN_KEY');
  console.log('Admin key: ' + key);
  return key;
}

function installTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'refreshInstagramToken') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('refreshInstagramToken').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(4).create();
}

// Reels Instagram would not play outside its app when checked on 6 Nov 2026.
var BLOCKED = ['DeefV69P6ei', 'Dc7pyMAJFdG', 'Dc6WiDMpMnn', 'DdBMfjGpCKf', 'DetXGpUvQKu', 'DUaqGPkk5_a'];

function seedReels_(sh) {
  var R = [
    ['https://www.instagram.com/reel/DeefV69P6ei/', 'featured', 'Featured reel', '', true],
    ['https://www.instagram.com/reel/Dc6VVI4JGmp/', 'weddings', 'Engagement', 'Engagement', true],
    ['https://www.instagram.com/reel/Dc7pyMAJFdG/', 'weddings', 'Bride to be', 'Bride to be', false],
    ['https://www.instagram.com/reel/Dc6WiDMpMnn/', 'weddings', 'Pasupu', 'Pasupu', false],
    ['https://www.instagram.com/reel/DdEelL3pEOE/', 'weddings', 'Haldi', 'Haldi', true],
    ['https://www.instagram.com/reel/DVU5kgLid40/', 'weddings', 'Haldi', 'Haldi', false],
    ['https://www.instagram.com/reel/DdG7Y3rJE0S/', 'weddings', 'Mehendi', 'Mehendi', true],
    ['https://www.instagram.com/reel/DdBMfjGpCKf/', 'weddings', 'Sangeeth', 'Sangeeth', true],
    ['https://www.instagram.com/reel/Dc-h4-kJ2fp/', 'weddings', 'Sangeeth', 'Sangeeth', false],
    ['https://www.instagram.com/reel/DdLTdmYJFEd/', 'weddings', 'Pellikoduku', 'Pellikoduku', true],
    ['https://www.instagram.com/reel/DaUmKTFylJp/', 'sports', 'Sporting event', '', true],
    ['https://www.instagram.com/reel/DetXGpUvQKu/', 'sports', 'Sporting event', '', false],
    ['https://www.instagram.com/reel/DSCLLhLkyjB/', 'sports', 'Sporting event', '', false],
    ['https://www.instagram.com/reel/DUznJNIjxK5/', 'store', 'Store launch', '', true],
    ['https://www.instagram.com/reel/DUupmqJE8yE/', 'store', 'Store launch', '', false],
    ['https://www.instagram.com/reel/DWWQ69ykytz/', 'brand', 'Model shoot', '', true],
    ['https://www.instagram.com/reel/DUaqGPkk5_a/', 'automotive', 'Car shoot', '', true],
    ['https://www.instagram.com/reel/DaXpjSng9n4/', 'movies', 'Movie promotion', '', true],
    ['https://www.instagram.com/p/DerXr-dgfj-/', 'photography', 'Photography', '', true]
  ].map(function (r, i) { return [r[0], r[1], r[2], r[3], r[4], true, i + 1, '', '', BLOCKED.indexOf(parseInstagram_(r[0]).id) < 0]; });
  sh.getRange(2, 1, R.length, 10).setValues(R);
}

function seedJobs_(sh) {
  var d = 'Role requirements, location and application deadline to be supplied by the hiring team.';
  var J = ['Graphic Designer', 'Content Writer', 'Video Editor', 'Marketing Operations', 'Internship & Trainee'].map(function (t, i) { return [t, '', '', d, false, i + 1]; });
  sh.getRange(2, 1, J.length, 6).setValues(J);
}

function seedPackages_(sh) {
  var P = [
    ['instant', 'Instant Packages', 'Quick Shoot', 'SOCIAL-FIRST', '₹1,699', 'onwards + GST', 'A compact coverage option for a reel, a launch moment or a quick celebration.', 'Short-duration coverage\nSocial-first mobile workflow\nReel or edited clips as scoped\nDelivery timeline confirmed in quote', false],
    ['instant', 'Instant Packages', 'Half Day', 'FLEXIBLE COVERAGE', '₹3,999', 'onwards + GST', 'More time to capture important moments with a flexible coverage plan.', 'Half-day coverage window\nHighlights / reels as required\nMultiple formats on request\nCrew and output confirmed in quote', true],
    ['instant', 'Instant Packages', 'Event Highlights', 'EVENTS & ACTIVATIONS', 'Custom quote', '', 'Store openings, business gatherings, birthdays and community events.', 'Event coverage\nReels, interviews or highlights\nOn-site selections on request\nLocation and hours scoped', false],
    ['instant', 'Business Packages', 'Launch & Event Coverage', 'BRAND EVENTS', 'Custom quote', '', 'Social-first coverage for launches, exhibitions and business activations.', 'Brand-specific shot list\nEvent reels and highlights\nInterview clips if requested\nDeliverables agreed upfront', true],
    ['instant', 'Business Packages', 'Product Reel', 'PRODUCT CONTENT', 'Custom quote', '', 'Short-form product content for e-commerce, social and campaigns.', 'Product visual capture\nVertical / square edits\nCreative direction if needed\nPer-product scope quoted', false],
    ['instant', 'Wedding & Celebrations', 'Wedding Essential', 'ONE EVENT', 'Custom quote', '', 'Instant reels and moments from a key wedding event.', 'Coverage for an agreed event\nSocial-ready reels\nFamily moments and highlights\nTimelines finalised in quote', false],
    ['instant', 'Wedding & Celebrations', 'Wedding Silver', 'MULTI-EVENT', 'Custom quote', '', 'More moments across celebrations with a flexible reel plan.', 'Multi-function coverage\nEdited reels as scoped\nHighlights and short clips\nTravel and timing quoted', false],
    ['instant', 'Wedding & Celebrations', 'Wedding Gold', 'EXTENDED COVERAGE', 'Custom quote', '', 'Broader coverage for families who want more moments preserved.', 'Multiple events\nGreater shot coverage\nHighlights and social edits\nCrew and turnaround customised', true],
    ['instant', 'Wedding & Celebrations', 'Wedding Platinum', 'COMPLETE EXPERIENCE', 'Custom quote', '', 'A tailored full-celebration content experience.', 'Extended / multi-day coverage\nCustom reel and highlight mix\nAdditional creators on request\nFull scope on quotation', false],
    ['instant', 'Sports Leagues', 'Match Highlights', 'SINGLE MATCH', 'Custom quote', '', 'Quick-turn social content for pickleball, cricket and other matches.', 'Match and player action\nKey moments and highlights\nSocial reels / clips\nOne-match coverage scoped', false],
    ['instant', 'Sports Leagues', 'League Coverage', 'TOURNAMENT', 'Custom quote', '', 'Consistent content across league fixtures or tournament days.', 'Fixture-wise content plan\nMatchday highlights\nPlayers, sponsors and winners\nMulti-day / multi-venue quotes', true],
    ['instant', 'Sports Leagues', 'Player & Team Reels', 'SOCIAL ENGAGEMENT', 'Custom quote', '', 'Short-form player, team and sponsor stories from the event.', 'Player-focused content\nInterviews if requested\nVertical social edits\nOutput customised per league', false],
    ['professional', 'Brand & Business', 'Brand Shoot', 'CAMPAIGN READY', 'Custom quote', '', 'A high-end camera-led shoot built around your campaign and brand aesthetic.', 'Creative brief and shot planning\nProfessional camera setup\nCrew based on scope\nCustom editing & grading', true],
    ['professional', 'Brand & Business', 'Product Commercial', 'PRODUCT & COMMERCE', 'Custom quote', '', 'Premium imagery and videos to present products with intent.', 'Studio / location options\nLighting and production design\nCampaign / commerce formats\nEditing and deliverables quoted', false],
    ['professional', 'Brand & Business', 'Corporate Film', 'EVENT FILM', 'Custom quote', '', 'Professional coverage and narrative edits for corporate milestones.', 'Professional camera production\nInterviews / event coverage\nHighlight or long-form film\nSound and post-production scoped', false],
    ['professional', 'Wedding & Luxe', 'Signature Wedding Film', 'CINEMATIC WEDDING', 'Custom quote', '', 'Story-led wedding cinematography with a personalised production plan.', 'High-end camera production\nCinematic storytelling\nMulti-event crew options\nFilm length and edits quoted', true],
    ['professional', 'Wedding & Luxe', 'Pre-Wedding Film', 'PRE-WEDDING', 'Custom quote', '', 'Concept-based couple films captured with cinematic equipment.', 'Creative concept\nLocation and lighting plan\nMusic / edit treatment\nDeliverables agreed in quote', false],
    ['professional', 'Sports & Events', 'Sports Documentary', 'LEAGUE FILM', 'Custom quote', '', 'Professional matchday storytelling, player features and league recaps.', 'High-end camera coverage\nMulti-camera on request\nInterviews and sponsor stories\nNarrative post-production', true],
    ['professional', 'Sports & Events', 'Event Highlight Film', 'LIVE EVENTS', 'Custom quote', '', 'Premium highlight films for concerts, business events and ceremonies.', 'Production crew by scale\nProfessional audio if required\nCinematic highlight editing\nCustom turnaround', false]
  ].map(function (r, i) { return r.concat([true, i + 1]); });
  sh.getRange(2, 1, P.length, 11).setValues(P);
}
