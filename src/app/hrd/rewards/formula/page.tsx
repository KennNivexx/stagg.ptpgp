import { getRewardRules } from "@/app/actions/rewards";
import FormulaClient from "./FormulaClient";

export default async function RewardFormulaPage() {
  const rules = await getRewardRules().catch(() => []);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Formula Reward</h1>
        <p className="text-sm text-gray-500">Aturan otomatis untuk men-generate saran reward dari data performa, kehadiran, dan pelatihan — bukan input manual.</p>
      </div>
      <FormulaClient rules={rules as Array<Record<string, unknown>>} />
    </div>
  );
}
