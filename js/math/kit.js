// 數學題庫共用的小工具，每個年級的題庫檔（js/math/grade*.js）都會用到。
window.MathKit = (() => {
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (list) => list[rint(0, list.length - 1)];
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (a, b) => (a / gcd(a, b)) * b;

  // 小數轉成字串，去掉多餘的 0 和浮點誤差，例如 0.1 + 0.2 → "0.3"
  const dec = (x) => String(Number(x.toFixed(6)));
  // 把浮點誤差去掉，用在答案（例如 1.1 * 3 → 3.3）
  const clean = (x) => Number(x.toFixed(6));

  // 題目裡的分數：[[3/8]] 會顯示成上下排的分數；帶分數寫成 2[[1/3]]
  const frac = (n, d) => `[[${n}/${d}]]`;
  const mixed = (w, n, d) => `${w}[[${n}/${d}]]`;

  // 分母是 d 的最簡真分數的分子（1 ～ d-1，和 d 互質），題目裡才不會出現 2/4 這種還沒約分的分數
  const numer = (d) => {
    let n;
    do n = rint(1, d - 1); while (gcd(n, d) !== 1);
    return n;
  };

  // 約分成最簡分數 [分子, 分母]
  const simplify = (n, d) => {
    const g = gcd(n, d);
    return [n / g, d / g];
  };

  // 分數答案：算出來是整數就填一格，不然填分數（等值分數也算對）
  const fracAnswer = (n, d) => {
    const [a, b] = simplify(n, d);
    if (b === 1) return { inputs: [{ answer: a }], solution: `${a}` };
    return { layout: 'fraction', inputs: [{ answer: a }, { answer: b }], solution: frac(a, b) };
  };

  return { rint, pick, gcd, lcm, dec, clean, frac, mixed, numer, simplify, fracAnswer };
})();
