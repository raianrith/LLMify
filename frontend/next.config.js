/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use rewrites in development (when NEXT_PUBLIC_API_URL is not set)
  async rewrites() {
    // In production, the frontend calls the API directly via NEXT_PUBLIC_API_URL
    // In development, proxy /api/* to the local backend
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig

