/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',
  
  // Environment variables that should be available on the client side
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Disable image optimization in development Docker environment
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Webpack configuration for better Docker builds
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Enable polling for file watching in Docker
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
  
  // Experimental features
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
    ],
  },
  
  // TypeScript configuration
  typescript: {
    // Type checking is done separately in CI/CD
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // ESLint is run separately in CI/CD
    ignoreDuringBuilds: false,
  },
  
  // Compression
  compress: true,
  
  // Power saving mode for development
  poweredByHeader: false,
  
  // Custom headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      // Add any redirects here
    ];
  },
  
  // Rewrites for API proxy in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://backend:4000/api/:path*'
          : '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 