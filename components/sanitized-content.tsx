"use client";

import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const SanitizedContent = ({ htmlString, className }: { htmlString: string; className?: string }) => {
  const sanitizedHTML = useMemo(() => DOMPurify.sanitize(htmlString), [htmlString]);

  return (
    <div 
      className={cn("text-sm leading-relaxed max-w-full overflow-hidden", className)}
      style={{ fontSize: '14px', wordBreak: 'break-word' }}
    >
      <style>{`
        .sanitized-content img {
          max-width: 100%;
          height: auto;
          object-fit: contain;
        }
      `}</style>
      <div className="sanitized-content" dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
    </div>
  );
};

export default SanitizedContent;