import { requireAuth } from "@/lib/auth-guard";
import { listDaftarHadir } from "@/app/actions/meetings";
import AttendanceClient from "./AttendanceClient";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const user = await requireAuth();
  const sheets = await listDaftarHadir();

  return (
    <AttendanceClient
      sheets={sheets}
      canCreate={["hrd", "superadmin", "department_manager"].includes(user.role)}
    />
  );
}
