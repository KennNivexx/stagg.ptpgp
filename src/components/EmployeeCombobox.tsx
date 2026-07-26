"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, UserCheck } from "lucide-react";

export interface EmployeeOption {
  id: string;
  full_name: string;
  kode_jabatan?: string | null;
  kode?: string | null;
  nik?: string | null;
  department?: string | null;
  position?: string | null;
  email?: string | null;
}

interface EmployeeComboboxProps {
  /** Form field name — a hidden <input> carries the selected employee id so
   * this drops into existing `<form action={...}>` server-action forms the
   * same way a plain `<select name="karyawan_id">` did. */
  name: string;
  employees: EmployeeOption[];
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  /** Fires with the full employee record on selection — wire this to
   * auto-fill department/position/NIK fields elsewhere in the same form. */
  onSelect?: (employee: EmployeeOption | null) => void;
  className?: string;
}

// Drop-in replacement for the plain `<select name="karyawan_id"><option>...`
// pattern used across HRD forms (SeparationClient, CaseClient, ResignationForm,
// etc.) — same submitted field name/value, but shows each employee's
// kode_jabatan next to their name and lets the picking form auto-fill
// dependent fields via onSelect, instead of every form re-deriving that data.
export default function EmployeeCombobox({
  name,
  employees,
  defaultValue = "",
  required,
  placeholder = "Cari nama, NIK, atau kode jabatan...",
  onSelect,
  className = "",
}: EmployeeComboboxProps) {
  const [selectedId, setSelectedId] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => employees.find((e) => e.id === selectedId) || null,
    [employees, selectedId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees.slice(0, 50);
    return employees
      .filter((e) =>
        e.full_name.toLowerCase().includes(q) ||
        (e.nik || "").toLowerCase().includes(q) ||
        (e.kode_jabatan || "").toLowerCase().includes(q) ||
        (e.kode || "").toLowerCase().includes(q) ||
        (e.department || "").toLowerCase().includes(q) ||
        (e.position || "").toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [employees, query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function pick(emp: EmployeeOption | null) {
    setSelectedId(emp?.id || "");
    setQuery("");
    setOpen(false);
    onSelect?.(emp);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={selectedId} required={required} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-left hover:border-slate-300 transition-colors"
      >
        {selected ? (
          <span className="flex items-center gap-2 flex-1 min-w-0">
            <UserCheck size={14} className="text-emerald-500 shrink-0" />
            <span className="truncate font-medium text-slate-700">{selected.full_name}</span>
            <code className="ml-auto shrink-0 text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
              {selected.kode_jabatan || selected.kode || "-"}
            </code>
          </span>
        ) : (
          <span className="flex-1 text-slate-400">Pilih karyawan...</span>
        )}
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-slate-400 text-center">Tidak ada karyawan ditemukan.</p>
            )}
            {filtered.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => pick(emp)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
              >
                <UserCheck size={13} className="text-emerald-500 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-slate-700 truncate">{emp.full_name}</span>
                  {(emp.position || emp.department) && (
                    <span className="block text-[10px] text-slate-400 truncate">
                      {[emp.position, emp.department].filter(Boolean).join(" — ")}
                    </span>
                  )}
                </span>
                <code className="shrink-0 text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                  {emp.kode_jabatan || emp.kode || "-"}
                </code>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
