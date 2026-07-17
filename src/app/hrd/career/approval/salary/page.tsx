import { getSalaryReviews } from "@/app/actions/rewards";
import SalaryApprovalClient from "./SalaryApprovalClient";

export default async function SalaryApprovalPage() {
  const rows = await getSalaryReviews();
  return <SalaryApprovalClient initialRows={rows as never} />;
}
