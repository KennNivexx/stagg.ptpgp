import { getTrainingROI } from "@/app/actions/trainings";
import ROIClient from "./ROIClient";

export const dynamic = "force-dynamic";

export default async function TrainingROIPage() {
  const rows = await getTrainingROI();
  return <ROIClient initialRows={rows} />;
}
