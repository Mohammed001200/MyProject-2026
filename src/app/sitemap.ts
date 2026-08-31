import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-31T00:00:00.000Z");
  return ["", "/privacy", "/terms", "/security"].map((path) => ({
    url: `https://civora.app${path}`,
    lastModified,
    changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
    priority: path === "" ? 1 : 0.4,
  }));
}
