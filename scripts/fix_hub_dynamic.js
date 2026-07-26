const { readFileSync, writeFileSync, existsSync } = require('fs');

const files = [
  'src/app/hrd/career/approval/page.tsx',
  'src/app/hrd/career/development/page.tsx',
  'src/app/hrd/career/master/page.tsx',
  'src/app/hrd/career/talent/page.tsx',
  'src/app/hrd/career/transactions/page.tsx',
  'src/app/hrd/infrastructure/locations/page.tsx',
  'src/app/hrd/leaves/page.tsx',
  'src/app/hrd/relations/analytics/page.tsx',
  'src/app/hrd/relations/approval/page.tsx',
  'src/app/hrd/relations/cases/page.tsx',
  'src/app/hrd/relations/communication/page.tsx',
  'src/app/hrd/relations/master/page.tsx',
  'src/app/hrd/relations/separation/page.tsx',
  'src/app/hrd/rewards/bonuses/page.tsx',
  'src/app/hrd/rewards/payroll/page.tsx',
  'src/app/hrd/rewards/statement/page.tsx',
  'src/app/hrd/workforce-time/calendar/page.tsx',
  'src/app/hrd/workforce-time/overtime/page.tsx',
  'src/app/hrd/attendance/page.tsx',
];

for (const f of files) {
  if (!existsSync(f)) continue;
  let content = readFileSync(f, 'utf8');
  if (content.includes('export const dynamic')) {
    console.log('SKIP (already has dynamic)', f);
    continue;
  }
  // Insert after the last import line
  const lines = content.split('\n');
  let lastImport = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].startsWith('from ') || (lines[i].trim() && lines[i-1]?.startsWith('import ') && !lines[i].startsWith('}') && !lines[i].startsWith('//'))) {
      lastImport = i;
    } else if (lines[i].trim() === '') {
      lastImport = i;
    } else if (!lines[i].startsWith('import ')) {
      break;
    }
  }
  // Find the first empty line after imports
  let insertAt = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) continue;
    if (lines[i].trim() === '') {
      insertAt = i + 1;
      continue;
    }
    if (insertAt > 0) break;
  }
  if (insertAt <= 0) insertAt = lastImport + 2;
  
  lines.splice(insertAt, 0, "export const dynamic = \"force-dynamic\";");
  const newContent = lines.join('\n');
  writeFileSync(f, newContent);
  console.log('FIXED', f);
}
console.log('Done');
