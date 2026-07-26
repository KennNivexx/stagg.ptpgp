import { requireAuth } from "@/lib/auth-guard";
import { listNotulen } from "@/app/actions/meetings";
import MinutesClient from "./MinutesClient";

export const dynamic = "force-dynamic";

export default async function MinutesPage() {
  const user = await requireAuth();
  const notulen = await listNotulen();

  return (
    <MinutesClient
      notulen={notulen}
      canCreate={["hrd", "superadmin", "director", "department_manager"].includes(user.role)}
    />
  );
}
