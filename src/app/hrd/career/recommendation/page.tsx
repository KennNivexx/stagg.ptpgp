import { getCareerRecommendations } from "@/app/actions/career-development";
import RecommendationClient from "./RecommendationClient";

export default async function CareerRecommendationPage() {
  const rows = await getCareerRecommendations();
  return <RecommendationClient initialRows={rows as never} />;
}
