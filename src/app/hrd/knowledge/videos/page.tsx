import { getVideos } from "@/app/actions/knowledge";
import VideosClient from "./VideosClient";

export const dynamic = "force-dynamic";

export default async function VideoTutorialPage() {
  const videos = await getVideos();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Video Tutorial</h1>
        <p className="text-sm text-gray-500">Video pelatihan dan tutorial internal untuk karyawan.</p>
      </div>
      <VideosClient initialVideos={videos} />
    </div>
  );
}
