const MONTH_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function fmt(n: unknown) { return "Rp " + (Number(n) || 0).toLocaleString("id-ID"); }

export interface PayslipData {
  slip: Record<string, unknown>;
  karyawan: Record<string, unknown>;
  qrDataUrl: string;
}

/** Off-screen render target for the real PDF export (see PayslipActions.tsx
 * — captured via html-to-image's toPng() then jsPDF.addImage(), the same
 * pattern already proven in OrgStructureClient.tsx's org-chart export).
 * Mirrors the HTML template in src/app/api/payslip/[id]/route.ts field for
 * field, plus the company logo and a verification QR code that route
 * doesn't render (that one stays print-to-PDF via the browser for "Lihat"). */
export default function PayslipTemplate({ slip: s, karyawan: emp, qrDataUrl }: PayslipData) {
  const bulan = MONTH_NAMES[Number(s.month)] || "-";
  const tahun = String(s.year || "");
  const totalPendapatan = (Number(s.basic_salary) || 0) + (Number(s.allowances) || 0) + (Number(s.overtime_pay) || 0) + (Number(s.attendance_allowance) || 0) + (Number(s.bonus) || 0);
  const totalPotongan = (Number(s.bpjs_health) || 0) + (Number(s.bpjs_employment) || 0) + (Number(s.tax) || 0) + (Number(s.late_deduction) || 0) + (Number(s.absent_deduction) || 0) + (Number(s.deductions) || 0);

  return (
    <div style={{ width: 700, padding: 32, fontFamily: "Arial, sans-serif", fontSize: 12, color: "#1a2530", background: "#ffffff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #CC0000", paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- captured via html-to-image, next/image's lazy/blob handling doesn't play well with the screenshot pattern */}
          <img src="/images/logo.png" alt="Logo" style={{ height: 40, width: "auto" }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#CC0000" }}>PT PRATAMA GALUH PERKASA</div>
            <div style={{ fontSize: 11, color: "#666" }}>Human Resource Information System</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>SLIP GAJI</div>
          <div style={{ fontSize: 11, color: "#666" }}>Periode: {bulan} {tahun}</div>
          {(s.transfer_date as string) && <div style={{ fontSize: 11, color: "#666" }}>Dibayar: {new Date(s.transfer_date as string).toLocaleDateString("id-ID")}</div>}
        </div>
      </div>

      <h2 style={{ fontSize: 14, margin: "0 0 12px" }}>Informasi Karyawan</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <tbody>
          <tr><td style={{ width: "40%", color: "#666", padding: "5px 8px" }}>Nama Karyawan</td><td style={{ padding: "5px 8px" }}>{String(emp.full_name || "")}</td></tr>
          <tr><td style={{ color: "#666", padding: "5px 8px" }}>Kode Karyawan</td><td style={{ padding: "5px 8px" }}>{String(emp.employee_code || "-")}</td></tr>
          <tr><td style={{ color: "#666", padding: "5px 8px" }}>Departemen</td><td style={{ padding: "5px 8px" }}>{String(emp.department || "")}</td></tr>
          <tr><td style={{ color: "#666", padding: "5px 8px" }}>Jabatan</td><td style={{ padding: "5px 8px" }}>{String(emp.position || "")}</td></tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: 14, margin: "0 0 12px" }}>Rincian Gaji</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <tbody>
          <tr><td colSpan={2} style={{ fontWeight: 700, background: "#f1f5f9", padding: "6px 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pendapatan</td></tr>
          <tr><td style={{ padding: "5px 8px" }}>Gaji Pokok</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.basic_salary)}</td></tr>
          <tr><td style={{ padding: "5px 8px" }}>Tunjangan</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.allowances)}</td></tr>
          {!!s.overtime_pay && <tr><td style={{ padding: "5px 8px" }}>Lembur</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.overtime_pay)}</td></tr>}
          {!!s.attendance_allowance && <tr><td style={{ padding: "5px 8px" }}>Tunjangan Kehadiran</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.attendance_allowance)}</td></tr>}
          {!!s.bonus && <tr><td style={{ padding: "5px 8px" }}>Bonus</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.bonus)}</td></tr>}
          <tr><td style={{ fontWeight: 700, borderTop: "2px solid #1a2530", padding: "8px" }}>Total Pendapatan</td><td style={{ fontWeight: 700, borderTop: "2px solid #1a2530", padding: "8px", textAlign: "right" }}>{fmt(totalPendapatan)}</td></tr>

          <tr><td colSpan={2} style={{ fontWeight: 700, background: "#f1f5f9", padding: "6px 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Potongan</td></tr>
          <tr><td style={{ padding: "5px 8px" }}>BPJS Kesehatan</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.bpjs_health)}</td></tr>
          <tr><td style={{ padding: "5px 8px" }}>BPJS Ketenagakerjaan</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.bpjs_employment)}</td></tr>
          {!!s.tax && <tr><td style={{ padding: "5px 8px" }}>PPh 21</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.tax)}</td></tr>}
          {!!s.late_deduction && <tr><td style={{ padding: "5px 8px" }}>Potongan Keterlambatan</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.late_deduction)}</td></tr>}
          {!!s.absent_deduction && <tr><td style={{ padding: "5px 8px" }}>Potongan Ketidakhadiran</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.absent_deduction)}</td></tr>}
          {!!s.deductions && <tr><td style={{ padding: "5px 8px" }}>Potongan Lain (Kasbon/Amal Jariyah)</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(s.deductions)}</td></tr>}
          <tr><td style={{ fontWeight: 700, borderTop: "2px solid #1a2530", padding: "8px" }}>Total Potongan</td><td style={{ fontWeight: 700, borderTop: "2px solid #1a2530", padding: "8px", textAlign: "right" }}>{fmt(totalPotongan)}</td></tr>

          <tr><td style={{ fontWeight: 700, fontSize: 14, color: "#CC0000", borderTop: "2px solid #CC0000", padding: "8px" }}>GAJI BERSIH (Take Home Pay)</td><td style={{ fontWeight: 700, fontSize: 14, color: "#CC0000", borderTop: "2px solid #CC0000", padding: "8px", textAlign: "right" }}>{fmt(s.net_salary)}</td></tr>
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 32 }}>
        <div style={{ textAlign: "center" }}>
          <img src={qrDataUrl} alt="QR verifikasi" style={{ width: 72, height: 72 }} />
          <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 4 }}>Pindai untuk verifikasi</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: 160, margin: "0 auto 4px" }} />
          <div>Penerima</div>
          <div style={{ color: "#666", fontSize: 10 }}>{String(emp.full_name || "")}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: 160, margin: "0 auto 4px" }} />
          <div>HRD & Payroll</div>
          <div style={{ color: "#666", fontSize: 10 }}>PT Pratama Galuh Perkasa</div>
        </div>
      </div>
    </div>
  );
}
