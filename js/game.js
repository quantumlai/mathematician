(() => {
  'use strict';

  const WORLD_W = 1600;
  const WORLD_H = 1000;
  const DEFAULT_SIZE = 320; // 新放進展場的骨頭，長邊約這麼大（展場座標）
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 3;
  const SAVE_KEY = 'fossil-museum-v2';

  const $ = (sel) => document.querySelector(sel);
  const viewport = $('#viewport');
  const world = $('#world');
  const piecesLayer = $('#pieces');
  const selectionBox = $('#selection');
  const toolbar = $('#toolbar');
  const placardTitle = $('#placard-title');

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

  // ── 狀態 ──────────────────────────────────────────
  // piece = { uid, part, x, y, rot, scale, flip }，x / y 是中心點的展場座標，rot 是角度
  let pieces = [];
  let nextUid = 1;
  let selected = null;
  const elements = new Map(); // uid → <img>

  function defaultScale(part) {
    return part.baseScale ?? DEFAULT_SIZE / Math.max(part.w, part.h);
  }

  function pieceOf(partKey) {
    return pieces.find((p) => p.part === partKey) || null;
  }

  // 每塊骨頭在展場上最多只有一塊
  function addPiece(partKey, x, y, extra = {}) {
    const part = parts[partKey];
    if (!part || pieceOf(partKey)) return null;
    const piece = {
      uid: nextUid++,
      part: partKey,
      x,
      y,
      rot: 0,
      scale: defaultScale(part),
      flip: false,
      ...extra,
    };
    pieces.push(piece);
    const el = document.createElement('img');
    el.className = 'piece';
    el.src = part.src;
    el.alt = part.name;
    el.draggable = false;
    el.style.width = `${part.w}px`;
    el.style.height = `${part.h}px`;
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
    const el = elements.get(piece.uid);
    const sx = piece.flip ? -piece.scale : piece.scale;
    el.style.transform =
      `translate(${piece.x - part.w / 2}px, ${piece.y - part.h / 2}px) ` +
      `rotate(${piece.rot}deg) scale(${sx}, ${piece.scale})`;
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

  // 展場固定 1600×1000，依視窗大小等比縮放置中
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
    save();
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
    saveSoon();
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
    save();
  }

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (btn) runAction(btn.dataset.action);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.isContentEditable || e.target.closest?.('dialog')) return;
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
      saveSoon();
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
  const thumbs = new Map(); // partKey → 化石庫裡的縮圖

  // 已經放在展場上的骨頭，在化石庫標示為「已使用」
  function refreshLibrary() {
    for (const [key, thumb] of thumbs) {
      const used = !!pieceOf(key);
      thumb.classList.toggle('used', used);
      thumb.title = used ? `${parts[key].name}（已在展場上）` : parts[key].name;
    }
  }

  function buildLibrary() {
    const list = $('#library-list');
    list.innerHTML = '';
    for (const dino of window.FOSSIL_LIBRARY || []) {
      const group = document.createElement('div');
      group.className = 'dino-group';
      const title = document.createElement('h3');
      title.textContent = dino.name;
      const grid = document.createElement('div');
      grid.className = 'dino-parts';
      for (const part of dino.parts) {
        const key = `${dino.id}/${part.id}`;
        if (!parts[key]) continue;
        const thumb = document.createElement('div');
        thumb.className = 'part-thumb';
        const img = document.createElement('img');
        img.src = part.src;
        img.alt = part.name;
        img.draggable = false;
        thumb.appendChild(img);
        enableThumbDrag(thumb, key);
        thumbs.set(key, thumb);
        grid.appendChild(thumb);
      }
      group.append(title, grid);
      list.appendChild(group);
    }
    refreshLibrary();
  }

  // 從化石庫拖進展場；只點一下就放在展場中間附近。
  // 已在展場上的骨頭不會再產生新的，點它只會在展場上選取那一塊。
  function enableThumbDrag(thumb, key) {
    let ghost = null;
    let start = null;

    thumb.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const existing = pieceOf(key);
      if (existing) {
        select(existing);
        bringToFront(existing);
        save();
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
          piece = addPiece(key, pt.x, pt.y);
        }
      } else {
        const jitter = () => (Math.random() - 0.5) * 160;
        piece = addPiece(key, WORLD_W / 2 + jitter(), WORLD_H * 0.45 + jitter());
      }
      if (piece) {
        select(piece);
        save();
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

  // ── 開場：把第一隻恐龍的骨頭散在展場上 ─────────────
  function scatterStarter() {
    clearAll();
    const dino = (window.FOSSIL_LIBRARY || [])[0];
    if (!dino) return;
    const spots = [
      [0.13, 0.2], [0.14, 0.5], [0.33, 0.62], [0.42, 0.25],
      [0.68, 0.58], [0.9, 0.58], [0.5, 0.55], [0.76, 0.17],
    ];
    dino.parts.forEach((part, i) => {
      const [fx, fy] = spots[i % spots.length];
      addPiece(`${dino.id}/${part.id}`, fx * WORLD_W, fy * WORLD_H, {
        rot: Math.round((Math.random() - 0.5) * 40),
      });
    });
    select(null);
    save();
  }

  // ── 存檔 ──────────────────────────────────────────
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        pieces: pieces.map(({ part, x, y, rot, scale, flip }) => ({ part, x, y, rot, scale, flip })),
        title: placardTitle.textContent,
      }));
    } catch (err) {
      // 無痕模式等情況存不了，不影響遊玩
    }
  }

  let saveTimer = 0;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 300);
  }

  function restore() {
    let data = null;
    try {
      data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    } catch (err) {
      data = null;
    }
    if (!data || !Array.isArray(data.pieces)) return false;
    for (const p of data.pieces) {
      if (!parts[p.part]) continue; // 素材被移除或改名就略過
      addPiece(p.part, +p.x || 0, +p.y || 0, {
        rot: +p.rot || 0,
        scale: clampScale(+p.scale || 0.3),
        flip: !!p.flip,
      });
    }
    placardTitle.textContent = typeof data.title === 'string' ? data.title : '';
    return true;
  }

  placardTitle.addEventListener('input', saveSoon);
  placardTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      placardTitle.blur();
    }
  });

  // ── 頂部按鈕 ──────────────────────────────────────
  $('#btn-reset').addEventListener('click', () => {
    if (confirm('要把展場清空，重新拿出暴龍的骨頭嗎？')) {
      placardTitle.textContent = '';
      scatterStarter();
    }
  });
  $('#btn-clear').addEventListener('click', () => {
    if (confirm('要把展場上的骨頭全部收回化石庫嗎？')) {
      clearAll();
      save();
    }
  });
  $('#btn-help').addEventListener('click', () => $('#help').showModal());

  // ── 啟動 ──────────────────────────────────────────
  window.addEventListener('resize', () => {
    fitWorld();
    renderSelection();
  });

  (async () => {
    fitWorld();
    await loadLibrary();
    buildLibrary();
    if (!restore()) {
      scatterStarter();
      $('#help').showModal();
    }
  })();
})();
