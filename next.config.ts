import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Hide the floating dev-tools badge (it overlapped the sidebar "Log out").
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb", // 10MB doc upload + headroom
    },
  },
  // Deleted pages redirect to the nearest relevant page — no broken links
  // (review, Navigation "Housekeeping"). Retired service/tool URLs map onto
  // the pages that replaced them.
  async redirects() {
    return [
      { source: "/pricing", destination: "/contact", permanent: true },
      { source: "/marketplace", destination: "/services", permanent: true },
      { source: "/advisor", destination: "/tools", permanent: true },
      { source: "/your-consultation", destination: "/about", permanent: true },
      { source: "/tools/calculator", destination: "/tools/effective-tax-rate-calculator", permanent: true },
      { source: "/tools/compare", destination: "/tools/compare-jurisdictions", permanent: true },
      { source: "/services/formation", destination: "/services/company-formation", permanent: true },
      { source: "/services/accounting", destination: "/services/accounting-vat", permanent: true },
      { source: "/services/tax", destination: "/services/tax-residency", permanent: true },
      { source: "/services/licensing", destination: "/services/international", permanent: true },
      { source: "/services/banking", destination: "/services/company-formation", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default config;
