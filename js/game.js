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
  const ENTRANCE_W = 640;     // 入口區寬度
  const BAY_W = 760;          // 每個展台佔的寬度
  const END_PAD = 160;        // 最後面留白
  const PEDESTAL_BOTTOM = 836; // 展示台底部站在地板的這個高度
  const DISPLAY_MAX_W = 640;  // 化石成品最大的寬、高，超過會等比縮小
  const DISPLAY_MAX_H = 480;

  const SAVE_KEY = 'fossil-museum-v3';
  const OLD_SAVE_KEY = 'fossil-museum-v2'; // 只有一個展場的舊版存檔，第一次開啟時轉成一個展台

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
  // exhibit = { id, title, pedestal, pieces: [{ part, x, y, rot, scale, flip }] }
  // pieces 用的是工作台座標，博物館裡會自動縮放、擺到展示台上
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
        x: +p.x || 0,
        y: +p.y || 0,
        rot: +p.rot || 0,
        scale: clampScale(+p.scale || 0.3),
        flip: !!p.flip,
      }));
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
    if (e.target.isContentEditable || e.target.closest?.('dialog')) return;
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
  const thumbs = new Map(); // partKey → 化石庫裡的縮圖

  // 已經放在工作台上的骨頭，在化石庫標示為「已使用」
  function refreshLibrary() {
    for (const [key, thumb] of thumbs) {
      const used = !!pieceOf(key);
      thumb.classList.toggle('used', used);
      thumb.title = used ? `${parts[key].name}（已在工作台上）` : parts[key].name;
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

  // 從化石庫拖進工作台；只點一下就放在工作台中間附近。
  // 已在工作台上的骨頭不會再產生新的，點它只會在工作台上選取那一塊。
  function enableThumbDrag(thumb, key) {
    let ghost = null;
    let start = null;

    thumb.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const existing = pieceOf(key);
      if (existing) {
        select(existing);
        bringToFront(existing);
        markDirty();
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

  // ── 把第一隻恐龍的骨頭散在工作台上 ─────────────────
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
    markDirty();
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

  function buildEntrance() {
    const entrance = elem('div', 'entrance');
    entrance.style.width = `${ENTRANCE_W}px`;
    const sign = elem('div', 'entrance-sign');
    sign.append(elem('div', 'entrance-title', '我的恐龍博物館'), elem('div', 'entrance-sub', 'DINOSAUR MUSEUM'));
    const count = elem('div', 'entrance-count',
      exhibits.length ? `目前展出 ${exhibits.length} 件化石` : '還沒有展品，蓋一個展台吧！');
    entrance.append(sign, elem('div', 'entrance-door'), count, elem('div', 'entrance-arrow', '往這邊參觀 →'));
    return entrance;
  }

  function buildBay(exhibit, index) {
    const bay = elem('div', 'bay');
    bay.dataset.id = exhibit.id;
    bay.style.left = `${ENTRANCE_W + index * BAY_W}px`;
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
        img.style.transform = pieceTransform(p, part, box.x, box.y);
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
    const btn = elem('button', 'exhibit-edit', '✏️ 重新組裝');
    btn.type = 'button';
    btn.dataset.edit = exhibit.id;
    placard.appendChild(btn);
    bay.appendChild(placard);
    return bay;
  }

  function buildAddBay(index) {
    const bay = elem('div', 'bay bay-add');
    bay.style.left = `${ENTRANCE_W + index * BAY_W}px`;
    bay.style.width = `${BAY_W}px`;
    const btn = elem('button', 'add-pedestal', '＋ 新增展台');
    btn.type = 'button';
    btn.dataset.new = '';
    bay.append(elem('div', 'column'), elem('div', 'add-outline'), btn);
    return bay;
  }

  function renderMuseum() {
    hall.innerHTML = '';
    hall.append(elem('div', 'hall-wall'), elem('div', 'hall-floor'), buildEntrance());
    exhibits.forEach((ex, i) => hall.appendChild(buildBay(ex, i)));
    hall.appendChild(buildAddBay(exhibits.length));
    hallContentW = ENTRANCE_W + (exhibits.length + 1) * BAY_W + END_PAD;
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
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      const ex = exhibits.find((x) => x.id === editBtn.dataset.edit);
      if (ex) openEditor(ex, false);
      return;
    }
    if (e.target.closest('[data-new]')) {
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
  // editing = { exhibit, isNew, pedestal }；isNew 的展台按儲存才會加進博物館
  let editing = null;
  let dirty = false;

  function markDirty() {
    dirty = true;
  }

  function setMode(mode) {
    document.body.classList.toggle('mode-museum', mode === 'museum');
    document.body.classList.toggle('mode-edit', mode === 'edit');
  }

  function openEditor(exhibit, isNew) {
    editing = { exhibit, isNew, pedestal: exhibit.pedestal };
    setMode('edit');
    fitWorld();
    clearAll();
    for (const p of exhibit.pieces) {
      addPiece(p.part, p.x, p.y, { rot: p.rot, scale: p.scale, flip: p.flip });
    }
    select(null);
    placardTitle.textContent = exhibit.title;
    refreshPedestalPicker();
    if (isNew) scatterStarter();
    dirty = false;
  }

  function closeEditor(focusId) {
    editing = null;
    dirty = false;
    select(null);
    clearAll();
    setMode('museum');
    renderMuseum();
    if (focusId) scrollToExhibit(focusId, 'instant');
  }

  function newExhibit() {
    openEditor({ id: newId(), title: '', pedestal: defaultPedestal, pieces: [] }, true);
  }

  function saveEditor() {
    const { exhibit, isNew, pedestal } = editing;
    exhibit.pieces = pieces.map(({ part, x, y, rot, scale, flip }) => ({ part, x, y, rot, scale, flip }));
    exhibit.title = placardTitle.textContent.trim();
    exhibit.pedestal = pedestal;
    if (isNew) exhibits.push(exhibit);
    saveMuseum();
    closeEditor(exhibit.id);
  }

  // ── 存檔 ──────────────────────────────────────────
  function saveMuseum() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ exhibits }));
    } catch (err) {
      // 無痕模式等情況存不了，不影響遊玩
    }
  }

  function readJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (err) {
      return null;
    }
  }

  // 回傳是否有存檔（沒有代表第一次來玩）
  function loadMuseum() {
    const data = readJSON(SAVE_KEY);
    if (data && Array.isArray(data.exhibits)) {
      exhibits = data.exhibits.filter(Boolean).map((ex) => ({
        id: String(ex.id || newId()),
        title: typeof ex.title === 'string' ? ex.title : '',
        pedestal: typeof ex.pedestal === 'string' ? ex.pedestal : defaultPedestal,
        pieces: cleanPieces(ex.pieces),
      }));
      return true;
    }
    const old = readJSON(OLD_SAVE_KEY);
    if (old && Array.isArray(old.pieces)) {
      exhibits = [{
        id: newId(),
        title: typeof old.title === 'string' ? old.title : '',
        pedestal: defaultPedestal,
        pieces: cleanPieces(old.pieces),
      }];
      saveMuseum();
      return true;
    }
    return false;
  }

  placardTitle.addEventListener('input', markDirty);
  placardTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      placardTitle.blur();
    }
  });

  // ── 頂部按鈕 ──────────────────────────────────────
  $('#btn-new').addEventListener('click', newExhibit);
  $('#btn-help').addEventListener('click', () => $('#help').showModal());
  $('#btn-save').addEventListener('click', saveEditor);
  $('#btn-cancel').addEventListener('click', () => {
    if (dirty && !confirm('還沒儲存，確定要放棄這次的修改嗎？')) return;
    closeEditor(editing.isNew ? null : editing.exhibit.id);
  });
  $('#btn-remove').addEventListener('click', () => {
    if (!confirm('要拆除這個展台嗎？上面的化石會收回化石庫。')) return;
    const { exhibit, isNew } = editing;
    if (!isNew) {
      exhibits = exhibits.filter((ex) => ex !== exhibit);
      saveMuseum();
    }
    closeEditor(null);
  });
  $('#btn-reset').addEventListener('click', () => {
    if (confirm('要把工作台清空，重新拿出暴龍的骨頭嗎？')) scatterStarter();
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
    } else {
      fitHall();
    }
  });

  (async () => {
    await Promise.all([loadLibrary(), loadPedestals()]);
    buildLibrary();
    buildPedestalPicker();
    const returning = loadMuseum();
    renderMuseum();
    if (!returning) $('#help').showModal();
  })();
})();
