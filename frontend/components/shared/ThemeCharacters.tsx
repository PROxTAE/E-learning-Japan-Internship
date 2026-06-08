"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface CharacterProps {
  className?: string;
  size?: number | string;
  animate?: boolean;
  onClick?: () => void;
}

// Helper component to handle both large stickers and small avatars
function MascotWrapper({
  src,
  alt,
  size,
  className,
  motionProps,
  whileHover,
  whileTap,
  onClick,
}: {
  src: string;
  alt: string;
  size: number | string;
  className: string;
  motionProps: any;
  whileHover: any;
  whileTap: any;
  onClick?: () => void;
}) {
  const numSize = typeof size === "number" ? size : parseInt(size, 10) || 150;
  const isSmall = numSize < 60;

  if (isSmall) {
    return (
      <motion.div
        {...motionProps}
        onClick={onClick}
        className={`inline-block select-none cursor-pointer bg-white rounded-full border-2 border-black shadow-[1.5px_1.5px_0px_#000] p-0.5 overflow-hidden ${className}`}
        style={{ width: size, height: size }}
        whileHover={whileHover}
        whileTap={whileTap}
      >
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
          <Image
            src={src}
            alt={alt}
            width={numSize}
            height={numSize}
            priority
            className="object-contain w-full h-full scale-[1.35] transform-gpu"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...motionProps}
      onClick={onClick}
      className={`inline-block select-none cursor-pointer bg-white rounded-2xl border-3 border-black shadow-[3px_3px_0px_#000] p-1.5 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      whileHover={whileHover}
      whileTap={whileTap}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={src}
          alt={alt}
          width={numSize}
          height={numSize}
          priority
          className="object-contain w-full h-full rounded-xl"
        />
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 1. HANA — Anime Cyber Cat Girl (main mascot, pink hair, cyan outfit)
//    Used in WelcomeBanner and landing page hero
// ──────────────────────────────────────────────────────────────────
export function AnimeCatGirlCharacter({
  className = "",
  size = 150,
  animate = true,
  onClick,
}: CharacterProps) {
  const motionProps = animate
    ? {
        animate: { y: [0, -8, 0], rotate: [0, 1.5, -1.5, 0] },
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } as any,
      }
    : {};

  return (
    <MascotWrapper
      src="/mascots/hana.png"
      alt="Hana - Cyber Cat Girl"
      size={size}
      className={className}
      motionProps={motionProps}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    />
  );
}

// ──────────────────────────────────────────────────────────────────
// 2. KIRA — Anime Cyber Shiba Inu (lime green scarf, expressive eyes)
//    Used in student-facing screens / play page
// ──────────────────────────────────────────────────────────────────
export function AnimeShibaCharacter({
  className = "",
  size = 150,
  animate = true,
  onClick,
}: CharacterProps) {
  const motionProps = animate
    ? {
        animate: { y: [0, -5, 0], scaleX: [1, 1.02, 0.98, 1] },
        transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" } as any,
      }
    : {};

  return (
    <MascotWrapper
      src="/mascots/kira.png"
      alt="Kira - Shiba Inu"
      size={size}
      className={className}
      motionProps={motionProps}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    />
  );
}

// ──────────────────────────────────────────────────────────────────
// 3. BYTE — Anime Robot Mascot (cyan body, lime accents, expressive)
//    Used in loading states, empty states, sidebar
// ──────────────────────────────────────────────────────────────────
export function AnimeRobotCharacter({
  className = "",
  size = 150,
  animate = true,
  onClick,
}: CharacterProps) {
  const motionProps = animate
    ? {
        animate: { y: [0, -6, 0], rotate: [0, 2, -2, 0] },
        transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } as any,
      }
    : {};

  return (
    <MascotWrapper
      src="/mascots/byte.png"
      alt="Byte - Cyber Robot"
      size={size}
      className={className}
      motionProps={motionProps}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    />
  );
}

// ──────────────────────────────────────────────────────────────────
// 4. CHI — Anime Ghost / Spirit (white/translucent, cute helper)
//    Used in empty states, tips, modals
// ──────────────────────────────────────────────────────────────────
export function AnimeGhostCharacter({
  className = "",
  size = 150,
  animate = true,
  onClick,
}: CharacterProps) {
  const motionProps = animate
    ? {
        animate: { y: [0, -10, 0], opacity: [0.9, 1, 0.9] },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } as any,
      }
    : {};

  return (
    <MascotWrapper
      src="/mascots/chi.png"
      alt="Chi - Cyber Ghost"
      size={size}
      className={className}
      motionProps={motionProps}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    />
  );
}


// ──────────────────────────────────────────────────────────────────
// 5. GradFlowerCharacter — kept for brand logo (updated colors)
// ──────────────────────────────────────────────────────────────────
export function GradFlowerCharacter({
  className = "",
  size = 40,
  onClick,
}: CharacterProps) {
  return (
    <div
      onClick={onClick}
      className={`inline-block select-none relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Cyber flower petals */}
        <g fill="var(--theme-primary, #00BCD4)" stroke="#0A0A0F" strokeWidth="8" strokeLinejoin="round">
          <circle cx="100" cy="55" r="32" />
          <circle cx="138" cy="68" r="32" />
          <circle cx="150" cy="108" r="32" />
          <circle cx="138" cy="148" r="32" />
          <circle cx="100" cy="160" r="32" />
          <circle cx="62"  cy="148" r="32" />
          <circle cx="50"  cy="108" r="32" />
          <circle cx="62"  cy="68"  r="32" />
          <circle cx="100" cy="108" r="50" stroke="none" />
        </g>
        <circle cx="100" cy="108" r="50" fill="none" stroke="#0A0A0F" strokeWidth="8" />
        {/* Eyes */}
        <g fill="white" stroke="#0A0A0F" strokeWidth="6">
          <ellipse cx="80" cy="105" rx="14" ry="18" />
          <ellipse cx="120" cy="105" rx="14" ry="18" />
        </g>
        <circle cx="84" cy="101" r="8" fill="#0A0A0F" />
        <circle cx="124" cy="101" r="8" fill="#0A0A0F" />
        <circle cx="86" cy="98" r="3" fill="white" />
        <circle cx="126" cy="98" r="3" fill="white" />
        {/* Smile */}
        <path d="M 95 122 Q 100 126 105 122" stroke="#0A0A0F" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* Grad cap */}
        <g transform="translate(60, 10) rotate(-12 40 40)">
          <path d="M 25 35 L 25 45 C 25 50, 55 50, 55 45 L 55 35 Z" fill="#0A0A0F" />
          <path d="M 40 15 L 75 28 L 40 41 L 5 28 Z" fill="#0A0A0F" stroke="white" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 40 28 L 15 35 L 12 48" stroke="var(--theme-secondary, #BAFF29)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="12" cy="49" r="3" fill="var(--theme-secondary, #BAFF29)" />
        </g>
      </svg>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 6. Legacy characters — kept for backward compat, now cyber-themed
// ──────────────────────────────────────────────────────────────────
export const OrangeFlowerCharacter = AnimeCatGirlCharacter;
export const OliveBlobCharacter    = AnimeShibaCharacter;
export const LimeStarCharacter     = AnimeRobotCharacter;
export const GreenDropletCharacter = AnimeGhostCharacter;
