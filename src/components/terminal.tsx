"use client";

import { useState, useEffect, useRef, FormEvent, ReactNode, useImperativeHandle, forwardRef } from "react";
import FadeTransition from "./fade-transition";

export type LogEntry = {
  id: number;
  type: "system" | "input" | "output";
  content: ReactNode;
  location?: string;
};

export type CommandHandler = (command: string) => string | LogEntry[] | void | Promise<string | LogEntry[] | void>;

export interface TerminalHandle {
  sendCommand: (command: string) => Promise<void>;
  showList: (items: string[]) => void;
  hideList: () => void;
}

interface TerminalProps {
  initialHistory?: LogEntry[];
  promptLabel?: string;
  location?: string;
  onCommand?: CommandHandler;
  className?: string;
  style?: React.CSSProperties;
  fontSize?: string; // e.g., "text-sm", "text-base", "text-lg"
  lineSpacing?: string; // e.g., "mt-1", "mt-2", "mt-4"
  onShowList?: (items: string[]) => void;
  onHideList?: () => void;
}

const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(
  {
    initialHistory = [],
    promptLabel = "@",
    location = "~",
    onCommand,
    className = "",
    style,
    fontSize = "text-sm md:text-base",
    lineSpacing = "mt-1",
    onShowList,
    onHideList,
  }: TerminalProps,
  ref
) {
  const [history, setHistory] = useState<LogEntry[]>(initialHistory);
  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [inputKey, setInputKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [history]);

  const handleCommand = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();

    // Add user input to history
    const inputEntry: LogEntry = { id: Date.now(), type: "input", content: cmd, location };
    setHistory(prev => [...prev, inputEntry]);

    setInput("");
    setCursorPos(0);
    setInputKey(prev => prev + 1);

    if (onCommand) {
      const result = await onCommand(cmd);
      if (result) {
        if (typeof result === 'string') {
          setHistory(prev => [...prev, { id: Date.now() + 1, type: "output", content: result }]);
        } else if (Array.isArray(result)) {
          setHistory(prev => [...prev, ...result]);
        }
      }
    }
  };

  useImperativeHandle(ref, () => ({
    sendCommand: async (command: string) => {
      const cmd = command.trim();

      // Add command to history
      const inputEntry: LogEntry = { id: Date.now(), type: "input", content: cmd, location };
      setHistory(prev => [...prev, inputEntry]);

      // Trigger input line animation
      setInputKey(prev => prev + 1);

      if (onCommand) {
        const result = await onCommand(cmd);
        if (result) {
          if (typeof result === 'string') {
            setHistory(prev => [...prev, { id: Date.now() + 1, type: "output", content: result }]);
          } else if (Array.isArray(result)) {
            setHistory(prev => [...prev, ...result]);
          }
        }
      }
    },
    showList: (items: string[]) => {
      onShowList?.(items);
    },
    hideList: () => {
      onHideList?.();
    }
  }));

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setCursorPos(e.target.selectionStart || 0);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setCursorPos(e.currentTarget.selectionStart || 0);
  };

  // Calculate line height based on font size - adjust multiplier for your preferred spacing
  const getLineHeight = () => {
    if (fontSize.includes("text-xl")) return "h-8";
    if (fontSize.includes("text-lg")) return "h-7";
    if (fontSize.includes("text-base")) return "h-6";
    return "h-5"; // for text-sm
  };

  const lineHeight = getLineHeight();

  // Border values for arrow - scale with line height
  const getBorderValues = () => {
    if (fontSize.includes("text-xl")) return "border-t-16 border-b-16 border-l-12";
    if (fontSize.includes("text-lg")) return "border-t-14 border-b-14 border-l-11";
    if (fontSize.includes("text-base")) return "border-t-12 border-b-12 border-l-10";
    return "border-t-10 border-b-10 border-l-8"; // for text-sm
  };

  const borderValues = getBorderValues();

  return (
    <div
      className={`bg-black text-gray-300 font-mono p-4 overflow-hidden relative selection:bg-white selection:text-black z-10 ${className}`}
      style={style}
      onClick={handleContainerClick}
    >
      {/* CRT Overlay Effects */}
      <div
        className="pointer-events-none absolute inset-0 z-50 bg-repeat opacity-50"
        style={{
          backgroundImage: "linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,0.25) 50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))",
          backgroundSize: "100% 4px, 3px 100%"
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-40 opacity-5 animate-flicker bg-white mix-blend-overlay" />

      <div className={`w-full max-w-2xl h-full flex flex-col relative z-10 ${fontSize} overflow-y-auto pb-32 no-scrollbar`} ref={scrollRef}>
        {/* History Log */}
        <div className={`flex flex-col items-start w-full ${lineSpacing}`}>
          {history.map((entry, index) => {
            const isOutput = entry.type === "output" || entry.type === "system";
            const EntryContent = (
              <div className={`${entry.type === "input" ? "mt-4" : ""} break-all flex items-start w-full`}>
                {entry.type === "input" && (
                  <div className={`mr-2 flex items-center shrink-0 ${lineHeight}`}>
                    <span className="bg-white text-black px-2 font-bold">
                      {promptLabel} <span className="font-normal opacity-75">{entry.location || "~"}</span>
                    </span>
                    <div className={`w-0 ${lineHeight} border-t-transparent border-l-white border-b-transparent ${borderValues}`}></div>
                  </div>
                )}
                <span className={entry.type === "system" ? "opacity-70" : ""}>{entry.content}</span>
              </div>
            );

            return isOutput ? (
              <FadeTransition
                key={entry.id}
                direction="in"
                duration={900}
                delay={0}
                display="block"
              >
                {EntryContent}
              </FadeTransition>
            ) : (
              <div key={entry.id}>{EntryContent}</div>
            );
          })}
        </div>

        {/* Input Line */}
        <form onSubmit={handleCommand} className="flex items-start mt-4 w-full">
          <FadeTransition key={inputKey} direction="in" display="flex" className="w-full items-start">
            <div className={`mr-2 flex items-center shrink-0 ${lineHeight} animate-pulse-slow`}>
              <span className="bg-white text-black px-2 font-bold">
                {promptLabel} <span className="font-normal opacity-75">{location}</span>
              </span>
              <div className={`w-0 ${lineHeight} border-t-transparent border-l-white border-b-transparent ${borderValues}`}></div>
            </div>
            <div className={`relative grow ${lineHeight} flex items-center`}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onSelect={handleSelect}
                onKeyUp={handleSelect}
                onClick={handleSelect}
                className="w-full bg-transparent border-none outline-none text-transparent font-mono caret-transparent absolute inset-0 z-10"
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />
              {/* Rendered Text with Custom Cursor */}
              <div className={`font-mono whitespace-pre relative pointer-events-none text-gray-300 leading-6 ${lineHeight}`}>
                {input}
                <div
                  className={`absolute top-0 bg-gray-300 ${lineHeight} w-[1ch] animate-pulse mix-blend-difference transition-all duration-100 ease-out`}
                  style={{ left: `${cursorPos}ch` }}
                />
              </div>
            </div>
          </FadeTransition>
        </form>
      </div>
      <style jsx global>{`
        @keyframes flicker {
          0% { opacity: 0.08; }
          5% { opacity: 0.12; }
          10% { opacity: 0.08; }
          15% { opacity: 0.15; }
          20% { opacity: 0.08; }
          100% { opacity: 0.08; }
        }
        .animate-flicker {
          animation: flicker 0.15s infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out forwards;
        }
      `}</style>
    </div >
  );
});

Terminal.displayName = "Terminal";

export default Terminal;
