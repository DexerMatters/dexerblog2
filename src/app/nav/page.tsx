"use client";

import Terminal, { LogEntry, TerminalHandle } from "@/components/terminal";
import List from "@/components/list";
import FloatingContainer from "@/components/floating";
import MoveTransition from "@/components/move-transition";
import ContentTransition from "@/components/content-transition";
import Content from "@/utils/content";
import { handleCommand, setTerminalHandle, setLocationChangeHandler, setFileViewHandler } from "@/utils/commands";
import { DocItem, useDocList, useDocContent } from "@/utils/github-hookers";
import { useRef, useEffect, useState } from "react";
import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";
import "../markdown.css";

export default function Nav() {
  const initialHistory: LogEntry[] = [
    { id: 1, type: "system", content: "Welcome to Dexer's Terminal Interface." }
  ];

  const terminalRef = useRef<TerminalHandle>(null);
  const [listItems, setListItems] = useState<DocItem[]>([]);
  const [currentLocation, setCurrentLocation] = useState("~");
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  const getGitHubPath = (path: string) => {
    if (path === "~") return "";
    return path.replace(/^~\//, "");
  };

  const { data: docList, isLoading: isLoadingDocs } = useDocList(getGitHubPath(currentLocation));

  const isPdf = viewingFile?.toLowerCase().endsWith(".pdf");
  const githubPath = viewingFile ? getGitHubPath(viewingFile) : "";

  const { data: fetchedContent, isLoading: isLoadingContent } = useDocContent(
    !isPdf && viewingFile ? githubPath : ""
  );

  const fileContent = isPdf
    ? `https://raw.githubusercontent.com/DexerMatters/dexerblog-docs/refs/heads/main/${githubPath}`
    : fetchedContent;

  const isLoadingFile = isPdf ? false : isLoadingContent;

  useEffect(() => {
    if (terminalRef.current) {
      setTerminalHandle(terminalRef.current);
    }
    setLocationChangeHandler(setCurrentLocation);
    setFileViewHandler(setViewingFile);
  }, []);

  const onItemClick = (item: DocItem, rect?: DOMRect) => {
    if (rect) {
      // Copy DOMRect properties to a plain object to ensure they persist
      setOriginRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
        x: rect.x,
        y: rect.y,
        toJSON: () => { }
      } as DOMRect);
    }
    const path = `./${item.name}`;
    const safePath = path.includes(" ") ? `"${path}"` : path;
    if (item.type === "dir") {
      terminalRef.current?.sendCommand(`cd ${safePath}`);
    } else {
      terminalRef.current?.sendCommand(`cat ${safePath}`);
    }
  }

  const handleBackClick = () => {
    if (viewingFile) {
      terminalRef.current?.sendCommand("cd .");
    } else {
      terminalRef.current?.sendCommand("cd ..");
    }
  }

  // Update list when currentLocation changes and docList is loaded
  useEffect(() => {
    if (docList && docList.length > 0) {
      // Filter to show only directories, markdown and pdf files
      const items = docList
        .filter(item => item.type === "dir" || item.name.endsWith(".md") || item.name.endsWith(".pdf"))

      setListItems(items);
    } else {
      setListItems([]);
    }
  }, [docList]);

  return (
    <div className="flex h-screen bg-black">
      <Terminal
        ref={terminalRef}
        initialHistory={initialHistory}
        fontSize="text-sm"
        lineSpacing="mt-0"
        location={currentLocation}
        onCommand={handleCommand}
        style={{ width: '25%' }}
      />

      <div
        className="bg-black text-gray-300 font-mono"
        style={{
          width: '75%',
          visibility: 'visible',
          height: '100vh',
          overflow: 'visible',
          transformStyle: 'preserve-3d'
        }}
      >
        <MoveTransition
          direction="in-down"
          duration={600}
          distance={200}
          className="h-full w-full"
          display="block"
        >
          <div
            className="h-full p-8"
            style={{
              overflow: 'visible',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="flex flex-col gap-4 items-start" style={{ pointerEvents: 'auto', transformStyle: 'preserve-3d' }}>
              {(currentLocation !== "~" || viewingFile) && (
                <FloatingContainer>
                  <MoveTransition
                    direction="in-up"
                    duration={300}
                    delay={0}
                    display="block"
                  >
                    <button
                      onClick={handleBackClick}
                      className="group flex outline-none drop-shadow-lg"
                      style={{ cursor: 'pointer', padding: 0, margin: 0 }}
                    >
                      <span className="bg-white text-black text-sm font-mono px-3 py-1 group-hover:bg-gray-200 transition-colors">
                        {viewingFile
                          ? `${viewingFile.split("/").pop()}/..`
                          : `../${currentLocation.split("/").filter(Boolean).pop() || ""}`
                        }
                      </span>
                      <div className="border-t-18 border-b-18 border-l-14 border-t-transparent border-b-transparent border-l-white group-hover:border-l-gray-200 transition-colors" style={{ margin: '-1px 0 0 -1px', padding: 0, display: 'block' }}></div>
                    </button>
                  </MoveTransition>
                </FloatingContainer>
              )}
              {viewingFile ? (
                <ContentTransition
                  originRect={originRect}
                  duration={800}
                  style={{ scrollbarColor: 'white black', scrollbarWidth: 'thin' }}
                  className="bg-white text-black py-6 pl-12 pr-8 font-mono text-sm shadow-lg w-full max-w-3xl overflow-auto h-[80vh]"
                >
                  <Content
                    isLoading={isLoadingFile}
                    content={fileContent}
                    type={isPdf ? "pdf" : "md"}
                  />
                </ContentTransition>
              ) : (
                <List items={listItems} onItemClick={onItemClick as (item: any, rect: DOMRect) => void} />
              )}
            </div>
          </div>
        </MoveTransition>
      </div>
    </div>
  );
}
