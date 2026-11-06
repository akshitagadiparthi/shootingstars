# Shooting Stars Media — website

Black, silver and the logo's own typeface. Real reels playing live from Instagram. Every enquiry lands in a Google Sheet.

- **Website:** plain HTML, CSS and JavaScript. No build step and no framework, so it can be hosted anywhere.
- **Backend:** one Google Apps Script attached to one Google Sheet. It is free and needs no server.
- **Admin:** `/admin` — a private dashboard for enquiries, reels, job openings and settings.

---

## 1. What's in the box

```
index.html            Home: hero reel, divisions, reels rail, wedding constellation, Reach Game
labs.html             Marketing Labs
films.html            Shooting Stars Films: reels wall, packages, constellation, occasions
work.html             Our Work: all reels + example projects
service.html          One Labs service      (?s=brand-identity, websites, …)
industries.html       Industries list
industry.html         One industry          (?i=healthcare, startups-and-emerging-businesses, …)
shoot.html            One shoot occasion    (?t=weddings-and-functions, sports-leagues, …)
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
assets/js/site.js     Header, footer, night sky, shooting stars, live content loader
assets/js/reels.js    Instagram embeds, reels wall, rails, wedding constellation
assets/js/game.js     The Reach Game ("Launch your star")
assets/js/forms.js    All four forms
assets/js/pages.js    Page-specific rendering
assets/css/site.css   All styles
assets/fonts/         Bodoni Moda (self-hosted, SIL Open Font Licence)
assets/brand/         The rebuilt logo, icons, Instagram avatar, share image

backend/apps-script/  Code.gs + appsscript.json → paste into Google Apps Script
tests/                Automated checks (backend rules, forms, game, admin)
tools/                Scripts that regenerate the logo files and icons
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
| Add a wedding ceremony to the constellation | Category `weddings` + fill *Chapter* (Engagement, Bride to be, Pasupu, Haldi, Mehendi, Sangeeth, Pellikoduku, or a new one) |
| Use your own cover image for a reel | Put an image URL in *Poster image URL*. Visitors see your frame and tap to play. |
| Change a package or price | **Packages** tab (one row per package; features one per line) |
| Publish a job opening | Admin → Job openings, or the **Jobs** tab → tick *Active* |
| Change priority days or emails | Admin → Settings, or the **Settings** tab |

Reel categories: `featured, weddings, sports, store, brand, automotive, movies, photography, celebrations, realestate, corporate`.

Text on the pages (headlines and descriptions) lives in the HTML files and in `assets/js/data.js`.

## 6. Optional: newest Instagram posts appear automatically

Without this, the site shows the reels listed in the Sheet, which is fully under your control. With it, your 6 newest posts also appear at the top, labelled *Latest*.

1. The Instagram account must be a **Professional** account (Business or Creator).
2. In Meta for Developers, create an app → add **Instagram API with Instagram Login** → generate a long-lived access token for the account.
3. In the Sheet: **Shooting Stars → Connect Instagram** → paste the token.

The token is refreshed automatically every week.

## 7. Admin

Go to `yourdomain.com/admin` and sign in with the admin key. It has:
- **Overview:** today's enquiries, how many are past their callback deadline, Super Urgent shoots, and where enquiries come from (Instagram, Google, the Reach Game, …).
- **Enquiries, Job applications, Freelance network:** search, full details, and **Download CSV**.
- **Reels:** add, hide, feature or remove.
- **Job openings:** add or edit, and switch them on or off.
- **Settings.**

To change the key, use **Shooting Stars → Make a new admin key** in the Sheet. Anyone with edit access to the Sheet can see the key, so share the Sheet carefully.

## 8. The fun parts (and how to tune them)

- **Night sky:** the twinkling stars and the shooting stars that cross every page are in `site.js` (`spawnMeteor`).
- **Stardust cursor:** on desktop, a faint trail follows the pointer.
- **Scroll meteor:** a star on the right edge travels down as you read.
- **Logo intro:** the logo is "written" by a passing star, once per visit.
- **Star burst** when a form is sent, or when a constellation star is tapped.
- **Wedding constellation:** each ceremony is a star; tap one to play its reel.
- **The Reach Game:** "Launch your star". Visitors pick a moment and add services, and the star climbs from Spark → Rising star → Shooting star → Supernova. They can share the result as a 1080×1920 story image, and their picks pre-fill the enquiry form.
  ⚠️ The multipliers in `game.js` (`MOMENTS`, `BOOSTS`) are **example values**, and the game says so on screen. Replace them with averages from your own past campaigns before you promote the game.
- **Easter egg:** type `wish` anywhere on the site for a meteor shower.

People who have turned on "reduce motion" on their device get a calm, still sky.

## 9. Logo and font

- `assets/brand/` holds the logo, redrawn as **vector outlines**: crisp at any size, 7 KB instead of a blurry 150 px picture. There are stacked and horizontal versions in white and black, a version with "MEDIA", a round Instagram avatar (`instagram-avatar-1080.png`), app icons, a favicon and the social share image (`og-image.jpg`).
- The letters are drawn from **Bodoni Moda Black Italic**, the closest open-licence match to the existing Instagram logo. The whole site uses the same family. If you have the original logo file or font, send it over: the wordmark can be redrawn exactly with `tools/make_logo.py`, and the font swapped in with one line in `site.css`.

## 10. Before launch — checklist

- [ ] `config.js`: `API_URL`, `WHATSAPP`, `EMAIL`
- [ ] Settings tab: team emails
- [ ] Replace `YOUR-DOMAIN` in `robots.txt` and `sitemap.xml`
- [ ] Fill in the bracketed details on `privacy.html`, and have it checked by your legal adviser
- [ ] Reach Game: replace the example multipliers with your real numbers
- [ ] Labs example projects (`data.js` → `labWork`, `projects`) are marked as illustrative. Replace them with approved client work when you have it.
- [ ] Send a test enquiry from a phone, then check the Sheet, the email and the admin

## 11. Tests

```bash
npm run test:backend          # 37 checks of the backend rules, using a simulated Google environment
npm install && npx playwright install chromium
npm run serve & npm run test:site   # 34 checks of forms, live content, the game and admin
```

Reels are embedded from Instagram, so they need public posts. Collab posts work too. Some privacy browser extensions block Instagram embeds; those visitors see a "Watch on Instagram" button instead.
