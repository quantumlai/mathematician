"""產生暴龍以外 9 種恐龍的 SVG 骨頭（assets/fossils/<恐龍>/*.svg），每種 8 塊。

用法：python tools/draw_dinos.py            # 全部重畫
      python tools/draw_dinos.py stegosaurus  # 只畫一種
只用到 Python 標準函式庫。同一種恐龍的骨頭用同一個比例尺繪製，頭朝左、尾巴朝右。
畫法和共用工具在 tools/fossil_kit.py；暴龍在 tools/draw_trex.py。

每種恐龍的 8 塊骨頭（id 要和 js/fossils.js 一致）：
  三角龍 triceratops       skull frill neck torso pelvis arm leg tail
  劍龍   stegosaurus       skull neck torso plates pelvis arm leg tail
  腕龍   brachiosaurus     skull neck-upper neck-lower torso pelvis arm leg tail
  迅猛龍 velociraptor      skull jaw neck torso pelvis arm leg tail
  甲龍   ankylosaurus      skull neck armor torso pelvis arm leg tail
  棘龍   spinosaurus       skull jaw neck torso pelvis arm leg tail
  副櫛龍 parasaurolophus   skull jaw neck torso pelvis arm leg tail
  厚頭龍 pachycephalosaurus skull jaw neck torso pelvis arm leg tail
  梁龍   diplodocus        skull neck-upper neck-lower torso pelvis arm leg tail
"""
import math
import re
import sys
from pathlib import Path

from fossil_kit import (CAVITY, OUTLINE, Canvas, add, along, circle, claw, ellipse, long_bone,
                        path, rot, tapered, vertebra)

ASSETS = Path(__file__).resolve().parent.parent / "assets" / "fossils"


def S(p, s):
    """把點放大 s 倍"""
    return (p[0] * s, p[1] * s)


def skull_shape(outline, holes, box):
    """頭骨：外框和洞（鼻孔、眼眶等）寫在同一個 path 裡，用 evenodd 挖空"""
    return [path(outline + " " + " ".join(holes), box, evenodd=True)]


def teeth_row(cv, x0, x1, y_at, count, length, width, down=True, lean=0.25, shrink=0.3):
    """沿著顎的邊緣排一排牙齒；y_at(x) 是那個位置的牙根高度"""
    for i in range(count):
        t = i / max(count - 1, 1)
        x = x0 + (x1 - x0) * t
        k = 1 - shrink * t
        cv.tooth(x, y_at(x), length * k, width * k, down=down, lean=lean)


def ellipse_pts(cx, cy, rx, ry):
    """橢圓洞的 path（順時針）"""
    return (f"M{cx - rx},{cy} A{rx},{ry} 0 1,0 {cx + rx},{cy} "
            f"A{rx},{ry} 0 1,0 {cx - rx},{cy} Z")


# ── 共用部位 ─────────────────────────────────────────

def neck(cv, curve, sizes, spine_k=0.4, ribs=True, rib_k=0.95):
    placed = along(curve, sizes, overlap=0.92)
    if ribs:
        for (c, ang), size in zip(placed, sizes):
            down = rot((0, 1), ang)
            base = add(c, down, size * 0.25)
            tip = add(add(base, rot((1, 0), ang), size * rib_k), down, size * 0.22)
            cv.bone(tapered([base, tip], size * 0.18, size * 0.07), speckles=False)
    for (c, ang), size in reversed(list(zip(placed, sizes))):
        vertebra(cv, c, ang, size, spine_len=size * spine_k, spine_tilt=-ang * 0.7)


def torso(cv, spine, n, size, rib_len, spine_len, spine_tilt=12, spine_w=0.45, rib_w=(17, 7),
          rib_sweep=34):
    """背椎與肋骨。rib_len(t)、spine_len(t) 是從前（t=0）到後（t=1）的長度"""
    placed = along(spine, [size] * n, overlap=0.95)
    for i, (c, ang) in enumerate(placed):
        if i in (0, n - 1):
            continue
        t = i / (n - 1)
        L = rib_len(t)
        base = add(c, (0, 1), 6)
        ctrl = [base, (base[0] - rib_sweep, base[1] + L * 0.42), (base[0] - 8, base[1] + L * 0.85),
                (base[0] + 30, base[1] + L)]
        cv.bone(tapered(ctrl, rib_w[0], rib_w[1]), speckles=False)
    for i, (c, ang) in enumerate(placed):
        t = i / (n - 1)
        vertebra(cv, c, ang, size, spine_len=spine_len(t), spine_tilt=spine_tilt, spine_w=spine_w)
    return placed


def tail(cv, curve, n, size0, decay, spine_until, chevron_until, spine_k=0.95, chevron_k=0.9,
         spine_tilt=28, min_size=7):
    sizes = [max(size0 * decay ** i, min_size) for i in range(n)]
    placed = along(curve, sizes, overlap=0.96)
    for i, ((c, ang), size) in enumerate(reversed(list(zip(placed, sizes)))):
        j = n - 1 - i
        spine = size * spine_k * (1 - 0.5 * j / max(spine_until, 1)) if j < spine_until else 0
        chevron = size * chevron_k if 1 <= j < chevron_until else 0
        vertebra(cv, c, ang, size, spine_len=spine, spine_tilt=spine_tilt, chevron_len=chevron,
                 chevron_tilt=30)
    return placed, sizes


def tendons(cv, placed, sizes, start, end, offsets=(-0.35, 0.3)):
    """骨化的肌腱：沿著尾巴的細長骨條（迅猛龍、鴨嘴龍、厚頭龍的尾巴很硬）"""
    pts = [c for c, _ in placed[start:end]]
    for k in offsets:
        line = []
        for (c, ang), size in zip(placed[start:end], sizes[start:end]):
            up = rot((0, -1), ang)
            line.append(add(c, up, size * k))
        if len(line) >= 3:
            mid = line[len(line) // 2]
            cv.bone(tapered([line[0], mid, line[-1]], 5, 3), speckles=False)
    return pts


def pelvis_saurischian(cv, s=1.0):
    """蜥臀目的骨盆（和暴龍同型）：恥骨朝前下方"""
    cv.bone(tapered([S((132, 112), s), S((110, 190), s), S((72, 262), s)], 42 * s, 24 * s)
            + [ellipse(S((62, 280), s), 60 * s, 19 * s, -8)],
            cracks=[f"M{132 * s - 12},{140 * s} C{112 * s},{180 * s} {98 * s},{220 * s} {82 * s},{252 * s}"])
    cv.bone(tapered([S((224, 108), s), S((262, 170), s), S((300, 232), s)], 36 * s, 14 * s))
    ilium(cv, s)
    acetabulum(cv, s)


def pelvis_ornithischian(cv, s=1.0):
    """鳥臀目的骨盆：前恥突朝前，後恥骨和坐骨一起朝後下方"""
    cv.bone(tapered([S((116, 108), s), S((70, 140), s), S((18, 150), s)], 30 * s, 22 * s)
            + [ellipse(S((22, 150), s), 24 * s, 16 * s, 10)])
    cv.bone(tapered([S((176, 116), s), S((246, 196), s), S((320, 262), s)], 18 * s, 9 * s), speckles=False)
    cv.bone(tapered([S((216, 110), s), S((270, 176), s), S((336, 228), s)], 32 * s, 16 * s),
            cracks=[f"M{236 * s},{140 * s} C{262 * s},{170 * s} {290 * s},{196 * s} {316 * s},{214 * s}"])
    ilium(cv, s)
    acetabulum(cv, s)


def ilium(cv, s):
    d = ("M14,80 C12,50 50,28 100,26 C160,22 240,24 290,34 C322,42 334,64 322,82 "
         "C312,96 290,98 268,96 C252,96 242,104 236,116 C228,130 216,132 208,122 "
         "C196,104 162,102 148,122 C140,134 126,132 120,120 C112,104 96,100 76,102 "
         "C44,104 16,100 14,80 Z")
    cv.bone([path(scale_path(d, s), [S((10, 20), s), S((330, 134), s)])],
            cracks=[scale_path("M50,66 C110,52 200,52 296,60", s),
                    scale_path("M176,26 C182,42 184,54 178,72", s)])


def acetabulum(cv, s):
    cv.raw(f'<path d="{scale_path("M150,124 C160,100 196,100 206,124 Z", s)}" fill="{CAVITY}" '
           f'stroke="{OUTLINE}" stroke-width="4" stroke-linejoin="round"/>')


def scale_path(d, s):
    """把 path 字串裡的每個數字（座標）都乘上 s（只用在 M/L/C/Q/Z 這類絕對座標的 path）"""
    if s == 1:
        return d
    return re.sub(r"-?\d+(?:\.\d+)?", lambda m: f"{float(m.group()) * s:.1f}".rstrip("0").rstrip("."), d)


def leg_biped(cv, s=1.0, toe="claw", sickle=False, slim=1.0):
    """兩腳站立的後腿（暴龍型）：大腿骨、脛骨、蹠骨、三根腳趾"""
    w = lambda v: v * s * slim  # noqa: E731
    cv.bone(tapered([S((126, 208), s), S((156, 270), s), S((176, 330), s)], w(14), w(10)), speckles=False)
    cv.bone(long_bone(S((112, 196), s), S((162, 338), s), w(34), w(32), bend=-0.04),
            cracks=[scale_path("M128,236 C138,262 146,290 152,312", s)])
    cv.bone(long_bone(S((170, 44), s), S((110, 192), s), w(42), w(38), bend=0.06) + [circle(S((198, 40), s), w(25))],
            cracks=[scale_path("M152,86 C144,112 132,140 124,166", s)])
    cv.bone(long_bone(S((174, 340), s), S((146, 404), s), w(19), w(21)))
    cv.bone(long_bone(S((160, 342), s), S((128, 404), s), w(21), w(23)))
    toes = [((126, 406), (-1, 0.12), 3), ((142, 410), (-0.92, 0.3), 2), ((160, 404), (0.85, 0.3), 1)]
    for n, (start, d, count) in enumerate(toes):
        p = S(start, s)
        if sickle and n == 1:
            # 迅猛龍的第二趾：抬起來的大鐮刀爪
            d = (-0.55, -0.6)
        for k in range(count):
            q = add(p, d, (24 - k * 3) * s)
            cv.bone(long_bone(p, q, w(10), w(13)), speckles=False)
            p = q
        if sickle and n == 1:
            tip = add(p, (-0.7, 0.45), 46 * s)
            cv.bone(tapered([p, add(p, (-0.9, -0.5), 30 * s), tip], w(15), 2, cap1=False), speckles=False)
        elif toe == "hoof":
            cv.bone([ellipse(add(p, d, 9 * s), 13 * s, 8 * s, math.degrees(math.atan2(d[1], d[0])))],
                    speckles=False)
        else:
            cv.bone(claw(p, d, 22 * s, w(11)), speckles=False)


def leg_column(cv, s=1.0, front=False):
    """四腳走路的粗壯腳（腕龍、梁龍、三角龍、劍龍、甲龍）。front=True 是前腳（含肩胛骨）"""
    if front:
        cv.bone(tapered([S((60, 20), s), S((88, 80), s), S((112, 150), s)], 34 * s, 54 * s)
                + [ellipse(S((120, 168), s), 38 * s, 28 * s, 20)],
                cracks=[scale_path("M74,40 C90,80 104,116 114,146", s)])
        top = (118, 186)
        cv.bone(long_bone(S(top, s), S((108, 320), s), 30 * s, 36 * s, bend=0.04),
                cracks=[scale_path("M116,220 C114,250 112,280 110,300", s)])
        cv.bone(long_bone(S((112, 318), s), S((118, 436), s), 16 * s, 22 * s, bend=-0.03))
        cv.bone(long_bone(S((100, 318), s), S((98, 436), s), 18 * s, 24 * s, bend=0.03))
        foot_y = 440
    else:
        cv.bone(long_bone(S((128, 50), s), S((112, 250), s), 40 * s, 42 * s, bend=0.03)
                + [circle(S((158, 44), s), 28 * s)],
                cracks=[scale_path("M126,90 C122,130 118,180 116,220", s)])
        cv.bone(long_bone(S((122, 250), s), S((130, 390), s), 14 * s, 20 * s), speckles=False)
        cv.bone(long_bone(S((108, 248), s), S((112, 392), s), 30 * s, 34 * s, bend=-0.03))
        foot_y = 396
    # 短短的掌骨和鈍鈍的趾頭（像大象的腳）
    xs = [-34, -16, 2, 20] if front else [-30, -10, 10]
    base_x = 108 if front else 114
    for k, dx in enumerate(xs):
        a = S((base_x + dx * 0.5, foot_y), s)
        b = S((base_x + dx * 1.1 - 12, foot_y + 40), s)
        cv.bone(long_bone(a, b, 12 * s, 15 * s), speckles=False)
        cv.bone([ellipse(add(b, (-0.6, 0.5), 9 * s), 12 * s, 8 * s, 25)], speckles=False)


def arm(cv, s=1.0, fingers=2, finger_len=20, claw_len=18, forearm=1.0, big_thumb=False, hoof=False):
    """兩腳站立恐龍的前肢：肩胛骨、上臂、前臂、手指"""
    cv.bone(tapered([S((40, 22), s), S((80, 80), s), S((118, 150), s)], 28 * s, 44 * s)
            + [ellipse(S((128, 168), s), 34 * s, 26 * s, 20)],
            cracks=[scale_path("M58,44 C78,80 96,116 112,146", s)])
    elbow = S((104, 230), s)
    cv.bone(long_bone(S((132, 182), s), elbow, 13 * s, 17 * s))
    wrist = add(elbow, (-0.93, 0.36), 44 * s * forearm)
    cv.bone(long_bone(add(elbow, (0, -2 * s)), wrist, 9 * s, 12 * s, bend=0.06))
    cv.bone(long_bone(add(elbow, (0, 6 * s)), add(wrist, (2 * s, 10 * s)), 8 * s, 11 * s, bend=-0.05))
    dirs = [(-0.95, 0.15), (-0.85, 0.5), (-0.6, 0.8), (-0.35, 0.94)][:fingers]
    for k, d in enumerate(dirs):
        base = add(wrist, (0, k * 7 * s))
        knuckle = add(base, d, finger_len * s)
        cv.bone(long_bone(base, knuckle, 7 * s, 9 * s), speckles=False)
        if hoof:
            cv.bone([ellipse(add(knuckle, d, 6 * s), 8 * s, 5 * s, 20)], speckles=False)
        else:
            length = claw_len * s * (1.8 if big_thumb and k == 0 else 1)
            cv.bone(claw(knuckle, d, length, 8 * s * (1.3 if big_thumb and k == 0 else 1)), speckles=False)


# ── 各種恐龍 ─────────────────────────────────────────
# 每個函式畫一種恐龍的 8 塊骨頭。Canvas(seed) 的 seed 只影響骨頭上的斑點位置。

def sin_curve(base, amp, power=1.0):
    return lambda t: base + amp * math.sin(math.pi * t) ** power


def triceratops():
    cv = Canvas(11)
    # 後面那根眉角先畫，被頭骨蓋住
    cv.bone(tapered([(272, 112), (252, 60), (196, 16)], 30, 6, cap1=False), speckles=False)
    outline = ("M20,170 C24,140 50,118 86,112 C120,106 150,96 186,92 C230,88 280,100 318,124 "
               "C346,142 356,180 342,210 C330,232 300,242 268,236 C220,228 160,214 110,206 "
               "C70,200 40,196 28,188 C22,184 18,178 20,170 Z")
    holes = [ellipse_pts(74, 150, 18, 13), ellipse_pts(178, 150, 14, 9), ellipse_pts(262, 150, 17, 17)]
    jaw = ("M40,192 C90,206 160,220 230,232 C270,240 300,246 318,236 C318,262 296,276 262,274 "
           "C200,270 120,250 70,232 C46,224 34,208 40,192 Z")
    beak = "M22,168 C8,186 14,208 36,214 C46,206 46,194 40,186 Z"
    cv.bone(skull_shape(outline, holes, [(14, 88), (356, 276)])
            + [path(jaw, [(34, 190), (320, 276)]), path(beak, [(8, 166), (46, 214)])]
            + tapered([(100, 116), (92, 86), (78, 62)], 30, 8, cap1=False),
            cracks=["M120,130 C150,150 170,180 176,204", "M300,128 C312,160 314,190 306,214",
                    "M80,214 C150,236 220,250 290,256"])
    cv.bone(tapered([(256, 108), (226, 52), (150, 8)], 34, 6, cap1=False),
            cracks=["M240,90 C226,64 206,42 186,28"])
    cv.save("skull")

    cv = Canvas(12)
    frill = ("M40,300 C10,220 30,110 110,50 C170,6 250,0 290,40 C330,80 330,170 300,240 "
             "C270,300 200,340 130,340 C90,340 56,326 40,300 Z")
    bumps = [(30, 246), (24, 188), (36, 130), (64, 84), (104, 48), (152, 22), (204, 12), (252, 20),
             (292, 46), (318, 88), (326, 140), (320, 194), (302, 244)]
    cv.bone([path(frill, [(10, 0), (330, 340)])] + [circle(b, 14) for b in bumps],
            cracks=["M80,290 C120,200 170,120 220,50", "M120,320 C170,240 230,170 300,110",
                    "M60,230 C80,170 100,120 130,80", "M190,330 C230,280 270,240 304,200"])
    cv.save("frill")

    cv = Canvas(13)
    neck(cv, [(30, 90), (100, 70), (160, 100), (230, 140)], [40, 44, 48, 50], spine_k=0.3)
    cv.save("neck")

    cv = Canvas(14)
    torso(cv, [(28, 120), (180, 70), (360, 70), (500, 110)], 11, 44,
          sin_curve(150, 150, 1.1), lambda t: 30)
    cv.save("torso")

    cv = Canvas(15)
    pelvis_ornithischian(cv, 1.1)
    cv.save("pelvis")

    cv = Canvas(16)
    leg_column(cv, 0.75, front=True)
    cv.save("arm")

    cv = Canvas(17)
    leg_column(cv, 0.85)
    cv.save("leg")

    cv = Canvas(18)
    tail(cv, [(28, 70), (200, 60), (360, 100), (480, 150)], 20, 44, 0.92, 12, 16, spine_k=0.7)
    cv.save("tail")


def stegosaurus():
    cv = Canvas(21)
    teeth_row(cv, 54, 180, lambda x: 112, 9, 11, 8)
    outline = ("M14,92 C18,72 44,62 80,60 C130,56 180,48 216,54 C244,58 262,78 258,98 "
               "C254,118 236,126 210,124 C160,120 100,118 54,114 C30,112 12,106 14,92 Z")
    holes = [ellipse_pts(40, 86, 12, 8), ellipse_pts(150, 90, 18, 9), ellipse_pts(226, 86, 13, 13)]
    jaw = ("M30,112 C80,124 150,132 210,128 C232,126 246,134 244,146 C230,158 200,158 170,154 "
           "C120,148 70,140 40,130 C30,126 26,118 30,112 Z")
    cv.bone(skull_shape(outline, holes, [(12, 48), (262, 126)]) + [path(jaw, [(26, 110), (246, 158)])],
            cracks=["M100,70 C110,84 114,100 112,112", "M60,128 C120,140 180,146 230,142"])
    cv.save("skull")

    cv = Canvas(22)
    neck(cv, [(30, 100), (90, 70), (160, 80), (220, 116)], [30, 32, 34, 36, 38], spine_k=0.3)
    cv.save("neck")

    cv = Canvas(23)
    torso(cv, [(28, 170), (160, 80), (330, 60), (500, 150)], 13, 42,
          sin_curve(130, 130), lambda t: 36, spine_tilt=4)
    cv.save("torso")

    # 骨板：沿著背部弧線排成兩排、大小不一的菱形板子
    cv = Canvas(24)
    base = [(20, 300), (200, 210), (430, 210), (640, 300)]
    count = 11
    from fossil_kit import sample, polyline_dirs
    pts = sample(base, 200)
    dirs = polyline_dirs(pts)
    plates = []
    for i in range(count):
        t = (i + 0.5) / count
        j = int(t * 200)
        c, d = pts[j], dirs[j]
        up = (d[1], -d[0])
        h = 70 + 110 * math.sin(math.pi * t) ** 0.8
        w = h * 0.78
        if i % 2:
            c = add(c, up, -14)
        plates.append((c, d, up, h, w))
    for c, d, up, h, w in sorted(plates, key=lambda x: x[3]):
        bl, br = add(c, d, -w / 2), add(c, d, w / 2)
        tip = add(add(c, up, h), d, h * 0.12)
        q1 = add(add(c, up, h * 0.62), d, -w * 0.62)
        q2 = add(add(c, up, h * 0.5), d, w * 0.62)
        f = lambda p: f"{p[0]:.1f},{p[1]:.1f}"  # noqa: E731
        dd = f"M{f(bl)} Q{f(q1)} {f(tip)} Q{f(q2)} {f(br)} Q{f(add(c, up, -10))} {f(bl)} Z"
        grain = [f"M{f(add(c, d, k * w * 0.18))} L{f(add(add(c, up, h * 0.7), d, k * w * 0.1 + h * 0.08))}"
                 for k in (-1, 1)]
        cv.bone([path(dd, [bl, br, tip, q1, q2])], cracks=grain)
    cv.save("plates")

    cv = Canvas(25)
    pelvis_ornithischian(cv, 1.0)
    cv.save("pelvis")

    cv = Canvas(26)
    leg_column(cv, 0.8, front=True)
    cv.save("arm")

    cv = Canvas(27)
    leg_column(cv, 0.95)
    cv.save("leg")

    # 尾巴與尾刺
    cv = Canvas(28)
    placed, sizes = tail(cv, [(28, 80), (170, 70), (320, 96), (440, 120)], 18, 40, 0.92, 14, 14,
                         spine_k=0.8)
    for idx in (-7, -4):
        c, ang = placed[idx]
        up = rot((0, -1), ang)
        b = add(c, up, sizes[idx] * 0.3)
        for turn, length in ((42, 120), (66, 104)):
            tip = add(b, rot(up, turn), length)
            cv.bone(tapered([b, add(b, rot(up, turn - 8), length * 0.5), tip], 22, 3, cap1=False),
                    speckles=False)
    cv.save("tail")


def brachiosaurus():
    cv = Canvas(31)
    teeth_row(cv, 30, 112, lambda x: 158 + (x - 30) * 0.08, 8, 14, 10, lean=0.1)
    outline = ("M16,140 C18,116 44,104 80,100 C96,74 112,40 146,30 C182,22 206,48 206,80 "
               "C206,108 196,136 174,152 C142,170 92,172 56,166 C30,162 14,154 16,140 Z")
    holes = [ellipse_pts(150, 62, 22, 16), ellipse_pts(112, 128, 14, 9), ellipse_pts(176, 112, 14, 14)]
    jaw = ("M24,160 C70,172 130,178 176,170 C190,184 180,198 160,200 C110,204 60,196 34,186 "
           "C24,180 20,170 24,160 Z")
    cv.bone(skull_shape(outline, holes, [(14, 22), (208, 172)]) + [path(jaw, [(20, 158), (190, 204)])],
            cracks=["M120,40 C126,70 132,96 140,120", "M60,182 C100,190 140,192 170,186"])
    cv.save("skull")

    cv = Canvas(32)
    neck(cv, [(30, 40), (120, 50), (220, 90), (310, 140)], [30, 31, 32, 34, 35, 37, 38, 40, 42],
         spine_k=0.25, rib_k=1.15)
    cv.save("neck-upper")

    cv = Canvas(33)
    neck(cv, [(30, 40), (130, 56), (230, 90), (330, 130)], [44, 46, 48, 50, 52, 54, 56],
         spine_k=0.35, rib_k=1.15)
    cv.save("neck-lower")

    cv = Canvas(34)
    torso(cv, [(28, 60), (180, 80), (340, 110), (500, 150)], 11, 48,
          sin_curve(170, 150, 1.1), lambda t: 40 - 10 * t)
    cv.save("torso")

    cv = Canvas(35)
    pelvis_saurischian(cv, 1.15)
    cv.save("pelvis")

    cv = Canvas(36)
    leg_column(cv, 1.4, front=True)
    cv.save("arm")

    cv = Canvas(37)
    leg_column(cv, 1.15)
    cv.save("leg")

    cv = Canvas(38)
    tail(cv, [(28, 60), (220, 80), (400, 140), (540, 210)], 22, 46, 0.93, 14, 18, spine_k=0.7)
    cv.save("tail")


def velociraptor():
    cv = Canvas(41)
    teeth_row(cv, 26, 200, lambda x: 94 + (x - 24) * 0.08, 12, 18, 9, lean=0.35, shrink=0.35)
    outline = ("M14,82 C24,70 60,64 110,58 C160,52 214,42 250,42 C280,42 300,60 298,84 "
               "C296,104 282,116 262,116 C220,114 150,104 90,100 C50,98 18,96 14,82 Z")
    holes = [ellipse_pts(38, 78, 12, 7), ellipse_pts(106, 84, 10, 6), ellipse_pts(160, 82, 34, 14),
             ellipse_pts(254, 76, 15, 15)]
    cv.bone(skull_shape(outline, holes, [(12, 40), (300, 118)]),
            cracks=["M60,70 C80,66 100,64 120,64", "M220,56 C226,72 230,90 236,106"])
    cv.save("skull")

    cv = Canvas(42)
    teeth_row(cv, 26, 190, lambda x: 32 - (x - 24) * 0.02, 11, 15, 8, down=False, lean=0.35, shrink=0.35)
    jaw = ("M14,30 C60,24 150,22 226,26 C258,28 280,38 286,54 C282,70 258,76 236,72 "
           "C170,62 90,52 40,48 C22,46 12,40 14,30 Z")
    cv.bone(skull_shape(jaw, [ellipse_pts(232, 50, 16, 8)], [(12, 22), (288, 76)]),
            cracks=["M60,40 C120,46 170,52 210,60"])
    cv.save("jaw")

    cv = Canvas(43)
    neck(cv, [(30, 110), (70, 50), (140, 40), (200, 100)], [26, 28, 30, 32, 34], spine_k=0.35)
    cv.save("neck")

    cv = Canvas(44)
    torso(cv, [(28, 90), (150, 66), (290, 68), (400, 92)], 11, 36, sin_curve(80, 90), lambda t: 26,
          rib_w=(12, 5))
    cv.save("torso")

    cv = Canvas(45)
    pelvis_saurischian(cv, 0.7)
    cv.save("pelvis")

    cv = Canvas(46)
    arm(cv, 0.95, fingers=3, finger_len=26, claw_len=24, forearm=1.5)
    cv.save("arm")

    cv = Canvas(47)
    leg_biped(cv, 0.7, sickle=True, slim=0.8)
    cv.save("leg")

    cv = Canvas(48)
    placed, sizes = tail(cv, [(28, 60), (220, 52), (420, 56), (620, 68)], 28, 32, 0.955, 10, 22,
                         spine_k=0.6, chevron_k=0.6)
    tendons(cv, placed, sizes, 4, 26)
    cv.save("tail")


def ankylosaurus():
    cv = Canvas(51)
    outline = ("M22,116 C22,82 50,56 98,46 C150,36 202,44 226,70 L250,54 L246,92 "
               "C252,118 250,140 236,156 L250,182 L214,166 C176,176 116,176 66,166 "
               "C38,160 22,142 22,116 Z")
    holes = [ellipse_pts(50, 106, 12, 10), ellipse_pts(184, 104, 13, 13)]
    jaw = ("M50,160 C100,172 170,174 220,164 C224,182 210,194 186,196 C140,198 90,192 62,182 "
           "C50,176 46,168 50,160 Z")
    knobs = [circle(k, 11) for k in ((84, 50), (122, 42), (160, 42), (198, 52), (110, 70), (150, 66))]
    cv.bone(skull_shape(outline, holes, [(20, 36), (252, 184)]) + [path(jaw, [(46, 158), (226, 198)])]
            + knobs, cracks=["M80,100 C110,120 140,130 170,134"])
    cv.save("skull")

    cv = Canvas(52)
    neck(cv, [(30, 80), (90, 66), (150, 72), (200, 90)], [40, 44, 48], spine_k=0.25)
    for x0, x1 in ((40, 110), (110, 190)):
        cv.bone(tapered([(x0, 52), ((x0 + x1) / 2, 30), (x1, 52)], 18, 18)
                + [circle(((x0 + x1) / 2, 30), 14)], speckles=False)
    cv.save("neck")

    # 背甲：一大片橢圓骨甲，上面一顆顆骨板，兩側有尖刺
    cv = Canvas(53)
    for x in (50, 110, 400, 460):
        cv.bone(tapered([(x, 166), (x - 16, 196), (x - 28, 222)], 30, 3, cap1=False), speckles=False)
    shield = ("M20,150 C20,80 120,30 260,26 C400,22 500,80 500,150 C500,180 470,190 440,186 "
              "C320,176 180,176 80,186 C46,190 20,180 20,150 Z")
    cv.bone([path(shield, [(18, 22), (502, 190)])])
    rows = [(60, 6, 22), (100, 7, 24), (140, 8, 20)]
    for y, n, r in rows:
        for k in range(n):
            x = 80 + (360 / (n - 1)) * k + (12 if y == 100 else 0)
            cv.bone([ellipse((x, y), r * 1.2, r, 0)], speckles=False, cracks=[f"M{x - r * 0.6},{y} L{x + r * 0.6},{y}"])
    cv.save("armor")

    cv = Canvas(54)
    torso(cv, [(28, 80), (180, 56), (340, 56), (480, 80)], 11, 44, sin_curve(120, 60), lambda t: 18,
          rib_sweep=50)
    cv.save("torso")

    cv = Canvas(55)
    pelvis_ornithischian(cv, 0.95)
    cv.save("pelvis")

    cv = Canvas(56)
    leg_column(cv, 0.62, front=True)
    cv.save("arm")

    cv = Canvas(57)
    leg_column(cv, 0.72)
    cv.save("leg")

    # 尾巴與尾錘
    cv = Canvas(58)
    placed, sizes = tail(cv, [(28, 70), (160, 70), (300, 76), (420, 80)], 16, 34, 0.94, 6, 12,
                         spine_k=0.5, chevron_k=0.6)
    tendons(cv, placed, sizes, 5, 15)
    c, _ = placed[-1]
    cv.bone([ellipse(add(c, (30, 0)), 52, 36), circle(add(c, (14, -26)), 26), circle(add(c, (14, 26)), 26)],
            cracks=[f"M{c[0] + 4},{c[1]} C{c[0] + 30},{c[1] - 10} {c[0] + 56},{c[1] - 4} {c[0] + 74},{c[1] + 6}"])
    cv.save("tail")


def spinosaurus():
    cv = Canvas(61)
    teeth_row(cv, 22, 330, lambda x: 106 + (x - 22) * 0.065, 16, 22, 10, lean=0.1, shrink=0.35)
    outline = ("M14,94 C14,78 30,68 54,68 C78,68 96,76 118,74 C200,68 290,50 342,42 "
               "C378,38 406,54 412,80 C418,106 402,126 378,130 C320,134 230,122 160,110 "
               "C110,102 72,110 42,110 C24,110 14,104 14,94 Z")
    holes = [ellipse_pts(232, 74, 14, 6), ellipse_pts(302, 92, 24, 10), ellipse_pts(364, 76, 14, 14)]
    cv.bone(skull_shape(outline, holes, [(12, 36), (418, 134)]) + [ellipse((330, 44), 20, 10, -10)],
            cracks=["M60,86 C120,88 180,84 240,90", "M340,104 C352,114 360,122 366,128"])
    cv.save("skull")

    cv = Canvas(62)
    teeth_row(cv, 22, 320, lambda x: 32 + (x - 22) * 0.01, 15, 18, 9, down=False, lean=0.1, shrink=0.35)
    jaw = ("M14,30 C30,24 60,26 90,28 C180,32 280,34 350,32 C380,32 400,44 402,60 "
           "C398,76 376,82 352,78 C270,66 160,58 80,54 C44,52 14,46 14,30 Z")
    cv.bone(skull_shape(jaw, [ellipse_pts(356, 56, 16, 8)], [(12, 22), (404, 82)]),
            cracks=["M60,42 C150,48 250,56 330,62"])
    cv.save("jaw")

    cv = Canvas(63)
    neck(cv, [(30, 100), (100, 50), (180, 60), (250, 120)], [34, 36, 38, 40, 42], spine_k=0.6)
    cv.save("neck")

    # 背椎與背帆：神經棘非常高
    cv = Canvas(64)
    torso(cv, [(28, 330), (180, 300), (360, 300), (520, 330)], 12, 42, sin_curve(120, 110),
          lambda t: 70 + 270 * math.sin(math.pi * t) ** 0.8, spine_tilt=4, spine_w=0.32)
    cv.save("torso")

    cv = Canvas(65)
    pelvis_saurischian(cv, 0.85)
    cv.save("pelvis")

    cv = Canvas(66)
    arm(cv, 1.15, fingers=3, finger_len=22, claw_len=22, big_thumb=True)
    cv.save("arm")

    cv = Canvas(67)
    leg_biped(cv, 0.68, slim=0.9)
    cv.save("leg")

    cv = Canvas(68)
    tail(cv, [(28, 90), (220, 80), (420, 110), (600, 150)], 26, 40, 0.94, 22, 22, spine_k=2.2,
         chevron_k=1.8, spine_tilt=22)
    cv.save("tail")


def parasaurolophus():
    cv = Canvas(71)
    cv.bone(tapered([(206, 86), (300, 42), (400, 14)], 36, 30), cracks=["M222,80 C280,52 340,32 392,18"])
    outline = ("M16,124 C14,104 30,94 54,94 C90,94 128,90 160,82 C200,72 232,74 250,92 "
               "C264,106 264,132 252,148 C238,162 212,166 188,162 C140,156 92,154 56,152 "
               "C30,150 16,142 16,124 Z")
    holes = [ellipse_pts(66, 114, 26, 9), ellipse_pts(176, 124, 10, 7), ellipse_pts(218, 108, 13, 13)]
    cv.bone(skull_shape(outline, holes, [(14, 72), (264, 166)]),
            cracks=["M110,100 C130,120 150,136 170,150"])
    cv.save("skull")

    cv = Canvas(72)
    jaw = ("M14,40 C40,30 80,30 120,34 C170,38 210,40 232,34 C252,30 266,44 262,62 "
           "C256,80 232,86 208,82 C160,74 100,66 56,62 C28,60 12,54 14,40 Z")
    cv.bone([path(jaw, [(12, 28), (266, 86)])], cracks=["M90,46 C140,52 190,60 230,62"])
    cv.save("jaw")

    cv = Canvas(73)
    neck(cv, [(30, 110), (80, 50), (160, 46), (230, 100)], [30, 32, 34, 36, 38], spine_k=0.35)
    cv.save("neck")

    cv = Canvas(74)
    torso(cv, [(28, 110), (170, 72), (330, 72), (480, 112)], 11, 42, sin_curve(130, 130), lambda t: 54)
    cv.save("torso")

    cv = Canvas(75)
    pelvis_ornithischian(cv, 1.0)
    cv.save("pelvis")

    cv = Canvas(76)
    arm(cv, 0.95, fingers=4, finger_len=30, forearm=1.6, hoof=True)
    cv.save("arm")

    cv = Canvas(77)
    leg_biped(cv, 0.95, toe="hoof")
    cv.save("leg")

    cv = Canvas(78)
    placed, sizes = tail(cv, [(28, 70), (220, 64), (420, 90), (600, 130)], 24, 42, 0.94, 20, 20,
                         spine_k=1.4, chevron_k=1.2)
    tendons(cv, placed, sizes, 2, 18)
    cv.save("tail")


def pachycephalosaurus():
    cv = Canvas(81)
    teeth_row(cv, 40, 120, lambda x: 178, 7, 9, 7)
    outline = ("M16,152 C14,132 28,120 50,116 C58,84 80,54 120,34 C164,14 216,24 238,62 "
               "C254,92 250,132 232,158 C216,178 188,186 158,186 C112,186 64,182 40,176 "
               "C24,172 16,164 16,152 Z")
    holes = [ellipse_pts(38, 140, 9, 7), ellipse_pts(110, 150, 10, 6), ellipse_pts(176, 142, 13, 13)]
    # 頭頂後方和鼻子上的小瘤：先畫，被頭骨蓋住一半，看起來像邊緣的疙瘩
    cv.bone([circle(k, r) for k, r in (((236, 72), 11), ((246, 100), 12), ((244, 128), 11),
                                       ((232, 156), 10), ((54, 112), 9), ((66, 100), 8), ((26, 134), 8))],
            speckles=False)
    cv.bone(skull_shape(outline, holes, [(14, 18), (256, 188)]),
            cracks=["M90,60 C120,44 170,40 210,56", "M110,90 C140,76 180,76 214,90"])
    cv.save("skull")

    cv = Canvas(82)
    teeth_row(cv, 24, 120, lambda x: 26, 7, 9, 7, down=False)
    jaw = ("M14,24 C50,20 110,20 150,24 C170,26 182,36 182,48 C176,60 156,62 140,58 "
           "C100,50 60,46 34,44 C20,42 12,34 14,24 Z")
    cv.bone([path(jaw, [(12, 18), (184, 64)])])
    cv.save("jaw")

    cv = Canvas(83)
    neck(cv, [(30, 100), (80, 50), (150, 46), (210, 96)], [26, 28, 30, 32, 34], spine_k=0.35)
    cv.save("neck")

    cv = Canvas(84)
    torso(cv, [(28, 100), (150, 72), (290, 72), (410, 100)], 10, 38, sin_curve(100, 100), lambda t: 32,
          rib_w=(14, 6))
    cv.save("torso")

    cv = Canvas(85)
    pelvis_ornithischian(cv, 0.85)
    cv.save("pelvis")

    cv = Canvas(86)
    arm(cv, 0.7, fingers=4, finger_len=18, claw_len=10)
    cv.save("arm")

    cv = Canvas(87)
    leg_biped(cv, 0.85)
    cv.save("leg")

    cv = Canvas(88)
    placed, sizes = tail(cv, [(28, 70), (200, 64), (380, 84), (540, 116)], 22, 36, 0.94, 16, 16,
                         spine_k=0.9)
    tendons(cv, placed, sizes, 2, 18, offsets=(-0.4, 0.05, 0.4))
    cv.save("tail")


def diplodocus():
    cv = Canvas(91)
    teeth_row(cv, 20, 80, lambda x: 110, 6, 16, 6, lean=0.05, shrink=0.1)
    outline = ("M14,90 C14,74 28,66 48,66 C92,66 140,62 178,52 C208,44 238,50 250,70 "
               "C260,88 254,108 236,116 C198,126 120,122 60,116 C32,114 14,108 14,90 Z")
    holes = [ellipse_pts(206, 58, 14, 8), ellipse_pts(90, 92, 10, 7), ellipse_pts(150, 90, 22, 10),
             ellipse_pts(222, 86, 12, 12)]
    jaw = ("M20,112 C70,122 140,128 200,122 C214,134 204,148 186,150 C130,152 70,144 36,134 "
           "C22,128 16,120 20,112 Z")
    cv.bone(skull_shape(outline, holes, [(12, 44), (256, 124)]) + [path(jaw, [(16, 110), (214, 152)])],
            cracks=["M50,78 C100,78 140,74 176,66"])
    cv.save("skull")

    cv = Canvas(92)
    neck(cv, [(30, 60), (120, 54), (210, 66), (300, 86)], [26, 28, 29, 31, 33, 35, 36, 38, 40],
         spine_k=0.25, rib_k=1.15)
    cv.save("neck-upper")

    cv = Canvas(93)
    neck(cv, [(30, 60), (130, 62), (230, 78), (330, 100)], [42, 44, 46, 48, 50, 52, 54],
         spine_k=0.4, rib_k=1.15)
    cv.save("neck-lower")

    cv = Canvas(94)
    torso(cv, [(28, 100), (180, 70), (340, 66), (500, 86)], 11, 46, sin_curve(140, 130), lambda t: 46)
    cv.save("torso")

    cv = Canvas(95)
    pelvis_saurischian(cv, 1.05)
    cv.save("pelvis")

    cv = Canvas(96)
    leg_column(cv, 1.0, front=True)
    cv.save("arm")

    cv = Canvas(97)
    leg_column(cv, 1.2)
    cv.save("leg")

    cv = Canvas(98)
    tail(cv, [(28, 70), (260, 74), (520, 124), (780, 160)], 44, 46, 0.945, 16, 20, spine_k=0.9,
         min_size=6)
    cv.save("tail")


DINOS = {
    "triceratops": triceratops,
    "stegosaurus": stegosaurus,
    "brachiosaurus": brachiosaurus,
    "velociraptor": velociraptor,
    "ankylosaurus": ankylosaurus,
    "spinosaurus": spinosaurus,
    "parasaurolophus": parasaurolophus,
    "pachycephalosaurus": pachycephalosaurus,
    "diplodocus": diplodocus,
}

if __name__ == "__main__":
    for name in sys.argv[1:] or DINOS:
        print(f"── {name}")
        Canvas.out_dir = ASSETS / name
        DINOS[name]()
