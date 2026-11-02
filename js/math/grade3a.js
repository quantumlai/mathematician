// 小三(上) 數學題庫。每個 topics 裡的函式會隨機產生一題，一次練習從不同單元抽題。
//
// 新增年級：複製這個檔案改內容，在 index.html 加一行 <script>，登入畫面就會出現新的年級選項。
//   id     ：英文代號（存在玩家資料裡，加入後不要改）
//   name   ：顯示名稱
//   short  ：簡短名稱，顯示在左上角的博物館名稱後面
//   topics ：出題函式，回傳 {
//     unit     ：單元名稱
//     text     ：題目。[[3/8]] 會顯示成分數（8 分之 3）
//     inputs   ：要填的空格 [{ prefix, suffix, answer }]；layout: 'fraction' 時是 [分子, 分母]
//     choices  ：（選擇題）選項文字；answer 是正確的那一個
//     solution ：答錯時顯示的正確答案
//   }
(() => {
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (list) => list[rint(0, list.length - 1)];

  const topics = [
    // ── 10000 以內的數 ──
    () => {
      const n = rint(1000, 9999);
      const [name, v] = pick([['千', 1000], ['百', 100], ['十', 10], ['個', 1]]);
      const d = Math.floor(n / v) % 10;
      return {
        unit: '10000 以內的數',
        text: `${n} 的${name}位數字是多少？`,
        inputs: [{ answer: d }],
        solution: `${d}`,
      };
    },
    () => {
      const [a, b, c, d] = [rint(1, 9), rint(0, 9), rint(0, 9), rint(0, 9)];
      const n = a * 1000 + b * 100 + c * 10 + d;
      return {
        unit: '10000 以內的數',
        text: `${a} 個千、${b} 個百、${c} 個十和 ${d} 個一，合起來是多少？`,
        inputs: [{ answer: n }],
        solution: `${n}`,
      };
    },

    // ── 四位數的加減 ──
    () => {
      const a = rint(1000, 6999);
      const b = rint(100, 9999 - a);
      return { unit: '加法', text: `${a} ＋ ${b} ＝ ？`, inputs: [{ answer: a + b }], solution: `${a + b}` };
    },
    () => {
      const a = rint(2000, 9999);
      const b = rint(500, a - 100);
      return { unit: '減法', text: `${a} － ${b} ＝ ？`, inputs: [{ answer: a - b }], solution: `${a - b}` };
    },
    () => {
      const price = rint(12, 45);
      const k = rint(2, 4);
      const money = Math.ceil((price * k + 1) / 100) * 100;
      const left = money - price * k;
      return {
        unit: '兩步驟問題',
        text: `小美帶了 ${money} 元，買了 ${k} 枝筆，每枝 ${price} 元，還剩下多少元？`,
        inputs: [{ answer: left, suffix: '元' }],
        solution: `${left} 元`,
      };
    },

    // ── 乘法 ──
    () => {
      const b = rint(2, 9);
      const a = Math.random() < 0.5 ? rint(12, 99) : rint(102, 999);
      return { unit: '乘法', text: `${a} × ${b} ＝ ？`, inputs: [{ answer: a * b }], solution: `${a * b}` };
    },
    () => {
      const [what, unit, box] = pick([
        ['顆蛋', '顆', '盒'], ['枝鉛筆', '枝', '盒'], ['張貼紙', '張', '包'], ['顆蘋果', '顆', '箱'],
      ]);
      const a = rint(6, 48);
      const b = rint(3, 9);
      return {
        unit: '乘法',
        text: `每${box}有 ${a} ${what}，${b} ${box}一共有幾${unit}？`,
        inputs: [{ answer: a * b, suffix: unit }],
        solution: `${a * b} ${unit}`,
      };
    },

    // ── 除法 ──
    () => {
      const b = rint(2, 9);
      const q = rint(2, 9);
      return { unit: '除法', text: `${b * q} ÷ ${b} ＝ ？`, inputs: [{ answer: q }], solution: `${q}` };
    },
    () => {
      const b = rint(3, 9);
      const q = rint(3, 9);
      const r = rint(1, b - 1);
      return {
        unit: '除法',
        text: `${b * q + r} ÷ ${b} ＝ ？`,
        inputs: [{ answer: q }, { prefix: '餘', answer: r }],
        solution: `${q} 餘 ${r}`,
      };
    },
    () => {
      const b = rint(3, 9);
      const q = rint(3, 9);
      const [what, unit] = pick([['張貼紙', '張'], ['顆糖果', '顆'], ['本故事書', '本']]);
      return {
        unit: '除法',
        text: `有 ${b * q} ${what}，平分給 ${b} 個小朋友，每人可以分到幾${unit}？`,
        inputs: [{ answer: q, suffix: unit }],
        solution: `${q} ${unit}`,
      };
    },
    () => {
      const b = rint(4, 9);
      const q = rint(3, 9);
      const r = rint(1, b - 1);
      return {
        unit: '除法',
        text: `有 ${b * q + r} 顆餅乾，每 ${b} 顆裝成一袋，可以裝成幾袋？還剩下幾顆？`,
        inputs: [{ answer: q, suffix: '袋' }, { prefix: '剩', answer: r, suffix: '顆' }],
        solution: `${q} 袋，剩 ${r} 顆`,
      };
    },

    // ── 公分與毫米 ──
    () => {
      const cm = rint(1, 15);
      const mm = rint(1, 9);
      return {
        unit: '公分與毫米',
        text: `${cm} 公分 ${mm} 毫米 ＝ ？ 毫米`,
        inputs: [{ answer: cm * 10 + mm, suffix: '毫米' }],
        solution: `${cm * 10 + mm} 毫米`,
      };
    },
    () => {
      const cm = rint(1, 15);
      const mm = rint(1, 9);
      return {
        unit: '公分與毫米',
        text: `${cm * 10 + mm} 毫米 ＝ ？ 公分 ？ 毫米`,
        inputs: [{ answer: cm, suffix: '公分' }, { answer: mm, suffix: '毫米' }],
        solution: `${cm} 公分 ${mm} 毫米`,
      };
    },

    // ── 時間 ──
    () => {
      const h = rint(1, 3);
      const m = rint(1, 11) * 5;
      return {
        unit: '時間',
        text: `${h} 時 ${m} 分 ＝ ？ 分`,
        inputs: [{ answer: h * 60 + m, suffix: '分' }],
        solution: `${h * 60 + m} 分`,
      };
    },
    () => {
      const m = rint(1, 4);
      const s = rint(1, 59);
      return {
        unit: '時間',
        text: `${m * 60 + s} 秒 ＝ ？ 分 ？ 秒`,
        inputs: [{ answer: m, suffix: '分' }, { answer: s, suffix: '秒' }],
        solution: `${m} 分 ${s} 秒`,
      };
    },
    () => {
      const h = rint(8, 10);
      const m = rint(6, 11) * 5;
      const d = rint(3, 10) * 5;
      const end = h * 60 + m + d;
      const fmt = (t) => `${Math.floor(t / 60)} 時 ${t % 60} 分`;
      return {
        unit: '時間',
        text: `從上午 ${fmt(h * 60 + m)} 到上午 ${fmt(end)}，經過了幾分鐘？`,
        inputs: [{ answer: d, suffix: '分鐘' }],
        solution: `${d} 分鐘`,
      };
    },

    // ── 分數 ──
    () => {
      const d = rint(3, 10);
      const n = rint(1, d - 1);
      const [thing, piece, verb] = pick([['披薩', '片', '吃掉'], ['蛋糕', '塊', '吃掉'], ['巧克力', '格', '吃掉'], ['彩色紙', '張', '用掉']]);
      return {
        unit: '分數',
        text: `把一個${thing}平分成 ${d} ${piece}，${verb} ${n} ${piece}，${verb}的是幾分之幾個${thing}？`,
        layout: 'fraction',
        inputs: [{ answer: n }, { answer: d }],
        solution: `[[${n}/${d}]]`,
      };
    },
    () => {
      let a;
      let b;
      let answer;
      if (Math.random() < 0.5) {
        // 單位分數：分母越大，一份越小
        a = rint(2, 9);
        do b = rint(2, 9); while (b === a);
        answer = a < b ? '>' : '<';
        [a, b] = [`1/${a}`, `1/${b}`];
      } else {
        // 同分母：分子越大越大
        const d = rint(4, 10);
        const n1 = rint(1, d - 1);
        let n2;
        do n2 = rint(1, d - 1); while (n2 === n1);
        answer = n1 > n2 ? '>' : '<';
        [a, b] = [`${n1}/${d}`, `${n2}/${d}`];
      }
      return {
        unit: '分數',
        text: `比比看，○ 裡應該填哪一個？　[[${a}]] ○ [[${b}]]`,
        choices: ['>', '<', '='],
        answer,
        solution: `[[${a}]] ${answer} [[${b}]]`,
      };
    },
  ];

  window.MATH_GRADES = window.MATH_GRADES || [];
  window.MATH_GRADES.push({ id: 'g3a', name: '小三(上)', short: '小三', topics });
})();
