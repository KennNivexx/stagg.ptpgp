import { getShiftsData } from "@/app/actions/infrastructure";
import ShiftsClient from "./ShiftsClient";

export default async function ManajemenShiftKerja() {
  const { shifts, employees } = await getShiftsData();

  return <ShiftsClient initialShifts={shifts} employees={employees} />;
}
