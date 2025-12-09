"use client";;
import FloatingContainer from "@/components/floating";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [expandStage, setExpandStage] = useState(0); // 0: none, 1: line, 2: full
  const [cursorRect, setCursorRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const handleCursorClick = () => {
    if (isTransitioning) return;

    if (cursorRef.current) {
      const rect = cursorRef.current.getBoundingClientRect();
      setCursorRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }

    setIsTransitioning(true);

    // Small delay to allow the fixed cursor to render at initial position before expanding
    requestAnimationFrame(() => {
      // Stage 1: Expand to line
      setExpandStage(1);

      // Stage 2: Expand to full screen
      setTimeout(() => {
        setExpandStage(2);
      }, 600);

      // Navigate
      setTimeout(() => {
        router.push("/nav");
      }, 1200);
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <main className={`flex flex-col h-screen w-screen justify-center items-center gap-2 transition-all duration-1000 ${isTransitioning ? "scale-110 blur-sm opacity-0 filter hue-rotate-90" : ""}`}>
        <FloatingContainer>
          <header className="text-4xl font-bold select-none transition-transform duration-1000" style={{ transform: isTransitioning ? "skewX(45deg) scaleY(0.5)" : "none" }}>
            {"Welcome"}
          </header>
        </FloatingContainer>

        <FloatingContainer>
          <p className="select-none transition-transform duration-1000" style={{ transform: isTransitioning ? "skewX(-45deg) scaleY(1.5)" : "none" }}>
            {"to Dexer's blog"}
          </p>
        </FloatingContainer>

        {/* In-flow cursor (hidden when transitioning) */}
        <div
          ref={cursorRef}
          onClick={handleCursorClick}
          className={`cursor-pointer text-xl leading-none ${isTransitioning ? "opacity-0" : "animate-pulse"}`}
        >
          _
        </div>
      </main>

      {/* Transition Element (Fixed) */}
      {isTransitioning && cursorRect && (
        <div
          className="fixed z-50 bg-black transition-all ease-in-out duration-700"
          style={{
            // Keep vertical position during line expansion (Stage 1), then move to top for full screen (Stage 2)
            top: expandStage === 2 ? "0" : (cursorRect.top + cursorRect.height - 4),
            left: expandStage === 0 ? cursorRect.left : "0",
            width: expandStage === 0 ? cursorRect.width : "100vw",
            // Stage 0/1: Line height. Stage 2: Full screen height.
            height: expandStage === 2 ? "100vh" : "4px",
          }}
        />
      )}

      <style jsx>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

