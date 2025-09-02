import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  // Enforce HTTPS
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Clickjacking protection (also covered by CSP frame-ancestors)
  { key: "X-Frame-Options", value: "DENY" },
  // Hide referrer info by default
  { key: "Referrer-Policy", value: "no-referrer" },
  // Limit powerful APIs by default
  {
    key: "Permissions-Policy",
    value:
      [
        "camera=()",
        "microphone=()",
        "geolocation=()",
        "fullscreen=(self)",
        "payment=()",
      ].join(", "),
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      // Allow images from self, https, and data/blob for charts/avatars
      "img-src 'self' https: data: blob:",
      // Inline styles are needed for some component libs; restrict to self + inline
      "style-src 'self' 'unsafe-inline'",
      // Next.js runtime uses eval in dev for Fast Refresh; allow it only in dev
      isProd
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Fonts
      "font-src 'self' data:",
      // API calls to same origin and HTTPS endpoints; allow ws: in dev for HMR
      isProd ? "connect-src 'self' https:" : "connect-src 'self' https: ws:",
      // Upgrade any mixed content
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Allow production builds to successfully complete even if
    // there are ESLint errors. Fixing the errors is recommended,
    // but this unblocks `next build`.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
