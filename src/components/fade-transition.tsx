"use client";

import { ReactNode, useEffect, useState, useRef } from "react";

interface FadeTransitionProps {
  children: ReactNode;
  direction?: "in" | "out"; // in: transparent blur to opaque clear, out: reverse
  duration?: number; // in milliseconds
  delay?: number; // in milliseconds
  className?: string;
  display?: string;
  maskOnly?: boolean; // if true, only fade blur without mask slide animation
}

export default function FadeTransition({
  children,
  direction = "in",
  duration = 1000,
  delay = 0,
  className = "",
  display = "inline-block",
  maskOnly = false,
}: FadeTransitionProps) {
  const [animationDone, setAnimationDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setAnimationDone(false);

    let keyframes: Keyframe[] = [];

    if (maskOnly) {
      if (direction === "in") {
        // fadeBlurOnly
        keyframes = [
          { opacity: 0, filter: "blur(8px)" },
          { opacity: 1, filter: "none" },
        ];
      } else {
        // blurFadeOut
        keyframes = [
          { opacity: 1, filter: "none" },
          { opacity: 0, filter: "blur(8px)" },
        ];
      }
    } else {
      if (direction === "in") {
        // blurReveal
        keyframes = [
          { opacity: 1, maskPosition: "100% 0", webkitMaskPosition: "100% 0" },
          { opacity: 1, maskPosition: "0% 0", webkitMaskPosition: "0% 0" },
        ];
      } else {
        // blurHide
        keyframes = [
          { opacity: 1, maskPosition: "0% 0", webkitMaskPosition: "0% 0" },
          { opacity: 1, maskPosition: "100% 0", webkitMaskPosition: "100% 0" },
        ];
      }
    }

    const options: KeyframeAnimationOptions = {
      duration,
      delay,
      easing: "cubic-bezier(0.2, 0.0, 0.2, 1)",
      fill: "forwards",
    };

    const anim = container.animate(keyframes, options);

    if (overlayRef.current) {
      overlayRef.current.animate(keyframes, options);
    }

    const onFinish = () => setAnimationDone(true);
    anim.addEventListener("finish", onFinish);

    return () => {
      anim.cancel();
      anim.removeEventListener("finish", onFinish);
    };
  }, [direction, duration, delay, maskOnly]);

  const shouldApplyMask = !maskOnly && (!animationDone || direction === "out");

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        display,
        // Initial state for 'in' direction: hidden by mask
        opacity: animationDone && direction === "in" ? 1 : (direction === "in" ? 0 : 1),
        // Only apply mask animation if maskOnly is false
        maskImage: shouldApplyMask ? "linear-gradient(to right, black 0%, black 40%, transparent 60%, transparent 100%)" : undefined,
        WebkitMaskImage: shouldApplyMask ? "linear-gradient(to right, black 0%, black 40%, transparent 60%, transparent 100%)" : undefined,
        maskSize: shouldApplyMask ? "250% 100%" : undefined,
        WebkitMaskSize: shouldApplyMask ? "250% 100%" : undefined,
        pointerEvents: 'auto',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Blur Overlay - Only visible when maskOnly is false */}
      {shouldApplyMask && (
        <div
          ref={overlayRef}
          className="absolute inset-0 z-10"
          style={{
            pointerEvents: "none",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            maskImage: "linear-gradient(to right, transparent 30%, black 50%, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 30%, black 50%, transparent 70%)",
            maskSize: "250% 100%",
            WebkitMaskSize: "250% 100%",
          }}
        />
      )}
      {children}
    </div>
  );
}
