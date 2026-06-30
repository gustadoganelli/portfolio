/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    // Server Actions recebem arquivos (FormData). Aumentamos o limite de body
    // para suportar o upload de documentos comprobatórios direto na action.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
