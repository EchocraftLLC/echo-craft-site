/* Cue flash photography.
   A six-slide guide to camera-mounted flash (speedlights), drawn as dark infographic slides,
   with two small calculators and links into the lighting planner so each technique can be seen on a face.
   Self-contained: loaded after the main app script (and after lighting.js), it adds one view ("flash") and one home tile.
   All the illustrations are drawn here in SVG. */
(function () {
"use strict";
if (typeof VIEWS === "undefined" || typeof ic === "undefined" || typeof store === "undefined") return;

const TABS = [["basics", "The flash"], ["modes", "TTL or manual"], ["bounce", "Bounce"], ["sync", "Sync & HSS"], ["creative", "Creative"], ["fix", "Tips & fixes"]];
const POWERS = ["1/1", "1/2", "1/4", "1/8", "1/16", "1/32", "1/64", "1/128"];
const SHUTTERS = [60, 125, 160, 200, 250, 320, 500, 1000, 2000, 4000, 8000];
const SYNCS = [[160, "1/160"], [200, "1/200"], [250, "1/250"]];

let FL = (() => { const s = store.get("flash", null); return Object.assign({ tab: "basics", pow: 3, d1: 6, d2: 10, sh: 500, sync: 200 }, s || {}); })();
const save = () => store.set("flash", FL);

/* =====================================================================
   Drawing kit (everything sits on the dark slide, so colors are fixed)
   ===================================================================== */
const C = { ink: "#eef2f4", dim: "#9fabb3", body: "#2f373e", body2: "#3b444c", edge: "#59646d", teal: "#5ed3c6", gold: "#f3b65b", coral: "#ec7a5e", glow: "#fff3c4", red: "#8c2f2f", skin: "#e8b796", hair: "#5a3b28", wall: "#d9dde0" };
const svg = (vb, body, label, cls) => `<svg class="fl-svg${cls ? " " + cls : ""}" viewBox="${vb}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const T = (x, y, s, o) => `<text x="${x}" y="${y}" fill="${(o && o.c) || C.ink}" font-size="${(o && o.fs) || 11}" font-weight="${(o && o.fw) || 600}" text-anchor="${(o && o.a) || "start"}">${s}</text>`;

// A speedlight. (x, y) is the middle of the foot; tilt turns the head up (degrees), dir 1 faces right, -1 left.
function speedlight(x, y, s, tilt, dir, glow) {
  const d = dir || 1, k = s || 1;
  return `<g transform="translate(${x} ${y}) scale(${k * d} ${k})">
    <rect x="-13" y="-6" width="26" height="6" rx="1.5" fill="${C.edge}"/>
    <rect x="-16" y="-50" width="32" height="44" rx="5" fill="${C.body}" stroke="${C.edge}"/>
    <rect x="-9" y="-44" width="14" height="11" rx="2" fill="${C.red}"/>
    <g transform="translate(0 -52) rotate(${-(tilt || 0)})">
      <rect x="-18" y="-26" width="44" height="28" rx="5" fill="${C.body2}" stroke="${C.edge}"/>
      <rect x="22" y="-23" width="6" height="22" rx="2" fill="${glow ? C.glow : "#cfd6db"}"/>
      ${glow ? `<circle cx="28" cy="-12" r="16" fill="${C.glow}" opacity=".35"/>` : ""}
    </g></g>`;
}
// A camera body with a lens, seen from the side, facing right (dir 1) or left (-1), with a flash on top.
function camera(x, y, s, dir, flashTilt, glow) {
  const d = dir || 1, k = s || 1;
  return `<g transform="translate(${x} ${y}) scale(${k * d} ${k})">
    <rect x="-28" y="-30" width="56" height="40" rx="6" fill="${C.body}" stroke="${C.edge}"/>
    <rect x="-10" y="-38" width="22" height="9" rx="2" fill="${C.body}" stroke="${C.edge}"/>
    <rect x="28" y="-24" width="20" height="28" rx="3" fill="${C.body2}" stroke="${C.edge}"/>
    <ellipse cx="48" cy="-10" rx="3" ry="12" fill="#5c7f99"/>
    ${speedlight(1, -38, 0.62, flashTilt, 1, glow)}
  </g>`;
}
// A person from the side, facing left (toward a camera on the left) unless dir is -1.
function person(x, y, s, shirt, lit, dir) {
  const k = s || 1, d = dir || 1;
  return `<g transform="translate(${x} ${y}) scale(${k * d} ${k})">
    <path d="M-26 70C-24 40 -14 30 0 30C14 30 24 40 26 70Z" fill="${shirt || C.teal}"/>
    <rect x="-6" y="18" width="12" height="16" rx="5" fill="${C.skin}"/>
    <ellipse cx="0" cy="6" rx="15" ry="18" fill="${C.skin}"/>
    <path d="M-15 4C-16 -14 16 -16 15 2C10 -6 -2 -8 -15 4Z" fill="${C.hair}"/>
    <circle cx="-7" cy="6" r="1.6" fill="#2a2a2a"/>
    ${lit ? `<ellipse cx="-6" cy="6" rx="9" ry="14" fill="#fff" opacity="${lit}"/>` : ""}
  </g>`;
}
const ray = (pts, color, dash) => `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="${dash || "4 3"}" stroke-linecap="round" marker-end="url(#fl-ah-${color.slice(1)})"/>`;
const arrowDefs = () => `<defs>${[C.teal, C.gold, C.coral, C.ink, C.glow].map((c) => `<marker id="fl-ah-${c.slice(1)}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill="${c}"/></marker>`).join("")}</defs>`;
const iconRing = (color, inner) => `<svg class="fl-ico" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" fill="none" stroke="${color}" stroke-width="2.4"/><g fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;

/* =====================================================================
   The illustrations
   ===================================================================== */
const label = (x1, y1, x2, y2, tx, ty, txt, anchor) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${C.teal}" stroke-width="1.4"/><circle cx="${x1}" cy="${y1}" r="2.8" fill="${C.teal}"/>${T(tx, ty, txt, { a: anchor || "start", fs: 12 })}`;
// a speedlight on a camera, from the front, drawn large for labelling
const ANATOMY = svg("0 0 360 290", `
  <path d="M150 20h60l-6 22h-48z" fill="#e9eef1"/>
  <rect x="134" y="42" width="92" height="54" rx="8" fill="${C.body2}" stroke="${C.edge}" stroke-width="1.5"/>
  <rect x="142" y="50" width="76" height="38" rx="4" fill="${C.glow}"/>
  <path d="M142 59h76M142 69h76M142 79h76" stroke="#e7d9a2" stroke-width="1"/>
  <rect x="166" y="96" width="28" height="8" fill="${C.edge}"/>
  <rect x="146" y="104" width="68" height="74" rx="7" fill="${C.body}" stroke="${C.edge}" stroke-width="1.5"/>
  <rect x="158" y="114" width="44" height="22" rx="3" fill="${C.red}"/><circle cx="192" cy="125" r="3" fill="#e05b4b"/>
  <rect x="204" y="142" width="6" height="28" rx="2" fill="${C.body2}" stroke="${C.edge}"/>
  <rect x="152" y="182" width="56" height="9" rx="3" fill="${C.edge}"/>
  <rect x="160" y="191" width="40" height="8" rx="2" fill="#7c8891"/>
  <rect x="70" y="204" width="220" height="78" rx="12" fill="${C.body}" stroke="${C.edge}" stroke-width="1.5"/>
  <rect x="150" y="198" width="60" height="12" rx="3" fill="${C.body}" stroke="${C.edge}"/>
  <circle cx="180" cy="248" r="30" fill="#151a1e" stroke="${C.edge}" stroke-width="2"/><circle cx="180" cy="248" r="20" fill="#2b4a63"/><circle cx="172" cy="241" r="5" fill="#9cc3dc" opacity=".7"/>
  <path d="M232 28c22 4 34 18 36 34" fill="none" stroke="${C.gold}" stroke-width="1.6" stroke-dasharray="3 3"/>
  ${label(164, 30, 112, 22, 106, 26, "Bounce card", "end")}${T(106, 40, "and diffuser", { fs: 11, fw: 400, c: C.dim, a: "end" })}
  ${label(226, 64, 252, 70, 256, 66, "Flash head:")}${T(256, 80, "tilts & swivels", { fs: 11, fw: 400, c: C.dim })}
  ${label(160, 125, 112, 116, 106, 120, "Wireless sensor", "end")}
  ${label(214, 120, 254, 126, 258, 124, "Control panel")}${T(258, 138, "(on the back)", { fs: 11, fw: 400, c: C.dim })}
  ${label(210, 160, 254, 172, 258, 176, "Battery door")}
  ${label(152, 186, 112, 160, 106, 164, "Lock lever", "end")}
  ${label(160, 196, 112, 196, 106, 200, "Hot shoe foot", "end")}`,
  "A speedlight on top of a camera, seen from the front. Labels show the bounce card and diffuser, the flash head that tilts and swivels, the wireless sensor, the control panel on the back, the battery door, the lock lever and the hot shoe foot.");

const TTL_ART = svg("0 0 300 170", `${arrowDefs()}
  <rect x="0" y="0" width="300" height="170" rx="10" fill="#26303a"/>
  <path d="M0 140H300" stroke="#3d4955"/>
  ${person(80, 60, 0.9, C.gold, 0.12, -1)}<path d="M40 112l-16 0M44 120l-12 0" stroke="${C.teal}" stroke-width="2" stroke-linecap="round"/>
  <path d="M210 70L120 52L120 118Z" fill="${C.glow}" opacity=".18"/>
  ${camera(232, 132, 0.95, -1, 0, true)}
  ${ray("150,30 214,58", C.teal, "2 4")}${T(150, 22, "pre-flash measures", { c: C.teal, fs: 10 })}`,
  "TTL: a person walks while the flash fires a quick pre-flash, and the camera measures it to set the power.");
const MANUAL_ART = svg("0 0 300 170", `
  <rect x="0" y="0" width="300" height="170" rx="10" fill="#26303a"/>
  <rect x="96" y="14" width="84" height="120" fill="${C.wall}" opacity=".9"/>
  ${person(138, 58, 0.85, C.gold, 0, 1)}
  ${camera(52, 150, 0.95, 1, 0, true)}
  ${POWERS.map((p, i) => T(268, 24 + i * 18, (i === 3 ? "▸ " : "") + p, { c: i === 3 ? C.gold : C.dim, fs: 11, a: "end" })).join("")}
  <rect x="200" y="10" width="76" height="152" rx="8" fill="none" stroke="#3d4955"/>`,
  "Manual: a portrait in front of a backdrop, and the flash power ladder from 1/1 down to 1/128, with 1/8 picked.");

function bounceArt(kind) {
  const surface = kind === "ceiling" ? `<rect x="10" y="8" width="150" height="10" fill="${C.wall}"/>` : kind === "side" ? `<rect x="150" y="14" width="10" height="150" fill="${C.wall}"/>` : `<rect x="128" y="20" width="32" height="140" fill="${C.wall}" opacity=".85"/><path d="M146 60c10 4 12 40 4 70" fill="#1d242b" opacity=".75"/>`;
  const rays = kind === "ceiling" ? ray("44,96 70,20", C.teal) + ray("70,20 104,60", C.teal) + ray("52,96 96,20", C.teal) + ray("96,20 116,60", C.teal) + `<path d="M24 20H150L120 100H52Z" fill="${C.teal}" opacity=".1"/>`
    : kind === "side" ? ray("58,106 148,60", C.gold) + ray("148,60 116,84", C.gold) + ray("58,112 148,120", C.gold) + ray("148,120 116,96", C.gold) + `<path d="M148 40L148 150L100 100Z" fill="${C.gold}" opacity=".12"/>`
    : ray("62,102 104,90", C.coral, "0") + ray("62,108 104,104", C.coral, "0") + ray("62,114 104,118", C.coral, "0");
  const tilt = kind === "ceiling" ? 70 : 0;
  return svg("0 0 170 170", `${arrowDefs()}<rect x="0" y="0" width="170" height="170" rx="10" fill="#26303a"/>${surface}${rays}
    ${person(118, 70, 0.72, kind === "direct" ? "#7aa7c7" : kind === "ceiling" ? "#7aa7c7" : "#7aa7c7", kind === "direct" ? 0.28 : 0.08, 1)}
    <path d="M40 168V130" stroke="${C.edge}" stroke-width="3"/>${camera(44, 128, 0.7, 1, tilt, true)}`,
    kind === "ceiling" ? "Flash tilted up, bouncing off the ceiling down onto the person." : kind === "side" ? "Flash turned toward a side wall, which bounces soft light onto the person from the side." : "Flash pointed straight at the person, with a hard shadow on the wall behind them.");
}

const CURTAIN_STEPS = svg("0 0 330 120", `
  ${[0, 1, 2].map((i) => {
    const x = 10 + i * 110, open = i === 1;
    return `<g transform="translate(${x} 6)">
      <rect x="0" y="10" width="90" height="62" rx="9" fill="${C.body}" stroke="${C.edge}"/>
      <rect x="14" y="20" width="62" height="42" rx="3" fill="${open ? C.glow : "#141a1f"}" ${open ? 'opacity=".95"' : ""}/>
      ${i === 0 ? `<rect x="14" y="20" width="62" height="26" fill="#3a434b"/><path d="M45 26v12" stroke="${C.gold}" stroke-width="2.5" marker-end="url(#fl-ah-f3b65b)"/>` : ""}
      ${i === 2 ? `<rect x="14" y="20" width="62" height="30" fill="#3a434b"/><path d="M45 26v14" stroke="${C.gold}" stroke-width="2.5" marker-end="url(#fl-ah-f3b65b)"/>` : ""}
      ${T(45, 90, ["1. Curtain opens", "2. Open: flash fires", "3. Curtain closes"][i], { a: "middle", fs: 11, c: C.ink })}
      ${i < 2 ? `<path d="M95 41h12" stroke="${C.gold}" stroke-width="2" marker-end="url(#fl-ah-f3b65b)"/>` : ""}
    </g>`; }).join("")}`.replace("<g", arrowDefs() + "<g"),
  "Three steps of the shutter: the first curtain opens, the frame is fully open while the flash fires, then the second curtain closes.");
const BAND = svg("0 0 120 150", `<rect x="4" y="4" width="112" height="142" rx="4" fill="#f2f4f5"/><rect x="10" y="10" width="100" height="130" fill="#b9c3ca"/>
  ${person(60, 52, 0.95, "#26303a", 0, 1)}<rect x="10" y="96" width="100" height="44" fill="#0c0f12"/>`,
  "A portrait with a black band across the bottom, from shooting faster than the sync speed.", "fl-thumb");
const HSS_ART = svg("0 0 300 120", `${arrowDefs()}
  ${speedlight(54, 104, 1.1, 0, 1, true)}
  <path d="M90 52 L110 52 L118 32 L128 72 L138 32 L148 72 L158 32 L168 72 L178 52 L210 52" fill="none" stroke="${C.teal}" stroke-width="2.4" stroke-linejoin="round"/>
  <rect x="214" y="20" width="76" height="66" rx="8" fill="${C.body}" stroke="${C.edge}"/><rect x="226" y="30" width="52" height="46" rx="3" fill="url(#fl-sensor)"/>
  <defs><linearGradient id="fl-sensor" x1="0" x2="1"><stop offset="0" stop-color="#4fd1c5"/><stop offset=".5" stop-color="#7f8cf0"/><stop offset="1" stop-color="#c88ef0"/></linearGradient></defs>
  ${T(150, 104, "rapid pulses act like continuous light", { a: "middle", fs: 10, c: C.teal })}`,
  "High-speed sync: the flash pulses very quickly, which reaches the whole sensor as the slit travels across it.");
const RUNNER = svg("0 0 120 150", `<rect x="4" y="4" width="112" height="142" rx="4" fill="#f2f4f5"/><rect x="10" y="10" width="100" height="80" fill="#9fd0ec"/><rect x="10" y="90" width="100" height="50" fill="#c9734f"/><path d="M10 104h100M10 120h100" stroke="#e9e3dc"/>
  <g transform="translate(58 46)"><circle cx="0" cy="-20" r="8" fill="#5a3b28"/><path d="M0 -12L-4 14M-4 14L-18 30M-4 14L10 26L4 40M-2 -6L14 4M-2 -6L-16 -2" stroke="#1d2a3a" stroke-width="6" stroke-linecap="round" fill="none"/></g>`,
  "A runner frozen mid-stride in bright daylight, which high-speed sync makes possible.", "fl-thumb");

const carScene = (flashAt) => `<rect x="0" y="0" width="130" height="62" rx="5" fill="#141a20"/><path d="M0 46H130" stroke="#2c3640"/>
  <path d="M${flashAt === "start" ? "60 28H122" : "8 28H70"}" stroke="#d24a3f" stroke-width="3" opacity=".55"/><path d="M${flashAt === "start" ? "60 34H124" : "6 34H70"}" stroke="#f3e2a0" stroke-width="2" opacity=".5"/>
  <g transform="translate(${flashAt === "start" ? 34 : 88} 26)"><path d="M-26 14C-26 4 -18 0 -10 -2L6 -8L20 0L28 4V14Z" fill="#9aa7b1"/><circle cx="-14" cy="15" r="5" fill="#222"/><circle cx="16" cy="15" r="5" fill="#222"/></g>
  <circle cx="${flashAt === "start" ? 34 : 88}" cy="8" r="7" fill="${C.glow}" opacity=".9"/>`;
const CURTAIN_SYNC = svg("0 0 290 150", `
  ${T(0, 12, "First curtain (default)", { c: C.teal, fs: 11 })}${T(150, 12, "Rear curtain", { c: C.gold, fs: 11 })}
  <g transform="translate(0 20)">${carScene("start")}</g><g transform="translate(150 20)">${carScene("end")}</g>
  ${T(0, 100, "Blur shows up ahead:", { fs: 10.5, c: C.ink })}${T(0, 114, "looks like it's", { fs: 10.5, fw: 400, c: C.dim })}${T(0, 128, "driving backwards", { fs: 10.5, fw: 400, c: C.dim })}
  ${T(150, 100, "Blur trails behind:", { fs: 10.5, c: C.ink })}${T(150, 114, "natural sense of", { fs: 10.5, fw: 400, c: C.dim })}${T(150, 128, "speed and motion", { fs: 10.5, fw: 400, c: C.dim })}`,
  "Two long exposures of a moving car. With first-curtain sync the light trails appear ahead of the car; with rear-curtain sync they trail behind it.");
const FILL_ART = svg("0 0 290 120", `
  <defs><radialGradient id="fl-sunset" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#ffe7a8"/><stop offset=".45" stop-color="#f0a35a"/><stop offset="1" stop-color="#5b4a63"/></radialGradient></defs>
  <rect x="0" y="0" width="290" height="120" rx="8" fill="url(#fl-sunset)"/>
  <g transform="translate(70 30)"><path d="M-30 90C-28 54 -16 44 0 44C16 44 28 54 30 90Z" fill="#1b1d22"/><ellipse cx="0" cy="18" rx="17" ry="22" fill="#2a2427"/><path d="M-19 30C-24 -6 22 -8 19 30C22 6 10 -6 -19 30Z" fill="#1b1414"/></g>
  <g transform="translate(220 30)"><path d="M-30 90C-28 54 -16 44 0 44C16 44 28 54 30 90Z" fill="#8a5a3a"/><ellipse cx="0" cy="18" rx="17" ry="22" fill="${C.skin}"/><path d="M-19 30C-24 -6 22 -8 19 30C22 6 10 -6 -19 30Z" fill="#6a4630"/><circle cx="-6" cy="18" r="1.8" fill="#2a2a2a"/><circle cx="6" cy="18" r="1.8" fill="#2a2a2a"/></g>
  <path d="M145 8V112" stroke="#fff" stroke-width="2" opacity=".6"/>
  ${T(70, 114, "no flash", { a: "middle", fs: 10.5, c: "#fff" })}${T(220, 114, "with fill flash", { a: "middle", fs: 10.5, c: "#fff" })}`,
  "Before and after: a backlit person at sunset is a dark silhouette without flash, and evenly lit with fill flash.");
const ZOOM_ART = svg("0 0 290 96", `
  <g transform="translate(20 18)"><rect x="0" y="0" width="16" height="22" rx="3" fill="${C.body2}" stroke="${C.edge}"/><path d="M16 4L110 -14V36L16 18Z" fill="${C.glow}" opacity=".45"/></g>
  ${T(130, 26, "Wide (24mm)", { c: C.teal, fs: 12 })}${T(130, 41, "spreads the light", { c: C.dim, fs: 10.5, fw: 400 })}
  <g transform="translate(20 62)"><rect x="0" y="0" width="16" height="22" rx="3" fill="${C.body2}" stroke="${C.edge}"/><path d="M16 7L110 4V18L16 15Z" fill="${C.glow}" opacity=".6"/></g>
  ${T(130, 72, "Tele (105mm+)", { c: C.gold, fs: 12 })}${T(130, 87, "narrow beam, reaches further", { c: C.dim, fs: 10.5, fw: 400 })}`,
  "The flash zoom: at a wide setting the beam spreads out; at a telephoto setting it is narrow and reaches further.");

/* =====================================================================
   The slides
   ===================================================================== */
const N = TABS.length;
const slide = (i, kicker, title, body) => `<article class="fl-slide"><p class="fl-kicker">${kicker}</p><h2 class="fl-h">${title}</h2>${body}<p class="fl-count">${ic("image")}${i} of ${N}</p></article>`;
const col = (color, title, sub, body) => `<div class="fl-col"><h3 class="fl-ct" style="color:${color}">${title}</h3>${sub ? `<p class="fl-sub">${sub}</p>` : ""}${body}</div>`;
const dots = (color, items) => `<ul class="fl-dots" style="--dot:${color}">${items.map((t) => `<li>${t}</li>`).join("")}</ul>`;
const why = (icon, color, title, text) => `<div class="fl-why">${iconRing(color, icon)}<b style="color:${color}">${title}</b><span>${text}</span></div>`;
const hi = (t, color) => `<b style="color:${color || C.gold}">${t}</b>`;

const SLIDES = {
  basics: () => slide(1, "Camera-mounted flash", "Mastering the speedlight", `
    <div class="fl-two fl-wide">${ANATOMY}
      <aside class="fl-box"><h3 class="fl-ct" style="color:${C.gold};text-align:center">Why use one?</h3>
        ${why('<path d="M12 22h8l10-7v14l-10-7"/><path d="M33 17l4-2M33 22h5M33 27l4 2"/>', C.gold, "Power and reach", "Far stronger than a pop-up flash, so it lights people across a room.")}
        ${why('<path d="M14 28a10 10 0 0 1 16-12"/><path d="M30 16l1 5-5 0"/><path d="M30 28a10 10 0 0 1-16-1"/>', C.gold, "Points anywhere", "Tilt and swivel the head to bounce off walls and ceilings for soft light.")}
        ${why('<rect x="15" y="12" width="14" height="22" rx="2"/><path d="M20 10h4M23 17l-3 6h4l-3 6"/>', C.gold, "Quick to recycle", "Ready again in a second, so you can keep shooting through the toast.")}
      </aside></div>
    <div class="fl-tip"><b>Starter settings for events:</b> TTL with flash compensation at 0 to +0.7, head bounced. Camera in manual at 1/125 s, f/4, ISO 800 to 1600: the shutter and ISO set the room, the flash lights the people.</div>`),

  modes: () => slide(2, "Camera-mounted flash", "TTL vs manual flash", `
    <div class="fl-two fl-split">
      ${col(C.teal, "TTL <small>(through the lens)</small>", "The automatic mode", `<p class="fl-p">The flash fires a tiny pre-flash, the camera reads it through the lens and sets the power for you, shot by shot.</p>${TTL_ART}
        ${dots(C.teal, ["Best for events and candids, where distances keep changing", "Fires a quick pre-flash before every shot", "Fine-tune with flash compensation (FEC): + brighter, − darker", "Fooled by white dresses and dark suits: correct with FEC"])}`)}
      ${col(C.gold, "MANUAL <small>(M)</small>", "The creative mode", `<p class="fl-p">You set the power yourself, from full (1/1) down to 1/128. Each step halves the light: one stop.</p>${MANUAL_ART}
        ${dots(C.gold, ["Best for portraits, studio and off-camera flash", "Every frame comes out the same", "You're in control, from 1/1 to 1/128", "If your client moves, the exposure changes"])}`)}
    </div>`),

  bounce: () => slide(3, "Camera-mounted flash", "Bounce flash and indirect light", `
    <div class="fl-three">
      ${col(C.coral, iconRing(C.coral, '<path d="M14 28l16-12M18 16l2 4M26 30l2 4"/><path d="M12 12l20 20"/>') + "Direct flash", "The harsh approach", `${bounceArt("direct")}<p class="fl-cap">Avoid when you can: hard shadows, shiny skin and red-eye.</p>`)}
      ${col(C.teal, iconRing(C.teal, '<rect x="16" y="20" width="12" height="12" rx="2"/><path d="M18 20l2-6h6l2 6M22 12V8M16 10l-2-2M28 10l2-2"/>') + "Ceiling bounce", "The natural approach", `${bounceArt("ceiling")}<p class="fl-cap">Tilt 45° to 75°. The ceiling becomes a big, soft light.</p>`)}
      ${col(C.gold, iconRing(C.gold, '<rect x="14" y="18" width="12" height="12" rx="2"/><path d="M26 22l6-4M26 26l6 4M34 14v20"/>') + "Side bounce", "The dimensional approach", `${bounceArt("side")}<p class="fl-cap">Swivel toward a side wall for soft, window-like shape.</p>`)}
    </div>
    <div class="fl-tip"><b>Quick tips:</b>${dots(C.teal, ["Bounce off white or neutral surfaces: a red wall makes red light.", "Pull out the bounce card to put a little sparkle in the eyes.", "High or dark ceilings swallow light: raise ISO, or bounce off a wall.", "Bounce behind you, over your shoulder, for a huge soft light from the front."])}</div>`),

  sync: () => slide(4, "Camera-mounted flash", "Beating the flash sync speed", `
    <h3 class="fl-ct" style="color:${C.gold}">The limit: sync speed (usually 1/200 or 1/250 s)</h3>
    <div class="fl-two fl-art-thumb"><div><p class="fl-p">The flash can only light the whole frame while both shutter curtains are fully open. Go faster and the second curtain is already closing when it fires: you get a dark band.</p>${CURTAIN_STEPS}</div>
      <figure class="fl-fig">${BAND}<figcaption>Too fast without HSS, e.g. 1/500 s</figcaption></figure></div>
    <div class="fl-band">
      <h3 class="fl-ct" style="color:${C.teal}">The fix: high-speed sync (HSS)</h3>
      <div class="fl-two fl-art-thumb"><div><p class="fl-p">The flash pulses so fast it acts like a continuous light, so you can shoot up to 1/8000 s.</p>${HSS_ART}</div>
        <figure class="fl-fig">${RUNNER}<figcaption>${hi("With HSS:", C.teal)} freeze action, or shoot wide open in sun</figcaption></figure></div>
      <div class="fl-tip">${hi("HSS", C.teal)} is great for freezing action and for wide apertures in bright daylight. ${hi("The catch:", C.coral)} it costs about 1 to 2 stops of power, reaches less far and drains batteries faster.</div>
    </div>`),

  creative: () => slide(5, "Camera-mounted flash", "Shutter tricks and creative flash", `
    <div class="fl-two fl-split">
      ${col(C.teal, "First vs rear curtain", "When should the flash fire in a long exposure?", `${CURTAIN_SYNC}
        ${dots(C.teal, ["Adds motion and drama to slow-shutter shots", "Rear curtain for dancers, sparklers, cars and cyclists", "Slow the shutter to 1/30 or 1/15 s to pull in room light: the flash freezes the faces"])}`)}
      ${col(C.gold, "Fill flash and zoom", "Shaping the flash to the scene", `<h4 class="fl-mini" style="color:${C.gold}">Fill flash</h4>${FILL_ART}
        <p class="fl-p">On bright days or with the sun behind your client, set FEC to −1 to −2 so the flash lifts the shadows without looking flashy. Add a ½ CTO gel at sunset.</p>
        <h4 class="fl-mini" style="color:${C.gold}">The zoom head</h4>${ZOOM_ART}
        <p class="fl-p">The flash tube moves inside the head. It follows your lens automatically, or set it yourself: zoom wide when bouncing.</p>`)}
    </div>`),

  fix: () => slide(6, "Camera-mounted flash", "Tips, tricks and troubleshooting", `
    <div class="fl-two fl-art-thumb">
      <div><h3 class="fl-ct" style="color:${C.gold}">Pro tips</h3>${dots(C.gold, [`Always pack ${hi("spare batteries")}. Rechargeable NiMH AAs recycle faster and last longer.`, `Carry a ${hi("spare diffuser")} or a small bounce card.`, `Practice ${hi("manual mode")} to get a feel for how light falls off with distance.`])}</div>
      ${svg("0 0 120 110", `<rect x="10" y="20" width="62" height="74" rx="8" fill="${C.body}" stroke="${C.edge}"/>${[0, 1, 2, 3].map((i) => `<rect x="${18 + i * 13}" y="32" width="9" height="52" rx="3" fill="#7fd08a"/>`).join("")}<rect x="18" y="12" width="30" height="10" rx="2" fill="${C.edge}"/>${speedlight(96, 100, 0.9, 0, -1, false)}`, "A charger with four rechargeable AA batteries next to a speedlight.", "fl-thumb")}
    </div>
    <div class="fl-two fl-split">
      ${col(C.ink, `<span class="fl-badge" style="background:${C.gold}">A</span> Flash not firing?`, "", dots(C.gold, [`Check the ${hi("hot shoe")}: pushed all the way in and locked.`, `${hi("Clean the metal contacts")} on the flash foot and the camera.`, `Turn off ${hi("silent or electronic shutter")}.`, `${hi("Overheated?")} Let it rest if it shows a warning.`]))}
      ${col(C.ink, `<span class="fl-badge" style="background:${C.gold}">B</span> Black band on the photo?`, "", dots(C.gold, [`You're past the camera's ${hi("sync speed")} (usually 1/200 or 1/250 s).`, `Turn on ${hi("high-speed sync")} to go faster.`, `Or ${hi("slow the shutter")} back down to the sync speed.`]))}
    </div>
    <div class="fl-two fl-split">
      ${col(C.gold, "More quick fixes", "", dots(C.gold, [`${hi("Red-eye:")} bounce, or move the flash off the camera.`, `${hi("Orange or green faces:")} gel the flash to match the room (CTO for tungsten).`, `${hi("Front row bright, back row dark:")} bounce and step back.`, `${hi("Shadow on the wall:")} move your client away from it.`]))}
      ${col(C.gold, "Care and safety", "", dots(C.gold, ["Take the batteries out for storage to avoid corrosion.", `${hi("Never touch")} the flash window after rapid firing, and never fire it right by someone's eyes, especially a baby's.`, "Keep it out of heavy rain; protect the hot shoe and battery door from moisture."]))}
    </div>`)
};

/* =====================================================================
   Under each slide: tools and links into the lighting planner
   ===================================================================== */
const tryIt = (id, text) => `<button class="ghline" data-fl-try="${id}">${ic("light")}<span>${text}</span></button>`;
function powerOut() {
  const stops = 2 * Math.log2(FL.d2 / FL.d1), idx = Math.round(FL.pow - stops);
  const thirds = Math.round(Math.abs(stops) * 3), whole = Math.floor(thirds / 3), frac = ["", "⅓", "⅔"][thirds % 3];
  const amount = (whole ? String(whole) : "") + frac || "0";
  const word = thirds === 0 ? "The same power." : `${amount} stop${thirds > 3 ? "s" : ""} ${stops > 0 ? "more" : "less"} light needed.`;
  let set;
  if (idx < 0) set = `That's more than full power. Open your aperture ${Math.round(-idx)} stop${-idx > 1 ? "s" : ""}, raise ISO, or move the flash closer.`;
  else if (idx > 7) set = "That's below 1/128. Close your aperture or lower ISO instead.";
  else set = `Set the flash to <b>${POWERS[idx]}</b>${Math.abs(stops - Math.round(stops)) > 0.2 ? " (round to the nearest step, or fine-tune with thirds)" : ""}.`;
  return `<p>${word} ${set}</p><p class="small muted">Light falls off with the square of distance: twice as far needs four times the power (two stops).</p>`;
}
function syncOut() {
  if (FL.sh <= FL.sync) return `<p class="fl-ok"><b>Fine:</b> 1/${FL.sh} s is at or below your sync speed, so the whole frame gets the flash at full strength.</p>`;
  return `<p class="fl-warn"><b>Black band:</b> at 1/${FL.sh} s the second curtain is already closing when the flash fires, so part of the frame stays dark.</p>
    <p class="small">Fix it: turn on <b>high-speed sync</b> (HSS), or slow down to 1/${FL.sync} s and close the aperture or use an ND filter. HSS costs roughly 1 to 2 stops of flash power.</p>`;
}
const slider = (k, label) => `<div class="lt-sl"><div class="lt-slh"><label class="lbl" for="fl-${k}">${label}</label><b class="lt-o" id="fl-o-${k}">${FL[k]} ft</b></div><input class="range" id="fl-${k}" data-fl-s="${k}" type="range" min="2" max="30" step="1" value="${FL[k]}"></div>`;
const EXTRAS = {
  basics: () => tryIt("direct", "See on-camera flash in the lighting planner"),
  modes: () => `<section class="card"><h3>Calculator: new distance, new power</h3>
      <div class="lbl">Flash power now</div>${chips("fl-pow", String(FL.pow), POWERS.map((p, i) => [String(i), p]))}
      ${slider("d1", "Distance now")}${slider("d2", "New distance")}
      <div id="fl-power">${powerOut()}</div></section>`,
  bounce: () => tryIt("bounce", "See ceiling bounce in the lighting planner") + tryIt("sidebounce", "See side-wall bounce in the lighting planner") + tryIt("direct", "See direct flash in the lighting planner"),
  sync: () => `<section class="card"><h3>Will it sync?</h3>
      <div class="lbl">Your camera's sync speed</div>${chips("fl-sync", String(FL.sync), SYNCS.map(([v, t]) => [String(v), t + " s"]))}
      <div class="lbl">Shutter speed</div>${chips("fl-sh", String(FL.sh), SHUTTERS.map((v) => [String(v), "1/" + v]))}
      <div id="fl-sync-out">${syncOut()}</div>
      <p class="small muted">Electronic or silent shutter modes often can't fire a flash at all. Use the mechanical shutter.</p></section>`,
  creative: () => tryIt("fillflash", "See fill flash at sunset in the lighting planner"),
  fix: () => ""
};

VIEWS.flash = { title: "Flash photography", render() {
  const tab = SLIDES[FL.tab] ? FL.tab : "basics", i = TABS.findIndex((t) => t[0] === tab);
  return `<div class="fl-root">
    <div><h2>Flash photography</h2><p class="muted small" style="margin-top:6px">How to use a camera-mounted flash so it looks like good natural light, not like a flash.</p></div>
    ${chips("fl-tab", tab, TABS)}
    ${SLIDES[tab]()}
    <div class="fl-nav">${i > 0 ? `<button class="btn ghost sm" data-fl-tab="${TABS[i - 1][0]}">← ${TABS[i - 1][1]}</button>` : "<span></span>"}${i < N - 1 ? `<button class="btn sm" data-fl-tab="${TABS[i + 1][0]}">${TABS[i + 1][1]} →</button>` : ""}</div>
    ${EXTRAS[tab]()}
  </div>`;
} };

/* =====================================================================
   Events
   ===================================================================== */
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

/* =====================================================================
   Home tile and styles
   ===================================================================== */
ICON.flash = '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>';
if (!ICON.image) ICON.image = '<rect x="3.5" y="6.5" width="17" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6.5l1.5-2h3l1.5 2"/>';
const homeRender = VIEWS.home.render;
VIEWS.home.render = function () {
  const html = homeRender.apply(this, arguments), t = tile("flash", "flash", "Flash photography", "Bounce, TTL, sync speed and fixes");
  return html.indexOf('data-go="flash"') > -1 ? html : html.replace('<button class="tile" data-go="tools">', t + '<button class="tile" data-go="tools">');
};
const css = document.createElement("style");
css.textContent = `
.fl-root { display: grid; gap: 14px; }
.fl-slide { background: linear-gradient(160deg, #222a31, #1a2026 60%, #1d242b); color: #eef2f4; border-radius: 16px; padding: 22px 16px 14px; display: grid; gap: 14px; box-shadow: 0 6px 24px rgba(0,0,0,.18); overflow: hidden; }
.fl-kicker { margin: 0; text-align: center; color: #5ed3c6; font: 500 15px var(--sans); }
.fl-h { margin: -6px 0 2px; text-align: center; color: #fff; font: 700 clamp(22px, 6vw, 32px)/1.12 var(--sans); letter-spacing: -.01em; }
.fl-ct { margin: 0; font: 700 clamp(17px, 4.6vw, 21px)/1.2 var(--sans); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.fl-ct small { font-size: .7em; font-weight: 600; }
.fl-sub { margin: 2px 0 0; color: #eef2f4; font: 600 15px var(--sans); }
.fl-p { margin: 0; color: #d6dde2; font: 400 14.5px/1.45 var(--sans); }
.fl-cap { margin: 0; color: #d6dde2; font: 400 13.5px/1.4 var(--sans); text-align: center; }
.fl-mini { margin: 4px 0 0; font: 700 15px var(--sans); }
.fl-col { display: grid; gap: 10px; align-content: start; }
.fl-two { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
.fl-split > .fl-col + .fl-col { border-top: 1px solid #36414a; padding-top: 14px; }
@media (min-width: 620px) { .fl-split > .fl-col + .fl-col { border-top: 0; padding-top: 0; border-left: 1px solid #36414a; padding-left: 16px; } }
.fl-art-thumb { grid-template-columns: 1fr 120px; align-items: center; }
@media (max-width: 420px) { .fl-art-thumb { grid-template-columns: 1fr 96px; } }
.fl-three { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.fl-three .fl-ct { justify-content: center; text-align: center; flex-direction: column; gap: 4px; }
.fl-three .fl-sub { text-align: center; font-size: 13.5px; }
.fl-svg { width: 100%; height: auto; display: block; }
.fl-thumb { max-width: 120px; justify-self: center; }
.fl-ico { width: 40px; height: 40px; flex: none; }
.fl-box { background: #161c21; border: 1px solid #333e47; border-radius: 12px; padding: 14px; display: grid; gap: 14px; }
.fl-why { display: grid; justify-items: center; text-align: center; gap: 3px; }
.fl-why b { font: 700 16px var(--sans); }
.fl-why span { color: #d6dde2; font: 400 13.5px/1.4 var(--sans); }
.fl-dots { margin: 0; padding: 0; list-style: none; display: grid; gap: 7px; }
.fl-dots li { position: relative; padding-left: 16px; color: #e6ebee; font: 400 14.5px/1.4 var(--sans); }
.fl-dots li::before { content: ""; position: absolute; left: 2px; top: .55em; width: 7px; height: 7px; border-radius: 50%; background: var(--dot); }
.fl-tip { background: #161c21; border-radius: 12px; padding: 12px 14px; color: #e6ebee; font: 400 14px/1.45 var(--sans); }
.fl-tip .fl-dots { margin-top: 8px; }
.fl-band { background: #232c33; margin: 0 -16px; padding: 16px; display: grid; gap: 12px; }
.fl-fig { margin: 0; display: grid; gap: 6px; justify-items: center; }
.fl-fig figcaption { color: #d6dde2; font: 400 12px/1.35 var(--sans); text-align: center; }
.fl-badge { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; color: #1a2026; font-size: 14px; }
.fl-count { margin: 4px 0 0; display: flex; justify-content: center; align-items: center; gap: 6px; color: #9fabb3; font: 500 13px var(--sans); }
.fl-count svg { width: 16px; height: 16px; }
.fl-nav { display: flex; justify-content: space-between; gap: 10px; }
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
