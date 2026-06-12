const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
let env = {};
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    }
  }
} catch (e) {
  console.error('Error reading .env.local:', e.message);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: missing env variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const updated_org_structure = [
  {
    "id": "org-1",
    "code": "1.0.0.0.0.0.0",
    "name": "Commissioner",
    "level": 0,
    "leader_name": "",
    "leader_email": "",
    "children": [
      {
        "id": "org-2",
        "code": "1.1.0.0.0.0.0",
        "name": "Internal Audit",
        "level": 1,
        "leader_name": "",
        "leader_email": "",
        "children": []
      },
      {
        "id": "org-3",
        "code": "1.2.0.0.0.0.0",
        "name": "Director",
        "level": 1,
        "leader_name": "Ade Fajar Nurocman",
        "leader_email": "ade.fajar@ptpgp.co.id",
        "children": [
          {
            "id": "org-4",
            "code": "1.2.1.0.0.0.0",
            "name": "Deputy Director",
            "level": 2,
            "leader_name": "Enjah Solihin",
            "leader_email": "enjah.solihin@ptpgp.co.id",
            "children": [
              {
                "id": "org-5",
                "code": "1.2.1.1.0.0.0",
                "name": "HR & GA",
                "level": 3,
                "leader_name": "Radian, S.Sos., CHRM",
                "leader_email": "radian@ptpgp.co.id",
                "children": [
                  {
                    "id": "org-6",
                    "code": "1.2.1.1.1.0.0",
                    "name": "Human Resources",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": [
                      {
                        "id": "org-7",
                        "code": "1.2.1.1.1.1.0",
                        "name": "Payroll",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-8",
                        "code": "1.2.1.1.1.2.0",
                        "name": "Recruitment and Development",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      }
                    ]
                  },
                  {
                    "id": "org-9",
                    "code": "1.2.1.1.2.0.0",
                    "name": "General Affair",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": [
                      {
                        "id": "org-10",
                        "code": "1.2.1.1.2.1.0",
                        "name": "Office Boy & House Keeping",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-11",
                        "code": "1.2.1.1.2.2.0",
                        "name": "Property creation & Maintenance",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-12",
                        "code": "1.2.1.1.2.3.0",
                        "name": "Office Driver",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      }
                    ]
                  },
                  {
                    "id": "org-13",
                    "code": "1.2.1.1.3.0.0",
                    "name": "IT Application and Development",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": [
                      {
                        "id": "org-14",
                        "code": "1.2.1.1.3.1.0",
                        "name": "Help desk Staff",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      }
                    ]
                  },
                  {
                    "id": "org-15",
                    "code": "1.2.1.1.4.0.0",
                    "name": "Security",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": [
                      {
                        "id": "org-16",
                        "code": "1.2.1.1.4.1.0",
                        "name": "Shift Leader",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-17",
                        "code": "1.2.1.1.4.2.0",
                        "name": "Personnel",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      }
                    ]
                  }
                ]
              },
              {
                "id": "org-18",
                "code": "1.2.1.2.0.0.0",
                "name": "Finance",
                "level": 3,
                "leader_name": "M. Rizki Galuh Pratama, B.Bus",
                "leader_email": "rizki.galuh@ptpgp.co.id",
                "children": [
                  {
                    "id": "org-19-new",
                    "code": "1.2.1.2.1.0.0",
                    "name": "Finance, Accounting & Tax",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": [
                      {
                        "id": "org-19",
                        "code": "1.2.1.2.1.1.0",
                        "name": "Finance",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": [
                          {
                            "id": "org-20",
                            "code": "1.2.1.2.1.1.1",
                            "name": "Cashier",
                            "level": 6,
                            "leader_name": "",
                            "leader_email": "",
                            "children": []
                          }
                        ]
                      },
                      {
                        "id": "org-22",
                        "code": "1.2.1.2.1.2.0",
                        "name": "Account Payable",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-23",
                        "code": "1.2.1.2.1.3.0",
                        "name": "Account Receivable",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      }
                    ]
                  }
                ]
              },
              {
                "id": "org-24",
                "code": "1.2.1.3.0.0.0",
                "name": "Marketing",
                "level": 3,
                "leader_name": "Tati Ernawati",
                "leader_email": "tati.ernawati@ptpgp.co.id",
                "children": [
                  {
                    "id": "org-25",
                    "code": "1.2.1.3.1.0.0",
                    "name": "Project Appraisal",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": [
                      {
                        "id": "org-26",
                        "code": "1.2.1.3.1.1.0",
                        "name": "REGIONAL",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-27",
                        "code": "1.2.1.3.1.2.0",
                        "name": "Forwarder",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-28",
                        "code": "1.2.1.3.1.3.0",
                        "name": "PPJK",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-29",
                        "code": "1.2.1.3.1.4.0",
                        "name": "Warehouse",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-30-new",
                        "code": "1.2.1.3.1.5.0",
                        "name": "Project and Heavy Equipment",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      }
                    ]
                  },
                  {
                    "id": "org-30",
                    "code": "1.2.1.3.2.0.0",
                    "name": "Sales",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": []
                  },
                  {
                    "id": "org-31-new",
                    "code": "1.2.1.3.3.0.0",
                    "name": "Staff Admin",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": []
                  },
                  {
                    "id": "org-32-new",
                    "code": "1.2.1.3.4.0.0",
                    "name": "Media and Promotion",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": []
                  }
                ]
              },
              {
                "id": "org-33",
                "code": "1.2.1.4.0.0.0",
                "name": "Operational",
                "level": 3,
                "leader_name": "I Gusti Ngurah Sukada",
                "leader_email": "gusti.ngurah@ptpgp.co.id",
                "children": [
                  {
                    "id": "org-34",
                    "code": "1.2.1.4.1.0.0",
                    "name": "Vehicle Operations",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": [
                      {
                        "id": "org-35",
                        "code": "1.2.1.4.1.1.0",
                        "name": "Driver",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      }
                    ]
                  },
                  {
                    "id": "org-36",
                    "code": "1.2.1.4.2.0.0",
                    "name": "Operasional Alat Berat",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": [
                      {
                        "id": "org-37",
                        "code": "1.2.1.4.2.1.0",
                        "name": "Operator",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      }
                    ]
                  },
                  {
                    "id": "org-38",
                    "code": "1.2.1.4.3.0.0",
                    "name": "Operasional Plant",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": [
                      {
                        "id": "org-39",
                        "code": "1.2.1.4.3.1.0",
                        "name": "Rigger",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      }
                    ]
                  },
                  {
                    "id": "org-40",
                    "code": "1.2.1.4.4.0.0",
                    "name": "Traffic System",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": []
                  },
                  {
                    "id": "org-41",
                    "code": "1.2.1.4.5.0.0",
                    "name": "Quality Control",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": [
                      {
                        "id": "org-42",
                        "code": "1.2.1.4.5.1.0",
                        "name": "Service Advisor",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-43",
                        "code": "1.2.1.4.5.2.0",
                        "name": "Vehicle Registration",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-44",
                        "code": "1.2.1.4.5.3.0",
                        "name": "Equipment Control",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      },
                      {
                        "id": "org-45",
                        "code": "1.2.1.4.5.4.0",
                        "name": "Staff Admin",
                        "level": 5,
                        "leader_name": "",
                        "leader_email": "",
                        "children": []
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "id": "org-46",
            "code": "1.2.2.0.0.0.0",
            "name": "Procurement",
            "level": 2,
            "leader_name": "Galih Aditya",
            "leader_email": "galih.aditya@ptpgp.co.id",
            "children": []
          },
          {
            "id": "org-47",
            "code": "1.2.3.0.0.0.0",
            "name": "Management Representative",
            "level": 2,
            "leader_name": "Dace Rizkia Gusti E",
            "leader_email": "dace.rizkia@ptpgp.co.id",
            "children": []
          },
          {
            "id": "org-48",
            "code": "1.2.4.0.0.0.0",
            "name": "Health, Safety, and Environment",
            "level": 2,
            "leader_name": "Asmarnisa Putri Utama",
            "leader_email": "asmarnisa.putri@ptpgp.co.id",
            "children": [
              {
                "id": "org-51",
                "code": "1.2.4.1.0.0.0",
                "name": "Delivery Note Document Control",
                "level": 3,
                "leader_name": "",
                "leader_email": "",
                "children": [
                  {
                    "id": "org-52",
                    "code": "1.2.4.1.1.0.0",
                    "name": "Staff",
                    "level": 4,
                    "leader_name": "",
                    "leader_email": "",
                    "children": []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

async function run() {
  console.log('Fetching existing settings...');
  const { data, error } = await supabase
    .from('employees')
    .select('address')
    .eq('email', '__settings__@ptpgp.co.id')
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return;
  }

  let settings = {};
  try {
    settings = JSON.parse(data.address);
  } catch (e) {
    console.error('JSON parse error, starting fresh');
  }

  settings.org_structure = updated_org_structure;

  console.log('Upserting settings back with updated org structure...');
  const { error: upsertError } = await supabase
    .from('employees')
    .upsert({
      full_name: "System Settings", 
      email: "__settings__@ptpgp.co.id",
      address: JSON.stringify(settings), 
      department: "System", 
      position: "Settings",
      join_date: "2024-01-01", 
      status: "Tetap"
    }, { onConflict: "email" });

  if (upsertError) {
    console.error('Upsert failed:', upsertError);
  } else {
    console.log('SUCCESS: Org structure updated successfully!');
  }
}

run();
