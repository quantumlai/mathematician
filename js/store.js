// 玩家資料存在 LootLocker（https://lootlocker.com），不同電腦、平板都能登入同一個玩家，也能互相參觀。
//
// 每個玩家代號對應一個 LootLocker 訪客玩家（guest login，player_identifier = "museum:代號"）。
// 資料放在 LootLocker 的玩家儲存空間（player storage），分成：
//   pub.*  公開：名字、年級、角色、展台（別人參觀時讀這份）
//   priv.* 不公開：擁有的骨頭、練習紀錄
//   pin    不公開：4 位數密碼（明碼，忘記時可以在 LootLocker 後台的玩家資料裡查）
// 「參觀其他博物館」的清單來自 LootLocker 排行榜 museums（每次存檔都送一次，分數是展品數）。
//
// 記住登入：輸入密碼登入後，這台電腦的瀏覽器會記住是誰（localStorage），重新整理不用再登入。
// 每次有使用就延長，超過 24 小時沒用、或按登出才需要重新登入。
//
// LootLocker 的限制：
//   - 每個值最多 1500 個字，所以一份資料會切成好幾段：pub.n 是段數，pub.0、pub.1… 是內容。
//   - 不能存 emoji 這類 4 位元組的字，存之前先轉成 \uXXXX 跳脫字元，讀回來時 JSON.parse 會還原。
//
// player = {
//   id, name, grade, role, pin,
//   bones     ：擁有的骨頭 [{ part: 't-rex/skull', set: 1 }]
//   exhibits  ：博物館的展台 [{ id, title, pedestal, pieces }]
//   quizzes   ：數學練習紀錄 [{ at, grade, score, total }]
//   createdAt, updatedAt
// }
window.PlayerStore = (() => {
  const API = 'https://1jjsx26h.api.lootlocker.io';
  const GAME_KEY = 'dev_27d7155e7efb473097dba7f324246fdf'; // Stage 環境的 game API key
  const GAME_VERSION = '1.0.0';
  const LEADERBOARD = 'museums';
  const CHUNK = 1400;
  const REMEMBER_KEY = 'fossil-museum-session';
  const REMEMBER_MS = 24 * 60 * 60 * 1000;

  let session = null; // { token, identifier, playerId }
  let remembered = false; // 這次登入是不是要記在瀏覽器裡

  function rememberNow() {
    if (!remembered || !session) return;
    try {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ ...session, until: Date.now() + REMEMBER_MS }));
    } catch (err) {
      // 記不住就只好下次重新登入
    }
  }

  function forget() {
    remembered = false;
    try {
      localStorage.removeItem(REMEMBER_KEY);
    } catch (err) {
      // 沒關係
    }
  }

  function idOf(name) {
    return String(name).normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  async function request(method, path, body, retry = true) {
    let res;
    try {
      res = await fetch(API + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'x-session-token': session.token } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      throw new Error('連不上伺服器，請檢查網路');
    }
    // 登入過期就用同一個代號重新登入，再試一次（LootLocker 的 token 失效時回 403）
    if ((res.status === 401 || res.status === 403) && retry && session) {
      await startSession(session.identifier);
      return request(method, path, body, false);
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || `伺服器錯誤（${res.status}）`);
    rememberNow(); // 有在用就延長 24 小時
    return data;
  }

  async function startSession(identifier) {
    session = null;
    const data = await request('POST', '/game/v2/session/guest', {
      game_key: GAME_KEY,
      game_version: GAME_VERSION,
      player_identifier: identifier,
    }, false);
    session = { token: data.session_token, identifier, playerId: String(data.player_id) };
  }

  // ── 把一份資料切段存、讀回來再接起來 ─────────────────
  function encode(value) {
    return JSON.stringify(value).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (pair) =>
      `\\u${pair.charCodeAt(0).toString(16)}\\u${pair.charCodeAt(1).toString(16)}`);
  }

  function pack(prefix, value, isPublic) {
    const text = encode(value);
    const items = [];
    for (let i = 0; i * CHUNK < text.length; i++) {
      items.push({ key: `${prefix}.${i}`, value: text.slice(i * CHUNK, (i + 1) * CHUNK), is_public: isPublic });
    }
    items.push({ key: `${prefix}.n`, value: String(items.length), is_public: isPublic });
    return items;
  }

  function unpack(items, prefix) {
    const map = new Map(items.map((it) => [it.key, it.value]));
    const n = Number(map.get(`${prefix}.n`));
    if (!n) return null;
    let text = '';
    for (let i = 0; i < n; i++) text += map.get(`${prefix}.${i}`) ?? '';
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('資料讀不出來：', prefix, err);
      return null;
    }
  }

  // 存檔前把數字縮短一點，資料比較小
  const round = (v, k) => Math.round(v * k) / k;
  function compactExhibits(list) {
    return list.map((ex) => ({
      id: ex.id,
      title: ex.title,
      pedestal: ex.pedestal,
      pieces: ex.pieces.map((p) => ({
        part: p.part,
        set: p.set,
        x: round(p.x, 10),
        y: round(p.y, 10),
        rot: round(p.rot, 10),
        scale: round(p.scale, 1000),
        flip: p.flip,
      })),
    }));
  }

  function publicPart(raw) {
    return {
      name: raw?.name || '',
      grade: raw?.grade || null,
      role: raw?.role || null,
      exhibits: Array.isArray(raw?.exhibits) ? raw.exhibits : [],
      updatedAt: raw?.updatedAt || 0,
    };
  }

  // 讀目前登入玩家自己的資料；還沒建立過博物館回傳 null
  async function readOwn() {
    const data = await request('GET', '/game/v1/player/storage');
    const items = data?.payload || [];
    const pub = unpack(items, 'pub');
    if (!pub) return null;
    const priv = unpack(items, 'priv') || {};
    return {
      id: session.identifier.slice('museum:'.length),
      ...publicPart(pub),
      pin: items.find((it) => it.key === 'pin')?.value || '',
      bones: Array.isArray(priv.bones) ? priv.bones : [],
      quizzes: Array.isArray(priv.quizzes) ? priv.quizzes : [],
      createdAt: priv.createdAt || 0,
    };
  }

  return {
    idOf,

    // 用這個代號登入（第一次用的代號 LootLocker 會自動建立玩家），回傳完整的玩家資料；
    // 還沒建立過博物館的代號回傳 null
    async open(name) {
      forget();
      await startSession(`museum:${idOf(name)}`);
      return readOwn();
    },

    // 輸入密碼、登入成功後呼叫：記住這次登入
    remember() {
      remembered = true;
      rememberNow();
    },

    // 打開網頁時：24 小時內登入過就直接接續，回傳玩家資料；沒有就回傳 null
    async resume() {
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null');
      } catch (err) {
        saved = null;
      }
      if (!saved?.identifier || !saved.token || !(saved.until > Date.now())) {
        forget();
        return null;
      }
      session = { token: saved.token, identifier: saved.identifier, playerId: saved.playerId };
      remembered = true;
      const player = await readOwn(); // token 過期的話 request 會自動用同一個代號重新登入
      if (!player) forget();
      return player;
    },
    // 存到目前登入的玩家（要先 open 同一個代號）
    async save(player) {
      if (!session || session.identifier !== `museum:${player.id}`) throw new Error('還沒登入這個玩家');
      player.updatedAt = Date.now();
      const exhibits = compactExhibits(player.exhibits);
      const items = [
        ...pack('pub', { name: player.name, grade: player.grade, role: player.role, exhibits, updatedAt: player.updatedAt }, true),
        ...pack('priv', { bones: player.bones, quizzes: player.quizzes, createdAt: player.createdAt }, false),
        { key: 'pin', value: String(player.pin || ''), is_public: false },
      ];
      await request('POST', '/game/v1/player/storage', {
        payload: items.map((it, order) => ({ ...it, order })),
      });
      // 排行榜當作「所有博物館」的清單；名字也設在 LootLocker 玩家上，方便在後台找人
      await request('POST', `/game/leaderboards/${LEADERBOARD}/submit`, {
        score: player.exhibits.length,
        metadata: encode({ name: player.name, grade: player.grade, role: player.role, exhibits: player.exhibits.length, updatedAt: player.updatedAt }),
      });
      request('PATCH', '/game/player/name', { name: player.name }).catch(() => {});
    },

    // 所有建立過博物館的玩家：[{ key, name, grade, role, exhibitCount, updatedAt }]
    async list() {
      const out = [];
      let after = null;
      for (let page = 0; page < 10; page++) {
        const query = `count=100${after !== null ? `&after=${after}` : ''}`;
        const data = await request('GET', `/game/leaderboards/${LEADERBOARD}/list?${query}`);
        for (const item of data?.items || []) {
          let meta = {};
          try {
            meta = JSON.parse(item.metadata || '{}');
          } catch (err) {
            meta = {};
          }
          out.push({
            key: String(item.player?.id ?? item.member_id),
            name: meta.name || item.player?.name || '',
            grade: meta.grade || null,
            role: meta.role || null,
            exhibitCount: Number(meta.exhibits ?? item.score) || 0,
            updatedAt: meta.updatedAt || 0,
          });
        }
        const next = data?.pagination?.next_cursor;
        if (!next || !(data?.items || []).length) break;
        after = next;
      }
      return out.filter((p) => p.name);
    },

    // 別人的博物館（只讀得到公開的部分）
    async getPublic(key) {
      const data = await request('GET', `/game/v1/player/${encodeURIComponent(key)}/storage`);
      const pub = unpack(data?.payload || [], 'pub');
      if (!pub) return null;
      return { id: `remote:${key}`, ...publicPart(pub), bones: [], quizzes: [] };
    },

    // 目前登入的玩家在清單裡的 key（列清單時排除自己）
    currentKey: () => session?.playerId || null,

    close() {
      forget();
      session = null;
    },
  };
})();
