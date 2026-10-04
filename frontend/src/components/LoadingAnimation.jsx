import React, { useState, useEffect } from 'react';

const LABELS = ["Thinking", "Analysing", "Reasoning", "Writing"];

function LoadingAnimation() {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLabelIndex((prev) => (prev + 1) % LABELS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='flex items-center gap-3'>
      <div className='w-8 h-8 rounded-full bg-clay text-canvas grid place-items-center font-display text-base shrink-0'>M</div>
      <div className='flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-surface'>
        <span className='flex gap-1'>
          {[0, 0.15, 0.3].map((delay) => (
            <span
              key={delay}
              className='w-1.5 h-1.5 rounded-full bg-clay'
              style={{ animation: `mm-dot 1.2s ${delay}s infinite ease-in-out` }}
            />
          ))}
        </span>
        <span className='text-[13px] font-semibold text-sand-800'>{LABELS[labelIndex]}…</span>
      </div>
    </div>
  );
}

export default LoadingAnimation;
