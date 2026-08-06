"use client";

import { useRef, useState } from "react";
import { Eye, Download, RefreshCw } from "lucide-react";
import PayslipTemplate, { type PayslipData } from "./PayslipTemplate";

export default function PayslipActions({ slipId }: { slipId: string }) {
  const [exporting, setExporting] = useState(false);
  const [pdfData, setPdfData] = useState<PayslipData | null>(null);
  const [error, setError] = useState("");
  const captureRef = useRef<HTMLDivElement>(null);

  const handleView = () => {
    window.open(`/api/payslip/${slipId}`, "_blank");
  };

  const handleDownload = async () => {
    setExporting(true);
    setError("");
    try {
      const res = await fetch(`/api/payslip/${slipId}?format=json`);
      if (!res.ok) throw new Error("Gagal mengambil data slip.");
      const { slip, karyawan } = await res.json();

      const QRCode = (await import("qrcode")).default;
      const verifyUrl = `${window.location.origin}/api/payslip/${slipId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 144, margin: 1 });

      setPdfData({ slip, karyawan, qrDataUrl });
      // Render happens synchronously into the hidden div below on this
      // state update; wait a tick for the DOM (and the logo/QR <img> tags)
      // to actually paint before screenshotting it.
      await new Promise((r) => setTimeout(r, 150));
      if (!captureRef.current) throw new Error("Render gagal.");

      const { toPng } = await import("html-to-image");
      const jsPDF = (await import("jspdf")).default;
      const dataUrl = await toPng(captureRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
      const img = new window.Image();
      img.src = dataUrl;
      await new Promise<void>((r) => { img.onload = () => r(); });
      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "px", format: [img.width, img.height],
      });
      pdf.addImage(img, "PNG", 0, 0, img.width, img.height);
      const monthNames = ["", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
      pdf.save(`slip-gaji-${monthNames[Number(slip.month)] || slip.month}-${slip.year}.pdf`);
    } catch (err) {
      console.error("[payslip] PDF export failed:", err);
      setError("Gagal membuat PDF. Coba lagi atau gunakan 'Lihat' lalu cetak dari browser.");
    } finally {
      setExporting(false);
      setPdfData(null);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleView}
          className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
        >
          <Eye size={11} /> Lihat
        </button>
        <button
          onClick={handleDownload}
          disabled={exporting}
          className="px-3 py-1.5 text-[10px] font-bold bg-[#0F172A] text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 disabled:opacity-60"
        >
          {exporting ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />} {exporting ? "Membuat PDF..." : "Unduh PDF"}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1.5">{error}</p>}

      {/* Off-screen render target for the PDF screenshot — see handleDownload.
          Positioned off-canvas rather than display:none, since some browsers
          skip layout/paint (and html-to-image needs both) for display:none content. */}
      {pdfData && (
        <div style={{ position: "fixed", top: 0, left: -9999, zIndex: -1 }}>
          <div ref={captureRef}>
            <PayslipTemplate slip={pdfData.slip} karyawan={pdfData.karyawan} qrDataUrl={pdfData.qrDataUrl} />
          </div>
        </div>
      )}
    </div>
  );
}
