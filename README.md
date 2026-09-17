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

The odd filename is intentional obscurity, not real security — it just
keeps the page from being guessable or indexed by search engines
(robots.txt also blocks it). There's also a password screen in front of
the tool, currently set to "echo-craft-2026" — but be aware this is a
speed bump only: anyone who opens their browser's dev tools can bypass it.
The actual protection is your GitHub token, which nobody else has.

To change the password: generate a new SHA-256 hash of your chosen
password (e.g. using an online SHA-256 tool, or `shasum -a 256` in a
terminal) and replace the `GATE_HASH` constant near the top of the
`<script>` section in admin-ee92c785.html.

To use the tool itself: generate a GitHub personal access token
(github.com → Settings → Developer settings → Personal access tokens),
scoped to just this one repo with read/write access to "Contents." Paste
it into the admin page along with the owner (EchocraftLLC) and repo name
(echo-craft-site) — both are pre-filled — and click Connect. The token is
stored only in that browser's local storage; use "Forget token" when done
on a shared computer.

If you rename this file again later, remember to also update the path in
robots.txt.
