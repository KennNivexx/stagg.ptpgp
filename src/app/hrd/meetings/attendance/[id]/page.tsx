import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { getDaftarHadir } from "@/app/actions/meetings";
import AttendanceDetailClient from "./AttendanceDetailClient";

export const dynamic = "force-dynamic";

export default async function AttendanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth();
  const data = await getDaftarHadir(id);
  if (!data) notFound();

  return (
    <AttendanceDetailClient
      sheet={data.sheet}
      peserta={data.peserta}
      canManage={["hrd", "superadmin", "department_manager"].includes(user.role)}
    />
  );
}
