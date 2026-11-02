// 展示台清單：新增展示台時，在這裡加一筆即可，編輯模式左側會自動出現。
//   id      ：英文代號，不可重複（也用在存檔裡，改名會讓舊展品變回預設展示台）
//   name    ：顯示的名稱
//   src     ：圖片路徑（SVG 或去背 PNG），以原始尺寸畫在博物館裡
//   surface ：檯面距離圖片上緣幾 px，化石會「站」在這條線上
// 第一筆是新展台的預設展示台。
window.PEDESTALS = [
  { id: 'wood', name: '木頭展示台', src: 'assets/pedestals/wood.svg', surface: 16 },
  { id: 'marble', name: '大理石展示台', src: 'assets/pedestals/marble.svg', surface: 14 },
  { id: 'rock', name: '岩石展示台', src: 'assets/pedestals/rock.svg', surface: 24 },
];
