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
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  }, [])

  const enterMs = prefersReducedMotion ? 0 : 350
  const holdMs = prefersReducedMotion ? 200 : 900
  const exitMs = prefersReducedMotion ? 100 : 450

  const totalMs = enterMs + holdMs + exitMs
  const timeouts = useRef<number[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const alreadyShown =
        typeof window !== "undefined" && sessionStorage.getItem(hasShownKey)
      if (alreadyShown) return

      setVisible(true)

      // simple timeline: enter -> hold -> exit
      timeouts.current.push(
        window.setTimeout(() => {
          setLeaving(true)
        }, enterMs + holdMs)
      )

      timeouts.current.push(
        window.setTimeout(() => {
          setVisible(false)
          sessionStorage.setItem(hasShownKey, "1")
        }, totalMs)
      )
    } catch {
      // fail open: do nothing special
    }

    return () => {
      timeouts.current.forEach((id) => clearTimeout(id))
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
          "flex flex-col items-center gap-5 select-none",
          "[perspective:1000px]",
          leaving ? "splash-exit-blur" : "",
        ].join(" ")}
      >
        <div className="relative h-24 w-24">
          {/* Rotating conic ring behind logo */}
          <span
            className={[
              "absolute inset-[-8px] rounded-full",
              "bg-[conic-gradient(from_0deg,theme(colors.primary.DEFAULT)_0%,transparent_40%,theme(colors.ring)_60%,transparent_80%,theme(colors.primary.DEFAULT)_100%)]",
              prefersReducedMotion ? "" : "splash-rotate",
              "opacity-40",
            ].join(" ")}
            aria-hidden
          />
          {/* Logo */}
          <span
            className={[
              "absolute inset-0 grid place-items-center rounded-full",
              prefersReducedMotion ? "" : "splash-logo-pop splash-breath",
            ].join(" ")}
          >
            <span
              className={[
                "absolute inset-[-6px] rounded-full",
                prefersReducedMotion ? "" : "splash-glow",
              ].join(" ")}
              aria-hidden
            />
            <Image
              src={appLogo}
              alt="TeleStock logo"
              priority
              sizes="96px"
              fill
              style={{ objectFit: "contain" }}
            />
          </span>
        </div>
        <div
          className={[
            "text-2xl font-semibold font-brand tracking-tight",
            prefersReducedMotion ? "" : "splash-text-in",
          ].join(" ")}
        >
          TeleStock
        </div>
      </div>
    </div>
  )
}
