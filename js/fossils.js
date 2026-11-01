// 化石素材清單：新增恐龍時，在這裡加一筆即可，遊戲左側的化石庫會自動出現。
//   id     ：英文代號，不可重複（也用在存檔裡，改名會讓舊存檔找不到這塊骨頭）
//   name   ：顯示在化石庫的名稱
//   parts  ：每一塊骨頭，src 是相對於 index.html 的圖片路徑
// 圖片請先用 tools/prepare_fossil.py 去背並裁掉透明邊。
window.FOSSIL_LIBRARY = [
  {
    id: 't-rex',
    name: '暴龍',
    parts: [
      { id: 'skull', name: '頭骨', src: 'assets/fossils/t-rex/1.png' },
      { id: 'ribs', name: '脊椎與肋骨', src: 'assets/fossils/t-rex/2.png' },
      { id: 'femur', name: '腿骨', src: 'assets/fossils/t-rex/3.png' },
      { id: 'tail', name: '尾椎', src: 'assets/fossils/t-rex/4.png' },
    ],
  },
];
