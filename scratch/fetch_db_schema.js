require('dotenv').config({ path: '.env.local' });

async function fetchSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  const schema = await res.json();
  const tables = ['leaves', 'kpi_evaluations', 'departments', 'applications'];
  for (const t of tables) {
    if (schema.definitions && schema.definitions[t]) {
      console.log(`\nTable: ${t}`);
      const props = schema.definitions[t].properties;
      for (const [colName, colInfo] of Object.entries(props)) {
        console.log(`  - ${colName}: ${colInfo.type} (${colInfo.format || 'no format'})`);
      }
    } else {
      console.log(`Table ${t} not found in definitions.`);
    }
  }
}

fetchSchema().catch(console.error);
