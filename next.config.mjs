/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.clerk.com', 'res.cloudinary.com', 'yourbucket.s3.amazonaws.com'],
  }
};
export default nextConfig;
