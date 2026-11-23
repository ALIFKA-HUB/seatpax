'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';

const ARC_EASE = [0.22, 1, 0.36, 1] as const;

export default function HeroStage() {
  const reduce = useReducedMotion();

  return (
    <div className="lp-hero-stage">
      <div className="lp-hero-frame">
        <Image
          src="/landing/hero-shuttle.jpg"
          alt="Interior kabin shuttle eksekutif Seatpax dengan kursi navy menghadap jalur tol pegunungan saat senja"
          width={1376}
          height={768}
          priority
          sizes="(max-width: 1023px) 100vw, 58vw"
          className="lp-hero-photo"
        />
        <div className="lp-hero-scrim" aria-hidden="true" />
        <svg className="lp-hero-arc" viewBox="0 0 420 220" fill="none" aria-hidden="true" focusable="false">
          <path
            className="lp-hero-arc-guide"
            d="M 32 184 C 122 178, 174 52, 266 56 C 324 58, 354 96, 392 42"
            strokeWidth="1.5"
            strokeDasharray="5 7"
            strokeLinecap="round"
          />
          <motion.path
            className="lp-hero-arc-main"
            d="M 52 154 C 138 148, 198 118, 282 104 C 330 96, 360 72, 392 42"
            strokeWidth="2.25"
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0.18 }}
            animate={{ pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 1.15, ease: ARC_EASE }}
          />
          <circle className="lp-hero-node-ring" cx="52" cy="154" r="10" strokeWidth="1.5" />
          <circle className="lp-hero-node" cx="52" cy="154" r="4" />
          <circle className="lp-hero-node-ring" cx="222" cy="116" r="8" strokeWidth="1.5" />
          <circle className="lp-hero-node" cx="222" cy="116" r="3.5" />
          <circle className="lp-hero-node-ring" cx="392" cy="42" r="12" strokeWidth="1.5" />
          <motion.circle
            className="lp-hero-node-accent"
            cx="392"
            cy="42"
            r="5"
            initial={reduce ? false : { scale: 0.72 }}
            animate={{ scale: 1 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 18, delay: 0.45 }}
          />
        </svg>
      </div>
    </div>
  );
}
