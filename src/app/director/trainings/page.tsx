import { getTrainingsAwaitingBudget, getTrainingBudgetHistory } from "@/app/actions/trainings";
import DirectorTrainingsClient, { TrainingRow } from "./DirectorTrainingsClient";

export default async function DirectorTrainingsPage() {
  const [awaiting, history] = await Promise.all([
    getTrainingsAwaitingBudget(),
    getTrainingBudgetHistory(),
  ]);

  return <DirectorTrainingsClient awaiting={awaiting as TrainingRow[]} history={history as TrainingRow[]} />;
}
