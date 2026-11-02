// 小六(上) 數學題庫：分數除法、小數除法、比與比值、圓周長與圓面積、比例尺、質因數、簡單的方程式、百分率。
// 題目格式見 js/math/grade3a.js 開頭的說明。圓周率用 3.14。
(() => {
  const { rint, pick, dec, clean, frac, numer, simplify, fracAnswer } = window.MathKit;

  const topics = [
    () => {
      const [d1, d2] = [rint(2, 9), rint(2, 9)];
      const [n1, n2] = [numer(d1), numer(d2)];
      return { unit: '分數的除法', text: `${frac(n1, d1)} ÷ ${frac(n2, d2)} ＝ ？`, ...fracAnswer(n1 * d2, d1 * n2) };
    },
    () => {
      const d = rint(2, 6);
      const n = numer(d);
      const k = n * rint(1, 6);
      return { unit: '分數的除法', text: `${k} ÷ ${frac(n, d)} ＝ ？`, ...fracAnswer(k * d, n) };
    },
    () => {
      const b = rint(2, 9);
      const q = rint(2, 12);
      return { unit: '小數的除法', text: `${dec((b * q) / 10)} ÷ ${dec(b / 10)} ＝ ？`, inputs: [{ answer: q }], solution: `${q}` };
    },
    () => {
      const k = rint(2, 6);
      let [a, b] = [rint(1, 9), rint(1, 9)];
      [a, b] = simplify(a, b);
      return { unit: '比與比值', text: `${a * k} : ${b * k} 的比值是多少？`, ...fracAnswer(a, b) };
    },
    () => {
      let [a, b] = [rint(1, 9), rint(2, 9)];
      [a, b] = simplify(a, b);
      const k = rint(2, 8);
      return { unit: '相等的比', text: `${a} : ${b} ＝ ${a * k} : ？`, inputs: [{ answer: b * k }], solution: `${b * k}` };
    },
    () => {
      const d = rint(2, 20);
      return { unit: '圓周長', text: `直徑 ${d} 公分的圓，圓周長是幾公分？（圓周率用 3.14）`, inputs: [{ answer: clean(d * 3.14), suffix: '公分' }], solution: `${dec(d * 3.14)} 公分` };
    },
    () => {
      const r = rint(1, 10);
      return { unit: '圓面積', text: `半徑 ${r} 公分的圓，面積是幾平方公分？（圓周率用 3.14）`, inputs: [{ answer: clean(r * r * 3.14), suffix: '平方公分' }], solution: `${dec(r * r * 3.14)} 平方公分` };
    },
    () => {
      const scale = pick([100, 500, 1000, 2000, 5000]);
      const cm = rint(2, 9);
      const meters = (cm * scale) / 100;
      return { unit: '比例尺', text: `比例尺 1 : ${scale} 的地圖上，兩地相距 ${cm} 公分，實際距離是幾公尺？`, inputs: [{ answer: meters, suffix: '公尺' }], solution: `${meters} 公尺` };
    },
    () => {
      const [known, last] = pick([[[2, 2, 3], 7], [[2, 3], 5], [[3, 3], 11], [[2, 2, 2], 3], [[2, 5], 7], [[3, 5], 7], [[2, 2], 13]]);
      const n = known.reduce((x, y) => x * y, 1) * last;
      return { unit: '質因數分解', text: `${n} ＝ ${known.join(' × ')} × ？`, inputs: [{ answer: last }], solution: `${last}` };
    },
    () => {
      const x = rint(5, 60);
      const a = rint(5, 40);
      return { unit: '方程式', text: `x ＋ ${a} ＝ ${x + a}，x 是多少？`, inputs: [{ prefix: 'x ＝', answer: x }], solution: `x ＝ ${x}` };
    },
    () => {
      const x = rint(3, 25);
      const a = rint(2, 9);
      return { unit: '方程式', text: `${a} × x ＝ ${a * x}，x 是多少？`, inputs: [{ prefix: 'x ＝', answer: x }], solution: `x ＝ ${x}` };
    },
    () => {
      const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [3, 10], [7, 10], [9, 20], [7, 25]]);
      const pct = (n * 100) / d;
      return { unit: '百分率', text: `${frac(n, d)} 是百分之多少？`, inputs: [{ answer: pct, suffix: '%' }], solution: `${pct}%` };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g6a', name: '小六(上)', short: '小六上', topics });
})();
