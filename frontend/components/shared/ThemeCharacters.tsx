"use client";

import React from "react";
import { motion } from "framer-motion";

interface CharacterProps {
  className?: string;
  size?: number | string;
  animate?: boolean;
  onClick?: () => void;
}

// 1. Orange Flower Character (Terracotta orange flower with round lobes and cute eyes looking up-right)
export function OrangeFlowerCharacter({
  className = "",
  size = 150,
  animate = true,
  onClick,
}: CharacterProps) {
  const motionProps = animate
    ? {
        animate: {
          y: [0, -6, 0],
          rotate: [0, 2, -2, 0],
        },
        transition: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        } as any,
      }
    : {};

  return (
    <motion.div
      {...motionProps}
      onClick={onClick}
      className={`inline-block select-none cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.08, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Petals Group */}
        <g fill="var(--theme-primary, #D05A3F)" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="7" strokeLinejoin="round">
          {/* 8 rounded petals around (100, 100) */}
          <circle cx="100" cy="55" r="32" />
          <circle cx="138" cy="68" r="32" />
          <circle cx="150" cy="108" r="32" />
          <circle cx="138" cy="148" r="32" />
          <circle cx="100" cy="160" r="32" />
          <circle cx="62" cy="148" r="32" />
          <circle cx="50" cy="108" r="32" />
          <circle cx="62" cy="68" r="32" />
          {/* Fill Center */}
          <circle cx="100" cy="108" r="50" stroke="none" />
        </g>
        {/* Inner border to cover petal intersections */}
        <circle cx="100" cy="108" r="50" fill="none" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="7" />

        {/* Eyes Group (Big white ovals looking up-right) */}
        <g fill="white" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="6">
          {/* Left Eye */}
          <ellipse cx="80" cy="98" rx="16" ry="22" transform="rotate(-5 80 98)" />
          {/* Right Eye */}
          <ellipse cx="120" cy="98" rx="16" ry="22" transform="rotate(5 120 98)" />
        </g>

        {/* Pupils (Looking up-right) */}
        <g fill="var(--theme-text-main, #1C1C24)">
          {/* Left Pupil */}
          <circle cx="86" cy="90" r="10" />
          {/* Right Pupil */}
          <circle cx="126" cy="90" r="10" />
        </g>

        {/* Pupil Highlights */}
        <g fill="white">
          <circle cx="89" cy="86" r="3" />
          <circle cx="129" cy="86" r="3" />
        </g>

        {/* Cute Smile */}
        <path
          d="M 94 116 Q 100 121 106 116"
          stroke="var(--theme-text-main, #1C1C24)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

// 2. Olive Blob Character (Mustard yellow blob with big white eyes)
export function OliveBlobCharacter({
  className = "",
  size = 150,
  animate = true,
  onClick,
}: CharacterProps) {
  const motionProps = animate
    ? {
        animate: {
          y: [0, 4, 0],
          scaleY: [1, 0.97, 1.02, 1],
        },
        transition: {
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        } as any,
      }
    : {};

  return (
    <motion.div
      {...motionProps}
      onClick={onClick}
      className={`inline-block select-none cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Blob Body */}
        <path
          d="M 50 155 C 50 90, 70 45, 100 45 C 130 45, 150 90, 150 155 C 150 170, 130 175, 100 175 C 70 175, 50 170, 50 155 Z"
          fill="#BCA135"
          stroke="var(--theme-text-main, #1C1C24)"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        {/* Big White Eyes */}
        <circle cx="82" cy="115" r="20" fill="white" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="6" />
        <circle cx="118" cy="115" r="20" fill="white" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="6" />

        {/* Pupils (Big black circles, looking forward/slightly inside) */}
        <circle cx="82" cy="115" r="10" fill="var(--theme-text-main, #1C1C24)" />
        <circle cx="118" cy="115" r="10" fill="var(--theme-text-main, #1C1C24)" />

        {/* Pupil Highlights */}
        <circle cx="85" cy="112" r="3.5" fill="white" />
        <circle cx="121" cy="112" r="3.5" fill="white" />
      </svg>
    </motion.div>
  );
}

// 3. Lime Star Character (Lime green running/standing star shape)
export function LimeStarCharacter({
  className = "",
  size = 150,
  animate = true,
  onClick,
}: CharacterProps) {
  const motionProps = animate
    ? {
        animate: {
          x: [0, 3, -3, 0],
          y: [0, -5, 0],
          rotate: [0, 3, -3, 0],
        },
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        } as any,
      }
    : {};

  return (
    <motion.div
      {...motionProps}
      onClick={onClick}
      className={`inline-block select-none cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.1, rotate: -5 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Star Body */}
        <path
          d="M 100 35 C 112 55, 125 60, 148 55 C 135 75, 142 95, 138 115 C 120 110, 105 130, 92 145 C 92 125, 75 118, 55 118 C 75 103, 70 82, 62 62 C 82 68, 90 55, 100 35 Z"
          fill="#CEE229"
          stroke="var(--theme-text-main, #1C1C24)"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        {/* Arms and Legs (retro lines like in the drawing) */}
        {/* Left Arm */}
        <path d="M 58 95 C 45 92, 40 100, 35 95" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Right Arm */}
        <path d="M 142 90 C 155 88, 160 98, 168 92" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Left Leg */}
        <path d="M 82 135 L 75 160" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="6" strokeLinecap="round" />
        {/* Right Leg */}
        <path d="M 112 130 L 118 160" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="6" strokeLinecap="round" />

        {/* Dot Eyes */}
        <circle cx="88" cy="85" r="4.5" fill="var(--theme-text-main, #1C1C24)" />
        <circle cx="112" cy="85" r="4.5" fill="var(--theme-text-main, #1C1C24)" />

        {/* Cute Smile */}
        <path
          d="M 96 98 Q 100 104 104 98"
          stroke="var(--theme-text-main, #1C1C24)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

// 4. Green Droplet Character (Teal/Green droplet with blue sweat)
export function GreenDropletCharacter({
  className = "",
  size = 150,
  animate = true,
  onClick,
}: CharacterProps) {
  const motionProps = animate
    ? {
        animate: {
          y: [0, -4, 0],
          rotate: [0, -2, 2, 0],
        },
        transition: {
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        } as any,
      }
    : {};

  return (
    <motion.div
      {...motionProps}
      onClick={onClick}
      className={`inline-block select-none cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Droplet Body */}
        <path
          d="M 100 40 C 120 75, 150 100, 150 130 C 150 158, 128 172, 100 172 C 72 172, 50 158, 50 130 C 50 100, 80 75, 100 40 Z"
          fill="var(--theme-secondary, #306E4D)"
          stroke="var(--theme-text-main, #1C1C24)"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        {/* Sweat Drop on side */}
        <path
          d="M 132 80 C 137 90, 142 98, 139 103 C 136 108, 129 108, 126 103 C 123 98, 127 90, 132 80 Z"
          fill="#38BDF8"
          stroke="var(--theme-text-main, #1C1C24)"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Big White Eyes */}
        <circle cx="85" cy="115" r="16" fill="white" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="5" />
        <circle cx="115" cy="115" r="16" fill="white" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="5" />

        {/* Pupils */}
        <circle cx="85" cy="115" r="8" fill="var(--theme-text-main, #1C1C24)" />
        <circle cx="115" cy="115" r="8" fill="var(--theme-text-main, #1C1C24)" />

        {/* Highlights */}
        <circle cx="87.5" cy="112.5" r="2.5" fill="white" />
        <circle cx="117.5" cy="112.5" r="2.5" fill="white" />

        {/* Cute Worried Mouth */}
        <path
          d="M 94 135 Q 100 132 106 135"
          stroke="var(--theme-text-main, #1C1C24)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

// 5. Orange Flower with Graduation Cap (For logos/branding)
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
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Flower Body */}
        <g fill="var(--theme-primary, #D05A3F)" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="8" strokeLinejoin="round">
          <circle cx="100" cy="55" r="32" />
          <circle cx="138" cy="68" r="32" />
          <circle cx="150" cy="108" r="32" />
          <circle cx="138" cy="148" r="32" />
          <circle cx="100" cy="160" r="32" />
          <circle cx="62" cy="148" r="32" />
          <circle cx="50" cy="108" r="32" />
          <circle cx="62" cy="68" r="32" />
          <circle cx="100" cy="108" r="50" stroke="none" />
        </g>
        <circle cx="100" cy="108" r="50" fill="none" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="8" />

        {/* Eyes Group (Big white ovals looking up-right) */}
        <g fill="white" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="6">
          <ellipse cx="80" cy="105" rx="14" ry="18" />
          <ellipse cx="120" cy="105" rx="14" ry="18" />
        </g>
        {/* Pupils */}
        <circle cx="84" cy="101" r="8" fill="var(--theme-text-main, #1C1C24)" />
        <circle cx="124" cy="101" r="8" fill="var(--theme-text-main, #1C1C24)" />

        {/* Cute Smile */}
        <path d="M 95 122 Q 100 126 105 122" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Graduation Cap tilted on top */}
        <g transform="translate(60, 10) rotate(-12 40 40)">
          {/* Cap Base */}
          <path d="M 25 35 L 25 45 C 25 50, 55 50, 55 45 L 55 35 Z" fill="var(--theme-text-main, #1C1C24)" stroke="var(--theme-text-main, #1C1C24)" strokeWidth="4" strokeLinejoin="round" />
          {/* Cap Diamond */}
          <path d="M 40 15 L 75 28 L 40 41 L 5 28 Z" fill="var(--theme-text-main, #1C1C24)" stroke="white" strokeWidth="4" strokeLinejoin="round" />
          {/* Tassel */}
          <path d="M 40 28 L 15 35 L 12 48" stroke="#CEE229" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="12" cy="49" r="3" fill="#CEE229" />
        </g>
      </svg>
    </div>
  );
}
