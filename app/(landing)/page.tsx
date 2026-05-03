"use client";

import { HeroDigitalSuccess } from "@/components/hero-digital-success";
import UILayoutsBackgroundBlocks from "@/components/ui-layouts/background-blocks";
import UILayoutsLiquidGradientCta from "@/components/ui-layouts/liquid-gradient-cta";
import Pricing from "@/components/sections/pricing/default";
import { motion } from "framer-motion";
import { ReactLenis } from "lenis/react";

import "./landing.css";
import BentoGrid from "@/components/blocks/bento-grid-2";
import { HeroFooter } from "@/components/hero-footer";

export default function Home() {
  return (
    <>
      <ReactLenis root />
      <div className="dark bg-black">
        <HeroDigitalSuccess />
        <UILayoutsBackgroundBlocks />
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(20px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delayChildren: 0.5, staggerChildren: 0.2 }}
        >
          <BentoGrid />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(20px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delayChildren: 0.5, staggerChildren: 0.2 }}
        >
          <Pricing className="mt-20 bg-black" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(20px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delayChildren: 0.5, staggerChildren: 0.2 }}
        >
          <UILayoutsLiquidGradientCta />
        </motion.div>
        <HeroFooter />
      </div>
    </>
  );
}
