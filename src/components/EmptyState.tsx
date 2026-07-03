import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  href: string;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl border border-dashed border-slate-200 bg-white/60 ${className}`}
    >
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-pgp-red/10 mb-5">
        <Icon size={28} className="text-pgp-red" strokeWidth={1.75} />
      </div>
      <h3 className="text-sm font-bold text-slate-800 mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-5">
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 bg-pgp-red hover:bg-pgp-red-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
