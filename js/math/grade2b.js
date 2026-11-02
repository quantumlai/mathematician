// 小二(下) 數學題庫：九九乘法、三位數加減、公尺與公分、平分與分裝、單位分數、月曆與時間、乘法應用。
// 題目格式見 js/math/grade3a.js 開頭的說明。
(() => {
  const { rint, pick, frac } = window.MathKit;

  const topics = [
    () => {
      const a = rint(1, 9);
      const b = rint(0, 9);
      return { unit: '九九乘法', text: `${a} × ${b} ＝ ？`, inputs: [{ answer: a * b }], solution: `${a * b}` };
    },
    () => {
      const a = pick([3, 6, 7, 9]);
      const b = rint(2, 9);
      return { unit: '九九乘法', text: `${b} × ${a} ＝ ？`, inputs: [{ answer: a * b }], solution: `${a * b}` };
    },
    () => {
      const a = rint(120, 600);
      const b = rint(100, 999 - a);
      return { unit: '三位數的加法', text: `${a} ＋ ${b} ＝ ？`, inputs: [{ answer: a + b }], solution: `${a + b}` };
    },
    () => {
      const a = rint(300, 999);
      const b = rint(100, a - 50);
      return { unit: '三位數的減法', text: `${a} － ${b} ＝ ？`, inputs: [{ answer: a - b }], solution: `${a - b}` };
    },
    () => {
      const m = rint(1, 5);
      const cm = rint(1, 99);
      return { unit: '公尺與公分', text: `${m} 公尺 ${cm} 公分 ＝ ？ 公分`, inputs: [{ answer: m * 100 + cm, suffix: '公分' }], solution: `${m * 100 + cm} 公分` };
    },
    () => {
      const m = rint(1, 5);
      const cm = rint(1, 99);
      return {
        unit: '公尺與公分',
        text: `${m * 100 + cm} 公分 ＝ ？ 公尺 ？ 公分`,
        inputs: [{ answer: m, suffix: '公尺' }, { answer: cm, suffix: '公分' }],
        solution: `${m} 公尺 ${cm} 公分`,
      };
    },
    () => {
      const people = rint(2, 6);
      const each = rint(2, 9);
      return { unit: '平分', text: `${people * each} 塊餅乾平分給 ${people} 個人，每人分到幾塊？`, inputs: [{ answer: each, suffix: '塊' }], solution: `${each} 塊` };
    },
    () => {
      const per = rint(3, 9);
      const bags = rint(2, 9);
      return { unit: '分裝', text: `${per * bags} 顆糖果，每 ${per} 顆裝一袋，可以裝幾袋？`, inputs: [{ answer: bags, suffix: '袋' }], solution: `${bags} 袋` };
    },
    () => {
      const d = pick([2, 3, 4, 5, 6, 8]);
      const thing = pick(['披薩', '蛋糕', '西瓜']);
      return {
        unit: '分數',
        text: `把一個${thing}平分成 ${d} 片，其中 1 片是幾分之幾個${thing}？`,
        layout: 'fraction',
        inputs: [{ answer: 1 }, { answer: d }],
        solution: frac(1, d),
      };
    },
    () => {
      const day = rint(1, 20);
      const weeks = rint(1, 1);
      return { unit: '月曆', text: `5 月 ${day} 日的一星期後，是 5 月幾日？`, inputs: [{ prefix: '5 月', answer: day + 7 * weeks, suffix: '日' }], solution: `5 月 ${day + 7} 日` };
    },
    () => {
      const [unit, per, name] = pick([['天', 7, '星期'], ['小時', 24, '天']]);
      const n = rint(2, 4);
      return { unit: '時間', text: `1 ${name}有 ${per} ${unit}，${n} ${name}有幾${unit}？`, inputs: [{ answer: per * n, suffix: unit }], solution: `${per * n} ${unit}` };
    },
    () => {
      const rows = rint(3, 9);
      const each = rint(3, 9);
      const extra = rint(1, 8);
      return {
        unit: '乘加',
        text: `每排有 ${each} 張椅子，排了 ${rows} 排，又多搬來 ${extra} 張，一共有幾張椅子？`,
        inputs: [{ answer: rows * each + extra, suffix: '張' }],
        solution: `${rows * each + extra} 張`,
      };
    },
    () => {
      const price = rint(2, 9);
      const n = rint(3, 9);
      return { unit: '乘法應用', text: `一顆橡皮擦 ${price} 元，買 ${n} 顆要多少元？`, inputs: [{ answer: price * n, suffix: '元' }], solution: `${price * n} 元` };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g2b', name: '小二(下)', short: '小二下', topics });
})();
