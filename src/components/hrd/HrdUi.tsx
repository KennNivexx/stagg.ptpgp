"use client";

import { ReactNode } from "react";
import Link from "next/link";

// Icon props take an already-rendered element (e.g. `icon={<Award size={18} />}`),
// never a bare component reference (`icon={Award}`) — these components are
// "use client", and a lucide-react icon component is a forwardRef object,
// which React's server/client serialization boundary rejects ("Only plain
// objects can be passed to Client Components from Server Components") when
// passed as a prop from a Server Component caller. A rendered ReactNode is
// plain serializable JSX, so it crosses the boundary fine.

interface HrdStatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: "red" | "emerald" | "amber" | "blue" | "purple" | "slate" | "sky" | "rose" | "orange" | "indigo";
  trend?: { direction: "up" | "down"; percentage: number };
  suffix?: string;
}

const colorMap = {
  red: { bg: "bg-red-50", text: "text-red-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
  sky: { bg: "bg-sky-50", text: "text-sky-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  orange: { bg: "bg-orange-50", text: "text-orange-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
};

export function HrdStatsCard({ label, value, icon, color = "red", trend, suffix }: HrdStatsCardProps) {
  const c = colorMap[color];
  const displayValue = typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 ${c.bg} ${c.text} rounded-xl shrink-0`}>
          {icon}
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${trend.direction === "up" ? "text-emerald-600" : "text-red-600"}`}>
            {trend.direction === "up" ? "↑" : "↓"} {trend.percentage}%
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-slate-800 leading-tight">
        {displayValue}
        {suffix ? <span className="text-sm font-bold text-slate-500 ml-0.5">{suffix}</span> : null}
      </p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

interface HrdPageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  backHref?: string;
}

export function HrdPageHeader({ title, subtitle, children, backHref }: HrdPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div>
        {backHref && (
          <Link href={backHref} className="text-[11px] font-bold text-slate-400 hover:text-red-600 mb-1 inline-flex items-center gap-1">
            ← Kembali
          </Link>
        )}
        <h1 className="text-2xl font-extrabold text-[#1A2530] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

interface FilterChip {
  key: string;
  label: string;
}

interface HrdSearchFilterProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  filters?: FilterChip[];
  activeFilter?: string;
  onFilterChange?: (key: string) => void;
}

export function HrdSearchFilter({
  placeholder = "Cari...",
  value,
  onChange,
  filters,
  activeFilter,
  onFilterChange,
}: HrdSearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 placeholder:text-slate-400"
        />
      </div>
      {filters && filters.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.map((f) => {
            const active = activeFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => onFilterChange?.(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  active
                    ? "bg-red-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-800"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface HrdActionButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  icon?: ReactNode;
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function HrdActionButton({ href, onClick, variant = "primary", icon, children, type = "button", disabled }: HrdActionButtonProps) {
  const base = "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-colors disabled:opacity-50";
  const styles = {
    primary: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
    outline: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200",
  };
  const className = `${base} ${styles[variant]}`;
  const content = (
    <>
      {icon}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

interface HrdCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  iconColor?: keyof typeof colorMap;
  action?: { label: string; href: string };
}

export function HrdCard({ children, className = "", title, subtitle, icon, iconColor = "red", action }: HrdCardProps) {
  const c = colorMap[iconColor];
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`p-2 ${c.bg} ${c.text} rounded-xl`}>
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="font-extrabold text-slate-800 text-sm">{title}</h3>}
              {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && (
            <Link href={action.href} className="text-[11px] font-bold text-red-600 hover:underline">
              {action.label} →
            </Link>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
