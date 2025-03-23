/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    dirs: ['app', 'components', 'lib', 'utils']
  },
  experimental: {
    optimizeCss: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fix for "Can't resolve 'fs'" error with Monaco editor
      config.resolve.fallback = {
        fs: false,
        path: false
      };
    }
    return config;
  }
};

module.exports = nextConfig; 