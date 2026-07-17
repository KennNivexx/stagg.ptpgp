import { getCareerCommitteeApprovals } from "@/app/actions/career-development";
import CareerApprovalClient from "@/components/hrd/CareerApprovalClient";

export default async function CareerCommitteePage() {
  const rows = await getCareerCommitteeApprovals();
  return <CareerApprovalClient title="Career Committee" description="Langkah persetujuan level komite untuk transaksi karier yang memerlukan tinjauan bersama." initialRows={rows as never} />;
}
