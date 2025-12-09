"use client";

import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ContentTransitionProps {
  children: ReactNode;
  originRect: DOMRect | null;
  duration?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function ContentTransition({
  children,
  originRect,
  style,
  duration = 400,
  className = ""
}: ContentTransitionProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useLayoutEffect(() => {
    if (!originRect || !targetRef.current) return;
    setIsAnimating(true);
  }, [originRect]);

  return (
    <>
      <div ref={targetRef} className={className} style={{ opacity: isAnimating ? 0 : 1, ...style }}>
        <div style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? 'translateY(-20px)' : 'translateY(0)',
          transition: isAnimating ? 'none' : 'opacity 0.6s ease-out, transform 0.6s ease-out',
        }}>
          {children}
        </div>
      </div>
      {isAnimating && originRect && <PortalAnimation
        originRect={originRect}
        targetRef={targetRef}
        duration={duration}
        className={className}
        onFinish={() => setIsAnimating(false)}
      />}
    </>
  );
}

function PortalAnimation({
  children,
  originRect,
  targetRef,
  duration,
  className,
  onFinish
}: {
  children?: ReactNode,
  originRect: DOMRect,
  targetRef: React.RefObject<HTMLDivElement | null>,
  duration: number,
  className: string,
  onFinish: () => void
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    const target = targetRef.current;
    if (!element || !target) return;

    const finalRect = target.getBoundingClientRect();

    // Apply initial styles immediately
    Object.assign(element.style, {
      position: 'fixed',
      top: `${originRect.top + originRect.height / 2 - 2}px`,
      left: `${originRect.left}px`,
      width: '4px',
      height: '4px',
      margin: 0,
      zIndex: 9999,
      overflow: 'hidden',
      pointerEvents: 'none',
      transformOrigin: 'center left',
      backgroundColor: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    });

    // Force a reflow to ensure initial state is registered
    void element.offsetHeight;

    // Animate
    const getKeyframes = (rect: DOMRect) => [
      {
        top: `${originRect.top + originRect.height / 2 - 2}px`,
        left: `${originRect.left}px`,
        width: '4px',
        height: '4px'
      },
      {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: '4px',
        height: `${rect.height}px`,
        offset: 0.4
      },
      {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      }
    ];

    const animation = element.animate(getKeyframes(finalRect), {
      duration: duration,
      easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
      fill: 'forwards'
    });

    animation.onfinish = onFinish;

    // Continuously update keyframes to match target position/size
    // This handles content loading, layout shifts, scrolling, etc.
    let frameId: number;
    const updateKeyframes = () => {
      if (!target) return;
      const currentRect = target.getBoundingClientRect();
      if (animation.effect) {
        (animation.effect as KeyframeEffect).setKeyframes(getKeyframes(currentRect));
      }
      frameId = requestAnimationFrame(updateKeyframes);
    };
    frameId = requestAnimationFrame(updateKeyframes);

    return () => {
      cancelAnimationFrame(frameId);
      animation.cancel();
    };
  }, []);

  return createPortal(
    <div ref={ref} className={className}>
      {/* Children removed to keep box empty during expansion */}
    </div>,
    document.body
  );
}