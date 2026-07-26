import { getAssets, getAssetRepairRequests } from "@/app/actions/ga-assets";
import AssetsClient from "./AssetsClient";

export default async function AssetsPage() {
  const [assets, repairRequests] = await Promise.all([getAssets(), getAssetRepairRequests()]);
  return <AssetsClient initialAssets={assets} initialRepairRequests={repairRequests} />;
}
