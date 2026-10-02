import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/security"],
      disallow: ["/app/", "/api/"],
    },
    sitemap: "https://civora.app/sitemap.xml",
  };
}
