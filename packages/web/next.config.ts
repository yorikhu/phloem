import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Trailing slash so static export works on any host without rewrite rules.
  trailingSlash: true,
  // Source files use .js extensions in imports (TS bundler resolution
  // convention). Map .js → .tsx/.ts so webpack can resolve them too.
  webpack(config) {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.js', '.tsx', '.ts'],
      '.jsx': ['.jsx', '.tsx'],
    };
    return config;
  },
};

export default nextConfig;
