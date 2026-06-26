import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/employee/", "/hrd/", "/director/", "/department/", "/superadmin/", "/applicant/"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://hr.ptpgp.co.id"}/sitemap.xml`,
  };
}
