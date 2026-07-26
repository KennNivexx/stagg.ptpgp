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
  if (content.startsWith('"use client";\n\n')) {
    content = content.slice(15);
    writeFileSync(f, content);
    console.log('REVERTED', f);
  } else if (content.startsWith('"use client";\r\n\r\n')) {
    content = content.slice(17);
    writeFileSync(f, content);
    console.log('REVERTED', f);
  } else {
    console.log('OK', f);
  }
}
