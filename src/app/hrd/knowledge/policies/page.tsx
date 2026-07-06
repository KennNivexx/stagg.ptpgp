import { getPolicies } from "@/app/actions/knowledge";
import PoliciesClient from "./PoliciesClient";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const policies = await getPolicies();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Kebijakan Perusahaan</h1>
        <p className="text-sm text-gray-500">Kebijakan dan aturan resmi PT Pratama Galuh Perkasa. Klik kartu untuk membaca kebijakan lengkap.</p>
      </div>
      <PoliciesClient initialPolicies={policies} />
    </div>
  );
}
