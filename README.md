# 我的恐龍博物館

把化石骨頭自由拖曳、旋轉、縮放，拼出自己想像的恐龍。純 HTML / JavaScript，不需要安裝或建置。

## 開啟遊戲

- **最簡單**：直接雙擊 `index.html`。
- **建議**：用本機伺服器開啟，點骨頭的透明空隙時可以點到下面的骨頭（直接雙擊開啟時，瀏覽器不讓程式讀取圖片像素，只能用骨頭的外框判斷點擊）。
  - VS Code 安裝 Live Server 擴充功能，對 `index.html` 按右鍵 →「Open with Live Server」，或
  - 在專案資料夾執行 `python -m http.server 8000`，再開 <http://localhost:8000>

展場的擺放與展品名稱會自動存在瀏覽器裡（localStorage），換電腦或換瀏覽器不會帶過去。

## 恐龍素材

素材可以是 **SVG**（建議，放大不會模糊）或**去背 PNG**。

暴龍的 8 塊骨頭是 SVG，由 `tools/draw_trex.py` 產生（只需要 Python，不用額外套件）。要調整形狀、顏色，改這支腳本後重新執行：
```
python tools/draw_trex.py
```
8 塊骨頭用同一個比例尺繪製，`js/fossils.js` 裡的 `scale: 0.8` 讓它們放進展場時維持彼此的大小比例。

### 新增恐龍

1. 在 `assets/fossils/` 底下為新恐龍建立資料夾，例如 `assets/fossils/stegosaurus/`。
   - SVG：根元素要有 `width`、`height` 屬性，畫布請貼齊骨頭（不留大片空白），選取框才會貼合。可以參考 `tools/draw_trex.py` 的畫法再寫一支。
   - 白底 jpg 或 PNG：用下一步的工具處理。
2. （僅 jpg / PNG）去背並裁掉多餘的透明邊（第一次使用需要 `pip install pillow numpy scipy`）：
   ```
   python tools/prepare_fossil.py assets/fossils/stegosaurus/*.jpg
   ```
   去背只會移除與圖片外框相連的白底，骨頭上的白色高光會保留。處理完請打開 png 看一下，確認沒有誤刪。
3. 在 `js/fossils.js` 加一筆：
   ```js
   {
     id: 'stegosaurus',
     name: '劍龍',
     scale: 0.8,   // 選填：骨頭用同一比例尺畫時才設定；不設定則每塊縮放到差不多大
     parts: [
       { id: 'skull', name: '頭骨', src: 'assets/fossils/stegosaurus/skull.svg' },
       { id: 'plates', name: '背板', src: 'assets/fossils/stegosaurus/plates.svg' },
     ],
   },
   ```
   `id` 會用在存檔裡，加入後請不要再改，否則玩家已擺好的那塊骨頭會消失。

重新整理頁面，左側化石庫就會出現新的恐龍。

## 檔案結構

| 路徑 | 說明 |
| --- | --- |
| `index.html` | 頁面結構 |
| `css/style.css` | 樣式（展場背景、化石庫、工具列） |
| `js/fossils.js` | 化石素材清單 |
| `js/game.js` | 遊戲邏輯：拖曳、旋轉、縮放、存檔 |
| `assets/fossils/t-rex/*.svg` | 暴龍 8 塊骨頭 |
| `tools/draw_trex.py` | 產生暴龍 SVG 的腳本 |
| `tools/prepare_fossil.py` | jpg / PNG 素材去背、裁邊工具 |
