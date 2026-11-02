// 小六(下) 數學題庫：速率、時間與距離、折扣、百分率應用、基準量與比較量、圓柱體積、表面積、正比與反比、平均。
// 題目格式見 js/math/grade3a.js 開頭的說明。圓周率用 3.14。
(() => {
  const { rint, pick, dec, clean, frac, numer } = window.MathKit;

  const topics = [
    () => {
      const v = rint(4, 9) * 10;
      const t = rint(2, 5);
      return { unit: '速率', text: `一輛汽車 ${t} 小時行駛 ${v * t} 公里，平均時速是幾公里？`, inputs: [{ answer: v, suffix: '公里' }], solution: `時速 ${v} 公里` };
    },
    () => {
      const v = rint(30, 90);
      const t = rint(2, 6);
      return { unit: '速率', text: `時速 ${v} 公里，${t} 小時可以走幾公里？`, inputs: [{ answer: v * t, suffix: '公里' }], solution: `${v * t} 公里` };
    },
    () => {
      const v = pick([40, 50, 60, 80, 90]);
      const t = rint(2, 6);
      return { unit: '速率', text: `兩地相距 ${v * t} 公里，用時速 ${v} 公里前進，要幾小時才會到？`, inputs: [{ answer: t, suffix: '小時' }], solution: `${t} 小時` };
    },
    () => {
      const m = pick([100, 200, 250, 300, 500, 1000]);
      return { unit: '速率', text: `分速 ${m} 公尺，等於時速幾公里？`, inputs: [{ answer: (m * 60) / 1000, suffix: '公里' }], solution: `時速 ${(m * 60) / 1000} 公里` };
    },
    () => {
      const price = rint(3, 20) * 100;
      const off = pick([9, 8, 75, 7, 6, 5]);
      const rate = off < 10 ? off / 10 : off / 100;
      const name = off < 10 ? `${['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][off]}折` : '七五折';
      return { unit: '折扣', text: `原價 ${price} 元的衣服打${name}，要付多少元？`, inputs: [{ answer: clean(price * rate), suffix: '元' }], solution: `${dec(price * rate)} 元` };
    },
    () => {
      const total = pick([20, 25, 40, 50]);
      const part = rint(1, total - 1);
      const pct = (part * 100) / total;
      return { unit: '百分率', text: `全班 ${total} 人，其中 ${part} 人戴眼鏡，戴眼鏡的人佔全班的百分之多少？`, inputs: [{ answer: pct, suffix: '%' }], solution: `${pct}%` };
    },
    () => {
      const d = pick([3, 4, 5, 6, 8]);
      const n = numer(d);
      const whole = d * rint(3, 12);
      return { unit: '基準量與比較量', text: `一個數的 ${frac(n, d)} 是 ${(whole * n) / d}，這個數是多少？`, inputs: [{ answer: whole }], solution: `${whole}` };
    },
    () => {
      const r = rint(1, 6);
      const h = rint(2, 10);
      const v = clean(r * r * 3.14 * h);
      return { unit: '柱體體積', text: `一個圓柱底面半徑 ${r} 公分、高 ${h} 公分，體積是幾立方公分？（圓周率用 3.14）`, inputs: [{ answer: v, suffix: '立方公分' }], solution: `${dec(v)} 立方公分` };
    },
    () => {
      const [l, w, h] = [rint(3, 10), rint(2, 8), rint(2, 6)];
      const area = 2 * (l * w + w * h + h * l);
      return { unit: '表面積', text: `一個長方體長 ${l} 公分、寬 ${w} 公分、高 ${h} 公分，表面積是幾平方公分？`, inputs: [{ answer: area, suffix: '平方公分' }], solution: `${area} 平方公分` };
    },
    () => {
      const each = rint(8, 25);
      const n1 = rint(2, 5);
      const n2 = rint(6, 12);
      return { unit: '正比', text: `${n1} 枝同樣的筆共 ${each * n1} 元，${n2} 枝要多少元？`, inputs: [{ answer: each * n2, suffix: '元' }], solution: `${each * n2} 元` };
    },
    () => {
      const [p1, d1, p2] = pick([[4, 6, 8], [3, 8, 6], [6, 4, 8], [2, 12, 8], [5, 6, 10], [4, 9, 6]]);
      const d2 = (p1 * d1) / p2;
      return { unit: '反比', text: `一件工作 ${p1} 個人做要 ${d1} 天，如果 ${p2} 個人做（每個人一樣快），要幾天？`, inputs: [{ answer: d2, suffix: '天' }], solution: `${d2} 天` };
    },
    () => {
      // 四次分數都在 0～100 之間，平均是整數
      let avg;
      let scores;
      do {
        avg = rint(70, 92);
        scores = [0, 1, 2].map(() => Math.min(100, avg + rint(-10, 10)));
        scores.push(avg * 4 - scores[0] - scores[1] - scores[2]);
      } while (scores[3] < 0 || scores[3] > 100);
      const [a, b, c, d] = scores;
      return { unit: '平均', text: `小明 4 次考試考了 ${a}、${b}、${c}、${d} 分，平均是幾分？`, inputs: [{ answer: avg, suffix: '分' }], solution: `${avg} 分` };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g6b', name: '小六(下)', short: '小六下', topics });
})();
