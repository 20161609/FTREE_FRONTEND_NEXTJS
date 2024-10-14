/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        // 특정 모듈 사용을 피하기 위해 fs와 path를 무시함
        config.resolve.fallback = {
          fs: false,
          path: false,
        };
      }
      return config;
    },
  };
  
  export default nextConfig;
  