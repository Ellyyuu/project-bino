import React from 'react';

/**
 * Custom Chubby Dino Mascot SVG Component
 * Morphing dynamic vector based on student status
 * Palette:
 *  - Slate-Teal: #49676C
 *  - Sage-Green: #88A4A7
 *  - Deep Navy: #3B5570
 *  - Deep Plum: #7A3A65
 *  - Soft Lavender: #8F84AE
 */
export default function DinoMascot({
  variant = 'active',
  size = 36,
  className = '',
}) {
  const configs = {
    active: {
      fill: '#88A4A7',
      belly: '#A8C3C6',
      spikes: '#3B5570',
      cheek: '#E79DB0',
      stroke: '#27383B',
      opacity: 1,
    },
    idle: {
      fill: '#8F84AE',
      belly: '#B4ABCB',
      spikes: '#3B5570',
      cheek: '#C8819C',
      stroke: '#362E4F',
      opacity: 1,
    },
    unfocused: {
      fill: '#7A3A65',
      belly: '#9A4F82',
      spikes: '#3B5570',
      cheek: '#E79DB0',
      stroke: '#3E1934',
      opacity: 1,
    },
    disconnected: {
      fill: '#49676C',
      belly: '#5E7F85',
      spikes: '#2D3E4F',
      cheek: 'transparent',
      stroke: '#1E2C2E',
      opacity: 0.65,
    },
  };

  const current = configs[variant] || configs.active;

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      title={`Bino Dino (${variant})`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
        style={{ opacity: current.opacity }}
      >
        <defs>
          <filter id={`dino-shadow-${variant}`} x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Back Head Spikes (Deep Navy #3B5570) */}
        <g fill={current.spikes}>
          <path d="M 28 22 C 28 14, 34 13, 38 21 Z" />
          <path d="M 19 35 C 17 26, 25 25, 29 34 Z" />
          <path d="M 15 50 C 11 41, 19 40, 24 49 Z" />
          <path d="M 17 64 C 11 57, 19 56, 23 63 Z" />
        </g>

        {/* Chubby Dinosaur Head & Snout */}
        <path
          d="M 26 50 
             C 24 28, 42 18, 62 18 
             C 80 18, 92 30, 92 44 
             C 92 56, 85 64, 84 68 
             C 82 76, 75 84, 62 84 
             C 45 84, 42 78, 38 78 
             C 32 78, 28 70, 26 50 Z"
          fill={current.fill}
          filter={`url(#dino-shadow-${variant})`}
        />

        {/* Snout / Chubby Jaw Accent */}
        <path
          d="M 60 48
             C 74 48, 88 52, 88 64
             C 88 74, 76 82, 60 82
             C 48 82, 44 76, 44 70
             C 44 58, 50 48, 60 48 Z"
          fill={current.belly}
          opacity="0.55"
        />

        {/* Cute Nostrils */}
        <circle cx="80" cy="50" r="2" fill={current.stroke} opacity="0.6" />
        <circle cx="85" cy="50" r="1.8" fill={current.stroke} opacity="0.6" />

        {/* Cheeks (Blush) */}
        {variant !== 'disconnected' && (
          <ellipse cx="64" cy="62" rx="6" ry="3.5" fill={current.cheek} opacity="0.75" />
        )}

        {/* --- Variant 1: Active (Smiling arc eyes, alert posture) --- */}
        {variant === 'active' && (
          <g>
            <path
              d="M 50 40 Q 56 32 62 40"
              stroke={current.stroke}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 68 40 Q 74 32 80 40"
              stroke={current.stroke}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Cheerful happy mouth */}
            <path
              d="M 64 66 Q 73 74 80 66"
              stroke={current.stroke}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            {/* Alert sparkle */}
            <path
              d="M 88 28 L 90 22 L 92 28 L 98 30 L 92 32 L 90 38 L 88 32 L 82 30 Z"
              fill="#FFFFFF"
              opacity="0.9"
            />
          </g>
        )}

        {/* --- Variant 2: Idle (Horizontal flat resting eyes, mini "Zzz") --- */}
        {variant === 'idle' && (
          <g>
            <line
              x1="50"
              y1="40"
              x2="62"
              y2="40"
              stroke={current.stroke}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1="68"
              y1="40"
              x2="80"
              y2="40"
              stroke={current.stroke}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Peaceful gentle resting mouth */}
            <path
              d="M 68 66 Q 74 69 78 66"
              stroke={current.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Floating mini "Zzz" accents */}
            <g fill="#FFFFFF" opacity="0.95" fontFamily="Inter, sans-serif" fontWeight="bold">
              <text x="80" y="26" fontSize="13" className="animate-pulse">Z</text>
              <text x="88" y="18" fontSize="10" className="animate-pulse" style={{ animationDelay: '150ms' }}>z</text>
              <text x="94" y="11" fontSize="7" className="animate-pulse" style={{ animationDelay: '300ms' }}>z</text>
            </g>
          </g>
        )}

        {/* --- Variant 3: Unfocused (Eyes shifted sideways / looking away) --- */}
        {variant === 'unfocused' && (
          <g>
            {/* Eye whites */}
            <ellipse cx="56" cy="40" rx="7" ry="8" fill="#FFFFFF" />
            <ellipse cx="74" cy="40" rx="7" ry="8" fill="#FFFFFF" />
            {/* Pupils shifted far left looking away */}
            <circle cx="52" cy="40" r="4.2" fill={current.stroke} />
            <circle cx="70" cy="40" r="4.2" fill={current.stroke} />
            <circle cx="50" cy="38" r="1.5" fill="#FFFFFF" />
            <circle cx="68" cy="38" r="1.5" fill="#FFFFFF" />
            {/* Curious wandering mouth */}
            <path
              d="M 66 66 Q 72 63 78 68"
              stroke={current.stroke}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            {/* Questioning raised brows */}
            <path
              d="M 50 30 Q 56 26 62 29"
              stroke={current.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 70 29 Q 76 25 82 28"
              stroke={current.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {/* --- Variant 4: Disconnected (Slate-Teal muted silhouette, lowered opacity) --- */}
        {variant === 'disconnected' && (
          <g opacity="0.8">
            <path
              d="M 52 36 L 60 44 M 60 36 L 52 44"
              stroke="#D8E2E3"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 70 36 L 78 44 M 78 36 L 70 44"
              stroke="#D8E2E3"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Flat neutral mouth */}
            <line
              x1="67"
              y1="66"
              x2="77"
              y2="66"
              stroke="#D8E2E3"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Disconnected signal slash */}
            <g transform="translate(74, 14) scale(0.7)">
              <circle cx="12" cy="12" r="11" fill="#3B5570" opacity="0.9" />
              <line x1="6" y1="6" x2="18" y2="18" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

