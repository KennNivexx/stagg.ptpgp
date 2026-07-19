import { requireRole } from "@/lib/auth-guard";
import { getNineBoxData } from "@/app/actions/career-development";
import NineBoxClient from "./NineBoxClient";

export default async function NineBoxPage() {
  await requireRole("hrd", "superadmin");
  const data = await getNineBoxData();
  return <NineBoxClient cells={data.cells} unscored={data.unscored} totalScored={data.totalScored} />;
}
