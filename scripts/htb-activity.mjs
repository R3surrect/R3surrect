// scripts/htb-activity.mjs
import { writeFileSync } from 'fs';

const MATRIX_ID = '01a17712-d11e-71a4-adab-35773d9fcd06';
const ACCOUNT_ID = '9b1ecfec-63b5-4308-b27f-2c7f5044c6a0';
const DATA_FILE = 'htb-activity.json';
const SVG_FILE = 'htb-activity.svg';

const [matrixRes, expRes] = await Promise.all([
  fetch(`https://profile.hackthebox.com/api/v1/public/profile/${MATRIX_ID}/matrix`, {
    headers: { Accept: 'application/json' },
  }),
  fetch(`https://profile.hackthebox.com/api/experience/v1/account/${ACCOUNT_ID}`, {
    headers: { Accept: 'application/json' },
  }),
]);

if (!matrixRes.ok) throw new Error(`matrix API error: ${matrixRes.status}`);
const data = await matrixRes.json();
const exp = expRes.ok ? await expRes.json() : null;

writeFileSync(DATA_FILE, JSON.stringify({ matrix: data, experience: exp }, null, 2));

const cellSize = 11, gap = 4, weeksPerMonth = 5;
const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
const colStep = cellSize + gap;
const monthGap = 6; // доп. зазор между колонками-месяцами, чтобы подписи не слипались

const padLeft = 20, padTop = 36, padBottom = 44, padRight = 16;

let cells = '';
let monthLabels = '';
data.months.forEach((month, monthIndex) => {
  const colX = padLeft + monthIndex * (colStep + monthGap);
  monthLabels += `<text x="${colX}" y="${padTop - 14}" font-size="10" font-family="system-ui, sans-serif" fill="#8b949e">${month.label.slice(0, 3)}</text>`;

  month.weeks.forEach((week, weekIndex) => {
    const x = colX;
    const y = padTop + weekIndex * colStep;
    const color = week.is_placeholder ? 'transparent' : colors[week.level];
    const title = week.is_placeholder
      ? ''
      : `<title>${week.start_at.slice(0, 10)} – ${week.end_at.slice(0, 10)}: ${week.xp_earned} XP</title>`;
    cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}">${title}</rect>`;
  });
});

const gridWidth = data.months.length * (colStep + monthGap) - monthGap;
const gridHeight = weeksPerMonth * colStep - gap;
const totalWidth = padLeft + gridWidth + padRight;
const totalHeight = padTop + gridHeight + padBottom;

const statsText = exp
  ? `Lvl ${exp.level} · ${exp.levelTitle} · ${exp.totalExperiencePoints} XP total · ${exp.streakData.counter}w streak`
  : '';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="${totalWidth}" height="${totalHeight}" rx="8" fill="#0d1117"/>
  <text x="${padLeft}" y="18" font-size="13" font-family="system-ui, sans-serif" fill="#c9d1d9">
    <tspan fill="#39d353" font-weight="700">${data.period_total_xp} XP</tspan> gained on Hack The Box in the last year
  </text>
  ${monthLabels}
  ${cells}
  <text x="${padLeft}" y="${totalHeight - 16}" font-size="11" font-family="system-ui, sans-serif" fill="#8b949e">${statsText}</text>
</svg>`;
