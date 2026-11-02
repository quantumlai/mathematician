"""畫化石骨頭的共用工具：幾何、基本形狀、骨頭畫布、脊椎。

tools/draw_trex.py 和 tools/draw_dinos.py 都用這裡的工具，所有恐龍的骨頭畫風一致。
只用到 Python 標準函式庫。

畫法：每一塊骨頭由幾個基本形狀（圓、橢圓、漸細的曲線）組成，
先用描邊色畫一次較粗的外框，再填上骨頭色，形狀之間就會自然合成一個輪廓。
"""
import math
import random

OUTLINE = "#3a2a1e"
OUTLINE_W = 4.5          # 外框寬度（往外）
SHADE = "#c9ab7c"        # 骨頭右下方的陰影色
BONE_TOP = "#f8eed6"
BONE_BOTTOM = "#e2cda3"
SPECKLE = "#9c7f55"
CRACK = "#a98a5c"
CAVITY = "#6b4f37"
TOOTH = "#fbf4df"


def fmt(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


# ── 幾何 ────────────────────────────────────────────

def bezier(ctrl, t):
    """2～4 個控制點的貝茲曲線"""
    pts = list(ctrl)
    while len(pts) > 1:
        pts = [(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) for a, b in zip(pts, pts[1:])]
    return pts[0]


def sample(ctrl, n):
    return [bezier(ctrl, i / n) for i in range(n + 1)]


def polyline_dirs(pts):
    dirs = []
    for i in range(len(pts)):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, len(pts) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        dirs.append((dx / d, dy / d))
    return dirs


def rot(v, deg):
    a = math.radians(deg)
    return (v[0] * math.cos(a) - v[1] * math.sin(a), v[0] * math.sin(a) + v[1] * math.cos(a))


def add(p, v, k=1.0):
    return (p[0] + v[0] * k, p[1] + v[1] * k)


# ── 基本形狀：每個回傳 (svg 字串, 外框點) ──────────────

def circle(c, r):
    pts = [(c[0] - r, c[1] - r), (c[0] + r, c[1] + r)]
    return f'<circle cx="{fmt(c[0])}" cy="{fmt(c[1])}" r="{fmt(r)}"/>', pts


def ellipse(c, rx, ry, angle=0):
    t = f' transform="rotate({fmt(angle)} {fmt(c[0])} {fmt(c[1])})"' if angle else ""
    m = max(rx, ry)
    pts = [(c[0] - m, c[1] - m), (c[0] + m, c[1] + m)]
    return f'<ellipse cx="{fmt(c[0])}" cy="{fmt(c[1])}" rx="{fmt(rx)}" ry="{fmt(ry)}"{t}/>', pts


def path(d, pts, evenodd=False):
    rule = ' fill-rule="evenodd" clip-rule="evenodd"' if evenodd else ""
    return f'<path d="{d}"{rule}/>', pts


def tapered(ctrl, w0, w1, n=28, cap0=True, cap1=True, wfn=None):
    """沿曲線畫一條由 w0 漸變到 w1 粗的骨頭（兩端可加圓頭）"""
    pts = sample(ctrl, n)
    dirs = polyline_dirs(pts)
    left, right = [], []
    for i, (p, d) in enumerate(zip(pts, dirs)):
        t = i / n
        w = wfn(t) if wfn else w0 + (w1 - w0) * t
        nrm = (-d[1], d[0])
        left.append(add(p, nrm, w / 2))
        right.append(add(p, nrm, -w / 2))
    ring = left + right[::-1]
    d = "M" + " L".join(f"{fmt(x)},{fmt(y)}" for x, y in ring) + " Z"
    shapes = [path(d, ring)]
    if cap0:
        shapes.append(circle(pts[0], (wfn(0) if wfn else w0) / 2))
    if cap1:
        shapes.append(circle(pts[-1], (wfn(1) if wfn else w1) / 2))
    return shapes


def long_bone(a, b, w, knob, bend=0.0):
    """四肢長骨：中段骨幹 + 兩端膨大的關節"""
    mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy)
    nrm = (-dy / L, dx / L)
    ctrl = [a, add(mid, nrm, bend * L), b]
    shapes = tapered(ctrl, w, w, cap0=False, cap1=False,
                     wfn=lambda t: w * (0.82 + 0.5 * (2 * t - 1) ** 4))
    u = (dx / L, dy / L)
    for end, s in ((a, 1), (b, -1)):
        c = add(end, u, s * knob * 0.35)
        shapes.append(circle(add(c, nrm, knob * 0.42), knob * 0.62))
        shapes.append(circle(add(c, nrm, -knob * 0.42), knob * 0.62))
    return shapes


def claw(base, direction, length, w):
    """向下彎的爪子"""
    d = direction
    tip = add(base, d, length)
    tip = add(tip, (0, 1), length * 0.35)
    ctrl = [base, add(base, d, length * 0.6), tip]
    return tapered(ctrl, w, 1.5, cap1=False)


# ── 組合與繪製 ───────────────────────────────────────

class Canvas:
    """一塊化石的畫布；存檔時依畫出的形狀自動決定圖片範圍。
    out_dir 是存檔的資料夾，畫每一種恐龍前先設定 Canvas.out_dir。"""

    out_dir = None

    def __init__(self, seed):
        self.items = []
        self.defs = []
        self.ids = 0
        self.bounds = []
        self.rng = random.Random(seed)

    def bone(self, shapes, speckles=True, cracks=()):
        """把多個形狀合成一塊有外框、陰影、斑點的骨頭"""
        svg = "".join(s for s, _ in shapes)
        pts = [p for _, ps in shapes for p in ps]
        self.bounds += pts
        x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
        y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
        self.ids += 1
        cid = f"c{self.ids}"
        self.defs.append(f'<clipPath id="{cid}">{svg}</clipPath>')

        dots = []
        if speckles:
            area = (x1 - x0) * (y1 - y0)
            for _ in range(int(area / 700)):
                x = self.rng.uniform(x0, x1)
                y = self.rng.uniform(y0, y1)
                r = self.rng.uniform(0.8, 2.0)
                dots.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(r)}"/>')
        crack_svg = "".join(f'<path d="{c}"/>' for c in cracks)

        self.items.append(
            f'<g fill="{OUTLINE}" stroke="{OUTLINE}" stroke-width="{fmt(OUTLINE_W * 2)}" '
            f'stroke-linejoin="round">{svg}</g>'
            f'<g clip-path="url(#{cid})">'
            f'<g fill="{SHADE}">{svg}</g>'
            f'<g fill="url(#boneFill)" transform="translate(-3,-4.5)">{svg}</g>'
            f'<g fill="{SPECKLE}" opacity="0.45">{"".join(dots)}</g>'
            f'<g fill="none" stroke="{CRACK}" stroke-width="2.4" stroke-linecap="round">{crack_svg}</g>'
            f"</g>"
        )

    def raw(self, svg):
        self.items.append(svg)

    def tooth(self, x, y, length, width, down=True, lean=0.25):
        s = 1 if down else -1
        tip = (x + width * lean, y + s * length)
        self.bounds += [(x - width / 2, y), (x + width / 2, y), tip]
        d = (f"M{fmt(x - width / 2)},{fmt(y)} "
             f"Q{fmt(x - width * 0.4)},{fmt(y + s * length * 0.7)} {fmt(tip[0])},{fmt(tip[1])} "
             f"Q{fmt(x + width * 0.45)},{fmt(y + s * length * 0.45)} {fmt(x + width / 2)},{fmt(y)} Z")
        self.items.append(
            f'<path d="{d}" fill="{TOOTH}" stroke="{OUTLINE}" stroke-width="3" stroke-linejoin="round"/>')

    def save(self, name):
        pad = OUTLINE_W + 2
        x0 = math.floor(min(p[0] for p in self.bounds) - pad)
        y0 = math.floor(min(p[1] for p in self.bounds) - pad)
        w = math.ceil(max(p[0] for p in self.bounds) + pad) - x0
        h = math.ceil(max(p[1] for p in self.bounds) + pad) - y0
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="{x0} {y0} {w} {h}">'
            f'<defs><linearGradient id="boneFill" gradientUnits="userSpaceOnUse" '
            f'x1="0" y1="{y0}" x2="0" y2="{y0 + h}">'
            f'<stop offset="0" stop-color="{BONE_TOP}"/><stop offset="1" stop-color="{BONE_BOTTOM}"/>'
            f'</linearGradient>{"".join(self.defs)}</defs>'
            f'{"".join(self.items)}</svg>\n'
        )
        self.out_dir.mkdir(parents=True, exist_ok=True)
        (self.out_dir / f"{name}.svg").write_text(svg, encoding="utf-8")
        print(f"{name}.svg  {w}x{h}")


def vertebra(cv, c, angle, size, spine_len=0, spine_tilt=15, chevron_len=0,
             spine_w=0.45, chevron_tilt=25):
    """一節脊椎：椎體（線軸形）＋向上的神經棘＋（尾椎）向下的人字骨"""
    w, h = size, size * 0.78
    d = rot((1, 0), angle)
    up = rot((0, -1), angle)
    shapes = []
    if spine_len:
        base = add(c, up, h * 0.25)
        tip = add(c, rot(up, spine_tilt), h / 2 + spine_len)
        mid = add(add(base, tip, 0), (0, 0))
        mid = ((base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2)
        shapes += tapered([base, add(mid, d, size * 0.06), tip], w * spine_w, w * spine_w * 0.75)
    if chevron_len:
        base = add(c, up, -h * 0.3)
        tip = add(c, rot((-up[0], -up[1]), -chevron_tilt), h / 2 + chevron_len)
        shapes += tapered([base, tip], w * 0.28, w * 0.12)
    # 椎體：中間細、兩端粗
    shapes.append(ellipse(c, w * 0.42, h * 0.40, angle))
    shapes.append(ellipse(add(c, d, -w * 0.32), w * 0.17, h * 0.5, angle))
    shapes.append(ellipse(add(c, d, w * 0.32), w * 0.17, h * 0.5, angle))
    cv.bone(shapes)


def along(ctrl, sizes, overlap=0.9, n=400):
    """沿曲線依序排列大小不同的物件，回傳 (位置, 角度) 列表"""
    pts = sample(ctrl, n)
    dist = [0.0]
    for a, b in zip(pts, pts[1:]):
        dist.append(dist[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    dirs = polyline_dirs(pts)
    out, s = [], sizes[0] / 2
    for i, size in enumerate(sizes):
        if i:
            s += (sizes[i - 1] + size) / 2 * overlap
        j = min(range(len(dist)), key=lambda k: abs(dist[k] - s))
        out.append((pts[j], math.degrees(math.atan2(dirs[j][1], dirs[j][0]))))
    return out


