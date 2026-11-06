# Shooting Stars Media — website

Black night sky, silver light and a few soft colours. Headlines use the logo's typeface; body text uses a clean sans-serif. Your reels play right on the page. Every enquiry lands in a Google Sheet.

- **Website:** plain HTML, CSS and JavaScript. No build step and no framework, so it can be hosted anywhere.
- **Backend:** one Google Apps Script attached to one Google Sheet. It is free and needs no server.
- **Admin:** `/admin` — a private dashboard for enquiries, reels, job openings and settings.

---

## 1. What's in the box

```
index.html            Home: hero reel, divisions, reels rail + full-screen viewer, "Catch a shooting star" game
labs.html             Marketing Labs
films.html            Shooting Stars Films: reels wall, packages, occasions
work.html             Our Work: all reels + example projects
service.html          One Labs service      (?s=brand-identity, websites, …)
industries.html       Industries list
industry.html         One industry          (?i=healthcare, startups-and-emerging-businesses, …)
shoot.html            One shoot occasion    (?t=weddings-and-functions has the wedding constellation)
project.html          One example project   (?p=…)
start.html            Start a project (choose division)
proposal.html         Labs proposal form           → Sheet tab "Enquiries"
enquiry.html          Films shoot enquiry (2 steps) → Sheet tab "Enquiries"
careers.html          Careers (job openings come live from the Sheet)
apply.html            Job application              → Sheet tab "Careers"
network.html          Freelance network            → Sheet tab "Freelance"
about / contact / faq / privacy / 404
admin/index.html      Admin dashboard (not indexed by search engines)

assets/js/config.js   ← the only file you must edit (API URL, WhatsApp, email)
assets/js/data.js     All site copy + default reels/packages/jobs (used until the Sheet is connected)
assets/js/site.js     Header, footer, night sky, shooting stars (catch them!), live content loader
assets/js/reels.js    Reel players (video files + Instagram), full-screen viewer, rails, wedding constellation
assets/js/game.js     Mini game: "Catch a shooting star"
assets/js/forms.js    All four forms
assets/js/pages.js    Page-specific rendering
assets/css/site.css   All styles
assets/fonts/         Bodoni Moda (headlines) + Inter (text), self-hosted, SIL Open Font Licence
assets/reels/         Put your reel video files here (see section 6)
assets/brand/         The rebuilt logo, icons, Instagram avatar, share image

backend/apps-script/  Code.gs + appsscript.json → paste into Google Apps Script
tests/                Automated checks (backend rules, forms, game, admin)
tools/                Logo/icon scripts + prepare-reels.sh (makes web-ready reel videos)
```

## 2. Run it on your computer

```bash
python3 -m http.server 8765      # or: npm run serve
```
Open http://localhost:8765. Without the Sheet connected, the site uses the built-in content in `data.js`. If someone submits a form, they are offered WhatsApp or email instead (once you've added those to `config.js`).

## 3. Put it online

Push the folder to your Git repo, then connect the repo to any static host:

| Host | Settings |
|---|---|
| **Netlify** | New site from Git → build command: *(none)* → publish directory: `/` |
| **Vercel** | Import project → Framework: *Other* → no build command → output: `/` |
| **GitHub Pages** | Settings → Pages → Deploy from branch → `main` / root |
| **cPanel / any server** | Upload the folder contents to `public_html` |

Afterwards, replace `YOUR-DOMAIN` in `robots.txt` and `sitemap.xml` with your real domain.

## 4. Connect the Google Sheet (about 10 minutes)

1. Create a new Google Sheet (for example "Shooting Stars — Website") in the Google account that should own the enquiries.
2. In the Sheet, open **Extensions → Apps Script**. Delete the sample code, then paste in `backend/apps-script/Code.gs`.
3. In Apps Script, open **Project Settings** (gear icon) → tick **Show "appsscript.json" manifest file**. Open that file and replace it with `backend/apps-script/appsscript.json`. Save.
4. Go back to the Sheet and reload it. A new menu called **Shooting Stars** appears. Click **Shooting Stars → Set up the Sheet** and approve the permissions. This creates these tabs:
   - **Enquiries, Careers, Freelance**: every form submission, newest at the bottom, with a reference number (`FI-00001`, `LB-00001`, …), the IST time, Films priority and callback deadline. Change the **Status** column as you work through them. Overdue callbacks turn red.
   - **Reels**: the reels shown on the site, already filled in with your links.
   - **Packages**: Films packages and prices.
   - **Jobs**: job openings. Tick *Active* to publish one.
   - **Settings**: priority days, callback cut-off, team emails, customer confirmation emails.

   It also shows your **admin key**. Copy it somewhere safe.
5. In Apps Script, click **Deploy → New deployment → Web app**. Set *Execute as*: **Me** and *Who has access*: **Anyone**. Click **Deploy** and copy the URL that ends in `/exec`.
6. Paste that URL into `assets/js/config.js` as `API_URL`. While you're there, add `WHATSAPP` and `EMAIL`. Commit and push.

That's it. Send a test enquiry from the live site, and it should appear in the Sheet with an email to you.

> **Changing Code.gs later:** use **Deploy → Manage deployments → Edit → Version: New version**. That keeps the same `/exec` URL, so you don't need to touch `config.js` again.

**Who gets emailed:** the Settings tab has `LABS_TEAM_EMAIL`, `FILMS_TEAM_EMAIL` and `CAREERS_TEAM_EMAIL` (separate several addresses with commas). If a cell is empty, the Sheet owner gets the email. Customers who give an email get a short confirmation with their reference; set `SEND_CUSTOMER_CONFIRMATION` to `FALSE` to turn that off.

**Films priority and callbacks** (the same rules as the admin prototype, editable in Settings):
- Shoot 0–2 days away = **Super Urgent**; 3–5 days = **Priority**; 6 or more = **Regular**.
- Enquiry before 4:00 PM IST: call back the same day (by 8 PM). After 4 PM: call back by 12:00 PM the next day.

**Spam protection:** a hidden trap field catches bots, as do forms completed in under 3 seconds. Repeat submissions within 10 minutes get the same reference, there's a site-wide rate limit, and text that looks like a spreadsheet formula is neutralised.

## 5. Updating the site day to day

All of these update live, with no code change and no redeploy. Changes appear within a minute or two.

| To… | Do this |
|---|---|
| Add a reel | Admin → Reels → paste the Instagram link → pick a category. Or add a row in the **Reels** tab. |
| Hide a reel | Untick *Visible* (admin or Sheet) |
| Feature a reel on the home page | Tick *Featured* |
| Add a wedding ceremony to the constellation (wedding shoots page) | Category `weddings` + fill *Chapter* (Engagement, Bride to be, Pasupu, Haldi, Mehendi, Sangeeth, Pellikoduku, or a new one) |
| Make a blocked reel play | Add its video file in *Video file URL* (see section 6) |
| Use your own cover image for a reel | Put an image path or URL in *Poster image URL* |
| Change a package or price | **Packages** tab (one row per package; features one per line) |
| Publish a job opening | Admin → Job openings, or the **Jobs** tab → tick *Active* |
| Change priority days or emails | Admin → Settings, or the **Settings** tab |

Reel categories: `featured, weddings, sports, store, brand, automotive, movies, photography, celebrations, realestate, corporate`.

Text on the pages (headlines and descriptions) lives in the HTML files and in `assets/js/data.js`.

## 6. Reels: making every reel play on the site

Every reel plays in one of two ways:

1. **Instagram's player.** This works for most reels: they play right on the card, with no trip to Instagram. Some reels are blocked by Instagram: they only show "Watch on Instagram" because of licensed music or the owner's settings. When I checked on 6 Nov 2026, these six were blocked: *Featured reel (DeefV69P6ei), Bride to be, Pasupu, Sangeeth (DdBMfjGpCKf), Sporting event (DetXGpUvQKu), Car*. They are hidden from the site (column **Plays in Instagram player** is unticked) until they have a video file.
2. **Your own video file (recommended for your best reels).** It plays silently as people scroll, then full screen with sound when tapped. It always works, loads fast and has no Instagram branding around it.

To add video files:
```bash
./tools/prepare-reels.sh ~/Exports/haldi.mp4 ~/Exports/sangeeth.mp4   # needs ffmpeg
```
This writes small web-ready files (`assets/reels/haldi.mp4` plus `haldi.jpg` as the cover) into the site. Commit them, then put `assets/reels/haldi.mp4` in the reel's **Video file URL** column and `assets/reels/haldi.jpg` in **Poster image URL**. The reel appears within a minute. If you'd rather not keep videos in Git, any public MP4 link works, for example Cloudinary or Bunny Stream.

> Music: a reel that uses a song from Instagram's music library is licensed for Instagram only. For the website, use a version with music you have rights to (royalty-free or commissioned), or keep it muted.

**Full-screen viewer:** "▶ Watch them all", the ⤢ button on any card and the wedding constellation all open a story-style viewer. Swipe, tap the sides or use the arrow keys to move between reels. Video files advance automatically.

## 6b. Optional: newest Instagram posts appear automatically

Without this, the site shows the reels listed in the Sheet, which is fully under your control. With it, your 6 newest posts also appear at the top, labelled *Latest*.

1. The Instagram account must be a **Professional** account (Business or Creator).
2. In Meta for Developers, create an app → add **Instagram API with Instagram Login** → generate a long-lived access token for the account.
3. In the Sheet: **Shooting Stars → Connect Instagram** → paste the token.

The token is refreshed automatically every week.

## 7. Admin

Go to `yourdomain.com/admin` and sign in with the admin key. It has:
- **Overview:** today's enquiries, how many are past their callback deadline, Super Urgent shoots, and where enquiries come from (Instagram, Google, the mini game, a caught-star wish, …).
- **Enquiries, Job applications, Freelance network:** search, full details, and **Download CSV**.
- **Reels:** add, hide, feature or remove.
- **Job openings:** add or edit, and switch them on or off.
- **Settings.**

To change the key, use **Shooting Stars → Make a new admin key** in the Sheet. Anyone with edit access to the Sheet can see the key, so share the Sheet carefully.

## 8. The fun parts (and how to tune them)

- **A sky full of shooting stars:** every page has a steady stream of them, some silver and some in soft violet, sky-blue, rose or mint, plus a small meteor shower every 10–20 seconds. The stars drift slightly as you scroll. To tune it, change `nextMeteor` (how often) and `TINTS` (colours) in `site.js`.
- **Catch a shooting star, anywhere:** click or tap a passing shooting star to catch it, and a counter appears. Catch 3 and a meteor shower plays, with a "Make a wish" card that leads to *Start a project*. A small hint tells first-time visitors they can try.
- **Mini game, "Catch a shooting star"** (home page): 20 seconds to tap as many falling stars as possible. Each star is a moment you film (Haldi, Matchday, Store launch…), and a rare silver Supernova is worth 5. Quick catches build a combo. The visitor ends with a rank (Stargazer → Rising star → Shooting star → Supernova), can share a 1080×1920 story image of their score, and gets a "Book your moment" button. It remembers their best score, has optional sound, and works with touch, mouse or the keyboard (Space).
- **Wedding constellation** (wedding shoots page only): each ceremony is a star. Tap one to play it, then swipe through the whole wedding.
- **Small touches:** headlines shimmer softly, sparkles pop out of buttons on hover, cards tilt towards the mouse, a coloured stardust trail follows the cursor on desktop, a star travels down the edge of the page as you scroll, and the logo is "written" by a passing star once per visit.
- **Easter egg:** type `wish` anywhere for a meteor shower.

People who have turned on "reduce motion" on their device get a calm, still sky.

## 9. Logo and font

- **Headlines** use **Bodoni Moda**, the logo's letterform. **Everything you read** (paragraphs, buttons, forms, menus) uses **Inter**, which stays clear at small sizes. Both fonts are free (SIL Open Font Licence) and served from the site itself.
- **Colours:** black and silver, with four soft accents used sparingly: violet for the fun bits, sky-blue for Marketing Labs, rose for Films and mint for Careers. They're defined at the top of `assets/css/site.css`.

- `assets/brand/` holds the logo, redrawn as **vector outlines**: crisp at any size, 7 KB instead of a blurry 150 px picture. There are stacked and horizontal versions in white and black, a version with "MEDIA", a round Instagram avatar (`instagram-avatar-1080.png`), app icons, a favicon and the social share image (`og-image.jpg`).
- The logo letters are drawn from **Bodoni Moda Black Italic**, the closest open-licence match to the existing Instagram logo. If you have the original logo file or font, send it over: the wordmark can be redrawn exactly with `tools/make_logo.py`.

## 10. Before launch — checklist

- [ ] `config.js`: `API_URL`, `WHATSAPP`, `EMAIL`
- [ ] Settings tab: team emails
- [ ] Replace `YOUR-DOMAIN` in `robots.txt` and `sitemap.xml`
- [ ] Fill in the bracketed details on `privacy.html`, and have it checked by your legal adviser
- [ ] Export your best reels (especially the six Instagram blocks) and add them as video files (section 6)
- [ ] Labs example projects (`data.js` → `labWork`, `projects`) are marked as illustrative. Replace them with approved client work when you have it.
- [ ] Send a test enquiry from a phone, then check the Sheet, the email and the admin

## 11. Tests

```bash
npm run test:backend          # 41 checks of the backend rules, using a simulated Google environment
npm install && npx playwright install chromium
npm run serve & npm run test:site   # 44 checks of forms, reels, the viewer, the game, the constellation and admin
```

Instagram reels need to be public; collab posts work too. Some privacy browser extensions block Instagram's player, which is another reason to use video files for your best reels.
