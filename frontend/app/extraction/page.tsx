import { Suspense } from 'react';
import { ExtractionContent } from './ExtractionContent';

function LoadingFallback() {
  return (
    <main className="flex flex-col w-full min-h-screen bg-[#0A0A0A] pt-[60px]">
      <div className="flex items-center justify-center flex-1">
        <p className="font-ibm-mono text-[12px] text-[#FFD600]">LOADING...</p>
      </div>
    </main>
  );
}

export default function ExtractionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExtractionContent />
    </Suspense>
  );
}
