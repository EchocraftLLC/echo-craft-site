#!/usr/bin/env python3
"""Prepare portfolio photos and rebuild images/gallery.json.

Run automatically by .github/workflows/gallery.yml whenever photos are pushed.
For each category folder in images/:
  - resizes any JPEG/PNG/WebP wider/taller than MAX_EDGE (EXIF kept)
  - lists every photo EXCEPT the six featured slots (<category>-01 .. -06),
    which are hard-wired into index.html and edited from the admin page.
The "View more" section on the home page is built from that list.
"""
import json
import os
import re
from PIL import Image, ImageOps

CATEGORIES = ["portrait", "fashion", "event", "maternity"]
MAX_EDGE = 1800
EXTS = (".jpg", ".jpeg", ".png", ".webp")
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "images")


def optimize(path):
    im = Image.open(path)
    if max(im.size) <= MAX_EDGE:
        return
    exif, icc = im.info.get("exif"), im.info.get("icc_profile")
    im = ImageOps.exif_transpose(im)
    im.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
    kw = {}
    if path.lower().endswith((".jpg", ".jpeg")):
        kw = dict(quality=80, optimize=True, progressive=True)
        if exif:
            kw["exif"] = exif
        im = im.convert("RGB")
    if icc:
        kw["icc_profile"] = icc
    im.save(path, **kw)
    print("resized", path)


def main():
    manifest = {}
    for cat in CATEGORIES:
        folder = os.path.join(ROOT, cat)
        files = sorted(f for f in os.listdir(folder) if f.lower().endswith(EXTS)) if os.path.isdir(folder) else []
        extras = []
        for f in files:
            optimize(os.path.join(folder, f))
            if re.fullmatch(rf"{cat}-0[1-6]\.\w+", f, re.I):
                continue  # featured slot, already on the page
            extras.append(f)
        manifest[cat] = extras
    out = os.path.join(ROOT, "gallery.json")
    with open(out, "w") as fh:
        json.dump(manifest, fh, indent=2)
        fh.write("\n")
    print({k: len(v) for k, v in manifest.items()})


if __name__ == "__main__":
    main()
