// Runs the real Code.gs against an in-memory fake of the Google services it uses.
const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync(process.argv[2] || require('path').join(__dirname, '..', 'backend', 'apps-script', 'Code.gs'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };

function makeEnv(nowISO) {
  const sheets = {};
  const props = {};
  const cache = {};
  const mails = [];
  class Range {
    constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr: nr || 1, nc: nc || 1 }); }
    setValues(v) { v.forEach((row, i) => row.forEach((x, j) => { const R = this.r + i - 1; while (this.sh.data.length <= R) this.sh.data.push([]); this.sh.data[R][this.c + j - 1] = x; })); return this; }
    setValue(x) { return this.setValues([[x]]); }
    setFontWeight() { return this; } setBackground() { return this; } setFontColor() { return this; } setNumberFormat() { return this; }
    setDataValidation() { return this; } insertCheckboxes() { return this; } setWrap() { return this; } setNote() { return this; }
  }
  class Sheet {
    constructor(name) { this.name = name; this.data = []; }
    getName() { return this.name; }
    getRange(a, b, c, d) { if (typeof a === 'string') return new Range(this, 1, 1); return new Range(this, a, b, c, d); }
    appendRow(r) { this.data.push(r.slice()); }
    getLastRow() { return this.data.length; }
    getDataRange() { const w = Math.max(0, ...this.data.map((r) => r.length)); return { getValues: () => this.data.map((r) => Array.from({ length: w }, (_, i) => (r[i] === undefined ? '' : r[i]))) }; }
    deleteRow(n) { this.data.splice(n - 1, 1); }
    setFrozenRows() {} setConditionalFormatRules() {} setColumnWidth() {}
  }
  const book = {
    getSheetByName: (n) => sheets[n] || null, insertSheet: (n) => (sheets[n] = new Sheet(n)), getSheets: () => Object.values(sheets),
    deleteSheet: () => {}, getId: () => 'SHEET123', getUrl: () => 'https://docs.google.com/spreadsheets/d/SHEET123', setSpreadsheetTimeZone: () => {}
  };
  const builder = () => new Proxy({}, { get: (t, k) => (k === 'build' ? () => ({}) : () => builder()) });
  const RealDate = Date;
  const fixed = new RealDate(nowISO).getTime();
  class FakeDate extends RealDate { constructor(...a) { if (a.length === 0) super(fixed); else super(...a); } static now() { return fixed; } }
  const ctx = {
    console: { log() {}, error() {} }, JSON, Math, Number, String, Array, Object, RegExp, isFinite, Error, encodeURIComponent,
    Date: FakeDate,
    Utilities: {
      formatDate(d, tz, fmt) {
        const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
        return fmt.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace(/\bH\b/, String(+p.hour)).replace(/\bmm\b/, p.minute).replace(/\bm\b/, String(+p.minute));
      },
      computeDigest: (a, s) => Array.from(require('crypto').createHash('sha256').update(s).digest()),
      base64EncodeWebSafe: (b) => Buffer.from(b.map((x) => (x + 256) % 256)).toString('base64url'),
      DigestAlgorithm: { SHA_256: 'sha256' }, getUuid: () => require('crypto').randomUUID()
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => book, openById: () => book, newDataValidation: builder, newConditionalFormatRule: builder },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => (props[k] = v), deleteProperty: (k) => delete props[k] }) },
    CacheService: { getScriptCache: () => ({ get: (k) => (k in cache ? cache[k] : null), put: (k, v) => (cache[k] = v), remove: (k) => delete cache[k], removeAll: (ks) => ks.forEach((k) => delete cache[k]) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail: (o) => mails.push(o) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) },
    ScriptApp: { getProjectTriggers: () => [], deleteTrigger() {}, newTrigger: () => ({ timeBased: () => ({ everyWeeks: () => ({ create() {} }) }) }) },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => 500, getContentText: () => '' }) },
    ContentService: { createTextOutput: (s) => ({ s, setMimeType() { return this; } }), MimeType: { JSON: 'json' } }
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { ctx, sheets, props, cache, mails };
}

const call = (env, fn, body) => JSON.parse(env.ctx[fn](fn === 'doPost' ? { postData: { contents: JSON.stringify(body) } } : { parameter: body }).s);

console.log('Pure rules');
let env = makeEnv('2026-11-06T09:00:00Z'); // 14:30 IST
const S = { SUPER_URGENT_MAX_DAYS: 2, PRIORITY_MAX_DAYS: 5, CALLBACK_CUTOFF_HOUR: 16, SAME_DAY_DEADLINE_HOUR: 20, NEXT_DAY_DEADLINE_HOUR: 12 };
const c = env.ctx;
ok(c.daysUntil_('2026-11-08') === 2, 'days until shoot (IST)');
ok(c.priorityFor_(0, S) === 'Super Urgent' && c.priorityFor_(2, S) === 'Super Urgent' && c.priorityFor_(3, S) === 'Priority' && c.priorityFor_(5, S) === 'Priority' && c.priorityFor_(6, S) === 'Regular' && c.priorityFor_(-1, S) === 'Past date', 'priority bands 0–2 / 3–5 / 6+');
let rb = c.respondBy_(new c.Date(), S);
ok(rb.text === 'today, by 8:00 PM IST' && rb.date.toISOString() === '2026-11-06T14:30:00.000Z', '2:30 PM IST → same day 8 PM');
rb = c.respondBy_(new Date('2026-11-06T11:00:00Z'), S); // 16:30 IST
ok(rb.text === 'by 12:00 PM IST tomorrow' && rb.date.toISOString() === '2026-11-07T06:30:00.000Z', '4:30 PM IST → noon next day');
rb = c.respondBy_(new Date('2026-11-06T19:00:00Z'), S); // 00:30 IST on the 7th
ok(rb.date.toISOString() === '2026-11-07T14:30:00.000Z', 'just after midnight IST counts as the new day');
ok(JSON.stringify(c.parseInstagram_('https://www.instagram.com/reel/DdLTdmYJFEd/?obrf=MTlreG8')) === '{"id":"DdLTdmYJFEd","kind":"reel"}', 'reads reel links with tracking');
ok(JSON.stringify(c.parseInstagram_('https://www.instagram.com/p/DerXr-dgfj-/?vrfl=x')) === '{"id":"DerXr-dgfj-","kind":"p"}', 'reads photo post links');
ok(JSON.stringify(c.parseInstagram_('https://www.instagram.com/madetoshine._/reel/DdLTdmYJFEd/')) === '{"id":"DdLTdmYJFEd","kind":"reel"}', 'reads collab links with a username');
ok(c.parseInstagram_('hello world') === null, 'rejects junk');
ok(c.clean_('=HYPERLINK("x")') === "'=HYPERLINK(\"x\")" && c.clean_('+91 98765') === "'+91 98765", 'blocks spreadsheet formulas');

console.log('Setup');
c.setup();
ok(['Enquiries', 'Careers', 'Freelance', 'Reels', 'Jobs', 'Packages', 'Settings'].every((n) => env.sheets[n]), 'creates all tabs');
ok(env.sheets.Reels.data.length === 20 && env.sheets.Packages.data.length === 20 && env.sheets.Settings.data.length === 11, 'seeds reels, packages, settings');
ok(env.props.ADMIN_KEY && env.props.ADMIN_KEY.length > 30, 'creates an admin key');

console.log('Content');
let res = call(env, 'doGet', { action: 'content' });
ok(res.ok && res.reels.length === 13 && res.reels[0].id === 'Dc6VVI4JGmp', 'serves the 13 reels that can play (6 Instagram-locked ones held back)');
ok(env.sheets.Reels.data[1][9] === false && env.sheets.Reels.data[2][9] === true, 'locked reels are marked in the Sheet');
ok(res.reels.find((r) => r.chapter === 'Pellikoduku').category === 'weddings', 'keeps wedding chapters');
ok(res.packages.length === 19 && res.packages[0].features.length === 4 && res.packages[1].popular === true, 'serves packages with features');
ok(res.jobs.length === 5 && res.jobs.every((j) => j.active === false), 'serves jobs (inactive by default)');
env.sheets.Reels.data[2][5] = false; // hide Engagement
c.onEdit({ range: { getSheet: () => ({ getName: () => 'Reels' }) } });
res = call(env, 'doGet', { action: 'content' });
ok(res.reels.length === 12, 'editing the Sheet updates the site (cache cleared)');
env.sheets.Reels.data[1][8] = 'assets/reels/featured.mp4'; // add a video file to a locked reel
c.onEdit({ range: { getSheet: () => ({ getName: () => 'Reels' }) } });
res = call(env, 'doGet', { action: 'content' });
ok(res.reels.length === 13 && res.reels.some((r) => r.id === 'DeefV69P6ei' && r.video === 'assets/reels/featured.mp4'), 'adding a video file brings a locked reel back');

console.log('Submissions');
const films = { action: 'submit', type: 'films', data: { production: 'Instant — iPhone', shoot_type: 'Wedding / Function', package: 'Half Day', shoot_date: '2026-11-07', location: 'Vijayawada', name: 'Asha', phone: '+91 98765 43210', email: 'asha@example.com', consent: 'yes' }, meta: { seconds: 40, utm_source: 'instagram', page: '/enquiry.html' } };
res = call(env, 'doPost', films);
ok(res.ok && res.ref === 'FI-00001' && res.priority === 'Super Urgent' && res.respondBy === 'today, by 8:00 PM IST', 'films enquiry → ref, priority, deadline');
const row = env.sheets.Enquiries.data[1];
ok(row[0] === 'FI-00001' && row[2] === 'Films' && row[3] === 'New' && row[4] === 'Super Urgent' && row[7] === "'+91 98765 43210" && row[21] === 'instagram', 'writes the row (phone kept as text, source)');
ok(env.mails.length === 2 && env.mails[0].to === 'owner@example.com' && /Super Urgent/.test(env.mails[0].subject) && env.mails[1].to === 'asha@example.com', 'emails the team and the customer');
res = call(env, 'doPost', films);
ok(res.ref === 'FI-00001' && env.sheets.Enquiries.data.length === 2, 'double-submit returns the same reference, no duplicate row');
res = call(env, 'doPost', { action: 'submit', type: 'labs', data: { name: 'Ravi', business: 'Acme', industry: 'Retail', email: 'r@example.com', phone: '9876543210', challenge: 'Grow', services: ['Websites', 'Social Media'], consent: 'yes' }, meta: { seconds: 30 } });
ok(res.ref === 'LB-00001' && env.sheets.Enquiries.data[2][12] === 'Websites, Social Media', 'labs proposal with several services');
res = call(env, 'doPost', { action: 'submit', type: 'labs', data: { name: 'Mini', business: 'B', industry: 'Retail', email: 'm@example.com', phone: '9000000001', challenge: 'Fun', consent: 'yes' }, meta: { seconds: 30, from: 'catch-game' } });
ok(env.sheets.Enquiries.data[3][21] === 'mini game', 'enquiries from the mini game are tagged as such');
res = call(env, 'doPost', { action: 'submit', type: 'labs', data: { name: 'Ravi' }, meta: { seconds: 30 } });
ok(!res.ok && /required/.test(res.error), 'rejects missing fields');
res = call(env, 'doPost', { action: 'submit', type: 'films', data: Object.assign({}, films.data, { shoot_date: '2026-11-01', phone: '9999999999' }), meta: { seconds: 30 } });
ok(!res.ok && /future/.test(res.error), 'rejects past shoot dates');
const n = env.sheets.Enquiries.data.length;
res = call(env, 'doPost', { action: 'submit', type: 'labs', data: { company_website: 'spam' }, meta: { seconds: 30 } });
ok(res.ok && env.sheets.Enquiries.data.length === n, 'bots are thanked but not saved');
res = call(env, 'doPost', { action: 'submit', type: 'job', data: { name: 'J', email: 'j@example.com', role: 'Video Editor', city: 'Hyd', cv_link: 'https://drive.google.com/x', consent: 'yes' }, meta: { seconds: 20 } });
ok(res.ref === 'JB-00001' && env.sheets.Careers.data.length === 2, 'job application');
res = call(env, 'doPost', { action: 'submit', type: 'freelance', data: { name: 'K', email: 'k@example.com', phone: '9876543210', city: 'Hyd', work_status: 'Student', availability: 'Weekends', work_mode: 'Remote', skills: ['Video editing'], portfolio: ['https://a.com/x', 'https://b.com/y'], commitment_assignments: 'agreed', commitment_lawful: 'agreed', consent: 'yes' }, meta: { seconds: 50 } });
ok(res.ref === 'FN-00001' && env.sheets.Freelance.data[1][12] === 'https://a.com/x\nhttps://b.com/y', 'freelance registration keeps every link');

console.log('Admin');
res = call(env, 'doPost', { action: 'admin', key: 'nope', op: 'overview' });
ok(!res.ok && res.error === 'Wrong admin key', 'wrong key refused');
const key = env.props.ADMIN_KEY;
res = call(env, 'doPost', { action: 'admin', key, op: 'overview' });
ok(res.ok && res.counts.enquiries === 3 && res.counts.films === 1 && res.counts.superUrgent === 1 && res.counts.careers === 1, 'overview counts');
res = call(env, 'doPost', { action: 'admin', key, op: 'list', sheet: 'Enquiries' });
ok(res.ok && res.rows[0].cells[0] === 'LB-00002', 'lists newest first');
res = call(env, 'doPost', { action: 'admin', key, op: 'save', sheet: 'Reels', values: { 'Instagram link or code': 'https://www.instagram.com/reel/NEW12345/', Category: 'sports', Title: 'Final', Visible: true, Featured: false, Order: 30 } });
ok(res.ok && env.sheets.Reels.data.length === 21, 'admin adds a reel');
res = call(env, 'doPost', { action: 'admin', key, op: 'save', sheet: 'Reels', values: { 'Video file URL (MP4, optional)': 'assets/reels/new.mp4', Category: 'store', Visible: true } });
ok(res.ok, 'admin can add a reel from a video file alone');
res = call(env, 'doPost', { action: 'admin', key, op: 'save', sheet: 'Enquiries', values: {} });
ok(!res.ok, 'admin cannot overwrite enquiries');
res = call(env, 'doPost', { action: 'admin', key, op: 'settings.save', values: { SUPER_URGENT_MAX_DAYS: 5, PRIORITY_MAX_DAYS: 3 } });
ok(!res.ok && /fewer days/.test(res.error), 'rejects inconsistent priority settings');
res = call(env, 'doPost', { action: 'admin', key, op: 'settings.save', values: { SUPER_URGENT_MAX_DAYS: 1, PRIORITY_MAX_DAYS: 4, FILMS_TEAM_EMAIL: 'films@example.com' } });
ok(res.ok, 'saves settings');
env.mails.length = 0;
res = call(env, 'doPost', { action: 'submit', type: 'films', data: Object.assign({}, films.data, { shoot_date: '2026-11-08', phone: '9123456789' }), meta: { seconds: 30 } });
ok(res.priority === 'Priority' && env.mails[0].to === 'films@example.com', 'new settings apply immediately (2 days → Priority, Films inbox)');
for (let i = 0; i < 10; i++) call(env, 'doPost', { action: 'admin', key: 'x', op: 'overview' });
res = call(env, 'doPost', { action: 'admin', key, op: 'overview' });
ok(!res.ok && /Too many/.test(res.error), 'locks out after repeated wrong keys');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
