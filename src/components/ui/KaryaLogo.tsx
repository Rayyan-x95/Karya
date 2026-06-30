import React from 'react';

interface KaryaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const KaryaLogo: React.FC<KaryaLogoProps> = ({
  className = '',
  size = 32,
  showText = false,
}) => {
  if (showText) {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        {/* Stylized K Mark */}
        <svg
          width={size * 1.5}
          height={size * 1.5}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105"
        >
          {/* Left Vertical Pillar */}
          <rect x="30" y="15" width="12" height="50" rx="6" fill="currentColor" className="text-foreground/90" />
          {/* Top-Right Accent Arm */}
          <path
            d="M42 42.5L76 15H56L42 27V42.5Z"
            fill="url(#karya-logo-blue-gradient)"
          />
          {/* Bottom-Right Arm */}
          <path
            d="M45.5 35L76 65H58L42 48V37L45.5 35Z"
            fill="currentColor"
            className="text-foreground/90"
          />
          <defs>
            <linearGradient id="karya-logo-blue-gradient" x1="42" y1="15" x2="76" y2="42.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Brand Text */}
        <div className="mt-4 space-y-1">
          <h1 className="font-display font-light text-2xl tracking-[0.4em] text-foreground m-0 translate-x-[0.2em]">
            K<span className="font-semibold text-primary">Λ</span>RY<span className="font-semibold text-primary">Λ</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-medium m-0">
            Proposals • Contracts • Invoices • Payments
          </p>
        </div>
      </div>
    );
  }

  // Icon only mode
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Left Vertical Pillar */}
      <rect x="30" y="15" width="12" height="50" rx="6" fill="currentColor" className="text-foreground/90" />
      {/* Top-Right Accent Arm */}
      <path
        d="M42 42.5L76 15H56L42 27V42.5Z"
        fill="url(#karya-logo-blue-gradient-icon)"
      />
      {/* Bottom-Right Arm */}
      <path
        d="M45.5 35L76 65H58L42 48V37L45.5 35Z"
        fill="currentColor"
        className="text-foreground/90"
      />
      <defs>
        <linearGradient id="karya-logo-blue-gradient-icon" x1="42" y1="15" x2="76" y2="42.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default KaryaLogo;
