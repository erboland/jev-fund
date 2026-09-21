import type { NextConfig } from "next";

const pages = process.env.GITHUB_PAGES === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(pages
    ? {
        output: "export" as const,
        basePath,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
