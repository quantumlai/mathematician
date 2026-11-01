"""把化石素材處理成遊戲可用的 PNG：白底去背 + 裁掉多餘的透明邊。

用法：
    python tools/prepare_fossil.py assets/fossils/stego/*.jpg
    python tools/prepare_fossil.py assets/fossils/t-rex/*.png   # 已去背的 PNG 只會裁邊

輸出：與來源同名的 .png（來源若是 .png 會被覆寫）。
需要套件：pip install pillow numpy scipy
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

PADDING = 6  # 裁邊後保留的透明邊（px）


def remove_white_background(rgb: np.ndarray) -> np.ndarray:
    """只移除與圖片外框相連的白底，骨頭上的白色高光會保留。回傳 RGBA。"""
    mn, mx = rgb.min(2), rgb.max(2)
    cand = (mn > 225) & (mx - mn < 25)

    lab, _ = ndimage.label(cand)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border != 0]
    bg = np.isin(lab, border)

    alpha = np.where(bg, 0.0, 1.0)
    # 描邊外側的反鋸齒像素給半透明，避免白邊
    band = ndimage.binary_dilation(bg, iterations=2) & ~bg
    fringe = np.clip((245 - mn) / 70, 0, 1)
    alpha[band] = fringe[band]

    a = alpha[..., None]
    col = np.where(a > 0, (rgb - 255 * (1 - a)) / np.maximum(a, 1e-3), 0)
    return np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8)


def process(src: Path):
    im = Image.open(src)
    if im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 255:
        rgba = np.asarray(im)
    else:
        rgba = remove_white_background(np.asarray(im.convert("RGB")).astype(np.float32))

    out = Image.fromarray(rgba, "RGBA")
    box = out.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        l, t, r, b = box
        out = out.crop((max(l - PADDING, 0), max(t - PADDING, 0),
                        min(r + PADDING, out.width), min(b + PADDING, out.height)))

    dst = src.with_suffix(".png")
    out.save(dst, optimize=True)
    print(f"{dst}  {out.width}x{out.height}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    for p in sys.argv[1:]:
        process(Path(p))
