// 數學練習畫面：一次 10 題，每答一題馬上知道對錯，最後算分數。
//   MathQuiz.start({
//     grade,               ：MATH_GRADES 裡的一筆
//     pass,                ：答對幾題算過關
//     onFinish(score, total) → 獎勵 { src, name, hint } 或 null（可以是 Promise）
//     onClose()            ：關掉練習畫面時呼叫
//   })
window.MathQuiz = (() => {
  const TOTAL = 10;

  const $ = (sel) => document.querySelector(sel);
  const screen = $('#quiz');
  const titleEl = $('#quiz-title');
  const progress = $('#quiz-progress');
  const body = $('#quiz-body');

  let opts = null;
  let questions = [];
  let results = []; // true / false
  let index = 0;
  let answered = false;
  let finished = false;

  function elem(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // 把 [[3/8]] 換成上下排的分數
  function richText(node, text) {
    const re = /\[\[(\d+)\/(\d+)\]\]/g;
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      node.append(text.slice(last, m.index));
      const frac = elem('span', 'frac');
      frac.append(elem('span', 'frac-num', m[1]), elem('span', 'frac-den', m[2]));
      node.appendChild(frac);
      last = re.lastIndex;
    }
    node.append(text.slice(last));
    return node;
  }

  function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 每題盡量來自不同的出題函式
  function makeQuestions(grade) {
    const list = [];
    while (list.length < TOTAL) {
      for (const make of shuffle(grade.topics)) {
        if (list.length < TOTAL) list.push(make());
      }
    }
    return list;
  }

  function renderProgress() {
    progress.innerHTML = '';
    for (let i = 0; i < TOTAL; i++) {
      const dot = elem('span', 'quiz-dot', String(i + 1));
      if (results[i] === true) dot.classList.add('right');
      else if (results[i] === false) dot.classList.add('wrong');
      else if (i === index && !finished) dot.classList.add('current');
      progress.appendChild(dot);
    }
  }

  function makeInput() {
    const input = elem('input', 'quiz-input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.maxLength = 6;
    return input;
  }

  function renderQuestion() {
    const q = questions[index];
    answered = false;
    renderProgress();
    body.innerHTML = '';

    body.appendChild(elem('div', 'quiz-unit', `第 ${index + 1} 題・${q.unit}`));
    body.appendChild(richText(elem('div', 'quiz-text'), q.text));

    const answer = elem('div', 'quiz-answer');
    const fields = [];
    if (q.choices) {
      for (const c of q.choices) {
        const btn = elem('button', 'quiz-choice', c);
        btn.type = 'button';
        btn.addEventListener('click', () => {
          if (answered) return;
          answer.querySelectorAll('.quiz-choice').forEach((b) => b.classList.toggle('picked', b === btn));
        });
        answer.appendChild(btn);
      }
    } else if (q.layout === 'fraction') {
      const frac = elem('div', 'quiz-frac');
      const num = makeInput();
      const den = makeInput();
      num.setAttribute('aria-label', '分子');
      den.setAttribute('aria-label', '分母');
      frac.append(num, elem('div', 'quiz-frac-line'), den);
      fields.push(num, den);
      answer.append(frac);
    } else {
      for (const spec of q.inputs) {
        if (spec.prefix) answer.appendChild(elem('span', 'quiz-unit-label', spec.prefix));
        const input = makeInput();
        fields.push(input);
        answer.appendChild(input);
        if (spec.suffix) answer.appendChild(elem('span', 'quiz-unit-label', spec.suffix));
      }
    }
    body.appendChild(answer);

    const feedback = elem('div', 'quiz-feedback');
    body.appendChild(feedback);

    const actions = elem('div', 'quiz-actions');
    const btn = elem('button', 'primary quiz-submit', '確定');
    btn.type = 'button';
    actions.appendChild(btn);
    body.appendChild(actions);

    const submit = () => {
      if (answered) {
        next();
        return;
      }
      let correct;
      if (q.choices) {
        const picked = answer.querySelector('.quiz-choice.picked');
        if (!picked) {
          nudge(answer);
          return;
        }
        correct = picked.textContent === q.answer;
      } else {
        const values = fields.map((f) => f.value.normalize('NFKC').trim());
        const empty = fields.find((f, i) => !/^\d+$/.test(values[i]));
        if (empty) {
          nudge(empty);
          empty.focus();
          return;
        }
        correct = q.inputs.every((spec, i) => Number(values[i]) === spec.answer);
        fields.forEach((f) => { f.readOnly = true; });
      }
      answered = true;
      results[index] = correct;
      renderProgress();
      answer.classList.add(correct ? 'is-right' : 'is-wrong');
      feedback.className = `quiz-feedback ${correct ? 'right' : 'wrong'}`;
      if (correct) {
        feedback.textContent = pick(['答對了！', '太厲害了！', '正確！', '好棒！']);
      } else {
        feedback.append('再想想看～正確答案是 ');
        richText(feedback.appendChild(elem('b')), q.solution);
      }
      btn.textContent = index + 1 < TOTAL ? '下一題' : '看結果';
      btn.focus();
    };

    btn.addEventListener('click', submit);
    body.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    };
    fields[0]?.focus();
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function nudge(node) {
    node.classList.remove('shake');
    void node.offsetWidth; // 重新觸發動畫
    node.classList.add('shake');
  }

  function next() {
    index++;
    if (index < TOTAL) renderQuestion();
    else finish();
  }

  async function finish() {
    finished = true;
    renderProgress();
    const score = results.filter(Boolean).length;
    body.innerHTML = '';
    body.appendChild(elem('div', 'quiz-score', `答對 ${score} / ${TOTAL} 題`));

    let reward = null;
    try {
      reward = await opts.onFinish(score, TOTAL);
    } catch (err) {
      console.error(err);
      body.appendChild(elem('p', 'quiz-error', '存檔失敗了，這次的化石沒有收進化石庫。'));
    }

    if (reward) {
      const box = elem('div', 'quiz-reward');
      box.appendChild(elem('div', 'quiz-reward-title', '⛏️ 挖到化石了！'));
      const img = elem('img', 'quiz-reward-img');
      img.src = reward.src;
      img.alt = reward.name;
      box.append(img, elem('div', 'quiz-reward-name', reward.name), elem('div', 'quiz-reward-hint', reward.hint));
      body.appendChild(box);
    } else if (score < opts.pass) {
      body.appendChild(elem('p', 'quiz-retry-text', `答對 ${opts.pass} 題以上就能挖到化石，再挑戰一次吧！`));
    }

    const actions = elem('div', 'quiz-actions');
    const again = elem('button', reward ? '' : 'primary', reward ? '再挖一塊' : '再挑戰一次');
    again.type = 'button';
    again.addEventListener('click', () => begin());
    const back = elem('button', reward ? 'primary' : '', '回去');
    back.type = 'button';
    back.addEventListener('click', close);
    actions.append(again, back);
    body.appendChild(actions);
    body.onkeydown = null;
    (reward ? back : again).focus();
  }

  function begin() {
    questions = makeQuestions(opts.grade);
    results = [];
    index = 0;
    finished = false;
    renderQuestion();
  }

  function close() {
    screen.hidden = true;
    opts?.onClose?.();
    opts = null;
  }

  $('#quiz-close').addEventListener('click', () => {
    if (!finished && results.length && !confirm('練習還沒做完，確定要離開嗎？')) return;
    close();
  });

  return {
    start(options) {
      opts = options;
      titleEl.textContent = `⛏️ 採集新化石・數學・${options.grade.name}`;
      screen.hidden = false;
      begin();
    },
    isOpen: () => !screen.hidden,
  };
})();
