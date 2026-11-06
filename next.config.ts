import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `next dev` use the Cloudflare bindings in wrangler.jsonc (such as an R2 image bucket).
initOpenNextCloudflareForDev();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Stored images, if next/image is used for them later.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/rabt-media/**",
      },
    ],
  },
  reactStrictMode: true,
  experimental: {
    // Photos are shrunk in the browser first; the server also rejects files over 3 MB.
    serverActions: { bodySizeLimit: "4mb" },
  },
  async headers() {
    return [
      // Pages. Their Content-Security-Policy is set per request in src/proxy.ts.
      { source: "/((?!media/).*)", headers: securityHeaders },
      // Stored images: never run anything, even if a file were not really an image.
      {
        source: "/media/:path*",
        headers: [
          ...securityHeaders,
          { key: "Content-Security-Policy", value: "default-src 'none'; sandbox" },
        ],
      },
    ];
  },
};

export default nextConfig;
