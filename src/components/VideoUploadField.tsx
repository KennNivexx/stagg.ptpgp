"use client";

import { useRef, useState } from "react";
import { UploadCloud, RefreshCw } from "lucide-react";
import { uploadFileToStorage } from "@/lib/storage-upload";

export default function VideoUploadField({
  label,
  value,
  onChange,
  folder,
  bucket = "training-videos",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  bucket?: string;
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
      const res = await uploadFileToStorage(file, bucket, folder, { acceptPrefix: "video/", maxSizeMB: 200 });
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
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{label}</label>
      <div className="space-y-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none"
          placeholder={placeholder || "https://www.youtube.com/watch?v=..."}
        />
        <div className="flex items-center gap-2">
          <label className="flex-1 inline-flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-500 hover:border-[#CC0000] hover:text-[#CC0000] cursor-pointer transition-colors">
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
              accept="video/*"
              onChange={handleFile}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        {uploadError && <p className="text-[11px] text-red-500">{uploadError}</p>}
        {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
        {value && /^https?:\/\//.test(value) && !/youtube\.com|youtu\.be/.test(value) && (
          <video src={value} controls className="rounded-lg max-h-40 w-full border bg-black" />
        )}
      </div>
    </div>
  );
}
