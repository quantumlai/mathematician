// 小三(下) 數學題庫：乘法、除法、一位小數、同分母分數加減、公升與毫公升、公斤與公克、24 時制、圓、面積。
// 題目格式見 js/math/grade3a.js 開頭的說明。
(() => {
  const { rint, pick, dec, frac } = window.MathKit;

  // 三年級還沒學約分：答案寫成同一個分母（6 分之 3），約分後的寫法也算對
  const sameDen = (n, d) => ({ layout: 'fraction', inputs: [{ answer: n }, { answer: d }], solution: frac(n, d) });

  const topics = [
    () => {
      const a = rint(1001, 2499);
      const b = rint(2, 4);
      return { unit: '乘法', text: `${a} × ${b} ＝ ？`, inputs: [{ answer: a * b }], solution: `${a * b}` };
    },
    () => {
      const b = rint(2, 9);
      const q = rint(20, Math.floor(999 / b));
      return { unit: '除法', text: `${b * q} ÷ ${b} ＝ ？`, inputs: [{ answer: q }], solution: `${q}` };
    },
    () => {
      const b = rint(3, 9);
      const q = rint(11, 30);
      const r = rint(1, b - 1);
      return { unit: '除法', text: `${b * q + r} ÷ ${b} ＝ ？`, inputs: [{ answer: q }, { prefix: '餘', answer: r }], solution: `${q} 餘 ${r}` };
    },
    () => {
      const n = rint(2, 9);
      return { unit: '小數', text: `${n} 個 0.1 是多少？`, inputs: [{ answer: n / 10 }], solution: dec(n / 10) };
    },
    () => {
      const a = rint(11, 59);
      const b = rint(11, 39);
      if (a % 10 === 0 || b % 10 === 0) return topics[4](); // 兩個數都要有小數
      return { unit: '小數的加法', text: `${dec(a / 10)} ＋ ${dec(b / 10)} ＝ ？`, inputs: [{ answer: (a + b) / 10 }], solution: dec((a + b) / 10) };
    },
    () => {
      const a = rint(30, 99);
      const b = rint(11, a - 5);
      return { unit: '小數的減法', text: `${dec(a / 10)} － ${dec(b / 10)} ＝ ？`, inputs: [{ answer: (a - b) / 10 }], solution: dec((a - b) / 10) };
    },
    () => {
      const d = rint(5, 12);
      const a = rint(1, d - 2);
      const b = rint(1, d - 1 - a);
      return { unit: '分數的加法', text: `${frac(a, d)} ＋ ${frac(b, d)} ＝ ？`, ...sameDen(a + b, d) };
    },
    () => {
      const d = rint(5, 12);
      const a = rint(3, d - 1);
      const b = rint(1, a - 1);
      return { unit: '分數的減法', text: `${frac(a, d)} － ${frac(b, d)} ＝ ？`, ...sameDen(a - b, d) };
    },
    () => {
      const l = rint(1, 5);
      const ml = rint(1, 9) * 100 + pick([0, 50]);
      return { unit: '容量', text: `${l} 公升 ${ml} 毫公升 ＝ ？ 毫公升`, inputs: [{ answer: l * 1000 + ml, suffix: '毫公升' }], solution: `${l * 1000 + ml} 毫公升` };
    },
    () => {
      const kg = rint(1, 6);
      const g = pick([50, 120, 300, 450, 800]);
      return { unit: '重量', text: `${kg} 公斤 ${g} 公克 ＝ ？ 公克`, inputs: [{ answer: kg * 1000 + g, suffix: '公克' }], solution: `${kg * 1000 + g} 公克` };
    },
    () => {
      const h = rint(1, 11);
      const m = rint(0, 11) * 5;
      return {
        unit: '24 時制',
        text: `下午 ${h} 點 ${m} 分，用 24 時制表示是幾點幾分？`,
        inputs: [{ answer: h + 12, suffix: '點' }, { answer: m, suffix: '分' }],
        solution: `${h + 12} 點 ${m} 分`,
      };
    },
    () => {
      const r = rint(2, 15);
      return Math.random() < 0.5
        ? { unit: '圓', text: `一個圓的半徑是 ${r} 公分，直徑是幾公分？`, inputs: [{ answer: r * 2, suffix: '公分' }], solution: `${r * 2} 公分` }
        : { unit: '圓', text: `一個圓的直徑是 ${r * 2} 公分，半徑是幾公分？`, inputs: [{ answer: r, suffix: '公分' }], solution: `${r} 公分` };
    },
    () => {
      const l = rint(3, 12);
      const w = rint(2, l);
      return { unit: '面積', text: `一個長方形長 ${l} 公分、寬 ${w} 公分，面積是幾平方公分？`, inputs: [{ answer: l * w, suffix: '平方公分' }], solution: `${l * w} 平方公分` };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g3b', name: '小三(下)', short: '小三下', topics });
})();
