import { getSurveys } from "@/app/actions/relations";
import SurveysClient from "./SurveysClient";

export default async function SurveiKaryawan() {
  const surveys = await getSurveys().catch(() => []);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Survei Karyawan</h1>
        <p className="text-sm text-gray-500">Buat dan kelola survei engagement, kepuasan, dan feedback karyawan.</p>
      </div>
      <SurveysClient initialSurveys={surveys as Parameters<typeof SurveysClient>[0]["initialSurveys"]} />
    </div>
  );
}
