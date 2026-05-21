/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
  },
  webpack: (config) => {
    // Tell webpack to ignore optional deps we don't use.
    // pdf-parse pulls in `canvas`; unzipper pulls in `@aws-sdk/client-s3`.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      "@aws-sdk/client-s3": false,
    };
    return config;
  },
};

export default nextConfig;
