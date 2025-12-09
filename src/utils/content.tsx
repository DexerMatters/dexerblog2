"use client";

import { renderMarkdown } from "./renderer";

interface ContentProps {
  isLoading: boolean;
  content?: string;
  className?: string;
}

export default function Content({ isLoading, content, className = "" }: ContentProps) {
  return (
    <div className={className}>
      {isLoading ? (
        "Loading..."
      ) : (
        <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(content || "") }} />
      )}
    </div>
  );
}
