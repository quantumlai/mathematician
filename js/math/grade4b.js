// 小四(下) 數學題庫：小數乘以整數、二位小數加減、整數乘以分數、周長與面積、面積單位、時間的計算、體積、四則應用。
// 題目格式見 js/math/grade3a.js 開頭的說明。
(() => {
  const { rint, pick, dec, frac, numer } = window.MathKit;

  const topics = [
    () => {
      const a = rint(101, 499);
      const b = rint(2, 9);
      return { unit: '小數的乘法', text: `${dec(a / 100)} × ${b} ＝ ？`, inputs: [{ answer: (a * b) / 100 }], solution: dec((a * b) / 100) };
    },
    () => {
      const a = rint(300, 999);
      const b = rint(101, a - 50);
      return { unit: '二位小數', text: `${dec(a / 100)} － ${dec(b / 100)} ＝ ？`, inputs: [{ answer: (a - b) / 100 }], solution: dec((a - b) / 100) };
    },
    () => {
      const d = pick([3, 4, 5, 6, 8]);
      const n = numer(d);
      const k = rint(2, 9);
      return { unit: '分數的乘法', text: `${k * d} × ${frac(n, d)} ＝ ？`, inputs: [{ answer: k * n }], solution: `${k * n}` };
    },
    () => {
      const d = rint(5, 12);
      const n = numer(d);
      const k = rint(2, 4);
      // 四年級還沒學約分：答案寫成同一個分母，約分後的寫法也算對
      return {
        unit: '分數的乘法',
        text: `${frac(n, d)} × ${k} ＝ ？`,
        layout: 'fraction',
        inputs: [{ answer: n * k }, { answer: d }],
        solution: frac(n * k, d),
      };
    },
    () => {
      const l = rint(8, 30);
      const w = rint(3, l - 1);
      return { unit: '周長', text: `一個長方形長 ${l} 公分、寬 ${w} 公分，周長是幾公分？`, inputs: [{ answer: 2 * (l + w), suffix: '公分' }], solution: `${2 * (l + w)} 公分` };
    },
    () => {
      const s = rint(4, 25);
      return Math.random() < 0.5
        ? { unit: '面積', text: `一個正方形邊長 ${s} 公分，面積是幾平方公分？`, inputs: [{ answer: s * s, suffix: '平方公分' }], solution: `${s * s} 平方公分` }
        : { unit: '周長', text: `一個正方形邊長 ${s} 公分，周長是幾公分？`, inputs: [{ answer: s * 4, suffix: '公分' }], solution: `${s * 4} 公分` };
    },
    () => {
      const m = rint(2, 9);
      return { unit: '面積', text: `${m} 平方公尺 ＝ ？ 平方公分`, inputs: [{ answer: m * 10000, suffix: '平方公分' }], solution: `${m * 10000} 平方公分` };
    },
    () => {
      const h1 = rint(1, 3);
      const m1 = rint(2, 11) * 5;
      const h2 = rint(1, 2);
      const m2 = rint(2, 11) * 5;
      const total = (h1 + h2) * 60 + m1 + m2;
      return {
        unit: '時間的計算',
        text: `${h1} 時 ${m1} 分 ＋ ${h2} 時 ${m2} 分 ＝ ？ 時 ？ 分`,
        inputs: [{ answer: Math.floor(total / 60), suffix: '時' }, { answer: total % 60, suffix: '分' }],
        solution: `${Math.floor(total / 60)} 時 ${total % 60} 分`,
      };
    },
    () => {
      const m = rint(2, 9);
      const s = rint(1, 59);
      return { unit: '時間的計算', text: `${m} 分 ${s} 秒 ＝ ？ 秒`, inputs: [{ answer: m * 60 + s, suffix: '秒' }], solution: `${m * 60 + s} 秒` };
    },
    () => {
      const [l, w, h] = [rint(3, 9), rint(2, 6), rint(2, 6)];
      return { unit: '體積', text: `一個長方體長 ${l} 公分、寬 ${w} 公分、高 ${h} 公分，體積是幾立方公分？`, inputs: [{ answer: l * w * h, suffix: '立方公分' }], solution: `${l * w * h} 立方公分` };
    },
    () => {
      const n = rint(2, 5);
      const book = rint(35, 120);
      const pen = rint(12, 40);
      return {
        unit: '四則應用',
        text: `買 ${n} 本一本 ${book} 元的書，和 1 枝 ${pen} 元的筆，一共要付多少元？`,
        inputs: [{ answer: n * book + pen, suffix: '元' }],
        solution: `${n * book + pen} 元`,
      };
    },
    () => {
      const a = rint(11, 99);
      let b = rint(11, 99);
      if (Math.random() < 0.5) b = Math.floor(a / 10) * 10 + rint(0, 9);
      const [x, y] = [a / 100, Math.random() < 0.5 ? b / 100 : Math.floor(b / 10) / 10];
      const answer = x > y ? '>' : x < y ? '<' : '=';
      return { unit: '小數比大小', text: `比比看，○ 裡應該填哪一個？　${dec(x)} ○ ${dec(y)}`, choices: ['>', '<', '='], answer, solution: `${dec(x)} ${answer} ${dec(y)}` };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g4b', name: '小四(下)', short: '小四下', topics });
})();
