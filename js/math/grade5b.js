// 小五(下) 數學題庫：分數乘法、帶分數乘整數、小數除以整數、整數相除商是小數、體積與容積、時間的乘法、分數應用、小數四則。
// 題目格式見 js/math/grade3a.js 開頭的說明。
(() => {
  const { rint, pick, dec, clean, frac, mixed, numer, fracAnswer } = window.MathKit;

  const topics = [
    () => {
      const [d1, d2] = [rint(2, 7), rint(2, 7)];
      const [n1, n2] = [numer(d1), numer(d2)];
      return { unit: '分數的乘法', text: `${frac(n1, d1)} × ${frac(n2, d2)} ＝ ？`, ...fracAnswer(n1 * n2, d1 * d2) };
    },
    () => {
      const d = pick([2, 3, 4, 5]);
      const w = rint(1, 4);
      const n = numer(d);
      const k = d * rint(1, 3);
      return { unit: '分數的乘法', text: `${mixed(w, n, d)} × ${k} ＝ ？`, inputs: [{ answer: ((w * d + n) * k) / d }], solution: `${((w * d + n) * k) / d}` };
    },
    () => {
      const b = rint(2, 9);
      const q = rint(11, 99);
      return { unit: '小數的除法', text: `${dec((q * b) / 10)} ÷ ${b} ＝ ？`, inputs: [{ answer: q / 10 }], solution: dec(q / 10) };
    },
    () => {
      const [a, b] = pick([[9, 4], [7, 2], [3, 4], [11, 4], [13, 5], [7, 8], [9, 5], [21, 8], [5, 8]]);
      return { unit: '整數相除', text: `${a} ÷ ${b} ＝ ？（用小數表示）`, inputs: [{ answer: clean(a / b) }], solution: dec(a / b) };
    },
    () => {
      const m = rint(2, 6);
      return { unit: '體積', text: `${m} 立方公尺 ＝ ？ 立方公分`, inputs: [{ answer: m * 1000000, suffix: '立方公分' }], solution: `${m * 1000000} 立方公分` };
    },
    () => {
      const [l, w, h] = pick([[20, 10, 5], [25, 20, 10], [50, 20, 10], [40, 25, 10], [20, 20, 10]]);
      const liters = (l * w * h) / 1000;
      return {
        unit: '容積',
        text: `一個水箱裡面長 ${l} 公分、寬 ${w} 公分、高 ${h} 公分，最多可以裝幾公升的水？（1 公升 ＝ 1000 立方公分）`,
        inputs: [{ answer: liters, suffix: '公升' }],
        solution: `${liters} 公升`,
      };
    },
    () => {
      const s = rint(3, 9);
      return { unit: '體積', text: `一個正方體邊長 ${s} 公分，體積是幾立方公分？`, inputs: [{ answer: s ** 3, suffix: '立方公分' }], solution: `${s ** 3} 立方公分` };
    },
    () => {
      const m = pick([15, 20, 25, 30, 40, 45]);
      const days = rint(3, 6);
      const total = (60 + m) * days;
      return {
        unit: '時間的乘法',
        text: `每天練琴 1 時 ${m} 分，${days} 天一共練了幾時幾分？`,
        inputs: [{ answer: Math.floor(total / 60), suffix: '時' }, { answer: total % 60, suffix: '分' }],
        solution: `${Math.floor(total / 60)} 時 ${total % 60} 分`,
      };
    },
    () => {
      const d = pick([3, 4, 5, 6]);
      const n = numer(d);
      const len = d * rint(2, 8);
      return { unit: '分數應用', text: `一條繩子長 ${len} 公尺，用掉了 ${frac(n, d)}，用掉幾公尺？`, inputs: [{ answer: (len * n) / d, suffix: '公尺' }], solution: `${(len * n) / d} 公尺` };
    },
    () => {
      const a = rint(11, 49);
      const b = rint(2, 9);
      const c = rint(1, 30);
      const answer = clean((a * b) / 10 + c / 10);
      return { unit: '小數四則', text: `${dec(a / 10)} × ${b} ＋ ${dec(c / 10)} ＝ ？`, inputs: [{ answer }], solution: dec(answer) };
    },
    () => {
      const [d1, d2] = pick([[3, 5], [4, 7], [5, 8], [2, 7], [3, 8], [5, 9]]);
      const n1 = numer(d1);
      const n2 = numer(d2);
      const x = n1 * d2;
      const y = n2 * d1;
      const answer = x > y ? '>' : x < y ? '<' : '=';
      return { unit: '分數比大小', text: `比比看，○ 裡應該填哪一個？　${frac(n1, d1)} ○ ${frac(n2, d2)}`, choices: ['>', '<', '='], answer, solution: `${frac(n1, d1)} ${answer} ${frac(n2, d2)}` };
    },
    () => {
      const price = pick([30, 40, 45, 60, 80, 120]);
      const n = rint(2, 9);
      const answer = clean((price * n) / 10);
      return { unit: '小數應用', text: `一公斤香蕉 ${price} 元，買 ${dec(n / 10)} 公斤要多少元？`, inputs: [{ answer, suffix: '元' }], solution: `${dec(answer)} 元` };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g5b', name: '小五(下)', short: '小五下', topics });
})();
