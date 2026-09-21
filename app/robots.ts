import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/guide", "/privacy"], disallow: ["/api/", "/workspace", "/signin"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
