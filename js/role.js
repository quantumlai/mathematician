// SVG 美術：主角、邪惡博士、可選擇的角色、化石骨架、場景

const SKIN = '#f6d2b0';
const SKIN_LINE = '#c98f6b';
const INK = '#2a2220';

/* ---------- 角色共用 ---------- */

function limb(s, e, h, sleeve, sleeveWidth = 18) {
  const mid = [s[0] + (e[0] - s[0]) * 0.5, s[1] + (e[1] - s[1]) * 0.5];
  return `
    <path d="M${s} L${e} L${h}" fill="none" stroke="${SKIN}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${s} L${mid}" fill="none" stroke="${sleeve}" stroke-width="${sleeveWidth}" stroke-linecap="round"/>
    <circle cx="${h[0]}" cy="${h[1]}" r="8.5" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>`;
}

/* ---------- 主角：小小古生物學家 ---------- */

function boySVG(mood = 'normal') {
  const TEE = '#56723f', VEST = '#cfbd93', VEST_DARK = '#a8946a';
  const arms = {
    normal: [[[62, 160], [50, 196], [52, 228]], [[138, 160], [150, 196], [148, 228]]],
    happy: [[[62, 160], [38, 130], [28, 94]], [[138, 160], [162, 130], [172, 94]]],
    cry: [[[62, 160], [48, 140], [78, 114]], [[138, 160], [152, 140], [122, 114]]],
    dig: [[[62, 160], [50, 196], [52, 228]], null],
    think: [[[62, 160], [50, 196], [52, 228]], [[138, 160], [152, 190], [114, 146]]],
  }[mood];

  const eyes = {
    normal: `<ellipse cx="82" cy="108" rx="5" ry="6.5" fill="${INK}"/><ellipse cx="118" cy="108" rx="5" ry="6.5" fill="${INK}"/>
             <circle cx="84" cy="105" r="1.8" fill="#fff"/><circle cx="120" cy="105" r="1.8" fill="#fff"/>`,
    happy: `<path d="M75 111 Q82 100 89 111" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M111 111 Q118 100 125 111" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
    cry: `<path d="M75 103 L88 109 L75 114" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M125 103 L112 109 L125 114" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    think: `<ellipse cx="84" cy="105" rx="5" ry="6.5" fill="${INK}"/><ellipse cx="120" cy="105" rx="5" ry="6.5" fill="${INK}"/>
            <circle cx="86" cy="102" r="1.8" fill="#fff"/><circle cx="122" cy="102" r="1.8" fill="#fff"/>`,
  };
  eyes.dig = eyes.normal;

  const brows = mood === 'cry'
    ? `<path d="M72 96 L88 92" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M128 96 L112 92" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    : `<path d="M74 95 Q82 91 90 95" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/><path d="M110 95 Q118 91 126 95" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;

  const mouth = {
    normal: `<path d="M90 128 Q100 137 110 128" fill="none" stroke="#7a3a2a" stroke-width="3" stroke-linecap="round"/>`,
    dig: `<path d="M92 128 Q100 133 108 128" fill="none" stroke="#7a3a2a" stroke-width="3" stroke-linecap="round"/>`,
    happy: `<path d="M84 123 Q100 150 116 123 Z" fill="#7a2a2a"/><path d="M90 136 Q100 146 110 136 Q100 140 90 136Z" fill="#e8777a"/><path d="M86 124 L114 124" stroke="#fff" stroke-width="3"/>`,
    cry: `<path d="M86 138 Q100 120 114 138 Q100 146 86 138 Z" fill="#7a2a2a"/><path d="M92 140 Q100 136 108 140 Q100 144 92 140Z" fill="#e8777a"/>`,
    think: `<path d="M94 131 Q100 128 106 131" fill="none" stroke="#7a3a2a" stroke-width="3" stroke-linecap="round"/>`,
  }[mood];

  const tears = mood === 'cry' ? `
    <path class="tear-stream" d="M80 114 Q76 130 72 150" fill="none" stroke="#7cc7ff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
    <path class="tear-stream" d="M120 114 Q124 130 128 150" fill="none" stroke="#7cc7ff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
    <circle class="tear-drop" cx="72" cy="150" r="4.5" fill="#7cc7ff"/>
    <circle class="tear-drop d2" cx="128" cy="150" r="4.5" fill="#7cc7ff"/>` : '';

  const sweat = mood === 'think' ? `<path d="M150 70 q5 9 0 12 q-5 -3 0 -12z" fill="#9bd4ff"/>` : '';

  const digArm = mood === 'dig' ? `
    <g class="dig-arm">
      ${limb([138, 160], [160, 188], [176, 204], TEE)}
      <path d="M172 198 L204 230" stroke="#b07a42" stroke-width="6" stroke-linecap="round"/>
      <path d="M200 224 L214 238 L206 246 L192 232 Z" fill="#e9d27f" stroke="#8a6a2a" stroke-width="1.5"/>
      <circle cx="176" cy="204" r="8.5" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    </g>` : '';

  const armsSVG = arms.filter(Boolean).map(a => limb(a[0], a[1], a[2], TEE)).join('');
  const armsFront = mood === 'cry' || mood === 'think';

  return `
  <svg class="char boy mood-${mood}" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" aria-label="小小古生物學家">
    <ellipse cx="100" cy="312" rx="58" ry="7" fill="rgba(0,0,0,.18)"/>
    <!-- 腿與靴子 -->
    <rect x="74" y="232" width="22" height="64" rx="8" fill="#8a6a45"/>
    <rect x="104" y="232" width="22" height="64" rx="8" fill="#8a6a45"/>
    <path d="M70 290 h30 v16 h-36 q0 -10 6 -16z" fill="#5b3a1e"/>
    <path d="M100 290 h30 q6 6 6 16 h-36 z" fill="#5b3a1e"/>
    <!-- 綠色 T 恤 -->
    <path d="M60 172 Q60 150 82 146 L118 146 Q140 150 140 172 L142 242 L58 242 Z" fill="${TEE}"/>
    <!-- 卡其背心 -->
    <path d="M60 170 Q60 150 82 146 L91 146 L94 242 L58 242 Z" fill="${VEST}" stroke="${VEST_DARK}" stroke-width="2"/>
    <path d="M140 170 Q140 150 118 146 L109 146 L106 242 L142 242 Z" fill="${VEST}" stroke="${VEST_DARK}" stroke-width="2"/>
    <rect x="64" y="208" width="22" height="20" rx="3" fill="${VEST_DARK}" opacity=".55"/>
    <rect x="114" y="196" width="24" height="16" rx="2" fill="#f4ecd6" stroke="${VEST_DARK}"/>
    <path d="M118 207 q3 -6 7 -4 l3 -3 q4 0 4 3 l-3 1 l1 4 l-2 0 l-1 -3 l-4 1 l-1 2 z" fill="${INK}"/>
    <rect x="114" y="214" width="24" height="18" rx="3" fill="${VEST_DARK}" opacity=".55"/>
    <!-- 望遠鏡 -->
    <path d="M84 148 L92 196 M116 148 L108 196" stroke="${INK}" stroke-width="2.5"/>
    <rect x="86" y="192" width="12" height="20" rx="4" fill="#2b2b2b"/>
    <rect x="102" y="192" width="12" height="20" rx="4" fill="#2b2b2b"/>
    <rect x="96" y="197" width="8" height="6" fill="#444"/>
    ${armsFront ? '' : armsSVG}
    <!-- 頭 -->
    <circle cx="54" cy="108" r="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    <circle cx="146" cy="108" r="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    <circle cx="100" cy="102" r="47" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    <!-- 黑色瀏海 -->
    <path d="M54 74 Q54 102 58 114 L64 88 Q72 96 80 86 Q90 96 100 86 Q110 96 120 86 Q128 96 136 88 L142 114 Q146 102 146 74 Z" fill="#1c1b1f"/>
    <!-- 漁夫帽 -->
    <path d="M60 72 Q60 30 100 28 Q140 30 140 72 Z" fill="#dccaa0" stroke="#a8946a" stroke-width="2"/>
    <path d="M62 62 Q100 56 138 62 L139 70 Q100 64 61 70 Z" fill="#c4b083"/>
    <ellipse cx="100" cy="72" rx="64" ry="12" fill="#cfbb8e" stroke="#a8946a" stroke-width="2"/>
    <rect x="80" y="36" width="40" height="20" rx="3" fill="#f4ecd6" stroke="#6b5a3a" stroke-width="1.5"/>
    <path d="M86 47 q4 -7 9 -5 l4 -4 q5 0 5 4 l-4 1 l1 5 l-2 0 l-1 -4 l-5 1 l-2 3 z" fill="${INK}"/>
    <text x="110" y="50" font-size="5.5" font-weight="700" text-anchor="middle" fill="${INK}" font-family="sans-serif">DINO</text>
    ${brows}
    ${eyes[mood]}
    <ellipse cx="70" cy="122" rx="8" ry="5" fill="#f29a9a" opacity=".5"/>
    <ellipse cx="130" cy="122" rx="8" ry="5" fill="#f29a9a" opacity=".5"/>
    <path d="M98 114 Q100 118 102 114" fill="none" stroke="${SKIN_LINE}" stroke-width="2" stroke-linecap="round"/>
    ${mouth}
    ${tears}
    ${sweat}
    ${armsFront ? armsSVG : ''}
    ${digArm}
  </svg>`;
}

/* ---------- 邪惡博士 ---------- */

let doctorCount = 0;
function doctorSVG(mood = 'evil') {
  const sid = `drStripe-${++doctorCount}`;
  const arms = {
    evil: [[[58, 160], [34, 130], [28, 96]], [[142, 160], [166, 130], [172, 96]]],
    grab: [[[58, 160], [46, 196], [76, 206]], [[142, 160], [154, 196], [124, 206]]],
    normal: [[[58, 160], [46, 198], [48, 230]], [[142, 160], [154, 198], [152, 230]]],
  }[mood];
  const armsSVG = arms.map(a => `
    <path d="M${a[0]} L${a[1]} L${a[2]}" fill="none" stroke="url(#${sid})" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${a[0]} L${[a[0][0] + (a[1][0] - a[0][0]) * 0.45, a[0][1] + (a[1][1] - a[0][1]) * 0.45]}" stroke="#141416" stroke-width="20" stroke-linecap="round"/>
    <circle cx="${a[2][0]}" cy="${a[2][1]}" r="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    ${mood === 'evil' ? `<path d="M${a[2][0] - 7} ${a[2][1] - 6} l-3 -8 M${a[2][0]} ${a[2][1] - 9} l0 -8 M${a[2][0] + 7} ${a[2][1] - 6} l3 -8" stroke="${SKIN_LINE}" stroke-width="3" stroke-linecap="round"/>` : ''}`).join('');

  const mouth = mood === 'normal'
    ? `<path d="M84 128 Q102 136 120 124" fill="none" stroke="#6b2a22" stroke-width="3" stroke-linecap="round"/>`
    : `<path d="M80 122 Q102 148 124 118 Q102 128 80 122 Z" fill="#5a1414"/>
       <path d="M83 123 Q102 130 121 120 L120 125 Q102 133 84 127 Z" fill="#fffbe8"/>`;

  return `
  <svg class="char doctor mood-${mood}" viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg" aria-label="邪惡博士">
    <defs>
      <pattern id="${sid}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
        <rect width="9" height="9" fill="#1a1a1c"/><rect width="4.5" height="9" fill="#c0272d"/>
      </pattern>
    </defs>
    <ellipse cx="100" cy="312" rx="60" ry="7" fill="rgba(0,0,0,.2)"/>
    <rect x="74" y="236" width="22" height="62" rx="7" fill="#2b2b33"/>
    <rect x="104" y="236" width="22" height="62" rx="7" fill="#2b2b33"/>
    <path d="M68 292 h30 v14 h-36 q0 -8 6 -14z" fill="#111"/>
    <path d="M102 292 h30 q6 6 6 14 h-36 z" fill="#111"/>
    <!-- 實驗袍 -->
    <path d="M52 166 Q54 148 80 144 L120 144 Q146 148 148 166 L160 268 L40 268 Z" fill="#f5f5f2" stroke="#c9c9c4" stroke-width="2"/>
    <!-- 黑 T 恤 -->
    <path d="M82 144 L118 144 L120 268 L80 268 Z" fill="#141416"/>
    <path d="M86 144 Q100 156 114 144" fill="none" stroke="#2c2c30" stroke-width="3"/>
    <path d="M80 144 L70 190 L82 196 M120 144 L130 190 L118 196" fill="none" stroke="#c9c9c4" stroke-width="2"/>
    <rect x="128" y="200" width="18" height="10" rx="2" fill="#c0272d"/>
    <text x="137" y="208" font-size="7" font-weight="800" text-anchor="middle" fill="#fff" font-family="sans-serif">Dr.</text>
    <rect x="58" y="222" width="22" height="18" rx="2" fill="none" stroke="#c9c9c4" stroke-width="2"/>
    ${armsSVG}
    <!-- 頭 -->
    <circle cx="56" cy="106" r="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    <circle cx="144" cy="106" r="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    <path d="M56 96 Q56 58 100 56 Q144 58 144 96 L142 122 Q136 146 100 148 Q64 146 58 122 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    <!-- 波浪頭髮＋紅色挑染 -->
    <path d="M52 100 Q40 56 78 40 Q104 26 134 38 Q162 52 150 98 Q144 78 132 72 Q118 82 100 70 Q84 80 72 74 Q62 84 60 104 Z" fill="#2a1914"/>
    <path d="M60 86 Q58 54 86 42 Q76 58 72 78 Z" fill="#b8262c" opacity=".9"/>
    <path d="M90 40 Q104 34 112 38 Q100 46 96 62 Q90 54 90 40 Z" fill="#b8262c" opacity=".8"/>
    <path d="M118 44 Q132 40 140 52" fill="none" stroke="#4a2a22" stroke-width="3" stroke-linecap="round"/>
    <!-- 壞壞的眉毛和斜眼 -->
    <path d="M70 90 L92 98" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M130 90 L108 98" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="84" cy="106" rx="9" ry="5.5" fill="#fff"/><ellipse cx="116" cy="106" rx="9" ry="5.5" fill="#fff"/>
    <circle cx="79" cy="106" r="4" fill="${INK}"/><circle cx="111" cy="106" r="4" fill="${INK}"/>
    <path d="M100 108 Q96 116 100 118" fill="none" stroke="${SKIN_LINE}" stroke-width="2" stroke-linecap="round"/>
    ${mouth}
    ${mood === 'evil' ? `<text class="haha" x="166" y="60" font-size="18" font-weight="900" fill="#c0272d" font-family="sans-serif">哈!</text>` : ''}
  </svg>`;
}

/* ---------- 可選擇的角色 ---------- */
// 和主角一樣畫在 220×320 的畫布上、身體中心在 x=100，表情有 normal 和 happy（其他表情用 normal）。

// 共用的眼睛、嘴巴、腮紅、手臂
function charEyes(mood, lx, rx, y, color = INK) {
  if (mood === 'happy') {
    return `<path d="M${lx - 7} ${y + 3} Q${lx} ${y - 8} ${lx + 7} ${y + 3}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M${rx - 7} ${y + 3} Q${rx} ${y - 8} ${rx + 7} ${y + 3}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`;
  }
  return `<ellipse cx="${lx}" cy="${y}" rx="5" ry="6.5" fill="${color}"/><ellipse cx="${rx}" cy="${y}" rx="5" ry="6.5" fill="${color}"/>
          <circle cx="${lx + 2}" cy="${y - 3}" r="1.8" fill="#fff"/><circle cx="${rx + 2}" cy="${y - 3}" r="1.8" fill="#fff"/>`;
}

function charMouth(mood, cx, y, line = '#7a3a2a') {
  if (mood === 'happy') {
    return `<path d="M${cx - 15} ${y - 4} Q${cx} ${y + 22} ${cx + 15} ${y - 4} Z" fill="#7a2a2a"/>
            <path d="M${cx - 9} ${y + 8} Q${cx} ${y + 17} ${cx + 9} ${y + 8} Q${cx} ${y + 12} ${cx - 9} ${y + 8} Z" fill="#e8777a"/>`;
  }
  return `<path d="M${cx - 10} ${y} Q${cx} ${y + 9} ${cx + 10} ${y}" fill="none" stroke="${line}" stroke-width="3" stroke-linecap="round"/>`;
}

function charCheeks(lx, rx, y) {
  return `<ellipse cx="${lx}" cy="${y}" rx="8" ry="5" fill="#f29a9a" opacity=".5"/>
          <ellipse cx="${rx}" cy="${y}" rx="8" ry="5" fill="#f29a9a" opacity=".5"/>`;
}

// 動物和機器人的手臂：一條粗線加上圓圓的手掌
function pawArm([s, e, h], color, paw, line, width = 14) {
  return `
    <path d="M${s} L${e} L${h}" fill="none" stroke="${line}" stroke-width="${width + 4}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${s} L${e} L${h}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${h[0]}" cy="${h[1]}" r="9.5" fill="${paw}" stroke="${line}" stroke-width="2"/>`;
}

// 手臂姿勢：normal 自然垂下，happy 雙手舉高
function charArms(mood, shoulderY = 160, spread = 34) {
  const l = 100 - spread;
  const r = 100 + spread;
  return mood === 'happy'
    ? [[[l, shoulderY], [l - 24, shoulderY - 30], [l - 34, shoulderY - 64]], [[r, shoulderY], [r + 24, shoulderY - 30], [r + 34, shoulderY - 64]]]
    : [[[l, shoulderY], [l - 12, shoulderY + 36], [l - 10, shoulderY + 66]], [[r, shoulderY], [r + 12, shoulderY + 36], [r + 10, shoulderY + 66]]];
}

const CHAR_SHADOW = `<ellipse cx="100" cy="312" rx="58" ry="7" fill="rgba(0,0,0,.18)"/>`;

function girlSVG(mood = 'normal') {
  const DRESS = '#f08fb0', DRESS_DARK = '#d86d92', HAIR = '#5a3420';
  const armsSVG = charArms(mood, 160, 32).map(a => limb(a[0], a[1], a[2], DRESS)).join('');
  return `
  <svg class="char girl mood-${mood}" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" aria-label="可愛小女生">
    ${CHAR_SHADOW}
    <!-- 腿、白襪、紅鞋 -->
    <rect x="80" y="244" width="15" height="54" rx="7" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    <rect x="105" y="244" width="15" height="54" rx="7" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    <rect x="79" y="276" width="17" height="20" rx="4" fill="#fff"/>
    <rect x="104" y="276" width="17" height="20" rx="4" fill="#fff"/>
    <path d="M72 296 h26 v10 h-30 q0 -6 4 -10z" fill="#d23c3c"/>
    <path d="M102 296 h26 q4 4 4 10 h-30 z" fill="#d23c3c"/>
    <!-- 綁在後面的長髮 -->
    <path d="M48 104 Q42 56 100 50 Q158 56 152 104 L150 160 Q100 172 50 160 Z" fill="${HAIR}"/>
    <!-- 洋裝 -->
    <path d="M70 150 Q100 140 130 150 L152 252 Q100 262 48 252 Z" fill="${DRESS}" stroke="${DRESS_DARK}" stroke-width="2"/>
    <path d="M56 236 Q100 246 144 236" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/>
    <path d="M82 146 Q92 162 100 150 Q108 162 118 146" fill="#fff" stroke="${DRESS_DARK}" stroke-width="1.5"/>
    <circle cx="100" cy="176" r="4" fill="#fff"/><circle cx="100" cy="194" r="4" fill="#fff"/>
    ${armsSVG}
    <!-- 雙馬尾 -->
    <ellipse cx="44" cy="128" rx="17" ry="26" fill="${HAIR}" transform="rotate(20 44 128)"/>
    <ellipse cx="156" cy="128" rx="17" ry="26" fill="${HAIR}" transform="rotate(-20 156 128)"/>
    <!-- 頭 -->
    <circle cx="100" cy="102" r="47" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>
    <!-- 瀏海 -->
    <path d="M52 104 Q46 52 100 50 Q154 52 148 104 Q142 82 126 74 Q118 90 100 80 Q84 92 74 76 Q58 84 52 104 Z" fill="${HAIR}"/>
    <!-- 蝴蝶結 -->
    <path d="M50 96 L36 84 L38 108 Z M50 96 L64 84 L62 108 Z" fill="#e8455f"/>
    <circle cx="50" cy="96" r="5" fill="#c92f48"/>
    <path d="M150 96 L136 84 L138 108 Z M150 96 L164 84 L162 108 Z" fill="#e8455f"/>
    <circle cx="150" cy="96" r="5" fill="#c92f48"/>
    <!-- 星星髮夾 -->
    <path d="M122 66 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" fill="#f2c94c" stroke="#c99a1f" stroke-width="1"/>
    <path d="M74 95 Q82 91 90 95" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M110 95 Q118 91 126 95" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
    ${charEyes(mood, 82, 118, 108)}
    ${mood === 'happy' ? '' : `<path d="M77 104 l-5 -3 M123 104 l5 -3" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`}
    ${charCheeks(70, 130, 122)}
    <path d="M98 114 Q100 118 102 114" fill="none" stroke="${SKIN_LINE}" stroke-width="2" stroke-linecap="round"/>
    ${charMouth(mood, 100, 127)}
  </svg>`;
}

function monkeySVG(mood = 'normal') {
  const FUR = '#8b5a2b', LINE = '#5e3a18', FACE = '#f1d3a8';
  const armsSVG = charArms(mood, 172, 30).map(a => pawArm(a, FUR, FACE, LINE)).join('');
  return `
  <svg class="char monkey mood-${mood}" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" aria-label="猴子">
    ${CHAR_SHADOW}
    <!-- 捲捲的尾巴 -->
    <path d="M128 250 C176 262 200 224 184 196 C172 176 150 188 162 204" fill="none" stroke="${LINE}" stroke-width="13" stroke-linecap="round"/>
    <path d="M128 250 C176 262 200 224 184 196 C172 176 150 188 162 204" fill="none" stroke="${FUR}" stroke-width="9" stroke-linecap="round"/>
    <!-- 腳 -->
    <ellipse cx="80" cy="290" rx="17" ry="22" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="120" cy="290" rx="17" ry="22" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="76" cy="305" rx="16" ry="7" fill="${FACE}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="124" cy="305" rx="16" ry="7" fill="${FACE}" stroke="${LINE}" stroke-width="2"/>
    <!-- 身體 -->
    <ellipse cx="100" cy="218" rx="44" ry="58" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="100" cy="226" rx="28" ry="40" fill="${FACE}"/>
    ${armsSVG}
    <!-- 耳朵 -->
    <circle cx="48" cy="106" r="20" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <circle cx="48" cy="106" r="11" fill="${FACE}"/>
    <circle cx="152" cy="106" r="20" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <circle cx="152" cy="106" r="11" fill="${FACE}"/>
    <!-- 頭 -->
    <circle cx="100" cy="104" r="48" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <path d="M100 86 Q88 70 76 74 Q58 80 62 104 Q60 124 74 136 Q86 148 100 148 Q114 148 126 136 Q140 124 138 104 Q142 80 124 74 Q112 70 100 86 Z" fill="${FACE}"/>
    <path d="M86 62 Q94 52 100 62 Q106 52 114 62" fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
    ${charEyes(mood, 84, 116, 102)}
    <ellipse cx="96" cy="118" rx="2.5" ry="2" fill="${LINE}"/><ellipse cx="104" cy="118" rx="2.5" ry="2" fill="${LINE}"/>
    ${charCheeks(72, 128, 122)}
    ${charMouth(mood, 100, 128)}
  </svg>`;
}

function rabbitSVG(mood = 'normal') {
  const FUR = '#f7f3ee', LINE = '#b8ada0', PINK = '#f5b3c0';
  const armsSVG = charArms(mood, 184, 28).map(a => pawArm(a, FUR, FUR, LINE, 13)).join('');
  const earTilt = mood === 'happy' ? 6 : 0;
  return `
  <svg class="char rabbit mood-${mood}" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" aria-label="兔子">
    ${CHAR_SHADOW}
    <!-- 長耳朵 -->
    <g transform="rotate(${-12 - earTilt} 78 80)">
      <ellipse cx="78" cy="50" rx="17" ry="42" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
      <ellipse cx="78" cy="54" rx="8" ry="31" fill="${PINK}"/>
    </g>
    <g transform="rotate(${12 + earTilt} 122 80)">
      <ellipse cx="122" cy="50" rx="17" ry="42" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
      <ellipse cx="122" cy="54" rx="8" ry="31" fill="${PINK}"/>
    </g>
    <!-- 毛球尾巴 -->
    <circle cx="146" cy="262" r="15" fill="#fff" stroke="${LINE}" stroke-width="2"/>
    <!-- 大腳 -->
    <ellipse cx="78" cy="298" rx="24" ry="11" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="122" cy="298" rx="24" ry="11" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <!-- 身體 -->
    <ellipse cx="100" cy="234" rx="44" ry="56" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="100" cy="242" rx="26" ry="36" fill="#fff"/>
    <!-- 紅蘿蔔領結 -->
    <path d="M100 180 L84 172 L84 190 Z M100 180 L116 172 L116 190 Z" fill="#f08a3c"/>
    <circle cx="100" cy="180" r="5" fill="#d9692a"/>
    ${armsSVG}
    <!-- 頭 -->
    <ellipse cx="100" cy="122" rx="50" ry="46" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    ${charEyes(mood, 82, 118, 118)}
    ${charCheeks(68, 132, 134)}
    <path d="M95 128 L105 128 L100 134 Z" fill="${PINK}" stroke="#d98a99" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M100 134 L100 140" stroke="${LINE}" stroke-width="2"/>
    ${mood === 'happy'
      ? charMouth(mood, 100, 142)
      : `<path d="M90 140 Q95 146 100 140 Q105 146 110 140" fill="none" stroke="#7a3a2a" stroke-width="2.5" stroke-linecap="round"/>
         <rect x="95" y="141" width="10" height="9" rx="2" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>`}
    <path d="M66 128 L48 124 M66 134 L48 138 M134 128 L152 124 M134 134 L152 138" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

function lionSVG(mood = 'normal') {
  const FUR = '#eab04e', LINE = '#a8701e', MANE = '#b8602a', MUZZLE = '#fbe6bf';
  let mane = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    mane += `<circle cx="${(100 + Math.cos(a) * 52).toFixed(1)}" cy="${(108 + Math.sin(a) * 52).toFixed(1)}" r="20" fill="${MANE}"/>`;
  }
  const armsSVG = charArms(mood, 178, 30).map(a => pawArm(a, FUR, FUR, LINE, 15)).join('');
  return `
  <svg class="char lion mood-${mood}" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" aria-label="獅子">
    ${CHAR_SHADOW}
    <!-- 尾巴 -->
    <path d="M136 262 Q176 262 182 226" fill="none" stroke="${LINE}" stroke-width="10" stroke-linecap="round"/>
    <path d="M136 262 Q176 262 182 226" fill="none" stroke="${FUR}" stroke-width="6" stroke-linecap="round"/>
    <path d="M182 226 q-12 -10 -4 -24 q4 10 12 6 q4 14 -8 18z" fill="${MANE}"/>
    <!-- 腳 -->
    <rect x="68" y="262" width="26" height="40" rx="12" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <rect x="106" y="262" width="26" height="40" rx="12" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <path d="M74 300 v-6 M81 300 v-6 M88 300 v-6 M112 300 v-6 M119 300 v-6 M126 300 v-6" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
    <!-- 身體 -->
    <ellipse cx="100" cy="222" rx="44" ry="54" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="100" cy="230" rx="26" ry="36" fill="${MUZZLE}"/>
    ${armsSVG}
    <!-- 鬃毛 -->
    ${mane}
    <circle cx="100" cy="108" r="54" fill="${MANE}"/>
    <!-- 耳朵 -->
    <circle cx="66" cy="72" r="13" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <circle cx="134" cy="72" r="13" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <circle cx="66" cy="72" r="6" fill="${MANE}"/><circle cx="134" cy="72" r="6" fill="${MANE}"/>
    <!-- 臉 -->
    <circle cx="100" cy="108" r="42" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    ${charEyes(mood, 84, 116, 100)}
    ${charCheeks(70, 130, 118)}
    <ellipse cx="100" cy="126" rx="22" ry="15" fill="${MUZZLE}"/>
    <path d="M92 116 L108 116 L100 124 Z" fill="#5a3418" stroke-linejoin="round"/>
    ${charMouth(mood, 100, 130, '#5a3418')}
    <circle cx="88" cy="128" r="1.6" fill="${LINE}"/><circle cx="84" cy="123" r="1.6" fill="${LINE}"/>
    <circle cx="112" cy="128" r="1.6" fill="${LINE}"/><circle cx="116" cy="123" r="1.6" fill="${LINE}"/>
  </svg>`;
}

function sabertoothSVG(mood = 'normal') {
  const FUR = '#d9944a', LINE = '#8a5420', STRIPE = '#8a5420', LIGHT = '#f7e2c0';
  const armsSVG = charArms(mood, 176, 30).map(a => pawArm(a, FUR, LIGHT, LINE, 15)).join('');
  return `
  <svg class="char sabertooth mood-${mood}" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" aria-label="劍齒虎">
    ${CHAR_SHADOW}
    <!-- 短尾巴 -->
    <path d="M136 256 Q164 254 170 232" fill="none" stroke="${LINE}" stroke-width="14" stroke-linecap="round"/>
    <path d="M136 256 Q164 254 170 232" fill="none" stroke="${FUR}" stroke-width="10" stroke-linecap="round"/>
    <!-- 腳 -->
    <rect x="68" y="262" width="26" height="40" rx="12" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <rect x="106" y="262" width="26" height="40" rx="12" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="81" cy="300" rx="14" ry="6" fill="${LIGHT}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="119" cy="300" rx="14" ry="6" fill="${LIGHT}" stroke="${LINE}" stroke-width="2"/>
    <!-- 身體與條紋 -->
    <ellipse cx="100" cy="220" rx="46" ry="56" fill="${FUR}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="100" cy="230" rx="26" ry="38" fill="${LIGHT}"/>
    <path d="M58 200 q12 4 16 14 M56 226 q12 2 16 12 M142 200 q-12 4 -16 14 M144 226 q-12 2 -16 12" fill="none" stroke="${STRIPE}" stroke-width="5" stroke-linecap="round"/>
    ${armsSVG}
    <!-- 耳朵 -->
    <path d="M58 82 L62 44 L90 64 Z" fill="${FUR}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M142 82 L138 44 L110 64 Z" fill="${FUR}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M65 70 L66 54 L80 64 Z M135 70 L134 54 L120 64 Z" fill="#f2a6a6"/>
    <!-- 頭 -->
    <path d="M52 106 Q52 58 100 58 Q148 58 148 106 Q148 130 136 140 L148 146 L130 148 Q116 156 100 156 Q84 156 70 148 L52 146 L64 140 Q52 130 52 106 Z" fill="${FUR}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M100 60 L100 78 M86 62 L90 76 M114 62 L110 76" stroke="${STRIPE}" stroke-width="5" stroke-linecap="round"/>
    <path d="M54 110 l14 2 M56 122 l12 0 M146 110 l-14 2 M144 122 l-12 0" stroke="${STRIPE}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="100" cy="132" rx="26" ry="18" fill="${LIGHT}"/>
    ${charEyes(mood, 82, 118, 104)}
    ${charCheeks(68, 132, 118)}
    <path d="M92 120 L108 120 L100 128 Z" fill="#6b3a1a" stroke-linejoin="round"/>
    <!-- 長長的劍齒 -->
    <path d="M88 136 Q86 154 92 166 Q95 152 95 137 Z" fill="#fffdf4" stroke="#b8ad96" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M112 136 Q114 154 108 166 Q105 152 105 137 Z" fill="#fffdf4" stroke="#b8ad96" stroke-width="1.5" stroke-linejoin="round"/>
    ${mood === 'happy'
      ? `<path d="M92 134 Q100 148 108 134 Z" fill="#7a2a2a"/>`
      : `<path d="M94 134 Q100 139 106 134" fill="none" stroke="#6b3a1a" stroke-width="2.5" stroke-linecap="round"/>`}
  </svg>`;
}

function parrotSVG(mood = 'normal') {
  const RED = '#e2403a', LINE = '#9e2520', YELLOW = '#f6c83c', BLUE = '#3a7bd5', GREEN = '#4caf6a';
  const wingUp = mood === 'happy';
  const wing = (side) => {
    const s = side === 'l' ? -1 : 1;
    const x = 100 + s * 40;
    const rot = wingUp ? s * -60 : s * 12;
    return `<g transform="rotate(${rot} ${x} 170)">
      <path d="M${x} 158 Q${x + s * 26} 196 ${x + s * 8} 252 Q${x - s * 8} 214 ${x - s * 6} 168 Z" fill="${BLUE}" stroke="#25569c" stroke-width="2" stroke-linejoin="round"/>
      <path d="M${x} 162 Q${x + s * 18} 186 ${x + s * 8} 214 Q${x - s * 2} 194 ${x - s * 2} 168 Z" fill="${YELLOW}"/>
      <path d="M${x} 162 Q${x + s * 12} 176 ${x + s * 6} 192 Q${x} 180 ${x - s * 1} 166 Z" fill="${GREEN}"/>
    </g>`;
  };
  return `
  <svg class="char parrot mood-${mood}" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" aria-label="鸚鵡">
    ${CHAR_SHADOW}
    <!-- 長尾羽 -->
    <path d="M90 240 L80 306 L98 300 L102 244 Z" fill="${BLUE}" stroke="#25569c" stroke-width="2" stroke-linejoin="round"/>
    <path d="M104 240 L112 308 L126 296 L112 240 Z" fill="${RED}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M96 242 L96 298 L106 300 L106 242 Z" fill="${YELLOW}"/>
    <!-- 腳 -->
    <path d="M86 254 L84 276 M114 254 L116 276" stroke="#7a7a7a" stroke-width="6" stroke-linecap="round"/>
    <path d="M76 280 L84 276 L92 280 M108 280 L116 276 L124 280" fill="none" stroke="#7a7a7a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- 身體 -->
    <ellipse cx="100" cy="196" rx="44" ry="64" fill="${RED}" stroke="${LINE}" stroke-width="2"/>
    <ellipse cx="100" cy="212" rx="24" ry="38" fill="#f06a5c"/>
    ${wing('l')}${wing('r')}
    <!-- 頭 -->
    <circle cx="100" cy="100" r="46" fill="${RED}" stroke="${LINE}" stroke-width="2"/>
    <path d="M86 56 Q90 34 100 44 Q104 28 114 42 Q122 34 120 58 Z" fill="${RED}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
    <!-- 白色眼圈 -->
    <ellipse cx="78" cy="98" rx="17" ry="15" fill="#fff"/>
    <ellipse cx="122" cy="98" rx="17" ry="15" fill="#fff"/>
    ${charEyes(mood, 80, 120, 98)}
    ${charCheeks(68, 132, 120)}
    <!-- 彎彎的鳥嘴 -->
    <path d="M86 108 Q100 98 114 108 Q118 130 100 144 Q98 128 90 120 Q86 116 86 108 Z" fill="#f2e2b0" stroke="#8a7a50" stroke-width="2" stroke-linejoin="round"/>
    <path d="M90 122 Q100 128 108 124 Q104 136 96 136 Z" fill="#3a3330"/>
    ${mood === 'happy' ? `<path d="M92 126 Q100 134 106 127" fill="none" stroke="#e8777a" stroke-width="3" stroke-linecap="round"/>` : ''}
  </svg>`;
}

function robotSVG(mood = 'normal') {
  const METAL = '#c8d4e2', DARK = '#7d8fa6', LINE = '#4e5d72', GLOW = '#6ff0ff';
  const armsSVG = charArms(mood, 168, 40).map(a => pawArm(a, '#a9b8ca', '#ffcf5a', LINE, 12)).join('');
  const face = mood === 'happy'
    ? `<path d="M74 100 Q82 88 90 100" fill="none" stroke="${GLOW}" stroke-width="5" stroke-linecap="round"/>
       <path d="M110 100 Q118 88 126 100" fill="none" stroke="${GLOW}" stroke-width="5" stroke-linecap="round"/>
       <path d="M82 114 Q100 134 118 114 Z" fill="${GLOW}"/>`
    : `<rect x="76" y="90" width="12" height="14" rx="3" fill="${GLOW}"/>
       <rect x="112" y="90" width="12" height="14" rx="3" fill="${GLOW}"/>
       <path d="M86 118 Q100 126 114 118" fill="none" stroke="${GLOW}" stroke-width="4" stroke-linecap="round"/>`;
  return `
  <svg class="char robot mood-${mood}" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" aria-label="機器人">
    ${CHAR_SHADOW}
    <!-- 腳 -->
    <rect x="74" y="236" width="18" height="56" rx="4" fill="${DARK}" stroke="${LINE}" stroke-width="2"/>
    <rect x="108" y="236" width="18" height="56" rx="4" fill="${DARK}" stroke="${LINE}" stroke-width="2"/>
    <rect x="64" y="288" width="34" height="18" rx="6" fill="${LINE}"/>
    <rect x="102" y="288" width="34" height="18" rx="6" fill="${LINE}"/>
    ${armsSVG}
    <!-- 身體 -->
    <rect x="58" y="150" width="84" height="94" rx="14" fill="${METAL}" stroke="${LINE}" stroke-width="2.5"/>
    <rect x="72" y="164" width="56" height="44" rx="8" fill="#2c3a4c"/>
    <circle cx="84" cy="178" r="5" fill="#ff6b6b"/>
    <circle cx="100" cy="178" r="5" fill="${GLOW}"/>
    <circle cx="116" cy="178" r="5" fill="#ffd166"/>
    <path d="M80 196 h40" stroke="#6ad08a" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 5"/>
    <path d="M100 232 q-10 -8 -10 -14 q0 -6 6 -6 q4 0 4 4 q0 -4 4 -4 q6 0 6 6 q0 6 -10 14z" fill="#ff7a9a"/>
    <!-- 脖子 -->
    <rect x="90" y="140" width="20" height="14" fill="${DARK}" stroke="${LINE}" stroke-width="2"/>
    <!-- 天線 -->
    <path d="M100 52 L100 30" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="100" cy="24" r="8" fill="#ff5a5a" stroke="#b83232" stroke-width="2"/>
    <!-- 頭 -->
    <rect x="44" y="96" width="14" height="28" rx="5" fill="${DARK}" stroke="${LINE}" stroke-width="2"/>
    <rect x="142" y="96" width="14" height="28" rx="5" fill="${DARK}" stroke="${LINE}" stroke-width="2"/>
    <rect x="54" y="52" width="92" height="90" rx="22" fill="${METAL}" stroke="${LINE}" stroke-width="2.5"/>
    <rect x="64" y="70" width="72" height="58" rx="14" fill="#1f2b3a"/>
    ${face}
    <circle cx="64" cy="62" r="3" fill="${DARK}"/><circle cx="136" cy="62" r="3" fill="${DARK}"/>
  </svg>`;
}

// 玩家可以選的角色（js/game.js 用這份清單）。id 存在玩家資料裡，加入後不要改。
window.CHARACTERS = [
  { id: 'boy', name: '小小古生物學家', svg: boySVG },
  { id: 'girl', name: '可愛小女生', svg: girlSVG },
  { id: 'monkey', name: '猴子', svg: monkeySVG },
  { id: 'rabbit', name: '兔子', svg: rabbitSVG },
  { id: 'lion', name: '獅子', svg: lionSVG },
  { id: 'sabertooth', name: '劍齒虎', svg: sabertoothSVG },
  { id: 'parrot', name: '鸚鵡', svg: parrotSVG },
  { id: 'robot', name: '機器人', svg: robotSVG },
];

/* ---------- 化石骨架 ---------- */

// 調色盤是可變的：畫化石時是骨頭色，畫復原圖時暫時換成皮膚色（見 withPalette）
let BONE = '#f2e8cf', BONE_LINE = '#5b4530', HOLE = '#4a3826', PLATE = '#e8d6ad';

function withPalette(pal, fn) {
  const saved = { BONE, BONE_LINE, HOLE, PLATE };
  ({ BONE, BONE_LINE, HOLE, PLATE } = { ...saved, ...pal });
  try { return fn(); } finally { ({ BONE, BONE_LINE, HOLE, PLATE } = saved); }
}

function bones(pts, w, opacity = 1) {
  const d = 'M' + pts.map(p => p.join(',')).join(' L');
  const joints = pts.slice(1, -1).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="${w * 0.75}" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="1.5"/>`).join('');
  return `<g opacity="${opacity}">
    <path d="${d}" fill="none" stroke="${BONE_LINE}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${BONE}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>${joints}</g>`;
}
const shape = d => `<path d="${d}" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2.5" stroke-linejoin="round"/>`;
const hole = (cx, cy, rx, ry = rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${HOLE}"/>`;
function teeth(x1, x2, y, dir, size, gap = 6) {
  let s = '';
  for (let x = x1; x <= x2; x += gap) s += `<path d="M${x},${y} L${x + gap * 0.4},${y + dir * size} L${x + gap * 0.8},${y} Z" fill="#fffdf4" stroke="${BONE_LINE}" stroke-width="1"/>`;
  return s;
}
const toes = (x, y, len = 10) => bones([[x, y], [x + len, y + 1]], 2.5) + bones([[x, y], [x + len * 0.8, y - 5]], 2.5);

function spineYAt(spine, x) {
  for (let i = 0; i < spine.length - 1; i++) {
    const [x1, y1] = spine[i], [x2, y2] = spine[i + 1];
    if (x >= x1 && x <= x2) return y1 + (y2 - y1) * ((x - x1) / (x2 - x1 || 1));
  }
  return spine[spine.length - 1][1];
}

function vertebrae(spine, maxR) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < spine.length - 1; i++) {
    const len = Math.hypot(spine[i + 1][0] - spine[i][0], spine[i + 1][1] - spine[i][1]);
    segs.push(len); total += len;
  }
  let out = bones(spine, 3);
  for (let d = 0; d <= total; d += 7) {
    let rem = d, i = 0;
    while (i < segs.length - 1 && rem > segs[i]) { rem -= segs[i]; i++; }
    const t = Math.min(1, rem / segs[i]);
    const x = spine[i][0] + (spine[i + 1][0] - spine[i][0]) * t;
    const y = spine[i][1] + (spine[i + 1][1] - spine[i][1]) * t;
    const p = d / total;
    const r = maxR * (p < 0.45 ? 0.35 + 0.65 * (p / 0.45) : 1 - 0.3 * ((p - 0.45) / 0.55));
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="1.5"/>`;
  }
  return out;
}

function ribs(spine, from, to, len, n) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = from + (to - from) * (i / (n - 1));
    const y = spineYAt(spine, x);
    const l = len * (0.65 + 0.35 * Math.sin(Math.PI * i / (n - 1)));
    const d = `M${x},${y + 2} Q${x + 9},${y + l * 0.55} ${x + 2},${y + l}`;
    out += `<path d="${d}" fill="none" stroke="${BONE_LINE}" stroke-width="5.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${BONE}" stroke-width="3" stroke-linecap="round"/>`;
  }
  return out;
}

// 每隻恐龍的骨架設計（座標系 400 x 230，面向右）
const SKELETONS = {
  trex: {
    spine: [[15, 118], [60, 108], [110, 98], [160, 92], [200, 94], [240, 100], [262, 96], [278, 84], [288, 72]], vr: 6,
    ribs: [168, 240, 48, 9],
    back: [[[152, 98], [168, 140], [152, 176], [170, 200]]],
    limbs: [[[160, 96], [178, 142], [166, 178], [186, 200]], [[244, 112], [254, 126], [262, 124]]], lw: [8, 3],
    feet: [[170, 200], [186, 200]],
    before: '',
    after: () => `<ellipse cx="160" cy="96" rx="20" ry="9" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M282,56 L322,52 L350,64 L352,84 L330,88 L300,92 L284,84 Z') +
      shape('M292,92 L338,90 L350,98 L344,106 L302,108 Z') +
      hole(300, 66, 5) + hole(322, 71, 9, 5) + hole(339, 73, 4, 3) + teeth(306, 342, 88, 1, 5) + teeth(306, 338, 93, -1, 4),
  },
  velociraptor: {
    spine: [[15, 110], [70, 108], [125, 106], [165, 104], [200, 104], [230, 106], [250, 98], [262, 84], [268, 72]], vr: 4.5,
    ribs: [170, 228, 36, 8],
    back: [[[158, 108], [170, 142], [158, 170], [175, 196]]],
    limbs: [[[165, 106], [180, 140], [170, 170], [188, 196]], [[232, 112], [248, 136], [266, 142]]], lw: [6, 3.5],
    feet: [[175, 196], [188, 196]],
    fuzz: true,
    feathers: [{ a: [236, 124], b: [266, 142], len: 22, ang: 120, n: 6 }, { a: [15, 110], b: [60, 108], len: 14, ang: 235, n: 6 }, { a: [15, 110], b: [60, 108], len: 14, ang: 125, n: 6 }],
    after: () => `<ellipse cx="165" cy="106" rx="16" ry="7" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M184,194 Q170,178 184,172 Q180,184 190,194 Z') +
      bones([[266, 142], [276, 152]], 2.5) + bones([[266, 142], [278, 145]], 2.5) +
      shape('M262,62 L300,58 L332,66 L334,74 L300,80 L266,78 Z') + hole(277, 67, 5) + hole(298, 69, 8, 3.5) + teeth(290, 330, 77, 1, 4, 5),
  },
  spinosaurus: {
    spine: [[15, 130], [60, 120], [110, 108], [155, 100], [200, 98], [240, 102], [262, 96], [280, 84], [292, 78]], vr: 5.5,
    ribs: [160, 238, 44, 9],
    back: [[[152, 104], [164, 140], [154, 168], [170, 196]]],
    limbs: [[[158, 102], [172, 140], [162, 170], [180, 196]], [[242, 112], [254, 132], [268, 136]]], lw: [7, 4],
    feet: [[170, 196], [180, 196]],
    before: (s, life) => {
      const tops = [];
      let o = '';
      for (let x = 146; x <= 248; x += 7) {
        const y = spineYAt(s, x), h = 12 + 72 * Math.sin(Math.PI * (x - 140) / 112);
        tops.push(`${x + 2},${y - h}`);
        if (!life) o += bones([[x, y], [x + 2, y - h]], 3);
      }
      // 復原圖：骨棘之間連成一面帆
      return life ? `<path d="M146,${spineYAt(s, 146) + 4} L${tops.join(' L')} L248,${spineYAt(s, 248) + 4} Z" fill="${PLATE}" stroke="${BONE_LINE}" stroke-width="2.5" stroke-linejoin="round"/>` : o;
    },
    after: () => `<ellipse cx="158" cy="102" rx="18" ry="8" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M286,68 L322,66 L366,74 L370,82 L322,84 L290,86 Z') + shape('M300,86 L366,84 L362,90 L304,92 Z') +
      hole(300, 74, 4) + hole(326, 75, 7, 3) + teeth(318, 362, 84, 1, 4, 5),
  },
  allosaurus: {
    spine: [[15, 116], [60, 108], [110, 98], [160, 92], [200, 94], [240, 100], [262, 96], [278, 84], [288, 74]], vr: 5.5,
    ribs: [168, 240, 44, 9],
    back: [[[152, 98], [168, 140], [152, 176], [170, 200]]],
    limbs: [[[160, 96], [178, 142], [166, 178], [186, 200]], [[244, 112], [256, 132], [268, 136]]], lw: [7, 4],
    feet: [[170, 200], [186, 200]],
    after: () => `<ellipse cx="160" cy="96" rx="18" ry="8" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      bones([[268, 136], [276, 146]], 2.5) + bones([[268, 136], [280, 140]], 2.5) +
      shape('M282,62 L318,58 L342,70 L344,84 L320,88 L298,90 L284,82 Z') + shape('M292,60 L298,46 L306,58 Z') +
      shape('M292,90 L336,88 L340,96 L300,98 Z') +
      hole(298, 70, 5) + hole(318, 74, 8, 5) + teeth(302, 336, 86, 1, 4, 5),
  },
  dilophosaurus: {
    spine: [[15, 116], [60, 108], [110, 100], [160, 94], [200, 96], [240, 100], [262, 94], [276, 82], [286, 74]], vr: 4.8,
    ribs: [168, 238, 40, 9],
    back: [[[152, 98], [166, 140], [152, 174], [168, 200]]],
    limbs: [[[160, 96], [176, 140], [164, 176], [184, 200]], [[242, 110], [254, 132], [266, 138]]], lw: [6.5, 3.5],
    feet: [[168, 200], [184, 200]],
    after: () => `<ellipse cx="160" cy="96" rx="16" ry="7" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      bones([[266, 138], [274, 148]], 2.5) +
      shape('M286,66 Q290,36 318,60 Q302,54 296,66 Z') + shape('M296,66 Q302,40 326,64 Q310,58 304,66 Z') +
      shape('M280,66 L318,64 L342,72 L340,80 L316,84 L284,84 Z') + hole(294, 72, 4) + hole(312, 74, 7, 3) + teeth(298, 336, 82, 1, 4, 5),
  },
  brachiosaurus: {
    spine: [[10, 170], [50, 150], [95, 128], [135, 112], [170, 100], [210, 90], [232, 80], [248, 60], [262, 38], [272, 22]], vr: 6.5,
    ribs: [140, 222, 56, 10],
    back: [[[132, 116], [136, 156], [130, 180], [136, 202]], [[206, 96], [210, 138], [208, 174], [212, 202]]],
    limbs: [[[140, 110], [146, 150], [140, 178], [146, 202]], [[215, 92], [222, 135], [220, 172], [224, 202]]], lw: [9, 9],
    feet: [],
    after: () => `<ellipse cx="140" cy="112" rx="20" ry="10" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      `<ellipse cx="214" cy="100" rx="9" ry="20" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M262,18 L274,4 L292,8 L300,20 L284,26 L266,26 Z') + hole(277, 11, 3) + teeth(286, 296, 24, 1, 3, 4),
  },
  mamenchisaurus: {
    spine: [[5, 165], [40, 150], [80, 135], [120, 120], [150, 115], [185, 115], [205, 112], [240, 90], [275, 64], [310, 42], [340, 30]], vr: 6,
    ribs: [125, 200, 50, 9],
    back: [[[118, 124], [122, 160], [118, 184], [124, 203]], [[188, 120], [190, 160], [188, 184], [192, 203]]],
    limbs: [[[125, 120], [130, 160], [126, 185], [132, 203]], [[195, 118], [198, 160], [196, 185], [200, 203]]], lw: [9, 9],
    feet: [],
    after: () => `<ellipse cx="125" cy="120" rx="18" ry="9" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M336,22 L356,18 L368,24 L362,32 L340,34 Z') + hole(348, 23, 3),
  },
  plateosaurus: {
    spine: [[15, 130], [60, 118], [110, 104], [150, 94], [190, 94], [225, 98], [248, 88], [268, 70], [282, 58]], vr: 5,
    ribs: [158, 222, 42, 9],
    back: [[[142, 98], [156, 142], [146, 175], [160, 200]]],
    limbs: [[[150, 96], [166, 140], [156, 175], [172, 200]], [[226, 108], [236, 140], [246, 156]]], lw: [7, 4],
    feet: [[160, 200], [172, 200]],
    after: () => `<ellipse cx="150" cy="96" rx="18" ry="8" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M244,152 L258,146 L250,160 Z') +
      shape('M278,52 L302,50 L318,56 L316,66 L296,68 L280,64 Z') + hole(291, 56, 3.5) + teeth(298, 314, 65, 1, 3, 4),
  },
  triceratops: {
    spine: [[30, 150], [70, 130], [110, 112], [150, 104], [195, 104], [230, 112], [250, 120]], vr: 6.5,
    ribs: [140, 228, 48, 10],
    back: [[[138, 110], [142, 150], [134, 178], [142, 202]], [[220, 120], [214, 152], [220, 178], [214, 202]]],
    limbs: [[[145, 108], [150, 150], [142, 178], [150, 202]], [[228, 116], [222, 150], [228, 178], [222, 202]]], lw: [9, 8],
    feet: [[150, 202], [222, 202]],
    after: () => `<ellipse cx="145" cy="108" rx="22" ry="10" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M236,120 Q222,70 256,50 Q284,56 286,94 L270,122 Z') +
      shape('M262,92 L300,88 L332,106 L326,128 L296,138 L268,130 Z') + shape('M326,106 L346,116 L328,132 Z') +
      shape('M274,94 Q284,62 318,48 Q296,70 286,96 Z') + shape('M282,92 Q298,56 338,44 Q308,68 294,94 Z') +
      shape('M308,96 L318,76 L322,100 Z') + hole(290, 104, 5, 4) + hole(316, 110, 4, 3),
  },
  stegosaurus: {
    spine: [[15, 150], [55, 125], [100, 100], [145, 86], [180, 86], [215, 100], [245, 124], [262, 140], [278, 150]], vr: 6,
    ribs: [120, 230, 50, 11],
    back: [[[138, 92], [142, 140], [136, 176], [142, 202]], [[222, 120], [220, 160], [224, 202]]],
    limbs: [[[145, 90], [150, 140], [144, 175], [150, 202]], [[230, 118], [228, 158], [232, 202]]], lw: [9, 8],
    feet: [[150, 202], [232, 202]],
    before: s => {
      let o = '';
      [64, 82, 100, 118, 136, 154, 172, 190, 208, 226, 242].forEach((x, i) => {
        const y = spineYAt(s, x), h = 14 + 34 * Math.exp(-(((x - 150) / 60) ** 2)), off = i % 2 ? 4 : -4;
        o += `<path d="M${x - 8 + off},${y} Q${x - 11 + off},${y - h * 0.6} ${x + off},${y - h} Q${x + 11 + off},${y - h * 0.6} ${x + 8 + off},${y} Z" fill="${PLATE}" stroke="${BONE_LINE}" stroke-width="2.5"/>`;
      });
      return o + bones([[34, 138], [16, 114]], 3.5) + bones([[40, 134], [30, 108]], 3.5) + bones([[28, 142], [6, 136]], 3.5) + bones([[36, 138], [14, 126]], 3.5);
    },
    after: () => `<ellipse cx="145" cy="90" rx="22" ry="10" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M274,144 L300,148 L306,156 L280,160 L270,154 Z') + hole(284, 150, 3),
  },
  ankylosaurus: {
    spine: [[15, 150], [60, 142], [110, 128], [150, 120], [200, 120], [240, 126], [262, 134]], vr: 5.5,
    ribs: [140, 235, 34, 10],
    back: [[[144, 128], [150, 164], [144, 184], [150, 202]], [[226, 134], [222, 168], [228, 202]]],
    limbs: [[[150, 124], [156, 162], [150, 182], [156, 202]], [[232, 130], [228, 165], [234, 202]]], lw: [9, 8],
    feet: [[156, 202], [234, 202]],
    before: s => {
      let o = '';
      for (let x = 112; x <= 244; x += 11) { const y = spineYAt(s, x); o += `<ellipse cx="${x}" cy="${y - 9}" rx="6.5" ry="4.5" fill="${PLATE}" stroke="${BONE_LINE}" stroke-width="2"/>`; }
      for (let x = 130; x <= 230; x += 22) { const y = spineYAt(s, x); o += shape(`M${x - 5},${y + 26} L${x},${y + 40} L${x + 6},${y + 26} Z`); }
      return o;
    },
    after: () => `<ellipse cx="150" cy="124" rx="22" ry="10" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M4,150 Q4,136 20,136 Q36,138 36,152 Q34,166 18,166 Q4,164 4,150 Z') +
      shape('M258,124 L292,122 L306,138 L292,152 L262,150 Z') + shape('M288,122 L302,112 L298,128 Z') + shape('M294,150 L310,158 L290,154 Z') +
      hole(282, 132, 4),
  },
  parasaurolophus: {
    spine: [[15, 135], [60, 122], [110, 108], [150, 98], [195, 98], [230, 106], [250, 96], [266, 80], [276, 70]], vr: 5.5,
    ribs: [158, 228, 46, 9],
    back: [[[142, 104], [158, 146], [148, 178], [164, 202]], [[222, 116], [228, 152], [224, 180], [230, 202]]],
    limbs: [[[150, 102], [166, 145], [156, 178], [172, 202]], [[228, 112], [236, 150], [232, 180], [238, 202]]], lw: [8, 5],
    feet: [[164, 202], [172, 202]],
    after: () => `<ellipse cx="150" cy="102" rx="20" ry="9" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M270,66 Q246,44 212,34 Q206,28 216,25 Q252,30 286,62 Z') +
      shape('M266,64 L292,62 L322,74 L324,84 L296,86 L270,80 Z') + hole(282, 70, 4) + hole(308, 76, 5, 3),
  },
  iguanodon: {
    spine: [[15, 132], [60, 120], [110, 106], [150, 96], [195, 96], [230, 104], [250, 94], [264, 80], [272, 68]], vr: 6,
    ribs: [158, 228, 50, 9],
    back: [[[142, 102], [158, 146], [148, 178], [164, 202]], [[222, 114], [230, 150], [226, 178], [232, 202]]],
    limbs: [[[150, 100], [166, 145], [156, 178], [172, 202]], [[228, 110], [238, 146], [244, 170]]], lw: [9, 6],
    feet: [[164, 202], [172, 202]],
    after: () => `<ellipse cx="150" cy="100" rx="22" ry="10" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M240,170 L258,154 L250,174 Z') +
      shape('M264,58 L296,56 L322,68 L322,82 L298,86 L268,80 Z') + hole(280, 66, 5) + hole(306, 72, 5, 3),
  },
  diplodocus: {
    spine: [[4, 150], [40, 138], [80, 124], [120, 110], [150, 100], [190, 100], [215, 104], [245, 100], [280, 88], [315, 74], [345, 64]], vr: 6,
    ribs: [125, 210, 52, 10],
    back: [[[144, 106], [148, 150], [144, 178], [148, 202]], [[202, 110], [204, 152], [202, 178], [206, 202]]],
    limbs: [[[150, 104], [154, 148], [150, 178], [154, 202]], [[208, 106], [210, 150], [208, 178], [212, 202]]], lw: [9, 8],
    feet: [],
    after: () => `<ellipse cx="150" cy="104" rx="20" ry="9" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M340,58 L362,56 L378,62 L372,70 L344,70 Z') + hole(352, 61, 3) + teeth(366, 374, 69, 1, 3, 3),
  },
  pachycephalosaurus: {
    spine: [[15, 128], [60, 118], [110, 106], [150, 98], [190, 98], [222, 104], [242, 96], [256, 84], [262, 76]], vr: 5,
    ribs: [158, 218, 44, 8],
    back: [[[142, 102], [156, 144], [146, 176], [160, 200]]],
    limbs: [[[150, 100], [166, 142], [156, 176], [172, 200]], [[222, 112], [232, 134], [242, 140]]], lw: [8, 3.5],
    feet: [[160, 200], [172, 200]],
    after: () => `<ellipse cx="150" cy="100" rx="18" ry="8" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M256,78 Q256,46 284,46 Q306,50 304,74 L314,86 L296,92 L264,90 Z') +
      [[258, 68], [262, 58], [270, 50], [302, 60], [308, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="1.5"/>`).join('') +
      hole(292, 74, 4) + teeth(300, 310, 90, 1, 2.5, 3),
  },
  psittacosaurus: {
    spine: [[15, 130], [60, 120], [110, 108], [150, 100], [190, 100], [222, 106], [240, 98], [252, 88], [258, 82]], vr: 4.8,
    ribs: [158, 218, 40, 8],
    back: [[[142, 104], [156, 142], [146, 172], [160, 198]]],
    limbs: [[[150, 102], [166, 140], [156, 172], [172, 198]], [[222, 112], [230, 136], [238, 148]]], lw: [7, 3.5],
    feet: [[160, 198], [172, 198]],
    before: s => { let o = ''; for (let x = 30; x <= 110; x += 8) { const y = spineYAt(s, x); o += bones([[x, y], [x - 2, y - 16]], 1.8); } return o; },
    after: () => `<ellipse cx="150" cy="102" rx="16" ry="7" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M252,72 L280,68 L294,80 L290,96 L268,98 L254,90 Z') + shape('M290,80 L304,88 L292,98 Z') + shape('M264,92 L258,104 L272,96 Z') +
      hole(272, 80, 5),
  },
  giganotosaurus: {
    spine: [[15, 118], [60, 108], [110, 98], [160, 92], [200, 94], [240, 100], [262, 96], [278, 84], [288, 72]], vr: 6,
    ribs: [168, 240, 48, 9],
    back: [[[152, 98], [168, 140], [152, 176], [170, 200]]],
    limbs: [[[160, 96], [178, 142], [166, 178], [186, 200]], [[244, 112], [254, 130], [266, 134]]], lw: [8, 3.5],
    feet: [[170, 200], [186, 200]],
    after: () => `<ellipse cx="160" cy="96" rx="20" ry="9" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      bones([[266, 134], [274, 142]], 2.5) + bones([[266, 134], [277, 137]], 2.5) +
      shape('M282,58 L326,54 L358,66 L360,82 L330,88 L298,90 L284,82 Z') + shape('M292,90 L346,88 L356,94 L348,100 L300,102 Z') +
      hole(298, 66, 5) + hole(324, 72, 10, 5) + hole(344, 74, 4, 3) + teeth(304, 350, 86, 1, 5) + teeth(304, 344, 91, -1, 4),
  },
  carnotaurus: {
    spine: [[15, 116], [60, 108], [110, 98], [160, 92], [200, 94], [240, 100], [262, 94], [276, 82], [284, 72]], vr: 5.5,
    ribs: [168, 240, 44, 9],
    back: [[[152, 98], [168, 140], [152, 176], [170, 200]]],
    limbs: [[[160, 96], [178, 142], [166, 178], [186, 200]], [[244, 110], [248, 118], [253, 117]]], lw: [7, 2.5],
    feet: [[170, 200], [186, 200]],
    after: () => `<ellipse cx="160" cy="96" rx="18" ry="8" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M280,62 L310,58 L328,68 L330,86 L310,92 L284,88 Z') + shape('M286,62 L272,46 L296,58 Z') + shape('M296,60 L292,42 L306,58 Z') +
      hole(294, 70, 5) + hole(312, 74, 6, 4) + teeth(296, 326, 88, 1, 4, 5),
  },
  sinosauropteryx: {
    spine: [[8, 120], [50, 116], [95, 112], [140, 108], [175, 104], [205, 104], [225, 106], [242, 96], [254, 84], [262, 76]], vr: 4,
    ribs: [180, 222, 30, 7],
    back: [[[168, 110], [180, 142], [172, 166], [186, 192]]],
    limbs: [[[175, 108], [188, 140], [180, 166], [196, 192]], [[226, 112], [234, 126], [244, 128]]], lw: [5, 2.5],
    feet: [[186, 192], [196, 192]],
    fuzz: true, fossilFeathers: true, rings: [12, 150, 13],
    after: () => `<ellipse cx="175" cy="108" rx="12" ry="5" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M256,68 L280,66 L298,72 L296,78 L276,82 L258,78 Z') + hole(268, 72, 4) + teeth(280, 294, 80, 1, 2.5, 3),
  },
  microraptor: {
    spine: [[15, 112], [60, 110], [110, 108], [150, 106], [185, 104], [215, 106], [235, 98], [248, 86], [256, 76]], vr: 3.8,
    ribs: [160, 212, 30, 7],
    back: [[[148, 110], [160, 140], [152, 166], [168, 192]]],
    limbs: [[[155, 108], [168, 140], [160, 166], [176, 192]], [[216, 112], [236, 132], [262, 140]]], lw: [5, 3],
    feet: [[168, 192], [176, 192]],
    fuzz: true, fossilFeathers: true,
    feathers: [{ a: [222, 118], b: [262, 140], len: 36, ang: 118, n: 9 }, { a: [160, 140], b: [161, 166], len: 26, ang: 165, n: 5 },
      { a: [12, 112], b: [46, 110], len: 20, ang: 235, n: 6 }, { a: [12, 112], b: [46, 110], len: 20, ang: 125, n: 6 }],
    after: () => `<ellipse cx="155" cy="108" rx="12" ry="5" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      bones([[262, 140], [270, 148]], 2) + bones([[262, 140], [272, 142]], 2) +
      shape('M250,66 L274,62 L292,68 L290,76 L270,80 L252,76 Z') + hole(262, 70, 4) + teeth(274, 288, 77, 1, 2.5, 3),
  },
  baryonyx: {
    spine: [[15, 128], [60, 118], [110, 106], [155, 98], [200, 96], [240, 100], [262, 94], [280, 84], [292, 78]], vr: 5.5,
    ribs: [160, 238, 44, 9],
    back: [[[152, 102], [166, 140], [154, 172], [172, 198]]],
    limbs: [[[158, 100], [174, 140], [162, 172], [182, 198]], [[242, 110], [256, 134], [270, 140]]], lw: [7, 5],
    feet: [[172, 198], [182, 198]],
    after: () => `<ellipse cx="158" cy="100" rx="18" ry="8" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      shape('M268,138 Q292,134 288,158 Q280,146 264,148 Z') +
      shape('M286,70 L320,66 L356,72 L364,80 L358,86 L322,86 L290,86 Z') + shape('M296,68 L304,60 L310,67 Z') +
      shape('M300,86 L356,86 L352,92 L304,92 Z') + hole(298, 75, 4) + hole(320, 76, 6, 3) + teeth(316, 352, 86, 1, 3.5, 4),
  },
  coelophysis: {
    spine: [[10, 120], [55, 114], [100, 108], [140, 104], [175, 104], [205, 104], [222, 94], [234, 78], [244, 66], [254, 60]], vr: 4,
    ribs: [150, 202, 32, 8],
    back: [[[134, 108], [146, 142], [138, 170], [152, 196]]],
    limbs: [[[140, 106], [154, 140], [146, 170], [162, 196]], [[206, 110], [216, 128], [228, 132]]], lw: [5, 3],
    feet: [[152, 196], [162, 196]],
    after: () => `<ellipse cx="140" cy="106" rx="13" ry="6" fill="${BONE}" stroke="${BONE_LINE}" stroke-width="2"/>` +
      bones([[228, 132], [234, 140]], 2) +
      shape('M250,54 L280,52 L304,58 L302,64 L280,68 L252,64 Z') + hole(262, 58, 4) + hole(282, 60, 6, 2.5) + teeth(266, 300, 64, 1, 3, 4),
  },
};

/* ---------- 羽毛與取樣工具 ---------- */

function sampleSpine(spine, step) {
  const out = [];
  let total = 0;
  const segs = spine.slice(0, -1).map((p, i) => { const l = Math.hypot(spine[i + 1][0] - p[0], spine[i + 1][1] - p[1]); total += l; return l; });
  let acc = 0;
  segs.forEach((l, i) => {
    for (let d = 0; d < l; d += step) {
      const t = d / l;
      out.push({ x: spine[i][0] + (spine[i + 1][0] - spine[i][0]) * t, y: spine[i][1] + (spine[i + 1][1] - spine[i][1]) * t, p: (acc + d) / total });
    }
    acc += l;
  });
  return out;
}

// 羽毛：化石上是細細的印痕，復原圖上是粗的彩色羽毛
function featherMarks(sk, color, w, lift) {
  let o = '';
  (sk.feathers || []).forEach(({ a, b, len, ang, n }) => {
    const rad = ang * Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const t = i / Math.max(1, n - 1);
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      const l = len * (0.7 + 0.3 * t);
      o += `<path d="M${x},${y} L${x + Math.cos(rad) * l},${y + Math.sin(rad) * l}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
    }
  });
  if (sk.fuzz) {
    sampleSpine(sk.spine, 4).forEach(({ x, y }) => {
      o += `<path d="M${x},${y - lift} l-3,${-6 - lift * 0.3}" stroke="${color}" stroke-width="${w * 0.8}" stroke-linecap="round"/>`;
    });
  }
  return o;
}

let fossilCount = 0;
function fossilSVG(dinoId, seed = 7) {
  const sk = SKELETONS[dinoId];
  const gid = `slab-${dinoId}-${++fossilCount}`; // 每次渲染用唯一 id，避免引用到隱藏畫面裡的漸層
  let rnd = seed;
  const rand = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
  let specks = '';
  for (let i = 0; i < 70; i++) specks += `<circle cx="${(rand() * 400).toFixed(0)}" cy="${(rand() * 230).toFixed(0)}" r="${(rand() * 2.5 + 0.8).toFixed(1)}" fill="${rand() > 0.5 ? '#a9824f' : '#e2c592'}" opacity=".7"/>`;

  const back = sk.back.map(p => bones(p, sk.lw[0], 0.6)).join('');
  const limbs = sk.limbs.map((p, i) => bones(p, sk.lw[i] ?? sk.lw[0])).join('');
  const feet = sk.feet.map(([x, y]) => toes(x, y)).join('');
  return `
  <svg class="fossil" viewBox="0 0 400 230" xmlns="http://www.w3.org/2000/svg" aria-label="恐龍化石">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d4af74"/><stop offset="1" stop-color="#b48a52"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="396" height="226" rx="22" fill="url(#${gid})" stroke="#8a6638" stroke-width="4"/>
    ${specks}
    <path d="M30 30 l30 12 l14 -8 M330 200 l26 -10 l18 6 M360 40 l-20 16" fill="none" stroke="#8a6638" stroke-width="2" opacity=".6"/>
    ${back}
    ${sk.fossilFeathers ? featherMarks(sk, '#7a5530', 1.6, 0) : ''}
    ${sk.before ? sk.before(sk.spine, false) : ''}
    ${ribs(sk.spine, ...sk.ribs)}
    ${vertebrae(sk.spine, sk.vr)}
    ${limbs}
    ${feet}
    ${sk.after()}
  </svg>`;
}

/* ---------- 復原圖：在同一副骨架上「長出」肌肉和皮膚 ---------- */

// 顏色：[身體, 深色花紋, 特徵（骨板／帆／羽毛）]。恐龍真正的顏色多半未知，
// 只有中華龍鳥（紅棕白環紋）、小盜龍（黑色帶藍色光澤）、鸚鵡嘴龍（背深腹淺）有化石色素證據。
const LIFE = {
  trex: { eye: [300, 66], colors: ['#7a6a4f', '#4e4232', '#b5884e'] },
  velociraptor: { eye: [277, 67], colors: ['#a8693a', '#6e3f1f', '#3d6e8c'] },
  spinosaurus: { eye: [300, 74], colors: ['#5f7a6a', '#3d5246', '#c5543b'] },
  allosaurus: { eye: [298, 70], colors: ['#8f7a52', '#5d4c30', '#c2603c'] },
  dilophosaurus: { eye: [294, 72], colors: ['#6b8a4a', '#465f2f', '#d9a032'] },
  brachiosaurus: { eye: [272, 16], colors: ['#7f8a7a', '#5a6457', '#a8b0a0'] },
  mamenchisaurus: { eye: [345, 24], colors: ['#9a8a6a', '#6d6047', '#c2b089'] },
  plateosaurus: { eye: [289, 57], colors: ['#9b7f5a', '#6e5638', '#c8a777'] },
  triceratops: { eye: [290, 104], colors: ['#8a6e4f', '#5d4733', '#c9733a'] },
  stegosaurus: { eye: [282, 150], colors: ['#7d8a52', '#54602f', '#c4562e'] },
  ankylosaurus: { eye: [282, 132], colors: ['#7a6a52', '#4e4232', '#b89a6a'] },
  parasaurolophus: { eye: [282, 70], colors: ['#6a7f8f', '#465868', '#d27a3a'] },
  iguanodon: { eye: [280, 66], colors: ['#6f7d5a', '#4a5638', '#a89a6a'] },
  diplodocus: { eye: [352, 61], colors: ['#8a8f6a', '#5e6447', '#b9b98a'] },
  pachycephalosaurus: { eye: [292, 74], colors: ['#8a6a7a', '#5e4652', '#d9b38c'] },
  psittacosaurus: { eye: [272, 80], colors: ['#9a7a4a', '#6b5230', '#e0c38a'] },
  giganotosaurus: { eye: [298, 66], colors: ['#8a5a3f', '#5d3a26', '#c79a6a'] },
  carnotaurus: { eye: [294, 70], colors: ['#a0503c', '#6b3326', '#e0b08a'] },
  sinosauropteryx: { eye: [268, 72], colors: ['#b0642e', '#f3e6cc', '#8a4a20'] },
  microraptor: { eye: [262, 70], colors: ['#2a2f3a', '#4a6fa5', '#1c2030'] },
  baryonyx: { eye: [298, 75], colors: ['#6b7a5a', '#465238', '#b5583a'] },
  coelophysis: { eye: [262, 58], colors: ['#9a8a5a', '#6b5f3a', '#c46a3a'] },
};

// 身體輪廓：沿著脊椎排列很多圓，肋骨區域的圓比較大、往下偏，疊起來就是有肚子的身體
function lifeBody(sk, fill, outline, stripe) {
  const [from, to, len] = sk.ribs;
  const circles = sampleSpine(sk.spine, 2.5).map(({ x, y, p }) => {
    const base = sk.vr * 1.3 * (p < 0.45 ? 0.3 + 0.7 * (p / 0.45) : 1 - 0.3 * ((p - 0.45) / 0.55)) + 1.5;
    const dist = x < from ? from - x : x > to ? x - to : 0;
    const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
    const depth = len * (0.8 + 0.2 * Math.sin(Math.PI * t)) * Math.exp(-((dist / 38) ** 2));
    const r = Math.max(base, depth * 0.55);
    return [x, y + (r - base), r];
  });
  const ring = (pad, color) => circles.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + pad).toFixed(1)}" fill="${color}"/>`).join('');
  let marks = '';
  circles.forEach(([x, y, r], i) => {
    if (sk.rings) {
      const [a, b, step] = sk.rings;
      if (x >= a && x <= b && i % Math.round(step / 2.5) === 0) marks += `<path d="M${x},${y - r} L${x},${y + r}" stroke="${stripe}" stroke-width="5"/>`;
    } else if (r > sk.vr * 2 && i % 6 === 0) {
      marks += `<path d="M${x},${y - r + 1} L${x - 2},${y - r * 0.35}" stroke="${stripe}" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>`;
    }
  });
  return ring(2.5, outline) + ring(0, fill) + marks;
}

function lifeScenery(id) {
  return `
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8f2"/><stop offset="1" stop-color="#e8f6e0"/></linearGradient></defs>
    <rect x="2" y="2" width="396" height="226" rx="22" fill="url(#${id})" stroke="#6b8a4a" stroke-width="4"/>
    <path d="M2 170 Q80 130 160 160 Q240 120 320 150 Q370 140 398 160 L398 210 L2 210 Z" fill="#b9d89a" opacity=".7"/>
    <path d="M2 198 L398 198 L398 206 Q398 228 376 228 L24 228 Q2 228 2 206 Z" fill="#8fb35e"/>
    <g fill="#5e8a3a">
      <path d="M366 198 L380 150 L394 198 Z"/><path d="M370 170 L380 120 L390 170 Z"/><rect x="378" y="196" width="4" height="6" fill="#6b4a2b"/>
      <path d="M20 198 q-14 -26 -4 -34 q4 14 6 34z"/><path d="M24 198 q4 -30 18 -34 q-8 16 -14 34z"/><path d="M22 198 q-2 -34 4 -40 q4 18 0 40z"/>
    </g>`;
}

let lifeCount = 0;
function restorationSVG(dinoId) {
  const sk = SKELETONS[dinoId];
  const { eye, colors: [skin, dark, accent] } = LIFE[dinoId];
  const OUT = '#2e2418';
  const thick = (w, i) => Math.max(w * (i === 0 ? 2.3 : 1.9), 4);
  // 有肌肉的腿：平滑的粗線，大腿加一塊肌肉
  const limb = (pts, w, fill, thigh) => {
    const d = 'M' + pts.map(q => q.join(',')).join(' L');
    let m = '';
    if (thigh) {
      const [[x1, y1], [x2, y2]] = pts;
      const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      const len = Math.hypot(x2 - x1, y2 - y1);
      m = `<ellipse cx="${(x1 + x2) / 2}" cy="${(y1 + y2) / 2}" rx="${len / 2 + 4}" ry="${w * 0.95}" transform="rotate(${ang} ${(x1 + x2) / 2} ${(y1 + y2) / 2})" fill="${fill}" stroke="${OUT}" stroke-width="2.5"/>`;
    }
    return `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` + m;
  };
  const isArm = (p, i) => i > 0 && p[p.length - 1][1] < 190;
  const body = sk.back.map(p => limb(p, thick(sk.lw[0], 0), dark, true)).join('') +
    withPalette({ BONE: accent, BONE_LINE: OUT, PLATE: accent }, () => sk.before ? sk.before(sk.spine, true) : '') +
    lifeBody(sk, skin, OUT, dark) +
    sk.limbs.map((p, i) => limb(p, thick(sk.lw[i] ?? sk.lw[0], i), skin, !isArm(p, i))).join('') +
    withPalette({ BONE: skin, BONE_LINE: OUT, HOLE: skin, PLATE: accent }, () =>
      sk.feet.map(([x, y]) => toes(x, y, 12)).join('') + sk.after()) +
    featherMarks(sk, dinoId === 'microraptor' ? dark : accent, 4.5, sk.vr * 1.2) +
    `<circle cx="${eye[0]}" cy="${eye[1]}" r="4" fill="#fff8d8" stroke="${OUT}" stroke-width="1.2"/><circle cx="${eye[0] + 0.8}" cy="${eye[1]}" r="2.3" fill="#1a1410"/>`;
  return `
  <svg class="restoration" viewBox="0 0 400 230" xmlns="http://www.w3.org/2000/svg" aria-label="恐龍復原圖">
    ${lifeScenery(`life-${dinoId}-${++lifeCount}`)}
    <ellipse cx="190" cy="204" rx="120" ry="7" fill="rgba(0,0,0,.15)"/>
    ${body}
  </svg>`;
}

/* ---------- 場景物件 ---------- */

function museumSVG() {
  let cols = '';
  for (let i = 0; i < 5; i++) cols += `<rect x="${58 + i * 52}" y="120" width="22" height="120" fill="#f4efe3" stroke="#c9bfa8" stroke-width="2"/>`;
  return `
  <svg viewBox="0 0 340 280" xmlns="http://www.w3.org/2000/svg" aria-label="博物館">
    <path d="M30 110 L170 30 L310 110 Z" fill="#f4efe3" stroke="#c9bfa8" stroke-width="3"/>
    <path d="M150 85 q6 -12 14 -8 l6 -6 q8 0 8 6 l-6 2 l2 8 l-3 0 l-2 -6 l-8 2 l-3 4 z" fill="#8a6638"/>
    <rect x="36" y="110" width="268" height="12" fill="#e6dcc4"/>
    <text x="170" y="119.5" font-size="10" font-weight="800" text-anchor="middle" fill="#6b5333" font-family="sans-serif" letter-spacing="2">古 生 物 博 物 館</text>
    ${cols}
    <rect x="142" y="170" width="56" height="70" rx="26" fill="#6b4a2b"/>
    <rect x="30" y="240" width="280" height="12" fill="#e6dcc4"/>
    <rect x="18" y="252" width="304" height="14" fill="#d8ccb0"/>
  </svg>`;
}

function truckSVG() {
  return `
  <svg viewBox="0 0 260 130" xmlns="http://www.w3.org/2000/svg" aria-label="運送卡車">
    <rect x="10" y="30" width="160" height="72" rx="6" fill="#f2b33d" stroke="#b07a1a" stroke-width="3"/>
    <text x="90" y="74" font-size="16" font-weight="900" text-anchor="middle" fill="#7a4a10" font-family="sans-serif">化石運送中</text>
    <path d="M170 50 L222 50 L246 76 L246 102 L170 102 Z" fill="#e45b4f" stroke="#a63a30" stroke-width="3"/>
    <path d="M180 58 L216 58 L234 78 L180 78 Z" fill="#bfe6ff"/>
    <g class="wheel"><circle cx="54" cy="106" r="18" fill="#333"/><circle cx="54" cy="106" r="7" fill="#aaa"/><path d="M54 92 L54 120 M40 106 L68 106" stroke="#666" stroke-width="2"/></g>
    <g class="wheel w2"><circle cx="206" cy="106" r="18" fill="#333"/><circle cx="206" cy="106" r="7" fill="#aaa"/><path d="M206 92 L206 120 M192 106 L220 106" stroke="#666" stroke-width="2"/></g>
  </svg>`;
}
