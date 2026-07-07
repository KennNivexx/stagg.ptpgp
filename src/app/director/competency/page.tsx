import { getCompetencyRequests } from "@/app/actions/skills";
import DirectorCompetencyClient, { CompetencyRequest } from "./DirectorCompetencyClient";

export default async function DirectorCompetencyPage() {
  const requests = await getCompetencyRequests();

  return <DirectorCompetencyClient requests={requests as CompetencyRequest[]} />;
}
