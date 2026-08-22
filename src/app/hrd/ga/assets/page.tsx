import { getAssets, getAssetRepairRequests } from "@/app/actions/ga-assets";
import { requireAuth } from "@/lib/auth-guard";
import AssetsClient from "./AssetsClient";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";

export default async function AssetsPage() {
  const [{ role }, assets, repairRequests] = await Promise.all([requireAuth(), getAssets(), getAssetRepairRequests()]);
  return (
    <>
      <AssetsClient initialAssets={assets} initialRepairRequests={repairRequests} currentRole={role} />
      <div className="px-6 lg:px-8 pb-6 lg:pb-8">
        <SectionQuickLinks groupLabel="Aset & Fasilitas" onlySection="General Affair" excludeHref="/hrd/ga/assets" />
      </div>
    </>
  );
}
