/* Line illustrations for cards (no repeated text placeholders).
 * SS.ill('store') returns a small night-sky scene with a silver line drawing.
 * Swap any card for a real photo later by giving it an <img> instead.
 */
(function () {
  const SS = window.SS;
  const P = {
    healthcare: '<rect x="16" y="10" width="32" height="44" rx="4"/><rect x="25" y="6" width="14" height="8" rx="2"/><path d="M22 34h6l3-7 4 14 3-7h6"/><path d="M28 22h8M32 18v8"/>',
    store: '<path d="M10 26h44l-4-12H14z"/><path d="M10 26c0 4 4 6 7 6s7-2 7-6c0 4 4 6 8 6s8-2 8-6c0 4 3 6 7 6s7-2 7-6"/><path d="M14 32v22h36V32"/><rect x="20" y="38" width="10" height="16"/><rect x="35" y="38" width="10" height="8"/>',
    product: '<path d="M27 8h10v8l4 6v30a4 4 0 0 1-4 4H27a4 4 0 0 1-4-4V22l4-6z"/><path d="M23 30h18M23 44h18"/><path d="M50 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>',
    sports: '<path d="M14 50l22-22 6 6-22 22z"/><path d="M36 28l8-8 6 6-8 8"/><circle cx="46" cy="48" r="5"/><path d="M42 47c2-1 6-1 8 1"/>',
    factory: '<path d="M8 54V30l12 8v-8l12 8v-8l12 8V14h8v40z"/><path d="M14 46h4M24 46h4M34 46h4"/><path d="M48 8c2 0 3-2 3-4"/>',
    rocket: '<path d="M32 6c8 6 12 16 10 30H22C20 22 24 12 32 6z"/><circle cx="32" cy="22" r="4"/><path d="M22 36l-6 8 8-2M42 36l6 8-8-2"/><path d="M28 42c0 6 2 10 4 14 2-4 4-8 4-14"/>',
    pen: '<path d="M32 6l14 22-14 28-14-28z"/><circle cx="32" cy="30" r="3"/><path d="M32 33v23"/><path d="M12 56h40"/>',
    social: '<rect x="18" y="6" width="28" height="52" rx="5"/><path d="M28 10h8"/><path d="M32 40c-6-4-9-7-9-11a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 4-3 7-9 11z"/><path d="M48 16h10v8h-6l-4 3z"/>',
    browser: '<rect x="6" y="12" width="52" height="40" rx="4"/><path d="M6 20h52"/><circle cx="11" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><rect x="12" y="26" width="18" height="12" rx="2"/><path d="M36 28h16M36 33h12M12 44h40"/>',
    chart: '<path d="M8 56h48M8 56V8"/><path d="M14 46l10-10 8 6 14-18"/><path d="M40 24h6v6"/><rect x="14" y="48" width="4" height="8"/><rect x="26" y="44" width="4" height="12"/><rect x="38" y="40" width="4" height="16"/>',
    phone: '<path d="M18 8l8 2 3 10-5 4c3 7 8 12 15 15l4-5 10 3 2 8c-2 4-6 6-10 5C26 47 15 36 12 18c-1-4 2-8 6-10z"/><path d="M38 10a16 16 0 0 1 16 16M38 18a8 8 0 0 1 8 8"/>',
    growth: '<path d="M32 56V28"/><path d="M32 36c-10 0-16-6-16-16 10 0 16 6 16 16z"/><path d="M32 30c0-10 6-16 16-16 0 10-6 16-16 16z"/><path d="M20 56h24"/>',
    rings: '<circle cx="25" cy="38" r="13"/><circle cx="39" cy="38" r="13"/><path d="M21 14l4-6h6l4 6-7 7z"/>',
    house: '<path d="M8 30L32 10l24 20"/><path d="M14 26v28h36V26"/><rect x="27" y="38" width="10" height="16"/><rect x="18" y="32" width="6" height="6"/><rect x="40" y="32" width="6" height="6"/>',
    mic: '<rect x="24" y="6" width="16" height="28" rx="8"/><path d="M16 28a16 16 0 0 0 32 0"/><path d="M32 44v12M22 56h20"/>',
    cake: '<rect x="12" y="30" width="40" height="24" rx="3"/><path d="M12 40c4 3 8 3 10 0s6-3 10 0 6 3 10 0 6-3 10 0"/><path d="M22 30v-8M32 30v-8M42 30v-8"/><path d="M22 18c-2-2 0-5 0-6 0 1 2 4 0 6zM32 18c-2-2 0-5 0-6 0 1 2 4 0 6zM42 18c-2-2 0-5 0-6 0 1 2 4 0 6z"/>',
    clapper: '<rect x="8" y="26" width="48" height="28" rx="2"/><path d="M8 26l44-14 3 8-44 14"/><path d="M18 22l6 6M30 18l6 6M42 15l6 6"/>',
    camera: '<rect x="6" y="18" width="52" height="34" rx="5"/><path d="M22 18l4-7h12l4 7"/><circle cx="32" cy="35" r="10"/><circle cx="32" cy="35" r="4"/><path d="M48 24h4"/>'
  };
  const TINTS = {
    healthcare: ['#82e6c6', '#7ccbff'], store: ['#82e6c6', '#a996ff'], product: ['#a996ff', '#ff94b8'], sports: ['#7ccbff', '#82e6c6'],
    factory: ['#7ccbff', '#a996ff'], rocket: ['#a996ff', '#7ccbff'], pen: ['#a996ff', '#ff94b8'], social: ['#ff94b8', '#a996ff'],
    browser: ['#7ccbff', '#82e6c6'], chart: ['#82e6c6', '#7ccbff'], phone: ['#ff94b8', '#7ccbff'], growth: ['#82e6c6', '#a996ff'],
    rings: ['#ff94b8', '#a996ff'], house: ['#82e6c6', '#7ccbff'], mic: ['#7ccbff', '#ff94b8'], cake: ['#ff94b8', '#82e6c6'],
    clapper: ['#a996ff', '#ff94b8'], camera: ['#a996ff', '#7ccbff']
  };
  // a few fixed star positions so each card looks a little different
  const DOTS = [[12, 70], [22, 40], [30, 84], [8, 30], [44, 12], [52, 88], [62, 8], [90, 14], [94, 76], [70, 92], [38, 58], [18, 92]];
  SS.ill = function (theme, label) {
    const t = TINTS[theme] || TINTS.rocket;
    const seed = theme.length;
    const dots = DOTS.filter((_, i) => (i + seed) % 3 !== 0).map(([x, y]) => `<i style="left:${x}%;top:${y}%"></i>`).join('');
    return `<div class="ill" style="--t:${t[0]};--t2:${t[1]}" role="img" aria-label="${SS.esc(label || theme)}">${dots}<b></b><svg class="icon" viewBox="0 0 64 64" aria-hidden="true">${P[theme] || P.rocket}</svg></div>`;
  };
  SS.illFor = {
    project: { 'healthcare-brand-presence': 'healthcare', 'retail-store-launch': 'store', 'consumer-product-campaign': 'product', 'sports-league-coverage': 'sports', 'b2b-brand-storytelling': 'factory', 'mvp-product-launch': 'rocket' },
    service: { 'Brand Identity': 'pen', 'Social Media': 'social', 'Websites': 'browser', 'Performance Marketing': 'chart', 'Lead Generation & Calling': 'phone', 'Growth Strategy': 'growth', 'Content Production': 'camera', 'E-commerce Onboarding': 'product', 'Print & Brochures': 'pen' },
    occasion: { 'store-launch': 'store', 'brand-and-product': 'camera', 'weddings-and-functions': 'rings', 'sports-leagues': 'sports', 'real-estate': 'house', 'corporate-events': 'mic', 'movie-promotions': 'clapper', 'birthday-and-parties': 'cake' }
  };
})();
