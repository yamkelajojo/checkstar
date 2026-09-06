"use client"

/**
 * Vendored from cult-ui (nolly-studio/cult-ui, registry/default/ui/logo-carousel.tsx).
 * Adaptations for Checkstar (everything else is faithful to the source):
 *  1. The demo's 14 hardcoded tech logos are replaced by BRAND_LOGOS
 *     (mock MTN / Vodacom / Cell C / Telkom / rain SVGs) via an optional
 *     `logos` prop — pass your own to override.
 *  2. Honours prefers-reduced-motion: when reduced motion is requested the
 *     columns render statically instead of cycling.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SVGProps,
} from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { BRAND_LOGOS } from "@/components/brand-logos"

// Define the structure for our logo objects
export interface Logo {
  name: string
  id: number
  img: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

// Utility function to randomly shuffle an array
// This is used to mix up the order of logos for a more dynamic display
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Utility function to distribute logos across multiple columns
// This ensures each column has a balanced number of logos
const distributeLogos = (allLogos: Logo[], columnCount: number): Logo[][] => {
  // Small brand sets (≤ 2× columns): the source's random-subset with
  // duplicate-backfill would show the SAME brand twice on screen at the
  // same moment (e.g. 5 brands in 3 columns → "MTN rain MTN"). Instead,
  // every column cycles the full set, rotated by the column index so the
  // columns are phase-shifted: at any instant all visible logos are
  // distinct, and over time every brand still appears in every column.
  if (allLogos.length <= columnCount * 2) {
    return Array.from({ length: columnCount }, (_, column) =>
      Array.from(
        { length: allLogos.length },
        (_, offset) => allLogos[(column + offset) % allLogos.length]
      )
    )
  }

  const shuffled = shuffleArray(allLogos)
  const columns: Logo[][] = Array.from({ length: columnCount }, () => [])

  // Distribute logos evenly across columns
  shuffled.forEach((logo, index) => {
    columns[index % columnCount].push(logo)
  })

  // Ensure all columns have the same number of logos by filling shorter columns
  const maxLength = Math.max(...columns.map((col) => col.length))
  columns.forEach((col) => {
    while (col.length < maxLength) {
      col.push(shuffled[Math.floor(Math.random() * shuffled.length)])
    }
  })

  return columns
}

// Props for the LogoColumn component
interface LogoColumnProps {
  logos: Logo[]
  index: number
  currentTime: number
}

// LogoColumn component: Displays a single column of animated logos
const LogoColumn: React.FC<LogoColumnProps> = React.memo(
  function LogoColumn({ logos, index, currentTime }) {
    const cycleInterval = 2000 // Time each logo is displayed (in milliseconds)
    const columnDelay = index * 200 // Stagger the start of each column's animation
    // Calculate which logo should be displayed based on the current time
    const adjustedTime =
      (currentTime + columnDelay) % (cycleInterval * logos.length)
    const currentIndex = Math.floor(adjustedTime / cycleInterval)

    // Memoize the current logo to prevent unnecessary re-renders
    const CurrentLogo = useMemo(
      () => logos[currentIndex].img,
      [logos, currentIndex]
    )

    return (
      // Framer Motion component for the column container
      <motion.div
        className="w-24 h-14 md:w-48 md:h-24 overflow-hidden relative"
        initial={{ opacity: 0, y: 50 }} // Start invisible and below final position
        animate={{ opacity: 1, y: 0 }} // Animate to full opacity and final position
        transition={{
          delay: index * 0.1, // Stagger the animation of each column
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        {/* AnimatePresence enables animation of components that are removed from the DOM */}
        <AnimatePresence mode="wait">
          {/* Framer Motion component for each logo */}
          <motion.div
            key={`${logos[currentIndex].id}-${currentIndex}`}
            className="absolute inset-0 flex items-center justify-center"
            // Animation for when the logo enters
            initial={{ y: "10%", opacity: 0, filter: "blur(8px)" }}
            // Animation for when the logo is displayed
            animate={{
              y: "0%",
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                mass: 1,
                bounce: 0.2,
                duration: 0.5,
              },
            }}
            // Animation for when the logo exits
            exit={{
              y: "-20%",
              opacity: 0,
              filter: "blur(6px)",
              transition: {
                type: "tween",
                ease: "easeIn",
                duration: 0.3,
              },
            }}
          >
            <CurrentLogo className="w-20 h-20 md:w-32 md:h-32 max-w-[80%] max-h-[80%] object-contain drop-shadow-sm" />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    )
  }
)

// Main LogoCarousel component
function LogoCarousel({
  columnCount = 2,
  logos = BRAND_LOGOS as unknown as Logo[],
}: {
  columnCount?: number
  logos?: Logo[]
}) {
  const [logoSets, setLogoSets] = useState<Logo[][]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  // Memoize the array of logos to prevent unnecessary re-renders
  const allLogos: Logo[] = useMemo(() => logos, [logos])

  // Distribute logos across columns when the component mounts
  useEffect(() => {
    const distributedLogos = distributeLogos(allLogos, columnCount)
    setLogoSets(distributedLogos)
  }, [allLogos, columnCount])

  // Function to update the current time (used for logo cycling)
  const updateTime = useCallback(() => {
    setCurrentTime((prevTime) => prevTime + 100)
  }, [])

  // Set up an interval to update the time every 100ms
  // (skipped entirely for reduced-motion users, who see a static grid)
  useEffect(() => {
    if (shouldReduceMotion) return
    const intervalId = setInterval(updateTime, 100)
    return () => clearInterval(intervalId)
  }, [updateTime, shouldReduceMotion])

  // Render the logo columns
  return (
    <div className="flex space-x-4">
      {logoSets.map((logos, index) => (
        <LogoColumn
          key={index}
          logos={logos}
          index={index}
          currentTime={currentTime}
        />
      ))}
    </div>
  )
}

export { LogoCarousel }
export default LogoCarousel
