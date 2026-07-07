import { getShiftsDataForDept } from "@/app/actions/infrastructure";
import DeptShiftsClient from "./DeptShiftsClient";

export default async function DeptShiftsPage() {
  const data = await getShiftsDataForDept();

  return (
    <DeptShiftsClient
      shifts={data.shifts}
      employees={data.employees}
      department={data.department}
    />
  );
}
