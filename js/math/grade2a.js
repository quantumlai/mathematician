// 小二(上) 數學題庫：1000 以內的數、二位數的進位加法和退位減法、2/4/5/8 的乘法、公分、時刻、加減應用。
// 題目格式見 js/math/grade3a.js 開頭的說明。
(() => {
  const { rint, pick } = window.MathKit;

  const topics = [
    () => {
      const [a, b, c] = [rint(1, 9), rint(0, 9), rint(0, 9)];
      const n = a * 100 + b * 10 + c;
      return { unit: '1000 以內的數', text: `${a} 個百、${b} 個十和 ${c} 個一，合起來是多少？`, inputs: [{ answer: n }], solution: `${n}` };
    },
    () => {
      const n = rint(100, 999);
      const [name, v] = pick([['百', 100], ['十', 10], ['個', 1]]);
      const d = Math.floor(n / v) % 10;
      return { unit: '1000 以內的數', text: `${n} 的${name}位數字是多少？`, inputs: [{ answer: d }], solution: `${d}` };
    },
    () => {
      const a = rint(100, 999);
      let b = a + pick([-1, 1]) * rint(1, 90);
      if (b < 100 || b > 999) b = a;
      const answer = a > b ? '>' : a < b ? '<' : '=';
      return { unit: '比大小', text: `比比看，○ 裡應該填哪一個？　${a} ○ ${b}`, choices: ['>', '<', '='], answer, solution: `${a} ${answer} ${b}` };
    },
    () => {
      // 個位相加一定會進位
      const a = rint(1, 7) * 10 + rint(1, 9);
      const b = rint(1, Math.floor((99 - a - 9) / 10)) * 10 + rint(10 - (a % 10), 9);
      return { unit: '二位數的加法', text: `${a} ＋ ${b} ＝ ？`, inputs: [{ answer: a + b }], solution: `${a + b}` };
    },
    () => {
      const a = rint(31, 98);
      const ones = a % 10;
      const b = rint(1, Math.floor(a / 10) - 1) * 10 + rint(Math.min(ones + 1, 9), 9);
      return { unit: '二位數的減法', text: `${a} － ${b} ＝ ？`, inputs: [{ answer: a - b }], solution: `${a - b}` };
    },
    () => {
      const a = pick([2, 4, 5, 8]);
      const b = rint(1, 9);
      return { unit: '乘法', text: `${a} × ${b} ＝ ？`, inputs: [{ answer: a * b }], solution: `${a * b}` };
    },
    () => {
      const a = pick([2, 4, 5, 8]);
      const b = rint(2, 9);
      const [what, unit, box] = pick([['個蘋果', '個', '盤'], ['隻腳', '隻', '隻小狗'], ['枝鉛筆', '枝', '盒']]);
      if (box === '隻小狗') {
        return { unit: '乘法', text: `1 隻小狗有 4 隻腳，${b} 隻小狗一共有幾隻腳？`, inputs: [{ answer: 4 * b, suffix: '隻' }], solution: `${4 * b} 隻` };
      }
      return { unit: '乘法', text: `每${box}有 ${a} ${what}，${b} ${box}一共有幾${unit}？`, inputs: [{ answer: a * b, suffix: unit }], solution: `${a * b} ${unit}` };
    },
    () => {
      const a = rint(5, 18);
      const b = rint(3, 15);
      return { unit: '長度', text: `紅色緞帶長 ${a} 公分，藍色緞帶長 ${b} 公分，兩條接起來一共幾公分？`, inputs: [{ answer: a + b, suffix: '公分' }], solution: `${a + b} 公分` };
    },
    () => {
      const a = rint(12, 30);
      const b = rint(3, a - 2);
      return { unit: '長度', text: `一枝鉛筆原本長 ${a} 公分，用掉 ${b} 公分後，還剩幾公分？`, inputs: [{ answer: a - b, suffix: '公分' }], solution: `${a - b} 公分` };
    },
    () => {
      const h = rint(1, 10);
      const m1 = rint(0, 5) * 5;
      const d = rint(2, (55 - m1) / 5) * 5; // 不會超過 59 分
      return { unit: '時間', text: `從 ${h} 點 ${m1} 分到 ${h} 點 ${m1 + d} 分，經過了幾分鐘？`, inputs: [{ answer: d, suffix: '分鐘' }], solution: `${d} 分鐘` };
    },
    () => {
      const a = rint(20, 60);
      const b = rint(10, 30);
      const c = rint(5, a + b - 5);
      return { unit: '連加連減', text: `${a} ＋ ${b} － ${c} ＝ ？`, inputs: [{ answer: a + b - c }], solution: `${a + b - c}` };
    },
    () => {
      const have = rint(40, 95);
      const out = rint(12, have - 10);
      return { unit: '加減應用', text: `書架上有 ${have} 本書，借走 ${out} 本，還剩幾本？`, inputs: [{ answer: have - out, suffix: '本' }], solution: `${have - out} 本` };
    },
    () => {
      const start = rint(1, 8) * 100;
      const seq = [0, 1, 2].map((i) => start + 10 * i);
      return { unit: '數數', text: `10 個 10 個數：${seq.join('、')}、？　接下來是多少？`, inputs: [{ answer: start + 30 }], solution: `${start + 30}` };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g2a', name: '小二(上)', short: '小二上', topics });
})();
