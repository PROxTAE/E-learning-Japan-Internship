import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 
     ใน Next.js 15+, allowedDevOrigins ต้องอยู่ชั้นนอกสุด (Top Level) 
     ไม่ใช่ใน experimental ตามที่คำเตือนใน Terminal แนะนำ
  */
  // @ts-ignore
  allowedDevOrigins: ["150.15.79.45", "localhost:3000", "*"],
  
  // ปรับแต่งค่าอื่นๆ ถ้าจำเป็น
  experimental: {
    // ใส่ค่าว่างไว้ หรือลบออกถ้าไม่ได้ใช้
  }
};

export default nextConfig;
