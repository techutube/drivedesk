/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'], // In case we use external placeholder images
  },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false
  }
}

module.exports = nextConfig
