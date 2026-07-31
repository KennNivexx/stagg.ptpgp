-- Resets the password on 5 EXISTING demo accounts (one per role) to a
-- known value so you can log in and test the HRD Copilot AI across every
-- role. Password for all 5 accounts below: Demo123!
--
-- Hashes use the exact same algorithm the app's real login uses
-- (PBKDF2-SHA512, 100,000 iterations, 64-byte key, stored as "salt:hash"
-- hex) — see src/lib/auth.ts. Run this in the Supabase SQL editor.

UPDATE pengguna SET password_hash = '4490fea28b3be3c7e9a3dc6966143631:a8479144f3c555a6e3b1dfe429a728fed103123de47171fab8c3455b6faa841d2e4fdd2904b5a4961713b37f1d84cb4890b8b0a2122c2eacf058ad3dd73bdd65'
WHERE email = 'bootstrap.superadmin@ptpgp.co.id'; -- role: superadmin

UPDATE pengguna SET password_hash = 'd6147a7d1b61f26a6127f658d98af127:e0ca14dbdf0e3523f12a43b20f24ac795a376c2154d7dbcde329339369abeb49db5122e0ca98efb694ad420b985b044674aab28e84e346dffc3e2f36d6140577'
WHERE email = 'hrd@ptpgp.co.id'; -- role: hrd

UPDATE pengguna SET password_hash = 'd545214f6ed9cdd5d4c89d0ba3a77556:d14f61d69e8a8b1f4ee95518993340ad1f6401c7820f2ec8307fdc2e8fe9621274fda04242cf70700ce97c57a078b78d788f555f6ecbd843c78f5e352ed32f27'
WHERE email = 'dirut@ptpgp.co.id'; -- role: director

UPDATE pengguna SET password_hash = '21375bb1d8b4d801941b9299358763a1:c915dcea7841643b3a932df959c1dc259d236b4a26ca4a33c4db4df8f0d4154d2bf9f76d1b531e444875d5e61523eb43d54a2fa9e41717628b87bea3f8f31a0c'
WHERE email = 'mgr.hse@ptpgp.co.id'; -- role: department_manager

UPDATE pengguna SET password_hash = 'a264583274e96bc14afb33248ae0d270:618593347fa9bc0068faae39ebdc631eca2af47d14870be0c2e16e18e7f5b65e42d7b94bc1f9f17ae3715ac70643a73b5fa676cf3864d915f5b53dd9b9a3232c'
WHERE email = 'staff.qc@ptpgp.co.id'; -- role: employee

-- Verify:
-- SELECT email, role, full_name FROM pengguna
-- WHERE email IN ('bootstrap.superadmin@ptpgp.co.id','hrd@ptpgp.co.id','dirut@ptpgp.co.id','mgr.hse@ptpgp.co.id','staff.qc@ptpgp.co.id');
