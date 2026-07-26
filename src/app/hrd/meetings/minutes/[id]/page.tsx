import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { getNotulen } from "@/app/actions/meetings";
import MinutesDetailClient from "./MinutesDetailClient";

export const dynamic = "force-dynamic";

export default async function MinutesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth();
  const data = await getNotulen(id);
  if (!data) notFound();

  return (
    <MinutesDetailClient
      notulen={data.notulen}
      items={data.items}
      canManage={["hrd", "superadmin", "director", "department_manager"].includes(user.role)}
    />
  );
}
