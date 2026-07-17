import { getCareerAssessments, getCareerScoreFormulas } from "@/app/actions/career-development";
import SimulationClient from "./SimulationClient";

export default async function CareerSimulationPage() {
  const [assessments, formulas] = await Promise.all([getCareerAssessments(), getCareerScoreFormulas()]);
  return <SimulationClient assessments={assessments as never} formula={(formulas[0] as never) || null} />;
}
