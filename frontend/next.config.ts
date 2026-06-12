import type { NextConfig } from "next";

// Helper function to extract hostname safely
const getHostname = (urlStr?: string): string => {
  if (!urlStr) return "";
  try {
    return new URL(urlStr.trim()).hostname;
  } catch {
    return "";
  }
};

const nextConfig: NextConfig = {
  /* 
     ใน Next.js 15+, allowedDevOrigins ต้องอยู่ชั้นนอกสุด (Top Level) 
     ไม่ใช่ใน experimental ตามที่คำเตือนใน Terminal แนะนำ
   */
  // @ts-ignore
  allowedDevOrigins: [
    "150.15.79.45",
    "localhost:3000",
    "steering-lobby-cst-dimension.trycloudflare.com",
    "*",
    "depth-wear-flooring-saver.trycloudflare.com",
    getHostname(process.env.NEXT_PUBLIC_FRONTEND_URL),
    getHostname(process.env.NEXT_PUBLIC_API_URL)
  ].filter(Boolean),

  // ปรับแต่งค่าอื่นๆ ถ้าจำเป็น
  experimental: {
    // ใส่ค่าว่างไว้ หรือลบออกถ้าไม่ได้ใช้
  }
};

export default nextConfig;
