Echo Craft site
Static site for echocraftllc.com — plain HTML/CSS/JS, no build step.
index.html  — home page (hero + portfolio galleries)
about.html  — about page
book.html   — booking / contact page
css/style.css, js/main.js
images/     — see images/README.md for where photos go
CNAME       — tells GitHub Pages to serve this repo at echocraftllc.com
Before you go live
Add your photos (see images/README.md).
The contact form on book.html is already wired to your Formspree endpoint
(xjykbwgo) via the AJAX integration, so submissions email you directly
without leaving the page.
Optionally embed a live scheduler in book.html's `.scheduler-embed` box
(Google Calendar Appointment Schedule, or Cal.com — both free).
Double check your Formspree dashboard's notification email is set to
wherever you want inquiries to land.
Admin page (admin.html)
A DIY editor at yoursite.com/admin.html lets you update page text and swap
photos without touching GitHub's file interface directly. It saves by
committing straight to this repo via the GitHub API — no server, no
subscription.
To use it: generate a GitHub personal access token (github.com → Settings →
Developer settings → Personal access tokens), scoped to just this one repo
with read/write access to "Contents." Paste it into the admin page along
with the owner (EchocraftLLC) and repo name (echo-craft-site) — both are
pre-filled — and click Connect. The token is stored only in that browser's
local storage; use "Forget token" when done on a shared computer.
It isn't linked from the site's navigation on purpose. `robots.txt` also
tells search engines not to index it. Neither of these is real security —
the token requirement is what actually protects it — but both keep it out
of casual view.
