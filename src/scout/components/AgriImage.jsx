import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * Agricultural image with graceful fallback — never a broken icon.
 * src is null until curated photos land under public/agriculture/;
 * if a path ever 404s, the same clean placeholder renders instead.
 * Styling matches Geo-Farm cards (rounded, object-cover, compact).
 */
export default function AgriImage({ src, alt, label = 'Field image not available', className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`bg-gray-50 border border-gov-border flex flex-col items-center justify-center gap-1.5 p-3 text-center ${className}`}>
        <ImageOff size={20} className="text-gray-300 shrink-0" />
        <span className="text-[11px] text-gray-400 font-medium leading-tight">{label}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Field photo'}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
