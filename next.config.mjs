/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('onnxruntime-node');
    }
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    return config;
  },
};
export default nextConfig;
