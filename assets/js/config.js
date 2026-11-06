/*
 * Site settings. This is the only file you need to edit to go live.
 *
 * API_URL   The Google Apps Script web-app URL (ends in /exec).
 *           See README.md › "Connect the Google Sheet". Leave empty until then:
 *           forms will offer WhatsApp/email instead of failing silently.
 * WHATSAPP  Business WhatsApp number in international format, digits only
 *           (e.g. "919876543210"). Leave empty to hide WhatsApp buttons.
 * EMAIL     Public enquiries address shown on Contact and used as a fallback.
 */
window.SS_CONFIG = {
  API_URL: '',
  WHATSAPP: '',
  EMAIL: '',
  INSTAGRAM_FILMS: 'https://www.instagram.com/shootingstars_films/',
  INSTAGRAM_LABS: 'https://www.instagram.com/shooting_stars_digital_labs/',
  COMPANY: 'Shooting Stars Media Pvt. Ltd.',
  // How long the browser keeps live content (reels, packages, jobs) before asking again.
  CONTENT_CACHE_MINUTES: 5
};
