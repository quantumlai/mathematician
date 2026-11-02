// 小一(下) 數學題庫：100 以內的數、18 以內的進位加法和退位減法、二位數加減、錢幣、半點、跳數。
// 題目格式見 js/math/grade3a.js 開頭的說明。
(() => {
  const { rint, pick } = window.MathKit;

  const topics = [
    () => {
      const t = rint(1, 9);
      const o = rint(0, 9);
      return { unit: '100 以內的數', text: `${t} 個十和 ${o} 個一合起來是多少？`, inputs: [{ answer: t * 10 + o }], solution: `${t * 10 + o}` };
    },
    () => {
      const n = rint(10, 99);
      const ten = Math.random() < 0.5;
      const d = ten ? Math.floor(n / 10) : n % 10;
      return { unit: '100 以內的數', text: `${n} 的${ten ? '十' : '個'}位數字是多少？`, inputs: [{ answer: d }], solution: `${d}` };
    },
    () => {
      const a = rint(10, 99);
      let b = rint(10, 99);
      if (Math.random() < 0.1) b = a;
      const answer = a > b ? '>' : a < b ? '<' : '=';
      return { unit: '比大小', text: `比比看，○ 裡應該填哪一個？　${a} ○ ${b}`, choices: ['>', '<', '='], answer, solution: `${a} ${answer} ${b}` };
    },
    () => {
      const a = rint(2, 9);
      const b = rint(11 - a, 9);
      return { unit: '進位加法', text: `${a} ＋ ${b} ＝ ？`, inputs: [{ answer: a + b }], solution: `${a + b}` };
    },
    () => {
      const a = rint(11, 18);
      const b = rint(a - 9, 9);
      return { unit: '退位減法', text: `${a} － ${b} ＝ ？`, inputs: [{ answer: a - b }], solution: `${a - b}` };
    },
    () => {
      const a = rint(2, 8) * 10 + rint(0, 5);
      const b = rint(1, 9 - (a % 10));
      return { unit: '二位數的加法', text: `${a} ＋ ${b} ＝ ？`, inputs: [{ answer: a + b }], solution: `${a + b}` };
    },
    () => {
      const a = rint(1, 6) * 10;
      const b = rint(1, 9 - a / 10) * 10;
      return { unit: '二位數的加法', text: `${a} ＋ ${b} ＝ ？`, inputs: [{ answer: a + b }], solution: `${a + b}` };
    },
    () => {
      const a = rint(3, 9) * 10 + rint(3, 9);
      const b = rint(1, Math.floor(a / 10) - 1) * 10 + rint(0, a % 10);
      return { unit: '二位數的減法', text: `${a} － ${b} ＝ ？`, inputs: [{ answer: a - b }], solution: `${a - b}` };
    },
    () => {
      const tens = rint(1, 6);
      const ones = rint(1, 9);
      return { unit: '認識錢幣', text: `${tens} 個 10 元和 ${ones} 個 1 元，一共是幾元？`, inputs: [{ answer: tens * 10 + ones, suffix: '元' }], solution: `${tens * 10 + ones} 元` };
    },
    () => {
      const fifties = rint(0, 1);
      const fives = rint(1, 5);
      const ones = rint(0, 4);
      const total = fifties * 50 + fives * 5 + ones;
      const parts = [fifties ? `${fifties} 個 50 元` : '', `${fives} 個 5 元`, ones ? `${ones} 個 1 元` : ''].filter(Boolean);
      return { unit: '認識錢幣', text: `${parts.join('、')}，一共是幾元？`, inputs: [{ answer: total, suffix: '元' }], solution: `${total} 元` };
    },
    () => {
      const h = rint(1, 11);
      return {
        unit: '認識時間',
        text: `現在是 ${h} 點，再過半小時是幾點幾分？`,
        inputs: [{ answer: h, suffix: '點' }, { answer: 30, suffix: '分' }],
        solution: `${h} 點 30 分`,
      };
    },
    () => {
      const step = pick([2, 5, 10]);
      const start = step * rint(1, 5);
      const seq = [0, 1, 2, 3].map((i) => start + step * i);
      const answer = start + step * 4;
      return { unit: '數數', text: `${seq.join('、')}、？　接下來是多少？`, inputs: [{ answer }], solution: `${answer}` };
    },
    () => {
      const have = rint(11, 18);
      const eat = rint(have - 9, 9);
      return { unit: '加減應用', text: `有 ${have} 顆糖果，分給弟弟 ${eat} 顆，還剩幾顆？`, inputs: [{ answer: have - eat, suffix: '顆' }], solution: `${have - eat} 顆` };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g1b', name: '小一(下)', short: '小一下', topics });
})();
