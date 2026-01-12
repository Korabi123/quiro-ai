"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

interface StreakSuccessDialogProps {
  isOpen: boolean;
  streak: number;
  onClose: () => void;
}

export function StreakSuccessDialog({
  isOpen,
  streak,
  onClose,
}: StreakSuccessDialogProps) {
  useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          zIndex: 9999,
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          zIndex: 9999,
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center flex flex-col items-center justify-center gap-6 [&>button]:hidden">
        <DialogHeader className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ backgroundColor: "rgba(229, 231, 235, 0.5)" }}
            animate={{ backgroundColor: "rgba(255, 237, 213, 1)" }}
            transition={{ duration: 0.8 }}
            className="p-4 rounded-full mb-2"
          >
            <div className="relative w-12 h-12">
              <Zap className="w-12 h-12 text-gray-300 fill-gray-300 absolute inset-0" />
              <motion.div
                initial={{ clipPath: "inset(100% 0 0 0)" }}
                animate={{ clipPath: "inset(0% 0 0 0)" }}
                transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                className="absolute inset-0"
              >
                <Zap className="w-12 h-12 text-orange-600 fill-orange-600" />
              </motion.div>
            </div>
          </motion.div>
          <DialogTitle className="text-2xl font-bold">
            Streak Kept Alive!
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            You're on fire! You've maintained your
            <motion.span
              initial={{ color: "#9ca3af" }}
              animate={{ color: "#ea580c" }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="font-bold mx-1"
            >
              {streak} day
            </motion.span>
            streak.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="w-full sm:justify-center">
          <Button
            onClick={onClose}
            className="w-full max-w-[200px] bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 rounded-xl"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
