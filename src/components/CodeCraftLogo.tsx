import React from 'react';

interface CodeCraftLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only';
}

export const CodeCraftLogo: React.FC<CodeCraftLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  variant = 'full'
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', textMain: 'text-xs', textSub: 'text-[8px]' },
    md: { icon: 'w-9 h-9 sm:w-10 sm:h-10', textMain: 'text-sm sm:text-base', textSub: 'text-[9px]' },
    lg: { icon: 'w-12 h-12', textMain: 'text-lg', textSub: 'text-[10px]' },
    xl: { icon: 'w-16 h-16', textMain: 'text-2xl', textSub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* CodeCraft Technologies Symbol Icon */}
      <div className={`relative shrink-0 ${currentSize.icon} rounded-full overflow-hidden shadow-lg shadow-cyan-950/40 ring-1 ring-slate-800`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Background Glow Gradient */}
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0B1528" />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>

            {/* Cyan Left Gradient */}
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#0066FF" />
            </linearGradient>

            {/* Orange Right Gradient */}
            <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9900" />
              <stop offset="100%" stopColor="#FF3300" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Dark Tech Base Circle */}
          <rect width="200" height="200" rx="100" fill="url(#bgGlow)" />
          
          {/* Subtle Tech Grid Lines */}
          <circle cx="100" cy="100" r="88" stroke="#1E293B" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          <circle cx="100" cy="100" r="70" stroke="#0F172A" strokeWidth="2" opacity="0.8" />

          {/* Left Cyan Chevron Bracket (<) */}
          <path
            d="M 68 100 L 98 62 L 90 52 L 48 100 L 90 148 L 98 138 Z"
            fill="url(#cyanGrad)"
            filter="url(#neonGlow)"
          />

          {/* Central Left Arc (Cyan) */}
          <path
            d="M 100 42 A 58 58 0 0 0 100 158"
            stroke="url(#cyanGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            filter="url(#neonGlow)"
          />

          {/* Central Right Arc (Orange) */}
          <path
            d="M 100 42 A 58 58 0 0 1 100 158"
            stroke="url(#orangeGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            filter="url(#neonGlow)"
          />

          {/* Right Orange Circuit Traces & Nodes */}
          <path
            d="M 100 78 L 132 78 L 144 90 L 158 90"
            stroke="url(#orangeGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="160" cy="90" r="6" fill="#FF9900" filter="url(#neonGlow)" />

          <path
            d="M 100 122 L 130 122 L 142 110 L 152 110"
            stroke="url(#orangeGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="154" cy="110" r="5" fill="#FF3300" filter="url(#neonGlow)" />

          <path
            d="M 100 100 L 126 100"
            stroke="url(#orangeGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="132" cy="100" r="5.5" fill="#FF9900" />

          {/* Light flare particles */}
          <circle cx="48" cy="100" r="3" fill="#00F0FF" />
          <circle cx="152" cy="62" r="2.5" fill="#FF9900" />
          <circle cx="148" cy="138" r="2.5" fill="#FF3300" />
        </svg>
      </div>

      {/* Brand Typography (CodeCraft Technologies) */}
      {(showText && variant === 'full') && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`font-display font-black tracking-tight ${currentSize.textMain} flex items-center`}>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Code
            </span>
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Craft
            </span>
          </div>
          <span className={`font-sans font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-400 mt-0.5 ${currentSize.textSub}`}>
            Technologies
          </span>
        </div>
      )}
    </div>
  );
};

export default CodeCraftLogo;
