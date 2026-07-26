import { Calendar, Wallet } from "lucide-react";
import HubTabs from "@/components/hrd/HubTabs";
import LeavesClient from "./LeavesClient";
import SaldoCutiPage from "../workforce-time/leave-balance/page";

export const dynamic = "force-dynamic";
// Hub page for "Cuti & Saldo Cuti" — merges the former separate /hrd/leaves
// and /hrd/workforce-time/leave-balance routes into one page with tabs (see
// src/components/hrd/HubTabs.tsx). Neither tab does server-side data
// fetching (both are self-contained client components that fetch via
// useEffect), so this hub needs no await — the original leaves page logic
// was extracted verbatim into LeavesClient so the hub itself can stay a
// Server Component; SaldoCutiPage is embedded directly untouched. The
// original route files remain intact for anyone navigating to them directly.
export default function LeavesPage() {
  return (
    <div className="p-6 lg:p-8">
      <HubTabs
        tabs={[
          { id: "leaves", label: "Cuti & Izin", icon: <Calendar size={14} />, content: <LeavesClient /> },
          { id: "leave-balance", label: "Saldo Cuti", icon: <Wallet size={14} />, content: <SaldoCutiPage /> },
        ]}
        defaultTab="leaves"
      />
    </div>
  );
}
