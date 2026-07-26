import { ArrowRightLeft, TrendingUp, RefreshCw, TrendingDown, UserCog, Clock, Crown } from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";

import TransactionPromotionPage from "./promotion/page";
import MutationsPage from "../mutations/page";
import TransactionRotationPage from "./rotation/page";
import TransactionDemotionPage from "./demotion/page";
import TransactionActingPage from "./acting/page";
import TransactionTemporaryPage from "./temporary/page";
import TransactionSuccessionPage from "./succession/page";

export const dynamic = "force-dynamic";
// Hub page merging the 7 "Transaksi Karier" routes into a single tabbed
// page. Each tab embeds the original route's own async Server Component
// output unchanged.
export default async function CareerTransactionsHubPage() {
  const tabs: HubTab[] = [
    { id: "promotion", label: "Promosi", icon: <TrendingUp size={14} />, content: await TransactionPromotionPage() },
    { id: "mutation", label: "Mutasi", icon: <RefreshCw size={14} />, content: await MutationsPage() },
    { id: "rotation", label: "Rotasi", icon: <ArrowRightLeft size={14} />, content: await TransactionRotationPage() },
    { id: "demotion", label: "Demosi", icon: <TrendingDown size={14} />, content: await TransactionDemotionPage() },
    { id: "acting", label: "Acting Assignment", icon: <UserCog size={14} />, content: await TransactionActingPage() },
    { id: "temporary", label: "Temporary Assignment", icon: <Clock size={14} />, content: await TransactionTemporaryPage() },
    { id: "succession", label: "Succession Assignment", icon: <Crown size={14} />, content: await TransactionSuccessionPage() },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A2530] mb-2 flex items-center gap-3">
          <ArrowRightLeft className="text-fuchsia-600" />
          Transaksi & Pergerakan Karier
        </h1>
        <p className="text-sm text-gray-500">
          Kelola pengajuan promosi, mutasi, rotasi, demosi, dan penugasan khusus karyawan beserta alur persetujuannya.
        </p>
      </div>
      <HubTabs tabs={tabs} defaultTab="promotion" />
    </div>
  );
}
