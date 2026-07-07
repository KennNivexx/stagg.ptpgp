import { getDepartmentRequests } from "@/app/actions/org";
import DirectorDepartmentsClient, { DepartmentRequest } from "./DirectorDepartmentsClient";

export default async function DirectorDepartmentsPage() {
  const requests = await getDepartmentRequests();

  return <DirectorDepartmentsClient requests={requests as DepartmentRequest[]} />;
}
