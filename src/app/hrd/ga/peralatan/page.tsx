import { getPeralatan, getFpbLog } from "@/app/actions/ga-peralatan";
import PeralatanClient from "./PeralatanClient";

export default async function PeralatanPage() {
  const [peralatan, fpbLog] = await Promise.all([getPeralatan(), getFpbLog()]);
  return <PeralatanClient initialPeralatan={peralatan} initialFpbLog={fpbLog} />;
}
