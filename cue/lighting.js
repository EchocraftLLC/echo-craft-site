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
  umbrella:  { name: "Umbrella", r: 1.6, hint: "Soft and wide. Spills light, which helps for groups." },
  window:    { name: "Window", r: 2.3, hint: "Big, soft and free. Its color and strength change with the weather." },
  reflector: { name: "Reflector", r: 1.5, hint: "Bounces light back into the shadows. It can only give back what the key gives it." },
  sun:       { name: "Direct sun", r: 0, hint: "Hard, strong and far away. Backlight it or soften it with shade." }
};
const ROLES = {
  key:  { label: "Key",        color: "#e3a24a", letter: "K" },
  fill: { label: "Fill",       color: "#5c8fd6", letter: "F" },
  rim:  { label: "Rim",        color: "#a06fd1", letter: "R" },
  bg:   { label: "Background", color: "#4fae77", letter: "B" },
  sun:  { label: "Sun",        color: "#f0b429", letter: "S" }
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
// How the people are arranged. Positions are in feet, with the camera on the +z side.
const LAYOUTS = {
  single: { label: "One person", frameW: 1.9, hw: 1.25, frameY: -0.42, camD: 9, aim: [0, 0, 0],
    people: [{ x: 0, y: 0, z: 0, yaw: 0, full: true }] },
  couple: { label: "Couple", frameW: 3.1, hw: 0.95, frameY: -0.58, camD: 10, aim: [0, -0.1, 0],
    people: [{ x: -0.72, y: 0, z: 0, yaw: 16, full: true }, { x: 0.72, y: 0.05, z: 0.08, yaw: -16, full: true }] },
  group: { label: "Group", frameW: 5.6, hw: 0.8, frameY: -0.32, camD: 14, aim: [0, -0.3, 0],
    people: (() => { const l = []; [[-1.45, -0.7, 0.7, 1.45], [-1.9, -0.95, 0, 0.95, 1.9], [-1.45, -0.7, 0.7, 1.45]].forEach((xs, row) => xs.forEach((x, i) => l.push({ x, y: [0, 0.22, 0.44][row] + (i % 2) * 0.06, z: [1.1, 0, -1.1][row], yaw: x * -3, full: false }))); return l; })() },
  bump:  { label: "Maternity", frameW: 2.0, hw: 1.5, frameY: -0.95, camD: 11, aim: [0, -0.7, 0],
    people: [{ x: 0, y: 0, z: 0, yaw: 32, full: true, bump: true }] }
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
   The simulated scene (a tiny ray tracer, so shadows and soft light are real)
   ===================================================================== */
function ell(cx, cy, cz, a, b, c, yaw, kind, extra) {
  return Object.assign({ cx, cy, cz, ia: 1 / a, ib: 1 / b, ic: 1 / c, cs: Math.cos(yaw), sn: Math.sin(yaw), kind }, extra || {});
}
// A person is a handful of ellipsoids. The head turns by `yaw` (radians): positive turns the nose toward camera right.
function makePerson(spec, turn, full) {
  const yaw = (turn + spec.yaw) * DEG, cs = Math.cos(yaw), sn = Math.sin(yaw);
  const hx = spec.x, hy = spec.y, hz = spec.z;
  const at = (lx, ly, lz) => [hx + cs * lx + sn * lz, hy + ly, hz - sn * lx + cs * lz];
  const by = yaw * 0.4;                                   // the body turns less than the head
  const prims = [];
  const head = at(0, 0, 0);
  prims.push(ell(head[0], head[1], head[2], 0.27, 0.38, 0.33, yaw, "head", { face: true }));
  if (full) {
    let p;
    p = at(0, 0.17, -0.06); prims.push(ell(p[0], p[1], p[2], 0.285, 0.31, 0.35, yaw, "hair", {}));                       // hair volume
    p = at(0, -0.05, 0.345); prims.push(ell(p[0], p[1], p[2], 0.036, 0.08, 0.085, yaw, "skin", { face: true }));        // nose
    p = at(0, 0.13, 0.292); prims.push(ell(p[0], p[1], p[2], 0.19, 0.038, 0.065, yaw, "skin", { face: true }));          // brow
    p = at(-0.14, -0.075, 0.245); prims.push(ell(p[0], p[1], p[2], 0.07, 0.04, 0.05, yaw, "skin", { face: true }));   // cheekbones
    p = at(0.14, -0.075, 0.245); prims.push(ell(p[0], p[1], p[2], 0.07, 0.04, 0.05, yaw, "skin", { face: true }));
    p = at(0, -0.175, 0.30); prims.push(ell(p[0], p[1], p[2], 0.07, 0.024, 0.04, yaw, "lips", { face: true }));          // lips
    p = at(0, -0.30, 0.19); prims.push(ell(p[0], p[1], p[2], 0.095, 0.075, 0.095, yaw, "skin", { face: true }));        // chin
    p = at(-0.27, 0.0, -0.03); prims.push(ell(p[0], p[1], p[2], 0.03, 0.085, 0.055, yaw, "skin", { face: true }));      // ears
    p = at(0.27, 0.0, -0.03); prims.push(ell(p[0], p[1], p[2], 0.03, 0.085, 0.055, yaw, "skin", { face: true }));
    p = at(-0.105, 0.075, 0.285); prims.push(ell(p[0], p[1], p[2], 0.046, 0.046, 0.046, yaw, "eye", { face: true }));  // eyes
    p = at(0.105, 0.075, 0.285); prims.push(ell(p[0], p[1], p[2], 0.046, 0.046, 0.046, yaw, "eye", { face: true }));
    prims.push(ell(hx, hy - 0.52, hz - 0.02, 0.125, 0.24, 0.125, by, "skin", {}));                                      // neck
  }
  if (spec.bump) {
    prims.push(ell(hx, hy - 0.88, hz - 0.04, 0.62, 0.3, 0.27, by, "cloth", {}));                                        // shoulders
    prims.push(ell(hx, hy - 1.55, hz - 0.04, 0.40, 0.95, 0.27, by, "cloth", {}));                                       // torso
    prims.push(ell(hx + Math.sin(by) * 0.34, hy - 1.95, hz - 0.04 + Math.cos(by) * 0.34, 0.36, 0.40, 0.44, by, "cloth", {}));   // the bump
    prims.push(ell(hx, hy - 2.6, hz - 0.04, 0.46, 0.55, 0.30, by, "cloth", {}));                                        // hips
    return { prims, bx: hx, by: hy - 1.4, bz: hz, br: 2.2 };
  }
  if (full) {
    prims.push(ell(hx, hy - 0.92, hz - 0.04, 0.80, 0.32, 0.30, by, "cloth", {}));                                       // shoulders
    prims.push(ell(hx, hy - 1.55, hz - 0.05, 0.72, 0.62, 0.30, by, "cloth", {}));                                       // chest
  } else {
    prims.push(ell(hx, hy - 0.86, hz - 0.04, 0.58, 0.28, 0.26, by, "cloth", {}));
    prims.push(ell(hx, hy - 1.38, hz - 0.05, 0.52, 0.55, 0.26, by, "cloth", {}));
  }
  return { prims, bx: hx, by: hy - 0.85, bz: hz, br: full ? 1.9 : 1.6 };
}

function sceneFrom(S) {
  const lay = LAYOUTS[S.layout] || LAYOUTS.single;
  const people = lay.people.map((p) => makePerson(p, num(S.turn, 0), p.full));
  const wallD = clamp(num(S.wallD, 5), 1.5, 15);
  const aim = lay.aim;
  const lights = [];
  (S.lights || []).forEach((l) => {
    const m = MODS[l.mod] || MODS.small;
    const az = num(l.az, 0) * DEG, el = num(l.el, 0) * DEG, tn = tint(num(l.k, 5600));
    const power = 25 * Math.pow(2, num(l.ev, 0));
    if (l.mod === "sun") {
      const dir = [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
      lights.push({ sun: true, dir, power: 2.4 * Math.pow(2, num(l.ev, 0)), tn, role: l.role });
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
    const n = m.r > 1.2 ? 16 : m.r > 0.4 ? 8 : m.r > 0.2 ? 4 : 1;
    const oa = new Float32Array(n), ob = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const rr = n === 1 ? 0 : Math.sqrt((i + 0.5) / n) * m.r, ph = i * 2.39996;
      oa[i] = rr * Math.cos(ph); ob[i] = rr * Math.sin(ph);
    }
    lights.push({ oa, ob, n, ux, uz, vx, vy, vz, power, tn, aim: [wx, wy, wz], pos, role: l.role, r: m.r });
  });
  const wall = WALLS[S.wall] || WALLS.gray;
  return { lay, people, wallZ: -wallD, wall, lights, amb: num(S.amb, 0.1), ambTop: num(S.ambTop, 0), ambTn: tint(num(S.ambK, 5600)), autoEx: S.autoEx !== false, ex: Math.pow(2, num(S.ex, 0)), expo: 1 };
}

// Intersect a ray with one ellipsoid. Returns the distance, or -1.
function hitPrim(p, ox, oy, oz, dx, dy, dz) {
  const rx = ox - p.cx, ry = oy - p.cy, rz = oz - p.cz;
  const lox = (p.cs * rx - p.sn * rz) * p.ia, loy = ry * p.ib, loz = (p.sn * rx + p.cs * rz) * p.ic;
  const ldx = (p.cs * dx - p.sn * dz) * p.ia, ldy = dy * p.ib, ldz = (p.sn * dx + p.cs * dz) * p.ic;
  const a = ldx * ldx + ldy * ldy + ldz * ldz, b = lox * ldx + loy * ldy + loz * ldz, c = lox * lox + loy * loy + loz * loz - 1;
  const disc = b * b - a * c;
  if (disc < 0) return -1;
  const sq = Math.sqrt(disc);
  let t = (-b - sq) / a;
  if (t < 1e-4) { t = (-b + sq) / a; if (t < 1e-4) return -1; }
  return t;
}
function hitBound(P, ox, oy, oz, dx, dy, dz) {
  const rx = P.bx - ox, ry = P.by - oy, rz = P.bz - oz, tca = rx * dx + ry * dy + rz * dz;
  const d2 = rx * rx + ry * ry + rz * rz - tca * tca;
  return d2 <= P.br * P.br && (tca > -P.br);
}
// Does anything block the segment from o along d for length tmax?
function blocked(sc, ox, oy, oz, dx, dy, dz, tmax) {
  const ps = sc.people;
  for (let i = 0; i < ps.length; i++) {
    const P = ps[i];
    if (!hitBound(P, ox, oy, oz, dx, dy, dz)) continue;
    const pr = P.prims;
    for (let j = 0; j < pr.length; j++) { const t = hitPrim(pr[j], ox, oy, oz, dx, dy, dz); if (t > 0 && t < tmax) return true; }
  }
  return false;
}
// The nearest thing a ray hits. Fills `h` with the point, normal and material, and returns true.
function nearest(sc, ox, oy, oz, dx, dy, dz, h) {
  let best = 1e9, bp = null;
  const ps = sc.people;
  for (let i = 0; i < ps.length; i++) {
    const P = ps[i];
    if (!hitBound(P, ox, oy, oz, dx, dy, dz)) continue;
    const pr = P.prims;
    for (let j = 0; j < pr.length; j++) { const t = hitPrim(pr[j], ox, oy, oz, dx, dy, dz); if (t > 0 && t < best) { best = t; bp = pr[j]; } }
  }
  const tw = dz < -1e-6 ? (sc.wallZ - oz) / dz : -1;
  if (bp && (tw < 0 || best < tw)) {
    h.t = best; h.x = ox + dx * best; h.y = oy + dy * best; h.z = oz + dz * best;
    const rx = h.x - bp.cx, ry = h.y - bp.cy, rz = h.z - bp.cz;
    const lx = bp.cs * rx - bp.sn * rz, ly = ry, lz = bp.sn * rx + bp.cs * rz;
    const nlx = lx * bp.ia * bp.ia, nly = ly * bp.ib * bp.ib, nlz = lz * bp.ic * bp.ic;
    let nx = bp.cs * nlx + bp.sn * nlz, ny = nly, nz = -bp.sn * nlx + bp.cs * nlz;
    const nl = Math.hypot(nx, ny, nz) || 1;
    h.nx = nx / nl; h.ny = ny / nl; h.nz = nz / nl;
    h.kind = bp.kind; h.face = !!bp.face;
    h.u = lx * bp.ia; h.v = ly * bp.ib; h.w = lz * bp.ic;       // position on the unit ellipsoid
    return true;
  }
  if (tw > 0) { h.t = tw; h.x = ox + dx * tw; h.y = oy + dy * tw; h.z = sc.wallZ; h.nx = 0; h.ny = 0; h.nz = 1; h.kind = "wall"; h.face = false; return true; }
  return false;
}

const LIPS = [0.55, 0.30, 0.28], SKIN = [0.70, 0.50, 0.40], HAIR = [0.065, 0.048, 0.04], CLOTH = [0.17, 0.18, 0.21], BUMPCLOTH = [0.42, 0.34, 0.30], IRIS = [0.06, 0.035, 0.025];
// Six fixed directions around a normal, used to darken tight creases (eye sockets, under the nose).
const AO_DIRS = [[0.0, 0.0, 1], [0.7, 0, 0.7], [-0.7, 0, 0.7], [0, 0.7, 0.7], [0, -0.7, 0.7], [0.5, 0.5, 0.7]];

// The color of one hit, in linear light (before exposure).
function shade(sc, h, vx, vy, vz, out, samples) {
  let alb = SKIN, spec = 0.06, hairMix = 0;
  if (h.kind === "head") {
    hairMix = Math.max(clamp((h.v - 0.42) / 0.14, 0, 1), (h.w < -0.25 && h.v > -0.5) ? clamp((-h.w - 0.25) / 0.2, 0, 1) : 0);
    spec = 0.06 * (1 - hairMix) + 0.03 * hairMix;
  } else if (h.kind === "hair") { alb = HAIR; spec = 0.03; }
  else if (h.kind === "lips") { alb = LIPS; spec = 0.08; }
  else if (h.kind === "eye") { alb = IRIS; spec = 0; }
  else if (h.kind === "cloth") { alb = sc.lay === LAYOUTS.bump ? BUMPCLOTH : CLOTH; spec = 0.0; }
  else if (h.kind === "wall") { alb = sc.wall.rgb; spec = 0; }
  let ar = alb[0], ag = alb[1], ab = alb[2];
  if (hairMix > 0) { ar = ar * (1 - hairMix) + HAIR[0] * hairMix; ag = ag * (1 - hairMix) + HAIR[1] * hairMix; ab = ab * (1 - hairMix) + HAIR[2] * hairMix; }
  if (h.kind === "wall" && sc.wall.emit) {            // a glowing evening sky: a warm horizon fading up to blue
    const f = clamp(0.5 + h.y / 5, 0, 1);
    out[0] = 1.5 * (0.95 * (1 - f) + 0.4 * f); out[1] = 1.5 * (0.5 * (1 - f) + 0.52 * f); out[2] = 1.5 * (0.25 * (1 - f) + 0.7 * f);
    return;
  }
  const ox = h.x + h.nx * 0.012, oy = h.y + h.ny * 0.012, oz = h.z + h.nz * 0.012;
  let r = 0, g = 0, b = 0, sr = 0, sg = 0, sb = 0;
  const lights = sc.lights, eyeSpec = h.kind === "eye", twist = (h.jit || 0) * 6.2832, cph = Math.cos(twist), sph = Math.sin(twist);
  for (let li = 0; li < lights.length; li++) {
    const Lg = lights[li];
    if (Lg.sun) {
      const c = h.nx * Lg.dir[0] + h.ny * Lg.dir[1] + h.nz * Lg.dir[2];
      if (c <= 0) continue;
      if (blocked(sc, ox, oy, oz, Lg.dir[0], Lg.dir[1], Lg.dir[2], 1e5)) continue;
      const e = Lg.power * c;
      r += e * Lg.tn[0]; g += e * Lg.tn[1]; b += e * Lg.tn[2];
      if (spec) { const hx = Lg.dir[0] + vx, hy = Lg.dir[1] + vy, hz = Lg.dir[2] + vz, hl = Math.hypot(hx, hy, hz) || 1, nh = (h.nx * hx + h.ny * hy + h.nz * hz) / hl; if (nh > 0) { const s = Math.pow(nh, 30) * spec * Lg.power * c; sr += s * Lg.tn[0]; sg += s * Lg.tn[1]; sb += s * Lg.tn[2]; } }
      continue;
    }
    const n = h.kind === "wall" ? Math.min(Lg.n, 12) : (samples > 0 ? Math.min(Lg.n, samples) : Lg.n);
    const step = Lg.n / n;
    let acc = 0, specAcc = 0;
    for (let i = 0; i < n; i++) {
      const k = Math.floor(i * step), a0 = Lg.oa[k], b0 = Lg.ob[k], a = a0 * cph - b0 * sph, b = a0 * sph + b0 * cph;
      let dx = Lg.pos[0] + a * Lg.ux + b * Lg.vx - ox, dy = Lg.pos[1] + b * Lg.vy - oy, dz = Lg.pos[2] + a * Lg.uz + b * Lg.vz - oz;
      const d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2);
      dx /= d; dy /= d; dz /= d;
      const c = h.nx * dx + h.ny * dy + h.nz * dz;
      if (c <= 0) continue;
      const em = -(dx * Lg.aim[0] + dy * Lg.aim[1] + dz * Lg.aim[2]);       // the light only shines forward
      if (em <= 0) continue;
      if (blocked(sc, ox, oy, oz, dx, dy, dz, d - 0.02)) continue;
      acc += c * em / d2;
      if (eyeSpec) {
        // a mirror reflection of the light in the eye: the catchlight
        const dn = vx * h.nx + vy * h.ny + vz * h.nz;
        const rx = 2 * dn * h.nx - vx, ry = 2 * dn * h.ny - vy, rz = 2 * dn * h.nz - vz;
        if (rx * dx + ry * dy + rz * dz > 0.9965) specAcc += 6 * em / d2;
      } else if (spec) {
        const hx = dx + vx, hy = dy + vy, hz = dz + vz, hl = Math.hypot(hx, hy, hz) || 1, nh = (h.nx * hx + h.ny * hy + h.nz * hz) / hl;
        if (nh > 0) specAcc += Math.pow(nh, 30) * c * em / d2;
      }
    }
    const e = Lg.power * acc / n;
    r += e * Lg.tn[0]; g += e * Lg.tn[1]; b += e * Lg.tn[2];
    if (specAcc) { const s = (eyeSpec ? Lg.power * specAcc / n * 3 : spec * Lg.power * specAcc / n); sr += s * Lg.tn[0]; sg += s * Lg.tn[1]; sb += s * Lg.tn[2]; }
  }
  // Room light or open sky, stronger from above, and darker in tight creases.
  let amb = sc.amb * ((1 - sc.ambTop) + sc.ambTop * clamp(0.5 + 0.5 * h.ny, 0, 1) * 1.6);
  if (h.kind !== "wall" && amb > 0.005) {
    let open = 0;
    // build a frame around the normal
    let tx, ty, tz;
    if (Math.abs(h.ny) < 0.9) { tx = h.nz; ty = 0; tz = -h.nx; } else { tx = 1; ty = 0; tz = 0; }
    const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const bx = h.ny * tz - h.nz * ty, by = h.nz * tx - h.nx * tz, bz = h.nx * ty - h.ny * tx;
    for (let i = 0; i < AO_DIRS.length; i++) {
      const a = AO_DIRS[i];
      const dx = tx * a[0] + bx * a[1] + h.nx * a[2], dy = ty * a[0] + by * a[1] + h.ny * a[2], dz = tz * a[0] + bz * a[1] + h.nz * a[2];
      if (!blocked(sc, ox, oy, oz, dx, dy, dz, 0.45)) open++;
    }
    amb *= 0.25 + 0.75 * (open / AO_DIRS.length);
  } else if (h.kind === "wall") amb *= 0.7;
  r += amb * sc.ambTn[0]; g += amb * sc.ambTn[1]; b += amb * sc.ambTn[2];
  out[0] = ar * r + sr; out[1] = ag * g + sg; out[2] = ab * b + sb;
  if (eyeSpec) { out[0] += sr * 0.5; out[1] += sg * 0.5; out[2] += sb * 0.5; }
}

function camRay(sc, px, py, ray) {
  const lay = sc.lay, fw = lay.frameW, fh = fw * lay.hw;
  const tx = px * fw * 0.5, ty = lay.frameY + py * fh * 0.5, cx = 0, cy = 0, cz = lay.camD;
  let dx = tx - cx, dy = ty - cy, dz = 0 - cz; const dl = Math.hypot(dx, dy, dz);
  ray[0] = cx; ray[1] = cy; ray[2] = cz; ray[3] = dx / dl; ray[4] = dy / dl; ray[5] = dz / dl;
}

const jitter = (x, y) => { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
// Metering: pick the exposure that puts an average face at a pleasant midtone.
function meter(sc) {
  if (!sc.autoEx) { sc.expo = sc.ex; return; }
  const ray = [0, 0, 0, 0, 0, 0], h = {}, o = [0, 0, 0];
  let sum = 0, n = 0;
  for (let j = 0; j < 22; j++) for (let i = 0; i < 18; i++) {
    camRay(sc, (i + 0.5) / 18 * 2 - 1, 1 - (j + 0.5) / 22 * 2, ray);
    if (!nearest(sc, ray[0], ray[1], ray[2], ray[3], ray[4], ray[5], h) || !h.face) continue;
    h.jit = 0; shade(sc, h, -ray[3], -ray[4], -ray[5], o, 3);
    sum += 0.2126 * o[0] + 0.7152 * o[1] + 0.0722 * o[2]; n++;
  }
  const mean = n ? sum / n : 0.3;
  sc.expo = clamp(0.30 / Math.max(mean, 0.002), 0.05, 40) * sc.ex;
}

// A lookup table for the tone curve: linear light in, display value out.
const TONE = (() => { const t = new Uint8ClampedArray(4096); for (let i = 0; i < 4096; i++) { const c = i / 512; t[i] = Math.round(255 * Math.pow(1 - Math.exp(-1.25 * c), 1 / 2.2)); } return t; })();
const toned = (v) => TONE[Math.min(4095, Math.max(0, (v * 512) | 0))];

let camToken = 0;
// Draw the camera view into a canvas. `final` draws progressively at full detail; otherwise one quick, small pass.
function drawCam(cv, S, final, done) {
  const token = ++camToken, sc = sceneFrom(S);
  meter(sc);
  const W = final ? cv.width : 60, H = final ? cv.height : Math.round(60 * cv.height / cv.width);
  let target = cv, ctx = cv.getContext("2d");
  if (!final) { target = document.createElement("canvas"); target.width = W; target.height = H; ctx = target.getContext("2d"); }
  const img = ctx.createImageData(W, H), data = img.data;
  const ray = [0, 0, 0, 0, 0, 0], h = {}, o = [0, 0, 0];
  let row = 0;
  function pass(deadline) {
    while (row < H && performance.now() < deadline) {
      for (let x = 0; x < W; x++) {
        camRay(sc, (x + 0.5) / W * 2 - 1, 1 - (row + 0.5) / H * 2, ray);
        const k = (row * W + x) * 4;
        if (nearest(sc, ray[0], ray[1], ray[2], ray[3], ray[4], ray[5], h)) {
          h.jit = jitter(x, row); shade(sc, h, -ray[3], -ray[4], -ray[5], o, final ? 0 : 4);
          data[k] = toned(o[0] * sc.expo); data[k + 1] = toned(o[1] * sc.expo); data[k + 2] = toned(o[2] * sc.expo);
        } else { data[k] = data[k + 1] = data[k + 2] = 0; }
        data[k + 3] = 255;
      }
      row++;
    }
  }
  if (!final) {
    pass(Infinity); ctx.putImageData(img, 0, 0);
    const c2 = cv.getContext("2d"); c2.imageSmoothingEnabled = true; c2.drawImage(target, 0, 0, cv.width, cv.height);
    if (done) done();
    return;
  }
  (function frame() {
    if (token !== camToken) return;
    pass(performance.now() + 14);
    ctx.putImageData(img, 0, 0);
    if (row < H) requestAnimationFrame(frame); else if (done) done();
  })();
}
// For tests: render synchronously and return the pixels.
function renderPixels(S, W) {
  const sc = sceneFrom(S); meter(sc);
  const H = Math.round(W * sc.lay.hw), img = new Uint8ClampedArray(W * H * 4), ray = [0, 0, 0, 0, 0, 0], h = {}, o = [0, 0, 0], face = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    camRay(sc, (x + 0.5) / W * 2 - 1, 1 - (y + 0.5) / H * 2, ray);
    const k = (y * W + x) * 4;
    if (nearest(sc, ray[0], ray[1], ray[2], ray[3], ray[4], ray[5], h)) { h.jit = jitter(x, y); shade(sc, h, -ray[3], -ray[4], -ray[5], o, 0); img[k] = toned(o[0] * sc.expo); img[k + 1] = toned(o[1] * sc.expo); img[k + 2] = toned(o[2] * sc.expo); face[y * W + x] = h.face && h.kind !== "eye" ? 1 : 0; }
    img[k + 3] = 255;
  }
  return { img, W, H, face, expo: sc.expo };
}
window.CueLighting = { renderPixels, PRESETS, MODS, LAYOUTS, sceneFrom, analyse, probeRatio };

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
// Measure the light on each cheek of the person nearest the middle, so the ratio matches the picture.
function probeRatio(S) {
  const sc = sceneFrom(S), people = sc.lay.people;
  let best = people[0], bd = 1e9;
  people.forEach((p) => { const d = p.x * p.x + p.z * p.z; if (d < bd) { bd = d; best = p; } });
  const yaw = (num(S.turn, 0) + best.yaw) * DEG, cs = Math.cos(yaw), sn = Math.sin(yaw);
  const A = sc.amb * (1 - sc.ambTop + sc.ambTop * 0.8);
  const cheek = (side) => {
    const lx = side * 0.16, lz = 0.25, px = best.x + cs * lx + sn * lz, py = best.y - 0.06, pz = best.z - sn * lx + cs * lz;
    const nlx = side * 0.6, nlz = 0.8, nx = cs * nlx + sn * nlz, nz = -sn * nlx + cs * nlz;
    let e = 0;
    for (const Lg of sc.lights) {
      if (Lg.sun) { e += Lg.power * Math.max(0, nx * Lg.dir[0] + nz * Lg.dir[2]); continue; }
      let dx = Lg.pos[0] - px, dy = Lg.pos[1] - py, dz = Lg.pos[2] - pz;
      const d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2); dx /= d; dy /= d; dz /= d;
      e += Lg.power * Math.max(0, nx * dx + nz * dz) * Math.max(0, -(dx * Lg.aim[0] + dy * Lg.aim[1] + dz * Lg.aim[2])) / d2;
    }
    return e + A;
  };
  const a = cheek(-1), b = cheek(1);
  return Math.max(a, b) / Math.max(Math.min(a, b), 0.0001);
}
// How strong a light is at the subject, in the same units the picture uses.
const strength = (l) => (l.mod === "sun" ? 2.4 * Math.pow(2, num(l.ev, 0)) : 25 * Math.pow(2, num(l.ev, 0)) / Math.pow(clamp(num(l.dist, 5), 1.5, 12), 2));
function analyse(S) {
  const lights = S.lights || [], front = lights.filter((l) => l.role !== "bg" && l.role !== "rim");
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
    else if (el >= 50 && phi < 22) pat = "Butterfly: a small shadow under the nose, glamorous";
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
      const shape = key.mod === "bare" ? "a small bright dot" : key.mod === "umbrella" ? "a round patch" : key.mod === "sun" ? "a tiny point" : key.mod === "window" ? "a window-shaped patch with panes" : "a square or rectangular patch";
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
  }
  return res;
}

/* =====================================================================
   State
   ===================================================================== */
const NEWLIGHT = { key: L("key", "large", -35, 28, 5, 0), fill: L("fill", "reflector", 40, 0, 3.5, -1.5), rim: L("rim", "small", 150, 35, 5, -0.5), bg: L("bg", "small", -70, 12, 4, -1), sun: L("sun", "sun", 140, 20, 9, 0.5, 3500) };
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
  const l = LT.s.lights[i], same = LT.s.lights.filter((x) => x.role === l.role);
  return ROLES[l.role].label + (same.length > 1 ? " " + (same.indexOf(l) + 1) : "");
}

/* =====================================================================
   The top-down picture
   ===================================================================== */
const CX = 200, CY = 190, SC = 20;
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
  lay.people.forEach((p) => {
    const yaw = num(S.turn, 0) + p.yaw, px = CX + p.x * SC, py = CY + p.z * SC;
    o += `<ellipse cx="${px}" cy="${py - 1}" rx="${p.full ? 15.6 : 10}" ry="${p.full ? 6 : 5}" class="lt-body"/>`;
    o += `<g transform="translate(${px} ${py}) rotate(${-yaw})"><ellipse rx="5.4" ry="6.6" class="lt-head"/><path d="M-1.6 6.2L0 10.2L1.6 6.2Z" class="lt-nose"/></g>`;
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
    case "el": return elText(num(l.el, 0));
    case "dist": return `${num(l.dist, 5)} ft away`;
    case "ev": return evText(num(l.ev, 0));
    case "turn": return turnText(num(S.turn, 0));
    case "amb": return ambText(num(S.amb, 0));
    case "wallD": return `${num(S.wallD, 5)} ft behind your client`;
    case "ex": return `${num(S.ex, 0) > 0 ? "+" : ""}${num(S.ex, 0)} stops`;
  }
  return "";
};
function lightControls() {
  const l = LT.s.lights[sel()], sun = l.mod === "sun", cls = ROLES[l.role];
  return `<div class="lt-lh"><h3><i class="dot" style="background:${cls.color}"></i>${esc(lightName(sel()))}</h3>${LT.s.lights.length > 1 ? `<button class="btn ghost sm" data-lt-del>Remove</button>` : ""}</div>
    <p class="small muted">${esc((MODS[l.mod] || MODS.small).hint)}</p>
    <div class="lbl">Shaper</div>${chips("lt-mod", l.mod, Object.keys(MODS).map((k) => [k, MODS[k].name]))}
    ${slider("az", "Direction", -180, 180, 1, num(l.az, 0))}
    ${slider("el", "Height", -25, 85, 1, num(l.el, 0))}
    ${sun ? "" : slider("dist", "Distance", 2, 9, 0.25, num(l.dist, 5))}
    ${slider("ev", "Power", -3, 3, 0.25, num(l.ev, 0))}
    <div class="lbl">Color of the light</div>${chips("lt-k", String(num(l.k, 5600)), COLORS.map((c) => [String(c[0]), c[1]]))}`;
}
function picker() {
  const n = LT.s.lights.length;
  return chips("lt-sel", String(sel()), LT.s.lights.map((l, i) => [String(i), lightName(i)]))
    + (n < 5 ? `<div class="lbl" style="margin-top:6px">Add a light</div><div class="scroller" role="group">${["key", "fill", "rim", "bg", "sun"].map((r) => `<button class="chip" data-lt-add="${r}">+ ${ROLES[r].label}</button>`).join("")}</div>` : "");
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
        <div class="lt-box"><canvas id="lt-cam" class="lt-cam" width="240" height="${Math.round(240 * lay.hw)}" role="img" aria-label="Simulated view of how the light falls on your client"></canvas>${miniTop}</div></figure>
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
  if (d.ltMod) { const l = LT.s.lights[sel()]; l.mod = d.ltMod; if (d.ltMod === "sun") { l.k = 3500; if (l.role !== "sun") l.dist = 9; } changed(true); return; }
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
    S.lights.forEach((l, i) => lines.push(`${lightName(i)}: ${MODS[l.mod].name}, ${azText(l.az)}, ${elText(l.el)}${l.mod === "sun" ? "" : `, ${l.dist} ft away`}, ${evText(l.ev)}, ${kName(l.k)} light`));
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
