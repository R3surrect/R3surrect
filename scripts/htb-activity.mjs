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

const FONT = "'Segoe UI', Helvetica, Arial, sans-serif";
const NEON_GREEN = '#9fef00';
const BORDER_COLOR = '#182232';

const cellWidth = 16.5;
const cellHeight = 11;
const gapY = 4;
const monthGap = 5;
const weeksPerMonth = 5;
const colors = [BORDER_COLOR, '#0e4429', '#006d32', '#26a641', NEON_GREEN];
const colStepX = cellWidth;
const rowStepY = cellHeight + gapY;

const pad = 20;
const padTop = pad + 36;

let cells = '';
let monthLabels = '';
data.months.forEach((month, monthIndex) => {
  const colX = pad + monthIndex * (colStepX + monthGap);
  monthLabels += `<text x="${colX}" y="${padTop - 14}" font-size="10" font-family="${FONT}" fill="#8b949e">${month.label.slice(0, 3)}</text>`;

  month.weeks.forEach((week, weekIndex) => {
    const y = padTop + weekIndex * rowStepY;
    const color = week.is_placeholder ? 'transparent' : colors[week.level];
    const title = week.is_placeholder
      ? ''
      : `<title>${week.start_at.slice(0, 10)} – ${week.end_at.slice(0, 10)}: ${week.xp_earned} XP</title>`;
    cells += `<rect x="${colX}" y="${y}" width="${cellWidth}" height="${cellHeight}" rx="2" fill="${color}">${title}</rect>`;
  });
});

const gridWidth = data.months.length * (colStepX + monthGap) - monthGap;
const gridHeight = weeksPerMonth * rowStepY - gapY;
const totalWidth = pad * 2 + gridWidth;

const cardGap = 16, cardTop = padTop + gridHeight + 24, cardHeight = 84;
const cardWidth = (gridWidth - cardGap * 2) / 3;

const cardsSpec = [
  { label: ['Weekly', 'Average'], value: `${data.weekly_average_xp} XP` },
  { label: ['Total XP'], value: `${data.total_xp}` },
  { label: ['Weeks', 'Active'], value: `${data.weeks_active} week${data.weeks_active === 1 ? '' : 's'}` },
];

const statCards = cardsSpec.map((card, i) => {
  const x = pad + i * (cardWidth + cardGap);
  const labelY = cardTop + 20;
  const labelLines = card.label
    .map((line, idx) => `<tspan x="${x + 14}" dy="${idx === 0 ? 0 : 13}">${line}</tspan>`)
    .join('');
  const valueY = cardTop + cardHeight - 16;

  return `
    <rect x="${x}" y="${cardTop}" width="${cardWidth}" height="${cardHeight}" rx="6" fill="none" stroke="${BORDER_COLOR}" stroke-width="1"/>
    <text x="${x + 14}" y="${labelY}" font-size="11" font-family="${FONT}" fill="#8b949e">${labelLines}</text>
    <text x="${x + 14}" y="${valueY}" font-size="16" font-weight="600" font-family="${FONT}" fill="${NEON_GREEN}">${card.value}</text>
  `;
}).join('');

const totalHeight = cardTop + cardHeight + pad;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" preserveAspectRatio="xMinYMin meet">
  <rect x="0.5" y="0.5" width="${totalWidth - 1}" height="${totalHeight - 1}" rx="6" fill="#0d1117" stroke="${NEON_GREEN}" stroke-width="1"/>
  <text x="${pad}" y="${pad + 6}" font-size="14" font-family="${FONT}" fill="#c9d1d9">
    <tspan fill="${NEON_GREEN}" font-weight="700">${data.period_total_xp} XP</tspan> gained on Hack The Box in the last year
  </text>
  ${monthLabels}
  ${cells}
  ${statCards}
</svg>`;

writeFileSync(SVG_FILE, svg);
console.log(`${data.period_total_xp} XP, lvl ${exp?.level ?? '?'}`);
