// 計算紙：在數學練習時打開，用原子筆在方格紙上算，也可以用橡皮擦或全部清除。
// 每一題有自己的一張計算紙（strokes 陣列），由 quiz.js 保管；離開練習就不留了。
//   ScratchPad.open({ fillQuestion(node), strokes, onClose })
//     fillQuestion ：把題目放進計算紙上方，算的時候看得到數字
//     strokes      ：這一題的筆畫，畫的時候會直接加進這個陣列
window.ScratchPad = (() => {
  const PEN_COLOR = '#1f3a93'; // 藍色原子筆
  const PEN_WIDTH = 3;
  const ERASER_WIDTH = 30;

  const $ = (sel) => document.querySelector(sel);
  const screen = $('#scratch');
  const paper = $('#scratch-paper');
  const canvas = $('#scratch-canvas');
  const questionBox = $('#scratch-question');
  const ctx = canvas.getContext('2d');

  let strokes = null;
  let onClose = null;
  let tool = 'pen';
  let current = null; // 正在畫的筆畫 { tool, points, pointerId }
  let dpr = 1;

  function styleFor(stroke) {
    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = PEN_COLOR;
    ctx.lineWidth = stroke.tool === 'eraser' ? ERASER_WIDTH : PEN_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function drawSegment(stroke, from, to) {
    styleFor(stroke);
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
  }

  function redraw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokes || []) {
      styleFor(s);
      ctx.beginPath();
      s.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (s.points.length === 1) ctx.lineTo(s.points[0][0] + 0.1, s.points[0][1]);
      ctx.stroke();
    }
  }

  function resize() {
    const r = paper.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    redraw();
  }

  function pointOf(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  // 一次只畫一筆：第二根手指（或手掌）碰到時不會亂畫
  canvas.addEventListener('pointerdown', (e) => {
    if (current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const p = pointOf(e);
    current = { tool, points: [p], pointerId: e.pointerId };
    strokes.push({ tool: current.tool, points: current.points });
    drawSegment(current, p, [p[0] + 0.1, p[1]]);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!current || e.pointerId !== current.pointerId) return;
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events.length ? events : [e]) {
      const p = pointOf(ev);
      const last = current.points[current.points.length - 1];
      current.points.push(p);
      drawSegment(current, last, p);
    }
  });

  function endStroke(e) {
    if (current && e.pointerId === current.pointerId) current = null;
  }
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);

  function setTool(name) {
    tool = name;
    screen.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('active', b.dataset.tool === name));
    paper.classList.toggle('erasing', name === 'eraser');
  }

  screen.querySelectorAll('[data-tool]').forEach((b) => {
    b.addEventListener('click', () => setTool(b.dataset.tool));
  });

  $('#scratch-clear').addEventListener('click', () => {
    if (!strokes?.length || !confirm('要把這張計算紙全部擦掉嗎？')) return;
    strokes.length = 0;
    redraw();
  });

  function close() {
    screen.hidden = true;
    current = null;
    strokes = null;
    const done = onClose;
    onClose = null;
    done?.();
  }
  $('#scratch-close').addEventListener('click', close);

  window.addEventListener('resize', () => {
    if (!screen.hidden) resize();
  });

  return {
    open(options) {
      strokes = options.strokes;
      onClose = options.onClose;
      questionBox.innerHTML = '';
      options.fillQuestion(questionBox);
      setTool('pen');
      screen.hidden = false;
      resize();
    },
    close,
    isOpen: () => !screen.hidden,
  };
})();
