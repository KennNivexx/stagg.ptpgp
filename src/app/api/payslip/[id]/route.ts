import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifySession(sessionToken);
  if (!session?.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: slip } = await supabaseAdmin
    .from("payroll")
    .select("*, employees!inner(full_name, email, department, position, employee_code)")
    .eq("id", id)
    .single();

  if (!slip) return NextResponse.json({ error: "Slip tidak ditemukan." }, { status: 404 });

  const s = slip as Record<string, unknown>;
  const emp = s.employees as Record<string, unknown>;

  // Authorization: HRD/superadmin (payroll admins) may view any payslip; an
  // employee may view ONLY their own. Every other role — applicant,
  // department_manager, director — has no business reading raw salary data,
  // so they are rejected even though they hold a valid session.
  const role = (session.role || "").toLowerCase();
  const isPayrollAdmin = role === "hrd" || role === "superadmin";
  const isOwner = role === "employee" && session.email === emp.email;
  if (!isPayrollAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const bulan = monthNames[Number(s.month)] || "-";
  const tahun = String(s.year || "");

  const fmt = (n: unknown) => "Rp " + (Number(n) || 0).toLocaleString("id-ID");

  // Escape any DB-sourced string before interpolating into HTML. Employee names
  // can originate from the public application form, so they are untrusted and
  // could otherwise inject markup/script (stored XSS) into this rendered page.
  const esc = (v: unknown) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<title>Slip Gaji ${bulan} ${esc(tahun)} — ${esc(emp.full_name)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a2530; margin: 0; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #CC0000; padding-bottom: 16px; margin-bottom: 20px; }
  .company { font-size: 16px; font-weight: bold; color: #CC0000; }
  .sub { font-size: 11px; color: #666; margin-top: 2px; }
  h2 { font-size: 14px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  td { padding: 5px 8px; vertical-align: top; }
  td:last-child { text-align: right; }
  .section-title { font-weight: bold; background: #f1f5f9; padding: 6px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .total-row td { font-weight: bold; border-top: 2px solid #1a2530; padding-top: 8px; }
  .net-row td { font-weight: bold; font-size: 14px; color: #CC0000; border-top: 2px solid #CC0000; padding-top: 8px; }
  .footer { margin-top: 32px; display: flex; justify-content: space-between; }
  .sign-box { text-align: center; }
  .sign-line { border-top: 1px solid #333; width: 160px; margin: 48px auto 4px; }
  @media print { button { display: none !important; } body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="company">PT PRATAMA GALUH PERKASA</div>
    <div class="sub">Human Resource Information System</div>
  </div>
  <div style="text-align:right">
    <div style="font-weight:bold">SLIP GAJI</div>
    <div class="sub">Periode: ${bulan} ${esc(tahun)}</div>
  </div>
</div>

<h2>Informasi Karyawan</h2>
<table>
  <tr><td style="width:40%;color:#666">Nama Karyawan</td><td>${esc(emp.full_name)}</td></tr>
  <tr><td style="color:#666">Kode Karyawan</td><td>${esc(emp.employee_code || "-")}</td></tr>
  <tr><td style="color:#666">Departemen</td><td>${esc(emp.department)}</td></tr>
  <tr><td style="color:#666">Jabatan</td><td>${esc(emp.position)}</td></tr>
</table>

<h2>Rincian Gaji</h2>
<table>
  <tr><td colspan="2" class="section-title">Pendapatan</td></tr>
  <tr><td>Gaji Pokok</td><td>${fmt(s.basic_salary)}</td></tr>
  <tr><td>Tunjangan</td><td>${fmt(s.allowances)}</td></tr>
  ${s.overtime_pay ? `<tr><td>Lembur</td><td>${fmt(s.overtime_pay)}</td></tr>` : ""}
  ${s.bonus ? `<tr><td>Bonus</td><td>${fmt(s.bonus)}</td></tr>` : ""}
  <tr class="total-row"><td>Total Pendapatan</td><td>${fmt((Number(s.basic_salary) || 0) + (Number(s.allowances) || 0) + (Number(s.overtime_pay) || 0) + (Number(s.bonus) || 0))}</td></tr>

  <tr><td colspan="2" class="section-title" style="margin-top:8px">Potongan</td></tr>
  <tr><td>BPJS Kesehatan</td><td>${fmt(s.bpjs_health)}</td></tr>
  <tr><td>BPJS Ketenagakerjaan</td><td>${fmt(s.bpjs_employment)}</td></tr>
  ${s.tax ? `<tr><td>PPh 21</td><td>${fmt(s.tax)}</td></tr>` : ""}
  ${s.deductions ? `<tr><td>Potongan Lain</td><td>${fmt(s.deductions)}</td></tr>` : ""}
  <tr class="total-row"><td>Total Potongan</td><td>${fmt((Number(s.bpjs_health) || 0) + (Number(s.bpjs_employment) || 0) + (Number(s.tax) || 0) + (Number(s.deductions) || 0))}</td></tr>

  <tr class="net-row"><td>GAJI BERSIH</td><td>${fmt(s.net_salary)}</td></tr>
</table>

<div class="footer">
  <div class="sign-box">
    <div class="sign-line"></div>
    <div>Penerima</div>
    <div style="color:#666;font-size:10px">${esc(emp.full_name)}</div>
  </div>
  <div class="sign-box">
    <div class="sign-line"></div>
    <div>HRD & Payroll</div>
    <div style="color:#666;font-size:10px">PT Pratama Galuh Perkasa</div>
  </div>
</div>

<div style="margin-top:24px;text-align:center">
  <button onclick="window.print()" style="padding:8px 24px;background:#CC0000;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:bold;cursor:pointer">
    Cetak / Simpan PDF
  </button>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
