(() => {
  'use strict';

  // 編輯模式的工作台固定 1600×1000，依視窗大小等比縮放
  const WORLD_W = 1600;
  const WORLD_H = 1000;
  const DEFAULT_SIZE = 320; // 新放進工作台的骨頭，長邊約這麼大（工作台座標）
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 3;

  // 博物館大廳高 1000，寬度隨展台數量延伸；以下都是大廳座標
  const HALL_H = 1000;
  const ENTRANCE_W = 780;     // 入口區寬度（門、採集按鈕、館長）
  const BAY_W = 760;          // 每個展台佔的寬度
  const END_PAD = 160;        // 最後面留白
  const PEDESTAL_BOTTOM = 836; // 展示台底部站在地板的這個高度
  const DISPLAY_MAX_W = 640;  // 化石成品最大的寬、高，超過會等比縮小
  const DISPLAY_MAX_H = 480;

  const QUIZ_PASS = 8;        // 數學練習答對幾題可以得到一塊骨頭
  const LAST_PLAYER_KEY = 'fossil-museum-last-player'; // 登入畫面預先填好上次的玩家代號

  // 搬到 LootLocker 以前存在這台電腦瀏覽器裡的資料，玩家第一次線上登入時一起搬上去（見 localImport）
  const LOCAL_PLAYERS_KEY = 'fossil-museum-players-v1';
  const LEGACY_KEYS = ['fossil-museum-v3', 'fossil-museum-v2']; // 還沒有玩家代號時的存檔
  const LEGACY_SETS = { 't-rex': 2 };
  const LEGACY_UPLOADED_KEY = 'fossil-museum-legacy-uploaded';

  const $ = (sel) => document.querySelector(sel);
  const viewport = $('#viewport');
  const world = $('#world');
  const piecesLayer = $('#pieces');
  const selectionBox = $('#selection');
  const toolbar = $('#toolbar');
  const placardTitle = $('#placard-title');
  const museum = $('#museum');
  const hallSize = $('#hall-size');
  const hall = $('#hall');

  // ── 素材 ──────────────────────────────────────────
  // parts['t-rex/skull'] = { key, name, src, img, w, h, mask }
  const parts = {};

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('圖片載入失敗：', src);
        resolve(null);
      };
      img.src = src;
    });
  }

  // 讀出透明度，讓點擊骨頭的透明處可以穿過去點到下面的骨頭。
  // 直接雙擊 index.html（file://）開啟時瀏覽器不允許讀取像素，會退回用外框判斷。
  function buildMask(img) {
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const data = g.getImageData(0, 0, c.width, c.height).data;
      const mask = new Uint8Array(c.width * c.height);
      for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3];
      return mask;
    } catch (err) {
      return null;
    }
  }

  async function loadLibrary() {
    const jobs = [];
    for (const dino of window.FOSSIL_LIBRARY || []) {
      for (const part of dino.parts) {
        const key = `${dino.id}/${part.id}`;
        jobs.push(loadImage(part.src).then((img) => {
          if (!img) return;
          parts[key] = {
            key,
            name: `${dino.name}・${part.name}`,
            src: part.src,
            img,
            w: img.naturalWidth,
            h: img.naturalHeight,
            baseScale: part.scale ?? dino.scale ?? null,
            mask: buildMask(img),
          };
        }));
      }
    }
    await Promise.all(jobs);
  }

  // pedestals['wood'] = { id, name, src, surface, w, h }
  const pedestals = {};
  let defaultPedestal = null;

  async function loadPedestals() {
    const list = window.PEDESTALS || [];
    const imgs = await Promise.all(list.map((ped) => loadImage(ped.src)));
    list.forEach((ped, i) => {
      const img = imgs[i];
      if (!img) return;
      pedestals[ped.id] = { ...ped, surface: ped.surface ?? 0, w: img.naturalWidth, h: img.naturalHeight };
      defaultPedestal ??= ped.id;
    });
  }

  function pedestalOf(exhibit) {
    return pedestals[exhibit.pedestal] || pedestals[defaultPedestal] || null;
  }

  // 骨頭的 CSS transform；ox / oy 是要扣掉的原點（博物館裡用成品的左上角）
  function pieceTransform(piece, part, ox = 0, oy = 0) {
    const sx = piece.flip ? -piece.scale : piece.scale;
    return `translate(${piece.x - ox - part.w / 2}px, ${piece.y - oy - part.h / 2}px) ` +
      `rotate(${piece.rot}deg) scale(${sx}, ${piece.scale})`;
  }

  function makePieceImg(part) {
    const el = document.createElement('img');
    el.className = 'piece';
    el.src = part.src;
    el.alt = part.name;
    el.draggable = false;
    el.style.width = `${part.w}px`;
    el.style.height = `${part.h}px`;
    return el;
  }

  // ── 展品資料 ──────────────────────────────────────
  // 登入的玩家是 player；正在看的博物館主人是 owner（參觀別人時兩者不同）。
  // exhibits 是 owner 的展台。
  // exhibit = { id, title, pedestal, pieces: [{ part, set, x, y, rot, scale, flip }] }
  // pieces 用的是工作台座標，博物館裡會自動縮放、擺到展示台上。
  // set 是這塊骨頭來自第幾組素材（1 起算），例如 { part: 't-rex/skull', set: 2 } 是暴龍 (2) 的頭骨
  let player = null;
  let owner = null;
  let exhibits = [];

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function cleanPieces(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter((p) => p && typeof p.part === 'string')
      .map((p) => ({
        part: p.part,
        set: Math.floor(+p.set) || 0, // 舊存檔沒有 set，由 enforceInventory 補上
        x: +p.x || 0,
        y: +p.y || 0,
        rot: +p.rot || 0,
        scale: clampScale(+p.scale || 0.3),
        flip: !!p.flip,
      }));
  }

  // ── 狀態 ──────────────────────────────────────────
  // piece = { uid, part, set, x, y, rot, scale, flip }，x / y 是中心點的工作台座標，rot 是角度
  let pieces = [];
  let nextUid = 1;
  let selected = null;
  const elements = new Map(); // uid → <img>

  function defaultScale(part) {
    return part.baseScale ?? DEFAULT_SIZE / Math.max(part.w, part.h);
  }

  // ── 擁有的骨頭 ────────────────────────────────────
  // 化石庫是有限的：玩家只能用數學練習得到的骨頭（player.bones），每一塊在整座博物館只能用一次。
  function boneKey(partKey, set) {
    return `${partKey}#${set}`;
  }

  function ownedBones() {
    return new Set((player?.bones || []).map((b) => boneKey(b.part, b.set)));
  }

  // 已經用掉的骨頭：其他展台上的 + 工作台上的
  function usedBones() {
    const used = new Set(pieces.map((p) => boneKey(p.part, p.set)));
    for (const ex of player?.exhibits || []) {
      if (ex === editing?.exhibit) continue;
      for (const p of ex.pieces) used.add(boneKey(p.part, p.set));
    }
    return used;
  }

  // 檢查玩家展台上的每塊骨頭：沒有組別（舊存檔）或重複的，改用還沒用過、同部位的另一塊；
  // 沒有擁有的骨頭就從最新的展台開始拿掉。回傳是否有改動。
  function enforceInventory(p) {
    const owned = new Set(p.bones.map((b) => boneKey(b.part, b.set)));
    const used = new Set();
    const unplaced = new Set();
    for (const piece of p.exhibits.flatMap((ex) => ex.pieces)) {
      const key = boneKey(piece.part, piece.set);
      if (owned.has(key) && !used.has(key)) used.add(key);
      else unplaced.add(piece);
    }
    for (const piece of unplaced) {
      const free = p.bones.find((b) => b.part === piece.part && !used.has(boneKey(b.part, b.set)));
      if (free) {
        piece.set = free.set;
        used.add(boneKey(free.part, free.set));
        unplaced.delete(piece);
      }
    }
    if (!unplaced.size) return false;
    for (const ex of p.exhibits) ex.pieces = ex.pieces.filter((piece) => !unplaced.has(piece));
    return true;
  }

  function addPiece(partKey, set, x, y, extra = {}) {
    const part = parts[partKey];
    const key = boneKey(partKey, set);
    if (!part || !ownedBones().has(key) || usedBones().has(key)) return null;
    const piece = {
      uid: nextUid++,
      part: partKey,
      set,
      x,
      y,
      rot: 0,
      scale: defaultScale(part),
      flip: false,
      ...extra,
    };
    pieces.push(piece);
    const el = makePieceImg(part);
    piecesLayer.appendChild(el);
    elements.set(piece.uid, el);
    render(piece);
    refreshLibrary();
    return piece;
  }

  function removePiece(piece) {
    pieces = pieces.filter((p) => p !== piece);
    elements.get(piece.uid)?.remove();
    elements.delete(piece.uid);
    if (selected === piece) select(null);
    refreshLibrary();
  }

  function clearAll() {
    for (const p of [...pieces]) removePiece(p);
  }

  function bringToFront(piece) {
    pieces = pieces.filter((p) => p !== piece);
    pieces.push(piece);
    piecesLayer.appendChild(elements.get(piece.uid));
  }

  function sendToBack(piece) {
    pieces = pieces.filter((p) => p !== piece);
    pieces.unshift(piece);
    piecesLayer.prepend(elements.get(piece.uid));
  }

  // ── 繪製 ──────────────────────────────────────────
  function render(piece) {
    // 中心點不能離開展場，免得骨頭拖出去就找不回來
    piece.x = Math.min(WORLD_W, Math.max(0, piece.x));
    piece.y = Math.min(WORLD_H, Math.max(0, piece.y));
    const part = parts[piece.part];
    elements.get(piece.uid).style.transform = pieceTransform(piece, part);
    if (piece === selected) renderSelection();
  }

  function renderSelection() {
    if (!selected) {
      selectionBox.hidden = true;
      toolbar.hidden = true;
      return;
    }
    const part = parts[selected.part];
    const w = part.w * selected.scale;
    const h = part.h * selected.scale;
    selectionBox.hidden = false;
    toolbar.hidden = false;
    selectionBox.style.width = `${w}px`;
    selectionBox.style.height = `${h}px`;
    selectionBox.style.transform =
      `translate(${selected.x - w / 2}px, ${selected.y - h / 2}px) rotate(${selected.rot}deg)`;
  }

  function select(piece) {
    selected = piece;
    renderSelection();
  }

  // 工作台依視窗大小等比縮放置中
  let view = { s: 1, ox: 0, oy: 0 };

  function fitWorld() {
    const r = viewport.getBoundingClientRect();
    const s = Math.min(r.width / WORLD_W, r.height / WORLD_H);
    view = { s, ox: (r.width - WORLD_W * s) / 2, oy: (r.height - WORLD_H * s) / 2 };
    world.style.transform = `translate(${view.ox}px, ${view.oy}px) scale(${s})`;
    world.style.setProperty('--ui-inv', String(1 / s));
  }

  function toWorld(clientX, clientY) {
    const r = viewport.getBoundingClientRect();
    return {
      x: (clientX - r.left - view.ox) / view.s,
      y: (clientY - r.top - view.oy) / view.s,
    };
  }

  function isInsideViewport(clientX, clientY) {
    const r = viewport.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  // ── 點擊判定 ──────────────────────────────────────
  function pieceAt(x, y) {
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      const part = parts[p.part];
      const a = (-p.rot * Math.PI) / 180;
      const dx = x - p.x;
      const dy = y - p.y;
      let lx = (dx * Math.cos(a) - dy * Math.sin(a)) / p.scale;
      const ly = (dx * Math.sin(a) + dy * Math.cos(a)) / p.scale;
      if (p.flip) lx = -lx;
      const u = Math.floor(lx + part.w / 2);
      const v = Math.floor(ly + part.h / 2);
      if (u < 0 || v < 0 || u >= part.w || v >= part.h) continue;
      if (!part.mask || part.mask[v * part.w + u] > 30) return p;
    }
    return null;
  }

  // ── 拖曳、旋轉、縮放（滑鼠與觸控） ─────────────────
  const pointers = new Map(); // pointerId → { x, y }（展場座標）
  let gesture = null;

  function startDrag(piece, id) {
    const pt = pointers.get(id);
    gesture = { type: 'drag', piece, id, offX: piece.x - pt.x, offY: piece.y - pt.y };
    elements.get(piece.uid).classList.add('dragging');
  }

  function startPinch(piece) {
    const [a, b] = [...pointers.values()];
    gesture = {
      type: 'pinch',
      piece,
      ids: [...pointers.keys()].slice(0, 2),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      dist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      angle: Math.atan2(b.y - a.y, b.x - a.x),
      start: { ...piece },
    };
  }

  function endGesture() {
    if (gesture?.piece) elements.get(gesture.piece.uid)?.classList.remove('dragging');
    gesture = null;
    markDirty();
  }

  viewport.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.placard')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    document.activeElement?.blur();

    const pt = toWorld(e.clientX, e.clientY);
    pointers.set(e.pointerId, pt);
    viewport.setPointerCapture(e.pointerId);

    const handle = e.target.dataset?.handle;
    if (handle && selected) {
      const p = selected;
      gesture = handle === 'rotate'
        ? { type: 'rotate', piece: p, id: e.pointerId,
            angle: Math.atan2(pt.y - p.y, pt.x - p.x), rot: p.rot }
        : { type: 'scale', piece: p, id: e.pointerId,
            dist: Math.hypot(pt.x - p.x, pt.y - p.y) || 1, scale: p.scale };
      return;
    }

    // 第二根手指放在同一塊骨頭上 → 兩指操作
    if (gesture?.type === 'drag' && pointers.size === 2) {
      startPinch(gesture.piece);
      return;
    }
    if (gesture) return;

    const hit = pieceAt(pt.x, pt.y);
    if (hit) {
      select(hit);
      bringToFront(hit);
      startDrag(hit, e.pointerId);
    } else {
      select(null);
    }
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    const pt = toWorld(e.clientX, e.clientY);
    pointers.set(e.pointerId, pt);
    if (!gesture) return;
    const p = gesture.piece;

    if (gesture.type === 'drag' && e.pointerId === gesture.id) {
      p.x = pt.x + gesture.offX;
      p.y = pt.y + gesture.offY;
    } else if (gesture.type === 'rotate' && e.pointerId === gesture.id) {
      const angle = Math.atan2(pt.y - p.y, pt.x - p.x);
      let rot = gesture.rot + ((angle - gesture.angle) * 180) / Math.PI;
      if (e.shiftKey) rot = Math.round(rot / 15) * 15;
      p.rot = normalizeAngle(rot);
    } else if (gesture.type === 'scale' && e.pointerId === gesture.id) {
      const dist = Math.hypot(pt.x - p.x, pt.y - p.y);
      p.scale = clampScale(gesture.scale * (dist / gesture.dist));
    } else if (gesture.type === 'pinch') {
      const a = pointers.get(gesture.ids[0]);
      const b = pointers.get(gesture.ids[1]);
      if (!a || !b) return;
      const s = gesture.start;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      p.x = s.x + (mid.x - gesture.mid.x);
      p.y = s.y + (mid.y - gesture.mid.y);
      p.scale = clampScale(s.scale * (dist / gesture.dist));
      p.rot = normalizeAngle(s.rot + ((angle - gesture.angle) * 180) / Math.PI);
    } else {
      return;
    }
    render(p);
  });

  function onPointerEnd(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (!gesture) return;
    if (gesture.type === 'pinch') {
      // 放開一指後，用剩下那根手指繼續拖曳
      const rest = [...pointers.keys()].find((id) => gesture.ids.includes(id));
      if (rest !== undefined) {
        const piece = gesture.piece;
        startDrag(piece, rest);
        return;
      }
    } else if (gesture.id !== e.pointerId) {
      return;
    }
    endGesture();
  }
  viewport.addEventListener('pointerup', onPointerEnd);
  viewport.addEventListener('pointercancel', onPointerEnd);

  // 滾輪：旋轉；Shift + 滾輪：縮放
  viewport.addEventListener('wheel', (e) => {
    if (!selected) return;
    e.preventDefault();
    const dir = Math.sign(e.deltaY || e.deltaX);
    if (e.shiftKey || e.ctrlKey) {
      selected.scale = clampScale(selected.scale * (dir < 0 ? 1.08 : 1 / 1.08));
    } else {
      selected.rot = normalizeAngle(selected.rot + dir * 5);
    }
    render(selected);
    markDirty();
  }, { passive: false });

  function normalizeAngle(deg) {
    return ((deg % 360) + 540) % 360 - 180;
  }

  function clampScale(s) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
  }

  // ── 工具列與鍵盤 ──────────────────────────────────
  const actions = {
    'rotate-left': (p) => { p.rot = normalizeAngle(p.rot - 15); },
    'rotate-right': (p) => { p.rot = normalizeAngle(p.rot + 15); },
    flip: (p) => { p.flip = !p.flip; },
    bigger: (p) => { p.scale = clampScale(p.scale * 1.15); },
    smaller: (p) => { p.scale = clampScale(p.scale / 1.15); },
    front: (p) => bringToFront(p),
    back: (p) => sendToBack(p),
    delete: (p) => removePiece(p),
  };

  function runAction(name) {
    if (!selected || !actions[name]) return;
    const p = selected;
    actions[name](p);
    if (pieces.includes(p)) render(p);
    renderSelection();
    markDirty();
  }

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (btn) runAction(btn.dataset.action);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.isContentEditable || e.target.closest?.('dialog, input, #quiz')) return;
    if (window.MathQuiz.isOpen() || window.ScratchPad.isOpen() || document.body.classList.contains('mode-login')) return;
    if (!editing) {
      const dir = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (dir) {
        museum.scrollBy({ left: dir * BAY_W * hallScale, behavior: 'smooth' });
        e.preventDefault();
      }
      return;
    }
    if (!selected) return;
    const step = e.shiftKey ? 20 : 5;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const keyActions = {
      q: 'rotate-left', e: 'rotate-right', f: 'flip', '+': 'bigger', '=': 'bigger', '-': 'smaller',
      ']': 'front', '[': 'back', Delete: 'delete', Backspace: 'delete',
    };
    if (moves[e.key]) {
      selected.x += moves[e.key][0];
      selected.y += moves[e.key][1];
      render(selected);
      markDirty();
    } else if (keyActions[e.key.length === 1 ? e.key.toLowerCase() : e.key]) {
      runAction(keyActions[e.key.length === 1 ? e.key.toLowerCase() : e.key]);
    } else if (e.key === 'Escape') {
      select(null);
    } else {
      return;
    }
    e.preventDefault();
  });

  // ── 化石庫 ────────────────────────────────────────
  // 每組素材一個分類：暴龍 (1)、暴龍 (2)……每個縮圖就是一塊骨頭。
  // 還沒採集到的骨頭也會列出來（暗暗的），讓玩家知道還缺哪些。
  const thumbs = new Map(); // boneKey → 化石庫裡的縮圖
  let freshBone = null;     // 剛採集到的骨頭，在化石庫閃一下

  function refreshLibrary() {
    const used = usedBones();
    const owned = ownedBones();
    for (const [key, thumb] of thumbs) {
      const isOwned = owned.has(key);
      const isUsed = isOwned && used.has(key);
      thumb.classList.toggle('locked', !isOwned);
      thumb.classList.toggle('used', isUsed);
      thumb.classList.toggle('fresh', key === freshBone);
      thumb.title = !isOwned ? `${thumb.dataset.name}（還沒採集到）`
        : isUsed ? `${thumb.dataset.name}（已經用過了）` : thumb.dataset.name;
    }
  }

  // 化石庫只列出已經有骨頭的恐龍；最上面提示一共有幾種恐龍可以搜集
  function buildLibrary() {
    const list = $('#library-list');
    list.innerHTML = '';
    thumbs.clear();
    const owned = ownedBones();
    const allDinos = (window.FOSSIL_LIBRARY || []).filter((d) => d.parts.some((part) => parts[`${d.id}/${part.id}`]));
    const found = allDinos.filter((d) => (player?.bones || []).some((b) => b.part.startsWith(`${d.id}/`))).length;
    list.appendChild(elem('p', 'library-goal', found === allDinos.length
      ? `🦕 ${allDinos.length} 種恐龍你都找到了，好厲害！`
      : `🦕 一共有 ${allDinos.length} 種恐龍等你去搜集，你已經找到 ${found} 種！`));
    for (const dino of allDinos) {
      const sets = [...new Set((player?.bones || [])
        .filter((b) => b.part.startsWith(`${dino.id}/`))
        .map((b) => b.set))].sort((a, b) => a - b);
      for (const set of sets) {
        const group = document.createElement('div');
        group.className = 'dino-group';
        const title = document.createElement('h3');
        const have = dino.parts.filter((part) => owned.has(boneKey(`${dino.id}/${part.id}`, set))).length;
        title.append(`${dino.name} (${set})`, elem('span', 'dino-progress', `${have}/${dino.parts.length}`));
        const grid = document.createElement('div');
        grid.className = 'dino-parts';
        for (const part of dino.parts) {
          const partKey = `${dino.id}/${part.id}`;
          if (!parts[partKey]) continue;
          const thumb = document.createElement('div');
          thumb.className = 'part-thumb';
          thumb.dataset.name = `${dino.name} (${set})・${part.name}`;
          const img = document.createElement('img');
          img.src = part.src;
          img.alt = part.name;
          img.draggable = false;
          thumb.append(img, elem('span', 'part-name', part.name));
          enableThumbDrag(thumb, partKey, set);
          thumbs.set(boneKey(partKey, set), thumb);
          grid.appendChild(thumb);
        }
        group.append(title, grid);
        list.appendChild(group);
      }
    }
    if (!found) {
      list.appendChild(elem('p', 'library-empty', '還沒有化石，按上方「⛏️ 採集新化石」去挖挖看！'));
    }
    refreshLibrary();
  }

  // 從化石庫拖進工作台；只點一下就放在工作台中間附近。
  // 還沒採集到、用過的骨頭不能再拿；用過的骨頭在工作台上的話，點它會選取那一塊。
  function enableThumbDrag(thumb, key, set) {
    let ghost = null;
    let start = null;

    thumb.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const bone = boneKey(key, set);
      if (bone === freshBone) {
        freshBone = null;
        thumb.classList.remove('fresh');
      }
      if (!ownedBones().has(bone) || usedBones().has(bone)) {
        const existing = pieces.find((p) => p.part === key && p.set === set);
        if (existing) {
          select(existing);
          bringToFront(existing);
          markDirty();
        } else {
          thumb.classList.remove('shake');
          void thumb.offsetWidth; // 重新觸發動畫
          thumb.classList.add('shake');
        }
        return;
      }
      start = { x: e.clientX, y: e.clientY };
      thumb.setPointerCapture(e.pointerId);
    });

    thumb.addEventListener('pointermove', (e) => {
      if (!start) return;
      if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) {
        ghost = document.createElement('img');
        ghost.className = 'drag-ghost';
        ghost.src = parts[key].src;
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.transform = `translate(${e.clientX - 70}px, ${e.clientY - 40}px)`;
      }
    });

    thumb.addEventListener('pointerup', (e) => {
      if (!start) return;
      let piece = null;
      if (ghost) {
        if (isInsideViewport(e.clientX, e.clientY)) {
          const pt = toWorld(e.clientX, e.clientY);
          piece = addPiece(key, set, pt.x, pt.y);
        }
      } else {
        const jitter = () => (Math.random() - 0.5) * 160;
        piece = addPiece(key, set, WORLD_W / 2 + jitter(), WORLD_H * 0.45 + jitter());
      }
      if (piece) {
        select(piece);
        markDirty();
      }
      cleanup();
    });

    thumb.addEventListener('pointercancel', cleanup);

    function cleanup() {
      ghost?.remove();
      ghost = null;
      start = null;
    }
  }


  // ── 展示台選擇 ────────────────────────────────────
  const pedestalButtons = new Map(); // pedestalId → 按鈕

  function buildPedestalPicker() {
    const list = $('#pedestal-list');
    list.innerHTML = '';
    for (const ped of Object.values(pedestals)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pedestal-option';
      btn.title = ped.name;
      const img = document.createElement('img');
      img.src = ped.src;
      img.alt = '';
      img.draggable = false;
      const label = document.createElement('span');
      label.textContent = ped.name;
      btn.append(img, label);
      btn.addEventListener('click', () => {
        if (!editing) return;
        editing.pedestal = ped.id;
        refreshPedestalPicker();
        markDirty();
      });
      pedestalButtons.set(ped.id, btn);
      list.appendChild(btn);
    }
  }

  function refreshPedestalPicker() {
    const current = editing && (pedestals[editing.pedestal] ? editing.pedestal : defaultPedestal);
    for (const [id, btn] of pedestalButtons) btn.classList.toggle('active', id === current);
  }

  // ── 博物館大廳 ────────────────────────────────────
  let hallScale = 1;
  let hallContentW = 0;

  // 骨頭實際佔的範圍（工作台座標）。讀得到像素時只算不透明的地方，化石才會剛好站在檯面上。
  function piecesBounds(list) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of list) {
      const part = parts[p.part];
      if (!part) continue;
      const a = (p.rot * Math.PI) / 180;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const add = (u, v) => {
        let lx = (u - part.w / 2) * p.scale;
        const ly = (v - part.h / 2) * p.scale;
        if (p.flip) lx = -lx;
        const x = p.x + lx * cos - ly * sin;
        const y = p.y + lx * sin + ly * cos;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      };
      if (part.mask) {
        const step = Math.max(2, Math.round(Math.max(part.w, part.h) / 120));
        for (let v = 0; v < part.h; v += step) {
          for (let u = 0; u < part.w; u += step) {
            if (part.mask[v * part.w + u] > 30) add(u + step / 2, v + step / 2);
          }
        }
      } else {
        add(0, 0);
        add(part.w, 0);
        add(0, part.h);
        add(part.w, part.h);
      }
    }
    if (minX > maxX) return null;
    return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
  }

  function elem(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const readonly = () => owner !== player;

  function buildEntrance() {
    const entrance = elem('div', 'entrance');
    entrance.style.width = `${ENTRANCE_W}px`;
    const sign = elem('div', 'entrance-sign');
    const title = elem('div', 'entrance-title', museumName(owner));
    // 名字長短不一，字縮小到招牌放得下一行（招牌內寬約 480，每個字再加 6 的字距）
    title.style.fontSize = `${Math.min(58, Math.floor(480 / [...title.textContent].length - 6))}px`;
    sign.append(title, elem('div', 'entrance-sub', 'DINOSAUR MUSEUM'));
    let text;
    if (readonly()) {
      text = exhibits.length ? `目前展出 ${exhibits.length} 件化石` : '這裡還沒有展品';
    } else {
      const bones = player.bones.length;
      text = exhibits.length ? `目前展出 ${exhibits.length} 件化石・收藏 ${bones} 塊骨頭`
        : bones ? `收藏 ${bones} 塊骨頭，蓋一個展台吧！` : '還沒有化石，先去採集吧！';
    }
    entrance.append(sign, elem('div', 'entrance-door'), elem('div', 'entrance-count', text));
    if (!readonly()) {
      const dig = elem('button', 'entrance-dig dig', '⛏️ 我要採集新化石（數學）');
      dig.type = 'button';
      dig.dataset.quiz = '';
      entrance.appendChild(dig);
    }
    entrance.appendChild(elem('div', 'entrance-arrow', '往這邊參觀 →'));

    // 館長（博物館主人的角色）站在門口迎接
    const host = elem('div', 'host');
    const figure = elem('div', 'host-figure');
    figure.innerHTML = characterSVG(owner.role, 'happy');
    host.append(
      elem('div', 'host-bubble', readonly() ? '歡迎參觀！' : '歡迎回來！'),
      figure,
      elem('div', 'host-name', `館長 ${owner.name}`),
    );
    entrance.appendChild(host);
    return entrance;
  }

  function buildBay(exhibit, index, left, editable) {
    const bay = elem('div', 'bay');
    if (exhibit.id) bay.dataset.id = exhibit.id;
    bay.style.left = `${left}px`;
    bay.style.width = `${BAY_W}px`;
    bay.append(elem('div', 'column'), elem('div', 'spotlight'), elem('div', 'light-pool'));

    const ped = pedestalOf(exhibit);
    let surfaceY = PEDESTAL_BOTTOM;
    if (ped) {
      const img = elem('img', 'pedestal');
      img.src = ped.src;
      img.alt = '';
      img.draggable = false;
      img.style.left = `${(BAY_W - ped.w) / 2}px`;
      img.style.top = `${PEDESTAL_BOTTOM - ped.h}px`;
      bay.appendChild(img);
      surfaceY = PEDESTAL_BOTTOM - ped.h + ped.surface;
    }

    // 不管拼成什麼樣子，都等比縮放到放得下，底部貼齊檯面、左右置中
    const box = piecesBounds(exhibit.pieces);
    if (box) {
      const k = Math.min(1, DISPLAY_MAX_W / box.w, DISPLAY_MAX_H / box.h);
      const display = elem('div', 'display');
      display.style.left = `${(BAY_W - box.w * k) / 2}px`;
      display.style.top = `${surfaceY - box.h * k}px`;
      display.style.width = `${box.w * k}px`;
      display.style.height = `${box.h * k}px`;
      const inner = elem('div', 'display-inner');
      inner.style.transform = `scale(${k})`;
      for (const p of exhibit.pieces) {
        const part = parts[p.part];
        if (!part) continue;
        const img = makePieceImg(part);
        img.style.transform = pieceTransform({ flip: false, ...p }, part, box.x, box.y);
        inner.appendChild(img);
      }
      display.appendChild(inner);
      bay.appendChild(display);
    } else {
      const empty = elem('div', 'display-empty', '（空展台）');
      empty.style.top = `${surfaceY - 80}px`;
      bay.appendChild(empty);
    }

    const placard = elem('div', 'exhibit-placard');
    placard.append(
      elem('div', 'exhibit-no', `No. ${String(index + 1).padStart(3, '0')}`),
      elem('div', 'exhibit-title', exhibit.title || '無名恐龍'),
    );
    if (editable) {
      const btn = elem('button', 'exhibit-edit', '✏️ 重新組裝');
      btn.type = 'button';
      btn.dataset.edit = exhibit.id;
      placard.appendChild(btn);
    }
    bay.appendChild(placard);
    return bay;
  }

  function buildAddBay(left) {
    const bay = elem('div', 'bay bay-add');
    bay.style.left = `${left}px`;
    bay.style.width = `${BAY_W}px`;
    const btn = elem('button', 'add-pedestal', '＋ 新增展台');
    btn.type = 'button';
    btn.dataset.new = '';
    bay.append(elem('div', 'column'), elem('div', 'add-outline'), btn);
    return bay;
  }

  function museumName(p) {
    return `${p.name}的恐龍博物館`;
  }

  function renderMuseum() {
    const editable = !readonly();
    hall.innerHTML = '';
    hall.append(elem('div', 'hall-wall'), elem('div', 'hall-floor'), buildEntrance());
    exhibits.forEach((ex, i) => hall.appendChild(buildBay(ex, i, ENTRANCE_W + i * BAY_W, editable)));
    if (editable) hall.appendChild(buildAddBay(ENTRANCE_W + exhibits.length * BAY_W));
    hallContentW = ENTRANCE_W + (exhibits.length + (editable ? 1 : 0)) * BAY_W + END_PAD;
    fitHall();
  }

  // 大廳的高度貼齊視窗，寬度不夠時往右延伸、可以左右捲動
  function fitHall() {
    const h = museum.clientHeight;
    if (!h) return;
    hallScale = h / HALL_H;
    const w = Math.max(hallContentW, museum.clientWidth / hallScale);
    hall.style.width = `${w}px`;
    hall.style.transform = `scale(${hallScale})`;
    hallSize.style.width = `${w * hallScale}px`;
    hallSize.style.height = `${h}px`;
  }

  // 登入畫面背後的範例展品，置中排列、牆壁延伸到整個畫面
  function renderShowcase() {
    const box = $('#showcase');
    const target = $('#showcase-hall');
    const h = box.clientHeight;
    if (!h) return;
    const s = h / HALL_H;
    const list = window.SHOWCASE || [];
    const w = Math.max(list.length * BAY_W, box.clientWidth / s);
    const left0 = (w - list.length * BAY_W) / 2;
    target.innerHTML = '';
    target.append(elem('div', 'hall-wall'), elem('div', 'hall-floor'));
    list.forEach((ex, i) => target.appendChild(buildBay(ex, i, left0 + i * BAY_W, false)));
    target.style.width = `${w}px`;
    target.style.transform = `translateX(${(box.clientWidth - w * s) / 2}px) scale(${s})`;
  }

  function scrollToExhibit(id, behavior = 'smooth') {
    const i = exhibits.findIndex((ex) => ex.id === id);
    if (i < 0) return;
    const center = (ENTRANCE_W + i * BAY_W + BAY_W / 2) * hallScale;
    museum.scrollTo({ left: center - museum.clientWidth / 2, behavior });
  }

  // 用滑鼠拖曳大廳走動（觸控直接用瀏覽器原生的左右滑動）
  let pan = null;
  let suppressClick = false;

  museum.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button')) return;
    pan = { x: e.clientX, left: museum.scrollLeft, moved: false };
    e.preventDefault();
  });
  window.addEventListener('pointermove', (e) => {
    if (!pan) return;
    const dx = e.clientX - pan.x;
    if (Math.abs(dx) > 5) pan.moved = true;
    if (pan.moved) {
      museum.classList.add('panning');
      museum.scrollLeft = pan.left - dx;
    }
  });
  window.addEventListener('pointerup', () => {
    if (!pan) return;
    suppressClick = pan.moved;
    pan = null;
    museum.classList.remove('panning');
  });

  museum.addEventListener('click', (e) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (e.target.closest('[data-quiz]')) {
      startQuiz();
      return;
    }
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn && !readonly()) {
      const ex = exhibits.find((x) => x.id === editBtn.dataset.edit);
      if (ex) openEditor(ex, false);
      return;
    }
    if (e.target.closest('[data-new]') && !readonly()) {
      newExhibit();
      return;
    }
    const bay = e.target.closest('.bay[data-id]');
    if (bay) scrollToExhibit(bay.dataset.id);
  });

  // 大廳只能左右走，滾輪上下也轉成左右
  museum.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    museum.scrollLeft += e.deltaY;
  }, { passive: false });

  // ── 模式切換 ──────────────────────────────────────
  // mode：login（輸入玩家代號）、museum（博物館大廳）、edit（重新組裝一個展台）
  // editing = { exhibit, isNew, pedestal }；isNew 的展台按儲存才會加進博物館
  let editing = null;
  let dirty = false;

  function markDirty() {
    dirty = true;
  }

  function setMode(mode) {
    for (const m of ['login', 'museum', 'edit']) document.body.classList.toggle(`mode-${m}`, m === mode);
    document.body.classList.toggle('visiting', mode === 'museum' && readonly());
    const title = owner ? museumName(owner) : '恐龍博物館';
    // 左上角：寬爸的恐龍博物館（小三）；入口的大招牌不加年級
    const short = owner && gradeOf(owner.grade)?.short;
    $('#museum-title').textContent = short ? `${title}（${short}）` : title;
    document.title = title;
    $('#player-chip').textContent = mode === 'museum' && readonly() ? `參觀中・${player.name}` : '';
    closeMenu();
  }

  function openEditor(exhibit, isNew) {
    editing = { exhibit, isNew, pedestal: exhibit.pedestal };
    setMode('edit');
    fitWorld();
    clearAll();
    for (const p of exhibit.pieces) {
      addPiece(p.part, p.set, p.x, p.y, { rot: p.rot, scale: p.scale, flip: p.flip });
    }
    select(null);
    placardTitle.textContent = exhibit.title;
    refreshPedestalPicker();
    dirty = false;
  }

  function closeEditor(focusId) {
    editing = null;
    dirty = false;
    select(null);
    clearAll();
    showMuseum(player);
    if (focusId) scrollToExhibit(focusId, 'instant');
  }

  function newExhibit() {
    openEditor({ id: newId(), title: '', pedestal: defaultPedestal, pieces: [] }, true);
  }

  async function saveEditor() {
    const { exhibit, isNew, pedestal } = editing;
    exhibit.pieces = pieces.map(({ part, set, x, y, rot, scale, flip }) => ({ part, set, x, y, rot, scale, flip }));
    exhibit.title = placardTitle.textContent.trim();
    exhibit.pedestal = pedestal;
    if (isNew) player.exhibits.push(exhibit);
    if (await savePlayer()) closeEditor(exhibit.id);
  }

  // 看某個玩家的博物館；不是自己的話只能參觀
  function showMuseum(who) {
    owner = who;
    exhibits = who.exhibits;
    setMode('museum');
    renderMuseum();
    museum.scrollLeft = 0;
    // 參觀別人時，畫面左下角是自己的角色，跟著一起逛
    const visitor = $('#visitor');
    visitor.innerHTML = '';
    if (readonly()) {
      const figure = elem('div', 'visitor-figure');
      figure.innerHTML = characterSVG(player.role, 'normal');
      visitor.append(figure, elem('div', 'visitor-name', `我（${player.name}）`));
    }
  }

  // ── 存檔 ──────────────────────────────────────────
  async function savePlayer() {
    try {
      await window.PlayerStore.save(player);
      return true;
    } catch (err) {
      console.error(err);
      alert(`存檔失敗了（${err.message}）。請檢查網路後再試一次。`);
      return false;
    }
  }

  function cleanExhibits(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(Boolean).map((ex) => ({
      id: String(ex.id || newId()),
      title: typeof ex.title === 'string' ? ex.title : '',
      pedestal: typeof ex.pedestal === 'string' ? ex.pedestal : defaultPedestal,
      pieces: cleanPieces(ex.pieces),
    }));
  }

  function cleanPlayer(p) {
    return {
      ...p,
      bones: Array.isArray(p.bones) ? p.bones.filter((b) => b && typeof b.part === 'string' && b.set >= 1) : [],
      exhibits: cleanExhibits(p.exhibits),
      quizzes: Array.isArray(p.quizzes) ? p.quizzes : [],
      role: characterOf(p.role).id, // 還沒選過角色的舊玩家用第一個角色
    };
  }

  function readJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (err) {
      return null;
    }
  }

  // 這台電腦瀏覽器裡的舊資料：同一個代號的玩家；或是還沒有玩家代號時的存檔（展台和暴龍 2 組，只給一個人）
  function localImport(name) {
    if (!window.GAME_ENV.importLocalData) return null; // 開發環境不搬，免得舊資料被測試用掉
    const local = readJSON(LOCAL_PLAYERS_KEY);
    const old = local?.players?.[window.PlayerStore.idOf(name)];
    if (old) {
      return {
        grade: old.grade,
        role: old.role,
        bones: old.bones,
        exhibits: cleanExhibits(old.exhibits),
        quizzes: old.quizzes,
        createdAt: old.createdAt,
      };
    }
    let uploaded = false;
    try {
      uploaded = !!localStorage.getItem(LEGACY_UPLOADED_KEY);
    } catch (err) {
      uploaded = true;
    }
    if (local || uploaded) return null;
    const v3 = readJSON(LEGACY_KEYS[0]);
    const v2 = readJSON(LEGACY_KEYS[1]);
    let list = null;
    if (v3 && Array.isArray(v3.exhibits)) list = v3.exhibits;
    else if (v2 && Array.isArray(v2.pieces)) list = [{ title: v2.title, pieces: v2.pieces }];
    if (!list) return null;
    const bones = [];
    for (const dino of window.FOSSIL_LIBRARY || []) {
      for (let set = 1; set <= (LEGACY_SETS[dino.id] || 0); set++) {
        for (const part of dino.parts) bones.push({ part: `${dino.id}/${part.id}`, set });
      }
    }
    return { legacy: true, exhibits: cleanExhibits(list), bones };
  }

  // ── 年級 ──────────────────────────────────────────
  function gradeOf(id) {
    return (window.MATH_GRADES || []).find((g) => g.id === id) || null;
  }

  function gradeName(id) {
    return gradeOf(id)?.name || '未選年級';
  }

  // ── 角色 ──────────────────────────────────────────
  // 角色的圖在 js/role.js 的 CHARACTERS
  function characterOf(id) {
    const list = window.CHARACTERS || [];
    return list.find((c) => c.id === id) || list[0] || null;
  }

  function characterSVG(id, mood) {
    return characterOf(id)?.svg(mood) || '';
  }

  // 一排角色按鈕，點一下選擇
  function renderRoleChoices(container, selectedId, onPick) {
    container.innerHTML = '';
    for (const c of window.CHARACTERS || []) {
      const btn = elem('button', 'role-option');
      btn.type = 'button';
      btn.dataset.role = c.id;
      btn.classList.toggle('active', c.id === selectedId);
      const figure = elem('div', 'role-figure');
      figure.innerHTML = c.svg(c.id === selectedId ? 'happy' : 'normal');
      btn.append(figure, elem('span', 'role-name', c.name));
      btn.addEventListener('click', () => {
        renderRoleChoices(container, c.id, onPick);
        onPick(c.id);
      });
      container.appendChild(btn);
    }
  }

  function openRoleDialog() {
    renderRoleChoices($('#role-dialog-list'), player.role, async (id) => {
      player.role = id;
      if (!(await savePlayer())) return;
      if (owner === player && !editing) renderMuseum();
      if (owner && owner !== player) showMuseum(owner);
    });
    $('#role-dialog').showModal();
  }

  // ── 登入 ──────────────────────────────────────────
  const nameForm = $('#login-name');
  const confirmForm = $('#login-confirm');
  const nameInput = $('#player-name');
  const loginError = $('#login-error');
  const pinInput = $('#pin-input');
  const pinInput2 = $('#pin-input2');
  const confirmError = $('#confirm-error');
  // 輸入代號後、按下進入前：{ name, existing, role, imported, newPin }
  // newPin：要設定新密碼（新玩家，或還沒有密碼的玩家）
  let pending = null;

  const isPin = (v) => /^\d{4}$/.test(v.normalize('NFKC'));
  const pinOf = (input) => input.value.normalize('NFKC');

  function showLoginStep(step) {
    nameForm.hidden = step !== 'name';
    confirmForm.hidden = step !== 'confirm';
  }

  function showLogin() {
    player = null;
    owner = null;
    exhibits = [];
    pending = null;
    window.PlayerStore.close();
    setMode('login');
    renderShowcase();
    showLoginStep('name');
    loginError.textContent = '';
    try {
      nameInput.value = localStorage.getItem(LAST_PLAYER_KEY) || '';
    } catch (err) {
      nameInput.value = '';
    }
    nameInput.focus();
  }

  function renderGradeChoices(selectedId) {
    const list = $('#grade-list');
    list.innerHTML = '';
    for (const g of window.MATH_GRADES || []) {
      const label = elem('label', 'grade-option');
      const radio = elem('input');
      radio.type = 'radio';
      radio.name = 'grade';
      radio.value = g.id;
      radio.checked = g.id === selectedId;
      radio.addEventListener('change', updateEnterButton);
      label.append(radio, elem('span', '', g.name));
      list.appendChild(label);
    }
    updateEnterButton();
  }

  function chosenGrade() {
    return confirmForm.querySelector('input[name="grade"]:checked')?.value || null;
  }

  // 新玩家要設密碼、選年級和角色；舊玩家輸入密碼、確認年級（角色在選單裡換）
  function updateEnterButton() {
    const pinOk = isPin(pinInput.value) && (!pending?.newPin || isPin(pinInput2.value));
    $('#btn-enter').disabled = !pinOk || !chosenGrade() || (pending && !pending.existing && !pending.role);
  }
  pinInput.addEventListener('input', updateEnterButton);
  pinInput2.addEventListener('input', updateEnterButton);

  // 連線時按鈕先不能按，顯示「連線中…」
  async function busy(button, task) {
    const label = [...button.childNodes];
    button.disabled = true;
    button.textContent = '連線中…';
    try {
      return await task();
    } finally {
      button.replaceChildren(...label);
      button.disabled = false;
    }
  }

  nameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (!name) {
      loginError.textContent = '請輸入玩家代號';
      nameInput.focus();
      return;
    }
    loginError.textContent = '';
    let existing;
    try {
      existing = await busy(nameForm.querySelector('button[type="submit"]'), () => window.PlayerStore.open(name));
    } catch (err) {
      loginError.textContent = `${err.message}，請再試一次。`;
      return;
    }
    const imported = existing ? null : localImport(name);
    pending = {
      name: existing?.name || name,
      existing,
      role: imported?.role || null,
      imported,
      newPin: !existing?.pin,
    };
    $('#login-who').textContent = pending.name;
    pinInput.value = '';
    pinInput2.value = '';
    pinInput2.hidden = !pending.newPin;
    confirmError.textContent = '';
    $('#pin-label').textContent = pending.newPin ? '請設定 4 位數密碼（只能用數字）' : '請輸入你的 4 位數密碼';
    if (existing) {
      $('#login-greet').textContent = `歡迎回來，${existing.name}！`;
      $('#grade-label').textContent = '你的年級（升級了可以在這裡改）';
      $('#btn-enter').textContent = '進入我的博物館';
      $('#role-section').hidden = true;
      renderGradeChoices(gradeOf(existing.grade) ? existing.grade : null);
    } else {
      $('#login-greet').textContent = imported
        ? '這台電腦裡有你之前的博物館！設定密碼後會一起搬到網路上。'
        : '第一次來，歡迎你！';
      $('#grade-label').textContent = '請選擇你的年級';
      $('#btn-enter').textContent = '建立我的博物館';
      $('#role-section').hidden = false;
      renderRoleChoices($('#role-list'), pending.role, (id) => {
        pending.role = id;
        updateEnterButton();
      });
      renderGradeChoices(gradeOf(imported?.grade) ? imported.grade : null);
    }
    showLoginStep('confirm');
    pinInput.focus();
  });

  $('#btn-back').addEventListener('click', () => {
    pending = null;
    showLoginStep('name');
    nameInput.select();
    nameInput.focus();
  });

  confirmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const grade = chosenGrade();
    if (!pending || !grade || (!pending.existing && !pending.role)) return;
    const pin = pinOf(pinInput);
    if (pending.newPin) {
      if (pin !== pinOf(pinInput2)) {
        confirmError.textContent = '兩次輸入的密碼不一樣，再輸入一次吧！';
        pinInput2.value = '';
        pinInput2.focus();
        updateEnterButton();
        return;
      }
    } else if (pin !== pending.existing.pin) {
      confirmError.textContent = '密碼不對喔！忘記密碼的話，請找大人幫忙。';
      pinInput.value = '';
      pinInput.focus();
      updateEnterButton();
      return;
    }
    confirmError.textContent = '';
    const firstTime = !pending.existing;
    const imported = pending.imported;
    let p;
    if (pending.existing) {
      p = cleanPlayer(pending.existing);
    } else {
      p = cleanPlayer({
        id: window.PlayerStore.idOf(pending.name),
        name: pending.name,
        role: pending.role,
        bones: imported?.bones || [],
        exhibits: imported?.exhibits || [],
        quizzes: imported?.quizzes || [],
        createdAt: imported?.createdAt || Date.now(),
      });
    }
    p.grade = grade;
    p.pin = pin;
    enforceInventory(p);
    player = p;
    if (!(await busy($('#btn-enter'), savePlayer))) return;
    window.PlayerStore.remember(); // 24 小時內重新整理網頁不用再登入
    if (imported?.legacy) {
      try {
        localStorage.setItem(LEGACY_UPLOADED_KEY, p.id);
      } catch (err) {
        // 記不住也沒關係
      }
    }
    try {
      localStorage.setItem(LAST_PLAYER_KEY, p.name);
    } catch (err) {
      // 記不住也沒關係
    }
    buildLibrary();
    showMuseum(player);
    if (firstTime) $('#help').showModal();
  });

  function logout() {
    if (editing && dirty && !confirm('還沒儲存，確定要登出嗎？這次的修改會不見喔。')) return;
    if (editing) {
      editing = null;
      dirty = false;
      select(null);
      clearAll();
    }
    showLogin();
  }

  // ── 選單與成績單 ──────────────────────────────────
  const menu = $('#menu');
  const menuButton = $('#menu-button');

  function closeMenu() {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  }

  menuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
    menuButton.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target)) closeMenu();
  });
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-menu]');
    if (!item) return;
    closeMenu();
    const action = item.dataset.menu;
    if (action === 'report') openReport();
    else if (action === 'role') openRoleDialog();
    else if (action === 'pin') openPinDialog();
    else if (action === 'new' && owner === player && !editing) newExhibit();
    else if (action === 'logout') logout();
  });

  function praiseFor(questions) {
    if (!questions) return '還沒開始練習，去採集第一塊化石吧！';
    if (questions < 30) return '好的開始，繼續加油！';
    if (questions < 100) return '你好棒！';
    if (questions < 300) return '你超厲害，是數學小達人！';
    return '你是傳說中的數學古生物學家！';
  }

  function formatTime(at) {
    const d = new Date(at);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openReport() {
    const quizzes = player.quizzes;
    const questions = quizzes.reduce((n, q) => n + (q.total || 0), 0);
    const correct = quizzes.reduce((n, q) => n + (q.score || 0), 0);
    const passes = quizzes.filter((q) => q.score >= QUIZ_PASS).length;

    // 玩家角色開心的樣子（js/role.js）
    $('#report-avatar').innerHTML = characterSVG(player.role, 'happy');
    $('#report-name').textContent = `${player.name}的成績單・${gradeName(player.grade)}`;
    $('#report-headline').textContent = `你已經完成 ${questions} 題數學！`;
    $('#report-praise').textContent = praiseFor(questions);

    const stats = $('#report-stats');
    stats.innerHTML = '';
    for (const [label, value] of [
      ['練習次數', `${quizzes.length} 次`],
      ['答對', `${correct} 題`],
      ['答對率', questions ? `${Math.round((correct / questions) * 100)}%` : '—'],
      ['挖到化石', `${passes} 次`],
      ['收藏骨頭', `${player.bones.length} 塊`],
      ['最高分', quizzes.length ? `${Math.max(...quizzes.map((q) => q.score))} / 10` : '—'],
    ]) {
      const box = elem('div', 'report-stat');
      box.append(elem('div', 'report-stat-value', value), elem('div', 'report-stat-label', label));
      stats.appendChild(box);
    }

    const recent = $('#report-recent');
    recent.innerHTML = '';
    const last = quizzes.slice(-5).reverse();
    if (!last.length) recent.appendChild(elem('p', 'report-empty', '還沒有練習紀錄。'));
    for (const q of last) {
      const row = elem('div', `report-row ${q.score >= QUIZ_PASS ? 'pass' : ''}`);
      row.append(
        elem('span', 'report-row-time', formatTime(q.at)),
        elem('span', 'report-row-grade', gradeName(q.grade)),
        elem('span', 'report-row-score', `答對 ${q.score} / ${q.total}`),
        elem('span', 'report-row-mark', q.score >= QUIZ_PASS ? '🦴' : ''),
      );
      recent.appendChild(row);
    }
    $('#report').showModal();
  }

  // ── 參觀其他博物館 ────────────────────────────────
  async function openVisitList() {
    const list = $('#visit-list');
    list.innerHTML = '';
    list.appendChild(elem('p', 'visit-empty', '正在找其他博物館…'));
    $('#visit').showModal();
    let others;
    try {
      others = (await window.PlayerStore.list())
        .filter((p) => p.key !== window.PlayerStore.currentKey())
        .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      list.innerHTML = '';
      list.appendChild(elem('p', 'visit-empty', `${err.message}，請稍後再試。`));
      return;
    }
    list.innerHTML = '';
    if (!others.length) list.appendChild(elem('p', 'visit-empty', '還沒有其他玩家的博物館。'));
    for (const info of others) {
      const btn = elem('button', 'visit-item');
      btn.type = 'button';
      btn.append(
        elem('span', 'visit-name', museumName(info)),
        elem('span', 'visit-meta', `${gradeName(info.grade)}・${info.exhibitCount} 件展品`),
      );
      btn.addEventListener('click', async () => {
        let other = null;
        try {
          other = await busy(btn, () => window.PlayerStore.getPublic(info.key));
        } catch (err) {
          alert(`${err.message}，請稍後再試。`);
          return;
        }
        $('#visit').close();
        if (other) showMuseum(cleanPlayer(other));
        else alert('這個博物館暫時打不開。');
      });
      list.appendChild(btn);
    }
    if (owner !== player) {
      const home = elem('button', 'visit-item visit-home');
      home.type = 'button';
      home.append(elem('span', 'visit-name', `回到${museumName(player)}`));
      home.addEventListener('click', () => {
        $('#visit').close();
        showMuseum(player);
      });
      list.prepend(home);
    }
  }

  // ── 修改密碼 ──────────────────────────────────────
  const pinForm = $('#pin-form');

  function openPinDialog() {
    pinForm.reset();
    $('#pin-error').textContent = '';
    $('#pin-dialog').showModal();
    $('#pin-old').focus();
  }

  $('#pin-cancel').addEventListener('click', () => $('#pin-dialog').close());

  pinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const error = $('#pin-error');
    const [oldPin, newPin, newPin2] = ['#pin-old', '#pin-new', '#pin-new2'].map((sel) => pinOf($(sel)));
    if (oldPin !== player.pin) {
      error.textContent = '原本的密碼不對喔！';
      return;
    }
    if (!isPin(newPin)) {
      error.textContent = '新密碼要是 4 個數字。';
      return;
    }
    if (newPin !== newPin2) {
      error.textContent = '兩次輸入的新密碼不一樣。';
      return;
    }
    const before = player.pin;
    player.pin = newPin;
    if (!(await busy(pinForm.querySelector('button[type="submit"]'), savePlayer))) {
      player.pin = before;
      return;
    }
    $('#pin-dialog').close();
    alert('密碼改好了！下次登入要用新密碼喔。');
  });

  // ── 採集新化石（數學練習）─────────────────────────
  // 獎勵哪一塊骨頭：從所有恐龍的所有骨頭裡隨機挑一塊（不管有沒有這種恐龍）。
  // 組別是這塊骨頭還沒擁有的最小號碼，例如已經有暴龍 (1) 的頭骨，再抽到暴龍頭骨就是暴龍 (2) 的。
  function pickRewardBone(p) {
    const owned = new Set(p.bones.map((b) => boneKey(b.part, b.set)));
    const dinos = (window.FOSSIL_LIBRARY || []).filter((d) => d.parts.every((part) => parts[`${d.id}/${part.id}`]));
    if (!dinos.length) return null;
    const randomOf = (list) => list[Math.floor(Math.random() * list.length)];
    const dino = randomOf(dinos);
    const part = `${dino.id}/${randomOf(dino.parts).id}`;
    let set = 1;
    while (owned.has(boneKey(part, set))) set++;
    return { part, set };
  }

  function startQuiz() {
    const grade = gradeOf(player?.grade);
    if (!grade) {
      alert('找不到你的年級題目，請重新登入選擇年級。');
      return;
    }
    const fromEditor = !!editing;
    select(null);
    window.MathQuiz.start({
      grade,
      pass: QUIZ_PASS,
      async onFinish(score, total) {
        player.quizzes.push({ at: Date.now(), grade: grade.id, score, total });
        let bone = null;
        if (score >= QUIZ_PASS) {
          bone = pickRewardBone(player);
          if (bone) player.bones.push({ ...bone, at: Date.now() });
        }
        if (!(await savePlayer())) {
          if (bone) player.bones.pop();
          throw new Error('save failed');
        }
        if (!bone) return null;
        freshBone = boneKey(bone.part, bone.set);
        buildLibrary();
        const [dinoId, partId] = bone.part.split('/');
        const dino = window.FOSSIL_LIBRARY.find((d) => d.id === dinoId);
        const part = dino.parts.find((x) => x.id === partId);
        return {
          src: part.src,
          name: `${dino.name} (${bone.set}) 的${part.name}`,
          hint: fromEditor ? '已經放進左邊的化石庫了！'
            : '已經放進化石庫了！按「＋ 新展台」或「✏️ 重新組裝」就可以把它擺上去。',
        };
      },
      onClose() {
        if (!editing && owner === player) renderMuseum();
      },
    });
  }

  placardTitle.addEventListener('input', markDirty);
  placardTitle.addEventListener('keydown', (e) => {
    // 中文輸入法選字時按的 Enter 不算（keyCode 229 是 Safari 選完字後補送的那一下），
    // 不然組字到一半就離開欄位，字會重複出現（例如「暴龍暴龍」）
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      placardTitle.blur();
    }
  });

  // ── 頂部按鈕 ──────────────────────────────────────
  $('#btn-help').addEventListener('click', () => $('#help').showModal());
  $('#btn-quiz').addEventListener('click', startQuiz);
  $('#btn-quiz-edit').addEventListener('click', startQuiz);
  $('#btn-visit').addEventListener('click', openVisitList);
  $('#btn-visit-other').addEventListener('click', openVisitList);
  $('#btn-home').addEventListener('click', () => showMuseum(player));
  $('#btn-save').addEventListener('click', saveEditor);
  $('#btn-cancel').addEventListener('click', () => {
    if (dirty && !confirm('還沒儲存，確定要放棄這次的修改嗎？')) return;
    closeEditor(editing.isNew ? null : editing.exhibit.id);
  });
  $('#btn-remove').addEventListener('click', async () => {
    if (!confirm('要拆除這個展台嗎？上面的化石會收回化石庫。')) return;
    const { exhibit, isNew } = editing;
    if (!isNew) {
      player.exhibits = player.exhibits.filter((ex) => ex !== exhibit);
      if (!(await savePlayer())) return;
    }
    closeEditor(null);
  });
  $('#btn-clear').addEventListener('click', () => {
    if (confirm('要把工作台上的骨頭全部收回化石庫嗎？')) {
      clearAll();
      markDirty();
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (editing && dirty) e.preventDefault();
  });

  // ── 啟動 ──────────────────────────────────────────
  window.addEventListener('resize', () => {
    if (editing) {
      fitWorld();
      renderSelection();
    } else if (owner) {
      fitHall();
    } else {
      renderShowcase();
    }
  });

  // 24 小時內在這台電腦登入過，就直接回到自己的博物館
  async function resumeLogin() {
    let saved = null;
    try {
      saved = await window.PlayerStore.resume();
    } catch (err) {
      console.warn('無法接續上次的登入：', err);
    }
    if (!saved) return false;
    player = cleanPlayer(saved);
    enforceInventory(player);
    buildLibrary();
    showMuseum(player);
    return true;
  }

  // 在自己電腦上開、或是用開發環境時，左上角標出目前連到哪個環境（設定在 js/config.js）
  const envBadge = $('#env-badge');
  if (window.GAME_ENV.local || window.GAME_ENV.id !== 'prod') {
    envBadge.textContent = window.GAME_ENV.id === 'prod' ? `⚠️ ${window.GAME_ENV.name}` : `🧪 ${window.GAME_ENV.name}`;
    envBadge.classList.add(`env-${window.GAME_ENV.id}`);
    envBadge.title = '連線設定在 js/config.js，網址加上 ?env=dev 或 ?env=prod 可以切換';
    envBadge.hidden = false;
  }

  (async () => {
    await Promise.all([loadLibrary(), loadPedestals()]);
    buildPedestalPicker();
    if (!(await resumeLogin())) showLogin();
  })();
})();
