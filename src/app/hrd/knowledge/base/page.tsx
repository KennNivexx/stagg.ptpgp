import { getArticles } from "@/app/actions/knowledge";
import BaseClient from "./BaseClient";

export const dynamic = "force-dynamic";

export default async function KnowledgeBasePage() {
  const articles = await getArticles();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Basis Pengetahuan</h1>
        <p className="text-sm text-gray-500">Pusat informasi, panduan, dan dokumentasi internal perusahaan. Klik kartu untuk membaca artikel lengkap.</p>
      </div>
      <BaseClient initialArticles={articles} />
    </div>
  );
}
