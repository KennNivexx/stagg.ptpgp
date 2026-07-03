import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { FileText, Award, ClipboardList, ListChecks, Building2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

interface JobDescRow {
  id: string; title: string; position: string; department: string;
  responsibilities: string[]; requirements: string[];
}

export default async function EmployeeJobDescPage() {
  let userEmail: string;
  try {
    const auth = await requireAuth();
    userEmail = auth.email;
  } catch {
    redirect("/login");
  }

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, position, department")
    .eq("email", userEmail)
    .maybeSingle();

  const position = (employee as Record<string, unknown> | null)?.position as string | undefined;
  const department = (employee as Record<string, unknown> | null)?.department as string | undefined;

  const { data: descs } = position
    ? await supabaseAdmin.from("job_descriptions").select("*").eq("position", position)
    : { data: [] };

  const jobDescs = ((descs || []) as JobDescRow[]).map(d => ({ ...d, title: d.title || "" }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Deskripsi Pekerjaan Saya</h1>
        <p className="text-sm text-gray-500">
          {position ? (
            <>Deskripsi pekerjaan untuk posisi <span className="font-semibold text-slate-700">{position}</span>{department ? <> di <span className="font-semibold text-slate-700">{department}</span></> : ""}.</>
          ) : (
            "Posisi Anda belum terdaftar di sistem."
          )}
        </p>
      </div>

      {jobDescs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada deskripsi pekerjaan untuk posisi Anda."
          description="Hubungi HRD apabila Anda merasa ini seharusnya sudah tersedia."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobDescs.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-amber-500 shrink-0" />
                  <h3 className="font-extrabold text-slate-800">{d.position}</h3>
                </div>
                {d.title && <p className="text-xs font-semibold text-sky-700 mt-1">{d.title}</p>}
                {d.department && (
                  <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Building2 size={10} />{d.department}</span>
                )}
              </div>
              <div className="p-5 space-y-4 flex-1">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><ClipboardList size={12} /> Tanggung Jawab</p>
                  {d.responsibilities.length > 0 ? (
                    <ul className="space-y-1.5">
                      {d.responsibilities.map((r, i) => (
                        <li key={i} className="text-xs text-slate-600 flex gap-2 bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-slate-300 font-bold shrink-0">{i + 1}.</span>{r}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-slate-300 italic">Belum ada.</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><ListChecks size={12} /> Persyaratan</p>
                  {d.requirements.length > 0 ? (
                    <ul className="space-y-1.5">
                      {d.requirements.map((r, i) => (
                        <li key={i} className="text-xs text-slate-600 flex gap-2 bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-slate-300 font-bold shrink-0">{i + 1}.</span>{r}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-slate-300 italic">Belum ada.</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
