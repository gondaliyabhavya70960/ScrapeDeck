/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Product thumbnails come from arbitrary store CDNs; use plain <img> with
  // remotePatterns left open so next/image is never a blocker. We deliberately
  // keep images unoptimized to avoid per-host config churn as sources change.
  images: {
    unoptimized: true,
  },
  eslint: {
    // Lint is run as its own CI step; don't fail production builds on it.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // googleapis is large and uses dynamic requires; keep it external to the
    // server bundle instead of letting webpack trace the whole tree.
    serverComponentsExternalPackages: ['googleapis'],
  },
};

export default nextConfig;
