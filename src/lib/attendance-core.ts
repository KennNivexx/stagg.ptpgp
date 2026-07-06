/**
 * Shared clock-in/out logic, callable both by the "use server" clockIn/
 * clockOut actions (web UI, gated by requireRole) and the WhatsApp bot path
 * (gated by wa_number match instead of a cookie session). Deliberately NOT
 * exported from a "use server" file — a plain lib export here can only be
 * called from other server-side code, never directly invoked by a client.
 */
import { supabaseAdmin } from "@/lib/supabase";
import { euclideanDistance } from "@/lib/face-recognition";
import { decryptDescriptor } from "@/lib/face-encryption";

const uid = () => crypto.randomUUID();

const FACE_MATCH_THRESHOLD = 0.65;

export async function uploadAttendancePhoto(base64: string, employeeId: string): Promise<{ url: string } | { error: string }> {
  try {
    const buffer = Buffer.from(base64.split(",")[1], "base64");
    const filename = `attendance/${employeeId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabaseAdmin.storage
      .from("attendance-photos")
      .upload(filename, buffer, { contentType: "image/jpeg", upsert: true });
    if (error) { console.error("[attendance-core] uploadAttendancePhoto error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
    const { data: signedData } = await supabaseAdmin.storage
      .from("attendance-photos")
      .createSignedUrl(filename, 7200);
    return { url: signedData?.signedUrl || "" };
  } catch (e) {
    return { error: `Gagal upload foto: ${(e as Error).message}` };
  }
}

export async function clockInForEmployee(params: {
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  notes?: string;
  photoBase64: string;
  latitude?: string;
  longitude?: string;
  locationName?: string;
  faceDescriptorJson?: string;
}): Promise<{ error: string } | { success: true; time: string }> {
  const { employeeId, employeeEmail, employeeName, faceDescriptorJson } = params;
  const notes = params.notes || "";
  const photoBase64 = params.photoBase64;
  const latitude = params.latitude || "";
  const longitude = params.longitude || "";
  const locationName = params.locationName || "";

  if (!photoBase64 || !photoBase64.startsWith("data:image/")) {
    return { error: "Foto selfie wajib diunggah untuk clock-in." };
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { data: existing } = await supabaseAdmin.from("attendance").select("id").eq("employee_id", employeeId).eq("date", today).maybeSingle();
  if (existing) return { error: "Sudah clock-in hari ini." };

  // Face recognition verification — only runs if a descriptor was supplied
  // (the browser/app flow captures one via face-api.js; a plain WhatsApp
  // photo upload simply omits this field, which is intentional — see
  // clockInForEmployee's callers for the tradeoff this implies for the bot path).
  let faceVerified = false;
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
          const distances = allDescriptors.map(d => euclideanDistance(capturedDescriptor, d));
          const bestDistance = Math.min(...distances);
          console.log("[clockInForEmployee] Face match — descriptors:", allDescriptors.length, "distances:", distances.map(d => d.toFixed(3)).join(", "), "best:", bestDistance.toFixed(4));
          faceVerified = bestDistance <= FACE_MATCH_THRESHOLD;
          if (!faceVerified) {
            return { error: `Wajah tidak dikenali (jarak: ${bestDistance.toFixed(3)}, threshold: ${FACE_MATCH_THRESHOLD}). Coba dengan pencahayaan lebih baik atau posisi wajah lebih tegak.` };
          }
        } else {
          console.error("[clockInForEmployee] No valid descriptors found for employee:", employeeId);
          return { error: "Data wajah tidak ditemukan. Silakan daftarkan ulang wajah Anda." };
        }
      }
    } catch (e) {
      console.error("[clockInForEmployee] Face verification error:", e);
      return { error: "Gagal memproses data wajah. Silakan coba lagi." };
    }
  }

  let storedPhotoUrl: string | null = null;
  if (photoBase64) {
    const result = await uploadAttendancePhoto(photoBase64, employeeId);
    if ("url" in result) {
      storedPhotoUrl = result.url;
    }
  }

  const { data: emp } = await supabaseAdmin.from("employees").select("full_name, department").eq("email", employeeEmail).maybeSingle();
  const now = new Date().toISOString();
  const attendanceId = uid();

  const { error } = await supabaseAdmin.from("attendance").upsert({
    id: attendanceId,
    employee_id: employeeId,
    employee_name: emp?.full_name || employeeName,
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
    console.error("[clockInForEmployee] Insert failed:", error.message);
    return { error: "Gagal mencatat clock-in. Silakan coba lagi." };
  }

  if (storedPhotoUrl) {
    const empName = emp?.full_name || employeeName;
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

  return { success: true, time: now };
}

export async function clockOutForEmployee(params: {
  employeeId: string;
  photoBase64?: string;
  latitude?: string;
  longitude?: string;
  locationName?: string;
}): Promise<{ error: string } | { success: true; time: string }> {
  const { employeeId } = params;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const now = new Date().toISOString();

  const { data: existing } = await supabaseAdmin.from("attendance").select("id, check_out").eq("employee_id", employeeId).eq("date", today).maybeSingle();
  if (!existing) return { error: "Belum clock-in hari ini." };
  if ((existing as Record<string, unknown>).check_out) return { error: "Anda sudah clock-out hari ini." };

  let checkoutPhotoUrl: string | null = null;
  let latitude: string | null = null;
  let longitude: string | null = null;
  let locationName: string | null = null;

  if (params.photoBase64) {
    const result = await uploadAttendancePhoto(params.photoBase64, employeeId);
    if ("url" in result) checkoutPhotoUrl = result.url;
  }
  latitude = params.latitude || null;
  longitude = params.longitude || null;
  locationName = params.locationName || null;

  const updateData: Record<string, unknown> = { check_out: now };
  if (checkoutPhotoUrl) Object.assign(updateData, { checkout_photo_url: checkoutPhotoUrl, checkout_latitude: latitude, checkout_longitude: longitude, checkout_location_name: locationName });
  else if (latitude) Object.assign(updateData, { checkout_latitude: latitude, checkout_longitude: longitude, checkout_location_name: locationName });

  const { error } = await supabaseAdmin.from("attendance").update(updateData).eq("id", (existing as Record<string, unknown>).id as string);
  if (error) {
    console.error("[clockOutForEmployee] error:", error.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  return { success: true, time: now };
}
