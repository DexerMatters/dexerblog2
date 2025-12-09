"use client";

import { renderMarkdown } from "./renderer";
import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";
import FloatingContainer from "@/components/floating";
import MoveTransition from "@/components/move-transition";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface ContentProps {
  isLoading: boolean;
  content?: string;
  className?: string;
  type?: "md" | "pdf";
}

export default function Content({ isLoading, content, className = "", type = "md" }: ContentProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const isPdf = type === "pdf";

  if (isLoading) {
    return <div className={className}>Loading...</div>;
  }

  if (isPdf && content) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center w-full">
          <Document file={content} onLoadSuccess={onDocumentLoadSuccess} className="mb-8">
            <Page
              pageNumber={pageNumber}
              className="shadow-lg"
              width={600}
            />
          </Document>

          <div className="flex gap-8 items-center pb-8">
            {/* Prev Button */}
            <FloatingContainer>
              <MoveTransition direction="in-up" duration={300} display="block">
                <button
                  onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                  disabled={pageNumber <= 1}
                  className="group flex outline-none drop-shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ cursor: 'pointer', padding: 0, margin: 0 }}
                >
                  <div className="border-t-18 border-b-18 border-r-14 border-t-transparent border-b-transparent border-r-white group-hover:border-r-gray-200 transition-colors" style={{ margin: '-1px -1px 0 0', padding: 0, display: 'block' }}></div>
                  <span className="bg-white text-black text-sm font-mono px-3 py-1 group-hover:bg-gray-200 transition-colors">
                    Prev
                  </span>
                </button>
              </MoveTransition>
            </FloatingContainer>

            <span className="font-mono text-black bg-white px-2 py-1 shadow-sm">
              {pageNumber} / {numPages || "--"}
            </span>

            {/* Next Button */}
            <FloatingContainer>
              <MoveTransition direction="in-up" duration={300} display="block">
                <button
                  onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                  disabled={pageNumber >= numPages}
                  className="group flex outline-none drop-shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ cursor: 'pointer', padding: 0, margin: 0 }}
                >
                  <span className="bg-white text-black text-sm font-mono px-3 py-1 group-hover:bg-gray-200 transition-colors">
                    Next
                  </span>
                  <div className="border-t-18 border-b-18 border-l-14 border-t-transparent border-b-transparent border-l-white group-hover:border-l-gray-200 transition-colors" style={{ margin: '-1px 0 0 -1px', padding: 0, display: 'block' }}></div>
                </button>
              </MoveTransition>
            </FloatingContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(content || "") }} />
    </div>
  );
}
