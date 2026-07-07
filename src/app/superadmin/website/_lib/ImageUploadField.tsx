"use client";

import { useRef, useState } from "react";
import { UploadCloud, RefreshCw } from "lucide-react";
import { uploadWebsiteImage } from "./upload";

export function ImageUploadField({
  label,
  value,
  onChange,
  folder,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  placeholder?: string;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const res = await uploadWebsiteImage(file, folder);
      if ("error" in res) {
        setUploadError(res.error);
      } else {
        onChange(res.url);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
          placeholder={placeholder || "https://example.com/gambar.jpg"}
        />
        <div className="flex items-center gap-2">
          <label className="flex-1 inline-flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-500 hover:border-amber-400 hover:text-amber-600 cursor-pointer transition-colors">
            {uploading ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Mengunggah...
              </>
            ) : (
              <>
                <UploadCloud size={14} /> Unggah dari perangkat
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        {uploadError && (
          <p className="text-[11px] text-red-500">{uploadError}</p>
        )}
        {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- live preview of an in-progress, possibly invalid/incomplete admin-typed URL; needs the silent onError fallback that next/image's stricter loading doesn't provide
          <img
            src={value}
            alt="Preview"
            className="rounded-lg max-h-40 object-cover border w-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>
    </div>
  );
}
