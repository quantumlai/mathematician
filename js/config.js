// 連線設定：玩家資料存在哪一個 LootLocker 遊戲。
//   prod：正式環境，小朋友真正在玩的資料
//   dev ：開發環境，測試用，資料可以隨便新增、刪除
//
// 怎麼切換：
//   - 沒指定時：在自己電腦上開（localhost、127.0.0.1、直接雙擊 index.html）用 dev，其他網址用 prod
//   - 網址加上 ?env=dev 或 ?env=prod 可以指定，例如 http://localhost:8000/?env=prod
// 在自己電腦上開、或是用 dev 時，左上角會顯示目前的環境。
//
// 每個環境：
//   api             ：LootLocker 的 API 網址（https://<domain key>.api.lootlocker.com）
//   gameKey         ：game API key（dev_ 開頭是 LootLocker 的 Stage，prod_ 開頭是 Live）
//   importLocalData ：還沒改用 LootLocker 前存在瀏覽器裡的舊資料，要不要在第一次登入時搬上來
window.GAME_ENVIRONMENTS = {
  prod: {
    name: '正式環境',
    api: 'https://1jjsx26h.api.lootlocker.com',
    gameKey: 'dev_27d7155e7efb473097dba7f324246fdf',
    importLocalData: true,
  },
  dev: {
    name: '開發環境',
    api: 'https://w3meemf6.api.lootlocker.com',
    gameKey: 'dev_edd0823c976546e1bf7fc1a224e77e64',
    importLocalData: false,
  },
};

window.GAME_ENV = (() => {
  const local = location.protocol === 'file:' || ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
  const asked = new URLSearchParams(location.search).get('env');
  const id = window.GAME_ENVIRONMENTS[asked] ? asked : local ? 'dev' : 'prod';
  return { id, local, ...window.GAME_ENVIRONMENTS[id] };
})();
