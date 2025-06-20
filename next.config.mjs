import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const env = {
  JWT_SECRET: process.env.JWT_SECRET,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  NEXT_PUBLIC_USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API || 'false',
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.RAILWAY_PRIVATE_DOMAIN ||
    'http://localhost:3001',
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  env,
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config, { webpack, isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          buffer: require.resolve('buffer/'),
          util: require.resolve('util/'),
        },
      };

      config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
      ];
    }
    return config;
  },
};

export default nextConfig;
