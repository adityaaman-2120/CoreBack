import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/guide", "/privacy"].map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
  }));
}
