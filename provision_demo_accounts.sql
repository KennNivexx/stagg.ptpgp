-- Full demo account provisioning per user's requested list.
-- Password for ALL accounts below is "password" EXCEPT superadmin ("superadmin123").
-- Hashes use the app's exact algorithm (PBKDF2-SHA512, 100k iters, 64-byte key,
-- stored "salt:hash" hex) — see src/lib/auth.ts. Run in the Supabase SQL editor.
-- Real employees keep their REAL full_name in karyawan — only login email/password change.


-- SUPERADMIN
UPDATE pengguna SET email = 'superadmin@ptpgp.co.id', full_name = 'Super Administrator', password_hash = 'cd58e00d5cfed388dab308f1ce26a6bb:27c62c3e5ae9a9aa2218e24a752d99803804653dcf7a42ade1daffe6fe316d647523c7d4707e7c715e85db03eca930eb5706fc8ae6ccee124bd5bbf48db79cba' WHERE email = 'bootstrap.superadmin@ptpgp.co.id';

-- HRD
UPDATE pengguna SET full_name = 'Administrator HRD', password_hash = '681f5214abeeb33322d62d5192ffc527:cc1a9d58b007f052263fcbc7cb9a28cdf9e2d3e75b2a61aa77de6003577d48db6531ef7286e0a0b3213ca88b931cec4032500ee594ec5d54455d92fafbb54a40' WHERE email = 'hrd@ptpgp.co.id';

-- DIRECTOR
UPDATE pengguna SET email = 'director@ptpgp.co.id', full_name = 'Ade Fajar Nurcahman', password_hash = 'f57e1c7d35445b336279f61c4437ff0c:9818dbe1188d92d3263b89d74253167004716c567bd0f69c8ca843c2a6c668896e02d7ac4ae50e8ff23243b750fbe02a2621e326f98d1a7d8aae32249cab1f82' WHERE email = 'dirut@ptpgp.co.id';
UPDATE karyawan SET email = 'director@ptpgp.co.id' WHERE email = 'dirut@ptpgp.co.id';

-- Manager: Divisi HR & GA (Rudi Hartanto, S.Psi)
UPDATE pengguna SET email = 'hrga@ptpgp.co.id', password_hash = 'fbe60a934c0799e3bf1da51ac34bdd96:72e63e83f5fcb7490a5ac01bc96ac557e191efd1b4dfa7ebb6c233d07934da71e357cbb2df76de602b788085b4b64dde0783897f056f65b0d2255c83828e2064' WHERE email = 'mgr.hr@ptpgp.co.id';
UPDATE karyawan SET email = 'hrga@ptpgp.co.id' WHERE email = 'mgr.hr@ptpgp.co.id';

-- Employees: Divisi HR & GA
UPDATE karyawan SET email = 'radian@ptpgp.co.id', address = '{"__auth__":{"password_hash":"17208576d5bfef85c043be6c4fc56cb6:1e0daaa280ac8644d9e450afccdb3c8757e2887be8606f32d16080ab0a9e8106b1e0f907fbc7ba8264d7cb1c6ee034b78bc5d93a682b0db49590f140bd971f5b","role":"employee"}}' WHERE id = '8214b63e-fc76-40f3-9642-be780166cd5d'; -- was staff.hrd1@ptpgp.co.id (Andi Prasetyo, S.Psi, Staff HRD (Rekrutmen))
UPDATE karyawan SET email = 'siti.nurhaliza@ptpgp.co.id', address = '{"__auth__":{"password_hash":"c2ad06b74de668e1f3cf704790c08300:19f52568ed5f2e93935b29066ca3be628389416a62538b63a5b429dc697d787647131e97dd2f060baf87765b4b19431d431498ab068aa3c6b911c4d53a8fb31a","role":"employee"}}' WHERE id = 'fe5695d5-fbe4-403e-809a-2eec5c1d832a'; -- was staff.ga@ptpgp.co.id (Budi Hermawan, Staff General Affairs (GA))
UPDATE karyawan SET email = 'andi.pratama@ptpgp.co.id', address = '{"__auth__":{"password_hash":"f876245b504d50a8dbce9829dc0fdf95:ce10cbeb8681e3638983117c86d517fb1d18684242f6193172db14d651a69025f7615eee0bcac76c43de28e8dde7d79e3a1f358e2a8e48dbfc81f6c3a9d5e9f6","role":"employee"}}' WHERE id = '8913a359-e802-4384-8aea-dd0ce1ca723a'; -- was staff.hrd2@ptpgp.co.id (Dewi Anggraeni, SE, Staff HRD (Payroll & Adm))
UPDATE karyawan SET email = 'dewi.lestari@ptpgp.co.id', address = '{"__auth__":{"password_hash":"e44815006b6f30336e7fcfb631836194:6594c308a34dce5152e85060ec6cd9e7d3d20d4824ab32f0cf5e1efd68c00d38ec552f35f3cd0ac1d2f9490a7d76fa2dc0f460098b8ef0d25522bdc3cb84400a","role":"employee"}}' WHERE id = 'b0ff9c16-110a-47f7-803e-0b3929a71f7f'; -- was spv.hr@ptpgp.co.id (Siti Rahayu, A.Md, Supervisor HR & GA)
UPDATE karyawan SET email = 'budi.wibowo@ptpgp.co.id', address = '{"__auth__":{"password_hash":"f1d54d4bcc08d7bd39fd7d68941f66b4:c595da79eba7e75ea1b7cce4ec6c5916d75f8fda260eb8a8b7c6a7bce2f7205bd7ef4448c091687c0be01e48ba45eed49b0f48d2bb0bb566dfc5ddef40e07b4f","role":"employee"}}' WHERE id = '8f008ea0-e708-4847-b2d4-9f6a64d9771e'; -- was gm.hr@ptpgp.co.id (Fitriani Handayani, SE, General Manager HR & GA)
UPDATE karyawan SET email = 'rina.marlina@ptpgp.co.id', address = '{"__auth__":{"password_hash":"c469ed7d2dd6024ff1d70feef98105d5:56ece17045ea342e112deebd98729da311ecf1477ce2c58cf203c3f0cad204319a687e71c984344deec38c73ee5831611edc4b489783b89ecf90f11a3c69813c","role":"employee"}}' WHERE id = 'b30c9a43-c253-4f47-9992-c89166647e5b'; -- was dir.hr@ptpgp.co.id (Dra. Ratna Kusumawati, Direktur HR & GA)
-- NOTE: Divisi HR & GA short by 1 real employee(s) — unassigned target emails: hendra.gunawan@ptpgp.co.id

-- Manager: Divisi Finance & Accounting (Hendro Wibowo, SE, Ak.)
UPDATE pengguna SET email = 'finance@ptpgp.co.id', password_hash = 'a7791aa4feaf68f34592bdd74ee911e4:a3f104944899d17bbaec269ec476aa6d91d2aa5a161c64e1fb8b4314dd5ea106f1ebe3793ab4096355c85ec30e14f898ca2e5fe575c1b13eabfbab72ecbefafd' WHERE email = 'mgr.finance@ptpgp.co.id';
UPDATE karyawan SET email = 'finance@ptpgp.co.id' WHERE email = 'mgr.finance@ptpgp.co.id';

-- Employees: Divisi Finance & Accounting
UPDATE karyawan SET email = 'rini.astuti@ptpgp.co.id', address = '{"__auth__":{"password_hash":"9d7874277d3d3eaa8b2c34de54cdf11b:5d0fe8187d675aab9516070fd83070d1e00b8b2fbb5e2a9891a27bcf17630002507745de4218d8a20ac7f2c7dfc43e70b9f7504f7d180d6650940a643a9a1e74","role":"employee"}}' WHERE id = '8cabdd21-cd90-4028-b34b-d1572bffbca7'; -- was staff.tax@ptpgp.co.id (Rina Marlina, SE, BKP, Staff Tax & Compliance)
UPDATE karyawan SET email = 'ahmad.fauzi@ptpgp.co.id', address = '{"__auth__":{"password_hash":"bf10364c0dbc0b964ef692fa9a665d91:9519e581900e2a77cfcbf76b32544e4a6bd6cce6830410cddf7a23a3ecceec32196d2b63cb931520aba6b8109ee8ab054fb6ccfed3b49c3474caa297f94a6911","role":"employee"}}' WHERE id = '41c9d565-270b-414b-9ad4-0e2e8046243d'; -- was staff.fin@ptpgp.co.id (Mega Puspita, SE, Staff Finance (AP/AR))
UPDATE karyawan SET email = 'dian.permata@ptpgp.co.id', address = '{"__auth__":{"password_hash":"6176acfab55b6751e49dd85ec4324da1:e03edc81363f231cba8827eb00cdcbb8b1842d210eedcb3ce4d76147115cda8b00695c32337fca58d16b915725283b60f066096fd8d9436622a4044eae971c4b","role":"employee"}}' WHERE id = '60e875bf-c98b-42eb-b4ea-c89cda9f5c5b'; -- was staff.acc@ptpgp.co.id (Ahmad Dahlan, A.Md.Ak., Staff Accounting)
UPDATE karyawan SET email = 'rudi.hartono@ptpgp.co.id', address = '{"__auth__":{"password_hash":"7132659d80f94d22acd748483b28a650:854ad0f3fe627b200c8f2489763efac6182039240d930b7dd601f08e4530d43790cd58259594d7c36fc872f76488f5557cc6674af02cb13ccd26107cbb7eab1b","role":"employee"}}' WHERE id = '7b67ea04-885e-47bf-9d0e-3c2711ced146'; -- was spv.finance@ptpgp.co.id (Yuni Hartati, SE, Supervisor Finance)
UPDATE karyawan SET email = 'maya.sari@ptpgp.co.id', address = '{"__auth__":{"password_hash":"234a7f86c0ef4ac1daa97d87f77edb69:1692f31af33aebf2412b6bd00bea74b67e0f11893d88719fae7c4d4e9c23f2ce56e51820a012aebed6207582694450852b559c29857be28e8a36743e7a2b6c2c","role":"employee"}}' WHERE id = '04ad3b78-d023-4b42-987f-19d75c2694e0'; -- was gm.finance@ptpgp.co.id (Lina Marlina, SE, Ak., General Manager Finance)

-- Manager: Divisi Operasional (Dedi Kurniawan, S.E.)
UPDATE pengguna SET email = 'operational@ptpgp.co.id', password_hash = '5197a3fc8603462828fc36c8ba2bf2f6:bc3d4609162c4532d48d83f002f46f6ecbf154c5207bcb6c6a5facc8d1135ae3c889ecbe93d4a13e9c3eb1bd2097ae35e89b8b429a0ca918c3190cca836342e1' WHERE email = 'gm.ops@ptpgp.co.id';
UPDATE karyawan SET email = 'operational@ptpgp.co.id' WHERE email = 'gm.ops@ptpgp.co.id';

-- Employees: Divisi Operasional
UPDATE karyawan SET email = 'bambang.sutrisno@ptpgp.co.id', address = '{"__auth__":{"password_hash":"631c66b5c935aebb9c8f5b840f87e059:4f9dac074082606bd6e28edef1e63739504e0071f3570b360f1d99d9f5f825c0ce7964f3d6dd2bfff1426b96bb9505af1be42f390e7ec50f433da312d36801d8","role":"employee"}}' WHERE id = '8dd83130-c324-4f26-8c0f-7f9b9c7ac548'; -- was staff.cs@ptpgp.co.id (Fitri Andriani, Customer Service Ekspor-Impor)
UPDATE karyawan SET email = 'slamet.riyadi@ptpgp.co.id', address = '{"__auth__":{"password_hash":"b694a27c61b2454a98235a139f4e8ee3:de25d39eaa2a2412f7e8456368fad172fbf1768e6bd1ea8bf333f611ded826b0d6bb227dde1d5e81c3163d33499b187b596d8449cb4c0965338335dd23f07cb5","role":"employee"}}' WHERE id = '084a488f-20a1-449c-8669-a3caf8b5ad38'; -- was staff.ppjk1@ptpgp.co.id (Dian Anggraini, A.Md.Kep., Staff PPJK (PIB/PEB))
UPDATE karyawan SET email = 'agus.salim@ptpgp.co.id', address = '{"__auth__":{"password_hash":"ccbc06649709a4e0b2aa07cdf059adca:ba7d09ef01956634e4381370b9db77cbd492aa812b0eb6a25da35aaffa1e4568a8a639bc2c4961bca9622b7e62a6b2efa58f3502d8ce72c09504415af0e0adad","role":"employee"}}' WHERE id = '94b14480-813c-422b-a18a-9a868d928294'; -- was staff.gudang2@ptpgp.co.id (Jumadi, Staff Administrasi Gudang)
UPDATE karyawan SET email = 'supriyanto@ptpgp.co.id', address = '{"__auth__":{"password_hash":"0515ad5a14ede986e0928853eaad17a9:752355cf761de63cb8717d500303302f40483fc76f74ffef9c7c7d9ab573bf811f69a7c1cb481d019b5a0c711ed63c59e1ce6f11490175fbd1c01b1582506a83","role":"employee"}}' WHERE id = 'c733f12d-d530-41f1-9102-cbb7725d3dc7'; -- was staff.ppjk2@ptpgp.co.id (Rina Karlina, Staff PPJK (Dokumentasi))
UPDATE karyawan SET email = 'joko.widodo@ptpgp.co.id', address = '{"__auth__":{"password_hash":"e22dcabc079cafb20c865253c676db0d:4c2cd0daa49e42ef85083e2f2ea6659fcff49af8ac17a36dffeea16b5282ab7f43bbd45b400c68e0bbc1c90e5aff9b08941a9532f40886d22ae281c201645342","role":"employee"}}' WHERE id = '2273d84a-2f07-4aac-a63c-bda3106609fc'; -- was supir2@ptpgp.co.id (Rahmat Hidayat, Supir Truk / Driver)
UPDATE karyawan SET email = 'yanto.hermawan@ptpgp.co.id', address = '{"__auth__":{"password_hash":"44276ff9e298d12948422d236e541dba:5e7801518745701643ac36c46b462a6e71776eb071368324a60211876fe2776c3a07ec25b2deaafbec029cc48e186e50ffb01cce38d56ee490b7d53415e7b4f4","role":"employee"}}' WHERE id = 'cd8c4c42-5820-4629-ae5b-d12a2749b7e0'; -- was staff.gudang1@ptpgp.co.id (Suparman, Staff Gudang (Bongkar Muat))
UPDATE karyawan SET email = 'tri.handoko@ptpgp.co.id', address = '{"__auth__":{"password_hash":"454c23031821cf8838f9d22bb2389d6e:ca2ae174616c65615972545a139038ef24bbfee53bfd630b531e4a3f0ad6e643107bf952320d4bda1607115ef44efddfafa26cf9bc4021379e349f14eb949089","role":"employee"}}' WHERE id = '90d07a82-875f-4452-a4d9-d0e70ab1399e'; -- was supir3@ptpgp.co.id (Udin Samsudin, Supir Truk / Driver)
UPDATE karyawan SET email = 'eko.prasetyo@ptpgp.co.id', address = '{"__auth__":{"password_hash":"27d90146916e840f56a1626fdb89d4bb:d3ab2ef7a3ef6ed81fa70ea5a1b32c43518ada2402e0202a3b6e737574533100912ab103536eb126189bbdab1e885a9d1255a2887113cc214133e58e4b0c870b","role":"employee"}}' WHERE id = '84e6ada3-cef3-4cd7-88a4-939165af3e40'; -- was supir1@ptpgp.co.id (Agus Salim, Supir Truk / Driver)

-- Manager: Divisi SCM / Procurement (Rangga Maulana)
UPDATE pengguna SET email = 'procurement@ptpgp.co.id', password_hash = '7db796d2ea2fbcbabc42cd7d1f227e33:d65ac7fff41407b77d28f13a55b3b6716a418edd57c196c4302e060e2defb339e625fc6303df45ae7ca067e39c7cf6a773b390d5cc3f984630cbce40c40c0862' WHERE email = 'mgr.proc@ptpgp.co.id';
UPDATE karyawan SET email = 'procurement@ptpgp.co.id' WHERE email = 'mgr.proc@ptpgp.co.id';

-- Employees: Divisi SCM / Procurement
UPDATE karyawan SET email = 'retno.wulandari@ptpgp.co.id', address = '{"__auth__":{"password_hash":"109b6ffae1ef2181815b16bb7a7fa1ff:3be36fdb521353d12a696421758f60246cfd9280d886475ca416a218af1cf6af812d2cd9fb6e4b30992b7cbfcfc26cecae8bd645eaa3f8ddfc079edf810eb334","role":"employee"}}' WHERE id = '3a909a7f-9eea-4813-9ca1-c2872ae77e33'; -- was staff.proc1@ptpgp.co.id (Aldo Firmansyah, Staff Procurement (Sourcing))
UPDATE karyawan SET email = 'yudi.setiawan@ptpgp.co.id', address = '{"__auth__":{"password_hash":"bfa91f1c4baace6910c709aa06b3877a:6faff4821f6163fc563169b258e10bdedcaf3d29f419e8d693a131766da7de922d6a94e7068db4e0c0d515e3a6ba4ec328105412f9073c83b6c2fa646b0fb1b0","role":"employee"}}' WHERE id = '1d720408-393d-4f7a-98df-fd2927574ab9'; -- was staff.proc2@ptpgp.co.id (Desi Ratnasari, Staff Procurement (PO))

-- Manager: Divisi Project Appraisal & QC (Yuni Astuti, ST)
UPDATE pengguna SET email = 'projectappraisal@ptpgp.co.id', password_hash = '92e98061458e2ca5acd601d86a5622be:66dc4a877b97b87ba4f96e6c7625a80f9fac6137a19516557332d34f48335e92a1ab5c1f6a179d6d4fbeb47dbf8f8b948e6c67ffd863078077709484c2be2ef8' WHERE email = 'mgr.qc@ptpgp.co.id';
UPDATE karyawan SET email = 'projectappraisal@ptpgp.co.id' WHERE email = 'mgr.qc@ptpgp.co.id';

-- Employees: Divisi Project Appraisal & QC
UPDATE karyawan SET email = 'galih.aditya@ptpgp.co.id', address = '{"__auth__":{"password_hash":"19dea9ecfa6cb3a92e4c3fbc7c7dec5f:625ad46bf7b424d650361ce02b32f9f8fd81f6897721d85ca4d6a64a171883bb69478b58f3fa201e941195d3889eb54a4aec47308c269bf3ae73d84a2431cc6d","role":"employee"}}' WHERE id = '156b551c-86e4-4bf2-891c-22b2b1ec23d2'; -- was staff.pa1@ptpgp.co.id (Bayu Setyawan, SE, Project Appraisal Analyst)
UPDATE karyawan SET email = 'fitriani.rahayu@ptpgp.co.id', address = '{"__auth__":{"password_hash":"2635e35e943fe2544f608b5f4ce1bb82:e439e68574017bbd0a669238890370aec475b29636e0c862614104e66c8391b64bc5ac904cd53f13235fa0c33f3379c985c7189659a77a8b42afd705d383556f","role":"employee"}}' WHERE id = '0a2bf303-eedb-4bab-8d48-cc37a623e409'; -- was staff.qc@ptpgp.co.id (Nurul Hikmah, A.Md.T, QC Inspector)
UPDATE karyawan SET email = 'doni.saputra@ptpgp.co.id', address = '{"__auth__":{"password_hash":"983a1f14a5fbb26d957b4116fd4b8abd:c352fef06e0292ad5bfcd5f061678ef06f9c0c7449538b4b2dd9f17b0f2c6dcf1d976967b8bfebec54f56fcecdacebbc65f8ed462d3f28ac92b2715462eb9118","role":"employee"}}' WHERE id = '2da627be-bea4-4bf7-8033-f549af351b2c'; -- was gm.pa@ptpgp.co.id (Arief Rachman, ST, General Manager Project Appraisal)

-- Manager: Divisi MR (Mulyadi Kurniawan)
UPDATE pengguna SET email = 'mr@ptpgp.co.id', password_hash = '0835320df86b16ca09c6624c9d5065d6:db24d37c865a247878269274396e26fbd04079cb24d3cd14422777b526035dc1546d6c784edce2d0d715d414b24529f5ecf843ed522699eef77234636cbcc9f7' WHERE email = 'mgr.mr@ptpgp.co.id';
UPDATE karyawan SET email = 'mr@ptpgp.co.id' WHERE email = 'mgr.mr@ptpgp.co.id';

-- Employees: Divisi MR
UPDATE karyawan SET email = 'yuni.astuti@ptpgp.co.id', address = '{"__auth__":{"password_hash":"d81219bceba15552dcce547b53fb4dd1:daf9d7326fdbb651602a3aa4036e4301e0863e912d47e3fcb2a5fee1023d5516ab0de9148e0f4b68ac5fa02c173f1071116639dec5a2393a3c76900205b724aa","role":"employee"}}' WHERE id = '1bab4c18-f236-41a8-b467-d6976845d132'; -- was staff.mr@ptpgp.co.id (Sinta Amelia, MR Coordinator)

-- Manager: Divisi HSE (Agus Triyono, ST)
UPDATE pengguna SET email = 'hse@ptpgp.co.id', password_hash = '2b7bfc84b5be799d972441f8024e1680:5a81c06fa66b2b9efc5c212c4af0c7c50220a80e19928df13c3cef2a96d9d024f57dfd1459efb681ae23032bb401adaa81c33da07b14a59c83f4a011e481a621' WHERE email = 'mgr.hse@ptpgp.co.id';
UPDATE karyawan SET email = 'hse@ptpgp.co.id' WHERE email = 'mgr.hse@ptpgp.co.id';

-- Employees: Divisi HSE
UPDATE karyawan SET email = 'rizky.pratama@ptpgp.co.id', address = '{"__auth__":{"password_hash":"2822d3d537db1f9a1905bacd89856d3c:44ff1d8a027c1cab447eb8d34b73c75e1e3b2d72523f28f0f33c4d79b4594ce10b761f9ab43be34ca1d50402b9efc7b16bf7170d996ba0b7f4ac431087de134a","role":"employee"}}' WHERE id = '724921dc-337e-4ee5-8db7-2059760ab473'; -- was staff.hse1@ptpgp.co.id (Dimas Prasetya, HSE Officer)
UPDATE karyawan SET email = 'nina.kusuma@ptpgp.co.id', address = '{"__auth__":{"password_hash":"8cd6214d99a7cecf37673a63bfe3a353:8617b9f217bfd6d022e168d89f9a5dac62c503ba19671ef135ad17ef3294164999442da1390aebbd084a68b63c7bf89ff10149c81821f5d6c539325e2ae519ce","role":"employee"}}' WHERE id = '4dab8aa9-6b29-4df2-ae85-4f8720783255'; -- was staff.hse2@ptpgp.co.id (Maya Sari Dewi, Safety Inspector)