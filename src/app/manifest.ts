import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CIVORA",
    short_name: "CIVORA",
    description: "Life admin, finally clear.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f5ef",
    theme_color: "#176b5b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
