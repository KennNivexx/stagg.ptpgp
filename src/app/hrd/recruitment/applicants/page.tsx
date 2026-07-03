import { redirect } from "next/navigation";

// This standalone "Data Pelamar" list has been merged into Pipeline Kandidat
// (src/app/hrd/recruitment/pipeline/page.tsx), which now also supports
// searching by name/email and filtering by lowongan. Keep this route around
// as a redirect in case anything still links here.
export default function DataPelamarRedirect() {
  redirect("/hrd/recruitment/pipeline");
}
