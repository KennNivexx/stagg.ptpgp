import { getAssets, getAssetRepairRequests } from "@/app/actions/ga-assets";
import { requireAuth } from "@/lib/auth-guard";
import AssetsClient from "./AssetsClient";

export default async function AssetsPage() {
  const [{ role }, assets, repairRequests] = await Promise.all([requireAuth(), getAssets(), getAssetRepairRequests()]);
  return <AssetsClient initialAssets={assets} initialRepairRequests={repairRequests} currentRole={role} />;
}
