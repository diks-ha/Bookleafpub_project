import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" enables a self-contained build for Docker/Render
  // Comment this out if deploying to Vercel (Vercel handles this automatically)
  output: "standalone",
};

export default nextConfig;
