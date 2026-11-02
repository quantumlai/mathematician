// 小五(上) 數學題庫：因數與倍數、最大公因數與最小公倍數、擴分與約分、異分母分數加減、三角形／平行四邊形／梯形面積、小數乘法。
// 題目格式見 js/math/grade3a.js 開頭的說明。
(() => {
  const { rint, pick, gcd, lcm, dec, clean, frac, numer, simplify, fracAnswer } = window.MathKit;

  const factorCount = (n) => {
    let c = 0;
    for (let i = 1; i <= n; i++) if (n % i === 0) c++;
    return c;
  };

  const topics = [
    () => {
      const n = pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 45, 48]);
      return { unit: '因數', text: `${n} 一共有幾個因數？`, inputs: [{ answer: factorCount(n), suffix: '個' }], solution: `${factorCount(n)} 個` };
    },
    () => {
      const g = rint(2, 9);
      let a = rint(2, 9);
      let b = rint(2, 9);
      while (gcd(a, b) !== 1 || a === b) [a, b] = [rint(2, 9), rint(2, 9)];
      return { unit: '最大公因數', text: `${g * a} 和 ${g * b} 的最大公因數是多少？`, inputs: [{ answer: g }], solution: `${g}` };
    },
    () => {
      const [a, b] = pick([[4, 6], [6, 8], [6, 9], [8, 12], [9, 12], [10, 15], [12, 18], [4, 10], [6, 10], [12, 16]]);
      return { unit: '最小公倍數', text: `${a} 和 ${b} 的最小公倍數是多少？`, inputs: [{ answer: lcm(a, b) }], solution: `${lcm(a, b)}` };
    },
    () => {
      const d0 = rint(3, 9);
      const n0 = rint(1, d0 - 1);
      const [n, d] = simplify(n0, d0);
      const k = rint(2, 6);
      return {
        unit: '約分',
        text: `把 ${frac(n * k, d * k)} 約分成最簡分數。`,
        layout: 'fraction',
        exact: true,
        inputs: [{ answer: n }, { answer: d }],
        solution: frac(n, d),
      };
    },
    () => {
      const d = rint(3, 8);
      const n = numer(d);
      const k = rint(2, 6);
      return { unit: '擴分', text: `把 ${frac(n, d)} 擴分成分母是 ${d * k} 的分數，分子是多少？`, inputs: [{ answer: n * k }], solution: frac(n * k, d * k) };
    },
    () => {
      const [d1, d2] = pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [4, 5], [6, 8], [5, 6]]);
      const n1 = numer(d1);
      const n2 = numer(d2);
      return { unit: '異分母分數的加法', text: `${frac(n1, d1)} ＋ ${frac(n2, d2)} ＝ ？`, ...fracAnswer(n1 * d2 + n2 * d1, d1 * d2) };
    },
    () => {
      const [d1, d2] = pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [4, 5], [6, 8], [5, 6]]);
      let n1 = numer(d1);
      let n2 = numer(d2);
      if (n1 * d2 <= n2 * d1) [n1, n2] = [d1 - 1, 1];
      return { unit: '異分母分數的減法', text: `${frac(n1, d1)} － ${frac(n2, d2)} ＝ ？`, ...fracAnswer(n1 * d2 - n2 * d1, d1 * d2) };
    },
    () => {
      const b = rint(3, 20);
      const h = rint(2, 12) * 2;
      return { unit: '三角形面積', text: `一個三角形底是 ${b} 公分、高是 ${h} 公分，面積是幾平方公分？`, inputs: [{ answer: (b * h) / 2, suffix: '平方公分' }], solution: `${(b * h) / 2} 平方公分` };
    },
    () => {
      const b = rint(4, 20);
      const h = rint(3, 15);
      return { unit: '平行四邊形面積', text: `一個平行四邊形底是 ${b} 公分、高是 ${h} 公分，面積是幾平方公分？`, inputs: [{ answer: b * h, suffix: '平方公分' }], solution: `${b * h} 平方公分` };
    },
    () => {
      const top = rint(3, 10);
      const bottom = top + rint(2, 10);
      const h = rint(2, 10) * 2;
      const area = ((top + bottom) * h) / 2;
      return { unit: '梯形面積', text: `一個梯形上底 ${top} 公分、下底 ${bottom} 公分、高 ${h} 公分，面積是幾平方公分？`, inputs: [{ answer: area, suffix: '平方公分' }], solution: `${area} 平方公分` };
    },
    () => {
      const a = rint(11, 49);
      const b = rint(2, 9);
      const answer = clean((a * b) / 100);
      return { unit: '小數的乘法', text: `${dec(a / 10)} × ${dec(b / 10)} ＝ ？`, inputs: [{ answer }], solution: dec(answer) };
    },
    () => {
      const k = pick([3, 4, 6, 7, 8, 9]);
      const right = k * rint(3, 12);
      const wrong = new Set();
      while (wrong.size < 2) {
        const w = right + rint(-9, 9);
        if (w > 0 && w % k !== 0) wrong.add(w);
      }
      const choices = [right, ...wrong].sort(() => Math.random() - 0.5).map(String);
      return { unit: '倍數', text: `下面哪一個數是 ${k} 的倍數？`, choices, answer: String(right), solution: `${right}` };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g5a', name: '小五(上)', short: '小五上', topics });
})();
