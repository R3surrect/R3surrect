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

const cellSize = 14, gap = 3, weeksPerMonth = 5;
const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

let cells = '';
data.months.forEach((month, monthIndex) => {
  month.weeks.forEach((week, weekIndex) => {
    const x = monthIndex * (cellSize + gap);
    const y = weekIndex * (cellSize + gap);
    const color = week.is_placeholder ? 'transparent' : colors[week.level];
    const title = week.is_placeholder
      ? ''
      : `<title>${week.start_at.slice(0, 10)} – ${week.end_at.slice(0, 10)}: ${week.xp_earned} XP</title>`;
    cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}">${title}</rect>`;
  });
});

const monthLabels = data.months
  .map((m, i) => `<text x="${i * (cellSize + gap)}" y="-6" font-size="9" fill="#8b949e">${m.label.slice(0, 3)}</text>`)
  .join('');

const gridWidth = data.months.length * (cellSize + gap);
const gridHeight = weeksPerMonth * (cellSize + gap);

const statsLine = exp
  ? `<text x="0" y="${gridHeight + 24}" font-size="12" fill="#c9d1d9">Lvl ${exp.level} · ${exp.levelTitle} · ${exp.totalExperiencePoints} XP total · streak ${exp.streakData.counter}w</text>`
  : '';

const totalHeight = gridHeight + (exp ? 40 : 12);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${gridWidth}" height="${totalHeight}" viewBox="0 -12 ${gridWidth} ${totalHeight}">
  <rect width="${gridWidth}" height="${totalHeight + 12}" y="-12" fill="#0d1117"/>
  ${monthLabels}
  ${cells}
  ${statsLine}
</svg>`;

writeFileSync(SVG_FILE, svg);
