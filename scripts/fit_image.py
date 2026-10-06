#!/usr/bin/env python3
"""Fit a Figma-exported image into an exact email image slot at 2x.

usage: fit_image.py SRC DEST WIDTH HEIGHT [contain|cover] [#bgcolor]
WIDTH/HEIGHT are the 1x display size; output is 2x. 'contain' keeps the whole
image centred (transparent padding unless a bg colour is given); 'cover' crops
to fill. Output is PNG unless DEST ends in .jpg.
"""
import sys
from PIL import Image

src, dest, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
mode = sys.argv[5] if len(sys.argv) > 5 else 'contain'
bg = sys.argv[6] if len(sys.argv) > 6 else None
W, H = w * 2, h * 2
im = Image.open(src).convert('RGBA')
if mode == 'cover':
    s = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    out = im.crop((l, t, l + W, t + H))
else:
    s = min(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.paste(im, ((W - im.width) // 2, (H - im.height) // 2), im)
if bg:
    base = Image.new('RGBA', out.size, bg)
    base.alpha_composite(out)
    out = base
if dest.lower().endswith(('.jpg', '.jpeg')):
    out.convert('RGB').save(dest, quality=82, optimize=True, progressive=True)
else:
    out.save(dest, optimize=True)
print(dest, out.size)
