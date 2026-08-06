import { requireRole } from "@/lib/auth-guard";
import { getKasbonRequests } from "@/app/actions/kasbon";
import KasbonAdminClient from "./KasbonAdminClient";

export default async function KasbonAdminPage() {
  await requireRole("hrd", "superadmin");
  const kasbon = await getKasbonRequests();
  return <KasbonAdminClient initialKasbon={kasbon} />;
}
