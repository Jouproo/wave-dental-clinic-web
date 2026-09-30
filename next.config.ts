import type { NextConfig } from "next";

const APEX = "https://wavedentelclinic.com";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Next's defaults include 2048/3840px device sizes and a 384px image
    // size — nothing on this site ever renders wider than ~1920px, and
    // each unused permutation is a server-side sharp transform the dyno
    // has to decode/hold in memory. Trimmed to what's actually requested.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async redirects() {
    return [
      // Force HTTPS (Heroku terminates SSL and forwards proto via this header)
      {
        source: "/:path*",
        has: [{ type: "header", key: "x-forwarded-proto", value: "http" }],
        destination: `${APEX}/:path*`,
        permanent: true,
      },
      // Force apex (non-www)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.wavedentelclinic.com" }],
        destination: `${APEX}/:path*`,
        permanent: true,
      },
      // Legacy typo'd service URL kept indexed/backlinked in the past
      {
        source: "/services/0rtho",
        destination: "/services/orthodontics",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
