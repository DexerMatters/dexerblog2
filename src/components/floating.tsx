"use client";

import { ReactNode, PointerEvent, useMemo, useRef, useState, useEffect } from "react";

type Range = [number, number];

type FloatingContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  swayXRange?: Range;
  swayYRange?: Range;
  tiltRangeA?: Range;
  tiltRangeB?: Range;
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

export default function FloatingContainer({
  children,
  className = "",
  swayXRange = [-8, 8],
  swayYRange = [-3, 3],
  tiltRangeA = [-2, 2],
  tiltRangeB = [1, 2],
  ...rest
}: FloatingContainerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const config = useMemo(() => {
    if (!mounted) {
      return {
        swayX: 0, swayY: 0, tiltA: 0, tiltB: 0,
        depthA: 0, depthB: 0,
        dragX: 0, dragY: 0, dragTilt: 0,
        duration: 20, delay: 0
      };
    }
    const swayX = randomBetween(...swayXRange);
    const swayY = randomBetween(...swayYRange);
    const tiltA = randomBetween(...tiltRangeA);
    const tiltB = randomBetween(...tiltRangeB);
    return {
      swayX, swayY, tiltA, tiltB,
      depthA: randomBetween(-6, 6),
      depthB: randomBetween(-1, 4),
      dragX: swayX * 0.28,
      dragY: swayY * -0.32 - 4,
      dragTilt: tiltB * 0.6,
      duration: randomBetween(16, 26),
      delay: randomBetween(-4, 0)
    };
  }, [mounted, swayXRange, swayYRange, tiltRangeA, tiltRangeB]);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  // Animation state
  const state = useRef({
    x: 0, y: 0, rotate: 0, scale: 1,
    rotateX: 0, rotateY: 0,
    ratioX: 0, ratioY: 0,
    pressOpacity: 0
  });

  const target = useRef({
    x: 0, y: 0, rotate: 0, scale: 1,
    rotateX: 0, rotateY: 0,
    ratioX: 0, ratioY: 0,
    pressOpacity: 0
  });

  const isHovering = useRef(false);
  const isPressed = useRef(false);

  useEffect(() => {
    if (!mounted) return;

    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const time = (now - startTime) / 1000 + config.delay;

      // Calculate idle drift
      let idleX = 0, idleY = 0, idleRotate = 0;

      // Always apply drift, but maybe dampen it when hovering if desired.
      // For now, we keep it additive like the original CSS.
      const t = time * (Math.PI * 2) / config.duration;
      idleX = Math.sin(t) * config.swayX;
      idleY = Math.cos(t * 1.5) * config.swayY;
      idleRotate = Math.sin(t * 0.5) * config.tiltA;

      // Target values
      let tx = idleX;
      let ty = idleY;
      let tr = idleRotate;
      let ts = 1;
      let trx = 0;
      let try_ = 0;
      let tPressOpacity = 0;

      if (isHovering.current) {
        tx += target.current.x;
        ty += target.current.y;
        tr += target.current.rotate;
        ts = target.current.scale;
      }

      if (isPressed.current) {
        trx = target.current.rotateX;
        try_ = target.current.rotateY;
        tPressOpacity = 1;
      }

      // Lerp current to target
      const factor = isHovering.current ? 0.15 : 0.05;

      state.current.x = lerp(state.current.x, tx, factor);
      state.current.y = lerp(state.current.y, ty, factor);
      state.current.rotate = lerp(state.current.rotate, tr, factor);
      state.current.scale = lerp(state.current.scale, ts, factor);
      state.current.rotateX = lerp(state.current.rotateX, trx, 0.2);
      state.current.rotateY = lerp(state.current.rotateY, try_, 0.2);
      state.current.ratioX = lerp(state.current.ratioX, target.current.ratioX, 0.1);
      state.current.ratioY = lerp(state.current.ratioY, target.current.ratioY, 0.1);
      state.current.pressOpacity = lerp(state.current.pressOpacity, tPressOpacity, 0.2);

      // Apply transforms
      if (containerRef.current) {
        containerRef.current.style.transform =
          `translate3d(${state.current.x}px, ${state.current.y}px, 0) ` +
          `rotate(${state.current.rotate}deg) ` +
          `scale(${state.current.scale})`;
      }

      if (contentRef.current) {
        contentRef.current.style.transform =
          `translateZ(50px) ` +
          `rotateX(${state.current.rotateX}deg) ` +
          `rotateY(${state.current.rotateY}deg)`;
      }

      if (overlayRef.current) {
        overlayRef.current.style.opacity = state.current.pressOpacity.toString();
        overlayRef.current.style.background = `radial-gradient(
          circle at calc(50% + ${state.current.ratioX * 50}%) calc(50% + ${state.current.ratioY * 50}%), 
          rgba(0, 0, 0, 0.3), 
          transparent 60%
        )`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mounted, config]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = rectRef.current ?? event.currentTarget.getBoundingClientRect();
    if (!rectRef.current) rectRef.current = rect;

    const centeredX = event.clientX - (rect.left + rect.width / 2);
    const centeredY = event.clientY - (rect.top + rect.height / 2);

    const clamp = (value: number) => Math.max(Math.min(value, 1), -1);
    const ratioX = clamp(centeredX / (rect.width / 2));
    const ratioY = clamp(centeredY / (rect.height / 2));

    // Update target for hover effect
    target.current.x = config.dragX + ratioX * Math.min(12, Math.abs(config.dragX) + 4);
    target.current.y = config.dragY + ratioY * 4;
    target.current.rotate = config.dragTilt + ratioX * 3;
    target.current.scale = 1.02;
    target.current.ratioX = ratioX;
    target.current.ratioY = ratioY;

    if (event.buttons === 1) {
      const maxTilt = 12;
      target.current.rotateX = -ratioY * maxTilt;
      target.current.rotateY = ratioX * maxTilt;
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    isPressed.current = true;
    const rect = rectRef.current ?? event.currentTarget.getBoundingClientRect();
    if (!rectRef.current) rectRef.current = rect;

    const centeredX = event.clientX - (rect.left + rect.width / 2);
    const centeredY = event.clientY - (rect.top + rect.height / 2);
    const clamp = (value: number) => Math.max(Math.min(value, 1), -1);
    const ratioX = clamp(centeredX / (rect.width / 2));
    const ratioY = clamp(centeredY / (rect.height / 2));

    const maxTilt = 12;
    target.current.rotateX = -ratioY * maxTilt;
    target.current.rotateY = ratioX * maxTilt;
  };

  const handlePointerUp = () => {
    isPressed.current = false;
    target.current.rotateX = 0;
    target.current.rotateY = 0;
  };

  const handlePointerLeave = () => {
    isHovering.current = false;
    isPressed.current = false;
    rectRef.current = null;

    // Reset targets
    target.current.x = 0;
    target.current.y = 0;
    target.current.rotate = 0;
    target.current.scale = 1;
    target.current.rotateX = 0;
    target.current.rotateY = 0;
    target.current.ratioX = 0;
    target.current.ratioY = 0;
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    isHovering.current = true;
    rectRef.current = event.currentTarget.getBoundingClientRect();
    target.current.scale = 1.02;
  };

  return (
    <div
      ref={containerRef}
      className={className}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1000px",
        transformStyle: "preserve-3d",
        willChange: "transform",
        ...rest.style,
      }}
      {...rest}
    >
      <div
        ref={contentRef}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transformStyle: "preserve-3d",
          willChange: "transform",
          position: "relative",
        }}
      >
        {children}
        <div
          ref={overlayRef}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 10,
            borderRadius: "inherit",
            opacity: 0,
            willChange: "opacity, background",
          }}
        />
      </div>
    </div>
  );
}