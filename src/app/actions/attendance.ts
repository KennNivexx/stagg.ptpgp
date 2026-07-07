"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { averageDescriptors } from "@/lib/face-recognition";
import { encryptDescriptor, decryptDescriptor } from "@/lib/face-encryption";
import { auditLog } from "@/lib/audit";
import { clockInForEmployee, clockOutForEmployee } from "@/lib/attendance-core";

export async function clockIn(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee");
  const result = await clockInForEmployee({
    employeeId: user.id,
    employeeEmail: user.email,
    employeeName: user.name,
    notes: (formData.get("notes") as string || "").trim(),
    photoBase64: (formData.get("photo_url") as string || "").trim(),
    latitude: (formData.get("latitude") as string || "").trim(),
    longitude: (formData.get("longitude") as string || "").trim(),
    locationName: (formData.get("location_name") as string || "").trim(),
    faceDescriptorJson: (formData.get("face_descriptor") as string || "").trim(),
  });
  if ("success" in result) {
    revalidatePath("/hrd/attendance");
    revalidatePath("/employee");
  }
  return result;
}

export async function clockOut(formData?: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee");
  const result = await clockOutForEmployee({
    employeeId: user.id,
    photoBase64: (formData?.get("photo_url") as string || "").trim() || undefined,
    latitude: (formData?.get("latitude") as string || "").trim() || undefined,
    longitude: (formData?.get("longitude") as string || "").trim() || undefined,
    locationName: (formData?.get("location_name") as string || "").trim() || undefined,
  });
  if ("success" in result) {
    revalidatePath("/hrd/attendance");
    revalidatePath("/employee");
  }
  return result;
}

export async function getTodayAttendance() {
  const user = await requireRole("hrd", "superadmin", "employee");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { data } = await supabaseAdmin.from("attendance").select("*").eq("employee_id", user.id).eq("date", today).maybeSingle();
  return data || null;
}

async function attachKode(rows: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  // attendance.employee_name/department are snapshotted at clock-in time, but
  // kode isn't — join it in from employees so the table can show it without
  // a schema change/backfill.
  const employeeIds = [...new Set(rows.map((r) => r.employee_id as string).filter(Boolean))];
  const kodeMap: Record<string, string> = {};
  if (employeeIds.length > 0) {
    const { data: emps } = await supabaseAdmin.from("employees").select("id, kode").in("id", employeeIds);
    (emps || []).forEach((e: { id: string; kode?: string }) => { if (e.kode) kodeMap[e.id] = e.kode; });
  }
  return rows.map((r) => ({ ...r, employee_kode: kodeMap[r.employee_id as string] || null }));
}

export async function getAllAttendance(params?: { date?: string; department?: string; search?: string }) {
  await requireRole("hrd", "superadmin");
  let q = supabaseAdmin.from("attendance").select("*").order("date", { ascending: false }).order("employee_name");
  if (params?.date) q = q.eq("date", params.date);
  if (params?.department) q = q.eq("department", params.department);
  if (params?.search) q = q.ilike("employee_name", `%${params.search}%`);
  const { data } = await q.limit(200);
  return attachKode(data || []);
}

/** Read-only attendance roster scoped to the department manager's own
 * department — the department filter comes from the server-resolved session,
 * never a client-supplied parameter, so a dept manager can't widen scope by
 * calling this with someone else's department. */
export async function getAttendanceForDept(params?: { date?: string }) {
  const user = await requireRole("department_manager", "superadmin");
  const { data: emp } = await supabaseAdmin.from("employees").select("department").eq("email", user.email).maybeSingle();
  const myDept = (emp as { department?: string } | null)?.department;
  if (!myDept) return [];

  let q = supabaseAdmin.from("attendance").select("*").eq("department", myDept).order("date", { ascending: false }).order("employee_name");
  if (params?.date) q = q.eq("date", params.date);
  const { data } = await q.limit(200);
  return attachKode(data || []);
}

/**
 * Full attendance history for Excel export (no date filter).
 * Returns all records ordered newest-first, paginated past Supabase's 1000-row cap.
 */
export async function getAttendanceForExport(): Promise<Record<string, unknown>[]> {
  await requireRole("hrd", "superadmin");
  const all: Record<string, unknown>[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabaseAdmin
      .from("attendance")
      .select("date, employee_name, department, check_in, check_out, status, location_name, notes")
      .order("date", { ascending: false })
      .order("employee_name")
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("[getAttendanceForExport] error:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...(data as Record<string, unknown>[]));
    if (data.length < pageSize) break;
  }
  return all;
}

// ── Face Recognition ──────────────────────────────────────────────

export async function registerFace(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee");

  let employeeId = (formData.get("employee_id") as string || "").trim();

  if (user.role === "employee") {
    // Employees can only register their OWN face, first time only
    employeeId = user.id;
    const { data: existing } = await supabaseAdmin
      .from("employee_faces").select("id").eq("employee_id", employeeId).maybeSingle();
    if (existing) {
      return { error: "Wajah sudah terdaftar. Ajukan permohonan perubahan ke HRD." };
    }
  }

  if (!employeeId) return { error: "Employee ID wajib diisi." };
  const descriptorsJson = (formData.get("descriptors") as string || "").trim();
  const photoUrl = (formData.get("photo_url") as string || "").trim();

  if (!employeeId || !descriptorsJson) return { error: "Data tidak lengkap." };

  let descriptors: number[][];
  try {
    descriptors = JSON.parse(descriptorsJson);
    if (!Array.isArray(descriptors) || descriptors.length === 0) {
      return { error: "Minimal 1 descriptor wajah diperlukan." };
    }
  } catch {
    return { error: "Format descriptor tidak valid." };
  }

  // Look up employee name to store alongside — avoids join in getAllFaceDescriptors
  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("full_name")
    .eq("id", employeeId)
    .maybeSingle();

  const averaged = averageDescriptors(descriptors);
  if (averaged.length === 0) {
    return { error: "Data wajah tidak valid (deskriptor rusak). Silakan ambil ulang foto wajah." };
  }

  const upsertData: Record<string, unknown> = {
    employee_id: employeeId,
    employee_name: emp?.full_name || null,
    descriptor: averaged,
    descriptors: descriptors,
    photo_count: descriptors.length,
    photo_url: photoUrl,
    updated_at: new Date().toISOString(),
  };

  if (process.env.FACE_ENCRYPTION_KEY) {
    upsertData.encrypted_descriptor = encryptDescriptor(averaged);
    upsertData.encrypted_descriptors = descriptors.map((d) => encryptDescriptor(d));
  }

  const { error } = await supabaseAdmin.from("employee_faces").upsert(upsertData, { onConflict: "employee_id" });

  if (error) {
    console.error("[attendance] registerFace error:", error.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  revalidatePath("/hrd/employees");

  auditLog({
    action: "face.register",
    targetId: employeeId,
    targetName: emp?.full_name || undefined,
    performedBy: user,
  });

  return { success: true };
}

export async function removeFaceData(employeeId: string) {
  const user = await requireRole("hrd", "superadmin");

  const { error } = await supabaseAdmin
    .from("employee_faces")
    .delete()
    .eq("employee_id", employeeId);

  if (error) {
    console.error("[attendance] removeFaceData error:", error.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  auditLog({
    action: "face.remove",
    targetId: employeeId,
    performedBy: user,
  });

  revalidatePath("/hrd/employees");
  return { success: true };
}

export async function getAllFaceDescriptors() {
  await requireRole("hrd", "superadmin");

  const hasEncryption = !!process.env.FACE_ENCRYPTION_KEY;

  const allCols: string = hasEncryption
    ? "employee_id, employee_name, encrypted_descriptors"
    : "employee_id, employee_name, descriptors";
  const { data: faces, error } = await supabaseAdmin
    .from("employee_faces")
    .select(allCols) as {
      data: Record<string, unknown>[] | null;
      error: unknown;
    };

  if (error) {
    console.error("[getAllFaceDescriptors] Supabase error:", error);
    return [];
  }
  if (!faces || faces.length === 0) return [];

  const result: { employeeId: string; employeeName: string; descriptor: number[] }[] = [];

  for (const f of faces) {
    const empId = String(f.employee_id);
    const empName = (f.employee_name as string | null) || "Karyawan";

    if (hasEncryption) {
      const allDescs = f.encrypted_descriptors as string[] | null;
      if (Array.isArray(allDescs) && allDescs.length > 0) {
        for (const desc of allDescs) {
          try {
            result.push({ employeeId: empId, employeeName: empName, descriptor: decryptDescriptor(desc) });
          } catch (e) {
            console.error(`[getAllFaceDescriptors] Failed to decrypt descriptor for ${empId}:`, e);
          }
        }
      }
    } else {
      const allDescs = f.descriptors as number[][] | null;
      if (Array.isArray(allDescs) && allDescs.length > 0) {
        for (const desc of allDescs) {
          result.push({ employeeId: empId, employeeName: empName, descriptor: desc });
        }
      }
    }
  }

  return result;
}

export async function getEmployeeFaceStatus(employeeId: string) {
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  // Employees can only check their own face status
  const targetId = user.role === "employee" ? user.id : employeeId;

  const { data } = await supabaseAdmin
    .from("employee_faces")
    .select("id, photo_count, created_at, updated_at, photo_url")
    .eq("employee_id", targetId)
    .maybeSingle();

  return data || null;
}

export async function getMyFaceStatus() {
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  const { data } = await supabaseAdmin
    .from("employee_faces")
    .select("id, photo_count, created_at, updated_at")
    .eq("employee_id", user.id)
    .maybeSingle();
  return { status: data || null, userId: user.id, userName: user.name || user.email };
}

export async function getMyFaceDescriptors(): Promise<{ employeeId: string; employeeName: string; descriptor: number[] }[]> {
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  const hasEncryption = !!process.env.FACE_ENCRYPTION_KEY;

  // Only select columns that exist: encrypted_* columns only exist when encryption is enabled
  const cols: string = hasEncryption
    ? "encrypted_descriptor, encrypted_descriptors"
    : "descriptor, descriptors";
  const { data } = await supabaseAdmin
    .from("employee_faces")
    .select(cols)
    .eq("employee_id", user.id)
    .maybeSingle() as { data: Record<string, unknown> | null };

  if (!data) return [];

  const refs: { employeeId: string; employeeName: string; descriptor: number[] }[] = [];
  const name = user.name || user.email;

  if (hasEncryption) {
    try {
      if (data.encrypted_descriptor) {
        const d = decryptDescriptor(data.encrypted_descriptor as string);
        if (d?.length) refs.push({ employeeId: user.id, employeeName: name, descriptor: d });
      }
      if (Array.isArray(data.encrypted_descriptors)) {
        for (const enc of data.encrypted_descriptors as string[]) {
          const d = decryptDescriptor(enc);
          if (d?.length) refs.push({ employeeId: user.id, employeeName: name, descriptor: d });
        }
      }
    } catch (e) {
      console.error(`[getMyFaceDescriptors] Failed to decrypt descriptor for ${user.id}:`, e);
    }
  } else {
    if (Array.isArray(data.descriptor) && (data.descriptor as number[]).length > 0) {
      refs.push({ employeeId: user.id, employeeName: name, descriptor: data.descriptor as number[] });
    }
    if (Array.isArray(data.descriptors)) {
      for (const d of data.descriptors as number[][]) {
        if (d?.length) refs.push({ employeeId: user.id, employeeName: name, descriptor: d });
      }
    }
  }

  return refs;
}

export async function getAllEmployeeFaceStatuses() {
  await requireRole("hrd", "superadmin");

  const { data } = await supabaseAdmin
    .from("employee_faces")
    .select("employee_id");

  return new Set((data || []).map((f) => f.employee_id));
}

// ── Face Change Requests ──────────────────────────────────────────

export async function submitFaceChangeRequest(formData: FormData) {
  const user = await requireRole("employee", "department_manager");

  const descriptorsJson = (formData.get("descriptors") as string || "").trim();
  const photoUrl = (formData.get("photo_url") as string || "").trim();

  if (!descriptorsJson) return { error: "Data descriptor wajah wajib diisi." };

  // Must already have a registered face to request a change
  const { data: existing } = await supabaseAdmin
    .from("employee_faces").select("id").eq("employee_id", user.id).maybeSingle();
  if (!existing) {
    return { error: "Belum ada data wajah. Gunakan fitur Daftarkan Wajah terlebih dahulu." };
  }

  // Block duplicate pending requests
  const { data: pending } = await supabaseAdmin
    .from("face_change_requests")
    .select("id")
    .eq("employee_id", user.id)
    .eq("status", "Pending")
    .maybeSingle();
  if (pending) {
    return { error: "Masih ada pengajuan yang sedang diproses. Tunggu keputusan HRD terlebih dahulu." };
  }

  let descriptors: number[][];
  try {
    descriptors = JSON.parse(descriptorsJson);
    if (!Array.isArray(descriptors) || descriptors.length === 0) {
      return { error: "Minimal 1 descriptor wajah diperlukan." };
    }
  } catch {
    return { error: "Format descriptor tidak valid." };
  }

  const { data: emp } = await supabaseAdmin
    .from("employees").select("full_name").eq("id", user.id).maybeSingle();

  const averaged = averageDescriptors(descriptors);
  if (averaged.length === 0) {
    return { error: "Data wajah tidak valid (deskriptor rusak). Silakan ambil ulang foto wajah." };
  }

  const { error } = await supabaseAdmin.from("face_change_requests").insert({
    employee_id: user.id,
    employee_name: emp?.full_name || user.name,
    descriptors,
    descriptor: averaged,
    photo_url: photoUrl,
    photo_count: descriptors.length,
    status: "Pending",
  });

  if (error) {
    console.error("[attendance] submitFaceChangeRequest error:", error.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  revalidatePath("/employee/attendance");

  auditLog({
    action: "face.change_request",
    targetId: user.id,
    targetName: emp?.full_name || user.name,
    performedBy: user,
  });

  return { success: true };
}

export async function getMyFaceChangeRequest() {
  const user = await requireRole("employee", "department_manager", "hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("face_change_requests")
    .select("id, status, requested_at, reviewed_at, notes")
    .eq("employee_id", user.id)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

export async function getFaceChangeRequests() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("face_change_requests")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function reviewFaceChangeRequest(id: string, status: "Disetujui" | "Ditolak", notes?: string) {
  const user = await requireRole("hrd", "superadmin");

  const { data: req } = await supabaseAdmin
    .from("face_change_requests").select("*").eq("id", id).maybeSingle();
  if (!req) return { error: "Pengajuan tidak ditemukan." };
  if (req.status !== "Pending") return { error: "Pengajuan ini sudah diproses." };

  if (status === "Disetujui") {
    const avgDesc = req.descriptor as number[];
    const allDescs = (req.descriptors as number[][]) || [];

    const upsertData: Record<string, unknown> = {
      employee_id: req.employee_id,
      employee_name: req.employee_name,
      descriptor: req.descriptor,
      descriptors: req.descriptors,
      photo_count: req.photo_count || 3,
      photo_url: req.photo_url,
      updated_at: new Date().toISOString(),
    };

    if (process.env.FACE_ENCRYPTION_KEY) {
      upsertData.encrypted_descriptor = encryptDescriptor(avgDesc);
      upsertData.encrypted_descriptors = allDescs.map((d: number[]) => encryptDescriptor(d));
    }

    const { error: upsertErr } = await supabaseAdmin.from("employee_faces").upsert(upsertData, { onConflict: "employee_id" });
    if (upsertErr) return { error: `Gagal memperbarui data wajah: ${upsertErr.message}` };
    console.log("[reviewFaceChangeRequest] Upserted face data for:", req.employee_id, "avgDesc len:", avgDesc?.length, "allDescs count:", allDescs?.length);
  }

  const { error } = await supabaseAdmin
    .from("face_change_requests")
    .update({ status, reviewed_by: user.name || user.email, reviewed_at: new Date().toISOString(), notes: notes || null })
    .eq("id", id);

  if (error) { console.error("[attendance] reviewFaceChangeRequest error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  auditLog({
    action: status === "Disetujui" ? "face.register" : "face.change_request",
    targetId: req.employee_id as string,
    targetName: req.employee_name as string,
    performedBy: user,
    detail: `Status: ${status}${notes ? `, Notes: ${notes}` : ""}`,
  });

  revalidatePath("/hrd/employees");
  revalidatePath("/employee/attendance");
  return { success: true };
}
