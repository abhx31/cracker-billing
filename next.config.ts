import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The Stock page became Products when stock tracking was dropped.
  async redirects() {
    return [{ source: "/stock", destination: "/products", permanent: true }];
  },
  // Bill PDFs read fonts and the logo from disk at runtime; make sure deployments ship them.
  outputFileTracingIncludes: {
    "/b/[token]": [
      "./src/features/bills/pdf/fonts/*.ttf",
      "./src/features/bills/pdf/assets/*",
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
