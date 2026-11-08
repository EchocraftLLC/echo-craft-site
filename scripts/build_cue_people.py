#!/usr/bin/env python3
"""Build the 3D people used by Cue's lighting planner (cue/lighting-people.bin).

The bodies come from MakeHuman (https://github.com/makehumancommunity/makehuman), whose
base mesh, shape targets, skeleton and weights are released as CC0 (public domain).
Hair and clothing are generated here. Run it with the path to MakeHuman's data folder:

    git clone --depth 1 https://github.com/makehumancommunity/makehuman /tmp/mh
    git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2      # for the lip shape
    CUE_LIPS_MASK=/tmp/mpfb2/src/mpfb/data/textures/mpfb_lips.jpg \
        python3 scripts/build_cue_people.py /tmp/mh/makehuman/data

It needs numpy (and Pillow for the lip mask). The output is a binary file that cue/lighting.js loads.
"""
import collections
import json
import math
import os
import struct
import sys

import numpy as np

DATA = sys.argv[1] if len(sys.argv) > 1 else "makehuman/data"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "cue", "lighting-people.bin")
DM_TO_FT = 0.328084                       # MakeHuman works in decimetres; the planner in feet
EYES_AT = np.array([0.0, 0.075, 0.285])   # where the eyes sit relative to the head origin (feet)

# Materials, shared with cue/lighting.js
M_SKIN, M_EYE, M_LASH, M_HAIR, M_TOP, M_SCALP, M_FUZZ = 0, 1, 2, 3, 4, 5, 6


# ---------------------------------------------------------------- reading MakeHuman files
def load_obj(path):
    verts, uvs, faces = [], [], []
    group = None
    for line in open(path):
        if line.startswith("v "):
            verts.append([float(x) for x in line.split()[1:4]])
        elif line.startswith("vt "):
            uvs.append([float(x) for x in line.split()[1:3]])
        elif line.startswith("g "):
            group = line.split()[1]
        elif line.startswith("f "):
            vi, ti = [], []
            for tok in line.split()[1:]:
                p = tok.split("/")
                vi.append(int(p[0]) - 1)
                ti.append(int(p[1]) - 1 if len(p) > 1 and p[1] else -1)
            faces.append((vi, ti, group))
    return np.array(verts), np.array(uvs), faces


def load_target(name):
    path = os.path.join(DATA, "targets", name + ".target")
    idx, d = [], []
    for line in open(path):
        if line.startswith("#") or not line.strip():
            continue
        p = line.split()
        idx.append(int(p[0]))
        d.append([float(p[1]), float(p[2]), float(p[3])])
    return np.array(idx, dtype=int), np.array(d).reshape(-1, 3)


def apply_targets(base, weights):
    v = base.copy()
    for name, w in weights.items():
        if abs(w) < 1e-6:
            continue
        idx, d = load_target(name)
        if len(idx):
            v[idx] += w * d
    return v


def macro_weights(gender, age_years, races):
    """MakeHuman's macro system: race x gender x age targets. Age 25 is 'young', 90 is 'old'."""
    old = min(max((age_years - 25.0) / 65.0, 0.0), 1.0)
    ages = {"young": 1.0 - old, "old": old}
    out = {}
    for race, rw in races.items():
        for age, aw in ages.items():
            out["macrodetails/%s-%s-%s" % (race, gender, age)] = rw * aw
    for age, aw in ages.items():
        out["macrodetails/universal-%s-%s-averagemuscle-averageweight" % (gender, age)] = aw
    return out


# ---------------------------------------------------------------- posing (arms down, relaxed)
SKEL = json.load(open(os.path.join(DATA, "rigs", "default.mhskel")))
WEIGHTS = json.load(open(os.path.join(DATA, "rigs", "default_weights.mhw")))["weights"]
BONES = SKEL["bones"]


def joint(v, name):
    return v[SKEL["joints"][name]].mean(axis=0)


def children(bone):
    out = [bone]
    for k, b in BONES.items():
        if b["parent"] == bone:
            out += children(k)
    return out


def rot(axis, ang):
    axis = axis / np.linalg.norm(axis)
    x, y, z = axis
    c, s, C = math.cos(ang), math.sin(ang), 1 - math.cos(ang)
    return np.array([[c + x * x * C, x * y * C - z * s, x * z * C + y * s],
                     [y * x * C + z * s, c + y * y * C, y * z * C - x * s],
                     [z * x * C - y * s, z * y * C + x * s, c + z * z * C]])


def rot_between(a, b):
    a = a / np.linalg.norm(a)
    b = b / np.linalg.norm(b)
    ax = np.cross(a, b)
    s = np.linalg.norm(ax)
    if s < 1e-8:
        return np.eye(3)
    return rot(ax, math.atan2(s, float(np.dot(a, b))))


def pose(v, spec_twist=0.0):
    """Linear blend skinning with MakeHuman's skeleton: bring the arms down by the sides."""
    n = len(v)
    head = {b: joint(v, BONES[b]["head"]) for b in BONES}
    local = {}
    for side, sx in (("L", 1), ("R", -1)):
        sh, el, wr = head["upperarm01." + side], head["lowerarm01." + side], head["wrist." + side]
        if np.sign(sh[0]) != sx:
            sx = -sx
        want = np.array([0.16 * sx, -1.0, -0.04])
        R = rot_between(el - sh, want)
        # share the motion between the collarbone, the shoulder and the upper arm so the shoulder keeps its shape
        axis_ang = R
        ang = math.acos(max(-1, min(1, (np.trace(axis_ang) - 1) / 2)))
        ax = np.array([R[2, 1] - R[1, 2], R[0, 2] - R[2, 0], R[1, 0] - R[0, 1]])
        local["clavicle." + side] = rot(ax, ang * 0.10)
        local["shoulder01." + side] = rot(ax, ang * 0.15)
        local["upperarm01." + side] = rot(ax, ang * 0.75)
        # a soft bend at the elbow, and the forearm turned so the palms face the thighs
        fa = head["wrist." + side] - head["lowerarm01." + side]
        tw = spec_twist * sx
        local["lowerarm01." + side] = rot(fa, tw * 0.5) @ rot(np.array([1.0, 0, 0]), -0.12)
        local["lowerarm02." + side] = rot(fa, tw * 0.5)

    glob = {}

    def g(b):
        if b in glob:
            return glob[b]
        par = BONES[b]["parent"]
        PR, Pt = g(par) if par and par in BONES else (np.eye(3), np.zeros(3))
        Rl = local.get(b, np.eye(3))
        h = head[b]
        # world = parent o (rotate about this bone's rest head)
        R = PR @ Rl
        t = PR @ (h - Rl @ h) + Pt
        glob[b] = (R, t)
        return glob[b]

    for b in BONES:
        g(b)
    out = np.zeros_like(v)
    tot = np.zeros(n)
    for b, lst in WEIGHTS.items():
        if b not in glob:
            continue
        R, t = glob[b]
        idx = np.array([i for i, _ in lst])
        w = np.array([x for _, x in lst])
        out[idx] += w[:, None] * (v[idx] @ R.T + t)
        tot[idx] += w
    miss = tot < 1e-6
    out[~miss] /= tot[~miss][:, None]
    out[miss] = v[miss]
    return out


def twist_weight():
    """How much each vertex follows the head when it turns on the neck (0 to 1)."""
    f = {b: 1.0 for b in children("head")}
    f.update({"neck03": 0.85, "neck02": 0.55, "neck01": 0.25})
    n = 19158
    num = np.zeros(n)
    tot = np.zeros(n)
    for b, lst in WEIGHTS.items():
        for i, x in lst:
            num[i] += x * f.get(b, 0.0)
            tot[i] += x
    return np.where(tot > 0, num / np.maximum(tot, 1e-9), 0)




# ---------------------------------------------------------------- geometry helpers
def to_local(v, eye_mid):
    """MakeHuman decimetres -> planner feet, with the eyes where the planner expects them."""
    return (v - eye_mid) * DM_TO_FT + EYES_AT


def tris_of(polys):
    out = []
    for f in polys:
        for k in range(1, len(f) - 1):
            out.append([f[0], f[k], f[k + 1]])
    return np.array(out, dtype=np.int64).reshape(-1, 3)


def vertex_normals(P, tris):
    n = np.zeros_like(P)
    fn = np.cross(P[tris[:, 1]] - P[tris[:, 0]], P[tris[:, 2]] - P[tris[:, 0]])
    for k in range(3):
        np.add.at(n, tris[:, k], fn)
    return n / (np.linalg.norm(n, axis=1, keepdims=True) + 1e-12)


def nearest(a, b, chunk=400):
    d_out = np.zeros(len(a))
    i_out = np.zeros(len(a), dtype=np.int64)
    for i in range(0, len(a), chunk):
        d = ((a[i:i + chunk, None, :] - b[None]) ** 2).sum(-1)
        i_out[i:i + chunk] = d.argmin(1)
        d_out[i:i + chunk] = np.sqrt(d.min(1))
    return d_out, i_out


def interp(x, pts):
    xs, ys = zip(*pts)
    return np.interp(x, xs, ys)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def clip_polys(P, polys, inside, extra=None):
    """Cut polygons along the edge of the region where inside(points) is True.
    New corners are found by bisection along each crossing edge, so the cut is a smooth curve.
    Returns (positions, polygons, is_new). `extra` arrays (per vertex) are interpolated too."""
    P = [p for p in P]
    ins = inside(np.asarray(P))
    ex = [list(e) for e in (extra or [])]
    cache = {}
    out = []

    def cross(i, j):
        key = (min(i, j), max(i, j))
        if key in cache:
            return cache[key]
        a, b = (i, j) if ins[i] else (j, i)
        lo, hi = 0.0, 1.0
        for _ in range(22):
            mid = (lo + hi) / 2
            if inside((P[a] + (P[b] - P[a]) * mid)[None])[0]:
                lo = mid
            else:
                hi = mid
        P.append(P[a] + (P[b] - P[a]) * lo)
        for e in ex:
            e.append(e[a] + (e[b] - e[a]) * lo)
        cache[key] = len(P) - 1
        return cache[key]

    for f in polys:
        flags = [bool(ins[i]) for i in f]
        if all(flags):
            out.append(list(f))
            continue
        if not any(flags):
            continue
        poly = []
        n = len(f)
        for k in range(n):
            i, j = f[k], f[(k + 1) % n]
            if flags[k]:
                poly.append(i)
            if flags[k] != flags[(k + 1) % n]:
                poly.append(cross(i, j))
        if len(poly) >= 3:
            out.append(poly)
    ins_all = np.r_[ins, np.ones(len(P) - len(ins), bool)]
    return np.asarray(P), out, [np.asarray(e) for e in ex]


class Part:
    """A batch of triangles with per-vertex attributes, in planner feet."""
    def __init__(self, P, tris, mat, twist=None, a1=None, a2=None, a3=None, tan=None):
        n = len(P)
        self.P = np.asarray(P, float)
        self.tris = np.asarray(tris, np.int64).reshape(-1, 3)
        self.mat = np.full(len(self.tris), mat, np.uint8) if np.isscalar(mat) else np.asarray(mat, np.uint8)
        z = np.zeros(n)
        self.twist = z if twist is None else np.asarray(twist, float)
        self.a1 = z if a1 is None else np.asarray(a1, float)
        self.a2 = z if a2 is None else np.asarray(a2, float)
        self.a3 = z if a3 is None else np.asarray(a3, float)
        self.tan = np.zeros((n, 3)) if tan is None else np.asarray(tan, float)


def compact(P, tris):
    """Keep only the vertices the triangles use. Returns new positions, new triangles and the old indices."""
    used = np.unique(tris)
    remap = -np.ones(len(P), np.int64)
    remap[used] = np.arange(len(used))
    return P[used], remap[tris], used


# ---------------------------------------------------------------- hair
HEAD_C = np.array([0.0, 0.08, 0.02])      # a point inside the head, for azimuths


def azimuth(P):
    """0 straight ahead (toward the camera), 180 behind, in degrees, unsigned."""
    return np.degrees(np.abs(np.arctan2(P[:, 0], P[:, 2] - HEAD_C[2])))


def make_hair(L, body_polys, style, collide):
    """A hair shell over the scalp, plus (for longer styles) a curtain that falls and rests on the shoulders.
    Returns (Part, scalp vertex mask)."""
    tris_all = tris_of(body_polys)
    N = vertex_normals(L, tris_all)
    scalp = smoothstep(-0.004, 0.022, L[:, 1] - interp(azimuth(L), style["hairline"]))   # 0 skin .. 1 under the hair
    line = style.get("shell", style["hairline"])
    L, shell_polys, nn = clip_polys(L, body_polys, lambda Q: Q[:, 1] > interp(azimuth(Q), line), [N[:, 0], N[:, 1], N[:, 2]])
    N = np.stack(nn, 1)
    N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-12
    a = azimuth(L)
    yh = interp(a, line)
    stris = tris_of(shell_polys)
    above = L[:, 1] - yh
    th = style["thick"](L, a)
    taper = np.where(a < 70, np.clip(above / 0.13, 0.1, 1) ** 1.2, np.clip(above / 0.05, 0.4, 1))
    Pshell = L + N * (th * taper)[:, None]
    # which way the strands run on the scalp: away from the part on top, then downward
    part_x = style.get("part", 0.0)
    side = np.where(L[:, 0] >= part_x, 1.0, -1.0)
    lat = smoothstep(-0.05, 0.3, L[:, 1]) * np.clip((L[:, 2] + 0.18) / 0.25, 0, 1)
    F = np.stack([side * (0.2 + 1.2 * lat), -1.0 + 0.6 * lat, 0.25 * lat], 1)
    F -= N * (F * N).sum(1, keepdims=True)
    F /= np.linalg.norm(F, axis=1, keepdims=True) + 1e-9
    beta = np.arctan2(L[:, 2] - HEAD_C[2], L[:, 1] - HEAD_C[1])        # around the ear-to-ear axis
    ushell = (beta / (2 * math.pi)) % 1.0 + side * 0.5
    edge = np.clip(above / 0.055, 0, 1)                                 # 0 at the hairline: soft, see-through edge
    verts, tris, tan, a1, a2, a3, tw = [], [], [], [], [], [], []
    Pv, Tv, used = compact(Pshell, stris)
    base = 0
    verts.append(Pv); tris.append(Tv); tan.append(F[used]); a1.append(np.zeros(len(used)))
    a2.append(ushell[used] % 1.0); a3.append(edge[used]); tw.append(np.ones(len(used)))
    base += len(used)
    shell_index = {int(o): i for i, o in enumerate(used)}

    if style.get("curtain"):
        # the shell's lower edge, as one ordered chain from one temple, around the back, to the other
        E = collections.Counter()
        for f in shell_polys:
            for k in range(len(f)):
                E[tuple(sorted((f[k], f[(k + 1) % len(f)])))] += 1
        bnd = [e for e, c in E.items() if c == 1]
        adj = collections.defaultdict(list)
        for p, q in bnd:
            adj[p].append(q); adj[q].append(p)
        # walk the boundary loop
        start = bnd[0][0]
        loop, prev, cur = [start], None, start
        while True:
            nxt = [q for q in adj[cur] if q != prev]
            if not nxt or nxt[0] == start:
                break
            prev, cur = cur, nxt[0]
            loop.append(cur)
        loop = np.array(loop)
        hang = a[loop] > style["curtain_from"]
        # rotate the loop so the hanging run is contiguous
        k0 = int(np.argmin(hang))
        while hang[k0]:
            k0 = (k0 + 1) % len(loop)
        loop = np.roll(loop, -k0); hang = np.roll(hang, -k0)
        first = int(np.argmax(hang)); last = len(hang) - 1 - int(np.argmax(hang[::-1]))
        chain = loop[first:last + 1]
        # make sure we go from the +x temple to the -x temple
        if L[chain[0], 0] < L[chain[-1], 0]:
            chain = chain[::-1]
        Cp, Cn = collide
        NS = 22
        strands = []
        rng = np.random.default_rng(7)
        nclump = 34
        clump_len = rng.normal(0, 0.02, nclump + 2)
        for ci, idx in enumerate(chain):
            cf = ci / max(1, len(chain) - 1) * nclump
            c0 = int(cf)
            lenvar = clump_len[c0] * (1 - (cf - c0)) + clump_len[c0 + 1] * (cf - c0)
            p = Pshell[idx].copy()
            d = np.array([0.0, -1.0, 0.0])
            out = np.array([L[idx, 0], 0.0, L[idx, 2] - HEAD_C[2]])
            out /= np.linalg.norm(out) + 1e-9
            ytip = float(interp(a[idx], style["length"])) + lenvar + rng.normal(0, 0.004)
            side_pull = style.get("pull", 0.0) * float(smoothstep(60, 80, a[idx]) * (1 - smoothstep(110, 140, a[idx])))
            pts = [p.copy()]
            for step in range(120):
                d = d * 0.55 + np.array([0, -1.0, 0]) * 0.45 + out * style["flare"] - np.array([np.sign(p[0]) * side_pull, 0, 0])
                d /= np.linalg.norm(d)
                p = p + d * 0.02
                dd = ((Cp - p) ** 2).sum(1)
                j = int(dd.argmin())
                gap = float(((p - Cp[j]) * Cn[j]).sum())
                if gap < style["clear"]:
                    p = p + Cn[j] * (style["clear"] - gap)
                pts.append(p.copy())
                if p[1] < ytip:
                    break
            pts = np.array(pts)
            seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
            t = np.linspace(0, seg[-1], NS)
            strands.append(np.stack([np.interp(t, seg, pts[:, c]) for c in range(3)], 1))
        S = np.array(strands)                                   # chain x NS x 3
        nc = len(chain)
        # clumps: a gentle ripple across the hair, stronger toward the ends
        cn = np.zeros_like(S)
        cn[:, :, 0] = S[:, :, 0]; cn[:, :, 2] = S[:, :, 2] - HEAD_C[2]
        cn /= np.linalg.norm(cn, axis=2, keepdims=True) + 1e-9
        ph = np.linspace(0, 1, nc)[:, None] * nclump * 2 * math.pi
        amp = 0.006 + 0.01 * np.linspace(0, 1, NS)[None, :] ** 1.5
        S = S + cn * (amp * np.sin(ph + 0.6 * np.sin(ph * 0.37)))[:, :, None] * (np.arange(NS)[None, :, None] > 0)
        P = S.reshape(-1, 3)
        T = []
        for i in range(nc - 1):
            for j in range(NS - 1):
                p00, p01 = i * NS + j, i * NS + j + 1
                p10, p11 = (i + 1) * NS + j, (i + 1) * NS + j + 1
                T += [[p00, p10, p11], [p00, p11, p01]]
        T = np.array(T)
        # the first row of each strand is the shell's edge vertex: reuse it so the surface is seamless
        Tg = T.copy()
        for i, idx in enumerate(chain):
            r = i * NS
            Tg[T == r] = -1 - shell_index[int(idx)]
        keep = np.array([True] * len(P))
        keep[np.arange(nc) * NS] = False
        newidx = -np.ones(len(P), np.int64)
        newidx[keep] = base + np.arange(keep.sum())
        Tg2 = np.where(Tg < 0, -Tg - 1, newidx[np.maximum(Tg, 0)])
        tg = np.gradient(S, axis=1)
        tg /= np.linalg.norm(tg, axis=2, keepdims=True) + 1e-9
        vv = np.tile(np.linspace(0, 1, NS), nc)
        uu = (np.repeat(np.linspace(0, 1, nc), NS) * 3.0) % 1.0
        verts.append(P[keep]); tris.append(Tg2); tan.append(tg.reshape(-1, 3)[keep])
        a1.append(vv[keep]); a2.append(uu[keep]); a3.append(np.ones(keep.sum()))
        tw.append(1.0 - 0.45 * vv[keep])
    HP, HT = np.concatenate(verts), np.concatenate(tris)
    HTW, HA1, HA2, HA3, HTAN = (np.concatenate(x) for x in (tw, a1, a2, a3, tan))
    # loose outer layers: sparse, see-through strands that soften the outline (drawn as material M_FUZZ)
    HN = vertex_normals(HP, HT)
    outward = HP - HEAD_C
    HN *= np.sign((HN * outward).sum(1))[:, None]
    allP, allT, allM = [HP], [HT], [np.full(len(HT), M_HAIR)]
    lists = [[HTW], [HA1], [HA2], [HA3], [HTAN]]
    for k, d in enumerate(style.get("fuzz", [])):
        allP.append(HP + HN * (d * np.clip(HA3 * 1.4 - 0.4, 0, 1))[:, None]); allT.append(HT + len(HP) * (k + 1)); allM.append(np.full(len(HT), M_FUZZ))
        for lst, arr in zip(lists, (HTW, HA1, (HA2 + 0.37 * (k + 1)) % 1.0, HA3, HTAN)):
            lst.append(arr)
    part = Part(np.concatenate(allP), np.concatenate(allT), np.concatenate(allM), *(np.concatenate(l) for l in lists))
    return part, scalp


HAIR_STYLES = {
    # a long bob that falls to the collarbones, with a soft centre part
    "lob": {
        "hairline": [(0, 0.29), (30, 0.285), (50, 0.245), (66, 0.18), (80, 0.13), (100, 0.10), (130, 0.0), (180, -0.06)],
        "thick": lambda L, a: 0.034 + 0.022 * smoothstep(40, 100, a),
        "shell": [(0, 0.29), (30, 0.285), (50, 0.245), (66, 0.18), (80, 0.16), (100, 0.14), (130, 0.13), (180, 0.12)],
        "curtain": True, "curtain_from": 64, "length": [(60, -0.50), (90, -0.60), (180, -0.66)],
        "flare": 0.04, "clear": 0.03, "part": 0.03, "pull": 0.12, "fuzz": [0.007, 0.014],
    },
    # short, tapered at the sides and back
    "short": {
        "hairline": [(0, 0.335), (30, 0.32), (50, 0.28), (70, 0.2), (85, 0.17), (110, 0.13), (140, 0.0), (180, -0.13)],
        "thick": lambda L, a: 0.01 + 0.03 * smoothstep(0.12, 0.38, L[:, 1]),
        "curtain": False, "part": 0.08, "fuzz": [0.006],
    },
}


# ---------------------------------------------------------------- clothing
def neckline_cut(T, style):
    """True for top vertices that should be cut away (neck and neckline)."""
    x, y, z = T[:, 0], T[:, 1], T[:, 2]
    if style == "scoop":
        front = z > 0.0
        e = (x / 0.30) ** 2 + ((y + 0.42) / 0.30) ** 2 < 1.0
        back = ((x / 0.26) ** 2 + ((y + 0.38) / 0.12) ** 2 < 1.0)
        return (y > -0.40) | (front & e) | (~front & back)
    # crew neck
    front = z > 0.0
    e = (x / 0.21) ** 2 + ((y + 0.43) / 0.1) ** 2 < 1.0
    return (y > -0.43) | (front & e)


# ---------------------------------------------------------------- one person
def build_person(base, uvs, faces, spec, lips_mask):
    v = pose(apply_targets(base, spec["targets"]))
    groups = collections.defaultdict(list)
    uvof = {}
    for vi, ti, g in faces:
        groups[g].append(vi)
        if g == "body":
            for a_, b_ in zip(vi, ti):
                uvof.setdefault(a_, b_)
    le = v[np.unique(np.concatenate(groups["helper-l-eye"]))].mean(0)
    re = v[np.unique(np.concatenate(groups["helper-r-eye"]))].mean(0)
    eye_mid = (le + re) / 2
    L = to_local(v, eye_mid)
    twist = twist_weight()
    cut = spec["cut"]
    body = [f for f in groups["body"] if all(L[i, 1] > cut for i in f)]
    body_v = np.unique(np.concatenate(body))
    # collision points for the hair: neck, shoulders, upper back and chest, ears
    btris = tris_of(body)
    BN = vertex_normals(L, btris)
    cm = np.zeros(len(L), bool)
    cm[body_v] = True
    cm &= (L[:, 1] < 0.25) & (L[:, 1] > -1.1)
    collide = (L[cm], BN[cm])

    parts = []
    hair, scalp = make_hair(L, body, HAIR_STYLES[spec["hair"]], collide)

    # the top
    tights = [f for f in groups["helper-tights"] if all(L[i, 1] > cut for i in f)]
    tv = np.unique(np.concatenate(tights))
    keep_fn = lambda Q: ~neckline_cut(Q, spec["neck"])
    TP, top, _ = clip_polys(L, tights, keep_fn)
    topv = np.unique(np.concatenate(top))
    TN = vertex_normals(TP, tris_of(top))
    TP = TP.copy()
    TP[topv] += TN[topv] * 0.008                                   # a little ease, so skin never pokes through
    # skin hidden under the top
    d_in, _ = nearest(L[body_v], TP[topv])
    removed_t = tv[neckline_cut(L[tv], spec["neck"])]
    d_out, _ = nearest(L[body_v], L[removed_t]) if len(removed_t) else (np.full(len(body_v), 9.0), None)
    covered = np.zeros(len(L), bool)
    covered[body_v] = (d_in < 0.06) & (d_out > 0.07) & (L[body_v, 1] < -0.3)
    skin = [f for f in body if not all(covered[i] for i in f)]

    # skin attributes: lips (from MakeHuman's lip mask) and eyebrows (drawn from the face's own shape)
    lip = np.zeros(len(L))
    if lips_mask is not None:
        H, W = lips_mask.shape
        for i in body_v:
            t = uvof.get(int(i), -1)
            if t >= 0:
                u_, v_ = uvs[t]
                lip[i] = lips_mask[min(H - 1, int((1 - v_) * H)), min(W - 1, int(u_ * W))]
    brow = np.zeros(len(L))
    for s in (-1, 1):
        x = L[:, 0] * s
        # an arch above each eye, thick near the nose and tapering toward the temple
        t = np.clip((x - 0.03) / 0.17, 0, 1)
        yc = 0.128 + 0.024 * np.sin(np.clip(t * 1.25, 0, 1) * math.pi * 0.85) - 0.012 * t
        hw = 0.013 * (1 - 0.5 * t)
        inside = (x > 0.025) & (x < 0.21) & (L[:, 2] > 0.18)
        brow = np.maximum(brow, np.where(inside, np.clip(1 - np.abs(L[:, 1] - yc) / hw, 0, 1), 0) * smoothstep(0.02, 0.045, x) * (1 - smoothstep(0.17, 0.21, x)))
    smat = np.full(len(tris_of(skin)), M_SKIN, np.uint8)
    st = tris_of(skin)
    parts.append(Part(L, st, smat, twist, lip, brow, scalp))
    parts.append(Part(TP, tris_of(top), M_TOP, np.r_[twist, np.zeros(len(TP) - len(twist))]))
    for g in ("helper-l-eye", "helper-r-eye"):
        parts.append(Part(L, tris_of(groups[g]), M_EYE, np.ones(len(L))))
    for g in ("helper-l-eyelashes-2", "helper-r-eyelashes-2"):              # upper lashes only
        parts.append(Part(L, tris_of(groups[g]), M_LASH, np.ones(len(L))))
    parts.append(hair)
    eyes = [to_local(le[None], eye_mid)[0].tolist(), to_local(re[None], eye_mid)[0].tolist()]
    return merge(parts), {"eyes": eyes, "eyeR": float(np.linalg.norm(v[np.unique(np.concatenate(groups["helper-l-eye"]))] - le, axis=1).mean() * DM_TO_FT)}


def merge(parts):
    Ps, Ts, Ms, tw, a1, a2, a3, tan = [], [], [], [], [], [], [], []
    off = 0
    for p in parts:
        P, T, used = compact(p.P, p.tris)
        Ps.append(P); Ts.append(T + off); Ms.append(p.mat)
        tw.append(p.twist[used]); a1.append(p.a1[used]); a2.append(p.a2[used]); a3.append(p.a3[used]); tan.append(p.tan[used])
        off += len(P)
    return {"P": np.concatenate(Ps), "T": np.concatenate(Ts), "M": np.concatenate(Ms), "tw": np.concatenate(tw),
            "a1": np.concatenate(a1), "a2": np.concatenate(a2), "a3": np.concatenate(a3), "tan": np.concatenate(tan)}


MIX = {"caucasian": 0.7, "asian": 0.15, "african": 0.15}
PEOPLE = {
    "woman": {"targets": macro_weights("female", 34, MIX), "hair": "lob", "neck": "scoop", "cut": -2.9},
    "man": {"targets": macro_weights("male", 36, MIX), "hair": "short", "neck": "crew", "cut": -2.9},
}
PEOPLE["expecting"] = dict(PEOPLE["woman"], cut=-3.3)
PEOPLE["expecting"]["targets"] = dict(PEOPLE["woman"]["targets"], **{"stomach/stomach-pregnant-incr": 1.0})


def write(people, meta, path):
    """Little binary: [u32 header length][JSON header][arrays, each 4-byte aligned]."""
    blobs, header = [], {"people": {}, "meta": meta}
    off = 0

    def add(arr):
        nonlocal off
        b = arr.tobytes()
        pad = (-len(b)) % 4
        blobs.append(b + b"\0" * pad)
        o = off
        off += len(b) + pad
        return [o, len(arr.reshape(-1))]

    for name, m in people.items():
        P = m["P"]
        lo, hi = P.min(0), P.max(0)
        sc = (hi - lo) / 65535.0
        q = np.round((P - lo) / sc).astype(np.uint16)
        header["people"][name] = {
            "nv": len(P), "nt": len(m["T"]), "lo": lo.tolist(), "sc": sc.tolist(),
            "pos": add(q), "tri": add(m["T"].astype(np.uint16 if len(P) < 65536 else np.uint32)),
            "mat": add(m["M"].astype(np.uint8)),
            "att": add(np.round(np.clip(np.stack([m["tw"], m["a1"], m["a2"], m["a3"]], 1), 0, 1) * 255).astype(np.uint8)),
            "tan": add(np.round(np.clip(m["tan"], -1, 1) * 127).astype(np.int8)),
            "wide": len(P) >= 65536,
        }
    hb = json.dumps(header, separators=(",", ":")).encode()
    hb += b" " * ((-len(hb)) % 4)
    with open(path, "wb") as f:
        f.write(struct.pack("<I", len(hb)))
        f.write(hb)
        for b in blobs:
            f.write(b)
    return os.path.getsize(path)


def main():
    base, uvs, faces = load_obj(os.path.join(DATA, "3dobjs", "base.obj"))
    lips = None
    mask = os.environ.get("CUE_LIPS_MASK")
    if mask and os.path.exists(mask):
        from PIL import Image
        lips = np.asarray(Image.open(mask).convert("L"), float) / 255.0
    people, meta = {}, {}
    for name, spec in PEOPLE.items():
        m, info = build_person(base, uvs, faces, spec, lips)
        people[name] = m
        meta[name] = info
        print(name, len(m["P"]), "vertices", len(m["T"]), "triangles")
    size = write(people, meta, OUT)
    print("wrote", os.path.relpath(OUT), size // 1024, "KB")
    return people, meta


if __name__ == "__main__":
    main()
