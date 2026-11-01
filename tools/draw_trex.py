"""產生暴龍化石的 8 塊 SVG 素材（assets/fossils/t-rex/*.svg）。

用法：python tools/draw_trex.py
只用到 Python 標準函式庫。所有部位都用同一個比例尺繪製，頭朝左、尾巴朝右。

畫法：每一塊骨頭由幾個基本形狀（圓、橢圓、漸細的曲線）組成，
先用描邊色畫一次較粗的外框，再填上骨頭色，形狀之間就會自然合成一個輪廓。
"""
import math
import random
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "fossils" / "t-rex"

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
    """一塊化石的畫布；存檔時依畫出的形狀自動決定圖片範圍"""

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
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        (OUT_DIR / f"{name}.svg").write_text(svg, encoding="utf-8")
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


# ── 8 個部位 ─────────────────────────────────────────

def draw_skull():
    cv = Canvas(1)
    jaw_line = [(28, 168), (120, 178), (220, 184), (305, 190)]
    # 上排牙齒（先畫，牙根會被頭骨蓋住）
    xs = [44 + i * 21 for i in range(13)]
    for i, x in enumerate(xs):
        t = i / (len(xs) - 1)
        y = bezier(jaw_line, min(max((x - 28) / 277, 0), 1)) [1] - 6
        length = 30 + 24 * math.sin(math.pi * min(t * 1.4, 1)) - 12 * t
        cv.tooth(x, y - 4, length, 17 - 5 * t)
    outline = (
        "M18,132 C18,112 38,98 70,92 C120,82 160,70 205,58 C240,48 268,40 296,38 "
        "C312,36 324,24 342,27 C368,32 402,38 424,62 C440,82 438,122 424,150 "
        "C414,172 418,198 410,220 C402,236 382,236 374,222 C354,202 326,192 296,190 "
        "C222,186 140,180 70,172 C38,168 18,156 18,132 Z "
        # 鼻孔
        "M38,128 C40,118 56,112 70,116 C74,126 66,136 52,138 C44,138 38,134 38,128 Z "
        # 眶前孔
        "M146,124 C168,98 212,84 252,92 C266,110 264,142 250,154 C214,158 172,150 146,124 Z "
        # 眼眶（鑰匙孔形）
        "M284,74 C294,58 320,58 322,78 C322,98 306,108 300,138 C290,124 280,104 282,88 Z "
        # 下顳孔
        "M338,82 C356,66 390,70 398,96 C402,128 388,164 364,170 C346,146 336,112 338,82 Z"
    )
    cv.bone([path(outline, [(18, 24), (440, 236)], evenodd=True)], cracks=[
        "M110,104 C126,118 132,140 126,166",
        "M262,52 C270,84 272,150 284,186",
        "M326,40 C330,56 330,64 326,72",
        "M170,74 C182,80 196,82 214,80",
        "M300,160 C318,166 340,172 360,182",
    ])
    cv.save("skull")


def draw_jaw():
    cv = Canvas(2)
    xs = [40 + i * 21 for i in range(12)]
    for i, x in enumerate(xs):
        t = i / (len(xs) - 1)
        length = 24 + 20 * math.sin(math.pi * min(t * 1.3, 1)) - 8 * t
        cv.tooth(x, 48 + 2 * t, length, 16 - 5 * t, down=False, lean=0.3)
    outline = (
        "M16,58 C16,46 26,40 42,40 C120,38 220,42 300,44 C330,38 350,20 374,20 "
        "C396,20 410,38 414,58 C418,86 410,118 394,130 C362,148 320,150 290,144 "
        "C200,130 110,104 50,90 C28,86 16,74 16,58 Z "
        "M286,72 C302,60 336,60 348,72 C346,90 322,98 300,92 C292,88 286,80 286,72 Z"
    )
    cv.bone([path(outline, [(16, 20), (418, 152)], evenodd=True)], cracks=[
        "M80,62 C150,70 220,78 280,104",
        "M360,30 C366,46 370,60 380,76",
    ])
    cv.save("jaw")


def draw_neck():
    cv = Canvas(3)
    curve = [(36, 92), (120, 70), (170, 150), (270, 205)]
    sizes = [44, 48, 52, 56, 58]
    placed = along(curve, sizes, overlap=0.92)
    for (c, ang), size in zip(placed, sizes):
        # 頸肋：細長，從椎體下方往後延伸
        down = rot((0, 1), ang)
        base = add(c, down, size * 0.25)
        tip = add(add(base, rot((1, 0), ang), size * 0.95), down, size * 0.25)
        cv.bone(tapered([base, tip], size * 0.18, size * 0.07), speckles=False)
    for (c, ang), size in reversed(list(zip(placed, sizes))):
        vertebra(cv, c, ang, size, spine_len=size * 0.4, spine_tilt=-ang * 0.7)
    cv.save("neck")


def draw_torso():
    cv = Canvas(4)
    spine = [(28, 128), (180, 90), (360, 90), (515, 120)]
    sizes = [46] * 11
    placed = along(spine, sizes, overlap=0.95)
    n = len(placed)
    # 肋骨在後面
    for i, (c, ang) in enumerate(placed):
        if i in (0, n - 1):
            continue
        t = i / (n - 1)
        L = 120 + 150 * math.sin(math.pi * min(t * 1.25, 1)) ** 1.2
        base = add(c, (0, 1), 6)
        ctrl = [base, (base[0] - 34, base[1] + L * 0.42), (base[0] - 8, base[1] + L * 0.85),
                (base[0] + 30, base[1] + L)]
        cv.bone(tapered(ctrl, 17, 7), speckles=False)
    for c, ang in placed:
        vertebra(cv, c, ang, 46, spine_len=44, spine_tilt=12)
    cv.save("torso")


def draw_pelvis():
    cv = Canvas(5)
    # 恥骨：往前下方，末端有「靴子」
    cv.bone(tapered([(132, 112), (110, 190), (72, 262)], 42, 24) + [ellipse((62, 280), 60, 19, -8)],
            cracks=["M120,140 C112,180 98,220 82,252"])
    # 坐骨：往後下方
    cv.bone(tapered([(224, 108), (262, 170), (300, 232)], 36, 14))
    # 髂骨：上方長板
    ilium = ("M14,80 C12,50 50,28 100,26 C160,22 240,24 290,34 C322,42 334,64 322,82 "
             "C312,96 290,98 268,96 C252,96 242,104 236,116 C228,130 216,132 208,122 "
             "C196,104 162,102 148,122 C140,134 126,132 120,120 C112,104 96,100 76,102 "
             "C44,104 16,100 14,80 Z")
    cv.bone([path(ilium, [(10, 20), (330, 134)])],
            cracks=["M50,66 C110,52 200,52 296,60", "M176,26 C182,42 184,54 178,72"])
    # 髖臼（大腿骨卡進去的凹槽）
    cv.raw(f'<path d="M150,124 C160,100 196,100 206,124 Z" fill="{CAVITY}" stroke="{OUTLINE}" '
           f'stroke-width="4" stroke-linejoin="round"/>')
    cv.save("pelvis")


def draw_arm():
    cv = Canvas(6)
    # 肩胛骨 + 烏喙骨
    cv.bone(tapered([(40, 22), (80, 80), (118, 150)], 28, 44) + [ellipse((128, 168), 34, 26, 20)],
            cracks=["M58,44 C78,80 96,116 112,146"])
    # 上臂骨
    cv.bone(long_bone((132, 182), (104, 230), 13, 17))
    # 前臂（兩根）
    cv.bone(long_bone((106, 228), (66, 244), 9, 12, bend=0.06))
    cv.bone(long_bone((104, 236), (68, 254), 8, 11, bend=-0.05))
    # 兩根手指 + 爪
    for base, d in (((62, 244), (-0.9, 0.3)), ((64, 256), (-0.75, 0.6))):
        knuckle = add(base, d, 20)
        cv.bone(long_bone(base, knuckle, 7, 9), speckles=False)
        cv.bone(claw(knuckle, d, 18, 8), speckles=False)
    cv.save("arm")


def draw_leg():
    cv = Canvas(7)
    # 腓骨（細，在脛骨後面）
    cv.bone(tapered([(126, 208), (156, 270), (176, 330)], 14, 10), speckles=False)
    # 脛骨
    cv.bone(long_bone((112, 196), (162, 338), 34, 32, bend=-0.04),
            cracks=["M128,236 C138,262 146,290 152,312"])
    # 大腿骨（含股骨頭）
    cv.bone(long_bone((170, 44), (110, 192), 42, 38, bend=0.06) + [circle((198, 40), 25)],
            cracks=["M152,86 C144,112 132,140 124,166"])
    # 蹠骨（兩根並排）
    cv.bone(long_bone((174, 340), (146, 404), 19, 21))
    cv.bone(long_bone((160, 342), (128, 404), 21, 23))
    # 腳趾：兩根往前、一根往後
    toes = [((126, 406), (-1, 0.12), 3), ((142, 410), (-0.92, 0.3), 2), ((160, 404), (0.85, 0.3), 1)]
    for start, d, count in toes:
        p = start
        for k in range(count):
            q = add(p, d, 24 - k * 3)
            cv.bone(long_bone(p, q, 10, 13), speckles=False)
            p = q
        cv.bone(claw(p, d, 22, 11), speckles=False)
    cv.save("leg")


def draw_tail():
    cv = Canvas(8)
    curve = [(28, 76), (210, 50), (390, 96), (560, 168)]
    sizes = [48 * 0.93 ** i for i in range(24)]
    placed = along(curve, sizes, overlap=0.96)
    for i, ((c, ang), size) in enumerate(reversed(list(zip(placed, sizes)))):
        j = len(sizes) - 1 - i
        spine = size * (0.95 if j < 12 else 0.4) if j < 18 else 0
        chevron = size * 0.9 if 1 <= j < 16 else 0
        vertebra(cv, c, ang, size, spine_len=spine, spine_tilt=28, chevron_len=chevron,
                 chevron_tilt=30)
    cv.save("tail")


if __name__ == "__main__":
    for fn in (draw_skull, draw_jaw, draw_neck, draw_torso, draw_pelvis, draw_arm, draw_leg, draw_tail):
        fn()
