"""
Rebuilds the Shooting Stars wordmark as outlined SVG paths.

The letters are drawn from Bodoni Moda (Black Italic, display optical size),
the closest open-licence match to the logo used on Instagram. Because the
letters are converted to vector outlines, the SVGs render identically on
every device and never depend on a font being installed.

Usage (needs: pip install fonttools brotli):
    python3 tools/make_logo.py path/to/bodoni-moda-latin-standard-italic.woff2

Outputs go to assets/brand/. Rasterised PNG icons are made by
tools/render_icons.mjs (Playwright).
"""
import sys
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONT = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "brand")
os.makedirs(OUT, exist_ok=True)

font = TTFont(FONT)
font = instantiateVariableFont(font, {"wght": 900, "opsz": 28})
gs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]
UPM = font["head"].unitsPerEm
CAP = font["OS/2"].sCapHeight or 1400
TRACK = -10  # font units between letters (tight, like the original)


def line_paths(text, x0, baseline, scale=1.0):
    """Return (svg path data, ink bounds) for one line of text."""
    pen = SVGPathPen(gs)
    bpen = BoundsPen(gs)
    x = 0
    for ch in text:
        if ch == " ":
            x += 0.28 * UPM
            continue
        g = cmap[ord(ch)]
        # flip y (font units are y-up, SVG is y-down)
        t = (scale, 0, 0, -scale, x0 + x * scale, baseline)
        gs[g].draw(TransformPen(pen, t))
        gs[g].draw(TransformPen(bpen, t))
        x += hmtx[g][0] + TRACK
    return pen.getCommands(), bpen.bounds


def measure(text):
    p, b = line_paths(text, 0, 0)
    return b  # xmin, ymin, xmax, ymax


STAR = "M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z"


def svg(w, h, body, title):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" '
        f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'
    )


def stacked(fill, bg=None, pad=120, with_media=False):
    """SHOOTING / STARS stacked and centred, like the Instagram logo."""
    b1 = measure("SHOOTING")
    b2 = measure("STARS")
    w1, w2 = b1[2] - b1[0], b2[2] - b2[0]
    width = max(w1, w2)
    gap = CAP * 0.16
    h_media = 0
    W = width + pad * 2
    top = pad
    base1 = top + CAP
    base2 = base1 + gap + CAP
    H = base2 + pad
    if with_media:
        h_media = CAP * 0.36
        H = base2 + CAP * 0.30 + h_media + pad
    d1, _ = line_paths("SHOOTING", pad + (width - w1) / 2 - b1[0], base1)
    d2, _ = line_paths("STARS", pad + (width - w2) / 2 - b2[0], base2)
    body = ""
    if bg:
        body += f'<rect width="100%" height="100%" fill="{bg}"/>'
    body += f'<path fill="{fill}" d="{d1} {d2}"/>'
    if with_media:
        # small spaced descriptor drawn from the upright cut
        body += media_line(fill, W / 2, base2 + CAP * 0.30 + h_media, h_media)
    return W, H, body


def media_line(fill, cx, baseline, cap_px):
    up = TTFont(FONT.replace("italic", "normal"))
    up = instantiateVariableFont(up, {"wght": 600, "opsz": 11})
    ugs = up.getGlyphSet()
    ucmap = up.getBestCmap()
    uh = up["hmtx"]
    ucap = up["OS/2"].sCapHeight or 1400
    s = cap_px / ucap
    track = 0.55 * up["head"].unitsPerEm
    word = "MEDIA"
    total = sum(uh[ucmap[ord(c)]][0] for c in word) + track * (len(word) - 1)
    x = cx - total * s / 2
    pen = SVGPathPen(ugs)
    for c in word:
        g = ucmap[ord(c)]
        ugs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
        x += (uh[g][0] + track) * s
    return f'<path fill="{fill}" d="{pen.getCommands()}"/>'


def horizontal(fill, pad=40, star=True):
    b = measure("SHOOTING STARS")
    w = b[2] - b[0]
    sx = 0
    body = ""
    if star:
        size = CAP * 0.9
        sx = size + CAP * 0.28
        body += (
            f'<path fill="{fill}" transform="translate({pad},{pad + CAP*0.05}) '
            f'scale({size/24:.4f})" d="{STAR}"/>'
        )
    d, _ = line_paths("SHOOTING STARS", pad + sx - b[0], pad + CAP)
    body += f'<path fill="{fill}" d="{d}"/>'
    return pad * 2 + sx + w, pad * 2 + CAP, body


def circle_avatar(size=1080, fill="#FFFFFF", bg="#000000"):
    """Round avatar like the Instagram profile picture, but crisp."""
    W, H, inner = stacked(fill, pad=0)
    target = size * 0.80
    s = target / W
    tx = (size - W * s) / 2
    ty = (size - H * s) / 2
    body = (
        f'<circle cx="{size/2}" cy="{size/2}" r="{size/2}" fill="{bg}"/>'
        f'<g transform="translate({tx:.2f},{ty:.2f}) scale({s:.5f})">{inner}</g>'
    )
    return size, size, body


def monogram(size=512, fill="#FFFFFF", bg="#000000", radius=0.22):
    """Italic SS monogram for favicons and app icons."""
    b = measure("SS")
    w, h = b[2] - b[0], b[3] - b[1]
    target = size * 0.62
    s = target / max(w, h)
    d, _ = line_paths("SS", 0, 0, scale=s)
    # measure() bounds are already in SVG (y-down) space, so centre the ink box
    tx = size / 2 - (b[0] + b[2]) * s / 2
    ty = size / 2 - (b[1] + b[3]) * s / 2 + size * 0.03
    star = size * 0.13
    body = ""
    if bg:
        r = size * radius
        body += f'<rect width="{size}" height="{size}" rx="{r:.1f}" fill="{bg}"/>'
    body += f'<g transform="translate({tx:.2f},{ty:.2f})"><path fill="{fill}" d="{d}"/></g>'
    body += (
        f'<path fill="#C9CED6" transform="translate({size*0.74:.1f},{size*0.12:.1f}) '
        f'scale({star/24:.4f})" d="{STAR}"/>'
    )
    return size, size, body


def compact(s):
    """Round path numbers to whole font units; keeps files small."""
    import re

    def rnd(m):
        v = float(m.group(0))
        return str(int(round(v))) if abs(v) >= 10 else f"{v:.2f}".rstrip("0").rstrip(".")

    out = re.sub(r"-?\d+\.\d+", rnd, s)
    out = re.sub(r"(?<=[A-Za-z]) (?=-?\d)", "", out)
    return out


def write(name, w, h, body, title="Shooting Stars"):
    path = os.path.join(OUT, name)
    with open(path, "w") as fh:
        fh.write(compact(svg(w, h, body, title)))
    print(f"{name}: {os.path.getsize(path)/1024:.1f} KB")


write("logo-stacked-white.svg", *stacked("#FFFFFF"))
write("logo-stacked-black.svg", *stacked("#000000"))
write("logo-stacked-media-white.svg", *stacked("#FFFFFF", with_media=True), title="Shooting Stars Media")
write("logo-horizontal-white.svg", *horizontal("#FFFFFF"))
write("logo-horizontal-black.svg", *horizontal("#000000"))
write("avatar-circle.svg", *circle_avatar())
write("icon-monogram.svg", *monogram())
write("star.svg", 24, 24, f'<path fill="#FFFFFF" d="{STAR}"/>', title="Star")
