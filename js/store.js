// 玩家資料的存放處。現在存在這台電腦的瀏覽器裡（localStorage），
// 所以只有用同一台電腦、同一個瀏覽器的玩家才能互相參觀博物館。
// 之後要讓不同電腦的玩家互相參觀，只要換掉這個檔案、提供同樣的方法（都回傳 Promise）即可。
//
// player = {
//   id        ：玩家代號正規化後的結果（比對用，不分全形半形、英文大小寫）
//   name      ：玩家代號（第一次輸入時的寫法，顯示用）
//   grade     ：年級 id，對應 js/math/ 裡的 MATH_GRADES
//   bones     ：擁有的骨頭 [{ part: 't-rex/skull', set: 1, at }]，數學練習得到的獎勵
//   exhibits  ：博物館的展台 [{ id, title, pedestal, pieces }]
//   quizzes   ：數學練習紀錄 [{ at, grade, score, total }]
//   createdAt, updatedAt
// }
window.PlayerStore = (() => {
  const KEY = 'fossil-museum-players-v1';

  function readAll() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (data && typeof data.players === 'object') return data;
    } catch (err) {
      // 存檔壞掉就當作沒有
    }
    return { players: {} };
  }

  function idOf(name) {
    return String(name).normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // 回傳複本，避免改到存檔裡的資料卻沒有存
  const copy = (value) => JSON.parse(JSON.stringify(value));

  return {
    idOf,

    async get(name) {
      const player = readAll().players[idOf(name)];
      return player ? copy(player) : null;
    },

    // 所有玩家的摘要，給「參觀其他博物館」清單用
    async list() {
      return Object.values(readAll().players).map((p) => ({
        id: p.id,
        name: p.name,
        grade: p.grade,
        exhibitCount: (p.exhibits || []).length,
        updatedAt: p.updatedAt || 0,
      }));
    },

    async isEmpty() {
      return Object.keys(readAll().players).length === 0;
    },

    // 存檔失敗（例如無痕模式、空間不足）會丟出錯誤
    async save(player) {
      const data = readAll();
      player.updatedAt = Date.now();
      data.players[player.id] = copy(player);
      localStorage.setItem(KEY, JSON.stringify(data));
    },
  };
})();
