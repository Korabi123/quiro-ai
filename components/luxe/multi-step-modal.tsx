'use client'

import { useState } from 'react'

import * as RadixDialog from '@radix-ui/react-dialog'
import {
  AnimatePresence,
  motion,
  type Variants,
  MotionConfig,
} from 'motion/react'

import useMeasure from 'react-use-measure'

import { cn } from "@/lib/utils";
import { Button } from '../ui/button'

export const MultiStepModal = RadixDialog.Root
export const MultiStepModalTrigger = RadixDialog.Trigger
export const MultiStepModalClose = RadixDialog.Close

type MultiStepModalSteps = {
  title: string
  description: string
}

type MultiStepModalContentProps = React.CustomComponentPropsWithRef<
  typeof RadixDialog.Content
> & {
  steps: MultiStepModalSteps[],
  bgOpacity?: number,
}

export function MultiStepModalContent({
  steps,
  bgOpacity = 80,
  ...props
}: MultiStepModalContentProps) {
  const TOTAL_STEPS = steps.length
  const MIN_STEP = 0

  const [activeContentIndex, setActiveContentIndex] = useState(MIN_STEP)
  const [direction, setDirection] = useState<number>(1)

  const [ref, { height: heightContent }] = useMeasure()

  const { title, description } = steps[activeContentIndex]

  function handleControlsNavigation(control: 'previous' | 'next') {
    const newDirection = control === 'next' ? 1 : -1
    setDirection(newDirection)

    setActiveContentIndex(prev => {
      const nextIndex = prev + newDirection
      return Math.min(TOTAL_STEPS - 1, Math.max(MIN_STEP, nextIndex))
    })
  }

  const slideMotionVariants: Variants = {
    initial: (dir: number) => {
      return {
        x: `${110 * dir}%`,
        opacity: 0,
        height: heightContent > 0 ? heightContent : 'auto',
      }
    },
    active: {
      x: '0%',
      opacity: 1,
      height: heightContent > 0 ? heightContent : 'auto',
    },
    exit: (dir: number) => {
      return {
        x: `${-110 * dir}%`,
        opacity: 0,
      }
    },
  }

  return (
    <MotionConfig transition={{ type: 'spring', duration: 0.6, bounce: 0 }}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={cn(
            'fixed inset-0 z-[999] bg-black/80 ease-out',
            'motion-safe:data-[state=open]:fade-in motion-safe:data-[state=open]:animate-in',
            'motion-safe:data-[state=closed]:fade-out motion-safe:data-[state=closed]:animate-out',
            `bg-black/20`,
          )}
        />
        <RadixDialog.Content
          {...props}
          className={cn(
            'md:w-[500px] w-full max-w-96 overflow-hidden rounded-xl border border-border bg-primary-foreground focus:outline-none',
            '-translate-x-1/2 fixed top-1/3 left-1/2 z-[1001] motion-safe:ease-out',
            'motion-safe:data-[state=open]:fade-in motion-safe:data-[state=open]:animate-in',
            'motion-safe:data-[state=closed]:fade-out motion-safe:data-[state=closed]:animate-out',
          )}
        >
          <div className="px-4 pt-4 pb-3">
            <AnimatePresence
              initial={false}
              mode="popLayout"
              custom={direction}
            >
              <motion.div
                key={activeContentIndex}
                variants={slideMotionVariants}
                initial="initial"
                animate="active"
                exit="exit"
                custom={direction}
              >
                <div ref={ref} className="flex flex-col gap-2">
                  <RadixDialog.Title className="font-medium text-lg text-secondary-foreground">
                    {title}
                  </RadixDialog.Title>
                  <RadixDialog.Description className="font-normal text-muted-foreground text-sm">
                    {description}
                  </RadixDialog.Description>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <footer
            className={cn(
              'mt-2 flex items-center justify-between border-border border-t px-4 py-2',
              'bg-muted *:rounded-full *:border *:border-border *:bg-secondary *:text-primary',
              '*:h-8 *:w-24 *:px-3 *:font-medium *:text-[13px]/5.5',
              '*:disabled:cursor-not-allowed *:disabled:opacity-50',
            )}
          >
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleControlsNavigation('previous')}
              disabled={activeContentIndex === MIN_STEP}
            >
              Back
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                if (activeContentIndex === TOTAL_STEPS - 1) {

                } else {
                  handleControlsNavigation('next');
                }
              }}
              disabled={activeContentIndex === TOTAL_STEPS - 1}
            >
              Continue
            </Button>
          </footer>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </MotionConfig>
  )
}
