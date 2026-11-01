// 化石素材清單：新增恐龍時，在這裡加一筆即可，遊戲左側的化石庫會自動出現。
//   id     ：英文代號，不可重複（也用在存檔裡，改名會讓舊存檔找不到這塊骨頭）
//   name   ：顯示在化石庫的名稱
//   scale  ：（選填）放進展場時的縮放倍率。同一隻恐龍的骨頭若是用同一個比例尺畫的，
//            設定 scale 可以保持彼此的大小比例；沒設定時，每塊骨頭會縮放到差不多大。
//   parts  ：每一塊骨頭，src 是相對於 index.html 的圖片路徑（SVG 或去背 PNG 都可以）
// 暴龍的 SVG 由 tools/draw_trex.py 產生。
window.FOSSIL_LIBRARY = [
  {
    id: 't-rex',
    name: '暴龍',
    scale: 0.8,
    parts: [
      { id: 'skull', name: '頭骨', src: 'assets/fossils/t-rex/skull.svg' },
      { id: 'jaw', name: '下顎', src: 'assets/fossils/t-rex/jaw.svg' },
      { id: 'neck', name: '頸椎', src: 'assets/fossils/t-rex/neck.svg' },
      { id: 'torso', name: '背椎與肋骨', src: 'assets/fossils/t-rex/torso.svg' },
      { id: 'pelvis', name: '骨盆', src: 'assets/fossils/t-rex/pelvis.svg' },
      { id: 'arm', name: '肩胛與前肢', src: 'assets/fossils/t-rex/arm.svg' },
      { id: 'leg', name: '後腿', src: 'assets/fossils/t-rex/leg.svg' },
      { id: 'tail', name: '尾巴', src: 'assets/fossils/t-rex/tail.svg' },
    ],
  },
];
