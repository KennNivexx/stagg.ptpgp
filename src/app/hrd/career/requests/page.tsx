import { getCareerRequests } from "@/app/actions/career-hrd";
import CareerRequestsClient from "./CareerRequestsClient";

export const dynamic = "force-dynamic";

export default async function CareerRequestsPage() {
  const requests = await getCareerRequests();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Permintaan Karir Karyawan</h1>
        <p className="text-sm text-gray-500">Lamaran posisi internal dan permintaan konsultasi karir dari karyawan.</p>
      </div>
      <CareerRequestsClient initialRequests={requests as Parameters<typeof CareerRequestsClient>[0]["initialRequests"]} />
    </div>
  );
}
