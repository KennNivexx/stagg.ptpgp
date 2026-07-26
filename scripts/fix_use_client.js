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

let count = 0;
for (const f of files) {
  if (!existsSync(f)) continue;
  let content = readFileSync(f, 'utf8');
  if (content.startsWith('"use client"') || content.startsWith("'use client'")) {
    console.log('SKIP', f);
    continue;
  }
  content = '"use client";\n\n' + content;
  writeFileSync(f, content);
  console.log('FIXED', f);
  count++;
}
console.log('Total fixed:', count);
