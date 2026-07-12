import { notFound } from "next/navigation";
import { getEmployee360 } from "@/app/actions/employee360";
import Employee360Client from "./Employee360Client";

export const dynamic = "force-dynamic";

export default async function Employee360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getEmployee360(id);
  if (!data) notFound();

  return <Employee360Client data={data} />;
}
