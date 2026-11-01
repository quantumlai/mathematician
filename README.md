# 我的恐龍博物館

把化石骨頭自由拖曳、旋轉、縮放，拼出自己想像的恐龍。純 HTML / JavaScript，不需要安裝或建置。

## 開啟遊戲

- **最簡單**：直接雙擊 `index.html`。
- **建議**：用本機伺服器開啟，點骨頭的透明空隙時可以點到下面的骨頭（直接雙擊開啟時，瀏覽器不讓程式讀取圖片像素，只能用骨頭的外框判斷點擊）。
  - VS Code 安裝 Live Server 擴充功能，對 `index.html` 按右鍵 →「Open with Live Server」，或
  - 在專案資料夾執行 `python -m http.server 8000`，再開 <http://localhost:8000>

展場的擺放與展品名稱會自動存在瀏覽器裡（localStorage），換電腦或換瀏覽器不會帶過去。

## 新增恐龍素材

1. 在 `assets/fossils/` 底下為新恐龍建立資料夾，例如 `assets/fossils/stegosaurus/`，放入白底的 jpg 或已去背的 png。
2. 去背並裁掉多餘的透明邊（第一次使用需要 `pip install pillow numpy scipy`）：
   ```
   python tools/prepare_fossil.py assets/fossils/stegosaurus/*.jpg
   ```
   去背只會移除與圖片外框相連的白底，骨頭上的白色高光會保留。處理完請打開 png 看一下，確認沒有誤刪。
3. 在 `js/fossils.js` 加一筆：
   ```js
   {
     id: 'stegosaurus',
     name: '劍龍',
     parts: [
       { id: 'skull', name: '頭骨', src: 'assets/fossils/stegosaurus/1.png' },
       { id: 'plates', name: '背板', src: 'assets/fossils/stegosaurus/2.png' },
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
| `tools/prepare_fossil.py` | 素材去背、裁邊工具 |
