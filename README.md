# Echo Craft site

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
