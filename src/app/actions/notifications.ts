"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";

// Notifications are always scoped to the caller's own session email. The email
// is never taken from a parameter, otherwise any authenticated user could read
// or mutate another user's notifications by passing their address (IDOR).
export async function getNotifications() {
  const user = await requireRole("hrd", "superadmin", "employee");
  const { data } = await supabaseAdmin.from("notifications").select("*").eq("user_email", user.email).order("created_at", { ascending: false }).limit(20);
  return (data || []);
}

export async function markAsRead(ids: string[]) {
  const user = await requireRole("hrd", "superadmin", "employee");
  await supabaseAdmin.from("notifications").update({ is_read: true }).in("id", ids).eq("user_email", user.email);
}

export async function getUnreadCount(): Promise<number> {
  const user = await requireRole("hrd", "superadmin", "employee", "director", "department_manager");
  const { count } = await supabaseAdmin.from("notifications").select("*", { count: "exact", head: true }).eq("user_email", user.email).eq("is_read", false);
  return count || 0;
}
