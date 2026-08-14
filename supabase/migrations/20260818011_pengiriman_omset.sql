-- Pengiriman & Omset module. This HRIS previously had ZERO revenue/shipment/
-- billing data anywhere (confirmed: no omset/revenue/invoice/tarif/billing
-- column in any of the prior 139 migrations) — every "financial-sounding"
-- figure in this app was actually payroll COST, never company income. This
-- table is the first real revenue source: staff log each completed
-- shipment's billed value, and src/app/actions/pengiriman.ts's
-- getFinancialSummary() nets it against real cost data already in the
-- system (payroll gross_salary, driver trip incentives, business trip cost)
-- to produce an actual Laba/Rugi (P&L) figure.
--
-- dicatat_oleh is stored as plain name/email text, NOT a FK to karyawan(id)
-- — the session actor's id (from requireRole()) is pengguna.id, a different
-- id space than karyawan.id in this codebase, so a FK there would silently
-- point at the wrong table's rows. Same convention already used by
-- perjalanan_dinas.employee_name.
--
-- status exists only so a mis-entered row can be voided (excluded from
-- getFinancialSummary's sum) without deleting history — no approval chain,
-- this mirrors trips.ts's simple HRD/superadmin-gated CRUD shape, not the
-- multi-step leave/hiring approval pattern.
--
-- estimasi_biaya on perjalanan_dinas is a new, nullable column — this table
-- had NO monetary field at all before (confirmed via full read of
-- business-trips.ts). Adding it lets business-trip cost start contributing
-- to Laba/Rugi going forward; it does not retroactively cost past trips.
-- Apply via: Supabase Dashboard > SQL Editor

create table if not exists pengiriman (
  id uuid primary key default gen_random_uuid(),
  klien text not null,
  tujuan text not null,
  tanggal date not null,
  nilai_omset numeric not null default 0 check (nilai_omset >= 0),
  deskripsi text,
  status text not null default 'Selesai' check (status in ('Selesai', 'Dibatalkan')),
  dicatat_oleh_nama text,
  dicatat_oleh_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pengiriman_tanggal on pengiriman(tanggal);
create index if not exists idx_pengiriman_status on pengiriman(status);

alter table perjalanan_dinas add column if not exists estimasi_biaya numeric;
