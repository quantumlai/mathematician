# 我的恐龍博物館

把化石骨頭自由拖曳、旋轉、縮放，拼出自己想像的恐龍，放上展示台，蓋一座自己的博物館。純 HTML / JavaScript，不需要安裝或建置。

## 玩法

- **博物館**：一打開就是博物館大廳，每個展台上擺著玩家拼好的化石（不管拼成什麼樣子，都會自動縮放、站在檯面上）。展台變多時大廳會往右延伸，可以拖曳、用滾輪或 ← / → 鍵左右參觀。
- **編輯模式**：點展品下方的「✏️ 重新組裝」，或右上角「＋ 新展台」（從空的工作台開始），就會進入工作台擺骨頭、換展示台、改名字。按「儲存」回到博物館；「取消」會放棄這次的修改；「拆除展台」會把整個展台移除。
- **化石庫是有限的**：擁有的每一組素材在化石庫各自一個分類，例如暴龍 (1)、暴龍 (2)。每塊骨頭整座博物館只能用一次，用過的會變淡；同一個展台可以混用不同組、不同恐龍的骨頭。收回骨頭或拆除展台會還回化石庫。
- **展示台不限數量**，每個展台都可以自由換。

### 玩家擁有的素材

目前寫在 `js/inventory.js`（之後改成由系統發送）：
```js
window.FOSSIL_INVENTORY = {
  't-rex': 2,        // 暴龍 2 組
  // stegosaurus: 1, // 劍龍 1 組（要先在 js/fossils.js 加入素材）
};
```
不在清單裡的恐龍不會出現在化石庫。存檔裡每塊骨頭會記住它來自第幾組（`set`）；如果組數減少，沒有對應組別的骨頭會從最新的展台開始收走。

## 開啟遊戲

- **最簡單**：直接雙擊 `index.html`。
- **建議**：用本機伺服器開啟，點骨頭的透明空隙時可以點到下面的骨頭，化石也會更準確地站在展示台上（直接雙擊開啟時，瀏覽器不讓程式讀取圖片像素，只能用骨頭的外框來判斷）。
  - VS Code 安裝 Live Server 擴充功能，對 `index.html` 按右鍵 →「Open with Live Server」，或
  - 在專案資料夾執行 `python -m http.server 8000`，再開 <http://localhost:8000>

所有展台、擺放與展品名稱會存在瀏覽器裡（localStorage），換電腦或換瀏覽器不會帶過去。舊版只有一個展場的存檔，第一次開啟時會自動變成博物館裡的一個展台。

## 恐龍素材

素材建議用 **SVG**（放大不會模糊），也可以用已經去背的 PNG。

暴龍的 8 塊骨頭是 SVG，由 `tools/draw_trex.py` 產生（只需要 Python，不用額外套件）。要調整形狀、顏色，改這支腳本後重新執行：
```
python tools/draw_trex.py
```
8 塊骨頭用同一個比例尺繪製，`js/fossils.js` 裡的 `scale: 0.8` 讓它們放進展場時維持彼此的大小比例。

### 新增恐龍

1. 在 `assets/fossils/` 底下為新恐龍建立資料夾，例如 `assets/fossils/stegosaurus/`，放入每塊骨頭的 SVG。
   根元素要有 `width`、`height` 屬性，畫布請貼齊骨頭（不留大片空白），選取框才會貼合。可以參考 `tools/draw_trex.py` 的畫法再寫一支。
2. 在 `js/fossils.js` 加一筆：
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

再到 `js/inventory.js` 給玩家幾組，重新整理頁面，編輯模式左側的化石庫就會出現新的恐龍。

## 展示台素材

展示台放在 `assets/pedestals/`，清單在 `js/pedestals.js`。新增一種展示台：

1. 畫一張 SVG（或去背 PNG），寬度約 400～600 px，畫布貼齊展示台。博物館裡會用原始尺寸顯示。
2. 在 `js/pedestals.js` 加一筆：
   ```js
   { id: 'gold', name: '黃金展示台', src: 'assets/pedestals/gold.svg', surface: 16 },
   ```
   `surface` 是檯面距離圖片上緣幾 px，化石會站在這條線上。`id` 會用在存檔裡，加入後請不要再改。清單第一筆是新展台的預設展示台。

## 檔案結構

| 路徑 | 說明 |
| --- | --- |
| `index.html` | 頁面結構 |
| `css/style.css` | 樣式（博物館大廳、工作台、化石庫、工具列） |
| `js/fossils.js` | 化石素材清單 |
| `js/inventory.js` | 玩家擁有幾組恐龍素材 |
| `js/pedestals.js` | 展示台素材清單 |
| `js/game.js` | 遊戲邏輯：博物館大廳、編輯模式（拖曳、旋轉、縮放）、存檔 |
| `assets/fossils/t-rex/*.svg` | 暴龍 8 塊骨頭 |
| `assets/pedestals/*.svg` | 展示台（木頭、大理石、岩石） |
| `tools/draw_trex.py` | 產生暴龍 SVG 的腳本 |
