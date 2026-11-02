// 小四(上) 數學題庫：一億以內的數、多位數乘法、除以二位數、角度、假分數與帶分數、四則運算、概數、二位小數。
// 題目格式見 js/math/grade3a.js 開頭的說明。
(() => {
  const { rint, pick, dec, frac, mixed } = window.MathKit;

  const topics = [
    () => {
      const [w, t, h] = [rint(1, 9), rint(0, 9), rint(0, 9)];
      const n = w * 10000 + t * 1000 + h * 10;
      return { unit: '一億以內的數', text: `${w} 個萬、${t} 個千和 ${h} 個十，合起來是多少？`, inputs: [{ answer: n }], solution: `${n}` };
    },
    () => {
      const n = rint(1000000, 99999999);
      const [name, v] = pick([['千萬', 1e7], ['百萬', 1e6], ['十萬', 1e5], ['萬', 1e4], ['千', 1e3]]);
      const d = Math.floor(n / v) % 10;
      if (n < v) return { unit: '一億以內的數', text: `${n} 的千位數字是多少？`, inputs: [{ answer: Math.floor(n / 1000) % 10 }], solution: `${Math.floor(n / 1000) % 10}` };
      return { unit: '一億以內的數', text: `${n} 的${name}位數字是多少？`, inputs: [{ answer: d }], solution: `${d}` };
    },
    () => {
      const a = rint(102, 489);
      const b = rint(12, 68);
      return { unit: '乘法', text: `${a} × ${b} ＝ ？`, inputs: [{ answer: a * b }], solution: `${a * b}` };
    },
    () => {
      const b = rint(12, 45);
      const q = rint(6, 29);
      const r = rint(0, b - 1);
      const n = b * q + r;
      return r
        ? { unit: '除法', text: `${n} ÷ ${b} ＝ ？`, inputs: [{ answer: q }, { prefix: '餘', answer: r }], solution: `${q} 餘 ${r}` }
        : { unit: '除法', text: `${n} ÷ ${b} ＝ ？`, inputs: [{ answer: q }], solution: `${q}` };
    },
    () => {
      const a = rint(30, 80);
      const b = rint(20, 150 - a);
      const c = 180 - a - b;
      return { unit: '角度', text: `一個三角形有兩個角是 ${a} 度和 ${b} 度，第三個角是幾度？`, inputs: [{ answer: c, suffix: '度' }], solution: `${c} 度` };
    },
    () => {
      const [name, total] = pick([['直角', 90], ['平角', 180], ['周角', 360]]);
      const a = rint(10, total - 10);
      return { unit: '角度', text: `一個 ${a} 度的角和另一個角合起來剛好是一個${name}（${total} 度），另一個角是幾度？`, inputs: [{ answer: total - a, suffix: '度' }], solution: `${total - a} 度` };
    },
    () => {
      const d = rint(3, 9);
      const w = rint(1, 5);
      const n = rint(1, d - 1);
      return {
        unit: '分數',
        text: `假分數 ${frac(w * d + n, d)} 化成帶分數是多少？`,
        layout: 'mixed',
        exact: true,
        inputs: [{ answer: w }, { answer: n }, { answer: d }],
        solution: mixed(w, n, d),
      };
    },
    () => {
      const d = rint(3, 9);
      const w = rint(1, 5);
      const n = rint(1, d - 1);
      return {
        unit: '分數',
        text: `帶分數 ${mixed(w, n, d)} 化成假分數是多少？`,
        layout: 'fraction',
        exact: true,
        inputs: [{ answer: w * d + n }, { answer: d }],
        solution: frac(w * d + n, d),
      };
    },
    () => {
      const d = rint(4, 9);
      const [w1, w2] = [rint(1, 4), rint(1, 4)];
      const n1 = rint(1, d - 2);
      const n2 = rint(1, d - 1 - n1);
      return {
        unit: '分數的加法',
        text: `${mixed(w1, n1, d)} ＋ ${mixed(w2, n2, d)} ＝ ？`,
        layout: 'mixed',
        inputs: [{ answer: w1 + w2 }, { answer: n1 + n2 }, { answer: d }],
        solution: mixed(w1 + w2, n1 + n2, d),
      };
    },
    () => {
      const c = rint(2, 9);
      const b = c * rint(2, 9);
      const a = rint(10, 90);
      return { unit: '四則運算', text: `${a} ＋ ${b} ÷ ${c} ＝ ？`, inputs: [{ answer: a + b / c }], solution: `${a + b / c}` };
    },
    () => {
      const a = rint(30, 90);
      const b = rint(5, a - 10);
      const c = rint(2, 9);
      return { unit: '四則運算', text: `（${a} － ${b}）× ${c} ＝ ？`, inputs: [{ answer: (a - b) * c }], solution: `${(a - b) * c}` };
    },
    () => {
      const n = rint(1050, 98950);
      const [name, v] = pick([['百', 100], ['千', 1000]]);
      const answer = Math.round(n / v) * v;
      return { unit: '概數', text: `${n} 用四捨五入法取概數到${name}位，是多少？`, inputs: [{ answer }], solution: `${answer}` };
    },
    () => {
      const a = rint(101, 899);
      const b = rint(11, 99) * 10;
      return { unit: '二位小數', text: `${dec(a / 100)} ＋ ${dec(b / 100)} ＝ ？`, inputs: [{ answer: (a + b) / 100 }], solution: dec((a + b) / 100) };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g4a', name: '小四(上)', short: '小四上', topics });
})();
