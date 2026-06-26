"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { euclideanDistance, averageDescriptors } from "@/lib/face-recognition";
import { encryptDescriptor, decryptDescriptor } from "@/lib/face-encryption";
import { auditLog } from "@/lib/audit";

const uid = () => crypto.randomUUID();

const FACE_MATCH_THRESHOLD = 0.65;

async function uploadPhoto(base64: string, employeeId: string): Promise<{ url: string } | { error: string }> {
  try {
    const buffer = Buffer.from(base64.split(",")[1], "base64");
    const filename = `attendance/${employeeId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabaseAdmin.storage
      .from("attendance-photos")
      .upload(filename, buffer, { contentType: "image/jpeg", upsert: true });
    if (error) { console.error("[attendance] uploadPhoto error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
    const { data: signedData } = await supabaseAdmin.storage
      .from("attendance-photos")
      .createSignedUrl(filename, 7200);
    return { url: signedData?.signedUrl || "" };
  } catch (e) {
    return { error: `Gagal upload foto: ${(e as Error).message}` };
  }
}

export async function clockIn(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee");
  const employeeId = user.id;
  const notes = (formData.get("notes") as string || "").trim();
  const photoBase64 = (formData.get("photo_url") as string || "").trim();
  const latitude = (formData.get("latitude") as string || "").trim();
  const longitude = (formData.get("longitude") as string || "").trim();
  const locationName = (formData.get("location_name") as string || "").trim();

  // Validate photo: must be a valid JPEG/PNG base64
  if (!photoBase64 || !photoBase64.startsWith("data:image/")) {
    return { error: "Foto selfie wajib diunggah untuk clock-in." };
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { data: existing } = await supabaseAdmin.from("attendance").select("id").eq("employee_id", employeeId).eq("date", today).maybeSingle();
  if (existing) return { error: "Sudah clock-in hari ini." };

  // Face recognition verification
  let faceVerified = false;
  const faceDescriptorJson = (formData.get("face_descriptor") as string || "").trim();
  if (faceDescriptorJson) {
    try {
      const capturedDescriptor = JSON.parse(faceDescriptorJson) as number[];
      const verifyCols: string = process.env.FACE_ENCRYPTION_KEY
        ? "encrypted_descriptor, encrypted_descriptors"
        : "descriptor, descriptors";
      const { data: faceData } = await supabaseAdmin
        .from("employee_faces")
        .select(verifyCols)
        .eq("employee_id", employeeId)
        .maybeSingle() as { data: Record<string, unknown> | null };
      if (faceData) {
        // Collect all stored descriptors (averaged + individual) for best-match comparison
        const allDescriptors: number[][] = [];
        if (process.env.FACE_ENCRYPTION_KEY) {
          if (faceData.encrypted_descriptor) {
            const d = decryptDescriptor(faceData.encrypted_descriptor as string);
            if (d?.length) allDescriptors.push(d);
          }
          if (Array.isArray(faceData.encrypted_descriptors)) {
            for (const enc of faceData.encrypted_descriptors as string[]) {
              const d = decryptDescriptor(enc);
              if (d?.length) allDescriptors.push(d);
            }
          }
        } else {
          if (Array.isArray(faceData.descriptor) && (faceData.descriptor as number[]).length > 0) {
            allDescriptors.push(faceData.descriptor as number[]);
          }
          if (Array.isArray(faceData.descriptors)) {
            for (const d of faceData.descriptors as number[][]) {
              if (d?.length) allDescriptors.push(d);
            }
          }
        }

        if (allDescriptors.length > 0) {
          // Take the best (minimum) distance across all stored descriptors
          const distances = allDescriptors.map(d => euclideanDistance(capturedDescriptor, d));
          const bestDistance = Math.min(...distances);
          console.log("[clockIn] Face match — descriptors:", allDescriptors.length, "distances:", distances.map(d => d.toFixed(3)).join(", "), "best:", bestDistance.toFixed(4));
          faceVerified = bestDistance <= FACE_MATCH_THRESHOLD;
          if (!faceVerified) {
            return { error: `Wajah tidak dikenali (jarak: ${bestDistance.toFixed(3)}, threshold: ${FACE_MATCH_THRESHOLD}). Coba dengan pencahayaan lebih baik atau posisi wajah lebih tegak.` };
          }
        } else {
          console.error("[clockIn] No valid descriptors found for employee:", employeeId);
          return { error: "Data wajah tidak ditemukan. Silakan daftarkan ulang wajah Anda." };
        }
      }
    } catch (e) {
      console.error("[clockIn] Face verification error:", e);
      return { error: "Gagal memproses data wajah. Silakan coba lagi." };
    }
  }

  let storedPhotoUrl: string | null = null;
  if (photoBase64) {
    const result = await uploadPhoto(photoBase64, employeeId);
    if ("url" in result) {
      storedPhotoUrl = result.url;
    }
  }

  const { data: emp } = await supabaseAdmin.from("employees").select("full_name, department").eq("email", user.email).maybeSingle();
  const now = new Date().toISOString();
  const attendanceId = uid();

  const { error } = await supabaseAdmin.from("attendance").upsert({
    id: attendanceId,
    employee_id: employeeId,
    employee_name: emp?.full_name || user.name,
    department: emp?.department || "",
    date: today,
    check_in: now,
    status: "Hadir",
    notes,
    photo_url: storedPhotoUrl,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    location_name: locationName || null,
  }, { onConflict: "employee_id,date" });
  if (error) {
    console.error("[clockIn] Insert failed:", error.message);
    return { error: "Gagal mencatat clock-in. Silakan coba lagi." };
  }

  // Send face photo report to HRD for attendance verification
  if (storedPhotoUrl) {
    const empName = emp?.full_name || user.name;
    await supabaseAdmin.from("notifications").insert({
      id: uid(),
      user_email: "hrd@ptpgp.co.id",
      type: "attendance_photo",
      title: `Verifikasi Absensi — ${empName}`,
      message: `${empName} telah clock-in pada ${new Date().toLocaleTimeString("id-ID")}.${faceVerified ? " [Wajah Terverifikasi]" : ""} Foto terlampir untuk verifikasi manual.`,
      link: `/hrd/attendance?date=${today}`,
      data: JSON.stringify({ photo_url: storedPhotoUrl, employee_id: employeeId, employee_name: empName, face_verified: faceVerified }),
    });
  }

  revalidatePath("/hrd/attendance");
  revalidatePath("/employee");
  return { success: true, time: now };
}

export async function clockOut(formData?: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const now = new Date().toISOString();

  const { data: existing } = await supabaseAdmin.from("attendance").select("id").eq("employee_id", user.id).eq("date", today).maybeSingle();
  if (!existing) return { error: "Belum clock-in hari ini." };

  let checkoutPhotoUrl: string | null = null;
  let latitude: string | null = null;
  let longitude: string | null = null;
  let locationName: string | null = null;

  if (formData) {
    const photo = (formData.get("photo_url") as string || "").trim();
    if (photo) {
      const result = await uploadPhoto(photo, user.id);
      if ("url" in result) checkoutPhotoUrl = result.url;
    }
    latitude = (formData.get("latitude") as string || "").trim() || null;
    longitude = (formData.get("longitude") as string || "").trim() || null;
    locationName = (formData.get("location_name") as string || "").trim() || null;
  }

  const updateData: Record<string, unknown> = { check_out: now };
  if (checkoutPhotoUrl) Object.assign(updateData, { checkout_photo_url: checkoutPhotoUrl, checkout_latitude: latitude, checkout_longitude: longitude, checkout_location_name: locationName });
  else if (latitude) Object.assign(updateData, { checkout_latitude: latitude, checkout_longitude: longitude, checkout_location_name: locationName });

  const { error } = await supabaseAdmin.from("attendance").update(updateData).eq("id", (existing as Record<string, unknown>).id as string);
  if (error) {
    console.error("[attendance] clockOut error:", error.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  revalidatePath("/hrd/attendance");
  revalidatePath("/employee");
  return { success: true, time: now };
}

export async function getTodayAttendance() {
  const user = await requireRole("hrd", "superadmin", "employee");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { data } = await supabaseAdmin.from("attendance").select("*").eq("employee_id", user.id).eq("date", today).maybeSingle();
  return data || null;
}

export async function getAllAttendance(params?: { date?: string; department?: string; search?: string }) {
  await requireRole("hrd", "superadmin");
  let q = supabaseAdmin.from("attendance").select("*").order("date", { ascending: false }).order("employee_name");
  if (params?.date) q = q.eq("date", params.date);
  if (params?.department) q = q.eq("department", params.department);
  if (params?.search) q = q.ilike("employee_name", `%${params.search}%`);
  const { data } = await q.limit(200);
  return (data || []);
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
          result.push({ employeeId: empId, employeeName: empName, descriptor: decryptDescriptor(desc) });
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
