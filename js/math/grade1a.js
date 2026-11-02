// 小一(上) 數學題庫：10 以內的數、比大小、分與合、10 以內的加減、30 以內的數、順序、整點、形狀。
// 題目格式見 js/math/grade3a.js 開頭的說明。
(() => {
  const { rint, pick } = window.MathKit;
  const things = ['🍎', '🐟', '⭐', '🌸', '🚗', '🦕', '🎈'];

  const topics = [
    () => {
      const n = rint(3, 10);
      const t = pick(things);
      return { unit: '數到 10', text: `${t.repeat(n)}　一共有幾個？`, inputs: [{ answer: n, suffix: '個' }], solution: `${n} 個` };
    },
    () => {
      const a = rint(0, 10);
      let b = rint(0, 10);
      if (Math.random() < 0.15) b = a;
      const answer = a > b ? '>' : a < b ? '<' : '=';
      return { unit: '比大小', text: `比比看，○ 裡應該填哪一個？　${a} ○ ${b}`, choices: ['>', '<', '='], answer, solution: `${a} ${answer} ${b}` };
    },
    () => {
      const a = rint(1, 9);
      const b = rint(0, 10 - a);
      return { unit: '加法', text: `${a} ＋ ${b} ＝ ？`, inputs: [{ answer: a + b }], solution: `${a + b}` };
    },
    () => {
      const a = rint(2, 10);
      const b = rint(0, a);
      return { unit: '減法', text: `${a} － ${b} ＝ ？`, inputs: [{ answer: a - b }], solution: `${a - b}` };
    },
    () => {
      const n = rint(4, 10);
      const a = rint(1, n - 1);
      return { unit: '分與合', text: `${n} 可以分成 ${a} 和幾？`, inputs: [{ answer: n - a }], solution: `${n - a}` };
    },
    () => {
      const a = rint(1, 9);
      return { unit: '分與合', text: `${a} 和幾合起來是 10？`, inputs: [{ answer: 10 - a }], solution: `${10 - a}` };
    },
    () => {
      const front = rint(1, 8);
      return {
        unit: '順序',
        text: `小朋友排隊，小明前面有 ${front} 個人，小明排在第幾個？`,
        inputs: [{ prefix: '第', answer: front + 1, suffix: '個' }],
        solution: `第 ${front + 1} 個`,
      };
    },
    () => {
      const t = rint(1, 2);
      const o = rint(0, 9);
      return { unit: '30 以內的數', text: `${t} 個十和 ${o} 個一合起來是多少？`, inputs: [{ answer: t * 10 + o }], solution: `${t * 10 + o}` };
    },
    () => {
      const n = rint(5, 29);
      const more = Math.random() < 0.5;
      const answer = more ? n + 1 : n - 1;
      return { unit: '30 以內的數', text: `比 ${n} ${more ? '多' : '少'} 1 的數是多少？`, inputs: [{ answer }], solution: `${answer}` };
    },
    () => {
      const h = rint(1, 12);
      return { unit: '認識時鐘', text: `短針（時針）指著 ${h}，長針（分針）指著 12，是幾點？`, inputs: [{ answer: h, suffix: '點' }], solution: `${h} 點` };
    },
    () => {
      const a = rint(1, 4);
      const b = rint(1, 3);
      const c = rint(0, 10 - a - b);
      return { unit: '連加', text: `${a} ＋ ${b} ＋ ${c} ＝ ？`, inputs: [{ answer: a + b + c }], solution: `${a + b + c}` };
    },
    () => {
      const [shape, what, n] = pick([['三角形', '角', 3], ['三角形', '邊', 3], ['正方形', '角', 4], ['正方形', '邊', 4], ['長方形', '邊', 4]]);
      return { unit: '形狀', text: `${shape}有幾個${what}？`, inputs: [{ answer: n, suffix: '個' }], solution: `${n} 個` };
    },
    () => {
      const have = rint(3, 10);
      const eat = rint(1, have - 1);
      return { unit: '加減應用', text: `盤子裡有 ${have} 顆草莓，吃掉 ${eat} 顆，還剩幾顆？`, inputs: [{ answer: have - eat, suffix: '顆' }], solution: `${have - eat} 顆` };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g1a', name: '小一(上)', short: '小一上', topics });
})();
