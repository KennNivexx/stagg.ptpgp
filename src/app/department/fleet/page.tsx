import { getFleetLiveForDept } from "@/app/actions/vehicles";
import { getLicensesForDept } from "@/app/actions/licenses";
import FleetClient from "./FleetClient";

export default async function DeptFleetPage() {
  const [{ vehicles, department }, { licenses }] = await Promise.all([
    getFleetLiveForDept(),
    getLicensesForDept(),
  ]);

  return <FleetClient vehicles={vehicles} licenses={licenses} department={department} />;
}
