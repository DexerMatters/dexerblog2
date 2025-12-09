"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type MoveDirection =
  | "in-left" | "in-right" | "in-up" | "in-down"
  | "out-left" | "out-right" | "out-up" | "out-down";

interface MoveTransitionProps {
  children: ReactNode;
  direction?: MoveDirection;
  distance?: number; // pixels
  duration?: number; // ms
  delay?: number; // ms
  className?: string;
  display?: string;
}

export default function MoveTransition({
  children,
  direction = "in-right",
  distance = 50,
  duration = 800,
  delay = 0,
  className = "",
  display = "inline-block",
}: MoveTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setAnimationDone(false);

    // Determine start and end transforms based on direction
    let startTransform = "";
    let endTransform = "";
    let startOpacity = 0;
    let endOpacity = 1;
    let startBlur = "blur(12px)";
    let endBlur = "blur(0px)";

    const isEntry = direction.startsWith("in-");

    // Base vectors
    let x = 0;
    let y = 0;

    if (direction.includes("left")) x = -distance;
    if (direction.includes("right")) x = distance;
    if (direction.includes("up")) y = -distance;
    if (direction.includes("down")) y = distance;

    if (isEntry) {
      // Moving IN: Start at offset, End at 0
      startTransform = `translate3d(${x}px, ${y}px, 0)`;
      endTransform = `translate3d(0, 0, 0)`;
      startOpacity = 0;
      endOpacity = 1;
      startBlur = "blur(12px)";
      endBlur = "blur(0px)";
    } else {
      // Moving OUT: Start at 0, End at offset
      startTransform = `translate3d(0, 0, 0)`;
      endTransform = `translate3d(${x}px, ${y}px, 0)`;
      startOpacity = 1;
      endOpacity = 0;
      startBlur = "blur(0px)";
      endBlur = "blur(12px)";
    }

    const keyframes: Keyframe[] = [
      {
        transform: startTransform,
        opacity: startOpacity,
        filter: startBlur
      },
      {
        transform: endTransform,
        opacity: endOpacity,
        filter: endBlur
      }
    ];

    const options: KeyframeAnimationOptions = {
      duration,
      delay,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", // Natural ease-out
      fill: "forwards"
    };

    const anim = container.animate(keyframes, options);

    const onFinish = () => setAnimationDone(true);
    anim.addEventListener("finish", onFinish);

    return () => {
      anim.cancel();
      anim.removeEventListener("finish", onFinish);
    };
  }, [direction, distance, duration, delay]);

  const isEntry = direction.startsWith("in-");

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display,
        willChange: "transform, opacity, filter",
        opacity: isEntry ? 0 : 1,
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </div>
  );
}
