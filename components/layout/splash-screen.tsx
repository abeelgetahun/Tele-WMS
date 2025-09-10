"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import appLogo from "@/assets/app_logo.png"

// Shows an animated splash only once per browser tab session
// Uses sessionStorage flag: tele-wms-splash-shown
export default function SplashScreen() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const hasShownKey = "tele-wms-splash-shown"

  // Respect reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  const enterMs = prefersReducedMotion ? 0 : 350
  const holdMs = prefersReducedMotion ? 200 : 700
  const exitMs = prefersReducedMotion ? 100 : 450

  const totalMs = enterMs + holdMs + exitMs
  const timeouts = useRef<number[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const alreadyShown = typeof window !== "undefined" && sessionStorage.getItem(hasShownKey)
      if (alreadyShown) return

      setVisible(true)

      // simple timeline: enter -> hold -> exit
      timeouts.current.push(window.setTimeout(() => {
        // start exit
        setLeaving(true)
      }, enterMs + holdMs))

      timeouts.current.push(window.setTimeout(() => {
        // hide and mark as shown
        setVisible(false)
        sessionStorage.setItem(hasShownKey, "1")
      }, totalMs))
    } catch {
      // fail open: do nothing special
    }

    return () => {
      timeouts.current.forEach(id => clearTimeout(id))
      timeouts.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  if (!mounted || !visible) return null

  return (
    <div
      aria-hidden
      className={[
        "fixed inset-0 z-[9999] grid place-items-center bg-background",
        "transition-opacity duration-500",
        leaving ? "opacity-0" : "opacity-100",
      ].join(" ")}
    >
      <div
        className={[
          "flex flex-col items-center gap-4 select-none",
          "transition-transform",
          prefersReducedMotion ? "duration-0" : "duration-700 ease-out",
          leaving ? "scale-95" : "scale-100",
        ].join(" ")}
      >
        <div className="relative h-20 w-20">
          <Image
            src={appLogo}
            alt="TeleStock logo"
            priority
            sizes="80px"
            fill
            style={{ objectFit: "contain" }}
          />
        </div>
        <div className="text-2xl font-semibold font-brand tracking-tight">TeleStock</div>
      </div>
    </div>
  )
}
