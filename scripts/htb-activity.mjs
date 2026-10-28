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

const cellSize = 11, gap = 4, weeksPerMonth = 5, monthGap = 10;
const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
const colStep = cellSize + gap;

const padX = 24, padTop = 56, padRight = 24;

let cells = '';
let monthLabels = '';
data.months.forEach((month, monthIndex) => {
  const colX = padX + monthIndex * (colStep + monthGap);
  monthLabels += `<text x="${colX}" y="${padTop - 14}" font-size="10" font-family="system-ui, sans-serif" fill="#8b949e">${month.label.slice(0, 3)}</text>`;

  month.weeks.forEach((week, weekIndex) => {
    const y = padTop + weekIndex * colStep;
    const color = week.is_placeholder ? 'transparent' : colors[week.level];
    const title = week.is_placeholder
      ? ''
      : `<title>${week.start_at.slice(0, 10)} – ${week.end_at.slice(0, 10)}: ${week.xp_earned} XP</title>`;
    cells += `<rect x="${colX}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}">${title}</rect>`;
  });
});

const gridWidth = data.months.length * (colStep + monthGap) - monthGap;
const gridHeight = weeksPerMonth * colStep - gap;
const totalWidth = padX + gridWidth + padRight;

// карточки статов
const cardGap = 16, cardTop = padTop + gridHeight + 24, cardHeight = 68;
const cardWidth = (gridWidth - cardGap * 2) / 3;

const statCards = [
  { label: 'Weekly Average', value: `${data.weekly_average_xp} XP` },
  { label: 'Total XP', value: `${data.total_xp}` },
  { label: 'Weeks Active', value: `${data.weeks_active} week${data.weeks_active === 1 ? '' : 's'}` },
].map((card, i) => {
  const x = padX + i * (cardWidth + cardGap);
  return `
    <rect x="${x}" y="${cardTop}" width="${cardWidth}" height="${cardHeight}" rx="8" fill="none" stroke="#30363d" stroke-width="1"/>
    <text x="${x + 16}" y="${cardTop + 26}" font-size="11" font-family="system-ui, sans-serif" fill="#8b949e">${card.label}</text>
    <text x="${x + 16}" y="${cardTop + 48}" font-size="16" font-weight="600" font-family="system-ui, sans-serif" fill="#e6edf3">${card.value}</text>
  `;
}).join('');

const totalHeight = cardTop + cardHeight + 24;

const svg = `svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" preserveAspectRatio="xMinYMin meet">
  <rect width="${totalWidth}" height="${totalHeight}" rx="8" fill="#0d1117" stroke="#21262d" stroke-width="1"/>
  <text x="${padX}" y="26" font-size="14" font-family="system-ui, sans-serif" fill="#c9d1d9">
    <tspan fill="#39d353" font-weight="700">${data.period_total_xp} XP</tspan> gained on Hack The Box in the last year
  </text>
  ${monthLabels}
  ${cells}
  ${statCards}
</svg>`;

writeFileSync(SVG_FILE, svg);
console.log(`${data.period_total_xp} XP, lvl ${exp?.level ?? '?'}`);
