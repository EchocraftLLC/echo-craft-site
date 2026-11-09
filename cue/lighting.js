/* Cue lighting setups.
   A top-down planner and a camera view that actually simulates how the light falls on a face.
   Self-contained: loaded after the main app script, it adds one view ("lighting") and one home tile.
   Nothing here leaves the device. */
(function () {
"use strict";
if (typeof VIEWS === "undefined" || typeof ic === "undefined" || typeof store === "undefined") return;

/* =====================================================================
   Small helpers
   ===================================================================== */
const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);
const clone = (o) => JSON.parse(JSON.stringify(o));

// Color temperature to an RGB tint, relative to daylight (the camera is balanced for 5600K).
function kelvinRaw(k) {
  const t = clamp(k, 1500, 12000) / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
  else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); b = 255; }
  return [clamp(r, 0, 255) / 255, clamp(g, 0, 255) / 255, clamp(b, 0, 255) / 255];
}
const DAY = kelvinRaw(5600);
function tint(k) { const c = kelvinRaw(k); return [c[0] / DAY[0], c[1] / DAY[1], c[2] / DAY[2]]; }

/* =====================================================================
   What can be in the scene
   ===================================================================== */
// Light shapers. r is the radius of the glowing surface in feet: bigger and closer means softer light.
const MODS = {
  bare:      { name: "Bare flash or small LED", r: 0.12, hint: "Hard light with crisp shadows. Dramatic, but unforgiving on skin." },
  small:     { name: "Small softbox", r: 0.8, hint: "Medium softness. Good modeling and a tidy pool of light." },
  large:     { name: "Large softbox or octabox", r: 1.9, hint: "Soft, wrapping light that flatters most faces." },
  beautydish:{ name: "Beauty dish", r: 0.9, hint: "Crisp but flattering, with sparkly ring-shaped catchlights. The classic light for beauty and clamshell setups." },
  umbrella:  { name: "Umbrella", r: 1.6, hint: "Soft and wide. Spills light, which helps for groups." },
  window:    { name: "Window", r: 2.3, hint: "Big, soft and free. Its color and strength change with the weather." },
  reflector: { name: "Reflector", r: 1.5, hint: "Bounces light back into the shadows. It can only give back what the key gives it." },
  sun:       { name: "Direct sun", r: 0, hint: "Hard, strong and far away. Backlight it, soften it with a scrim, or find shade." },
  vwhite:    { name: "White V-flat", r: 2.2, panel: [2, 4], hint: "A tall white board (two 4 x 8 ft panels). It bounces back whatever light reaches it, for big, soft, natural fill." },
  vblack:    { name: "Black V-flat", r: 2.2, panel: [2, 4], hint: "Negative fill: a black board that soaks up stray light, so the shadow side gets deeper and the face more sculpted." },
  scrim:     { name: "Scrim (diffusion panel)", r: 2.1, panel: [3, 3], hint: "A big panel of white fabric. Put it between the sun and your client and hard sun turns into soft light." }
};
// which shapers make sense for each kind of light
const MODS_FOR = {
  key: ["bare", "small", "large", "beautydish", "umbrella", "window", "reflector"],
  fill: ["reflector", "vwhite", "large", "small", "umbrella", "beautydish", "bare", "window"],
  rim: ["small", "bare", "large", "umbrella", "reflector"],
  bg: ["small", "bare", "umbrella", "large"],
  sun: ["sun"], flag: ["vblack", "vwhite"], scrim: ["scrim"]
};
const isPanel = (l) => !!(MODS[l.mod] || {}).panel;
const madeLight = (l) => !isPanel(l) && l.mod !== "reflector";       // gives its own light, so it has power and color
const ROLES = {
  key:  { label: "Key",        color: "#e3a24a", letter: "K" },
  fill: { label: "Fill",       color: "#5c8fd6", letter: "F" },
  rim:  { label: "Rim",        color: "#a06fd1", letter: "R" },
  bg:   { label: "Background", color: "#4fae77", letter: "B" },
  sun:  { label: "Sun",        color: "#f0b429", letter: "S" },
  flag: { label: "V-flat",     color: "#8a8a92", letter: "V" },
  scrim:{ label: "Scrim",      color: "#9fb3c2", letter: "D" }
};
const COLORS = [[5600, "Daylight"], [3500, "Warm"], [3000, "Tungsten"], [7500, "Shade"]];
const WALLS = {
  gray:  { name: "Gray",   rgb: [0.30, 0.30, 0.31] },
  white: { name: "White",  rgb: [0.78, 0.78, 0.76] },
  black: { name: "Black",  rgb: [0.025, 0.025, 0.027] },
  warm:  { name: "Warm",   rgb: [0.50, 0.38, 0.29] },
  green: { name: "Greenery", rgb: [0.14, 0.26, 0.13] },
  sky:   { name: "Evening sky", rgb: [1, 1, 1], emit: true }
};
/* =====================================================================
   Situations: lights and notes for each kind of shoot
   ===================================================================== */
const L = (role, mod, az, el, dist, ev, k) => ({ role, mod, az, el, dist, ev, k: k || 5600 });
const PRESETS = [
  { id: "headshot", name: "Clean headshot", sub: "Corporate, LinkedIn, team photos",
    s: { layout: "single", turn: 12, wall: "gray", wallD: 5, amb: 0.08, ambTop: 0, ambK: 5600, lights: [L("key", "large", -35, 26, 4.5, 0), L("fill", "reflector", 40, 0, 3.4, -2.6), L("rim", "small", 150, 38, 5, -0.4)] },
    use: "Corporate headshots, LinkedIn photos and team portraits, where you want clean, trustworthy light that works on almost everyone.",
    gear: "One large softbox (or a big window), a white or silver reflector, and an optional small light behind for hair separation.",
    start: "Key about 35 degrees to one side, just above eye level, 4 to 5 ft away. Reflector opposite, close to the face. Try f/4 to f/5.6, 1/160 s, ISO 100, with flash around 1/8 power.",
    avoid: "A key that is too high makes dark eye sockets. Keep the reflector close, or the fill never reaches the shadow side." },
  { id: "studio", name: "Pro studio portrait", sub: "Sculpted headshot with a black V-flat",
    s: { layout: "single", turn: 10, wall: "gray", wallD: 6, amb: 0.22, ambTop: 0, ambK: 5600, lights: [L("key", "large", -45, 32, 4.5, 0), L("flag", "vblack", 70, -5, 2.6, 0), L("rim", "small", 150, 40, 5, -0.8), L("bg", "small", -60, 10, 4, -1)] },
    use: "Professional headshots and portraits with shape: actors, executives, authors and personal brands. The black V-flat on the shadow side stops the room from filling in the shadows, so the face looks sculpted rather than flat.",
    gear: "A large octabox or softbox, a black V-flat (or black foam board) on the shadow side, a small hair light, and a light for the background.",
    start: "Key at 45 degrees, a little above the eyes, 4 to 5 ft away. Stand the black V-flat 2 to 3 ft from your client on the other side, opened toward them. Hair light high and behind on the far side. Background light low behind your client, aimed at the wall. f/5.6 to f/8, 1/160 s, ISO 100.",
    avoid: "In a small white room the walls act as fill and flatten the face. The black V-flat fixes that. If the shadow side gets too dark, turn the V-flat around to its white side, or move it back." },
  { id: "clamshell", name: "Clamshell beauty", sub: "Light above, bounce below: glowing skin",
    s: { layout: "single", turn: 0, wall: "white", wallD: 5, amb: 0.12, ambTop: 0, ambK: 5600, lights: [L("key", "beautydish", 0, 40, 3.2, 0), L("fill", "reflector", 0, -38, 2.4, -1.2)] },
    use: "Beauty, makeup and glamour headshots, and anyone who wants smooth, glowing skin. The light above shapes the cheekbones; the bounce below fills the eyes and softens the chin and neck.",
    gear: "A beauty dish or medium softbox above your client, and a silver or white reflector (or a second, dimmer softbox) below the face.",
    start: "Beauty dish straight in front, 35 to 45 degrees above, 2.5 to 3.5 ft away. Reflector flat or tilted under the chin, just below the frame. Shoot through the gap between them. f/8, 1/200 s, ISO 100.",
    avoid: "Too much light from below looks unnatural: keep the bottom 1 to 2 stops darker than the top. Glasses reflect both lights, so tilt them slightly down." },
  { id: "highkey", name: "High key on white", sub: "Bright and clean, with a pure white background",
    s: { layout: "single", turn: 8, wall: "white", wallD: 6, amb: 0.18, ambTop: 0, ambK: 5600, lights: [L("key", "umbrella", -25, 28, 5.5, 0), L("fill", "vwhite", 70, -8, 3.5, 0), L("bg", "small", -115, 5, 4, 1), L("bg", "small", 115, 5, 4, 1)] },
    use: "Website headshots, e-commerce, kids, families and anything that needs a clean white background.",
    gear: "One big, soft key light, a white V-flat for fill, and two lights for the background.",
    start: "Light the white wall evenly from both sides, about one stop brighter than the face, so it turns pure white. Keep your client 5 to 6 ft from the wall. Stand the white V-flat opposite the key, close to your client.",
    avoid: "Too much background light spills onto the edges of the face and washes it out. Too little and the white turns gray." },
  { id: "loop", name: "Flattering portrait", sub: "Soft, safe light for most faces",
    s: { layout: "single", turn: 10, wall: "gray", wallD: 5, amb: 0.08, ambTop: 0, ambK: 5600, lights: [L("key", "large", -30, 28, 5, 0), L("fill", "reflector", 30, -15, 3.5, -2.5)] },
    use: "When you are not sure what to do. A key slightly above and to one side makes a small shadow from the nose that loops toward the cheek, and flatters most faces.",
    gear: "One large softbox or umbrella, and a reflector held low in front of your client.",
    start: "Key at 30 degrees, a little higher than the eyes, 5 ft away. Reflector low in front, tilted up. f/2.8 to f/4 for soft backgrounds.",
    avoid: "Light from straight in front is flat. Light from below looks spooky. Keep the key above the eye line." },
  { id: "rembrandt", name: "Dramatic (Rembrandt)", sub: "Deep shadow, a triangle of light on the cheek",
    s: { layout: "single", turn: 0, wall: "black", wallD: 6, amb: 0.05, ambTop: 0, ambK: 5600, lights: [L("key", "small", -52, 40, 4.5, 0.3)] },
    use: "Moody portraits, creatives, musicians, brand photos with attitude. The shadow side stays dark, with a small triangle of light under the eye.",
    gear: "One small to medium softbox. No fill, or a very weak reflector. A black or dark background.",
    start: "Key about 45 to 55 degrees to the side and 40 degrees up, 4 to 5 ft away. Turn your client's face a little away from the key until the triangle forms. Expose for the lit cheek.",
    avoid: "If the triangle is missing, move the light higher or turn the face. If the shadow side is pure black, add a reflector a long way off." },
  { id: "split", name: "Moody side light", sub: "Half the face in shadow",
    s: { layout: "single", turn: 0, wall: "black", wallD: 6, amb: 0.03, ambTop: 0, ambK: 5600, lights: [L("key", "small", -90, 5, 4, 0.2)] },
    use: "Dark, edgy portraits and album-style looks. It shows texture and builds mystery.",
    gear: "A small softbox or bare light placed exactly to one side. A dark room helps.",
    start: "Put the light level with your client's ear, 90 degrees to one side. Ask them to look at the lens. Keep the background dark.",
    avoid: "It is not for everyone. It exaggerates skin texture and can look severe. Add a faint fill if it is too much." },
  { id: "window", name: "Window light", sub: "Free, soft and beautiful",
    s: { layout: "single", turn: -10, wall: "warm", wallD: 6, amb: 0.12, ambTop: 0.2, ambK: 5200, lights: [L("key", "window", -75, 12, 4, 0), L("fill", "reflector", 65, 0, 3, -3)] },
    use: "Newborns, families at home, lifestyle sessions and anytime a big window is nearby. The light is soft and wraps around the face.",
    gear: "A north- or shade-facing window, a white reflector or foam board, and a lens that opens to f/2 or wider.",
    start: "Stand your client at about 4 ft from the window, turned a little toward it. Reflector on the far side. Switch off room lamps so the colors do not clash. f/2 to f/2.8, ISO as needed.",
    avoid: "Direct sun through the glass is harsh. Hang a sheer curtain or wait for shade. Mixed room lamps turn skin orange." },
  { id: "shade", name: "Outdoor open shade", sub: "Even sky light plus a reflector",
    s: { layout: "single", turn: 8, wall: "green", wallD: 12, amb: 0.9, ambTop: 0.85, ambK: 7200, lights: [L("fill", "reflector", 0, -28, 3, -2.2, 4200)] },
    use: "Midday portraits, families and seniors outdoors. Shade turns harsh sun into even, forgiving light.",
    gear: "A gold or white reflector held low in front of your client, and a lens hood.",
    start: "Put your client just inside the shade edge, facing the open sky and away from the dark shade. Angle the reflector up from below to fill under the eyes and chin. f/2.8, ISO 100 to 400.",
    avoid: "Under a dense tree the light turns green and dark. Look for open shade, such as a building's shadow, where the sky still lights the face." },
  { id: "midday", name: "Harsh midday sun", sub: "What noon sun does to a face",
    s: { layout: "single", turn: 0, wall: "green", wallD: 14, amb: 0.5, ambTop: 0.85, ambK: 7200, lights: [L("sun", "sun", 25, 68, 9, 2.5, 5600)] },
    use: "A comparison: overhead sun gives dark eye sockets, a bright forehead and nose, and squinting. See what it does, then try the fixes in the next setup.",
    gear: "A scrim, a reflector, or simply some shade nearby.",
    start: "Best: move your client into open shade. Otherwise turn them so the sun is behind them and bounce light into the face, or have a helper hold a scrim between the sun and your client.",
    avoid: "Don't face your client into the sun: they will squint. Watch for bright hot spots on the forehead and nose." },
  { id: "scrim", name: "Midday sun with a scrim", sub: "Turn hard sun into soft light",
    s: { layout: "single", turn: 0, wall: "green", wallD: 14, amb: 0.5, ambTop: 0.85, ambK: 7200, lights: [L("sun", "sun", 25, 68, 9, 2.5, 5600), L("scrim", "scrim", 22, 52, 2.8, 0), L("fill", "reflector", 0, -30, 3, -2.2, 5600)] },
    use: "Outdoor portraits when there is no shade: weddings, seniors and families at noon.",
    gear: "A 4 x 4 to 6 x 6 ft scrim (or the diffusion panel of a 5-in-1 reflector) and a helper. A reflector below is a bonus.",
    start: "Hold the scrim between the sun and your client, as close as you can while keeping it out of the frame. The closer it is, the softer the light. Expose for the face; a brighter background looks airy.",
    avoid: "If the scrim is too far away the light gets harder again, and parts of the face pop back into the sun. Keep it tilted toward the sun." },
  { id: "golden", name: "Golden hour backlight", sub: "Glowing hair, warm rim, bright eyes",
    s: { layout: "single", turn: 0, wall: "sky", wallD: 14, amb: 0.35, ambTop: 0.6, ambK: 6500, lights: [L("sun", "sun", 140, 20, 9, 3, 3500), L("fill", "reflector", -20, 0, 4, 0.2, 4200)] },
    use: "Couples, seniors and maternity at sunset. The sun behind your client makes a glowing rim and a dreamy background.",
    gear: "A reflector or an off-camera flash in front, and a lens hood to control flare.",
    start: "Put the low sun behind your client, a little off to one side. Bounce light into the face with a reflector. Meter for the face so the sky glows. f/2.8, 1/250 s.",
    avoid: "Without front fill the face goes dark. Without a lens hood, flare can wash out the picture. Check for sun spots through the leaves." },
  { id: "couple", name: "Couple, soft and even", sub: "Both faces lit, with a little shape",
    s: { layout: "couple", turn: 0, wall: "gray", wallD: 6, amb: 0.08, ambTop: 0, ambK: 5600, lights: [L("key", "large", -25, 30, 6.5, 0.4), L("fill", "umbrella", 35, 15, 6.5, -1.2), L("rim", "small", 150, 40, 5.5, 0.2)] },
    use: "Engagements and couples at home or in a studio. The key sits further back, so the light stays even across two faces.",
    gear: "One large softbox, an umbrella or second light for fill, and an optional rim light.",
    start: "Move the key back to 6 ft so both faces get nearly the same light. Fill from the other side, a stop darker. Ask them to stand shoulder to shoulder, f/4.",
    avoid: "A key placed close to one person lights them far more than the other. Step the light back." },
  { id: "group", name: "Group, three rows", sub: "Everyone lit from front to back",
    s: { layout: "group", turn: 0, wall: "gray", wallD: 6, amb: 0.15, ambTop: 0, ambK: 5600, lights: [L("key", "umbrella", -25, 40, 8, 0.8), L("fill", "umbrella", 30, 35, 8, -0.2)] },
    use: "Families, teams and wedding parties. The aim is the same light on everyone, front row to back row.",
    gear: "Two big umbrellas or softboxes on stands, and a tight group so they fit inside the light.",
    start: "Raise both lights high and far back, around 8 ft, so the front row is not much brighter than the back. Shoot f/8 so all rows are sharp. Ask the group to stand closer than feels normal.",
    avoid: "A light that is close and low makes the front row bright and the back row dark. Go higher and further." },
  { id: "bump", name: "Maternity side light", sub: "Sculpts the bump",
    s: { layout: "bump", turn: 0, wall: "warm", wallD: 7, amb: 0.05, ambTop: 0.1, ambK: 5200, lights: [L("key", "window", -75, 10, 5, 0), L("fill", "reflector", 60, 0, 4, -4)] },
    use: "Maternity sessions. A strong light from the side makes shadows that show the curve of the belly.",
    gear: "A big window or large softbox at 90 degrees, a reflector, and a plain background.",
    start: "Turn your client about 30 degrees and put the window to the side of the bump, level with the belly. Add a reflector on the other side only if the shadow is too deep.",
    avoid: "Light straight from the front flattens the curve. Keep the light to the side, a little behind the belly line." },
  { id: "bounce", name: "Event: bounced flash", sub: "Soft light at parties and receptions",
    s: { layout: "single", turn: 8, wall: "warm", wallD: 9, amb: 0.1, ambTop: 0, ambK: 3200, lights: [L("key", "large", 0, 70, 5, 0, 5200), L("fill", "bare", 0, 3, 7, -3.5)] },
    use: "Receptions, parties and corporate events with low ceilings. Aiming the flash at the ceiling turns the whole ceiling into a big soft light.",
    gear: "An on-camera flash with a swivel head. A small bounce card is a bonus.",
    start: "Tilt the flash head up to the ceiling, about 70 degrees. Use a white or light ceiling only. Try f/4, 1/125 s, ISO 800. Keep the flash at about half power.",
    avoid: "Colored or very high ceilings tint or eat the light. Bouncing from straight above also darkens the eyes, so keep a little fill from the front." },
  { id: "direct", name: "On-camera flash, direct", sub: "What to avoid, and when it is okay",
    s: { layout: "single", turn: 15, wall: "white", wallD: 2, amb: 0.05, ambTop: 0, ambK: 5600, lights: [L("key", "bare", 0, 4, 7, 0.5)] },
    use: "A comparison, so you can see what a flash pointed straight at your client does: flat faces, shiny skin and a hard shadow on the wall behind them.",
    gear: "An on-camera flash with the head pointing forward.",
    start: "If you must use it, move your client away from the wall so the shadow falls out of frame, and diffuse the flash with a small softbox or bounce card.",
    avoid: "Direct flash makes flat, harsh light with red eyes and a hard shadow. Bounce it, diffuse it, or take it off the camera." }
];
const presetOf = (id) => PRESETS.find((p) => p.id === id) || PRESETS[0];

/* =====================================================================
   The simulated scene: real 3D people and a small ray tracer, so shadows and soft light are real.
   The people (cue/lighting-people.bin.gz) are built from MakeHuman's public-domain body
   by scripts/build_cue_people.py. The tracer below runs in background threads when it can.
   ===================================================================== */
// Who stands where. Positions are in feet; the camera is on the +z side, looking at the origin.
// yaw turns the body (positive turns it toward camera right), head is where the face points.
const WHO = {
  woman:     { hair: [0.115, 0.07, 0.042], top: [0.045, 0.055, 0.075], skin: [0.66, 0.45, 0.36] },
  man:       { hair: [0.05, 0.035, 0.025], top: [0.20, 0.19, 0.17], skin: [0.6, 0.41, 0.31] },
  expecting: { hair: [0.115, 0.07, 0.042], top: [0.58, 0.52, 0.45], skin: [0.66, 0.45, 0.36] }
};
const GROUP_LOOKS = [
  { who: "woman", hair: [0.24, 0.15, 0.08], top: [0.36, 0.08, 0.07] }, { who: "man", top: [0.05, 0.07, 0.12] },
  { who: "woman", top: [0.55, 0.53, 0.5], hair: [0.03, 0.022, 0.018] }, { who: "man", top: [0.16, 0.22, 0.14], hair: [0.12, 0.08, 0.05] },
  { who: "woman", top: [0.08, 0.15, 0.2] }, { who: "man", top: [0.4, 0.38, 0.34], skin: [0.42, 0.27, 0.19] },
  { who: "woman", top: [0.3, 0.26, 0.18], hair: [0.5, 0.36, 0.2], skin: [0.7, 0.5, 0.42] }
];
const LAYOUTS = {
  single: { label: "One person", frameW: 1.35, hw: 1.25, frameY: -0.32, camD: 9, aim: [0, 0, 0],
    people: [{ x: 0, y: 0, z: 0, yaw: 22, head: 0, who: "woman" }] },
  couple: { label: "Couple", frameW: 2.6, hw: 0.95, frameY: -0.45, camD: 10, aim: [0, -0.1, 0],
    people: [{ x: -0.62, y: 0, z: 0.05, yaw: 28, head: 12, who: "woman" }, { x: 0.66, y: 0.24, z: -0.08, yaw: -24, head: -10, who: "man" }] },
  group: { label: "Group", frameW: 5.0, hw: 0.62, frameY: -0.42, camD: 14, aim: [0, -0.3, 0],
    people: (() => { const l = []; let n = 0; [[-1.45, -0.7, 0.7, 1.45], [-1.9, -0.95, 0, 0.95, 1.9], [-1.45, -0.7, 0.7, 1.45]].forEach((xs, row) => xs.forEach((x, i) => { const look = GROUP_LOOKS[(n++ * 3 + row) % GROUP_LOOKS.length]; l.push(Object.assign({ x, y: [0, 0.22, 0.44][row] + (i % 2) * 0.06 + (look.who === "man" ? 0.18 : 0), z: [1.1, 0, -1.1][row], yaw: x * -6, head: x * -6, s: 0.97 + ((n * 7) % 5) * 0.015 }, look)); })); return l; })() },
  bump:  { label: "Maternity", frameW: 2.1, hw: 1.45, frameY: -1.05, camD: 11, aim: [0, -0.7, 0],
    people: [{ x: 0, y: 0, z: 0, yaw: -62, head: -18, who: "expecting" }] }
};

function sceneFrom(S) {
  const lay = LAYOUTS[S.layout] || LAYOUTS.single, turn = num(S.turn, 0);
  const people = lay.people.map((p) => {
    const look = WHO[p.who] || WHO.woman, body = p.yaw + turn * 0.4, head = p.head + turn;
    return { model: p.who, x: p.x, y: p.y, z: p.z, s: p.s || 1, yaw: body, rel: clamp(head - body, -70, 70),
      hair: p.hair || look.hair, top: p.top || look.top, skin: p.skin || look.skin };
  });
  const wallD = clamp(num(S.wallD, 5), 1.5, 15);
  const aim = lay.aim;
  const lights = [], panels = [], later = [];
  (S.lights || []).forEach((l, src) => {
    const m = MODS[l.mod] || MODS.small;
    const az = num(l.az, 0) * DEG, el = num(l.el, 0) * DEG, tn = tint(num(l.k, 5600));
    const power = 25 * Math.pow(2, num(l.ev, 0));
    if (l.mod === "sun") {
      lights.push({ sun: true, dir: [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)], power: 2.4 * Math.pow(2, num(l.ev, 0)), tn, role: l.role, src });
      return;
    }
    let dist = clamp(num(l.dist, 5), 1.5, 12);
    // Keep lights in front of the background.
    const back = -Math.cos(el) * Math.cos(az);
    if (back > 0.01) dist = Math.min(dist, Math.max(1, (wallD - 0.4) / back));
    const pos = [aim[0] + dist * Math.cos(el) * Math.sin(az), aim[1] + dist * Math.sin(el), aim[2] + dist * Math.cos(el) * Math.cos(az)];
    const target = l.role === "bg" ? [0, aim[1], -wallD] : aim;
    let wx = target[0] - pos[0], wy = target[1] - pos[1], wz = target[2] - pos[2];
    const wl = Math.hypot(wx, wy, wz) || 1; wx /= wl; wy /= wl; wz /= wl;
    // Two directions across the glowing surface.
    let ux = wz, uz = -wx; let ul = Math.hypot(ux, uz);
    if (ul < 1e-3) { ux = 1; uz = 0; ul = 1; }
    ux /= ul; uz /= ul;
    const vx = wy * uz, vy = wz * ux - wx * uz, vz = -wy * ux;
    if (m.panel) {
      // boards and scrims are real objects: they block light, and white ones glow with what reaches them
      const p = { c: pos, n: [wx, wy, wz], u: [ux, 0, uz], v: [vx, vy, vz], ha: m.panel[0], hb: m.panel[1], kind: l.mod === "vblack" ? "black" : l.mod === "scrim" ? "scrim" : "white", E: [0, 0, 0] };
      panels.push(p); later.push({ p, l, src });
      return;
    }
    const shape = l.mod === "window" ? "window" : (l.mod === "small" || l.mod === "large") ? "square" : "disc";
    lights.push({ pos, aim: [wx, wy, wz], u: [ux, 0, uz], v: [vx, vy, vz], r: m.r, shape, power, tn, role: l.role, src });
  });
  // what reaches each board: white boards bounce it, scrims let half of it through
  const amb0 = num(S.amb, 0.1);
  for (const it of later) {
    const p = it.p, E = [amb0 * 0.5, amb0 * 0.5, amb0 * 0.5], back = p.kind === "scrim" ? -1 : 1;
    for (const L of lights) {
      let e;
      if (L.sun) e = L.power * Math.max(0, back * (L.dir[0] * p.n[0] + L.dir[1] * p.n[1] + L.dir[2] * p.n[2]));
      else {
        let dx = L.pos[0] - p.c[0], dy = L.pos[1] - p.c[1], dz = L.pos[2] - p.c[2]; const d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2); dx /= d; dy /= d; dz /= d;
        e = L.power * Math.max(0, back * (dx * p.n[0] + dy * p.n[1] + dz * p.n[2])) * Math.max(0, -(dx * L.aim[0] + dy * L.aim[1] + dz * L.aim[2])) / d2;
      }
      E[0] += e * L.tn[0]; E[1] += e * L.tn[1]; E[2] += e * L.tn[2];
    }
    p.E = E;
    if (p.kind === "black") continue;
    const k = p.kind === "scrim" ? 0.5 : 0.85, area = 4 * p.ha * p.hb, Eg = (E[0] + E[1] + E[2]) / 3 || 1e-6;
    lights.push({ pos: p.c, aim: p.n, u: p.u, v: p.v, r: Math.hypot(p.ha, p.hb) * 0.62, ha: p.ha, hb: p.hb, shape: "rect", power: Eg * k * area / Math.PI,
      tn: [E[0] / Eg, E[1] / Eg, E[2] / Eg], role: it.l.role, src: it.src, panel: true });
  }
  const wall = WALLS[S.wall] || WALLS.gray;
  return { layout: S.layout in LAYOUTS ? S.layout : "single", frameW: lay.frameW, hw: lay.hw, frameY: lay.frameY, camD: lay.camD,
    people, wallZ: -wallD, wall: wall.rgb, sky: !!wall.emit, lights, panels,
    amb: num(S.amb, 0.1), ambTop: num(S.ambTop, 0), ambTn: tint(num(S.ambK, 5600)), autoEx: S.autoEx !== false, ex: Math.pow(2, num(S.ex, 0)) };
}

/* The tracer itself. It is written as one self-contained function so the same code can run here
   and inside worker threads (it is turned into a worker script from its own source text). */
function TRACER() {
  "use strict";
  const M_SKIN = 0, M_EYE = 1, M_LASH = 2, M_HAIR = 3, M_TOP = 4, M_SCALP = 5, M_FUZZ = 6;
  const MODELS = {}, CACHE = new Map();
  let META = {};
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function load(buf) {
    const dv = new DataView(buf), hl = dv.getUint32(0, true);
    const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)));
    const base = 4 + hl;
    META = head.meta || {};
    for (const name in head.people) {
      const h = head.people[name];
      const q = new Uint16Array(buf.slice(base + h.pos[0], base + h.pos[0] + h.pos[1] * 2));
      const P = new Float32Array(h.pos[1]);
      for (let i = 0; i < P.length; i++) P[i] = h.lo[i % 3] + q[i] * h.sc[i % 3];
      const tb = buf.slice(base + h.tri[0], base + h.tri[0] + h.tri[1] * (h.wide ? 4 : 2));
      const T = Uint32Array.from(h.wide ? new Uint32Array(tb) : new Uint16Array(tb));
      const M = new Uint8Array(buf.slice(base + h.mat[0], base + h.mat[0] + h.mat[1]));
      const A = new Uint8Array(buf.slice(base + h.att[0], base + h.att[0] + h.att[1]));
      const tq = new Int8Array(buf.slice(base + h.tan[0], base + h.tan[0] + h.tan[1]));
      const TAN = new Float32Array(tq.length); for (let i = 0; i < tq.length; i++) TAN[i] = tq[i] / 127;
      MODELS[name] = { nv: h.nv, nt: h.nt, P, T, M, A, TAN, meta: META[name] || {} };
    }
    return Object.keys(MODELS);
  }

  // A person with the head turned `rel` degrees on the neck, ready to be traced.
  function build(name, rel) {
    const key = name + "|" + rel;
    if (CACHE.has(key)) return CACHE.get(key);
    const m = MODELS[name]; if (!m) return null;
    const nv = m.nv, nt = m.nt, P = new Float32Array(nv * 3), TAN = new Float32Array(nv * 3), N = new Float32Array(nv * 3);
    const PZ = -0.03;                                           // the neck's turning axis
    for (let i = 0; i < nv; i++) {
      const a = rel * Math.PI / 180 * (m.A[i * 4] / 255), c = Math.cos(a), s = Math.sin(a);
      const x = m.P[i * 3], y = m.P[i * 3 + 1], z = m.P[i * 3 + 2] - PZ;
      P[i * 3] = c * x + s * z; P[i * 3 + 1] = y; P[i * 3 + 2] = -s * x + c * z + PZ;
      const tx = m.TAN[i * 3], ty = m.TAN[i * 3 + 1], tz = m.TAN[i * 3 + 2];
      TAN[i * 3] = c * tx + s * tz; TAN[i * 3 + 1] = ty; TAN[i * 3 + 2] = -s * tx + c * tz;
    }
    const T = m.T, E = new Float32Array(nt * 9);
    for (let t = 0; t < nt; t++) {
      const a = T[t * 3] * 3, b = T[t * 3 + 1] * 3, c = T[t * 3 + 2] * 3;
      const e1x = P[b] - P[a], e1y = P[b + 1] - P[a + 1], e1z = P[b + 2] - P[a + 2];
      const e2x = P[c] - P[a], e2y = P[c + 1] - P[a + 1], e2z = P[c + 2] - P[a + 2];
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      for (const v of [a, b, c]) { N[v] += nx; N[v + 1] += ny; N[v + 2] += nz; }
      E[t * 9] = P[a]; E[t * 9 + 1] = P[a + 1]; E[t * 9 + 2] = P[a + 2];
      E[t * 9 + 3] = e1x; E[t * 9 + 4] = e1y; E[t * 9 + 5] = e1z; E[t * 9 + 6] = e2x; E[t * 9 + 7] = e2y; E[t * 9 + 8] = e2z;
    }
    for (let i = 0; i < nv; i++) { const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]) || 1; N[i * 3] /= l; N[i * 3 + 1] /= l; N[i * 3 + 2] /= l; }
    // hair triangles near the tips or the hairline are partly see-through
    const alphaT = new Uint8Array(nt);
    for (let t = 0; t < nt; t++) {
      if (m.M[t] === M_FUZZ) { alphaT[t] = 2; continue; }
      if (m.M[t] !== M_HAIR) continue;
      for (let k = 0; k < 3; k++) { const v = T[t * 3 + k]; if (m.A[v * 4 + 1] > 200 || m.A[v * 4 + 3] < 250) alphaT[t] = 1; }
    }
    const bvh = makeBVH(E, nt);
    let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], P[i * 3 + k]); hi[k] = Math.max(hi[k], P[i * 3 + k]); }
    const eyes = (m.meta.eyes || []).map((e) => { const a = rel * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), z = e[2] - PZ; return [c * e[0] + s * z, e[1], -s * e[0] + c * z + PZ]; });
    const g = { m, P, N, TAN, E, alphaT, bvh, lo, hi, eyes, eyeR: m.meta.eyeR || 0.05 };
    if (CACHE.size > 40) CACHE.delete(CACHE.keys().next().value);
    CACHE.set(key, g);
    return g;
  }

  // A bounding volume hierarchy (binned surface-area split), so each ray tests only a few triangles.
  function makeBVH(E, nt) {
    const cx = new Float32Array(nt * 3), bl = new Float32Array(nt * 3), bh = new Float32Array(nt * 3);
    for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) {
      const a = E[t * 9 + k], b = a + E[t * 9 + 3 + k], c = a + E[t * 9 + 6 + k];
      bl[t * 3 + k] = Math.min(a, b, c); bh[t * 3 + k] = Math.max(a, b, c); cx[t * 3 + k] = (bl[t * 3 + k] + bh[t * 3 + k]) / 2;
    }
    const idx = new Uint32Array(nt); for (let i = 0; i < nt; i++) idx[i] = i;
    const maxN = nt * 2;
    const bmin = new Float32Array(maxN * 3), bmax = new Float32Array(maxN * 3), info = new Int32Array(maxN * 2);
    let count = 1;
    const B = 12, binN = new Int32Array(B), binLo = new Float32Array(B * 3), binHi = new Float32Array(B * 3);
    const stack = [[0, 0, nt]];
    while (stack.length) {
      const [node, start, end] = stack.pop();
      let l0 = 1e9, l1 = 1e9, l2 = 1e9, h0 = -1e9, h1 = -1e9, h2 = -1e9, c0 = 1e9, c1 = 1e9, c2 = 1e9, d0 = -1e9, d1 = -1e9, d2 = -1e9;
      for (let i = start; i < end; i++) {
        const t = idx[i] * 3;
        if (bl[t] < l0) l0 = bl[t]; if (bl[t + 1] < l1) l1 = bl[t + 1]; if (bl[t + 2] < l2) l2 = bl[t + 2];
        if (bh[t] > h0) h0 = bh[t]; if (bh[t + 1] > h1) h1 = bh[t + 1]; if (bh[t + 2] > h2) h2 = bh[t + 2];
        if (cx[t] < c0) c0 = cx[t]; if (cx[t + 1] < c1) c1 = cx[t + 1]; if (cx[t + 2] < c2) c2 = cx[t + 2];
        if (cx[t] > d0) d0 = cx[t]; if (cx[t + 1] > d1) d1 = cx[t + 1]; if (cx[t + 2] > d2) d2 = cx[t + 2];
      }
      bmin[node * 3] = l0; bmin[node * 3 + 1] = l1; bmin[node * 3 + 2] = l2; bmax[node * 3] = h0; bmax[node * 3 + 1] = h1; bmax[node * 3 + 2] = h2;
      const n = end - start;
      if (n <= 4) { info[node * 2] = start; info[node * 2 + 1] = n; continue; }
      const ext = [d0 - c0, d1 - c1, d2 - c2], cmin = [c0, c1, c2];
      let bestCost = Infinity, bestAxis = -1, bestSplit = 0;
      for (let ax = 0; ax < 3; ax++) {
        if (ext[ax] < 1e-7) continue;
        binN.fill(0); binLo.fill(1e9); binHi.fill(-1e9);
        for (let i = start; i < end; i++) {
          const t = idx[i] * 3; let b = Math.floor((cx[t + ax] - cmin[ax]) / ext[ax] * B); if (b >= B) b = B - 1;
          binN[b]++;
          for (let k = 0; k < 3; k++) { if (bl[t + k] < binLo[b * 3 + k]) binLo[b * 3 + k] = bl[t + k]; if (bh[t + k] > binHi[b * 3 + k]) binHi[b * 3 + k] = bh[t + k]; }
        }
        for (let s = 1; s < B; s++) {
          let nl = 0, nr = 0; const lA = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9], rA = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
          for (let b = 0; b < B; b++) {
            const A = b < s ? lA : rA; if (!binN[b]) continue;
            if (b < s) nl += binN[b]; else nr += binN[b];
            for (let k = 0; k < 3; k++) { A[k] = Math.min(A[k], binLo[b * 3 + k]); A[3 + k] = Math.max(A[3 + k], binHi[b * 3 + k]); }
          }
          if (!nl || !nr) continue;
          const area = (A) => { const x = A[3] - A[0], y = A[4] - A[1], z = A[5] - A[2]; return x * y + y * z + z * x; };
          const cost = nl * area(lA) + nr * area(rA);
          if (cost < bestCost) { bestCost = cost; bestAxis = ax; bestSplit = s; }
        }
      }
      let mid;
      if (bestAxis < 0) mid = start + (n >> 1);
      else {
        let i = start, j = end - 1;
        while (i <= j) {
          const t = idx[i] * 3; let b = Math.floor((cx[t + bestAxis] - cmin[bestAxis]) / ext[bestAxis] * B); if (b >= B) b = B - 1;
          if (b < bestSplit) i++; else { const tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp; j--; }
        }
        mid = i;
        if (mid === start || mid === end) mid = start + (n >> 1);
      }
      const left = count; count += 2;
      info[node * 2] = left; info[node * 2 + 1] = 0;
      stack.push([left, start, mid], [left + 1, mid, end]);
    }
    return { bmin, bmax, info, idx };
  }

  // Hair coverage: wispy ends and a soft hairline.
  const hash1 = (x) => { let n = Math.imul((x | 0) ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; };
  function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), q = zf * zf * (3 - 2 * zf);
    const h = (a, b, c) => hash3(xi + a, yi + b, zi + c);
    const x00 = h(0, 0, 0) + (h(1, 0, 0) - h(0, 0, 0)) * u, x10 = h(0, 1, 0) + (h(1, 1, 0) - h(0, 1, 0)) * u;
    const x01 = h(0, 0, 1) + (h(1, 0, 1) - h(0, 0, 1)) * u, x11 = h(0, 1, 1) + (h(1, 1, 1) - h(0, 1, 1)) * u;
    const y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
    return y0 + (y1 - y0) * q;
  }
  function vnoise(x) { const i = Math.floor(x), f = x - i, a = hash1(i), b = hash1(i + 1), s = f * f * (3 - 2 * f); return a + (b - a) * s; }
  function hairCover(g, t, u, v) {
    const T = g.m.T, A = g.m.A, a = T[t * 3] * 4, b = T[t * 3 + 1] * 4, c = T[t * 3 + 2] * 4, w = 1 - u - v;
    if (g.alphaT[t] === 3) { const P = g.P, lx = P[a / 4 * 3] * w + P[b / 4 * 3] * u + P[c / 4 * 3] * v; return vnoise(lx * 2600) > 0.28; }   // separate lashes
    const tip = (A[a + 1] * w + A[b + 1] * u + A[c + 1] * v) / 255;
    const sx = (A[a + 2] * w + A[b + 2] * u + A[c + 2] * v) / 255;
    const edge = (A[a + 3] * w + A[b + 3] * u + A[c + 3] * v) / 255;
    const n = vnoise(sx * 900) * 0.6 + vnoise(sx * 260 + 17) * 0.4;
    if (g.alphaT[t] === 2 && n < 0.62 + 0.25 * vnoise(sx * 61 + 5)) return false;     // loose outer strands: mostly gaps
    if (tip > 0.82 && n < (tip - 0.82) / 0.18 * 1.05) return false;
    if (edge < 0.98 && n > edge * 1.6) return false;
    return true;
  }

  // ---- ray against one person (in that person's own space)
  const STACK = new Int32Array(96);
  let TMIN = 1e-5;
  const HIT = { t: 0, tri: -1, u: 0, v: 0 };
  function traceLocal(g, ox, oy, oz, dx, dy, dz, tmax, any) {
    const { bmin, bmax, info, idx } = g.bvh, E = g.E, aT = g.alphaT;
    const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz;
    let sp = 0, best = tmax, bt = -1, bu = 0, bv = 0;
    STACK[sp++] = 0;
    while (sp) {
      const nd = STACK[--sp];
      let t0 = (bmin[nd * 3] - ox) * ix, t1 = (bmax[nd * 3] - ox) * ix; if (t0 > t1) { const q = t0; t0 = t1; t1 = q; }
      let s0 = (bmin[nd * 3 + 1] - oy) * iy, s1 = (bmax[nd * 3 + 1] - oy) * iy; if (s0 > s1) { const q = s0; s0 = s1; s1 = q; }
      if (s0 > t0) t0 = s0; if (s1 < t1) t1 = s1;
      let r0 = (bmin[nd * 3 + 2] - oz) * iz, r1 = (bmax[nd * 3 + 2] - oz) * iz; if (r0 > r1) { const q = r0; r0 = r1; r1 = q; }
      if (r0 > t0) t0 = r0; if (r1 < t1) t1 = r1;
      if (t0 > t1 || t1 < 0 || t0 > best) continue;
      const cnt = info[nd * 2 + 1];
      if (cnt === 0) { STACK[sp++] = info[nd * 2]; STACK[sp++] = info[nd * 2] + 1; continue; }
      const st = info[nd * 2];
      for (let i = st; i < st + cnt; i++) {
        const t = idx[i], o = t * 9;
        const e1x = E[o + 3], e1y = E[o + 4], e1z = E[o + 5], e2x = E[o + 6], e2y = E[o + 7], e2z = E[o + 8];
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
        const det = e1x * px + e1y * py + e1z * pz;
        if (det > -1e-12 && det < 1e-12) continue;
        const inv = 1 / det, sx = ox - E[o], sy = oy - E[o + 1], sz = oz - E[o + 2];
        const u = (sx * px + sy * py + sz * pz) * inv; if (u < 0 || u > 1) continue;
        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
        const v = (dx * qx + dy * qy + dz * qz) * inv; if (v < 0 || u + v > 1) continue;
        const tt = (e2x * qx + e2y * qy + e2z * qz) * inv;
        if (tt <= TMIN || tt >= best) continue;
        if (aT[t] && !hairCover(g, t, u, v)) continue;
        if (any) return tt;
        best = tt; bt = t; bu = u; bv = v;
      }
    }
    if (bt < 0) return -1;
    HIT.t = best; HIT.tri = bt; HIT.u = bu; HIT.v = bv;
    return best;
  }

  // ---- the scene as the tracer sees it
  function prepare(sc) {
    const inst = [];
    for (const p of sc.people) {
      const g = build(p.model, Math.round(p.rel / 2) * 2); if (!g) continue;
      const a = p.yaw * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), sc_ = p.s || 1;
      const cxl = (g.lo[0] + g.hi[0]) / 2, cyl = (g.lo[1] + g.hi[1]) / 2, czl = (g.lo[2] + g.hi[2]) / 2;
      const r = Math.hypot(g.hi[0] - g.lo[0], g.hi[1] - g.lo[1], g.hi[2] - g.lo[2]) / 2 * sc_;
      inst.push({ g, p, c, s, k: sc_, x: p.x, y: p.y, z: p.z,
        bx: p.x + (c * cxl + s * czl) * sc_, by: p.y + cyl * sc_, bz: p.z + (-s * cxl + c * czl) * sc_, br: r });
    }
    sc._inst = inst;
    // samples spread over each glowing surface, the same for every pixel, turned a little per pixel
    for (const L of sc.lights) {
      if (L.sun) continue;
      const n = 64, pts = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        let a, b;
        if (L.shape === "disc") { const rr = Math.sqrt((i + 0.5) / n) * L.r, ph = i * 2.39996; a = rr * Math.cos(ph); b = rr * Math.sin(ph); }
        else { const fx = ((i * 0.618034) % 1) * 2 - 1, fy = ((i + 0.5) / n) * 2 - 1; a = fx * (L.ha || L.r * 0.886); b = fy * (L.hb || L.r * (L.shape === "window" ? 1.2 : 0.886)); }
        pts[i * 2] = a; pts[i * 2 + 1] = b;
      }
      L.pts = pts;
    }
    return sc;
  }

  function sceneHit(sc, ox, oy, oz, dx, dy, dz, tmax, any, out) {
    let best = tmax, bi = null, btri = -1, bu = 0, bv = 0;
    const I = sc._inst;
    for (let k = 0; k < I.length; k++) {
      const it = I[k];
      const rx = it.bx - ox, ry = it.by - oy, rz = it.bz - oz, tca = rx * dx + ry * dy + rz * dz;
      if (tca < -it.br) continue;
      if (rx * rx + ry * ry + rz * rz - tca * tca > it.br * it.br) continue;
      // into the person's own space
      const qx = ox - it.x, qy = oy - it.y, qz = oz - it.z, ik = 1 / it.k;
      const lox = (it.c * qx - it.s * qz) * ik, loy = qy * ik, loz = (it.s * qx + it.c * qz) * ik;
      const ldx = (it.c * dx - it.s * dz) * ik, ldy = dy * ik, ldz = (it.s * dx + it.c * dz) * ik;
      const t = traceLocal(it.g, lox, loy, loz, ldx, ldy, ldz, best, any);
      if (t > 0) { if (any) return t; best = t; bi = it; btri = HIT.tri; bu = HIT.u; bv = HIT.v; }
    }
    if (any) return -1;
    if (bi) { out.inst = bi; out.tri = btri; out.u = bu; out.v = bv; out.t = best; return best; }
    out.inst = null;
    return -1;
  }
  // the nearest board or scrim along a ray (index), or -1
  function panelHit(sc, ox, oy, oz, dx, dy, dz, tmax) {
    const P = sc.panels; let best = tmax, bi = -1;
    if (!P) return -1;
    for (let i = 0; i < P.length; i++) {
      const p = P[i], den = dx * p.n[0] + dy * p.n[1] + dz * p.n[2];
      if (den > -1e-6 && den < 1e-6) continue;
      const t = ((p.c[0] - ox) * p.n[0] + (p.c[1] - oy) * p.n[1] + (p.c[2] - oz) * p.n[2]) / den;
      if (t <= 0.01 || t >= best) continue;
      const qx = ox + dx * t - p.c[0], qy = oy + dy * t - p.c[1], qz = oz + dz * t - p.c[2];
      if (Math.abs(qx * p.u[0] + qz * p.u[2]) > p.ha || Math.abs(qx * p.v[0] + qy * p.v[1] + qz * p.v[2]) > p.hb) continue;
      best = t; bi = i;
    }
    return bi;
  }
  const blocked = (sc, ox, oy, oz, dx, dy, dz, tmax) => { if (panelHit(sc, ox, oy, oz, dx, dy, dz, tmax) >= 0) return true; TMIN = 0.004; const r = sceneHit(sc, ox, oy, oz, dx, dy, dz, tmax, true, null) > 0; TMIN = 1e-5; return r; };

  // ---- materials
  const HT = { inst: null, tri: -1, u: 0, v: 0, t: 0 };
  const hash3 = (x, y, z) => hash1(Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791));
  // visit a light's 64 sample points in bit-reversed order, so any run of them covers the whole light
  const BR = new Uint8Array(64); for (let i = 0; i < 64; i++) { let r = 0; for (let b = 0; b < 6; b++) r |= ((i >> b) & 1) << (5 - b); BR[i] = r; }
  function lightDirSample(L, idx, rot, ox, oy, oz, out) {
    idx = BR[idx];
    const a0 = L.pts[idx * 2], b0 = L.pts[idx * 2 + 1], cs = Math.cos(rot), sn = Math.sin(rot);
    const a = L.shape === "disc" ? a0 * cs - b0 * sn : a0, b = L.shape === "disc" ? a0 * sn + b0 * cs : b0;
    let dx = L.pos[0] + a * L.u[0] + b * L.v[0] - ox, dy = L.pos[1] + b * L.v[1] - oy, dz = L.pos[2] + a * L.u[2] + b * L.v[2] - oz;
    const d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2);
    out[0] = dx / d; out[1] = dy / d; out[2] = dz / d; out[3] = d; out[4] = d2;
  }
  // where a mirror ray from the eye meets a light's glowing surface: the catchlight
  function mirrorLight(L, ox, oy, oz, rx, ry, rz) {
    const den = rx * L.aim[0] + ry * L.aim[1] + rz * L.aim[2];
    if (den > -1e-4) return 0;
    const t = ((L.pos[0] - ox) * L.aim[0] + (L.pos[1] - oy) * L.aim[1] + (L.pos[2] - oz) * L.aim[2]) / den;
    if (t <= 0) return 0;
    const px = ox + rx * t - L.pos[0], py = oy + ry * t - L.pos[1], pz = oz + rz * t - L.pos[2];
    const a = px * L.u[0] + pz * L.u[2], b = px * L.v[0] + py * L.v[1] + pz * L.v[2];
    if (L.shape === "disc") return a * a + b * b < L.r * L.r ? 1 : 0;
    const ha = L.ha || L.r * 0.886, hb = L.hb || L.r * (L.shape === "window" ? 1.2 : 0.886);
    if (Math.abs(a) > ha || Math.abs(b) > hb) return 0;
    if (L.shape === "window" && (Math.abs(a) < ha * 0.04 || Math.abs(b) < hb * 0.035)) return 0.15;   // the window bars
    return 1;
  }

  const LD = new Float64Array(5);
  // Shade a hit. Writes linear RGB into out, and returns 1 for skin on a face (used for metering).
  function shade(sc, h, rdx, rdy, rdz, pass, spp, aos, px, py, out) {
    const it = h.inst, g = it.g, m = g.m, t = h.tri, T = m.T, A = m.A;
    const ia = T[t * 3], ib = T[t * 3 + 1], ic = T[t * 3 + 2], w = 1 - h.u - h.v;
    const mat = m.M[t];
    // local position and normal
    const lx = g.P[ia * 3] * w + g.P[ib * 3] * h.u + g.P[ic * 3] * h.v;
    const ly = g.P[ia * 3 + 1] * w + g.P[ib * 3 + 1] * h.u + g.P[ic * 3 + 1] * h.v;
    const lz = g.P[ia * 3 + 2] * w + g.P[ib * 3 + 2] * h.u + g.P[ic * 3 + 2] * h.v;
    let nlx = g.N[ia * 3] * w + g.N[ib * 3] * h.u + g.N[ic * 3] * h.v;
    let nly = g.N[ia * 3 + 1] * w + g.N[ib * 3 + 1] * h.u + g.N[ic * 3 + 1] * h.v;
    let nlz = g.N[ia * 3 + 2] * w + g.N[ib * 3 + 2] * h.u + g.N[ic * 3 + 2] * h.v;
    // to world
    const c = it.c, s = it.s, k = it.k;
    const x = it.x + (c * lx + s * lz) * k, y = it.y + ly * k, z = it.z + (-s * lx + c * lz) * k;
    let nx = c * nlx + s * nlz, ny = nly, nz = -s * nlx + c * nlz;
    let nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const vx = -rdx, vy = -rdy, vz = -rdz;
    let facing = nx * vx + ny * vy + nz * vz;
    if (facing < 0 && (mat === M_HAIR || mat === M_FUZZ || mat === M_LASH || mat === M_TOP)) { nx = -nx; ny = -ny; nz = -nz; facing = -facing; }   // thin surfaces: light both sides
    // the surface color
    let ar, ag, ab, spec = 0, rough = 30, wrap = null, hair = false, eye = false, face = 0;
    const pr = it.p;
    if (mat === M_SKIN) {
      const lip = (A[ia * 4 + 1] * w + A[ib * 4 + 1] * h.u + A[ic * 4 + 1] * h.v) / 255;
      const brow = (A[ia * 4 + 2] * w + A[ib * 4 + 2] * h.u + A[ic * 4 + 2] * h.v) / 255;
      const sc_ = (A[ia * 4 + 3] * w + A[ib * 4 + 3] * h.u + A[ic * 4 + 3] * h.v) / 255;      // under the hair
      // texture is painted in the rest pose, so it stays put when the head turns
      const rx = m.P[ia * 3] * w + m.P[ib * 3] * h.u + m.P[ic * 3] * h.v;
      const ry = m.P[ia * 3 + 1] * w + m.P[ib * 3 + 1] * h.u + m.P[ic * 3 + 1] * h.v;
      const rz = m.P[ia * 3 + 2] * w + m.P[ib * 3 + 2] * h.u + m.P[ic * 3 + 2] * h.v;
      ar = pr.skin[0]; ag = pr.skin[1]; ab = pr.skin[2];
      // uneven tone: soft blotches and a little redness here and there
      const m1 = noise3(rx * 42, ry * 42, rz * 42) - 0.5, m2 = noise3(rx * 90 + 7, ry * 90, rz * 90) - 0.5, red = noise3(rx * 24 + 3, ry * 24, rz * 24 + 5) - 0.5;
      ar *= 1 + 0.07 * m1 + 0.035 * m2 + 0.05 * red; ag *= 1 + 0.06 * m1 + 0.03 * m2 - 0.03 * red; ab *= 1 + 0.05 * m1 + 0.03 * m2 - 0.02 * red;
      // warmth in the cheeks, nose and ears
      const ck = Math.max(0, 1 - Math.hypot(Math.abs(rx) - 0.12, (ry + 0.05) * 1.3, (rz - 0.3) * 1.5) / 0.08) + Math.max(0, 1 - Math.hypot(rx, ry + 0.02, rz - 0.42) / 0.055) * 0.7 + (Math.abs(rx) > 0.24 && ry > -0.12 && ry < 0.2 ? 0.6 : 0);
      ar *= 1 + 0.07 * ck; ag *= 1 - 0.06 * ck; ab *= 1 - 0.05 * ck;
      // light freckles across the nose and cheeks
      const fm = rz > 0.24 ? Math.max(0, 1 - Math.hypot(rx / 0.17, (ry + 0.015) / 0.065)) : 0;
      if (fm > 0) { const f = noise3(rx * 170, ry * 170, rz * 170), sp = clamp((f - 0.7) / 0.08, 0, 1) * fm * 0.2; ar *= 1 - sp * 0.8; ag *= 1 - sp; ab *= 1 - sp * 1.15; }
      // around the eyes: a soft shadow under each eye, a touch of warm shadow on the lids
      const EY = m.meta.eyes || [];
      for (let e = 0; e < EY.length; e++) {
        const ex = rx - EY[e][0];
        if (rz < EY[e][2] - 0.03) continue;
        const under = Math.max(0, 1 - Math.hypot(ex / 0.06, (ry - EY[e][1] + 0.05) / 0.022));
        const lid = Math.max(0, 1 - Math.hypot((ex - Math.sign(EY[e][0]) * 0.008) / 0.055, (ry - EY[e][1] - 0.03) / 0.022));
        ar *= 1 - 0.07 * under - 0.12 * lid; ag *= 1 - 0.09 * under - 0.16 * lid; ab *= 1 - 0.04 * under - 0.17 * lid;
      }
      const lw = lip > 0.25 ? Math.min(1, (lip - 0.25) / 0.4) : 0;
      const ll = lw > 0 ? 0.9 + 0.1 * vnoise(rx * 700) : 1;                 // fine lines across the lips
      ar = ar * (1 - lw) + 0.5 * ll * lw; ag = ag * (1 - lw) + 0.2 * ll * lw; ab = ab * (1 - lw) + 0.2 * ll * lw;
      if (brow > 0.05) {
        const fine = 0.55 + 0.45 * vnoise(rx * 900 + ry * 260) * vnoise(ry * 700 - rx * 300 + 9);
        const bw = Math.min(1, brow * 1.6) * fine * 0.85;
        ar = ar * (1 - bw) + pr.hair[0] * 0.7 * bw; ag = ag * (1 - bw) + pr.hair[1] * 0.7 * bw; ab = ab * (1 - bw) + pr.hair[2] * 0.7 * bw;
      }
      if (sc_ > 0) { const q = sc_ * 0.92; ar = ar * (1 - q) + pr.hair[0] * 0.8 * q; ag = ag * (1 - q) + pr.hair[1] * 0.8 * q; ab = ab * (1 - q) + pr.hair[2] * 0.8 * q; }
      // pores: tiny bumps that break up the shine
      const pf = 300, e_ = 1 / (pf * 4), p0 = noise3(rx * pf, ry * pf, rz * pf);
      const gx = (noise3((rx + e_) * pf, ry * pf, rz * pf) - p0) / e_, gy = (noise3(rx * pf, (ry + e_) * pf, rz * pf) - p0) / e_, gz = (noise3(rx * pf, ry * pf, (rz + e_) * pf) - p0) / e_;
      const bk = 0.00022 * (1 - lw * 0.7) * (1 - sc_);
      const bwx = c * gx + s * gz, bwz = -s * gx + c * gz;
      nx -= bk * bwx; ny -= bk * gy; nz -= bk * bwz; nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      facing = nx * vx + ny * vy + nz * vz;
      const tz = ry > 0.14 && rz > 0.3 ? 0.01 : 0, nose = Math.max(0, 1 - Math.hypot(rx, ry + 0.02, rz - 0.42) / 0.05) * 0.012;
      spec = (0.026 + 0.022 * lw + tz + nose) * (0.75 + 0.5 * p0) * (1 - sc_); rough = 24 + 34 * lw;
      wrap = [0.34, 0.15, 0.1];
      face = ly > -0.33 ? 1 : 0;
    } else if (mat === M_SCALP) { ar = pr.hair[0] * 0.9; ag = pr.hair[1] * 0.9; ab = pr.hair[2] * 0.9; }
    else if (mat === M_LASH) { ar = 0.02; ag = 0.014; ab = 0.011; }
    else if (mat === M_TOP) {
      ar = pr.top[0]; ag = pr.top[1]; ab = pr.top[2];
      const kn = 0.94 + 0.06 * vnoise(ly * 220 + lx * 40);
      ar *= kn; ag *= kn; ab *= kn;
    } else if (mat === M_HAIR || mat === M_FUZZ) {
      hair = true;
      const sx = (A[ia * 4 + 2] * w + A[ib * 4 + 2] * h.u + A[ic * 4 + 2] * h.v) / 255;
      const v1 = 0.72 + 0.28 * vnoise(sx * 420) + 0.18 * (vnoise(sx * 90 + 3) - 0.5);
      // sun-kissed strands: a few lighter ribbons, and ends a touch lighter than the roots
      const tipv = (A[ia * 4 + 1] * w + A[ib * 4 + 1] * h.u + A[ic * 4 + 1] * h.v) / 255;
      const ribbon = Math.max(0, vnoise(sx * 55 + 11) - 0.55) * 2.2, lift = 1 + 0.55 * ribbon + 0.25 * tipv;
      ar = pr.hair[0] * v1 * lift * (1 + 0.12 * ribbon); ag = pr.hair[1] * v1 * lift; ab = pr.hair[2] * v1 * lift * (1 - 0.08 * ribbon);
    } else {                                                     // eye
      eye = true;
      let best = 0, bd = 1e9;
      for (let e = 0; e < g.eyes.length; e++) { const E = g.eyes[e], d = (lx - E[0]) ** 2 + (ly - E[1]) ** 2 + (lz - E[2]) ** 2; if (d < bd) { bd = d; best = e; } }
      const E = g.eyes[best] || [0, 0, 0];
      // the eyes look at the camera
      const cl = toLocal(it, 0, 0, sc.camD);
      let gx = cl[0] - E[0], gy = cl[1] - E[1], gz = cl[2] - E[2]; const gl = Math.hypot(gx, gy, gz); gx /= gl; gy /= gl; gz /= gl;
      let qx = lx - E[0], qy = ly - E[1], qz = lz - E[2]; const ql = Math.hypot(qx, qy, qz) || 1;
      const cs = (qx * gx + qy * gy + qz * gz) / ql;
      if (cs > 0.9935) { ar = 0.008; ag = 0.007; ab = 0.007; }
      else if (cs > 0.928) {
        const rr = (1 - cs) / (1 - 0.928), ang = Math.atan2(qy, qx) * 9;
        const fib = 0.75 + 0.25 * vnoise(ang + rr * 3), dark = rr > 0.82 ? 0.45 : 1;
        ar = 0.11 * fib * dark; ag = 0.058 * fib * dark; ab = 0.03 * fib * dark;
      } else { const e2 = clamp((0.928 - cs) * 1.4, 0, 1); ar = 0.72 - 0.1 * e2; ag = 0.66 - 0.1 * e2; ab = 0.62 - 0.1 * e2; }
    }
    if (mat === M_SKIN || mat === M_SCALP || mat === M_EYE || mat === M_LASH) face = mat === M_SKIN ? face : 0;
    // strand direction, for the sheen on hair
    let tx = 0, ty = 0, tz = 0;
    if (hair) {
      const ltx = g.TAN[ia * 3] * w + g.TAN[ib * 3] * h.u + g.TAN[ic * 3] * h.v, lty = g.TAN[ia * 3 + 1] * w + g.TAN[ib * 3 + 1] * h.u + g.TAN[ic * 3 + 1] * h.v, ltz = g.TAN[ia * 3 + 2] * w + g.TAN[ib * 3 + 2] * h.u + g.TAN[ic * 3 + 2] * h.v;
      tx = c * ltx + s * ltz; ty = lty; tz = -s * ltx + c * ltz;
      const d = tx * nx + ty * ny + tz * nz; tx -= d * nx; ty -= d * ny; tz -= d * nz;
      const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    }
    const off = hair ? 0.012 : 0.007;
    const ox = x + nx * off, oy = y + ny * off, oz = z + nz * off;
    const pixRot = hash3(px, py, 7) * 6.2832, pixOff = (hash3(px, py, 3) * 64) | 0;
    let dr = 0, dg = 0, db = 0, sr = 0, sg = 0, sb = 0;
    let lr = 0, lg = 0, lb = 0, sacc = 0;
    // light reaching the surface (diffuse); highlights are added once per light by specTerm
    function lightTerm(cth, dx, dy, dz, wgt) {
      if (wrap) {
        if (cth < -wrap[0]) return;
        lr += Math.max(0, (cth + wrap[0]) / (1 + wrap[0])) * wgt; lg += Math.max(0, (cth + wrap[1]) / (1 + wrap[1])) * wgt; lb += Math.max(0, (cth + wrap[2]) / (1 + wrap[2])) * wgt;
      } else if (hair) {
        const tl = tx * dx + ty * dy + tz * dz, kk = Math.sqrt(Math.max(0, 1 - tl * tl));
        const dif = (Math.max(0, cth) * 0.6 + kk * 0.4 * Math.max(0, cth + 0.3)) * wgt;
        lr += dif; lg += dif; lb += dif;
      } else {
        if (cth <= 0) return;
        const d = cth * wgt; lr += d; lg += d; lb += d;
      }
    }
    // Highlights, worked out toward the middle of the light and widened by how big the light looks
    // (alpha, its angular radius): smooth, and true to the size of the source.
    const wide = (e, alpha) => 2 / (2 / e + alpha * alpha);
    function specTerm(cth, dx, dy, dz, wgt, alpha) {
      let hx = dx + vx, hy = dy + vy, hz = dz + vz; const hl = Math.hypot(hx, hy, hz) || 1; hx /= hl; hy /= hl; hz /= hl;
      if (hair) {
        // two highlights along the strands: a white one and a softer, colored one
        const th = tx * hx + ty * hy + tz * hz, e1 = wide(90, alpha), e2 = wide(22, alpha);
        const s1 = Math.pow(Math.sqrt(Math.max(0, 1 - (th - 0.12) * (th - 0.12))), e1) * Math.min(1, e1 / 90 * 1.4);
        const s2 = Math.pow(Math.sqrt(Math.max(0, 1 - (th + 0.1) * (th + 0.1))), e2) * Math.min(1, e2 / 22 * 1.2);
        sacc += (s1 * 0.12 + s2 * 0.25 * (ar * 4)) * Math.max(0, cth + 0.15) * wgt;
      } else if (spec && cth > 0) {
        const nh = nx * hx + ny * hy + nz * hz;
        if (nh > 0) {
          const fr = spec + (1 - spec) * Math.pow(1 - Math.max(0, facing), 5) * 0.25, e1 = wide(rough, alpha), e2 = wide(rough * 4, alpha);
          sacc += (Math.pow(nh, e1) * (e1 + 8) / 8 * fr * 0.5 + Math.pow(nh, e2) * (e2 + 8) / (rough * 4 + 8) * fr * 1.5) * cth * wgt;
        }
      }
    }
    const lights = sc.lights;
    for (let li = 0; li < lights.length; li++) {
      const L = lights[li];
      let n = 1; lr = 0; lg = 0; lb = 0; sacc = 0;
      if (L.sun) {
        const dx = L.dir[0], dy = L.dir[1], dz = L.dir[2];
        const cth = nx * dx + ny * dy + nz * dz;
        if (cth > 0 && !blocked(sc, ox, oy, oz, dx, dy, dz, 1e5)) {
          lightTerm(cth, dx, dy, dz, 1); specTerm(cth, dx, dy, dz, 1, 0.005);
        }
      } else {
        // big, close sources need more samples to look smooth
        const near = (L.ha ? Math.hypot(L.ha, L.hb) : L.r) / Math.max(0.5, Math.hypot(L.pos[0] - ox, L.pos[1] - oy, L.pos[2] - oz));
        n = spp * Math.min(4, Math.max(1, Math.round(near * 2.5)));
        let vis = 0;
        for (let i = 0; i < n; i++) {
          lightDirSample(L, (pixOff + pass * n + i) & 63, pixRot, ox, oy, oz, LD);
          const dx = LD[0], dy = LD[1], dz = LD[2];
          const cth = nx * dx + ny * dy + nz * dz;
          if (cth <= 0) continue;
          const em = -(dx * L.aim[0] + dy * L.aim[1] + dz * L.aim[2]);       // the light only shines forward
          if (em <= 0) continue;
          if (blocked(sc, ox, oy, oz, dx, dy, dz, LD[3] - 0.02)) continue;
          lightTerm(cth, dx, dy, dz, em / LD[4]); vis++;
        }
        if (vis && (spec || hair)) {
          let cx = L.pos[0] - ox, cy = L.pos[1] - oy, cz = L.pos[2] - oz; const d2 = cx * cx + cy * cy + cz * cz, d = Math.sqrt(d2); cx /= d; cy /= d; cz /= d;
          const em = Math.max(0.05, -(cx * L.aim[0] + cy * L.aim[1] + cz * L.aim[2]));
          specTerm(Math.max(0.02, nx * cx + ny * cy + nz * cz), cx, cy, cz, vis * em / d2, (L.ha ? Math.hypot(L.ha, L.hb) * 0.75 : L.r) / d);
        }
      }
      const e = L.power / n;
      dr += lr * e * L.tn[0]; dg += lg * e * L.tn[1]; db += lb * e * L.tn[2];
      if (sacc) { const q = sacc * e; sr += q * L.tn[0]; sg += q * L.tn[1]; sb += q * L.tn[2]; }
      if (eye) {
        const dn = vx * nx + vy * ny + vz * nz, rx = 2 * dn * nx - vx, ry = 2 * dn * ny - vy, rz = 2 * dn * nz - vz;
        if (L.sun) { if (rx * L.dir[0] + ry * L.dir[1] + rz * L.dir[2] > 0.9996) { sr += 1.2 * L.power * L.tn[0]; sg += 1.2 * L.power * L.tn[1]; sb += 1.2 * L.power * L.tn[2]; } }
        else {
          const hit = mirrorLight(L, ox, oy, oz, rx, ry, rz);
          if (hit) { const q = hit * L.power * 0.12 / Math.max(L.r * L.r, 0.01); sr += q * L.tn[0]; sg += q * L.tn[1]; sb += q * L.tn[2]; }
        }
      }
    }
    // room light or open sky: stronger from above, darker in creases
    let amb = sc.amb * ((1 - sc.ambTop) + sc.ambTop * clamp(0.5 + 0.5 * ny, 0, 1) * 1.6);
    if (amb > 0.003) {
      let tx2, ty2, tz2;
      if (Math.abs(ny) < 0.9) { tx2 = nz; ty2 = 0; tz2 = -nx; } else { tx2 = 1; ty2 = 0; tz2 = 0; }
      const tl = Math.hypot(tx2, ty2, tz2) || 1; tx2 /= tl; ty2 /= tl; tz2 /= tl;
      const bx = ny * tz2 - nz * ty2, by = nz * tx2 - nx * tz2, bz = nx * ty2 - ny * tx2;
      let open = 0;
      for (let i = 0; i < aos; i++) {
        const j = pixOff + pass * aos + i, r1 = ((j * 0.618034) % 1), r2 = (((j * 0.7548777) + hash3(px, py, 11)) % 1);
        const rr = Math.sqrt(r1), ph = r2 * 6.2832, ax = rr * Math.cos(ph), ay = rr * Math.sin(ph), az = Math.sqrt(Math.max(0, 1 - r1));
        const dx = tx2 * ax + bx * ay + nx * az, dy = ty2 * ax + by * ay + ny * az, dz = tz2 * ax + bz * ay + nz * az;
        if (!blocked(sc, ox, oy, oz, dx, dy, dz, 0.6)) { const pi = panelHit(sc, ox, oy, oz, dx, dy, dz, 60); open += pi < 0 ? 1 : sc.panels[pi].kind === "black" ? 0 : sc.panels[pi].kind === "white" ? 0.8 : 0.6; }
      }
      amb *= 0.12 + 0.88 * (open / aos);
    }
    let rr_ = ar * (dr + amb * sc.ambTn[0]) + sr, gg_ = ag * (dg + amb * sc.ambTn[1]) + sg, bb_ = ab * (db + amb * sc.ambTn[2]) + sb;
    if (eye) { const q = amb * 0.05; rr_ += q * sc.ambTn[0]; gg_ += q * sc.ambTn[1]; bb_ += q * sc.ambTn[2]; }
    out[0] = rr_; out[1] = gg_; out[2] = bb_;
    return face;
  }
  function toLocal(it, x, y, z) {
    const qx = x - it.x, qy = y - it.y, qz = z - it.z, ik = 1 / it.k;
    return [(it.c * qx - it.s * qz) * ik, qy * ik, (it.s * qx + it.c * qz) * ik];
  }

  function shadeWall(sc, x, y, z, pass, spp, px, py, out) {
    if (sc.sky) {
      const f = clamp(0.5 + y / 5, 0, 1);
      out[0] = 1.5 * (0.95 * (1 - f) + 0.4 * f); out[1] = 1.5 * (0.5 * (1 - f) + 0.52 * f); out[2] = 1.5 * (0.25 * (1 - f) + 0.7 * f);
      return;
    }
    const ox = x, oy = y, oz = z + 0.01;
    const pixRot = hash3(px, py, 7) * 6.2832, pixOff = (hash3(px, py, 3) * 64) | 0;
    let r = 0, g = 0, b = 0;
    for (const L of sc.lights) {
      if (L.sun) { const cth = L.dir[2]; if (cth > 0 && !blocked(sc, ox, oy, oz, L.dir[0], L.dir[1], L.dir[2], 1e5)) { r += L.power * cth * L.tn[0]; g += L.power * cth * L.tn[1]; b += L.power * cth * L.tn[2]; } continue; }
      let acc = 0;
      for (let i = 0; i < spp; i++) {
        lightDirSample(L, (pixOff + pass * spp + i) & 63, pixRot, ox, oy, oz, LD);
        const cth = LD[2]; if (cth <= 0) continue;
        const em = -(LD[0] * L.aim[0] + LD[1] * L.aim[1] + LD[2] * L.aim[2]); if (em <= 0) continue;
        if (blocked(sc, ox, oy, oz, LD[0], LD[1], LD[2], LD[3] - 0.02)) continue;
        acc += cth * em / LD[4];
      }
      const e = L.power * acc / spp; r += e * L.tn[0]; g += e * L.tn[1]; b += e * L.tn[2];
    }
    const amb = sc.amb * 0.7;
    out[0] = sc.wall[0] * (r + amb * sc.ambTn[0]); out[1] = sc.wall[1] * (g + amb * sc.ambTn[1]); out[2] = sc.wall[2] * (b + amb * sc.ambTn[2]);
  }

  // Render rows y0..y1 of a W x H picture. Returns linear RGB and a face mask.
  const OUT = new Float64Array(3);
  function renderRows(sc, W, H, y0, y1, pass, spp, aos, jit) {
    if (!sc._inst) prepare(sc);
    const rgb = new Float32Array((y1 - y0) * W * 3), mask = new Uint8Array((y1 - y0) * W);
    const fw = sc.frameW, fh = fw * sc.hw, cz = sc.camD;
    for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
      const jx = jit ? hash3(x, y, pass * 2 + 101) : 0.5, jy = jit ? hash3(x, y, pass * 2 + 202) : 0.5;
      const tx = ((x + jx) / W * 2 - 1) * fw * 0.5, ty = sc.frameY + (1 - (y + jy) / H * 2) * fh * 0.5;
      let dx = tx, dy = ty, dz = -cz; const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
      const k = ((y - y0) * W + x);
      const th = sceneHit(sc, 0, 0, cz, dx, dy, dz, 1e9, false, HT);
      const tw = dz < -1e-6 ? (sc.wallZ - cz) / dz : -1;
      const pi = panelHit(sc, 0, 0, cz, dx, dy, dz, Math.min(th > 0 ? th : 1e9, tw > 0 ? tw : 1e9));
      if (pi >= 0) {
        // a board or scrim in the picture
        const p = sc.panels[pi], k = p.kind === "black" ? 0.03 : p.kind === "scrim" ? 0.5 : 0.85;
        OUT[0] = p.E[0] * k; OUT[1] = p.E[1] * k; OUT[2] = p.E[2] * k;
      } else if (th > 0 && (tw < 0 || th < tw)) {
        mask[k] = shade(sc, HT, dx, dy, dz, pass, spp, aos, x, y, OUT) ? 1 : 0;
      } else if (tw > 0) {
        shadeWall(sc, dx * tw, dy * tw, sc.wallZ, pass, spp, x, y, OUT);
      } else { OUT[0] = OUT[1] = OUT[2] = 0; }
      rgb[k * 3] = OUT[0]; rgb[k * 3 + 1] = OUT[1]; rgb[k * 3 + 2] = OUT[2];
    }
    return { rgb, mask };
  }
  return { load, renderRows, prepare, models: () => Object.keys(MODELS), meta: () => META };
}

/* ---- running the tracer: worker threads when available, otherwise small slices on the page */
const TONE = (() => { const t = new Uint8ClampedArray(4096); for (let i = 0; i < 4096; i++) { const c = i / 512; t[i] = Math.round(255 * Math.pow(1 - Math.exp(-1.25 * c), 1 / 2.2)); } return t; })();
const toned = (v) => TONE[Math.min(4095, Math.max(0, (v * 512) | 0))];
const LOCAL = TRACER();
let peopleBuf = null, peopleReady = false, peopleErr = false;
const whenReady = [];
const peopleURL = (() => { try { return new URL("lighting-people.bin.gz", document.currentScript && document.currentScript.src ? document.currentScript.src : location.href).href; } catch (e) { return "lighting-people.bin.gz"; } })();
let peopleAsked = false;
function loadPeople() {
  if (peopleAsked) return; peopleAsked = true;
  fetch(peopleURL).then((r) => {
    if (!r.ok) throw new Error("people " + r.status);
    // the file is gzip-compressed; unpack it unless the server already did
    return r.arrayBuffer().then((b) => {
      const u = new Uint8Array(b, 0, 2);
      if (u[0] !== 0x1f || u[1] !== 0x8b) return b;
      if (typeof DecompressionStream === "undefined") throw new Error("no gzip");
      return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    });
  }).then((buf) => {
    peopleBuf = buf; LOCAL.load(buf.slice(0)); peopleReady = true;
    POOL.init();
    whenReady.splice(0).forEach((f) => f());
  }).catch(() => { peopleErr = true; whenReady.splice(0).forEach((f) => f()); });
}

const POOL = {
  workers: [], idle: [], queue: [], job: null,
  init() {
    if (typeof Worker === "undefined" || !peopleBuf) return;
    try {
      const src = "const T=(" + TRACER.toString() + ")();self.onmessage=(e)=>{const d=e.data;if(d.type==='load'){T.load(d.buf);return;}const r=T.renderRows(d.sc,d.W,d.H,d.y0,d.y1,d.pass,d.spp,d.aos,d.jit);self.postMessage({id:d.id,y0:d.y0,y1:d.y1,rgb:r.rgb,mask:r.mask},[r.rgb.buffer,r.mask.buffer]);};";
      const url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
      const n = Math.max(1, Math.min(6, (navigator.hardwareConcurrency || 4) - 1));
      for (let i = 0; i < n; i++) {
        const w = new Worker(url);
        w.postMessage({ type: "load", buf: peopleBuf.slice(0) });
        w.onmessage = (e) => { POOL.idle.push(w); POOL.done(e.data); POOL.pump(); };
        w.onerror = () => { POOL.broken = true; };
        this.workers.push(w); this.idle.push(w);
      }
    } catch (e) { this.workers = []; this.idle = []; }
  },
  pump() {
    while (this.idle.length && this.queue.length) {
      const t = this.queue.shift(), w = this.idle.pop();
      w.postMessage(t);
    }
  },
  done(r) { const j = this.job; if (j && r.id === j.id) j.got(r); }
};

let jobId = 0;
// Render a picture of scene S into the canvas. Quick draft first, then sharper passes until it settles.
function drawCam(cv, S, final, done) {
  if (!peopleReady) {
    loadPeople();
    const c = cv.getContext("2d"); c.fillStyle = "#1b1b1d"; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = "#9a9aa0"; c.font = "13px system-ui, sans-serif"; c.textAlign = "center";
    c.fillText(peopleErr ? "The 3D model could not load." : "Loading the 3D model…", cv.width / 2, cv.height / 2);
    if (!peopleErr) whenReady.push(() => drawCam(cv, S, final, done));
    return;
  }
  const id = ++jobId, sc = sceneFrom(S);
  const W = final ? cv.width : Math.round(cv.width / 3), H = final ? cv.height : Math.round(cv.height / 3);
  const passes = final ? 16 : 1, spp = final ? 2 : 3, aos = final ? 1 : 3;
  const acc = new Float32Array(W * H * 3), mask = new Uint8Array(W * H);
  let pass = 0, rowsDone = 0, expo = 0;
  const band = Math.max(4, Math.ceil(H / 24));
  const ctx = cv.getContext("2d"), img = ctx.createImageData(W, H);
  const small = final ? null : document.createElement("canvas");
  if (small) { small.width = W; small.height = H; }
  const show = () => {
    if (!expo || pass < 3) {
      // meter: put the average face at a pleasant midtone
      if (sc.autoEx) {
        let sum = 0, n = 0;
        for (let i = 0; i < W * H; i++) if (mask[i]) { sum += 0.2126 * acc[i * 3] + 0.7152 * acc[i * 3 + 1] + 0.0722 * acc[i * 3 + 2]; n++; }
        const mean = n ? sum / n / Math.max(1, pass) : 0.3;
        expo = Math.min(40, Math.max(0.05, 0.3 / Math.max(mean, 0.002))) * sc.ex;
      } else expo = sc.ex;
    }
    const f = expo / Math.max(1, pass), d = img.data;
    for (let i = 0; i < W * H; i++) { d[i * 4] = toned(acc[i * 3] * f); d[i * 4 + 1] = toned(acc[i * 3 + 1] * f); d[i * 4 + 2] = toned(acc[i * 3 + 2] * f); d[i * 4 + 3] = 255; }
    if (small) { small.getContext("2d").putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(small, 0, 0, cv.width, cv.height); }
    else ctx.putImageData(img, 0, 0);
  };
  // the first full-size pass takes extra samples, so the picture is clean from the start
  const tasks = (p) => { const l = [], f = final && p === 0; for (let y = 0; y < H; y += band) l.push({ id, sc, W, H, y0: y, y1: Math.min(H, y + band), pass: p, spp: f ? 5 : spp, aos: f ? 4 : aos, jit: final }); return l; };
  const got = (r) => {
    let k = 0;
    for (let y = r.y0; y < r.y1; y++) for (let x = 0; x < W; x++, k++) {
      const i = y * W + x; acc[i * 3] += r.rgb[k * 3]; acc[i * 3 + 1] += r.rgb[k * 3 + 1]; acc[i * 3 + 2] += r.rgb[k * 3 + 2]; if (r.mask[k]) mask[i] = 1;
    }
    rowsDone += r.y1 - r.y0;
    if (rowsDone >= H) {
      rowsDone = 0; pass++; show();
      if (pass === 1 && done) done();
      if (pass < passes && id === jobId) next();
      else if (pass >= passes && final) { CueLighting.settled = id; if (done) done(); }
    }
  };
  const next = () => {
    if (POOL.workers.length && !POOL.broken) { POOL.queue = tasks(pass); POOL.pump(); }
    else {
      // no threads: render on the page in short slices so it stays responsive
      const list = tasks(pass);
      (function slice() {
        if (id !== jobId) return;
        const t0 = performance.now();
        while (list.length && performance.now() - t0 < 12) { const t = list.shift(); const r = LOCAL.renderRows(t.sc, t.W, t.H, t.y0, t.y1, t.pass, t.spp, t.aos, t.jit); got({ id, y0: t.y0, y1: t.y1, rgb: r.rgb, mask: r.mask }); }
        if (list.length) requestAnimationFrame(slice);
      })();
    }
  };
  POOL.job = { id, got };
  POOL.queue = [];
  next();
}
// For tests: render synchronously and return the pixels.
function renderPixels(S, W, passes) {
  const sc = sceneFrom(S), H = Math.round(W * sc.hw), n = passes || 8;
  const acc = new Float32Array(W * H * 3), face = new Uint8Array(W * H), img = new Uint8ClampedArray(W * H * 4);
  for (let p = 0; p < n; p++) {
    const r = LOCAL.renderRows(sc, W, H, 0, H, p, 2, 2, true);
    for (let i = 0; i < W * H; i++) { acc[i * 3] += r.rgb[i * 3]; acc[i * 3 + 1] += r.rgb[i * 3 + 1]; acc[i * 3 + 2] += r.rgb[i * 3 + 2]; if (r.mask[i]) face[i] = 1; }
  }
  let expo = sc.ex;
  if (sc.autoEx) { let s = 0, k = 0; for (let i = 0; i < W * H; i++) if (face[i]) { s += 0.2126 * acc[i * 3] + 0.7152 * acc[i * 3 + 1] + 0.0722 * acc[i * 3 + 2]; k++; } expo = Math.min(40, Math.max(0.05, 0.3 / Math.max(k ? s / k / n : 0.3, 0.002))) * sc.ex; }
  for (let i = 0; i < W * H; i++) { img[i * 4] = toned(acc[i * 3] * expo / n); img[i * 4 + 1] = toned(acc[i * 3 + 1] * expo / n); img[i * 4 + 2] = toned(acc[i * 3 + 2] * expo / n); img[i * 4 + 3] = 255; }
  return { img, W, H, face, expo };
}
const ready = () => new Promise((res) => { loadPeople(); if (peopleReady || peopleErr) res(peopleReady); else whenReady.push(() => res(peopleReady)); });
window.CueLighting = { renderPixels, PRESETS, MODS, LAYOUTS, sceneFrom, analyse, probeRatio, ready };

/* =====================================================================
   Wording for the controls
   ===================================================================== */
const azText = (az) => { const a = Math.round(az), m = Math.abs(a); if (m < 5) return "straight in front"; if (m > 172) return "directly behind"; return `${m}° ${a < 0 ? "camera left" : "camera right"}${m > 110 ? ", behind" : ""}`; };
const elText = (el) => { const e = Math.round(el); return Math.abs(e) < 3 ? "eye level" : `${Math.abs(e)}° ${e > 0 ? "above" : "below"} eye level`; };
const evText = (ev) => { const v = Math.round(ev * 4) / 4; return v === 0 ? "normal power" : `${v > 0 ? "+" : "−"}${Math.abs(v)} stop${Math.abs(v) === 1 ? "" : "s"} ${v > 0 ? "brighter" : "dimmer"}`; };
const kName = (k) => (COLORS.find((c) => c[0] === k) || [k, k + "K"])[1].toLowerCase();
const turnText = (t) => { const v = Math.round(t); return Math.abs(v) < 3 ? "facing the camera" : `turned ${Math.abs(v)}° toward camera ${v < 0 ? "left" : "right"}`; };
const ambText = (a) => (a < 0.08 ? "very dark" : a < 0.25 ? "dim room" : a < 0.55 ? "bright room" : "open sky");

/* =====================================================================
   What the setup will do
   ===================================================================== */
// Does a ray hit one of the boards or scrims? Returns its kind, or "".
function rayPanel(sc, o, d, tmax) {
  let best = tmax, kind = "";
  for (const p of sc.panels || []) {
    const den = d[0] * p.n[0] + d[1] * p.n[1] + d[2] * p.n[2]; if (Math.abs(den) < 1e-6) continue;
    const t = ((p.c[0] - o[0]) * p.n[0] + (p.c[1] - o[1]) * p.n[1] + (p.c[2] - o[2]) * p.n[2]) / den;
    if (t <= 0.01 || t >= best) continue;
    const q = [o[0] + d[0] * t - p.c[0], o[1] + d[1] * t - p.c[1], o[2] + d[2] * t - p.c[2]];
    if (Math.abs(q[0] * p.u[0] + q[2] * p.u[2]) > p.ha || Math.abs(q[0] * p.v[0] + q[1] * p.v[1] + q[2] * p.v[2]) > p.hb) continue;
    best = t; kind = p.kind;
  }
  return kind;
}
// Measure the light on each cheek of the person nearest the middle, so the ratio matches the picture.
function probeRatio(S) {
  const sc = sceneFrom(S), people = sc.people;
  let best = people[0], bd = 1e9;
  people.forEach((p) => { const d = p.x * p.x + p.z * p.z; if (d < bd) { bd = d; best = p; } });
  const yaw = (best.yaw + best.rel) * DEG, cs = Math.cos(yaw), sn = Math.sin(yaw);
  const A = sc.amb * (1 - sc.ambTop + sc.ambTop * 0.8);
  const cheek = (side) => {
    const lx = side * 0.12, lz = 0.31, px = best.x + cs * lx + sn * lz, py = best.y - 0.05, pz = best.z - sn * lx + cs * lz;
    const nlx = side * 0.6, nlz = 0.8, nx = cs * nlx + sn * nlz, nz = -sn * nlx + cs * nlz;
    let e = 0;
    const o = [px, py, pz];
    for (const Lg of sc.lights) {
      if (Lg.sun) { if (!rayPanel(sc, o, Lg.dir, 1e5)) e += Lg.power * Math.max(0, nx * Lg.dir[0] + nz * Lg.dir[2]); continue; }
      let dx = Lg.pos[0] - px, dy = Lg.pos[1] - py, dz = Lg.pos[2] - pz;
      const d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2); dx /= d; dy /= d; dz /= d;
      if (rayPanel(sc, o, [dx, dy, dz], d - 0.05)) continue;
      e += Lg.power * Math.max(0, nx * dx + nz * dz) * Math.max(0, -(dx * Lg.aim[0] + dy * Lg.aim[1] + dz * Lg.aim[2])) / d2;
    }
    // room light, minus what the black boards soak up
    let open = 0, n = 0;
    for (let i = 0; i < 24; i++) {
      const a = i * 2.39996, r = Math.sqrt((i + 0.5) / 24), lx2 = r * Math.cos(a), ly2 = r * Math.sin(a), lz2 = Math.sqrt(1 - r * r);
      const tx = -nz, tz = nx;                                    // a sideways direction across the cheek
      const d = [tx * lx2 + nx * lz2, ly2, tz * lx2 + nz * lz2];
      const k = rayPanel(sc, o, d, 60); open += !k ? 1 : k === "black" ? 0 : k === "white" ? 0.8 : 0.6; n++;
    }
    return e + A * (0.12 + 0.88 * open / n);
  };
  const a = cheek(-1), b = cheek(1);
  return Math.max(a, b) / Math.max(Math.min(a, b), 0.0001);
}
// How strong each light is at the subject, in the same units the picture uses (boards included, blocked sun excluded).
function strengths(S) {
  const sc = sceneFrom(S), out = (S.lights || []).map(() => 0), aim = (LAYOUTS[S.layout] || LAYOUTS.single).aim;
  for (const L of sc.lights) {
    if (L.src == null) continue;
    if (L.sun) { out[L.src] = rayPanel(sc, aim, L.dir, 1e5) ? 0 : L.power; continue; }
    const d2 = (L.pos[0] - aim[0]) ** 2 + (L.pos[1] - aim[1]) ** 2 + (L.pos[2] - aim[2]) ** 2;
    out[L.src] = L.power / Math.max(d2, 0.5);
  }
  return out;
}
function analyse(S) {
  const lights = S.lights || [], ST = strengths(S), strength = (l) => ST[lights.indexOf(l)] || 0;
  const front = lights.filter((l) => l.role !== "bg" && l.role !== "rim" && l.role !== "flag");
  const A = num(S.amb, 0) * (1 - num(S.ambTop, 0) + num(S.ambTop, 0) * 0.8);
  let key = front.slice().sort((a, b) => strength(b) - strength(a))[0] || null;
  if (key && A > strength(key)) key = null;           // the sky or room is the main light
  const res = { key, warnings: [] };
  const others = front.filter((l) => l !== key).reduce((t, l) => t + strength(l), 0) + A;
  if (!key) {
    const lift = front.reduce((t, l) => t + strength(l), 0);
    res.pattern = A > 0.1 ? `Soft, even light from the ${num(S.ambTop, 0) > 0.5 ? "open sky" : "room"}${lift > 0.05 ? ", lifted by a reflector" : ""}` : "Almost no front light";
    res.ratio = probeRatio(S); res.ratioText = A > 0.1 ? (res.ratio < 1.15 ? "even" : `${Math.round(res.ratio * 10) / 10}:1`) : "none";
    res.mood = A > 0.1 ? "Very even. Shadows are gentle." : "Mostly dark.";
    res.soft = "Very soft";
    res.catchlights = "Catchlights come from whatever bright thing the eyes face: the sky or a window.";
    res.moodShort = "even";
  } else {
    const m = MODS[key.mod] || MODS.small, az = num(key.az, 0), el = num(key.el, 0), turn = num(S.turn, 0);
    const phi = Math.abs(az - turn), aAbs = Math.abs(az), side = az * turn > 0 ? "short lighting, which slims the face" : (Math.abs(turn) >= 3 ? "broad lighting, which widens the face" : "");
    let pat;
    if (key.mod === "sun" && aAbs > 110) pat = "Backlight: the sun is behind your client, so the face needs front fill";
    else if (aAbs > 110) pat = "Backlight from behind";
    else if (el < -8) pat = "Uplight, from below: unusual and eerie";
    else if (el >= 35 && phi < 22) pat = "Butterfly: a small shadow under the nose, glamorous";
    else if (phi >= 78) pat = "Split lighting: one half of the face lit, one in shadow";
    else if (phi >= 40 && el >= 32) pat = "Rembrandt: a small triangle of light on the shadow-side cheek";
    else if (phi >= 58) pat = "Strong side light: deep shape and shadow on the far side of the face";
    else if (phi >= 18 && el >= 10) pat = "Loop: a small shadow from the nose loops toward the cheek";
    else if (phi < 18 && el < 18) pat = "Flat: light straight on, with few shadows";
    else pat = "Side-front light with gentle shape";
    res.pattern = pat + (side && aAbs <= 110 && aAbs >= 20 ? ` (${side})` : "");
    const ratio = probeRatio(S);
    res.ratio = ratio;
    res.ratioText = ratio > 12 ? "12:1 or more" : (ratio < 1.15 ? "1:1" : `${Math.round(ratio * 10) / 10}:1`);
    res.mood = aAbs > 110 ? "Not meaningful for a backlight. Check that the face is lit from the front." : ratio < 1.5 ? "Very even, bright and high key. Few shadows." : ratio < 2.4 ? "Soft and flattering. A little shape in the face." : ratio < 4 ? "Natural modeling. Shadows give the face depth." : ratio < 7 ? "Dramatic. Deep shadows." : "Low key and moody. The shadow side nearly disappears.";
    if (key.mod === "sun") { res.soft = "Hard (the sun is a tiny, far-away source)"; }
    else {
      const ang = 2 * Math.atan(m.r / Math.max(num(key.dist, 5), 0.5)) / DEG;
      res.soft = (ang > 40 ? "Very soft" : ang > 22 ? "Soft" : ang > 10 ? "Medium" : "Hard") + ` (the light looks about ${Math.round(ang)}° wide from your client)`;
    }
    if (aAbs <= 110 && el > -12) {
      const x = Math.sin(az * DEG) * Math.cos(el * DEG), y = Math.sin(el * DEG);
      const clock = Math.round(((Math.atan2(x, y) / (2 * Math.PI)) * 12 + 12) % 12) || 12;
      const shape = key.mod === "bare" ? "a small bright dot" : key.mod === "umbrella" ? "a round patch" : key.mod === "beautydish" ? "a round ring" : key.mod === "sun" ? "a tiny point" : key.mod === "window" ? "a window-shaped patch with panes" : key.mod === "scrim" ? "a big soft square" : key.mod === "vwhite" ? "a tall white panel" : "a square or rectangular patch";
      res.catchlights = `Catchlights in the eyes at about ${clock} o'clock, shaped like ${shape}.`;
    } else res.catchlights = "A light this far behind makes no catchlights in the eyes.";
    res.moodShort = res.ratioText;
    // helpful warnings
    if (el < -8 && key.mod !== "reflector") res.warnings.push("Light from below can look eerie, like a flashlight under the chin. Raise it above the eyes.");
    if (front.length > 1 && strength(front.filter((l) => l !== key).sort((a, b) => strength(b) - strength(a))[0] || { mod: "x", ev: -9, dist: 12 }) > strength(key) * 1.05) res.warnings.push("Your fill is brighter than your key, so it is really the key.");
    if (aAbs > 110) res.warnings.push("Most of the light is behind your client. Add a reflector or fill in front, or the face will go dark.");
    if (key.mod !== "sun" && num(key.dist, 5) < 2.6 && m.r < 1) res.warnings.push("A small light this close is uneven: the nose gets far more than the ears. Step it back.");
    if (S.layout === "group" && key.mod !== "sun" && num(key.dist, 5) < 6) res.warnings.push("For a group, move the lights back and up so the front row is not much brighter than the back.");
    if (num(S.wallD, 5) < 2.6 && m.r < 1.2) res.warnings.push("Your client is close to the wall, so the shadow lands on it. Move them forward.");
    const sunL = lights.find((l) => l.mod === "sun");
    if (sunL && key === sunL && num(sunL.el, 0) > 50) res.warnings.push("High sun makes dark eye sockets and squinting. Find shade, turn your client so the sun is behind them, or add a scrim.");
  }
  return res;
}

/* =====================================================================
   State
   ===================================================================== */
const NEWLIGHT = { key: L("key", "large", -35, 28, 5, 0), fill: L("fill", "reflector", 40, 0, 3.5, -1.5), rim: L("rim", "small", 150, 35, 5, -0.5), bg: L("bg", "small", -70, 12, 4, -1), sun: L("sun", "sun", 140, 20, 9, 0.5, 3500),
  vwhite: L("fill", "vwhite", 65, -8, 3.5, 0), vblack: L("flag", "vblack", 65, -8, 3, 0), scrim: L("scrim", "scrim", 25, 55, 2.8, 0) };
const ADDS = [["key", "Key"], ["fill", "Fill"], ["rim", "Rim"], ["bg", "Background"], ["sun", "Sun (outdoors)"], ["vwhite", "White V-flat"], ["vblack", "Black V-flat"], ["scrim", "Scrim"]];
let LT = (() => {
  const saved = store.get("lt", null);
  try { if (saved && saved.s && saved.s.lights && saved.s.lights.length && PRESETS.some((p) => p.id === saved.preset)) return saved; } catch (e) { /* use the default */ }
  return { preset: "headshot", s: clone(PRESETS[0].s), sel: 0, mode: null };
})();
const sel = () => (LT.sel = clamp(Math.round(LT.sel || 0), 0, LT.s.lights.length - 1));
const mode = () => LT.mode || (window.innerWidth >= 560 ? "both" : "top");
let saveTimer = 0;
const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set("lt", LT), 250); };
function applyPreset(id) { const m = LT.mode; LT = { preset: id, s: clone(presetOf(id).s), sel: 0, mode: m }; persist(); }
const edited = () => JSON.stringify(LT.s) !== JSON.stringify(presetOf(LT.preset).s);
function lightName(i) {
  const l = LT.s.lights[i], kind = (x) => (isPanel(x) ? x.mod : x.role), same = LT.s.lights.filter((x) => kind(x) === kind(l));
  return (isPanel(l) ? MODS[l.mod].name : (ROLES[l.role] || ROLES.fill).label) + (same.length > 1 ? " " + (same.indexOf(l) + 1) : "");
}

/* =====================================================================
   The top-down picture
   ===================================================================== */
const CX = 200, CY = 190, SC = 20;
const CAMW = Math.min(400, Math.max(300, Math.round(Math.min(window.innerWidth, 560) * Math.min(window.devicePixelRatio || 1, 2) * 0.62 / 20) * 20));
function lightGeom(S, l) {
  const az = num(l.az, 0) * DEG, el = num(l.el, 0) * DEG;
  let x, y;
  if (l.mod === "sun") { x = CX + Math.sin(az) * 8.6 * SC; y = CY + Math.cos(az) * 8.6 * SC; }
  else { const r = clamp(num(l.dist, 5), 1.5, 12) * Math.cos(el); x = CX + Math.sin(az) * r * SC; y = CY + Math.cos(az) * r * SC; }
  x = clamp(x, 16, 384); y = clamp(y, 16, 384);
  const tx = l.role === "bg" ? CX : CX, ty = l.role === "bg" ? CY - clamp(num(S.wallD, 5), 1.5, 15) * SC : CY;
  const rot = Math.atan2(-(tx - x), ty - y) / DEG;
  return { x, y, rot, tx, ty };
}
function iconFor(l) {
  const m = MODS[l.mod] || MODS.small, w = clamp(m.r * SC * 1.05, 8, 34);
  if (l.mod === "sun") return `<circle r="9" class="lt-ic"/>` + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M${(13 * Math.cos(a * DEG)).toFixed(1)} ${(13 * Math.sin(a * DEG)).toFixed(1)}L${(18 * Math.cos(a * DEG)).toFixed(1)} ${(18 * Math.sin(a * DEG)).toFixed(1)}" class="lt-icl"/>`).join("");
  if (l.mod === "bare") return `<circle r="5" class="lt-ic"/><path d="M-4 6L0 12L4 6" class="lt-icl"/>`;
  if (l.mod === "umbrella") return `<path d="M${-w} 7Q0 -24 ${w} 7Z" class="lt-ic"/><path d="M0 -8V-15" class="lt-icl"/>`;
  if (l.mod === "window") return `<rect x="${-w}" y="-3" width="${2 * w}" height="7" class="lt-ic"/><path d="M0 -3V4M${-w / 2} -3V4M${w / 2} -3V4" class="lt-icl"/>`;
  if (l.mod === "reflector") return `<rect x="${-w}" y="-2" width="${2 * w}" height="4" rx="2" class="lt-ic lt-refl"/>`;
  if (l.mod === "vwhite" || l.mod === "vblack") return `<path d="M-19 -6L0 7L19 -6" class="lt-vf${l.mod === "vblack" ? " lt-vfb" : ""}"/>`;
  if (l.mod === "scrim") return `<rect x="-26" y="-2.5" width="52" height="5" rx="1" class="lt-scrim"/>`;
  if (l.mod === "beautydish") return `<path d="M-13 6Q0 -14 13 6Z" class="lt-ic"/><circle cy="0" r="2.5" class="lt-icl"/>`;
  return `<path d="M${-w * 0.45} -9L${w * 0.45} -9L${w} 7L${-w} 7Z" class="lt-ic"/><path d="M${-w} 7H${w}" class="lt-icl"/>`;
}
function topInner(S, selected, small) {
  const lay = LAYOUTS[S.layout] || LAYOUTS.single, wallY = Math.max(16, CY - clamp(num(S.wallD, 5), 1.5, 15) * SC);
  let o = "";
  if (!small) {
    [3, 6, 9].forEach((r) => { o += `<circle cx="${CX}" cy="${CY}" r="${r * SC}" class="lt-ring"/><text x="${CX - r * SC + 5}" y="${CY + 15}" class="lt-tx lt-dim">${r} ft</text>`; });
    o += `<path d="M${CX} ${CY}V372M16 ${CY}H384" class="lt-axis"/><text x="22" y="${CY - 7}" class="lt-tx">camera left</text><text x="378" y="${CY - 7}" class="lt-tx lt-end">camera right</text>`;
  }
  o += `<rect x="14" y="${wallY - 4}" width="372" height="8" rx="3" class="lt-wall"/>` + (small ? "" : `<text x="22" y="${wallY - 9}" class="lt-tx">Background wall</text>`);
  const fw = Math.min(180, lay.frameW / 2 * SC);
  o += `<path d="M${CX} 366L${CX - fw} ${CY - 18}M${CX} 366L${CX + fw} ${CY - 18}" class="lt-cone"/>`;
  o += `<g transform="translate(${CX} 374)"><rect x="-14" y="-8" width="28" height="16" rx="3" class="lt-camb"/><circle cy="0" r="5" class="lt-lens"/></g>` + (small ? "" : `<text x="${CX + 22}" y="378" class="lt-tx">Camera</text>`);
  // beams first, so people and lights sit on top
  S.lights.forEach((l, i) => {
    const g = lightGeom(S, l), c = ROLES[l.role].color, wd = l.mod === "sun" ? 0 : clamp((MODS[l.mod] || MODS.small).r * SC * 0.8, 4, 24);
    if (l.mod === "sun") { for (let k = -1; k <= 1; k++) o += `<path d="M${(g.x + k * 14 * Math.cos(g.rot * DEG)).toFixed(1)} ${(g.y + k * 14 * Math.sin(g.rot * DEG)).toFixed(1)}L${(CX + k * 14 * Math.cos(g.rot * DEG)).toFixed(1)} ${(CY + k * 14 * Math.sin(g.rot * DEG)).toFixed(1)}" stroke="${c}" class="lt-sunray"/>`; }
    else o += `<polygon points="${g.x.toFixed(1)},${g.y.toFixed(1)} ${(g.tx - wd - 4).toFixed(1)},${g.ty.toFixed(1)} ${(g.tx + wd + 4).toFixed(1)},${g.ty.toFixed(1)}" fill="${c}" class="lt-beam"/>`;
  });
  // people, seen from above
  sceneFrom(S).people.forEach((p) => {
    const px = CX + p.x * SC, py = CY + p.z * SC, big = S.layout !== "group";
    o += `<g transform="translate(${px} ${py}) rotate(${-p.yaw})"><ellipse cy="-1" rx="${big ? 15 : 11}" ry="${big ? (p.model === "expecting" ? 8 : 5.6) : 4.6}" class="lt-body"/></g>`;
    o += `<g transform="translate(${px} ${py}) rotate(${-(p.yaw + p.rel)})"><ellipse rx="5.2" ry="6.2" class="lt-head"/><path d="M-1.6 5.8L0 9.8L1.6 5.8Z" class="lt-nose"/></g>`;
  });
  S.lights.forEach((l, i) => {
    const g = lightGeom(S, l), c = ROLES[l.role].color, on = i === selected && !small;
    o += `<g data-lt-h="${i}" class="lt-h${on ? " sel" : ""}" style="--c:${c}">`;
    if (!small) o += `<circle cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="24" class="lt-hit"/>`;
    if (on) o += `<circle cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="23" class="lt-selring"/>`;
    o += `<g transform="translate(${g.x.toFixed(1)} ${g.y.toFixed(1)}) rotate(${g.rot.toFixed(1)})">${iconFor(l)}</g>`;
    if (!small) {
      const bx = g.x + (g.x - CX) * 0.0 + Math.sin(g.rot * DEG) * 24, by = g.y - Math.cos(g.rot * DEG) * 24;
      o += `<text x="${clamp(bx, 12, 388).toFixed(1)}" y="${clamp(by + 4, 12, 392).toFixed(1)}" class="lt-bd">${ROLES[l.role].letter}<tspan class="lt-el" dx="3">${Math.round(num(l.el, 0)) > 0 ? "↑" : Math.round(num(l.el, 0)) < 0 ? "↓" : ""}${Math.abs(Math.round(num(l.el, 0))) || ""}${Math.round(num(l.el, 0)) ? "°" : ""}</tspan></text>`;
    }
    o += `</g>`;
  });
  return o;
}

/* =====================================================================
   The page
   ===================================================================== */
ICON.lightsetup = '<rect x="3.5" y="4.5" width="11" height="8" rx="1.5"/><path d="M9 12.5v7M5.5 19.5h7M17.5 6.5l3-1.5M17.5 9h3.5M17.5 11.5l3 1.5"/>';
const slider = (key, label, min, max, step, val) => `<div class="lt-sl"><div class="lt-slh"><label class="lbl" for="lt-${key}">${label}</label><b class="lt-o" id="lt-o-${key}"></b></div><input class="range" id="lt-${key}" data-lt-s="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
const sliderText = (key) => {
  const S = LT.s, l = S.lights[sel()] || {};
  switch (key) {
    case "az": return azText(num(l.az, 0));
    case "el": return l.mod === "sun" ? `${Math.round(num(l.el, 0))}° up · ${sunTime(num(l.el, 0))}` : elText(num(l.el, 0));
    case "dist": return `${num(l.dist, 5)} ft away`;
    case "ev": return evText(num(l.ev, 0));
    case "turn": return turnText(num(S.turn, 0));
    case "amb": return ambText(num(S.amb, 0));
    case "wallD": return `${num(S.wallD, 5)} ft behind your client`;
    case "ex": return `${num(S.ex, 0) > 0 ? "+" : ""}${num(S.ex, 0)} stops`;
  }
  return "";
};
const sunTime = (el) => (el < 0 ? "below the horizon" : el < 8 ? "sunrise or sunset" : el < 20 ? "golden hour" : el < 40 ? "morning or late afternoon" : el < 60 ? "mid-morning or mid-afternoon" : "around midday");
function lightControls() {
  const l = LT.s.lights[sel()], sun = l.mod === "sun", cls = ROLES[l.role] || ROLES.fill, opts = MODS_FOR[l.role] || Object.keys(MODS);
  const note = isPanel(l) ? (l.mod === "vblack" ? "It gives no light of its own: it takes light away from the side it is on." : l.mod === "scrim" ? "Its brightness comes from the sun or light behind it, so aim it between that light and your client." : "Its brightness comes from the lights that reach it, so it is strongest close to your client and facing the key.") : "";
  return `<div class="lt-lh"><h3><i class="dot" style="background:${cls.color}"></i>${esc(lightName(sel()))}</h3>${LT.s.lights.length > 1 ? `<button class="btn ghost sm" data-lt-del>Remove</button>` : ""}</div>
    <p class="small muted">${esc((MODS[l.mod] || MODS.small).hint)}</p>
    ${note ? `<p class="small">${esc(note)}</p>` : ""}
    ${opts.length > 1 ? `<div class="lbl">${isPanel(l) ? "Kind" : "Shaper"}</div>${chips("lt-mod", l.mod, opts.map((k) => [k, MODS[k].name]))}` : ""}
    ${slider("az", sun ? "Where the sun is" : "Direction", -180, 180, 1, num(l.az, 0))}
    ${slider("el", sun ? "How high the sun is" : "Height", sun ? 0 : -45, 85, 1, num(l.el, 0))}
    ${sun ? "" : slider("dist", "Distance", 2, 9, 0.25, num(l.dist, 5))}
    ${madeLight(l) || l.mod === "reflector" ? slider("ev", sun ? "Strength (clouds to clear sky)" : "Power", -3, 3, 0.25, num(l.ev, 0)) : ""}
    ${madeLight(l) ? `<div class="lbl">Color of the light</div>${chips("lt-k", String(num(l.k, 5600)), COLORS.map((c) => [String(c[0]), c[1]]))}` : ""}`;
}
function picker() {
  const n = LT.s.lights.length;
  return chips("lt-sel", String(sel()), LT.s.lights.map((l, i) => [String(i), lightName(i)]))
    + (n < 6 ? `<div class="lbl" style="margin-top:6px">Add a light or board</div><div class="scroller" role="group">${ADDS.filter(([k]) => k !== "sun" || !LT.s.lights.some((l) => l.mod === "sun")).map(([k, t]) => `<button class="chip" data-lt-add="${k}">+ ${t}</button>`).join("")}</div>` : "");
}
function sceneControls() {
  const S = LT.s;
  return `<h3>The scene</h3>
    <div class="lbl">People</div>${chips("lt-layout", S.layout, Object.keys(LAYOUTS).map((k) => [k, LAYOUTS[k].label]))}
    ${slider("turn", "Head turn", -45, 45, 1, num(S.turn, 0))}
    <div class="lbl">Background</div>${chips("lt-wall", S.wall, Object.keys(WALLS).map((k) => [k, WALLS[k].name]))}
    ${slider("wallD", "Distance to the background", 2, 9, 0.5, num(S.wallD, 5))}
    ${slider("amb", "Room light or open sky", 0, 1, 0.05, num(S.amb, 0))}
    <div class="lbl">Camera exposure</div>${seg("lt-ae", S.autoEx === false ? "manual" : "auto", [["auto", "Auto: meter the face"], ["manual", "Manual"]])}
    ${S.autoEx === false ? slider("ex", "Exposure", -3, 3, 0.25, num(S.ex, 0)) : ""}`;
}
function readHtml() {
  const a = analyse(LT.s), row = (k, v) => `<div class="ghrow"><span class="small muted">${k}</span><b class="lt-rv">${esc(v)}</b></div>`;
  return `<h3>What this setup does</h3>
    ${row("Look", a.pattern)}${row(a.key ? "Key to fill" : "Light ratio", a.ratioText + " · " + a.mood)}${row("Softness", a.soft)}${row("Eyes", a.catchlights)}
    ${a.warnings.length ? `<div class="note"><b>Watch out:</b><ul style="margin:6px 0 0;padding-left:18px">${a.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>` : ""}`;
}
function notesHtml() {
  const p = presetOf(LT.preset);
  return `<h3>${esc(p.name)}${edited() ? ` <span class="small muted">· adjusted</span>` : ""}</h3>
    <p class="small"><b>Use it for:</b> ${esc(p.use)}</p>
    <p class="small"><b>Gear:</b> ${esc(p.gear)}</p>
    <p class="note"><b>Start here:</b> ${esc(p.start)}</p>
    <p class="avoid small"><b>Watch out:</b> ${esc(p.avoid)}</p>
    <p class="small muted">Every room and face is different, so treat the numbers as a starting point and trust your eyes.</p>
    <div class="row"><button class="btn accent sm" data-lt-copy>${ic("copy")}Copy this plan</button>${edited() ? `<button class="btn ghost sm" data-lt-reset>Reset to preset</button>` : ""}</div>`;
}
function viewHtml() {
  const m = mode(), lay = LAYOUTS[LT.s.layout] || LAYOUTS.single;
  const miniTop = `<button class="lt-pip lt-pip-top" data-lt-pip="top" aria-label="Show the top-down view"><svg id="lt-mini" viewBox="0 0 400 400" aria-hidden="true">${topInner(LT.s, sel(), true)}</svg></button>`;
  return `<div class="lt-root lt-m-${m}">
    <div><h2>Lighting setups</h2><p class="muted small" style="margin-top:6px">Pick a situation, then drag the lights around. The top-down view shows where everything is. The camera view shows what the light does to a face.</p></div>
    ${chips("lt-preset", LT.preset, PRESETS.map((p) => [p.id, p.name]))}
    <p class="small muted" id="lt-sub">${esc(presetOf(LT.preset).sub)}</p>
    ${seg("lt-mode", m, [["both", "Both"], ["top", "Top-down"], ["cam", "Camera view"]])}
    <div class="lt-panels">
      <figure class="lt-fig lt-topfig"><figcaption class="eyebrow">Top-down · from above</figcaption>
        <div class="lt-box"><svg id="lt-top" viewBox="0 0 400 400" role="img" aria-label="Top-down view of the lights, your client and the camera">${topInner(LT.s, sel(), false)}</svg>
        <button class="lt-pip lt-pip-cam" data-lt-pip="cam" aria-label="Show the camera view"><canvas id="lt-pip-cam" width="60" height="${Math.round(60 * lay.hw)}"></canvas></button></div>
        <p class="small muted lt-hint">Drag a light to move it. Tap one to change it.</p></figure>
      <figure class="lt-fig lt-camfig"><figcaption class="eyebrow">Camera view · what you would see</figcaption>
        <div class="lt-box"><canvas id="lt-cam" class="lt-cam" width="${CAMW}" height="${Math.round(CAMW * lay.hw)}" role="img" aria-label="Simulated view of how the light falls on your client"></canvas>${miniTop}</div></figure>
    </div>
    <section class="card" id="lt-read">${readHtml()}</section>
    <section class="card"><div id="lt-picker">${picker()}</div></section>
    <section class="card" id="lt-light">${lightControls()}</section>
    <section class="card" id="lt-scene">${sceneControls()}</section>
    <section class="card" id="lt-notes">${notesHtml()}</section>
    <button class="ghline" data-go="light">${ic("light")}<span>Read about window, shade and golden hour light</span></button>
    <button class="ghline" data-go="tools">${ic("compass")}<span>Find where the sun will be</span></button>
  </div>`;
}
VIEWS.lighting = { title: "Lighting setups", render() { return viewHtml(); } };

/* =====================================================================
   Updating the page while you play
   ===================================================================== */
let finalTimer = 0;
function drawCamera(final) {
  const cv = document.getElementById("lt-cam"); if (!cv) return;
  drawCam(cv, LT.s, final, () => {
    const pip = document.getElementById("lt-pip-cam");
    if (pip) { const c = pip.getContext("2d"); c.imageSmoothingEnabled = true; c.drawImage(cv, 0, 0, pip.width, pip.height); }
  });
}
function updateLabels() { document.querySelectorAll(".lt-o").forEach((el) => { el.textContent = sliderText(el.id.slice(5)); }); }
function refresh() {
  const top = document.getElementById("lt-top"); if (top) top.innerHTML = topInner(LT.s, sel(), false);
  const mini = document.getElementById("lt-mini"); if (mini) mini.innerHTML = topInner(LT.s, sel(), true);
  const rd = document.getElementById("lt-read"); if (rd) rd.innerHTML = readHtml();
  const nt = document.getElementById("lt-notes"); if (nt) nt.innerHTML = notesHtml();
  updateLabels();
}
function controls() {
  const a = document.getElementById("lt-picker"), b = document.getElementById("lt-light"), c = document.getElementById("lt-scene");
  if (a) a.innerHTML = picker(); if (b) b.innerHTML = lightControls(); if (c) c.innerHTML = sceneControls();
  updateLabels();
}
function changed(redrawControls) {
  persist(); refresh(); if (redrawControls) controls();
  drawCamera(false);
  clearTimeout(finalTimer); finalTimer = setTimeout(() => drawCamera(true), 220);
}
function initView() {
  const root = document.querySelector(".lt-root"); if (!root || root.dataset.ready) return;
  root.dataset.ready = "1"; updateLabels(); drawCamera(true);
}
new MutationObserver(initView).observe(document.getElementById("app"), { childList: true });

function setLight(key, v) {
  const l = LT.s.lights[sel()], S = LT.s;
  if (key === "az" || key === "el" || key === "dist" || key === "ev") l[key] = v;
  else S[key] = v;
}
function setAz(l, az) { l.az = Math.round(((az + 540) % 360) - 180); }
const svgPoint = (svg, e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
let drag = null;
const appEl = document.getElementById("app");
appEl.addEventListener("pointerdown", (e) => {
  const h = e.target.closest && e.target.closest("[data-lt-h]"); if (!h || h.closest("#lt-mini")) return;
  e.preventDefault();
  const i = Number(h.dataset.ltH), svg = document.getElementById("lt-top");
  if (i !== sel()) { LT.sel = i; controls(); refresh(); }
  drag = { svg, id: e.pointerId };
  try { svg.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
});
appEl.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const l = LT.s.lights[sel()], p = svgPoint(drag.svg, e), rx = (p.x - CX) / SC, rz = (p.y - CY) / SC;
  if (Math.hypot(rx, rz) < 0.4) return;
  setAz(l, Math.atan2(rx, rz) / DEG);
  if (l.mod !== "sun") {
    let d = Math.hypot(rx, rz) / Math.max(0.2, Math.cos(num(l.el, 0) * DEG));
    l.dist = Math.round(clamp(d, 2, 9) * 4) / 4;
  }
  const az = document.getElementById("lt-az"), ds = document.getElementById("lt-dist");
  if (az) az.value = l.az; if (ds && l.dist != null) ds.value = l.dist;
  changed(false);
});
appEl.addEventListener("touchmove", (e) => { if (drag) e.preventDefault(); }, { passive: false });
const endDrag = () => { if (drag) { drag = null; changed(false); } };
appEl.addEventListener("pointerup", endDrag);
appEl.addEventListener("pointercancel", endDrag);

appEl.addEventListener("input", (e) => {
  const el = e.target, k = el.dataset && el.dataset.ltS; if (!k) return;
  setLight(k, Number(el.value)); changed(false);
});
appEl.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("button"); if (!b || !document.querySelector(".lt-root")) return;
  const d = b.dataset;
  if (d.ltPreset) { applyPreset(d.ltPreset); return render(); }
  if (d.ltMode) { LT.mode = d.ltMode; persist(); return render(); }
  if (d.ltPip) { LT.mode = d.ltPip; persist(); return render(); }
  if (d.ltSel !== undefined) { LT.sel = Number(d.ltSel); controls(); refresh(); return; }
  if (d.ltMod) { const l = LT.s.lights[sel()]; l.mod = d.ltMod; if (d.ltMod === "sun") { l.k = 3500; if (l.role !== "sun") l.dist = 9; } if (d.ltMod === "vblack") l.role = "flag"; else if (d.ltMod === "vwhite" && l.role === "flag") l.role = "fill"; changed(true); return; }
  if (d.ltK) { LT.s.lights[sel()].k = Number(d.ltK); changed(true); return; }
  if (d.ltLayout) { LT.s.layout = d.ltLayout; persist(); return render(); }
  if (d.ltWall) { LT.s.wall = d.ltWall; changed(true); return; }
  if (d.ltAe) { LT.s.autoEx = d.ltAe === "auto"; changed(true); return; }
  if (d.ltAdd) { LT.s.lights.push(clone(NEWLIGHT[d.ltAdd])); LT.sel = LT.s.lights.length - 1; changed(true); return; }
  if (d.ltDel !== undefined) { LT.s.lights.splice(sel(), 1); LT.sel = 0; changed(true); return; }
  if (d.ltReset !== undefined) { applyPreset(LT.preset); return render(); }
  if (d.ltCopy !== undefined) {
    const S = LT.s, a = analyse(S), p = presetOf(LT.preset);
    const lines = [`Lighting plan: ${p.name}${edited() ? " (adjusted)" : ""}`, `People: ${LAYOUTS[S.layout].label}, ${turnText(S.turn)}`];
    S.lights.forEach((l, i) => lines.push(`${lightName(i)}: ${MODS[l.mod].name}, ${azText(l.az)}, ${l.mod === "sun" ? `${Math.round(l.el)}° up (${sunTime(l.el)})` : elText(l.el)}${l.mod === "sun" ? "" : `, ${l.dist} ft away`}${madeLight(l) ? `, ${evText(l.ev)}, ${kName(l.k)} light` : ""}`));
    lines.push(`Background: ${WALLS[S.wall].name}, ${S.wallD} ft behind. Room light: ${ambText(S.amb)}.`, `Look: ${a.pattern}. Key to fill ${a.ratioText}. ${a.soft}.`, "Planned in Cue by Echocraft Photography");
    const txt = lines.join("\n");
    navigator.clipboard.writeText(txt).then(() => toast("Copied your lighting plan.")).catch(() => toast("Couldn't copy. Try again."));
  }
});

/* =====================================================================
   Fit into the app: a home tile, a link, and styles
   ===================================================================== */
const homeRender = VIEWS.home.render;
VIEWS.home.render = function () {
  const html = homeRender.apply(this, arguments), t = tile("lighting", "lightsetup", "Lighting setups", "Top-down and camera views of every light");
  return html.indexOf('data-go="lighting"') > -1 ? html : html.replace('<button class="tile" data-go="tools">', t + '<button class="tile" data-go="tools">');
};
const css = document.createElement("style");
css.textContent = `
.lt-root { display: grid; gap: 14px; min-width: 0; }
.lt-panels { display: grid; gap: 12px; }
@media (min-width: 560px) { .lt-m-both .lt-panels { grid-template-columns: 1fr 1fr; align-items: start; } }
.lt-m-top .lt-camfig, .lt-m-cam .lt-topfig { display: none; }
.lt-fig { margin: 0; display: grid; gap: 6px; min-width: 0; }
.lt-box { position: relative; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); overflow: hidden; box-shadow: var(--shadow); }
#lt-top { display: block; width: 100%; height: auto; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
.lt-cam { display: block; width: 100%; height: auto; background: #111; }
.lt-hint { text-align: center; }
.lt-ring { fill: none; stroke: var(--line); stroke-width: 1; }
.lt-axis { stroke: var(--line); stroke-width: 1; stroke-dasharray: 3 5; fill: none; }
.lt-tx { font: 500 12.5px var(--sans); fill: var(--muted); }
.lt-dim { font-size: 11px; opacity: .8; }
.lt-end { text-anchor: end; }
.lt-wall { fill: var(--muted); opacity: .45; }
.lt-cone { fill: none; stroke: var(--muted); stroke-width: 1; stroke-dasharray: 4 4; opacity: .7; }
.lt-camb { fill: var(--ink); }
.lt-lens { fill: var(--surface); stroke: var(--ink); stroke-width: 1.5; }
.lt-body { fill: var(--surface-2); stroke: var(--muted); stroke-width: 1; }
.lt-head { fill: var(--surface); stroke: var(--ink); stroke-width: 1.4; }
.lt-nose { fill: var(--ink); }
.lt-beam { opacity: .17; pointer-events: none; }
.lt-sunray { stroke-width: 2; stroke-dasharray: 2 5; opacity: .75; fill: none; pointer-events: none; }
.lt-ic { fill: var(--c); fill-opacity: .9; stroke: var(--ink); stroke-width: 1.2; stroke-linejoin: round; }
.lt-refl { fill-opacity: .55; stroke-dasharray: 3 2; }
.lt-vf { fill: none; stroke: var(--ink); stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; }
.lt-vf:not(.lt-vfb) { stroke: #fff; filter: drop-shadow(0 0 1px var(--ink)) drop-shadow(0 0 1px var(--ink)); }
.lt-vfb { stroke: #1d1d1f; }
.lt-scrim { fill: #fff; fill-opacity: .75; stroke: var(--ink); stroke-width: 1.2; stroke-dasharray: 4 2; }
.lt-icl { fill: none; stroke: var(--ink); stroke-width: 1.4; stroke-linecap: round; }
.lt-hit { fill: transparent; cursor: grab; touch-action: none; }
.lt-hit:active { cursor: grabbing; }
.lt-h { touch-action: none; }
.lt-selring { fill: none; stroke: var(--c); stroke-width: 2; stroke-dasharray: 4 3; }
.lt-bd { font: 700 15px var(--sans); fill: var(--ink); pointer-events: none; text-anchor: middle; }
.lt-el { font: 600 11px var(--sans); fill: var(--muted); }
.lt-pip { position: absolute; top: 8px; right: 8px; width: 66px; padding: 0; border: 2px solid var(--surface); border-radius: 10px; overflow: hidden; background: #111; cursor: pointer; box-shadow: 0 2px 10px rgba(0, 0, 0, .35); display: none; }
.lt-pip canvas, .lt-pip svg { display: block; width: 100%; height: auto; }
.lt-pip-top { background: var(--surface); }
.lt-m-top .lt-pip-cam { display: block; }
.lt-m-cam .lt-pip-top { display: block; }
.lt-lh { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.lt-lh h3 { display: flex; align-items: center; gap: 8px; }
.lt-sl { display: grid; gap: 4px; }
.lt-slh { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.lt-o { font: 500 14px var(--sans); text-align: right; }
.card .ghrow b.lt-rv { font: 500 15px/1.35 var(--sans); }
.lbl { display: block; }
`;
document.head.appendChild(css);

// Open straight to the tool if the link asks for it, and refresh the home page so the new tile shows.
try {
  let first = location.hash;
  try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.name) first = new URL(nav.name).hash; } catch (e) { /* use the current address */ }
  const hash = first.slice(1);
  if (hash === "lighting" && typeof clientMode !== "undefined" && !clientMode) go("lighting");
  else if (typeof view !== "undefined" && view === "home") render();
} catch (e) { /* the app is not ready, which is fine */ }
window.CueLighting.state = () => LT;

})();
