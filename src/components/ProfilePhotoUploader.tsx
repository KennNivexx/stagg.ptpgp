"use client";

import { useRef, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { uploadMyProfilePhoto } from "@/app/actions/profile-photo";

interface ProfilePhotoUploaderProps {
  currentUrl?: string | null;
  name: string;
  size?: number;
  /** Tailwind gradient classes for the initials fallback (matches each layout's existing brand accent). */
  fallbackClassName?: string;
  onUploaded?: (url: string) => void;
  /** Show the camera edit-overlay on hover/always — set false for a pure read-only display elsewhere. */
  editable?: boolean;
}

// Shared avatar for every role's topbar/profile — click to upload a new
// photo. Used across hrd/director/department/superadmin/employee layouts so
// "setiap akun bisa pasang foto profil" is satisfied from one component
// instead of duplicating upload logic five times.
export default function ProfilePhotoUploader({
  currentUrl,
  name,
  size = 36,
  fallbackClassName = "bg-gradient-to-br from-[#CC0000] to-amber-500",
  onUploaded,
  editable = true,
}: ProfilePhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null | undefined>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl ?? currentUrl;
  const initial = (name || "?").charAt(0).toUpperCase();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadMyProfilePhoto(fd);
      if ("error" in res) {
        setError(res.error);
      } else {
        setPreviewUrl(res.url);
        onUploaded?.(res.url);
      }
    } catch {
      setError("Gagal mengunggah foto. Coba lagi.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative inline-block" title={error || undefined}>
      <div
        className={`rounded-full flex items-center justify-center shrink-0 overflow-hidden text-white font-bold ${displayUrl ? "" : fallbackClassName}`}
        style={{ width: size, height: size, fontSize: Math.max(11, size * 0.4) }}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar can be any external/storage URL, needs silent fallback on load error
          <img
            src={displayUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setPreviewUrl(null)}
          />
        ) : (
          initial
        )}
      </div>

      {editable && (
        <label
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-white text-slate-600 border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
          style={{ width: size * 0.42, height: size * 0.42 }}
          title="Ubah foto profil"
        >
          {uploading ? (
            <RefreshCw size={size * 0.24} className="animate-spin" />
          ) : (
            <Camera size={size * 0.24} />
          )}
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      )}

      {error && (
        <p className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1 shadow-sm z-10">
          {error}
        </p>
      )}
    </div>
  );
}
