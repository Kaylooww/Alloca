import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Recharts is a heavy dependency; this keeps it out of the shared bundle.
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
}

export default nextConfig
