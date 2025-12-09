"use client";;
import Content from '@/utils/content';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function TestPage() {
  const testItems = [
    "React component rendering",
    "Fade transition animations",
    "Floating container effects",
    "Monospace font styling",
    "White background items",
    "Staggered animation timing",
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-white text-3xl font-mono mb-8">List Component Test</h1>
        <p className="text-gray-400 font-mono mb-12">
          Testing the List component with fade transitions and floating effects:
        </p>
        <Content type='pdf' isLoading={false} content={`/api/proxy-pdf?url=${encodeURIComponent('https://dl.acm.org/doi/pdf/10.1145/3674648')}`} />
      </div>
    </div>
  );
}
