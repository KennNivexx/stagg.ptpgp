import { getEmployees } from "@/app/actions/hrd";
import RecruitmentClient from "./RecruitmentClient";

export default async function RecruitmentPage() {
  const employees = await getEmployees();
  const totalEmployees = employees.length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Lowongan Kerja</h1>
        <p className="text-sm text-gray-500">Kelola lowongan pekerjaan dan rekrut kandidat baru.</p>
      </div>

      <RecruitmentClient totalEmployees={totalEmployees} />
    </div>
  );
}
