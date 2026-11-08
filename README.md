# Echocraft site

Static site for echocraftllc.com — plain HTML/CSS/JS, no build step.

- index.html  — home page (hero + portfolio galleries)
- about.html  — about page
- book.html   — booking / contact page
- css/style.css, js/main.js
- images/     — see images/README.md for where photos go
- CNAME       — tells GitHub Pages to serve this repo at echocraftllc.com

## Before you go live
1. Add your photos (see images/README.md).
2. The contact form on book.html is already wired to your Formspree endpoint
   (xjykbwgo) via the AJAX integration, so submissions email you directly
   without leaving the page.
3. Optionally embed a live scheduler in book.html's `.scheduler-embed` box
   (Google Calendar Appointment Schedule, or Cal.com — both free).
4. Double check your Formspree dashboard's notification email is set to
   wherever you want inquiries to land.

## Adding photos (the easy way)
1. On GitHub, open the folder for the category (`images/portrait`, `fashion`,
   `event` or `maternity`), click **Add file > Upload files**, drag your photos
   in, and click **Commit changes**.
2. Wait about a minute. A GitHub Action (`.github/workflows/gallery.yml`)
   resizes the photos and refreshes `images/gallery.json`, and they appear
   under that category's **View more** button.

Notes:
- The six featured photos per category (`portrait-01` to `portrait-06`, etc.)
  stay in the main grid and are swapped from the admin page.
- Any other file name works. Photos show in alphabetical order.
- To remove a photo, delete it from the folder; the list updates itself.
- The action only runs on the `main` branch.
- To run it by hand: **Actions > Update gallery > Run workflow**.

## Online booking and payments
`js/site-config.js` has two empty links, `schedulerUrl` and `paymentUrl`. Once you
have a scheduling page (Cal.com, Google Calendar appointment page) and a payment
link (Stripe, Square, PayPal, Pixieset), paste them between the quotes. The
"Ready to lock in your date?" box on book.html appears automatically when at
least one is filled in, and stays hidden otherwise.

## Mini sessions
mini-sessions.html is a holiday booking page. The dates people can choose live in
`js/site-config.js` (`holidayMinis`, one line per date: the day as YYYY-MM-DD and the words visitors
see). A date disappears from the page by itself once that day has passed; delete its line to take it
away sooner, for example when it fills up.

While at least one future date is listed, the home page button reads "Holiday minis", the page asks
visitors to pick a date, and each request arrives by email labeled "Holiday mini session request"
with the chosen date. When no future dates are left, the home page button reads "Minis" and the page
offers a "notify me when dates open" form, labeled "Mini-session notify list". When you announce new
dates, email the people on that list from your inbox.

## Photo previews
The gallery script also makes small 800px previews in `images/thumbs/` so grids
load fast on phones. They are rebuilt automatically; don't edit them by hand.

## Cue: lighting setups
`cue/lighting.js` is the lighting planner inside Cue. It is one self-contained file, switched on by a
single line near the end of `cue/index.html`: `<script src="lighting.js"></script>`. It adds the
"Lighting setups" tile to Cue's home screen and the page behind it. Everything runs on the device.
If Cue's main page is ever rebuilt from its source, add that one line back and the tool returns.

The people in the camera view are real 3D models stored in `cue/lighting-people.bin` (a woman in her
mid-30s, a man for couples and groups, and an expecting mother). They are built from MakeHuman's
public-domain (CC0) body by `scripts/build_cue_people.py`, which also makes the hair and clothes.
To rebuild them, see the instructions at the top of that script. The file only downloads when
someone opens the lighting planner.

## Admin page (admin-ee92c785.html)
A DIY editor at yoursite.com/admin-ee92c785.html lets you update page text,
colors, fonts, and photos (including crop/fit) without touching GitHub's
file interface directly. It saves by committing straight to this repo via
the GitHub API — no server, no subscription.

This page is protected by Cloudflare Access: echocraftllc.com's DNS was
migrated to Cloudflare specifically so a real, server-side login (via your
Cloudflare account) is required before the page is even served. This
replaced an earlier client-side password gate, which was only a cosmetic
speed bump — the Cloudflare Access setup is genuine authentication.

To manage who can access it: log into the Cloudflare dashboard →
Access controls → Applications → the app covering admin-ee92c785.html →
Policies, and edit the "Include: Emails" rule to add or remove allowed
accounts.

The odd filename (instead of plain admin.html) is a secondary, minor bit
of obscurity on top of that — not load-bearing, but keeps the page from
being guessable or indexed by search engines (robots.txt also blocks it).

To use the tool itself: generate a GitHub personal access token
(github.com → Settings → Developer settings → Personal access tokens),
scoped to just this one repo with read/write access to "Contents." Paste
it into the admin page along with the owner (EchocraftLLC) and repo name
(echo-craft-site) — both are pre-filled — and click Connect. The token is
stored only in that browser's local storage; use "Forget token" when done
on a shared computer.

If you ever rename admin-ee92c785.html to something else, remember to
update both robots.txt and the Cloudflare Access application's path
setting to match.
