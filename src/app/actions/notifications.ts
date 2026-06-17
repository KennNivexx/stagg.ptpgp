"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";

export async function getNotifications(userEmail: string) {
  await requireRole("hrd", "superadmin", "employee");
  const { data } = await supabaseAdmin.from("notifications").select("*").eq("user_email", userEmail).order("created_at", { ascending: false }).limit(20);
  return (data || []);
}

export async function markAsRead(ids: string[]) {
  await requireRole("hrd", "superadmin", "employee");
  await supabaseAdmin.from("notifications").update({ is_read: true }).in("id", ids);
}

export async function getUnreadCount(userEmail: string): Promise<number> {
  const { count } = await supabaseAdmin.from("notifications").select("*", { count: "exact", head: true }).eq("user_email", userEmail).eq("is_read", false);
  return count || 0;
}
