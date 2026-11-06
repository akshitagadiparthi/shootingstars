// End-to-end checks of forms, live content, the Reach Game and admin, against a simulated backend.
// Run: npm run serve (in one terminal), then npm run test:site
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/';
const API = 'https://script.google.com/macros/s/TEST/exec';
const posts = [];
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ✓', msg); } else { fail++; console.log('  ✗', msg); } };

const content = {
  ok: true,
  reels: [
    { id: 'VIDEO1', kind: 'reel', category: 'weddings', chapter: 'Engagement', title: 'Engagement', featured: true, visible: true, order: 0, video: 'test-media/reel.mp4', poster: 'test-media/reel.jpg' },
    { id: 'LOCKED1', kind: 'reel', category: 'weddings', chapter: 'Pasupu', title: 'Pasupu', featured: true, visible: true, order: 0, embed: false },
    { id: 'DdEelL3pEOE', kind: 'reel', category: 'weddings', chapter: 'Haldi', title: 'Haldi', featured: true, visible: true, order: 1 },
    { id: 'DdG7Y3rJE0S', kind: 'reel', category: 'weddings', chapter: 'Mehendi', title: 'Mehendi', featured: true, visible: true, order: 2 },
    { id: 'DUznJNIjxK5', kind: 'reel', category: 'store', title: 'Store launch', featured: true, visible: true, order: 3 }
  ],
  jobs: [{ title: 'Senior Editor', location: 'Hyderabad', type: 'Full-time', description: 'Cut reels fast.', active: true, order: 1 }],
  packages: [{ mode: 'instant', category: 'Instant Packages', title: 'Test Package', tag: 'TEST', price: '₹999', suffix: 'onwards', desc: 'From the Sheet', features: ['One', 'Two'], popular: true, visible: true, order: 1 }],
  instagram: [{ id: 'NEWPOST123', kind: 'reel' }],
  settings: { superUrgentMaxDays: 2, priorityMaxDays: 5 }
};

const MEDIA = process.env.TEST_MEDIA || require('path').join(__dirname, 'media');
async function route(ctx) {
  await ctx.route(/instagram\.com/, (r) => r.abort());
  await ctx.route('**/test-media/reel.mp4', (r) => r.fulfill({ path: MEDIA + '/raw.mp4', headers: { 'content-type': 'video/mp4' } }));
  await ctx.route('**/test-media/reel.jpg', (r) => r.fulfill({ path: MEDIA + '/raw.jpg', headers: { 'content-type': 'image/jpeg' } }));
  await ctx.route('**/assets/js/config.js', async (r) => {
    const res = await r.fetch();
    const body = (await res.text()).replace("API_URL: ''", `API_URL: '${API}'`);
    r.fulfill({ response: res, body, headers: { 'content-type': 'application/javascript' } });
  });
  await ctx.route(API + '**', async (r) => {
    const req = r.request();
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (req.method() === 'GET') return r.fulfill({ status: 200, headers: cors, body: JSON.stringify(content) });
    const b = JSON.parse(req.postData());
    posts.push(b);
    if (b.action === 'submit') return r.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true, ref: { films: 'FI-00001', labs: 'LB-00001', job: 'JB-00001', freelance: 'FN-00001' }[b.type], priority: b.type === 'films' ? 'Super Urgent' : '', respondBy: 'today, by 8:00 PM IST' }) });
    if (b.action === 'admin') {
      if (b.key !== 'secret') return r.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: false, error: 'Wrong admin key' }) });
      if (b.op === 'overview') return r.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true, sheetUrl: 'https://docs.google.com/x', counts: { enquiries: 3, labs: 1, films: 2, open: 2, overdue: 1, superUrgent: 1, today: 2, careers: 1, freelance: 0 }, bySource: { instagram: 2, direct: 1 }, attention: [{ ref: 'FI-00001', division: 'Films', name: 'Asha', phone: '+91 98', priority: 'Super Urgent', respondBy: '2026-11-06 20:00', overdue: true, shoot: 'Wedding / Function', date: '2026-11-07' }], instagramConnected: false }) });
      if (b.op === 'list') return r.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true, headers: b.sheet === 'Reels' ? ['Instagram link or code', 'Category', 'Title', 'Chapter (weddings)', 'Featured', 'Visible', 'Order', 'Poster image URL (optional)', 'Video file URL (MP4, optional)', 'Plays in Instagram player'] : ['Ref', 'Received (IST)', 'Division', 'Status', 'Films priority', 'Respond by (IST)', 'Name', 'Phone'], rows: b.sheet === 'Reels' ? [{ row: 2, cells: ['https://www.instagram.com/reel/DdEelL3pEOE/', 'weddings', 'Haldi', 'Haldi', true, true, 1, '', '', true] }] : [{ row: 2, cells: ['FI-00001', '2026-11-06 10:00', 'Films', 'New', 'Super Urgent', '2026-11-06 20:00', 'Asha', '+91 98'] }, { row: 3, cells: ['LB-00001', '2026-11-05 18:00', 'Marketing Labs', 'Contacted', '', '2026-11-06 12:00', 'Ravi', '+91 97'] }], total: 2 }) });
      return r.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true }) });
    }
    r.fulfill({ status: 200, headers: cors, body: '{"ok":false}' });
  });
}

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await route(ctx);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  console.log('Films enquiry');
  await page.goto(BASE + 'enquiry.html?shoot=weddings&package=Half%20Day&mode=Professional');
  ok(await page.inputValue('[name=shoot_type]') === 'Wedding / Function', 'prefills shoot type from ?shoot=');
  ok(await page.inputValue('[name=package]') === 'Half Day', 'prefills package');
  ok(await page.isChecked('input[name=production][value^="Professional"]'), 'prefills production mode');
  const tomorrow = new Date(Date.now() + 86400000);
  await page.fill('[name=shoot_date]', ymd(tomorrow));
  await page.dispatchEvent('[name=shoot_date]', 'input');
  ok((await page.textContent('.priority')).includes('Super Urgent'), 'shows Super Urgent for tomorrow');
  await page.fill('[name=location]', 'Vijayawada');
  await page.click('[data-next]');
  ok(await page.isVisible('[data-step="2"]'), 'moves to step 2');
  ok((await page.textContent('[data-summary]')).includes('Vijayawada'), 'summary shows location');
  await page.fill('[name=name]', 'Asha Test');
  await page.fill('[name=phone]', '+91 98765 43210');
  await page.check('[name=consent]');
  await page.click('button[type=submit]');
  await page.waitForSelector('.success', { timeout: 5000 });
  ok((await page.textContent('.success')).includes('FI-00001'), 'success shows reference');
  const fp = posts.find((p) => p.type === 'films');
  ok(fp && fp.data.shoot_date === ymd(tomorrow) && fp.data.name === 'Asha Test' && fp.data.consent === 'yes', 'posted the right data');
  ok(fp && fp.meta && typeof fp.meta.seconds === 'number' && 'landing' in fp.meta, 'posted meta (timing, source)');
  ok(fp && !('company_website' in fp.data), 'honeypot not sent');

  console.log('Labs proposal');
  await page.goto(BASE + 'proposal.html?service=Websites&service=Social%20Media&industry=Technology%20%2F%20SaaS');
  ok(await page.isChecked('input[name=services][value="Websites"]') && await page.isChecked('input[name=services][value="Social Media"]'), 'prefills services');
  ok(await page.inputValue('[name=industry]') === 'Technology / SaaS', 'prefills industry');
  await page.click('button[type=submit]');
  ok(!(await page.$('.success')), 'blocks empty required fields');
  await page.fill('[name=name]', 'Ravi'); await page.fill('[name=business]', 'Acme'); await page.fill('[name=email]', 'ravi@example.com');
  await page.fill('[name=phone]', '9876543210'); await page.fill('[name=challenge]', 'More enquiries'); await page.check('[name=consent]');
  await page.click('button[type=submit]');
  await page.waitForSelector('.success', { timeout: 5000 });
  const lp = posts.find((p) => p.type === 'labs');
  ok(lp && Array.isArray(lp.data.services) && lp.data.services.length === 2, 'services sent as a list');

  console.log('Freelance network');
  await page.goto(BASE + 'network.html');
  await page.fill('[name=name]', 'Kiran'); await page.fill('[name=email]', 'k@example.com'); await page.fill('[name=phone]', '9876543210');
  await page.fill('[name=city]', 'Hyderabad'); await page.selectOption('[name=work_status]', 'Student'); await page.selectOption('[name=availability]', 'Weekends');
  await page.selectOption('[name=work_mode]', 'Remote'); await page.fill('[name=portfolio]', 'https://behance.net/kiran');
  await page.click('[data-addlink]'); await page.fill('[data-links] .row input', 'https://instagram.com/kiran');
  await page.check('[name=commitment_assignments]'); await page.check('[name=commitment_lawful]'); await page.check('[name=consent]');
  const before = posts.length;
  await page.click('button[type=submit]');
  await page.waitForTimeout(300);
  ok(posts.length === before, 'requires at least one skill');
  await page.check('input[name=skills][value="Video editing"]');
  await page.click('button[type=submit]');
  await page.waitForSelector('.success', { timeout: 5000 });
  const fl = posts.find((p) => p.type === 'freelance');
  ok(fl && Array.isArray(fl.data.portfolio) && fl.data.portfolio.length === 2, 'sends every portfolio link');

  console.log('Careers & live content');
  await page.goto(BASE + 'careers.html');
  await page.waitForSelector('#jobs article');
  ok((await page.textContent('#jobs')).includes('Senior Editor'), 'shows active job from the Sheet');
  await page.goto(BASE + 'apply.html?role=Senior%20Editor');
  await page.waitForTimeout(400);
  ok(await page.inputValue('[name=role]') === 'Senior Editor', 'apply form preselects live role');
  await page.goto(BASE + 'films.html');
  await page.waitForSelector('[data-grid] .pkg');
  ok((await page.textContent('[data-grid]')).includes('Test Package'), 'packages come from the Sheet');
  ok((await page.textContent('#films-reels')).includes('Latest'), 'newest Instagram post appears as Latest');

  console.log('Home: reels, viewer, game');
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#home-rail .reel-card');
  ok(!(await page.$('.constellation')), 'no constellation on the home page');
  const railText = await page.textContent('#home-rail');
  ok(!railText.includes('Pasupu'), 'reels Instagram blocks (no video file) are hidden');
  await page.waitForSelector('#home-hero-reel video', { timeout: 5000 });
  const heroPlaying = await page.waitForFunction(() => { const v = document.querySelector('#home-hero-reel video'); return v && v.currentTime > 0.2 && !v.paused; }, null, { timeout: 8000 }).then(() => true).catch(() => false);
  ok(heroPlaying, 'hero reel (video file) plays silently by itself');
  await page.evaluate(() => document.querySelector('#home-rail .rail').scrollIntoView());
  await page.waitForSelector('#home-rail iframe[data-ig]', { timeout: 5000 }).catch(() => null);
  const src = await page.getAttribute('#home-rail iframe[data-ig]', 'src');
  ok(src && /instagram\.com\/reel\/[^/]+\/embed\/$/.test(src), 'Instagram reels use the direct player frame (plays inline)');
  await page.click('#home-watch');
  await page.waitForSelector('.story');
  ok((await page.$$('.story .bars i')).length >= 3, 'viewer opens with every playable reel');
  ok(await page.$('.story iframe[data-ig]'), 'viewer starts with the newest Instagram reel');
  await page.keyboard.press('ArrowRight');
  ok(await page.$('.story video'), 'arrow key moves on; video files play full screen');
  await page.keyboard.press('Escape');
  ok(!(await page.$('.story')), 'Escape closes the viewer');

  await page.evaluate(() => document.getElementById('catch-game').scrollIntoView());
  await page.click('[data-play]');
  ok(await page.evaluate(() => SS._game.state().playing), 'game starts');
  const box = await page.$('#catch-game canvas');
  const bb = await box.boundingBox();
  await page.evaluate(() => SS._game.spawnAt(200, 200));
  await page.mouse.click(bb.x + 200, bb.y + 200);
  ok(await page.evaluate(() => SS._game.state().score) >= 1, 'tapping a star scores');
  await page.evaluate(() => SS._game.spawnAt(300, 250));
  await page.focus('#catch-game .game');
  await page.keyboard.press('Space');
  ok(await page.evaluate(() => SS._game.state().score) >= 2, 'Space catches a star (keyboard play)');
  await page.waitForSelector('[data-end]:not([hidden])', { timeout: 25000 });
  ok((await page.textContent('[data-rank]')).length > 3, 'round ends with a rank: ' + (await page.textContent('[data-rank]')));
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }).catch(() => null), page.click('[data-share]')]);
  ok(!!dl, 'share makes a story image');

  console.log('Wedding shoots page');
  await page.goto(BASE + 'shoot.html?t=weddings-and-functions');
  await page.waitForSelector('.cstar');
  ok((await page.$$('.cstar')).length === 3, 'constellation shows each playable ceremony');
  await page.click('.cstar >> nth=1');
  ok(await page.isVisible('.story'), 'tapping a star plays that ceremony');
  await page.keyboard.press('Escape');
  await page.goto(BASE + 'shoot.html?t=store-launch');
  await page.waitForTimeout(500);
  ok(await page.isHidden('#sh-constellation-section'), 'constellation only on the wedding page');

  console.log('Background shooting stars');
  await page.goto(BASE + 'about.html');
  await page.waitForTimeout(1500);
  ok(typeof (await page.evaluate(() => typeof SS.toast)) === 'string', 'star-catching helpers loaded');

  console.log('Admin');
  await page.goto(BASE + 'admin/index.html');
  await page.fill('[name=key]', 'wrong'); await page.click('#login-form button');
  await page.waitForSelector('#login-err:not([hidden])');
  ok((await page.textContent('#login-err')).includes('Wrong admin key'), 'rejects a wrong key');
  await page.fill('[name=key]', 'secret'); await page.click('#login-form button');
  await page.waitForSelector('.tile');
  ok((await page.textContent('#view')).includes('Past callback deadline'), 'overview loads');
  await page.click('[data-tab="Enquiries"]');
  await page.waitForSelector('tbody tr[data-k]');
  ok((await page.$$('tbody tr[data-k]')).length === 2, 'enquiries table');
  await page.fill('#view input[type=search]', 'ravi');
  ok((await page.$$('tbody tr[data-k]')).length === 1, 'search filters');
  await page.click('[data-tab="Reels"]');
  await page.waitForSelector('#reel-add');
  await page.fill('#reel-add [name=link]', 'https://www.instagram.com/reel/ABCDEF123/');
  await page.selectOption('#reel-add [name=cat]', 'sports');
  await page.click('#reel-add button[type=submit]');
  await page.waitForTimeout(300);
  ok(posts.some((p) => p.op === 'save' && p.sheet === 'Reels' && p.values.Category === 'sports'), 'adds a reel');

  console.log('Not connected');
  const ctx2 = await b.newContext();
  await ctx2.route(/instagram\.com/, (r) => r.abort());
  const p2 = await ctx2.newPage();
  await p2.goto(BASE + 'apply.html');
  await p2.fill('[name=name]', 'X'); await p2.fill('[name=email]', 'x@example.com'); await p2.selectOption('[name=role]', 'Video Editor');
  await p2.fill('[name=city]', 'Hyd'); await p2.fill('[name=cv_link]', 'https://drive.google.com/x'); await p2.check('[name=consent]');
  await p2.click('button[type=submit]');
  await p2.waitForSelector('.status.err');
  ok((await p2.textContent('.status.err')).includes('not connected'), 'explains when the Sheet is not connected yet');

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
