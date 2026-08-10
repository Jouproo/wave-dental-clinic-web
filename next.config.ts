import type { NextConfig } from "next";

const APEX = "https://wavedentelclinic.com";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
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
