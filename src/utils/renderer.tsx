import markdownit from 'markdown-it';

import markdownitKatex from '@vscode/markdown-it-katex';
import markdownitHightlight from 'markdown-it-highlightjs';
// @ts-ignore-next-line
import markdownItTextualUml from 'markdown-it-textual-uml';

const md = markdownit({
  html: true,
  linkify: true,
});

md.use(markdownitKatex);
md.use(markdownitHightlight);
md.use(markdownItTextualUml);

export function renderMarkdown(content: string): string {
  return md.render(content);
}