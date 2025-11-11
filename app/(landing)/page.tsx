"use client";

import BentoGrid from "@/components/blocks/bento-grid-2";
import MinimalHero from "@/components/blocks/minimal-hero";
import { ReactLenis } from "lenis/react";

import "./landing.css";
import Pricing from "@/components/sections/pricing/default";
import { motion } from "framer-motion";
import CTA from "@/components/sections/cta/default";
import { Footer, FooterBottom } from "@/components/ui/footer";
import FooterSection from "@/components/blocks/footer";

export default function Home() {
  return (
    <>
      <ReactLenis root />
      <div className="bg-black dark">
        <MinimalHero />
        <BentoGrid />
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(20px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delayChildren: 0.5, staggerChildren: 0.2 }}
        >
          <Pricing className="bg-black mt-20" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(20px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delayChildren: 0.5, staggerChildren: 0.2 }}
        >
          <CTA className="bg-black mt-20" />
        </motion.div>
        <FooterSection />
      </div>
    </>
  );
}
