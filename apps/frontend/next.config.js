/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',
  
  // Environment variables that should be available on the client side
  // Note: Build-time configuration uses direct process.env access as it runs before app config is available
  env: {
    // Add any client-side environment variables here
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
    unoptimized: process.env.NODE_ENV === 'development', // Build-time config
  },
  
  // Webpack configuration for better Docker builds
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize file watching for WSL2/Docker
    if (dev) {
      config.watchOptions = {
        poll: 250, // Faster polling for WSL2
        aggregateTimeout: 150, // Reduced timeout
        ignored: ['**/node_modules', '**/.git', '**/.next', '**/dist', '**/.yarn'], // Ignore unnecessary files
      };
      
      // Optimize for development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
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
    // Skip type checking during dev for faster hot reload
    ignoreBuildErrors: process.env.NODE_ENV === 'development', // Build-time config
  },
  
  // ESLint configuration
  eslint: {
    // Skip ESLint during dev for faster hot reload
    ignoreDuringBuilds: process.env.NODE_ENV === 'development', // Build-time config
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
        destination: process.env.NODE_ENV === 'development' // Build-time config
          ? `http://backend:${process.env.BACKEND_PORT}/api/:path*`
          : '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 