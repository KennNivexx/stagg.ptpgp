import { getLocationsDataForDept } from "@/app/actions/infrastructure";
import DeptLocationsClient from "./DeptLocationsClient";

export default async function DeptLocationsPage() {
  const data = await getLocationsDataForDept();

  return (
    <DeptLocationsClient
      locations={data.locations}
      employees={data.employees}
      department={data.department}
    />
  );
}
