import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hr.ptpgp.co.id";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/career`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/e-procurement`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  try {
    const { data: jobs } = await supabaseAdmin
      .from("job_postings")
      .select("id, created_at")
      .eq("status", "Open")
      .limit(100);

    const jobRoutes: MetadataRoute.Sitemap = (jobs || []).map((j) => ({
      url: `${baseUrl}/career`,
      lastModified: j.created_at ? new Date(j.created_at as string) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...jobRoutes];
  } catch {
    return staticRoutes;
  }
}
