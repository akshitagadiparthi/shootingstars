// Renders PNG icons and the social share image from the SVG masters.
// Usage: node tools/render_icons.cjs   (needs: npm i -D playwright)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const brand = path.join(__dirname, '..', 'assets', 'brand');
const svg = (f) => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(brand, f)).toString('base64');

const jobs = [
  { out: 'favicon-32.png', w: 32, h: 32, html: `<img src="${svg('icon-monogram.svg')}" style="width:32px;height:32px">` },
  { out: 'apple-touch-icon.png', w: 180, h: 180, html: `<div style="width:180px;height:180px;background:#000;display:flex"><img src="${svg('icon-monogram.svg')}" style="width:180px;height:180px"></div>` },
  { out: 'icon-192.png', w: 192, h: 192, html: `<img src="${svg('icon-monogram.svg')}" style="width:192px;height:192px">` },
  { out: 'icon-512.png', w: 512, h: 512, html: `<img src="${svg('icon-monogram.svg')}" style="width:512px;height:512px">` },
  { out: 'instagram-avatar-1080.png', w: 1080, h: 1080, html: `<img src="${svg('avatar-circle.svg')}" style="width:1080px;height:1080px">` },
  { out: 'logo-stacked-white-1200.png', w: 1200, h: 360, html: `<img src="${svg('logo-stacked-white.svg')}" style="width:1200px;height:360px;object-fit:contain">` },
  {
    out: 'og-image.jpg', w: 1200, h: 630, type: 'jpeg', bg: '#000',
    html: `<div style="width:1200px;height:630px;background:#000;position:relative;overflow:hidden;font-family:serif">
      ${Array.from({ length: 70 }, (_, i) => `<i style="position:absolute;left:${(i * 137) % 1200}px;top:${(i * 89) % 630}px;width:2px;height:2px;border-radius:50%;background:#fff;opacity:${0.15 + (i % 5) * 0.12}"></i>`).join('')}
      <i style="position:absolute;left:760px;top:70px;width:300px;height:2px;transform:rotate(-28deg);background:linear-gradient(90deg,#fff,rgba(200,206,214,0))"></i>
      <img src="${svg('logo-stacked-media-white.svg')}" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-55%);width:760px">
    </div>`,
  },
];

(async () => {
  const b = await chromium.launch();
  for (const j of jobs) {
    const p = await b.newPage({ viewport: { width: j.w, height: j.h } });
    await p.setContent(`<html><body style="margin:0;background:${j.bg || 'transparent'}">${j.html}</body></html>`);
    await p.waitForTimeout(50);
    const opts = { path: path.join(brand, j.out), omitBackground: !j.bg };
    if (j.type === 'jpeg') { opts.type = 'jpeg'; opts.quality = 86; delete opts.omitBackground; }
    await p.screenshot(opts);
    await p.close();
    console.log(j.out, (fs.statSync(path.join(brand, j.out)).size / 1024).toFixed(1) + ' KB');
  }
  await b.close();
})();
