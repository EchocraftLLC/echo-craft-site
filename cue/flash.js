/* Cue flash photography.
   A guide to camera-mounted flash (speedlights) in six short tabs, two small calculators,
   and links into the lighting planner so each technique can be seen on a face.
   Self-contained: loaded after the main app script (and after lighting.js), it adds one view ("flash") and one home tile. */
(function () {
"use strict";
if (typeof VIEWS === "undefined" || typeof ic === "undefined" || typeof store === "undefined") return;

const TABS = [["basics", "Basics"], ["modes", "TTL or manual"], ["bounce", "Bounce"], ["sync", "Sync & HSS"], ["creative", "Creative"], ["fix", "Fix it"]];
const POWERS = ["1/1", "1/2", "1/4", "1/8", "1/16", "1/32", "1/64", "1/128"];
const SHUTTERS = [60, 125, 160, 200, 250, 320, 500, 1000, 2000, 4000, 8000];
const SYNCS = [[160, "1/160"], [200, "1/200"], [250, "1/250"]];

let FL = (() => { const s = store.get("flash", null); return Object.assign({ tab: "basics", pow: 3, d1: 6, d2: 10, sh: 500, sync: 200 }, s || {}); })();
const save = () => store.set("flash", FL);

// ---------------------------------------------------------------- small drawings (stroke uses the theme's ink color)
const svg = (vb, body, label) => `<svg class="fl-svg" viewBox="${vb}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const ANATOMY = svg("0 0 340 186", `
  <g class="fl-ln">
    <rect x="118" y="22" width="84" height="54" rx="8"/><rect x="124" y="28" width="72" height="34" rx="4" class="fl-glow"/>
    <path d="M128 22l6-14h52l6 14" /><rect x="134" y="80" width="52" height="74" rx="6"/>
    <rect x="142" y="92" width="22" height="16" rx="2" class="fl-red"/><rect x="168" y="118" width="12" height="28" rx="2"/>
    <rect x="146" y="158" width="28" height="8" rx="2"/><rect x="140" y="168" width="40" height="8" rx="2"/>
    <path d="M118 49h-30M134 100h-46M140 172h-52M210 38h28M186 132h52M196 8h42M160 82v-4"/>
  </g>
  <g class="fl-tx">
    <text x="84" y="53" text-anchor="end">Flash head</text><text x="84" y="104" text-anchor="end">Wireless sensor</text>
    <text x="84" y="176" text-anchor="end">Hot shoe + lock</text><text x="242" y="42">Tilts &amp; swivels</text>
    <text x="242" y="136">Battery door</text><text x="242" y="12">Bounce card</text>
    <text x="242" y="26" class="fl-dim">and wide panel</text>
  </g>`, "A speedlight: the flash head, which tilts and swivels, a pull-out bounce card, a wireless sensor, a battery door, and the hot shoe foot with a lock.");

const bouncePanel = (x, title, path, tone) => `
  <g transform="translate(${x} 0)">
    <text x="50" y="14" text-anchor="middle" class="fl-tx fl-b ${tone}">${title}</text>
    <rect x="6" y="26" width="88" height="96" rx="4" class="fl-room"/>
    <circle cx="70" cy="74" r="7" class="fl-ln"/><path d="M70 81v22M62 90h16" class="fl-ln"/>
    <rect x="16" y="78" width="12" height="16" rx="2" class="fl-ln"/>
    ${path}
  </g>`;
const BOUNCE = svg("0 0 320 130",
  bouncePanel(0, "Direct", `<path d="M30 82L62 78M30 86L62 88" class="fl-ray"/><path d="M80 66h12v40h-12" class="fl-shadow"/>`, "fl-bad") +
  bouncePanel(108, "Ceiling", `<path d="M24 78L40 30L66 64M24 78L56 30L72 64" class="fl-ray"/><path d="M6 28h88" class="fl-surface"/>`, "fl-good") +
  bouncePanel(216, "Side wall", `<path d="M26 82L10 50L62 70M26 82L10 100L62 78" class="fl-ray"/><path d="M8 28v94" class="fl-surface"/>`, "fl-good"),
  "Three ways to aim a flash: straight at your client (hard light and a shadow behind them), up at the ceiling (soft light from above), and at a side wall (soft light from one side).");

const CURTAINS = svg("0 0 320 120", `
  <g class="fl-tx"><text x="10" y="18">First curtain</text><text x="10" y="78">Rear curtain</text></g>
  <g class="fl-ln">
    <rect x="10" y="26" width="300" height="22" rx="4"/><rect x="10" y="86" width="300" height="22" rx="4"/>
  </g>
  <rect x="14" y="30" width="16" height="14" rx="2" class="fl-glow"/><path d="M40 37h250" class="fl-trail"/>
  <rect x="290" y="90" width="16" height="14" rx="2" class="fl-glow"/><path d="M30 97h250" class="fl-trail"/>
  <g class="fl-tx fl-dim"><text x="160" y="62" text-anchor="middle">flash at the start: the blur ends up in front</text><text x="160" y="120" text-anchor="middle">flash at the end: the blur trails behind</text></g>`,
  "Timeline of a long exposure. First-curtain sync fires the flash at the start, so the motion blur lands in front of the subject. Rear-curtain sync fires at the end, so the blur trails behind.");

// ---------------------------------------------------------------- the calculators
function powerOut() {
  const stops = 2 * Math.log2(FL.d2 / FL.d1), idx = Math.round(FL.pow - stops);
  const word = Math.abs(stops) < 0.05 ? "The same power." : `${Math.abs(Math.round(stops * 3) / 3)} stop${Math.abs(stops) > 1.05 ? "s" : ""} ${stops > 0 ? "more" : "less"} light needed.`;
  let set;
  if (idx < 0) set = `That's more than full power. Open your aperture ${Math.round(-idx)} stop${-idx > 1 ? "s" : ""}, raise ISO, or move the flash closer.`;
  else if (idx > 7) set = "That's below 1/128. Close your aperture or lower ISO instead.";
  else set = `Set the flash to <b>${POWERS[idx]}</b>${Math.abs(stops - Math.round(stops)) > 0.2 ? " (round to the nearest step, or fine-tune with thirds)" : ""}.`;
  return `<p>${word} ${set}</p><p class="small muted">Light falls off with the square of distance: twice as far needs four times the power (two stops).</p>`;
}
function syncOut() {
  if (FL.sh <= FL.sync) return `<p class="fl-ok"><b>Fine:</b> 1/${FL.sh} s is at or below your sync speed, so the whole frame gets the flash at full strength.</p>`;
  return `<p class="fl-warn"><b>Black band:</b> at 1/${FL.sh} s the second curtain is already closing when the flash fires, so part of the frame stays dark.</p>
    <p class="small">Fix it: turn on <b>high-speed sync</b> (HSS), or slow down to 1/${FL.sync} s and close the aperture or use an ND filter for the brightness. HSS costs roughly 1 to 2 stops of flash power and drains the batteries faster.</p>`;
}

// ---------------------------------------------------------------- the tabs
const tryIt = (id, text) => `<button class="ghline" data-fl-try="${id}">${ic("light")}<span>${text}</span></button>`;
const card = (title, body) => `<section class="card"><h3>${title}</h3>${body}</section>`;
const ul = (items) => `<ul>${items.map((t) => `<li>${t}</li>`).join("")}</ul>`;

const PAGES = {
  basics: () => card("What a speedlight is", `${ANATOMY}
      <p>A speedlight is a small flash that slides into your camera's hot shoe. It's far stronger than a pop-up flash, and its head tilts and swivels, which is the whole secret: you can aim it at a wall or ceiling instead of at your client.</p>`)
    + card("Why it beats the built-in flash", ul([
      "<b>Power and reach:</b> it lights people across a room, and it still has enough left over to bounce.",
      "<b>Direction:</b> tilt and swivel the head to bounce off walls and ceilings for soft, natural light.",
      "<b>Speed:</b> it recycles quickly, so you can keep shooting through a first kiss or a toast."]))
    + card("Starter settings for events", ul([
      "Mode: TTL, with flash compensation at 0 to +0.7 when bouncing.",
      "Camera: manual, 1/125 s, f/4, ISO 800 to 1600. Shutter and ISO set the room; the flash lights the people.",
      "Head: tilted up toward the ceiling or turned toward a pale wall, bounce card out."])),

  modes: () => card("TTL: the automatic one", `<p>The flash fires a quick, invisible pre-flash, the camera measures it through the lens, and sets the power for you.</p>
      ${ul(["Best for events, weddings and candids, where the distance to your client keeps changing.",
        "Fine-tune with <b>flash exposure compensation</b> (FEC): + for brighter, − for darker.",
        "It can be fooled: a white dress or a bright wall makes it underexpose, dark suits overexpose. Correct with FEC."])}`)
    + card("Manual: the consistent one", `<p>You choose the power, from full (1/1) down to 1/128. Each step halves the light, which is one stop.</p>
      ${ul(["Best for portraits, studio and off-camera flash, where you and your client stay put.",
        "Every frame comes out the same, which makes editing faster.",
        "If your client moves, the exposure changes. Use the calculator below."])}`)
    + card("Calculator: new distance, new power", `
      <div class="lbl">Flash power now</div>${chips("fl-pow", String(FL.pow), POWERS.map((p, i) => [String(i), p]))}
      <div class="lt-sl"><div class="lt-slh"><label class="lbl" for="fl-d1">Distance now</label><b class="lt-o" id="fl-o-d1">${FL.d1} ft</b></div><input class="range" id="fl-d1" data-fl-s="d1" type="range" min="2" max="30" step="1" value="${FL.d1}"></div>
      <div class="lt-sl"><div class="lt-slh"><label class="lbl" for="fl-d2">New distance</label><b class="lt-o" id="fl-o-d2">${FL.d2} ft</b></div><input class="range" id="fl-d2" data-fl-s="d2" type="range" min="2" max="30" step="1" value="${FL.d2}"></div>
      <div id="fl-power">${powerOut()}</div>`),

  bounce: () => card("Where to point the flash", `${BOUNCE}
      ${ul(["<b>Direct</b> (straight at your client): hard light, shiny skin, red-eye and a dark shadow on the wall behind. Avoid it when you can.",
        "<b>Ceiling</b> (head tilted 45° to 75°): the ceiling becomes a big, soft light. Pull out the bounce card to put a little light in the eyes.",
        "<b>Side wall</b> (head swiveled toward a wall): soft light from one side, like a window. The most flattering of the three."])}`)
    + card("Getting bounce right", ul([
      "Bounce off white or neutral surfaces. A red wall makes red light.",
      "High or dark ceilings swallow the light: raise ISO, open up, or bounce off a nearby wall instead.",
      "Aim so the light comes back down in front of your client, not on top of their head, or the eyes go dark.",
      "Try bouncing behind you, over your shoulder: it makes a huge, soft light from the front."]))
    + tryIt("bounce", "See ceiling bounce in the lighting planner") + tryIt("sidebounce", "See side-wall bounce in the lighting planner") + tryIt("direct", "See direct flash in the lighting planner"),

  sync: () => card("The sync speed limit", `<p>The shutter is two curtains. At slow speeds the first opens fully, the flash fires, then the second closes. Above the camera's <b>sync speed</b> (usually 1/160 to 1/250 s) the second curtain starts closing before the first has finished opening, so only a slit is open when the flash fires. The result: a dark band across the photo.</p>`)
    + card("High-speed sync (HSS)", `<p>In HSS the flash pulses very fast for the whole exposure, acting like a continuous light, so you can shoot up to 1/8000 s.</p>
      ${ul(["Use it outdoors to shoot wide open (f/1.4 to f/2.8) in bright light, or to freeze fast action.",
        "It costs about 1 to 2 stops of power, so the flash reaches less far.",
        "It drains batteries faster and the flash heats up sooner."])}`)
    + card("Will it sync?", `
      <div class="lbl">Your camera's sync speed</div>${chips("fl-sync", String(FL.sync), SYNCS.map(([v, t]) => [String(v), t + " s"]))}
      <div class="lbl">Shutter speed</div>${chips("fl-sh", String(FL.sh), SHUTTERS.map((v) => [String(v), "1/" + v]))}
      <div id="fl-sync-out">${syncOut()}</div>
      <p class="small muted">Electronic or silent shutter modes often can't fire a flash at all. Switch to the mechanical shutter.</p>`),

  creative: () => card("First or rear curtain", `${CURTAINS}
      <p>This matters with slow shutter speeds and moving subjects. <b>First curtain</b> (the default) fires the flash at the start, so the blur ends up in front of your subject, as if they were moving backwards. <b>Rear curtain</b> fires at the end, so the blur trails behind, which looks natural. Use rear curtain for dancers, sparklers and cars.</p>`)
    + card("Dragging the shutter", `<p>Your <b>shutter speed</b> sets how bright the room or background is. Your <b>flash, aperture and ISO</b> set how bright your client is. Slow down to 1/30 or 1/15 s to bring in warm room light or string lights, and let the flash freeze the faces.</p>`)
    + card("Fill flash outdoors", `<p>On bright days or with the sun behind your client, a little flash lifts dark eye sockets and shadowed faces. Set FEC to −1 to −2 so it reads as a lift, not a spotlight. At sunset, add a ½ CTO (orange) gel so the flash matches the warm light.</p>`)
    + card("The zoom head", `<p>Inside the flash head the tube moves back and forth. A wide setting (24mm) spreads the light; a long setting (105mm or more) throws a narrow beam further. When bouncing, zoom wide for a bigger, softer patch. For a punchy spotlight, zoom long.</p>`)
    + tryIt("fillflash", "See fill flash at sunset in the lighting planner"),

  fix: () => card("Flash not firing?", ul([
      "Push the foot all the way into the hot shoe and lock it.",
      "Wipe the metal contacts on the flash foot and the camera shoe.",
      "Turn off silent or electronic shutter, and check the flash is enabled in the camera menu.",
      "A warning light or slowdown can mean it's overheated. Let it rest for a few minutes."]))
    + card("Dark band across the photo?", ul([
      "Your shutter is faster than the sync speed. Slow it to 1/200 s, or turn on high-speed sync.",
      "Using a trigger? Some only do HSS when they're set to it."]))
    + card("Other common problems", ul([
      "<b>Red-eye:</b> bounce the flash or move it off the camera. Light that comes from right beside the lens causes it.",
      "<b>Orange or green faces:</b> the room's light is a different color. Gel the flash (CTO for tungsten bulbs) or set white balance to match.",
      "<b>Front row bright, back row dark:</b> bounce, and step back so everyone is a similar distance from the flash.",
      "<b>Hard shadow on the wall:</b> move your client away from the wall, or bounce."]))
    + card("Care and safety", ul([
      "Carry spare batteries. Rechargeable NiMH AAs recycle faster than alkaline.",
      "Take the batteries out for storage to avoid corrosion.",
      "Keep it out of heavy rain, and don't touch the flash window after rapid firing: it gets hot.",
      "Never fire a flash right next to someone's eyes, especially a baby's. Bounce it instead."]))
};

VIEWS.flash = { title: "Flash photography", render() {
  const tab = PAGES[FL.tab] ? FL.tab : "basics";
  return `<div class="fl-root">
    <div><h2>Flash photography</h2><p class="muted small" style="margin-top:6px">How to use a camera-mounted flash so it looks like good natural light, not like a flash.</p></div>
    ${chips("fl-tab", tab, TABS)}
    ${PAGES[tab]()}
  </div>`;
} };

// ---------------------------------------------------------------- events
const appEl = document.getElementById("app");
appEl.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("button"); if (!b || !document.querySelector(".fl-root")) return;
  const d = b.dataset;
  if (d.flTab) { FL.tab = d.flTab; save(); render(); window.scrollTo(0, 0); return; }
  if (d.flPow) { FL.pow = Number(d.flPow); save(); return render(); }
  if (d.flSync) { FL.sync = Number(d.flSync); save(); return render(); }
  if (d.flSh) { FL.sh = Number(d.flSh); save(); return render(); }
  if (d.flTry) { if (window.CueLighting && window.CueLighting.open) window.CueLighting.open(d.flTry); else go("lighting"); }
});
appEl.addEventListener("input", (e) => {
  const k = e.target.dataset && e.target.dataset.flS; if (!k) return;
  FL[k] = Number(e.target.value); save();
  const o = document.getElementById("fl-o-" + k); if (o) o.textContent = FL[k] + " ft";
  const out = document.getElementById("fl-power"); if (out) out.innerHTML = powerOut();
});

// ---------------------------------------------------------------- home tile and styles
ICON.flash = '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>';
const homeRender = VIEWS.home.render;
VIEWS.home.render = function () {
  const html = homeRender.apply(this, arguments), t = tile("flash", "flash", "Flash photography", "Bounce, TTL, sync speed and fixes");
  return html.indexOf('data-go="flash"') > -1 ? html : html.replace('<button class="tile" data-go="tools">', t + '<button class="tile" data-go="tools">');
};
const css = document.createElement("style");
css.textContent = `
.fl-root { display: grid; gap: 14px; }
.fl-root .card ul { margin: 6px 0 0; padding-left: 20px; display: grid; gap: 6px; }
.fl-svg { width: 100%; max-width: 420px; display: block; margin: 4px auto 10px; }
.fl-ln { fill: none; stroke: var(--ink); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.fl-tx { fill: var(--ink); font: 500 11px var(--sans); }
.fl-dim { fill: var(--muted); font-weight: 400; }
.fl-b { font-weight: 700; font-size: 12px; }
.fl-bad { fill: #c4513a; } .fl-good { fill: #2f8f6b; }
.fl-glow { fill: #f4d27a; stroke: var(--ink); stroke-width: 1.2; }
.fl-red { fill: #7a2a2a; stroke: var(--ink); stroke-width: 1.2; }
.fl-room { fill: var(--bg); stroke: var(--line); stroke-width: 1.2; }
.fl-ray { fill: none; stroke: #e3a24a; stroke-width: 1.6; stroke-dasharray: 3 2; }
.fl-surface { stroke: var(--ink); stroke-width: 3; }
.fl-shadow { fill: var(--muted); opacity: .35; stroke: none; }
.fl-trail { stroke: var(--muted); stroke-width: 6; stroke-linecap: round; opacity: .45; }
.fl-ok b { color: #2f8f6b; } .fl-warn b { color: #c4513a; }
`;
document.head.appendChild(css);
try { if (typeof view !== "undefined" && view === "home") render(); } catch (e) { /* not ready yet */ }
try {
  let first = location.hash;
  try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.name) first = new URL(nav.name).hash; } catch (e) { /* use the current address */ }
  if (first === "#flash" && typeof clientMode !== "undefined" && !clientMode) go("flash");
} catch (e) { /* fine */ }
})();
