import { getInfrastruktur, getMaintenanceRequests } from "@/app/actions/ga-infrastruktur";
import InfrastrukturClient from "./InfrastrukturClient";

export default async function InfrastrukturPage() {
  const [infrastruktur, maintenance] = await Promise.all([getInfrastruktur(), getMaintenanceRequests()]);
  return <InfrastrukturClient initialInfrastruktur={infrastruktur} initialMaintenance={maintenance} />;
}
