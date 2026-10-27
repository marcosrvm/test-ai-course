import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // On Vercel only the redesigned pages are public; locally the originals stay reachable.
  async redirects() {
    if (!process.env.VERCEL) return [];
    return [
      { source: "/", destination: "/v2", permanent: false },
      { source: "/bin-ich-geeignet", destination: "/v2/bin-ich-geeignet", permanent: false },
    ];
  },
};

export default nextConfig;
