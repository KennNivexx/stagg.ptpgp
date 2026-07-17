import { getExitInterviews } from "@/app/actions/employee-relations";
import ExitInterviewClient from "./ExitInterviewClient";

export default async function ExitInterviewPage() {
  const rows = await getExitInterviews();
  return <ExitInterviewClient initialRows={rows as never} />;
}
