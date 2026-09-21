import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(self)",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Do not auto-generate agent instruction files into the repository.
  agentRules: false,
  async headers() {
    return [
      // Static build assets keep Next.js's own immutable caching.
      { source: "/:path*", headers: securityHeaders },
      {
        // Pages and API responses contain private data and must not be cached.
        source: "/((?!_next/static|_next/image|icon.svg|templates/).*)",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};
export default nextConfig;
