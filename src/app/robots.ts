import type { MetadataRoute } from "next";
import { clinicConfig } from "@/config/clinic";

export default function robots(): MetadataRoute.Robots {
  const base = clinicConfig.seo.url;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
