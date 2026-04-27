'use client';

import { useState } from 'react';

type AvatarProps = {
  src?: string | null;
  username?: string | null;
  alt?: string;
  size?: number;
  className?: string;
};

/**
 * Reusable avatar component.
 * - Shows the image when `src` is provided AND loads successfully.
 * - Falls back to a colored circle with the first letter of `username` (or `?`)
 *   when there is no src OR the image fails to load.
 * Avoids relying on a missing `/default-avatar.png` asset.
 */
export default function Avatar({
  src,
  username,
  alt,
  size = 32,
  className = '',
}: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const initial = (username?.trim()?.charAt(0) ?? '?').toUpperCase();
  const showImage = !!src && !errored;

  // Pick a deterministic gradient based on username for visual variety
  const palette = [
    'from-[#0097FC] to-[#00165F]',
    'from-[#FD2E5F] to-[#7B1340]',
    'from-emerald-500 to-emerald-800',
    'from-amber-500 to-orange-700',
    'from-violet-500 to-purple-800',
    'from-cyan-500 to-blue-800',
  ];
  let hash = 0;
  for (const ch of username ?? '') hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const gradient = palette[Math.abs(hash) % palette.length];

  const dimension = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.42)) };

  if (showImage) {
    return (
      <img
        src={src!}
        alt={alt ?? username ?? 'avatar'}
        style={dimension}
        onError={() => setErrored(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={dimension}
      aria-label={alt ?? username ?? 'avatar'}
      className={`rounded-full shrink-0 flex items-center justify-center font-bold text-white bg-gradient-to-br ${gradient} ${className}`}
    >
      {initial}
    </div>
  );
}
